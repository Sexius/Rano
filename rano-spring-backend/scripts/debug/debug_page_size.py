import requests
from bs4 import BeautifulSoup

def test_page_size(size):
    url = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"
    params = {
        "itemFullName": "카드",
        "curpage": 1,
        "svrID": 129,
        "pageSize": size, # Guessing parameter name
        "limit": size,    # Guessing parameter name
        "row": size       # Guessing parameter name
    }
    
    try:
        response = requests.get(url, params=params)
        soup = BeautifulSoup(response.text, 'html.parser')
        rows = soup.select("#divItemDealList > table > tbody > tr")
        print(f"Requested size: {size}, Rows returned: {len(rows)}")
    except Exception as e:
        print(f"Error: {e}")

print("Testing page size parameters...")
test_page_size(10) # Baseline
test_page_size(20)
test_page_size(50)
