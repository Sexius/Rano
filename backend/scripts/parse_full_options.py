import pymysql
import re
import json

# ==========================================
# [설정] DB 접속 정보
# ==========================================
DB_PASSWORD = "1234"
# ==========================================

def get_db_connection():
    return pymysql.connect(
        host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4'
    )

class UltimateParser:
    def __init__(self, skill_map):
        self.skill_map = skill_map
        
        # 1. 제련 조건 ("당" vs "시")
        # 그룹1: 제련수치, 그룹2: 시/당
        self.p_refine = re.compile(r'(\d+)제련\s?(시|당)')
        
        # 2. 등급 조건
        self.p_grade = re.compile(r'\[([A-D])등급\]')
        
        # 3. 스탯 패턴
        self.p_stat = re.compile(r'(P\.ATK|S\.MATK|ATK|MATK|CRI|HIT|FLEE|ASPD|MHP|MSP) \+ ?(\d+)')
        self.p_percent = re.compile(r'(근접 물리|원거리 물리|모든 크기|모든 종족|모든 속성|크리티컬) 데미지 (\d+)%')
        
        # 4. 세트 옵션 시작 패턴
        self.p_set_start = re.compile(r'([가-힣\s]+)와 함께 장착 시')
        self.p_cond_sum = re.compile(r'제련도 합이 (\d+) (이상|job)')
        self.p_cond_grade = re.compile(r'각 ([A-D])등급')
        self.p_auto = re.compile(r'(.*?) (\d+)레벨 (발동|시전)')
        self.p_cool = re.compile(r'(.*?) (스킬 )?쿨타임 (\d+(\.\d+)?)초 감소')

    def parse_line_stats(self, line):
        """ 한 줄에 있는 스탯/스킬증댐 추출 """
        effects = {}
        
        # 스킬 증댐
        for kor_name, eng_id in self.skill_map.items():
            if kor_name in line and ("데미지" in line or "증가" in line):
                val_match = re.search(r'(\d+)%', line)
                if val_match:
                    if 'skill_dmg' not in effects: effects['skill_dmg'] = {}
                    effects['skill_dmg'][eng_id] = int(val_match.group(1))

        # 기본 스탯
        stats = self.p_stat.findall(line)
        for stat_name, val in stats:
            key = stat_name.lower().replace('.', '_')
            effects[key] = int(val)

        # 퍼센트 스탯
        percents = self.p_percent.findall(line)
        for name, val in percents:
            if "근접 물리" in name: key = "melee_dmg"
            elif "원거리 물리" in name: key = "range_dmg"
            elif "모든 크기" in name: key = "size_all_dmg"
            elif "모든 속성" in name: key = "ele_all_dmg"
            elif "모든 종족" in name: key = "race_all_dmg"
            elif "크리티컬" in name: key = "cri_dmg"
            else: continue
            effects[key] = int(val)
            
        return effects

    def parse_description(self, desc):
        result = {
            "base": {},
            "refine": {},
            "grade": {},
            "sets": []
        }
        if not desc: return result

        # 1. 문단 나누기 (세트 옵션은 보통 뒤에 나옴)
        lines = desc.split('\n')
        
        # 모드: base, refine, grade, set
        current_mode = "base"
        current_refine_lv = 0
        current_refine_type = "시" # 시/당
        current_grade = "N"
        
        # 세트 옵션 임시 저장
        temp_set = None

        for line in lines:
            line = line.strip()
            if not line: continue

            # --- [A] 세트 옵션 감지 ---
            set_match = self.p_set_start.search(line)
            if set_match:
                current_mode = "set"
                if temp_set: result["sets"].append(temp_set)
                temp_set = {
                    "target_name": set_match.group(1).strip(),
                    "conditions": [],
                    "effects": {}
                }
                # 같은 줄에 조건/효과가 있을 수 있음, 계속 파싱
            
            if current_mode == "set" and temp_set:
                # 조건 파싱
                m_sum = self.p_cond_sum.search(line)
                if m_sum: temp_set["conditions"].append({"type": "refine_sum", "value": int(m_sum.group(1))})
                
                m_grade = self.p_cond_grade.search(line)
                if m_grade: temp_set["conditions"].append({"type": "grade_each", "value": m_grade.group(1)})

                # 효과 파싱
                effs = self.parse_line_stats(line)
                # 스탯 병합
                for k, v in effs.items():
                    if k == 'skill_dmg':
                        if 'skill_dmg' not in temp_set['effects']: temp_set['effects']['skill_dmg'] = {}
                        temp_set['effects']['skill_dmg'].update(v)
                    else:
                        temp_set['effects'][k] = v
                
                # 특수 효과 (쿨감/자동발동)
                m_cool = self.p_cool.search(line)
                if m_cool:
                    s_name = m_cool.group(1).strip()
                    # 스킬 맵핑 확인
                    for kn, en in self.skill_map.items():
                        if kn in s_name:
                             if 'cooldown' not in temp_set['effects']: temp_set['effects']['cooldown'] = {}
                             temp_set['effects']['cooldown'][en] = float(m_cool.group(3))
                             break
                
                m_auto = self.p_auto.search(line)
                if m_auto:
                    s_name = m_auto.group(1).strip()
                    for kn, en in self.skill_map.items():
                        if kn in s_name:
                             if 'auto_spell' not in temp_set['effects']: temp_set['effects']['auto_spell'] = {}
                             temp_set['effects']['auto_spell'][en] = int(m_auto.group(2))
                             break
                continue # 세트 모드일 땐 아래 로직 건너뜀

            # --- [B] 제련/등급 감지 ---
            refine_match = self.p_refine.search(line)
            grade_match = self.p_grade.search(line)

            if refine_match:
                current_mode = "refine"
                current_refine_lv = int(refine_match.group(1))
                current_refine_type = refine_match.group(2) # "시" or "당"
            elif grade_match:
                current_mode = "grade"
                current_grade = grade_match.group(1)
            
            # --- [C] 스탯 추출 및 저장 ---
            stats = self.parse_line_stats(line)
            if not stats: continue

            if current_mode == "base":
                self.merge(result["base"], stats)
                
            elif current_mode == "refine":
                if current_refine_type == "시":
                    # "7제련 시" -> 7에만 넣음
                    self.add_refine(result["refine"], current_refine_lv, stats)
                elif current_refine_type == "당":
                    # "3제련 당" -> 3, 6, 9, ... 25까지 미리 생성 (핵심!)
                    step = current_refine_lv
                    for i in range(step, 26, step):
                        self.add_refine(result["refine"], i, stats)
                        
            elif current_mode == "grade":
                if current_grade not in result["grade"]: result["grade"][current_grade] = {}
                self.merge(result["grade"][current_grade], stats)

        # 마지막 세트 저장
        if temp_set: result["sets"].append(temp_set)
        
        return result

    def add_refine(self, target_dict, lv, stats):
        lv_str = str(lv)
        if lv_str not in target_dict: target_dict[lv_str] = {}
        self.merge(target_dict[lv_str], stats)

    def merge(self, target, source):
        for k, v in source.items():
            if k == 'skill_dmg':
                if 'skill_dmg' not in target: target['skill_dmg'] = {}
                target['skill_dmg'].update(v)
            else:
                target[k] = (target.get(k, 0) + v)

