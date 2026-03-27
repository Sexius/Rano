#!/usr/bin/env python3
"""
Vending data collector for GitHub Actions.

- Rotates targets from targets.json
- Rotates start pages using a cached state file
- Distinguishes 403/429/parse/network failures in logs
"""
import argparse
import datetime
import json
import os
import random
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

GNJOY_BASE_URL = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"
STATE_FILE = Path(__file__).parent / ".collector_state.json"
SERVER_ID_FILE = Path(__file__).resolve().parents[2] / "backend" / "src" / "main" / "resources" / "gnjoy-server-ids.json"
PAGE_STEP = 3
MAX_START_PAGE = 15


def load_server_ids():
    try:
        with open(SERVER_ID_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        print(f"[Config] Failed to load server IDs: {exc}")
        return {"baphomet": "129", "yggdrasil": "130", "ifrit": "131"}


SERVER_IDS = load_server_ids()


def load_state():
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"targets": {}}


def save_state(state):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
    except Exception as exc:
        print(f"[State] Save error: {exc}")


def get_next_start_page(state, target_key):
    targets_state = state.get("targets", {})
    current = targets_state.get(target_key, {}).get("startPage", 1)
    next_page = current + PAGE_STEP
    if next_page > MAX_START_PAGE:
        next_page = 1

    if target_key not in targets_state:
        targets_state[target_key] = {}
    targets_state[target_key]["startPage"] = next_page
    targets_state[target_key]["lastRun"] = datetime.datetime.now().isoformat()
    state["targets"] = targets_state
    return current


