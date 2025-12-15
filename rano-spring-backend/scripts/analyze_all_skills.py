"""
전체 스킬 데이터 분석 및 문제 식별 스크립트

목적:
1. 배율이 100%인 스킬 중 실제로는 공격 스킬인 것들 식별
2. 타수가 1회인데 실제로는 다중 타격인 스킬 식별
3. 배율 패턴 분석
"""
import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')
cursor = conn.cursor()

with open('skill_analysis.txt', 'w', encoding='utf-8') as f:
    
    # 1. 전체 통계
    cursor.execute("SELECT COUNT(*) FROM skills")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM skills WHERE damage_percent = 100")
    default_dmg = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM skills WHERE hits = 1")
    single_hit = cursor.fetchone()[0]
    
    f.write("=" * 70 + "\n")
    f.write("전체 스킬 데이터 분석\n")
    f.write("=" * 70 + "\n\n")
    f.write(f"총 스킬 수: {total}\n")
    f.write(f"배율 = 100% (기본값): {default_dmg}\n")
    f.write(f"타수 = 1회: {single_hit}\n\n")
    
    # 2. 4차 직업 스킬 접두사별 분석
    prefixes = ['ABC_', 'MT_', 'SH_', 'WH_', 'IG_', 'IQ_', 'CD_', 'EM_', 'TR_', 
                'DK_', 'AG_', 'BO_', 'SS_', 'SP_', 'SKE_', 'NW_', 'SOA_', 'HN_']
    
    f.write("=" * 70 + "\n")
    f.write("4차 직업 스킬 분석 (접두사별)\n")
    f.write("=" * 70 + "\n\n")
    
    problem_skills = []
    
    for prefix in prefixes:
        cursor.execute(f"""
            SELECT eng_name, name_kr, damage_percent, hits 
            FROM skills 
            WHERE eng_name LIKE '{prefix}%'
            ORDER BY damage_percent DESC
        """)
        skills = cursor.fetchall()
        
        if not skills:
            continue
        
        f.write(f"\n### {prefix[:-1]} 스킬 ({len(skills)}개) ###\n")
        f.write("-" * 50 + "\n")
        
        for eng, name, dmg, hits in skills:
            status = ""
            # 문제 식별
            if dmg == 100 and name and ('스트라이크' in name or '브레이크' in name or 
                '스탭' in name or '샷' in name or '블래스트' in name or
                '어택' in name or '슬래시' in name):
                status = " ⚠️ 파싱실패?"
                problem_skills.append((eng, name, dmg, hits))
            elif dmg > 100 and hits == 1 and name and ('난무' in name or '연타' in name or '다중' in name):
                status = " ⚠️ 타수확인필요"
                problem_skills.append((eng, name, dmg, hits))
            
            f.write(f"  {eng:40s} {name or '?':20s} {dmg:6d}% x{hits}회{status}\n")
    
    # 3. 문제 스킬 요약
    f.write("\n" + "=" * 70 + "\n")
    f.write("⚠️ 검토 필요 스킬 목록\n")
    f.write("=" * 70 + "\n")
    for eng, name, dmg, hits in problem_skills:
        f.write(f"  {eng:40s} {name or '?':20s} {dmg:6d}% x{hits}회\n")
    
    # 4. 배율 분포
    f.write("\n" + "=" * 70 + "\n")
    f.write("배율 분포 (100% 이상)\n")
    f.write("=" * 70 + "\n")
    cursor.execute("""
        SELECT 
            CASE 
                WHEN damage_percent <= 100 THEN '100% 이하'
                WHEN damage_percent <= 1000 THEN '101-1000%'
                WHEN damage_percent <= 5000 THEN '1001-5000%'
                WHEN damage_percent <= 10000 THEN '5001-10000%'
                ELSE '10000% 초과'
            END as range_label,
            COUNT(*) as cnt
        FROM skills
        GROUP BY range_label
        ORDER BY MIN(damage_percent)
    """)
    for r in cursor.fetchall():
        f.write(f"  {r[0]:15s}: {r[1]}개\n")

conn.close()
print("skill_analysis.txt 저장 완료")
