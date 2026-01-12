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

# Find the deal table
table = soup.select_one('table.listTypeOfDefault.dealList')
if table:
    rows = table.select('tr')
    print(f"Found {len(rows)} rows")
    for i, row in enumerate(rows[:5]):  # First 5 rows
        cols = row.select('td')
        print(f"\nRow {i}: {len(cols)} columns")
        for j, col in enumerate(cols):
            text = col.get_text(strip=True)[:30]
            print(f"  Col {j}: {text}")
else:
    print("Table not found")
    # Show what we can find
    tables = soup.select('table')
    print(f"Found {len(tables)} tables total")
