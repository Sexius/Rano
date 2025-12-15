from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import sqlite3

app = Flask(__name__)
CORS(app)

# 크롤링 함수
def scrape_and_save_to_db(item_name):
    print(f"--- '{item_name}' 스크래핑 시작 ---")
    url = "https://ro.gnjoy.com/itemDeal/itemDealList.asp"
    params = {'itemFullName': item_name}
    headers = {'User-Agent': 'Mozilla/5.0'}

    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        print(f"응답 상태: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"'{item_name}' 접속 중 에러 발생: {e}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    item_rows = soup.select('#divItemDealList > table > tbody > tr')

    all_items_info = []
    if item_rows:
        for row in item_rows:
            columns = row.select('td')
            if len(columns) == 5:
                item_info = (
                    columns[0].get_text(strip=True),  # server
                    item_name,  # item_name
                    columns[2].get_text(strip=True),  # quantity
                    columns[3].get_text(strip=True),  # price
                    columns[4].get_text(strip=True)   # vendor_info
                )
                all_items_info.append(item_info)
                print(f"아이템 정보: {item_info}")

    if all_items_info:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS items (
                server TEXT, item_name TEXT, quantity TEXT, price TEXT, vendor_info TEXT
            )
        ''')
        cur.execute("DELETE FROM items WHERE item_name = ?", (item_name,))
        cur.executemany("INSERT INTO items VALUES (?, ?, ?, ?, ?)", all_items_info)
        conn.commit()
        conn.close()
        print(f"--- '{item_name}' 정보 {len(all_items_info)}개 DB 저장 완료 ---")
    
    return all_items_info

# API 엔드포인트
@app.route('/api/vending', methods=['GET'])
def get_vending_data():
    item = request.args.get('item', '')
    server = request.args.get('server', 'baphomet')
    
    print(f"크롤링 요청: {item} 아이템, {server} 서버")
    
    try:
        # 아이템 이름이 있으면 크롤링 실행
        if item and item.strip():
            print(f"실제 크롤링 실행: {item}")
            results = scrape_and_save_to_db(item.strip())
            
            # 크롤링 결과를 API 형식으로 변환
            api_results = []
            server_display = "바포메트" if server == "baphomet" else "이프리트"
            
            for i, row in enumerate(results):
                item_info = {
                    'id': i + 1,
                    'vendor_name': row[4],  # vendor_info
                    'server_name': row[0],   # server
                    'coordinates': 'Unknown',
                    'item_name': row[1],     # item_name
                    'quantity': row[2],      # quantity
                    'price': row[3],         # price
                    'vendor_info': row[4],   # vendor_info
                    'category': 'Unknown',
                    'rarity': 'Common'
                }
                api_results.append(item_info)
            
            print(f"크롤링 완료: {len(api_results)}개 결과 반환")
            return jsonify(api_results)
        else:
            print("아이템 이름이 없어서 빈 배열 반환")
            return jsonify([])
            
    except Exception as e:
        print(f"크롤링 오류: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("Flask 크롤링 서버 시작 (포트 5002)")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5002, debug=True)


