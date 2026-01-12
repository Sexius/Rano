import requests
from bs4 import BeautifulSoup

# Test with different dealType parameter
for deal_type in ['', '1', '2', 'B', 'S']:
    url = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"
    params = {
        'svrID': '1',
        'itemFullName': '오염',
        'curpage': '1'
    }
    if deal_type:
        params['dealType'] = deal_type
    
    response = requests.get(url, params=params, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    soup = BeautifulSoup(response.text, 'html.parser')
    total_elem = soup.select_one('#searchResult strong')
    total = total_elem.text if total_elem else '?'
    
    print(f"dealType={deal_type or 'empty'}: Total={total}")
