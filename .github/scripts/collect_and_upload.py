#!/usr/bin/env python3
"""
Vending Data Collector for GitHub Actions
- targets.json 기반 로테이션 수집
- 순차 startPage 로테이션 (state 파일 기반)
- 429 발생 시 해당 target만 스킵
"""
import os
import sys
import json
import time
import random
import argparse
import datetime
import requests
from bs4 import BeautifulSoup
from pathlib import Path

# 공홈 URL 패턴
GNJOY_BASE_URL = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"

# 서버 ID 매핑
SERVER_IDS = {
    "baphomet": "129",
    "yggdrasil": "130",
    "ifrit": "131"
}

# 상태 파일 경로 (GitHub Actions cache로 유지)
STATE_FILE = Path(__file__).parent / ".collector_state.json"

# startPage 순환 설정
PAGE_STEP = 3  # 3페이지씩 이동
MAX_START_PAGE = 15  # startPage 최대값 (이후 1로 리셋)


def load_state():
    """상태 파일 로드"""
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {"targets": {}}


def save_state(state):
    """상태 파일 저장"""
    try:
        with open(STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[State] Save error: {e}")


def get_next_start_page(state, target_key):
    """
    순차 startPage 반환 (1 → 4 → 7 → 10 → 13 → 1 ...)
    """
    targets_state = state.get("targets", {})
    current = targets_state.get(target_key, {}).get("startPage", 1)
    
    # 다음 startPage 계산
    next_page = current + PAGE_STEP
    if next_page > MAX_START_PAGE:
        next_page = 1
    
    # 상태 업데이트
    if target_key not in targets_state:
        targets_state[target_key] = {}
    targets_state[target_key]["startPage"] = next_page
    targets_state[target_key]["lastRun"] = datetime.datetime.now().isoformat()
    state["targets"] = targets_state
    
    return current  # 현재 값 반환 (다음 run에서 next_page 사용)


def load_targets():
    """targets.json 로드"""
    script_dir = Path(__file__).parent
    targets_path = script_dir / "targets.json"
    
    if targets_path.exists():
        with open(targets_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    return [{"server": "baphomet", "keyword": "천공"}]


def get_rotation_targets(targets, count=3):
    """
    시간 기반 deterministic 로테이션
    """
    now = datetime.datetime.now()
    time_slot = (now.hour * 6) + (now.minute // 10)
    start_idx = (time_slot * count) % len(targets)
    
    selected = []
    for i in range(count):
        idx = (start_idx + i) % len(targets)
        selected.append(targets[idx])
    
    return selected, time_slot


def parse_vending_page(html_content, server):
    """공홈 HTML에서 노점 데이터 파싱"""
    soup = BeautifulSoup(html_content, 'html.parser')
    items = []
    
    table = soup.select_one('table.listTypeOfDefault.dealList')
    if not table:
        return items
    
    rows = table.select('tr')[1:]
    
    for row in rows:
        cols = row.select('td')
        if len(cols) < 5:
            continue
        
        try:
            item_elem = cols[1].select_one('a')
            if not item_elem:
                continue
            
            onclick = item_elem.get('onclick', '')
            ssi = ""
            map_id = ""
            if 'popup_info' in onclick:
                parts = onclick.split("'")
                if len(parts) >= 4:
                    ssi = parts[1]
                    map_id = parts[3]
            
            img = cols[1].select_one('img')
            if img and img.get('alt'):
                item_name = img['alt']
            else:
                item_name = cols[1].get_text(strip=True)
            
            qty_text = cols[2].get_text(strip=True).replace(',', '')
            quantity = int(qty_text) if qty_text.isdigit() else 1
            
            price_text = cols[3].get_text(strip=True).replace(',', '').replace('z', '')
            price = int(price_text) if price_text.isdigit() else 0
            
            vendor_info_elem = cols[4].select_one('a')
            vendor_info = vendor_info_elem.get_text(strip=True) if vendor_info_elem else ""
            
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
            
        except Exception as e:
            print(f"[Parser] Error: {e}")
            continue
    
    return items


def fetch_page(server, keyword, page):
    """공홈에서 페이지 데이터 수집"""
    server_id = SERVER_IDS.get(server, "129")
    
    params = {
        "svrID": server_id,
        "itemFullName": keyword,
        "curpage": str(page)
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9"
    }
    
    try:
        resp = requests.get(GNJOY_BASE_URL, params=params, headers=headers, timeout=15)
        
        if resp.status_code == 429:
            print(f"[Fetch] 429 Rate Limited on page {page}")
            return None, "429"
        
        if resp.status_code != 200:
            print(f"[Fetch] HTTP {resp.status_code} on page {page}")
            return None, f"{resp.status_code}"
        
        return resp.text, None
        
    except requests.exceptions.RequestException as e:
        print(f"[Fetch] Network error: {e}")
        return None, "network_error"


def upload_to_server(items, server, upload_url, upload_key):
    """Render 백엔드로 데이터 업로드"""
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
        else:
            return 0, f"HTTP {resp.status_code}: {resp.text[:200]}"
            
    except Exception as e:
        return 0, str(e)


def collect_and_upload(server, keyword, start_page, max_pages, upload_url, upload_key):
    """수집 + 업로드. 반환: (saved_count, is_429)"""
    end_page = start_page + max_pages - 1
    print(f"[Collector] {server}|{keyword} pages {start_page}~{end_page}")
    
    all_items = []
    hit_429 = False
    
    for page in range(start_page, end_page + 1):
        print(f"[Collector] Fetching page {page}...")
        
        html, error = fetch_page(server, keyword, page)
        
        if error == "429":
            print(f"[Collector] 429 on {server}|{keyword}, skipping this target")
            hit_429 = True
            break
        
        if error:
            print(f"[Collector] Error: {error}")
            break
        
        items = parse_vending_page(html, server)
        print(f"[Collector] Page {page}: {len(items)} items")
        
        if not items:
            break
        
        all_items.extend(items)
        
        if page < end_page:
            delay = 3 + random.random() * 3
            time.sleep(delay)
    
    if not all_items:
        return 0, hit_429
    
    saved, error = upload_to_server(all_items, server, upload_url, upload_key)
    
    if error:
        print(f"[Collector] Upload error: {error}")
        return 0, hit_429
    
    print(f"[Collector] Uploaded: {saved} items")
    return saved, hit_429


def main():
    parser = argparse.ArgumentParser(description='Vending Data Collector')
    parser.add_argument('--server', default='', help='Server name (empty = use targets.json)')
    parser.add_argument('--keyword', default='', help='Search keyword (empty = use targets.json)')
    parser.add_argument('--pages', type=int, default=3, help='Max pages per target')
    parser.add_argument('--targets-count', type=int, default=3, help='Number of targets per run')
    args = parser.parse_args()
    
    upload_url = os.environ.get('UPLOAD_URL', 'https://rano.onrender.com/api/vending/upload')
    upload_key = os.environ.get('UPLOAD_KEY', '')
    
    if not upload_key:
        print("[ERROR] UPLOAD_KEY required")
        sys.exit(1)
    
    # 상태 로드
    state = load_state()
    print(f"[State] Loaded: {len(state.get('targets', {}))} targets tracked")
    
    total_saved = 0
    consecutive_429 = 0
    
    if args.keyword:
        # 단일 키워드 수집
        target_key = f"{args.server or 'baphomet'}|{args.keyword}"
        start_page = get_next_start_page(state, target_key)
        saved, hit_429 = collect_and_upload(args.server or 'baphomet', args.keyword, start_page, args.pages, upload_url, upload_key)
        total_saved = saved
    else:
        # targets.json 기반 로테이션 수집
        all_targets = load_targets()
        selected, time_slot = get_rotation_targets(all_targets, args.targets_count)
        
        print(f"[Collector] Time slot: {time_slot}, Targets: {len(selected)}")
        
        for target in selected:
            server = target.get("server", "baphomet")
            keyword = target.get("keyword", "천공")
            target_key = f"{server}|{keyword}"
            
            # 순차 startPage
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
                consecutive_429 = 0  # 리셋
            
            # 타겟 간 딜레이
            time.sleep(2)
    
    # 상태 저장
    save_state(state)
    print(f"[State] Saved: {len(state.get('targets', {}))} targets tracked")
    
    print(f"[Collector] Total saved: {total_saved}")
    sys.exit(0)


if __name__ == "__main__":
    main()
