import requests
from bs4 import BeautifulSoup

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
table = soup.select_one('table.listTypeOfDefault.dealList')

if table:
    rows = table.select('tr')[1:4]
    for i, row in enumerate(rows):
        print(f"=== ROW {i+1} ===")
        
        # 1. Row class/id
        print(f"Row classes: {row.get('class', [])}")
        print(f"Row id: {row.get('id', 'None')}")
        print(f"Row all attrs: {dict(row.attrs)}")
        
        # 2. 모든 이미지 
        imgs = row.select('img')
        for img in imgs:
            print(f"IMG src: {img.get('src', '')}")
        
        # 3. 모든 링크
        links = row.select('a')
        for link in links:
            onclick = link.get('onclick', '')
            if onclick:
                print(f"ONCLICK: {onclick[:150]}")
        
        print()
