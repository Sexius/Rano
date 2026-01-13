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

with open('map_analysis.txt', 'w', encoding='utf-8') as f:
    if table:
        rows = table.select('tr')[1:4]
        for i, row in enumerate(rows):
            f.write(f"=== ROW {i+1} ===\n")
            
            # Shop column HTML
            cols = row.select('td')
            if len(cols) >= 5:
                f.write(f"Shop column:\n{cols[4].prettify()}\n\n")

print("Done! Check map_analysis.txt")
