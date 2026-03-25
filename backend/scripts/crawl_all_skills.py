"""
ragnaplace.com 전체 스킬 크롤링 및 DB 업데이트
"""
import requests
import re
import time
import pymysql
from bs4 import BeautifulSoup

BASE_URL = "https://ragnaplace.com/ko/kro/skill/"

def get_db():
    return pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')

def fetch_skill(skill_id):
    try:
        url = f"{BASE_URL}{skill_id}"
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            return None
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        og_desc = soup.find('meta', property='og:description')
        if not og_desc:
            return None
        desc = og_desc.get('content', '')
        
        og_title = soup.find('meta', property='og:title')
        title = og_title.get('content', '') if og_title else ''
        name_match = re.search(r'^([^(]+)', title)
        name = name_match.group(1).strip() if name_match else None
        
        # 영문 ID
        eng_match = re.search(r'/ ([A-Z][A-Z0-9_]+)', resp.text)
        eng_id = eng_match.group(1) if eng_match else None
        
        # ATK% (최대 레벨)
        atk_matches = re.findall(r'\[Lv\s*(\d+)\]\s*:\s*[^\[]*ATK\s*(\d+)%', desc)
        damage = int(max(atk_matches, key=lambda x: int(x[0]))[1]) if atk_matches else None
        
        # 타수
        hits_match = re.search(r'(\d+)회\s*(입힌다|공격|타격|적중|준다)', desc)
        hits = int(hits_match.group(1)) if hits_match else 1
        
        return {'id': skill_id, 'name': name, 'eng_id': eng_id, 'damage': damage, 'hits': hits}
    except:
        return None

def run():
    conn = get_db()
    cursor = conn.cursor()
    
    # 기존 영문ID 목록
    cursor.execute("SELECT eng_name FROM skills")
    db_eng_names = set(row[0] for row in cursor.fetchall())
    
    results = []
    updated = 0
    
    # 스킬 ID 범위 (1~3000 정도 커버)
    for skill_id in range(1, 3001):
        data = fetch_skill(skill_id)
        
        if data and data['eng_id'] and data['damage']:
            results.append(data)
            
            # DB에 있으면 업데이트
            if data['eng_id'] in db_eng_names:
                cursor.execute("""
                    UPDATE skills 
                    SET damage_percent = %s, hits = %s 
                    WHERE eng_name = %s
                """, (data['damage'], data['hits'], data['eng_id']))
                updated += 1
        
        # Rate limiting
        time.sleep(0.2)
        
        # 진행상황
        if skill_id % 100 == 0:
            with open('crawl_progress.txt', 'w', encoding='utf-8') as f:
                f.write(f"Progress: {skill_id}/3000, Found: {len(results)}, Updated: {updated}")
    
    conn.commit()
    conn.close()
    
    # 최종 결과 저장
    with open('crawl_final_result.txt', 'w', encoding='utf-8') as f:
        f.write(f"Total skills found: {len(results)}\n")
        f.write(f"DB updated: {updated}\n\n")
        for r in results:
            f.write(f"{r['name']} ({r['eng_id']}): {r['damage']}% x {r['hits']}hit\n")

if __name__ == "__main__":
    run()
