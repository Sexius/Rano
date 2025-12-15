"""
ragnaplace.com 스킬 데이터 테스트 크롤링
"""
import requests
import re
from bs4 import BeautifulSoup

BASE_URL = "https://ragnaplace.com/ko/kro/skill/"

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
        name = re.search(r'^([^(]+)', title).group(1).strip() if title else None
        
        # ATK% 추출
        atk_matches = re.findall(r'\[Lv\s*(\d+)\]\s*:\s*ATK\s*(\d+)%', desc)
        damage = int(max(atk_matches, key=lambda x: int(x[0]))[1]) if atk_matches else None
        
        # 영문 ID 추출
        eng_match = re.search(r'/ ([A-Z][A-Z0-9_]+)', resp.text)
        eng_id = eng_match.group(1) if eng_match else None
        
        return {'id': skill_id, 'name': name, 'eng_id': eng_id, 'damage': damage}
    except Exception as e:
        return None

# 테스트
test_ids = [5, 7, 56, 57, 62, 355, 356, 357, 358, 359, 397, 398, 399]

results = []
for sid in test_ids:
    data = fetch_skill(sid)
    if data:
        results.append(f"OK {sid}: {data['name']} ({data['eng_id']}) - ATK {data['damage']}%")
    else:
        results.append(f"FAIL {sid}")

# 파일로 저장
with open('crawl_test_result.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(results))
print("Done! See crawl_test_result.txt")
