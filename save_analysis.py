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

with open('analysis_result.txt', 'w', encoding='utf-8') as f:
    if table:
        rows = table.select('tr')[1:4]
        for i, row in enumerate(rows):
            f.write(f"=== ROW {i+1} ===\n")
            f.write(f"Row classes: {row.get('class', [])}\n")
            f.write(f"Row all attrs: {dict(row.attrs)}\n")
            
            # 이미지
            imgs = row.select('img')
            for img in imgs:
                f.write(f"IMG src: {img.get('src', '')}\n")
            
            # onclick
            links = row.select('a')
            for link in links:
                onclick = link.get('onclick', '')
                if onclick:
                    f.write(f"ONCLICK: {onclick}\n")
            
            # 전체 HTML
            f.write(f"\nFULL HTML:\n{row.prettify()}\n\n")

print("Done! Check analysis_result.txt")
