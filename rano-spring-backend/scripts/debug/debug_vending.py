import urllib.parse
import urllib.request
import gzip

try:
    # 1. Prepare EUC-KR Query
    query = "천공"
    encoded_query = urllib.parse.quote(query.encode('euc-kr'))
    
    # 2. Construct URL
    url = f"https://ro.gnjoy.com/itemDeal/itemDealList.asp?itemFullName={encoded_query}&curpage=1&svrID=129"
    print(f"Testing URL: {url}")
    
    # 3. Create Request with Headers
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    req.add_header("Referer", "https://ro.gnjoy.com/")
    req.add_header("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
    
    # 4. Fetch
    with urllib.request.urlopen(req) as response:
        content = response.read()
        
        # Handle GZIP
        if response.info().get('Content-Encoding') == 'gzip':
            content = gzip.decompress(content)
            
        decoded_content = content.decode('euc-kr', errors='ignore')
        
        print(f"Response Status: {response.status}")
        print(f"Content Length: {len(decoded_content)}")
        
        # 5. Check for Data
        if "검색결과" in decoded_content or "searchResult" in decoded_content:
            print("Found 'Search Result' marker.")
        else:
            print("No 'Search Result' marker found.")
            
        if "천공" in decoded_content:
            print("Found query string in response.")
            
        # Check for table rows
        if "<tr" in decoded_content:
            print("Found table rows.")
        else:
            print("No table rows found.")
            
        # Write to file for inspection
        with open("debug_vending_output.html", "w", encoding="utf-8") as f:
            f.write(decoded_content)
            
except Exception as e:
    print(f"Error: {e}")
