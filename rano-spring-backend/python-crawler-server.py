import requests
from bs4 import BeautifulSoup
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import time
import sys

app = Flask(__name__)
CORS(app)  # 모든 도메인 허용

def crawl_item_internal(item_name, server='baphomet'):
    """내부 크롤링 함수 (Requests + BeautifulSoup 사용)"""
    print(f"\n{'='*50}")
    print(f"Requests 크롤링 시작: {item_name}")
    print(f"{'='*50}")
    
    all_results = []
    
    try:
        base_url = "https://ro.gnjoy.com/itemdeal/itemDealList.asp"
        # server_display = "바포메트" if server == "baphomet" else "이프리트" # 이제 크롤링 결과에서 직접 가져옴
        svr_id = "129" if server == "baphomet" else "729" # 바포메트: 129, 이프리트: 729 (추정, HTML select 옵션 확인 필요)
        # HTML에서 확인한 값: 바포메트(129), 이프리트(729)
        
        current_page = 1
        max_pages = 20  # 최대 20페이지로 증가
        seen_items = set()
        
        while current_page <= max_pages:
            try:
                print(f"\n페이지 {current_page} 요청 중...")
                params = {
                    'itemFullName': item_name,
                    'curpage': current_page, # page -> curpage 로 수정
                    'svrID': svr_id,
                    'itemOrder': '',
                    'inclusion': ''
                }
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                
                response = requests.get(base_url, params=params, headers=headers, timeout=5)
                response.raise_for_status()
                
                print(f"Requesting URL: {response.url}")
                print(f"Params: {params}")
                
                # 페이지 소스에서 데이터 추출
                soup = BeautifulSoup(response.text, 'html.parser')
                item_rows = soup.select('#divItemDealList > table > tbody > tr')
                print(f"Found {len(item_rows)} rows")
                
                if not item_rows:
                    print("더 이상 데이터 없음")
                    break
                
                page_items = 0
                duplicates = 0
                
                for row in item_rows:
                    columns = row.select('td')
                    if len(columns) >= 5:
                        server_text = columns[0].get_text(strip=True) # 0번 인덱스가 서버명
                        item = columns[1].get_text(strip=True)
                        quantity = columns[2].get_text(strip=True)
                        price = columns[3].get_text(strip=True)
                        shop_name = columns[4].get_text(strip=True) # 4번 인덱스가 상점명(판매자)
                        
                        # 중복 체크
                        item_key = f"{shop_name}|{item}|{price}"
                        if item_key in seen_items:
                            duplicates += 1
                            continue
                        
                        seen_items.add(item_key)
                        
                        item_info = {
                            'vendor_name': shop_name, # 상점명으로 수정
                            'server_name': server_text, # 서버명으로 수정
                            'coordinates': 'Unknown',
                            'item_name': item,
                            'quantity': quantity,
                            'price': price,
                            'vendor_info': shop_name,
                            'category': 'Unknown',
                            'rarity': 'Common'
                        }
                        all_results.append(item_info)
                        page_items += 1
                
                print(f"페이지 {current_page}: {page_items}개 신규, {duplicates}개 중복 (총 {len(all_results)}개)")
                
                # 데이터가 없으면 종료
                if page_items == 0 and duplicates == 0:
                    break
                
                # 다음 페이지 확인 (간단히 행 개수로 판단하거나, 최대 페이지 도달 시 종료)
                if current_page >= max_pages:
                    print("최대 페이지 도달")
                    break
                
                current_page += 1
                time.sleep(0.5) # 너무 빠른 요청 방지
                
            except Exception as e:
                print(f"페이지 {current_page} 크롤링 오류: {e}")
                break
        
        # DB에 저장
        if all_results:
            conn = sqlite3.connect('ro_market.db')
            cur = conn.cursor()
            cur.execute('''
                CREATE TABLE IF NOT EXISTS items (
                    server TEXT, item_name TEXT, quantity TEXT, price TEXT, vendor_info TEXT
                )
            ''')
            cur.execute("DELETE FROM items WHERE item_name LIKE ?", (f'%{item_name}%',))
            for item in all_results:
                cur.execute("INSERT INTO items VALUES (?, ?, ?, ?, ?)", (
                    item['server_name'],
                    item['item_name'],
                    item['quantity'],
                    item['price'],
                    item['vendor_info']
                ))
            conn.commit()
            conn.close()
            print(f"\n최종: {len(all_results)}개 아이템 DB 저장 완료")
        
        return all_results
        
    except Exception as e:
        print(f"크롤링 오류: {e}")
        import traceback
        traceback.print_exc()
        return []

