import requests
import json

def debug_local_server():
    base_url = "http://localhost:5002/api/vending"
    item_name = "천공"
    
    print("Fetching from Local Server with refresh=true...")
    params = {
        'server': 'baphomet',
        'page': 1,
        'size': 10,
        'item': item_name,
        'refresh': 'true'
    }
    
    try:
        resp = requests.get(base_url, params=params)
        print(f"Status Code: {resp.status_code}")
        
        data = resp.json()
        print(f"Total Count: {data['pagination']['total']}")
        print(f"Returned Items: {len(data['data'])}")
            
    except Exception as e:
        print(f"Error: {e}")
        print(f"Response Text: {resp.text}")

if __name__ == "__main__":
    debug_local_server()
