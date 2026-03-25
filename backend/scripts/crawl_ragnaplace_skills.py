"""
ragnaplace.com에서 스킬 데이터 크롤링
모든 직업의 정확한 스킬 정보 추출
"""
import requests
from bs4 import BeautifulSoup
import json
import time
import re

# 직업 ID 매핑 (ragnaplace.com 기준)
JOB_IDS = {
    # 1차 직업
    "검사": 4002,
    "마법사": 4003,
    "궁수": 4004,
    "복사": 4005,
    "상인": 4006,
    "도둑": 4007,
    
    # 2차 직업
    "기사": 4008,
    "크루세이더": 4009,
    "위자드": 4010,
    "세이지": 4011,
    "헌터": 4012,
    "바드": 4013,
    "댄서": 4014,
    "프리스트": 4015,
    "몽크": 4016,
    "블랙스미스": 4017,
    "알케미스트": 4018,
    "어쌔신": 4019,
    "로그": 4020,
    
    # 3차 직업
    "룬나이트": 4060,
    "로열가드": 4061,
    "워록": 4062,
    "소서러": 4063,
    "레인저": 4064,
    "민스트럴": 4065,
    "원더러": 4066,
    "아크비숍": 4067,
    "수라": 4068,
    "미케닉": 4069,
    "제네릭": 4070,
    "길로틴크로스": 4071,
    "쉐도우체이서": 4072,
}

def fetch_job_skills(job_name, job_id):
    """ragnaplace.com에서 직업별 스킬 정보 가져오기"""
    url = f"https://ragnaplace.com/ko/kro/skill/simulator?j={job_id}"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        resp = requests.get(url, headers=headers, timeout=15)
        
        if resp.status_code != 200:
            print(f"[{job_name}] 실패: HTTP {resp.status_code}")
            return []
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        skills = []
        # 스킬 링크에서 ID와 이름 추출
        skill_links = soup.select('a[href*="/ko/kro/skill/"]')
        
        for link in skill_links:
            href = link.get('href', '')
            match = re.search(r'/skill/(\d+)', href)
            if match:
                skill_id = int(match.group(1))
                skill_name_elem = link.select_one('.skill-name, div')
                skill_name = skill_name_elem.text.strip() if skill_name_elem else ''
                
                if skill_name and skill_id:
                    skills.append({
                        'id': skill_id,
                        'name': skill_name,
                        'job': job_name
                    })
        
        return skills
    except Exception as e:
        print(f"[{job_name}] 오류: {e}")
        return []

def main():
    print("ragnaplace.com 스킬 데이터 크롤링 시작...\n")
    
    all_skills = {}
    
    for job_name, job_id in JOB_IDS.items():
        print(f"[{job_name}] 스킬 수집 중...")
        skills = fetch_job_skills(job_name, job_id)
        
        if skills:
            all_skills[job_name] = skills
            print(f"  -> {len(skills)}개 스킬 발견")
        else:
            print(f"  -> 스킬 없음")
        
        time.sleep(1)
    
    # JSON 저장
    output_file = "e:/RAG/rano-frontend/src/data/verified_skills.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_skills, f, ensure_ascii=False, indent=2)
    
    print(f"\n완료! 데이터 저장: {output_file}")
    print(f"총 직업: {len(all_skills)}")
    print(f"총 스킬: {sum(len(s) for s in all_skills.values())}")

if __name__ == "__main__":
    main()
