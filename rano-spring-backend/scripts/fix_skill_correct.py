"""
스킬 데이터 수정 스크립트 - 실제 인게임 값 기준

실제 인게임 데이터:
- 데프트 스탭 (ABC_DEFT_STAB): Lv10 = 6200% × 5회
- 체이싱 브레이크 (ABC_CHASING_BREAK): 
  - 일반: 3800% × 5회
  - 체이싱: 4250% × 7회 (체이싱 효과 중)
"""
import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')
cursor = conn.cursor()

# 실제 인게임 데이터 기준 수정
updates = [
    # (eng_name, damage_percent, hits, 설명)
    ('ABC_DEFT_STAB', 6200, 5, '데프트 스탭: Lv10 = 6200% × 5회'),
    ('ABC_CHASING_BREAK', 4250, 7, '체이싱 브레이크: 체이싱 중 4250% × 7회'),  # 체이싱 효과 기준
]

print("=" * 60)
print("스킬 데이터 수정 (인게임 실제 값 기준)")
print("=" * 60)

for eng_name, dmg, hits, desc in updates:
    # 현재 값 확인
    cursor.execute("SELECT name_kr, damage_percent, hits FROM skills WHERE eng_name = %s", (eng_name,))
    row = cursor.fetchone()
    if row:
        print(f"\n{desc}")
        print(f"  현재: {row[0]} = {row[1]}% × {row[2]}회")
        
        # 업데이트
        cursor.execute(
            "UPDATE skills SET damage_percent = %s, hits = %s WHERE eng_name = %s",
            (dmg, hits, eng_name)
        )
        print(f"  수정: {row[0]} = {dmg}% × {hits}회 ✅")
    else:
        print(f"\n⚠️ {eng_name} 스킬을 찾을 수 없습니다.")

conn.commit()
conn.close()

print("\n" + "=" * 60)
print("🎉 수정 완료! 백엔드 서버를 재시작하세요.")
print("=" * 60)
