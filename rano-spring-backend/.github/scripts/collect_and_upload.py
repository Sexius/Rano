#!/usr/bin/env python3
"""
Vending Data Collector for GitHub Actions
- targets.json 기반 로테이션 수집
- 랜덤 startPage로 커버리지 확대
- Render 백엔드로 업로드
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


def load_targets():
    """targets.json 로드"""
    script_dir = Path(__file__).parent
    targets_path = script_dir / "targets.json"
    
    if targets_path.exists():
        with open(targets_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    # fallback
    return [{"server": "baphomet", "keyword": "천공"}]


def get_rotation_targets(targets, count=3):
    """
    시간 기반 + 랜덤 혼합 로테이션
    - 매 10분 주기마다 다른 target 그룹 선택
    - 같은 주기에 count개 타겟 수집
    """
    now = datetime.datetime.now()
    
    # 10분 단위 시간 슬롯 (하루 144개 슬롯)
    time_slot = (now.hour * 6) + (now.minute // 10)
    
    # 시간 슬롯 기반 시작 인덱스 (deterministic)
    start_idx = (time_slot * count) % len(targets)
    
    # count개 타겟 선택 (순환)
    selected = []
    for i in range(count):
        idx = (start_idx + i) % len(targets)
        selected.append(targets[idx])
    
    return selected, time_slot


def get_random_start_page(max_total_pages=20):
    """
    랜덤 startPage 생성 (1~max_total_pages 범위)
    - 상태 저장 없이 커버리지 확대
    - 같은 키워드도 다른 페이지 범위 수집
    """
    return random.randint(1, max(1, max_total_pages - 5))


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
    """수집 + 업로드"""
    end_page = start_page + max_pages - 1
    print(f"[Collector] {server}|{keyword} pages {start_page}~{end_page}")
    
    all_items = []
    
    for page in range(start_page, end_page + 1):
        print(f"[Collector] Fetching page {page}...")
        
        html, error = fetch_page(server, keyword, page)
        
        if error == "429":
            print("[Collector] 429 detected, stopping")
            return 0, True  # rate limited
        
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
        return 0, False
    
    saved, error = upload_to_server(all_items, server, upload_url, upload_key)
    
    if error:
        print(f"[Collector] Upload error: {error}")
        return 0, False
    
    print(f"[Collector] Uploaded: {saved} items")
    return saved, False


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
    
    total_saved = 0
    
    if args.keyword:
        # 단일 키워드 수집
        start_page = get_random_start_page()
        saved, _ = collect_and_upload(args.server or 'baphomet', args.keyword, start_page, args.pages, upload_url, upload_key)
        total_saved = saved
    else:
        # targets.json 기반 로테이션 수집
        all_targets = load_targets()
        selected, time_slot = get_rotation_targets(all_targets, args.targets_count)
        
        print(f"[Collector] Time slot: {time_slot}, Targets: {len(selected)}")
        
        for target in selected:
            server = target.get("server", "baphomet")
            keyword = target.get("keyword", "천공")
            
            start_page = get_random_start_page()
            saved, rate_limited = collect_and_upload(server, keyword, start_page, args.pages, upload_url, upload_key)
            total_saved += saved
            
            if rate_limited:
                print("[Collector] Rate limited, stopping all")
                break
            
            # 타겟 간 딜레이
            time.sleep(2)
    
    print(f"[Collector] Total saved: {total_saved}")
    sys.exit(0)


if __name__ == "__main__":
    main()
