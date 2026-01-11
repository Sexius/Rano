#!/usr/bin/env python3
"""
Vending Data Collector for GitHub Actions
- 공홈(ro.gnjoy.com)에서 노점 데이터 수집
- Render 백엔드로 업로드
"""
import os
import sys
import json
import time
import random
import argparse
import requests
from bs4 import BeautifulSoup

# 공홈 URL 패턴
GNJOY_BASE_URL = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"

# 서버 ID 매핑
SERVER_IDS = {
    "baphomet": "129",
    "yggdrasil": "130",
    "ifrit": "131"
}

# 인기 키워드 목록 (순환 수집용)
POPULAR_KEYWORDS = [
    "천공", "룬", "카드", "주문서", "악세", "무기", "방어구",
    "마법", "힘", "민첩", "지능", "행운", "체력", "정신력"
]

def parse_vending_page(html_content, server):
    """공홈 HTML에서 노점 데이터 파싱"""
    soup = BeautifulSoup(html_content, 'html.parser')
    items = []
    
    # 테이블 찾기
    table = soup.select_one('table.listTypeOfDefault.dealList')
    if not table:
        return items
    
    rows = table.select('tr')[1:]  # 헤더 제외
    
    for row in rows:
        cols = row.select('td')
        if len(cols) < 5:
            continue
        
        try:
            # 서버명
            server_name = cols[0].get_text(strip=True)
            
            # 아이템명 (이미지 alt 또는 텍스트)
            item_elem = cols[1].select_one('a')
            if not item_elem:
                continue
            
            # onclick에서 ssi, mapId 추출
            onclick = item_elem.get('onclick', '')
            ssi = ""
            map_id = ""
            if 'popup_info' in onclick:
                # popup_info('ssi값','mapId값')
                parts = onclick.split("'")
                if len(parts) >= 4:
                    ssi = parts[1]
                    map_id = parts[3]
            
            # 아이템명
            img = cols[1].select_one('img')
            if img and img.get('alt'):
                item_name = img['alt']
            else:
                item_name = cols[1].get_text(strip=True)
            
            # 수량
            qty_text = cols[2].get_text(strip=True).replace(',', '')
            quantity = int(qty_text) if qty_text.isdigit() else 1
            
            # 가격
            price_text = cols[3].get_text(strip=True).replace(',', '').replace('z', '')
            price = int(price_text) if price_text.isdigit() else 0
            
            # 노점 정보
            vendor_info_elem = cols[4].select_one('a')
            vendor_info = vendor_info_elem.get_text(strip=True) if vendor_info_elem else ""
            
            # DTO 생성
            items.append({
                "item_name": item_name,
                "price": price,
                "quantity": quantity,
                "vendor_info": vendor_info,
                "vendor_name": "",  # 공홈에서는 판매자명 없음
                "ssi": ssi,
                "map_id": map_id,
                "server_name": server
            })
            
        except Exception as e:
            print(f"[Parser] Error parsing row: {e}")
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
            return 0, f"HTTP {resp.status_code}: {resp.text}"
            
    except Exception as e:
        return 0, str(e)


def collect_and_upload(server, keyword, max_pages, upload_url, upload_key):
    """수집 + 업로드 메인 로직"""
    print(f"[Collector] Starting: server={server} keyword={keyword} pages={max_pages}")
    
    all_items = []
    
    for page in range(1, max_pages + 1):
        print(f"[Collector] Fetching page {page}/{max_pages}...")
        
        html, error = fetch_page(server, keyword, page)
        
        if error == "429":
            print("[Collector] 429 detected, stopping collection")
            break
        
        if error:
            print(f"[Collector] Error on page {page}: {error}")
            break
        
        items = parse_vending_page(html, server)
        print(f"[Collector] Page {page}: {len(items)} items parsed")
        
        if not items:
            print("[Collector] No more items, stopping")
            break
        
        all_items.extend(items)
        
        # 다음 페이지 전 랜덤 딜레이 (3~6초)
        if page < max_pages:
            delay = 3 + random.random() * 3
            print(f"[Collector] Waiting {delay:.1f}s...")
            time.sleep(delay)
    
    if not all_items:
        print("[Collector] No items collected")
        return 0
    
    # 업로드
    print(f"[Collector] Uploading {len(all_items)} items to {upload_url}...")
    saved, error = upload_to_server(all_items, server, upload_url, upload_key)
    
    if error:
        print(f"[Collector] Upload error: {error}")
        return 0
    
    print(f"[Collector] Upload complete: {saved} items saved")
    return saved


def main():
    parser = argparse.ArgumentParser(description='Vending Data Collector')
    parser.add_argument('--server', default='baphomet', help='Server name')
    parser.add_argument('--keyword', default='', help='Search keyword (empty = cycle popular keywords)')
    parser.add_argument('--pages', type=int, default=3, help='Max pages per keyword')
    args = parser.parse_args()
    
    # 환경 변수에서 URL/키 읽기
    upload_url = os.environ.get('UPLOAD_URL', 'https://rano.onrender.com/api/vending/upload')
    upload_key = os.environ.get('UPLOAD_KEY', 'rano-upload-secret-2026')
    
    if not upload_url or not upload_key:
        print("[ERROR] UPLOAD_URL and UPLOAD_KEY environment variables required")
        sys.exit(1)
    
    total_saved = 0
    
    if args.keyword:
        # 특정 키워드만 수집
        total_saved = collect_and_upload(args.server, args.keyword, args.pages, upload_url, upload_key)
    else:
        # 인기 키워드 순환 수집 (시간 기반 인덱스)
        import datetime
        minute = datetime.datetime.now().minute
        # 10분 주기로 다른 키워드 선택
        keyword_index = (minute // 10) % len(POPULAR_KEYWORDS)
        keyword = POPULAR_KEYWORDS[keyword_index]
        
        print(f"[Collector] Auto-selected keyword: {keyword} (index {keyword_index})")
        total_saved = collect_and_upload(args.server, keyword, args.pages, upload_url, upload_key)
    
    print(f"[Collector] Total saved: {total_saved}")
    sys.exit(0 if total_saved > 0 else 1)


if __name__ == "__main__":
    main()
