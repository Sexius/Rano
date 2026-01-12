import requests
from bs4 import BeautifulSoup
import re

url = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"
params = {
    'svrID': '1',
    'itemFullName': '오염',
    'curpage': '1'
}

response = requests.get(url, params=params, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})
response.encoding = 'utf-8'

soup = BeautifulSoup(response.text, 'html.parser')

print("=" * 60)
print("1. HTML 태그 속성 (Class/ID) 분석")
print("=" * 60)

table = soup.select_one('table.listTypeOfDefault.dealList')
if table:
    rows = table.select('tr')[1:6]  # 5개 행만 분석
    for i, row in enumerate(rows):
        row_classes = row.get('class', [])
        row_id = row.get('id', '')
        print(f"\nRow {i+1}:")
        print(f"  <tr> class: {row_classes}")
        print(f"  <tr> id: {row_id or 'None'}")
        
        cols = row.select('td')
        for j, col in enumerate(cols):
            col_classes = col.get('class', [])
            col_id = col.get('id', '')
            if col_classes or col_id:
                print(f"  <td {j}> class: {col_classes}, id: {col_id or 'None'}")
        
        # 행 전체 속성 출력
        all_attrs = dict(row.attrs)
        if len(all_attrs) > 2:
            print(f"  All attrs: {all_attrs}")

print("\n" + "=" * 60)
print("2. 이미지 src 주소 분석")
print("=" * 60)

if table:
    rows = table.select('tr')[1:6]
    img_sources = set()
    for i, row in enumerate(rows):
        imgs = row.select('img')
        print(f"\nRow {i+1} images:")
        for img in imgs:
            src = img.get('src', '')
            alt = img.get('alt', '')
            img_class = img.get('class', [])
            print(f"  src: {src}")
            print(f"  alt: {alt}, class: {img_class}")
            img_sources.add(src)
    
    print(f"\n모든 고유 이미지 경로:")
    for src in img_sources:
        print(f"  {src}")

print("\n" + "=" * 60)
print("3. 추가 분석: onclick, data-* 속성")
print("=" * 60)

if table:
    rows = table.select('tr')[1:3]
    for i, row in enumerate(rows):
        print(f"\nRow {i+1} 특수 속성:")
        # onclick 속성 찾기
        elements_with_onclick = row.select('[onclick]')
        for elem in elements_with_onclick:
            onclick = elem.get('onclick', '')
            print(f"  onclick: {onclick[:100]}...")
        
        # data-* 속성 찾기
        for elem in row.find_all(True):
            for attr in elem.attrs:
                if attr.startswith('data-'):
                    print(f"  {attr}: {elem.get(attr)}")

print("\n" + "=" * 60)
print("4. 전체 HTML 구조 (첫 번째 행)")
print("=" * 60)

if table:
    first_row = table.select('tr')[1]
    print(first_row.prettify()[:2000])
