import requests
from bs4 import BeautifulSoup

def test_crawl(item_name):
    base_url = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"
    params = {
        'itemFullName': item_name,
        'curpage': 1,
        'svrID': '129', # Baphomet
        'itemOrder': '',
        'inclusion': ''
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"Requesting {base_url} with params {params}")
    response = requests.get(base_url, params=params, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"URL: {response.url}")
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Check for the selector used in the code
    rows = soup.select('#divItemDealList > table > tbody > tr')
    print(f"Rows found with '#divItemDealList > table > tbody > tr': {len(rows)}")
    
    for i, row in enumerate(rows):
        columns = row.select('td')
        print(f"Row {i} columns: {len(columns)}")
        if len(columns) >= 5:
            print(f"  Server: {columns[0].get_text(strip=True)}")
            print(f"  Item: {columns[1].get_text(strip=True)}")
            print(f"  Price: {columns[3].get_text(strip=True)}")
    
    # Check if there's another table or structure
    tables = soup.find_all('table')
    print(f"Total tables found: {len(tables)}")
    
    # Check for pagination
    pagination = soup.select('.paging')
    print(f"Pagination elements: {len(pagination)}")
    for p in pagination:
        print(p.prettify())

    # Print a snippet of the HTML to see what's going on
    print("HTML Snippet (first 1000 chars):")
    print(response.text[:1000])

if __name__ == "__main__":
    import sys
    # Redirect stdout to a file
    with open('debug_output.txt', 'w', encoding='utf-8') as f:
        sys.stdout = f
        test_crawl("카드")
