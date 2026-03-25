"""
ragnaplace.com 전체 스킬 데이터 크롤링
모든 직업의 스킬 ID, 이름, 아이콘을 가져옴
"""
import requests
import re
import time
import json
import os
from bs4 import BeautifulSoup

# 저장 경로
OUTPUT_DIR = "e:/RAG/rano-frontend/public/skill-icons"
DATA_FILE = "e:/RAG/rano-frontend/src/data/skillData.json"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

# 직업 ID 목록 (ragnaplace.com 기준)
JOB_IDS = {
    # 1차 직업
    4001: "노비스",
    4002: "검사",
    4003: "마법사", 
    4004: "궁수",
    4005: "복사",
    4006: "상인",
    4007: "도둑",
    
    # 2차 직업 (검사계열)
    4008: "기사",
    4009: "크루세이더",
    
    # 2차 직업 (마법사계열)
    4010: "위자드",
    4011: "세이지",
    
    # 2차 직업 (궁수계열)
    4012: "헌터",
    4013: "바드",
    4014: "댄서",
    
    # 2차 직업 (복사계열)
    4015: "프리스트",
    4016: "몽크",
    
    # 2차 직업 (상인계열)
    4017: "블랙스미스",
    4018: "알케미스트",
    
    # 2차 직업 (도둑계열)
    4019: "어쌔신",
    4020: "로그",
    
    # 전승 직업
    4054: "로드나이트",
    4055: "팔라딘",
    4056: "하이위자드",
    4057: "프로페서",
    4058: "스나이퍼",
    4059: "클로운",
    4060: "집시",
    4061: "하이프리스트",
    4062: "챔피언",
    4063: "화이트스미스",
    4064: "크리에이터",
    4065: "어쌔신크로스",
    4066: "스토커",
    
    # 3차 직업
    4060: "룬나이트",
    4061: "로열가드",
    4062: "워록",
    4063: "소서러",
    4064: "레인저",
    4065: "민스트럴",
    4066: "원더러",
    4067: "아크비숍",
    4068: "수라",
    4069: "미케닉",
    4070: "제네릭",
    4071: "길로틴크로스",
    4072: "쉐도우체이서",
}

def fetch_job_skills(job_id, job_name):
    """직업별 스킬 목록 가져오기"""
    url = f"https://ragnaplace.com/ko/kro/skill/simulator/{job_id}"
    try:
        resp = requests.get(url, timeout=15, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        if resp.status_code != 200:
            return []
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # 스킬 아이템 찾기
        skills = []
        skill_items = soup.select('.skill-item, [data-skill-id]')
        
        for item in skill_items:
            skill_id = item.get('data-skill-id')
            skill_name = item.select_one('.skill-name, .name')
            if skill_id and skill_name:
                skills.append({
                    'id': int(skill_id),
                    'name': skill_name.text.strip(),
                    'jobId': job_id,
                    'jobName': job_name
                })
        
        return skills
    except Exception as e:
        print(f"Error fetching {job_name}: {e}")
        return []

def download_skill_icon(skill_id):
    """스킬 아이콘 다운로드"""
    filepath = os.path.join(OUTPUT_DIR, f"{skill_id}.png")
    if os.path.exists(filepath):
        return True
    
    urls = [
        f"https://static.divine-pride.net/images/skill/{skill_id}.png",
    ]
    
    for url in urls:
        try:
            resp = requests.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            if resp.status_code == 200 and len(resp.content) > 100:
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                return True
        except:
            pass
    return False

def main():
    print("전체 스킬 데이터 크롤링 시작...\n")
    
    all_skills = {}
    total_icons = 0
    
    for job_id, job_name in JOB_IDS.items():
        print(f"[{job_name}] 스킬 수집 중...")
        skills = fetch_job_skills(job_id, job_name)
        
        if skills:
            all_skills[job_name] = skills
            print(f"  -> {len(skills)}개 스킬 발견")
            
            # 아이콘 다운로드
            for skill in skills:
                if download_skill_icon(skill['id']):
                    total_icons += 1
        else:
            print(f"  -> 스킬 없음")
        
        time.sleep(0.5)
    
    # JSON 저장
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_skills, f, ensure_ascii=False, indent=2)
    
    print(f"\n완료!")
    print(f"- 직업: {len(all_skills)}")
    print(f"- 스킬: {sum(len(s) for s in all_skills.values())}")
    print(f"- 아이콘: {total_icons}")
    print(f"- 데이터 저장: {DATA_FILE}")

if __name__ == "__main__":
    main()
