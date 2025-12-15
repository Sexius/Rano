"""
전체 스킬 아이콘 대량 다운로드
스킬 ID 1~500까지 다운로드
"""
import os
import requests
import time

OUTPUT_DIR = "e:/RAG/rano-frontend/public/skill-icons"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def download_icon(skill_id):
    filepath = os.path.join(OUTPUT_DIR, f"{skill_id}.png")
    if os.path.exists(filepath):
        return True
    
    url = f"https://static.divine-pride.net/images/skill/{skill_id}.png"
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
    print("스킬 아이콘 대량 다운로드 시작...")
    print(f"저장 경로: {OUTPUT_DIR}\n")
    
    success = 0
    fail = 0
    
    # 스킬 ID 1~500 다운로드
    for skill_id in range(1, 501):
        if download_icon(skill_id):
            success += 1
            if success % 50 == 0:
                print(f"진행: {skill_id}/500 (성공: {success})")
        else:
            fail += 1
        time.sleep(0.1)
    
    print(f"\n완료: {success}개 다운로드, {fail}개 실패")

if __name__ == "__main__":
    main()
