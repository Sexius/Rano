import requests
import socket

def check_port(host, port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(2)
        return s.connect_ex((host, port)) == 0

def test_endpoint(name, url):
    print(f"\n--- Testing {name} ---")
    print(f"URL: {url}")
    try:
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        try:
            print(f"Response: {response.json()[:3]}") # Print first 3 items
        except:
             print(f"Response (Text): {response.text[:200]}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    if check_port("localhost", 8080):
        print("✅ Port 8080 is OPEN (Server is running)")
        test_endpoint("Item Search (katar)", "http://localhost:8080/api/search?query=katar")
        test_endpoint("Vending Search", "http://localhost:8080/api/vending?name=katar&server=baphomet")
    else:
        print("❌ Port 8080 is CLOSED (Server is DOWN)")
