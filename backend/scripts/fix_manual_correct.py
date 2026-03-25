"""
스킬 데이터 수동 수정 스크립트
- 인게임 스크린샷 기준 정확한 값

데프트 스탭 (ABC_DEFT_STAB):
  - Lv10: 1회당 ATK 6200% / 범위: 7x7셀
  - "대상에게 근접 물리 데미지를 5회 준다"
  → 6200% × 5회

체이싱 브레이크 (ABC_CHASING_BREAK):
  - Lv5: 1회당 ATK 3800% / 4250%(체이싱)
  - "근접 물리 데미지 5회 입힌다"
  - "체이싱 효과 중일 경우 더 큰 데미지를 7회 입힌다"
  → 일반: 3800% × 5회
  → 체이싱: 4250% × 7회
  
체이싱 기준으로 4250% × 7회 적용
"""
import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')
cursor = conn.cursor()

# 인게임 스크린샷 기준 정확한 값
updates = [
    ('ABC_DEFT_STAB', 6200, 5),
    ('ABC_CHASING_BREAK', 4250, 7),  # 체이싱 효과 기준
]

for eng_name, dmg, hits in updates:
    cursor.execute("SELECT name_kr, damage_percent, hits FROM skills WHERE eng_name = %s", (eng_name,))
    row = cursor.fetchone()
    if row:
        print(f"{row[0]}: {row[1]}% × {row[2]}회 → {dmg}% × {hits}회")
        cursor.execute("UPDATE skills SET damage_percent = %s, hits = %s WHERE eng_name = %s", (dmg, hits, eng_name))

conn.commit()
conn.close()
print("\n✅ 수정 완료! 백엔드 재시작 필요")
