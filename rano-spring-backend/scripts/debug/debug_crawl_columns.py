import requests
from bs4 import BeautifulSoup
import urllib.parse

def debug_crawl(item_name="젤로피"):
    url = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"
    params = {
        "itemFullName": item_name,
        "curpage": 1,
        "svrID": 129 # Baphomet
    }
    
    print(f"Requesting {url} with params {params}")
    response = requests.get(url, params=params)
    response.encoding = 'utf-8' # Try utf-8 first, maybe euc-kr?
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    rows = soup.select("#divItemDealList > table > tbody > tr")
    print(f"Found {len(rows)} rows")
    
    if rows:
        row = rows[0]
        print(f"Row HTML: {row}")
        cols = row.select("td")
        for i, col in enumerate(cols):
            print(f"Col {i}: {col.text.strip()}")

if __name__ == "__main__":
    debug_crawl()