@app.route('/api/crawl', methods=['POST'])
def crawl_item():
    """크롤링 API 엔드포인트"""
    data = request.get_json()
    item_name = data.get('item', '')
    server = data.get('server', 'baphomet')
    
    results = crawl_item_internal(item_name, server)
    return jsonify(results)

@app.route('/api/vending', methods=['GET'])
def get_vending_data():
    server = request.args.get('server', 'baphomet')
    item = request.args.get('item', '')
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 10))
    print(f"DEBUG: Request received. Item: {item}, Refresh: {request.args.get('refresh')}")
    sys.stdout.flush()
    refresh = request.args.get('refresh', 'false').lower() == 'true'
    print(f"DEBUG: Parsed refresh: {refresh}")
    sys.stdout.flush()
    
    # 유효성 검사
    if page < 1:
        page = 1
    if size < 1 or size > 100:
        size = 10
    
    try:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS items (
                server TEXT, item_name TEXT, quantity TEXT, price TEXT, vendor_info TEXT
            )
        ''')
        
        # 아이템 검색 시 DB에 데이터가 없거나 refresh=true면 크롤링
        if item:
            cur.execute("SELECT COUNT(*) FROM items WHERE item_name LIKE ?", (f'%{item}%',))
            count = cur.fetchone()[0]
            
            if count == 0 or refresh:
                print(f"\n'{item}' 데이터가 없거나 새로고침 요청으로 크롤링 시작...")
                conn.close()
                
                # 크롤링 실행
                crawl_result = crawl_item_internal(item, server)
                
                # 다시 DB 연결
                conn = sqlite3.connect('ro_market.db')
                cur = conn.cursor()
        
        # 전체 개수 조회
        if item:
            cur.execute("SELECT COUNT(*) FROM items WHERE item_name LIKE ?", (f'%{item}%',))
        else:
            server_display = "바포메트" if server == "baphomet" else "이프리트"
            cur.execute("SELECT COUNT(*) FROM items WHERE server = ?", (server_display,))
        
        total_count = cur.fetchone()[0]
        total_pages = (total_count + size - 1) // size
        
        # 페이지네이션 데이터 조회
        offset = (page - 1) * size
        
        if item:
            cur.execute("SELECT * FROM items WHERE item_name LIKE ? LIMIT ? OFFSET ?", 
                       (f'%{item}%', size, offset))
        else:
            server_display = "바포메트" if server == "baphomet" else "이프리트"
            cur.execute("SELECT * FROM items WHERE server = ? LIMIT ? OFFSET ?", 
                       (server_display, size, offset))
        
        rows = cur.fetchall()
        conn.close()
        
        results = []
        for i, row in enumerate(rows):
            item_info = {
                'id': offset + i + 1,
                'vendor_name': row[4] if len(row) > 4 else 'Unknown',
                'server_name': row[0] if len(row) > 0 else server,
                'coordinates': 'Unknown',
                'item_name': row[1] if len(row) > 1 else 'Unknown',
                'quantity': row[2] if len(row) > 2 else '1',
                'price': row[3] if len(row) > 3 else '0',
                'vendor_info': row[4] if len(row) > 4 else 'Unknown',
                'category': 'Unknown',
                'rarity': 'Common'
            }
            results.append(item_info)
        
        response = {
            'data': results,
            'pagination': {
                'total': total_count,
                'page': page,
                'size': size,
                'total_pages': total_pages
            }
        }
        
        print(f"페이지네이션 응답: 전체 {total_count}개, {page}/{total_pages} 페이지, {len(results)}개 반환")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"DB 조회 오류: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'data': [], 'pagination': {'total': 0, 'page': 1, 'size': size, 'total_pages': 0}})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)


