import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')
cursor = conn.cursor()

with open('skill_report.txt', 'w', encoding='utf-8') as f:
    f.write("=== 핵심 스킬 DB 조회 ===\n")
    skills = ['ABC_CHASING_BREAK', 'ABC_DEFT_STAB', 'ABC_ABYSS_SQUARE', 'ABC_FROM_THE_ABYSS', 
              'ABC_CHAIN_REACTION_SHOT', 'ABC_ABYSS_DAGGER', 'ABC_OMEGA_ABYSS_STRIKE',
              'MT_RUSH_STRIKE', 'MT_POWERFUL_SMASH', 'SH_CHUL_HO_BATTERING']
    
    for s in skills:
        cursor.execute("SELECT eng_name, name_kr, damage_percent, hits FROM skills WHERE eng_name=%s", (s,))
        r = cursor.fetchone()
        if r:
            f.write(f"{r[0]:35s} {r[1] or '?':20s} {r[2]:6d}% x{r[3]}회\n")
        else:
            f.write(f"{s:35s} NOT FOUND\n")
    
    f.write("\n=== 배율 상위 30개 스킬 ===\n")
    cursor.execute("SELECT eng_name, name_kr, damage_percent, hits FROM skills ORDER BY damage_percent DESC LIMIT 30")
    for r in cursor.fetchall():
        f.write(f"{r[0]:35s} {r[1] or '?':20s} {r[2]:6d}% x{r[3]}회\n")
    
    f.write("\n=== 어비스 체이서 스킬 (ABC_*) ===\n")
    cursor.execute("SELECT eng_name, name_kr, damage_percent, hits FROM skills WHERE eng_name LIKE 'ABC_%' ORDER BY damage_percent DESC")
    for r in cursor.fetchall():
        f.write(f"{r[0]:35s} {r[1] or '?':20s} {r[2]:6d}% x{r[3]}회\n")

conn.close()
print("skill_report.txt 저장 완료")
