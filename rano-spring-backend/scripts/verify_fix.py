import pymysql
import json

conn = pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')
cursor = conn.cursor()
cursor.execute('SELECT id, name_kr, parsed_data FROM items WHERE id = 401059')
result = cursor.fetchone()

if result:
    data = json.loads(result[2])
    print(f'아이템: {result[1]}')
    print(f'B등급 옵션: {data.get("grade", {}).get("B", {})}')
    print(f'세트 개수: {len(data.get("sets", []))}')
    if data.get("sets"):
        print(f'첫 세트 타겟: {data["sets"][0].get("target_name", "없음")}')
        print(f'첫 세트 효과: {data["sets"][0].get("effects", {})}')
else:
    print("아이템을 찾을 수 없습니다.")

conn.close()
