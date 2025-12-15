"""
스킬 아이콘 다운로드 스크립트
ragnaplace.com 또는 다른 공개 소스에서 스킬 아이콘 다운로드
"""
import os
import requests
import time

# 저장 경로
ICON_DIR = "e:/RAG/rano-frontend/public/skill-icons"
os.makedirs(ICON_DIR, exist_ok=True)

# 기본 스킬 ID 목록 (검사/기사 계열)
SKILL_IDS = [
    # 검사 스킬
    (2, "한손검 수련"),
    (3, "양손검 수련"),
    (4, "HP회복력 향상"),
    (5, "배쉬"),
    (6, "프로보크"),
    (7, "매그넘 브레이크"),
    (8, "인듀어"),
    
    # 기사 스킬
    (55, "창 수련"),
    (56, "피어스"),
    (57, "브랜디쉬 스피어"),
    (58, "스피어 스탭"),
    (59, "스피어 부메랑"),
    (60, "투핸드 퀴큰"),
    (61, "오토 카운터"),
    (62, "볼링 배쉬"),
    
    # 로드나이트 스킬
    (355, "오라 블레이드"),
    (356, "패링"),
    (357, "컨센트레이션"),
    (358, "텐션 릴렉스"),
    (359, "버서크"),
    (397, "스파이럴 피어스"),
    (398, "헤드 크러쉬"),
    (399, "조인트 비트"),
]

# 아이콘 다운로드 시도 (여러 소스)
def download_icon(skill_id, name):
    # 시도할 URL 목록
    urls = [
        f"https://static.divine-pride.net/images/skill/{skill_id}.png",
        f"https://www.divine-pride.net/img/items/skill/{skill_id}",
    ]
    
    for url in urls:
        try:
            resp = requests.get(url, timeout=10, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            if resp.status_code == 200 and len(resp.content) > 100:
                filepath = os.path.join(ICON_DIR, f"{skill_id}.png")
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                print(f"OK {skill_id}: {name}")
                return True
        except Exception as e:
            pass
    
    print(f"FAIL {skill_id}: {name}")
    return False

def main():
    print(f"스킬 아이콘 다운로드 시작...")
    print(f"저장 경로: {ICON_DIR}\n")
    
    success = 0
    for skill_id, name in SKILL_IDS:
        if download_icon(skill_id, name):
            success += 1
        time.sleep(0.3)
    
    print(f"\n완료: {success}/{len(SKILL_IDS)} 다운로드")

if __name__ == "__main__":
    main()