def load_targets():
    targets_path = Path(__file__).parent / "targets.json"
    if targets_path.exists():
        with open(targets_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return [{"server": "baphomet", "keyword": "천궁"}]


def get_rotation_targets(targets, count=3):
    now = datetime.datetime.now()
    time_slot = (now.hour * 6) + (now.minute // 10)
    start_idx = (time_slot * count) % len(targets)

    selected = []
    for i in range(count):
        idx = (start_idx + i) % len(targets)
        selected.append(targets[idx])
    return selected, time_slot


def parse_vending_page(html_content, server):
    soup = BeautifulSoup(html_content, "html.parser")
    items = []

    table = soup.select_one("table.listTypeOfDefault.dealList")
    if not table:
        print(f"[Parser] UPSTREAM_PARSE_ERROR missing dealList table server={server}")
        return items

    rows = table.select("tr")[1:]
    for row in rows:
        cols = row.select("td")
        if len(cols) < 5:
            continue

        try:
            item_elem = cols[1].select_one("a")
            if not item_elem:
                continue

            onclick = item_elem.get("onclick", "")
            ssi = ""
            map_id = ""
            if "CallItemDealView" in onclick:
                clean = onclick[onclick.find("(") + 1:onclick.rfind(")")]
                parts = [part.strip().replace("'", "") for part in clean.split(",")]
                if len(parts) >= 3:
                    map_id = parts[1]
                    ssi = parts[2]

            img = cols[1].select_one("img")
            item_name = img.get("alt") if img and img.get("alt") else cols[1].get_text(strip=True)

            qty_text = cols[2].get_text(strip=True).replace(",", "")
            quantity = int(qty_text) if qty_text.isdigit() else 1

            price_text = cols[3].get_text(strip=True).replace(",", "").replace("z", "")
            price = int(price_text) if price_text.isdigit() else 0

            vendor_info_elem = cols[4].select_one("a")
            vendor_info = vendor_info_elem.get_text(strip=True) if vendor_info_elem else cols[4].get_text(strip=True)

            items.append({
                "item_name": item_name,
                "price": price,
                "quantity": quantity,
                "vendor_info": vendor_info,
                "vendor_name": "",
                "ssi": ssi,
                "map_id": map_id,
                "server_name": server
            })
        except Exception as exc:
            print(f"[Parser] UPSTREAM_PARSE_ERROR row failure: {exc}")

    return items


def fetch_page(server, keyword, page):
    server_id = SERVER_IDS.get(server, SERVER_IDS.get("baphomet", "129"))
    params = {
        "svrID": server_id,
        "itemFullName": keyword,
        "curpage": str(page)
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
    }

    try:
        resp = requests.get(GNJOY_BASE_URL, params=params, headers=headers, timeout=15)
        if resp.status_code == 429:
            print(f"[Fetch] UPSTREAM_HTTP_429 page={page}")
            return None, "429"
        if resp.status_code == 403:
            print(f"[Fetch] UPSTREAM_HTTP_403 page={page}")
            return None, "403"
        if resp.status_code != 200:
            print(f"[Fetch] UPSTREAM_HTTP_{resp.status_code} page={page}")
            return None, str(resp.status_code)
        return resp.text, None
    except requests.exceptions.RequestException as exc:
        print(f"[Fetch] NETWORK_ERROR {exc}")
        return None, "network_error"


def upload_to_server(items, server, upload_url, upload_key):
    headers = {
        "Content-Type": "application/json",
        "X-API-KEY": upload_key
    }

    try:
        resp = requests.post(
            f"{upload_url}?server={server}",
            json=items,
            headers=headers,
            timeout=30
        )
        if resp.status_code == 200:
            result = resp.json()
            return result.get("savedCount", 0), None
        return 0, f"HTTP {resp.status_code}: {resp.text[:200]}"
    except Exception as exc:
        return 0, str(exc)


def collect_and_upload(server, keyword, start_page, max_pages, upload_url, upload_key):
    end_page = start_page + max_pages - 1
    print(f"[Collector] {server}|{keyword} pages {start_page}~{end_page}")

    all_items = []
    hit_429 = False

    for page in range(start_page, end_page + 1):
        print(f"[Collector] Fetching page {page}...")
        html, error = fetch_page(server, keyword, page)

        if error == "429":
            print(f"[Collector] UPSTREAM_HTTP_429 target={server}|{keyword}")
            hit_429 = True
            break
        if error == "403":
            print(f"[Collector] UPSTREAM_HTTP_403 target={server}|{keyword}")
            break
        if error:
            print(f"[Collector] FETCH_ERROR {error}")
            break

        items = parse_vending_page(html, server)
        print(f"[Collector] Page {page}: {len(items)} items")
        if not items:
            print(f"[Collector] PARSE_OR_EMPTY_RESULT server={server} keyword={keyword} page={page}")
            break

        all_items.extend(items)
        if page < end_page:
            time.sleep(3 + random.random() * 3)

    if not all_items:
        return 0, hit_429

    saved, error = upload_to_server(all_items, server, upload_url, upload_key)
    if error:
        print(f"[Collector] Upload error: {error}")
        return 0, hit_429

    print(f"[Collector] Uploaded: {saved} items")
    return saved, hit_429


def main():
    parser = argparse.ArgumentParser(description="Vending Data Collector")
    parser.add_argument("--server", default="", help="Server name (empty = use targets.json)")
    parser.add_argument("--keyword", default="", help="Search keyword (empty = use targets.json)")
    parser.add_argument("--pages", type=int, default=3, help="Max pages per target")
    parser.add_argument("--targets-count", type=int, default=3, help="Number of targets per run")
    args = parser.parse_args()

    upload_url = os.environ.get("UPLOAD_URL", "https://rano.onrender.com/api/vending/upload")
    upload_key = os.environ.get("UPLOAD_KEY", "")

    if not upload_key:
        print("[ERROR] UPLOAD_KEY required")
        sys.exit(1)

    state = load_state()
    print(f"[State] Loaded: {len(state.get('targets', {}))} targets tracked")

    total_saved = 0
    consecutive_429 = 0

    if args.keyword:
        target_key = f"{args.server or 'baphomet'}|{args.keyword}"
        start_page = get_next_start_page(state, target_key)
        saved, hit_429 = collect_and_upload(args.server or "baphomet", args.keyword, start_page, args.pages, upload_url, upload_key)
        total_saved = saved
    else:
        all_targets = load_targets()
        selected, time_slot = get_rotation_targets(all_targets, args.targets_count)
        print(f"[Collector] Time slot: {time_slot}, Targets: {len(selected)}")

        for target in selected:
            server = target.get("server", "baphomet")
            keyword = target.get("keyword", "천궁")
            target_key = f"{server}|{keyword}"
            start_page = get_next_start_page(state, target_key)

            saved, hit_429 = collect_and_upload(server, keyword, start_page, args.pages, upload_url, upload_key)
            total_saved += saved

            if hit_429:
                consecutive_429 += 1
                print(f"[Collector] 429 count: {consecutive_429}/3")
                if consecutive_429 >= 3:
                    print("[Collector] 3 consecutive 429s, stopping")
                    break
            else:
                consecutive_429 = 0

            time.sleep(2)

    save_state(state)
    print(f"[State] Saved: {len(state.get('targets', {}))} targets tracked")
    print(f"[Collector] Total saved: {total_saved}")
    sys.exit(0)


if __name__ == "__main__":
    main()
