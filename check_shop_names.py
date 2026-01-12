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
    rows = table.select('tr')[1:11]  # Skip header, get 10 rows
    for i, row in enumerate(rows):
        cols = row.select('td')
        if len(cols) >= 5:
            shop_name = cols[4].get_text(strip=True)
            print(f"{i+1}. 노점명: {shop_name}")
