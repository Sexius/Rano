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
        
        # [강제 교정] 스킬 매핑 오류 수정 (매우 중요)
        self.skill_map['데프트 스탭'] = 'ABC_DEFT_STAB' 
        self.skill_map['체이싱 브레이크'] = 'ABC_CHASING_BREAK'
        self.skill_map['어비스 스퀘어'] = 'ABC_ABYSS_SQUARE'
        self.skill_map['프롬 디 어비스'] = 'ABC_FROM_THE_ABYSS'
        self.skill_map['체인 리액션 샷'] = 'ABC_CHAIN_REACTION_SHOT'
        
        # 1. 제련 조건
        self.p_refine = re.compile(r'(\d+)제련\s?(시|당)')
        # 2. 등급 조건
        self.p_grade = re.compile(r'\[([A-D])등급\]')
        # 3. 기본 스탯
        self.p_stat = re.compile(r'(P\.ATK|S\.MATK|ATK|MATK|CRI|HIT|FLEE|ASPD|MHP|MSP|DEF|MDEF) \+ ?(\d+)')
        
        # 4. [핵심 수정] 상세 퍼센트 옵션 (우선순위 적용)
        # 긴 단어, 구체적인 단어를 먼저 찾도록 리스트로 관리
        self.p_percent_detail = [
            (re.compile(r'모든 크기.*?(\d+)%'), 'size_all_dmg'),
            (re.compile(r'모든 속성.*?(\d+)%'), 'ele_all_dmg'),
            (re.compile(r'모든 종족.*?(\d+)%'), 'race_all_dmg'),
            (re.compile(r'크리티컬 데미지.*?(\d+)%'), 'cri_dmg'),
            (re.compile(r'변동 캐스팅.*?(\d+)%'), 'vcast_red'),
            (re.compile(r'글로벌 쿨타임.*?(\d+)%'), 'gcool_red'),
            (re.compile(r'스킬 후 딜레이.*?(\d+)%'), 'after_delay_red'),
            # 근접/원거리는 위 조건들이 없을 때만 매칭되도록 뒤에 배치
            (re.compile(r'근접 물리.*?(\d+)%'), 'melee_dmg'),
            (re.compile(r'원거리 물리.*?(\d+)%'), 'range_dmg'),
            (re.compile(r'명중 물리.*?(\d+)%'), 'melee_dmg'), # 명중 물리는 근접으로 처리
        ]

        # 5. 세트 옵션
        self.p_set_start = re.compile(r'([가-힣\s]+)와 함께 장착 시')
        self.p_cond_sum = re.compile(r'제련도 합이 (\d+)')
        self.p_cond_grade = re.compile(r'각 ([A-D])등급')
        self.p_auto = re.compile(r'(.*?) (\d+)레벨 (발동|시전)')
        self.p_cool = re.compile(r'(.*?) (스킬 )?쿨타임 (\d+(\.\d+)?)초 감소')

    def parse_line_stats(self, line):
        effects = {}
        
        # [A] 스킬 증댐
        for kor_name, eng_id in self.skill_map.items():
            if kor_name in line and ("데미지" in line or "증가" in line):
                val_match = re.search(r'(\d+)%', line)
                if val_match:
                    if 'skill_dmg' not in effects: effects['skill_dmg'] = {}
                    effects['skill_dmg'][eng_id] = int(val_match.group(1))

        # [B] 상세 퍼센트 옵션 (크기, 종족 등)
        # 리스트를 순회하며 각각 체크 (하나의 줄에 여러 옵션이 있어도 다 잡음)
        for pattern, key in self.p_percent_detail:
            m = pattern.search(line)
            if m:
                # 이미 찾은 스탯은 건너뛰거나, 합산 (여기선 덮어쓰기)
                effects[key] = int(m.group(1))

        # [C] 기본 스탯 (P.ATK 등)
        stats = self.p_stat.findall(line)
        for stat_name, val in stats:
            key = stat_name.lower().replace('.', '_')
            effects[key] = int(val)
            
        return effects

    def parse_description(self, desc):
        result = {"base": {}, "refine": {}, "grade": {}, "sets": []}
        if not desc: return result
        
        lines = desc.split('\n')
        current_mode = "base"
        current_val = 0
        current_type = "시"
        current_grade = "N"
        temp_set = None

        for line in lines:
            line = line.strip()
            if not line: continue

            # 1. 세트 옵션 감지
            set_match = self.p_set_start.search(line)
            if set_match:
                current_mode = "set"
                if temp_set: result["sets"].append(temp_set)
                temp_set = {"target_name": set_match.group(1).strip(), "conditions": [], "effects": {}}
            
            if current_mode == "set" and temp_set:
                if "제련도 합" in line:
                    m = self.p_cond_sum.search(line)
                    if m: temp_set["conditions"].append({"type": "refine_sum", "value": int(m.group(1))})
                if "각" in line and "등급" in line:
                    m = self.p_cond_grade.search(line)
                    if m: temp_set["conditions"].append({"type": "grade_each", "value": m.group(1)})
                
                # 세트 효과 파싱
                effs = self.parse_line_stats(line)
                self.merge(temp_set["effects"], effs)
                
                # 쿨감/자동발동 파싱
                m_cool = self.p_cool.search(line)
                if m_cool:
                    s_name = m_cool.group(1).strip()
                    for kn, en in self.skill_map.items():
                        if kn in s_name:
                             if 'cooldown' not in temp_set['effects']: temp_set['effects']['cooldown'] = {}
                             temp_set['effects']['cooldown'][en] = float(m_cool.group(3))
                             break
                continue

            # 2. 제련/등급 모드 전환
            ref_m = self.p_refine.search(line)
            grd_m = self.p_grade.search(line)
            
            if ref_m:
                current_mode = "refine"
                current_val = int(ref_m.group(1))
                current_type = ref_m.group(2)
            elif grd_m:
                current_mode = "grade"
                current_grade = grd_m.group(1)

            # 3. 스탯 추출
            effs = self.parse_line_stats(line)
            if not effs: continue

            if current_mode == "base":
                self.merge(result["base"], effs)
            elif current_mode == "refine":
                if current_type == "시":
                    self.add_refine(result["refine"], current_val, effs)
                elif current_type == "당":
                    # [핵심] 당 옵션은 25강까지 꽉 채워넣기
                    for i in range(current_val, 26, current_val):
                        self.add_refine(result["refine"], i, effs)
            elif current_mode == "grade":
                if current_grade not in result["grade"]: result["grade"][current_grade] = {}
                self.merge(result["grade"][current_grade], effs)

        if temp_set: result["sets"].append(temp_set)
        return result

    def add_refine(self, target_dict, lv, effs):
        slv = str(lv)
        if slv not in target_dict: target_dict[slv] = {}
        self.merge(target_dict[slv], effs)

    def merge(self, target, source):
        for k, v in source.items():
            if k == 'skill_dmg':
                if 'skill_dmg' not in target: target['skill_dmg'] = {}
                target['skill_dmg'].update(v)
            elif k in ['cooldown', 'auto_spell']:
                if k not in target: target[k] = {}
                target[k].update(v)
            else:
                target[k] = target.get(k, 0) + v

