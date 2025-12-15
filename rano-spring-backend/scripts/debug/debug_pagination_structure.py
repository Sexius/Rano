import requests
from bs4 import BeautifulSoup

def inspect_pagination():
    url = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"
    params = {
        "itemFullName": "카드",
        "curpage": 1,
        "svrID": 129
    }
    
    try:
        response = requests.get(url, params=params)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Dump all div elements with class that might be related to pagination
        print("--- Potential Pagination Elements ---")
        for div in soup.find_all('div'):
            if div.get('class'):
                print(f"Div class: {div.get('class')}")
                
        # Look for 'paging' or 'pagination' in text or class
        print("\n--- Searching for 'paging' string ---")
        if "paging" in response.text:
            print("Found 'paging' in HTML")
            # Print context
            start = response.text.find("paging") - 100
            end = start + 500
            print(response.text[start:end])
            
        # Look for the total count usually displayed like "Total: 1800"
        print("\n--- Searching for Total Count ---")
        # Common patterns: "총", "Total", "검색결과"
        for element in soup.find_all(string=True):
            if "검색결과" in element:
                print(f"Found '검색결과' in: {element.parent}")
                print(f"Full text: {element.parent.get_text().strip()}")
                
        print("\n--- Full Paging Nav ---")
        paging_nav = soup.select_one(".pagingNav")
        if paging_nav:
            print(paging_nav.prettify())

    except Exception as e:
        print(f"Error: {e}")

import sys
# Redirect stdout to a file with utf-8 encoding
sys.stdout = open('debug_pagination_output_utf8.txt', 'w', encoding='utf-8')
inspect_pagination()
sys.stdout.close()
