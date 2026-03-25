#!/usr/bin/env python3
"""
V2 검색 결과 vs 공홈 비교 분석
"""
import requests
import json
from bs4 import BeautifulSoup

# 1. V2 API 결과 가져오기
print("=" * 60)
print("[1] V2 API 결과 분석 (baphomet | 천공)")
print("=" * 60)

v2_url = "https://rano.onrender.com/api/vending/v2/search?item=%EC%B2%9C%EA%B3%B5&server=baphomet&size=200"
v2_resp = requests.get(v2_url, timeout=30)
v2_data = v2_resp.json()

print(f"totalElements (total): {v2_data.get('total', 'N/A')}")
print(f"totalPages: {v2_data.get('totalPages', 'N/A')}")
print(f"실제 data 개수: {len(v2_data.get('data', []))}")
print(f"stale: {v2_data.get('stale', 'N/A')}")
print(f"refreshTriggered: {v2_data.get('refreshTriggered', 'N/A')}")

# V2 아이템 이름 목록
v2_items = set()
for item in v2_data.get('data', []):
    v2_items.add(item.get('item_name', ''))

print(f"\nV2 고유 아이템명 개수: {len(v2_items)}")

# 2. 공홈(ro.gnjoy.com) 결과 가져오기
print("\n" + "=" * 60)
print("[2] 공홈 결과 분석 (baphomet | 천공)")
print("=" * 60)

gnjoy_url = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"
gnjoy_items = []

# 여러 페이지 수집 시도 (1~10 페이지)
for page in range(1, 11):
    try:
        resp = requests.get(gnjoy_url, params={
            'svrID': '1',  # baphomet
            'itemFullName': '천공',
            'curpage': str(page)
        }, timeout=10)
        
        if resp.status_code == 429:
            print(f"Page {page}: 429 Rate Limited")
            break
            
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Total 파싱
        if page == 1:
            total_elem = soup.select_one('#searchResult strong')
            if total_elem:
                total_text = ''.join(c for c in total_elem.text if c.isdigit())
                print(f"공홈 Total: {total_text}")
        
        # 아이템 테이블 파싱
        table = soup.select_one('table.listTypeOfDefault.dealList')
        if not table:
            break
            
        rows = table.select('tr')[1:]  # 헤더 제외
        if not rows:
            break
            
        for row in rows:
            cols = row.select('td')
            if len(cols) >= 5:
                item_name_elem = cols[1].select_one('img')
                if item_name_elem and item_name_elem.get('alt'):
                    item_name = item_name_elem['alt']
                else:
                    item_name = cols[1].get_text(strip=True)
                
                price_text = cols[3].get_text(strip=True).replace(',', '')
                price = ''.join(c for c in price_text if c.isdigit())
                
                gnjoy_items.append({
                    'name': item_name,
                    'price': price
                })
        
        print(f"Page {page}: {len(rows)} rows")
        
    except Exception as e:
        print(f"Page {page}: Error - {e}")
        break

print(f"\n공홈 수집 아이템 총 개수: {len(gnjoy_items)}")

# 공홈 아이템명 세트
gnjoy_names = set(item['name'] for item in gnjoy_items)
print(f"공홈 고유 아이템명 개수: {len(gnjoy_names)}")

# 3. 누락 분석
print("\n" + "=" * 60)
print("[3] 누락 분석 (공홈 O, V2 X)")
print("=" * 60)

missing = []
for item in gnjoy_items:
    if item['name'] not in v2_items:
        missing.append(item)

print(f"누락 아이템 개수: {len(missing)}")
print("\n누락 대표 사례 10개:")
for i, item in enumerate(missing[:10], 1):
    print(f"  {i}. {item['name']} ({item['price']}z)")

# 4. 원인 분류
print("\n" + "=" * 60)
print("[4] 원인 분류")
print("=" * 60)

# 분류 기준
# A: [UNIQUE]/+제련/옵션 등 특수 문자 포함
# B: 페이지 제한 또는 429로 수집 안 됨
# C: UNIQUE 제약으로 중복 제거
# D: 필터/정렬 조건

for i, item in enumerate(missing[:10], 1):
    name = item['name']
    cause = "B (수집 제한)"  # 기본
    
    if name.startswith('[UNIQUE]') or name.startswith('+'):
        cause = "A (특수명 처리)"
    elif '(' in name and ')' in name:
        cause = "A (옵션 포함)"
    
    # V2 items에 정규화된 이름이 있는지 확인
    normalized = name
    if normalized.startswith('[UNIQUE]'):
        normalized = normalized.replace('[UNIQUE]', '').strip()
    if normalized.startswith('+'):
        import re
        normalized = re.sub(r'^\+\d+\s*', '', normalized)
    
    if any(normalized in v2_name for v2_name in v2_items):
        cause = "C (UNIQUE 제약/정규화)"
    
    print(f"  {i}. {name[:40]:40} → {cause}")