def run():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("Loading Skill Map...")
    cursor.execute("SELECT name_kr, eng_name FROM skills")
    skills = {row[0]: row[1] for row in cursor.fetchall()}
    # 이름 긴 순서 정렬
    sorted_keys = sorted(skills.keys(), key=len, reverse=True)
    sorted_skills = {k: skills[k] for k in sorted_keys}
    
    parser = UltimateParser(sorted_skills)
    
    print("Fetching Items...")
    cursor.execute("SELECT id, name_kr, description FROM items WHERE description IS NOT NULL")
    items = cursor.fetchall()
    
    print(f"Parsing {len(items)} items...")
    
    for i, item in enumerate(items):
        parsed = parser.parse_description(item[2])
        json_str = json.dumps(parsed, ensure_ascii=False)
        cursor.execute("UPDATE items SET parsed_data = %s WHERE id = %s", (json_str, item[0]))
        
        # [검증 로그] 천공의 룬 크라운
        if item[0] == 401059: 
            print(f"\n✨ [CHECK] {item[1]}")
            if 'grade' in parsed and 'B' in parsed['grade']:
                print(f"   -> B등급 옵션: {parsed['grade']['B']}") 
                # 여기서 size_all_dmg가 나와야 성공!
            if parsed['sets']:
                print(f"   -> Set Target: {parsed['sets'][0]['target_name']}")
                print(f"   -> Set Effects: {parsed['sets'][0]['effects']}")

    conn.commit()
    conn.close()
    print("\nDone.")

if __name__ == "__main__":
    run()