def run():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("Loading Skill Map...")
    cursor.execute("SELECT name_kr, eng_name FROM skills")
    skills = {row[0]: row[1] for row in cursor.fetchall()}
    # 이름 긴 순서 정렬 (매칭 정확도 향상)
    sorted_keys = sorted(skills.keys(), key=len, reverse=True)
    sorted_skills = {k: skills[k] for k in sorted_keys}
    
    parser = UltimateParser(sorted_skills)
    
    print("Fetching Items...")
    cursor.execute("SELECT id, name_kr, description FROM items WHERE description IS NOT NULL")
    items = cursor.fetchall()
    
    print(f"Parsing {len(items)} items...")
    
    for i, item in enumerate(items):
        parsed = parser.parse_description(item[2])
        
        # DB 업데이트
        json_str = json.dumps(parsed, ensure_ascii=False)
        cursor.execute("UPDATE items SET parsed_data = %s WHERE id = %s", (json_str, item[0]))
        
        # [검증 로그] 천공 세트 확인
        if "천공의 룬 크라운" in item[1] and parsed['sets']:
            print(f"\n✨ [SET FOUND] {item[1]}")
            print(json.dumps(parsed['sets'], ensure_ascii=False, indent=2))
        
        if i % 5000 == 0: print(f"Processed {i}...")

    conn.commit()
    conn.close()
    print("\nDone.")

if __name__ == "__main__":
    run()
