# 스킬 파서 사용 가이드

## 파일 위치
- **스크립트**: `e:\RAG\rano-spring-backend\scripts\skill_parser.py`

## 사용 방법

### 1. 기본 사용
```bash
cd e:\RAG\rano-spring-backend\scripts
python skill_parser.py <skillinfolist.lua 경로> [출력파일.json]
```

### 2. 예시
```bash
# 현재 폴더에 skillinfolist.lua가 있을 때
python skill_parser.py skillinfolist.lua skills.json

# 다른 폴더의 파일 파싱
python skill_parser.py "C:\Ragnarok\System\LuaFiles514\skillinfolist.lua" skills.json
```

## 출력 형식 (JSON)

```json
[
  {
    "skill_id": "SP_SOULENERGY",
    "name_kr": "영혼 에너지 연구",
    "max_level": 5,
    "sp_cost": [0, 0, 0, 0, 0],
    "is_passive": true,
    "attack_range": [1, 1, 1, 1, 1],
    "prerequisites": [
      {
        "skill_id": "SP_SOULCOLLECT",
        "level": 1
      }
    ]
  }
]
```

## 파싱되는 정보
- ✅ `skill_id`: 스킬 ID (SKID 상수)
- ✅ `name_kr`: 한글 이름 (SkillName)
- ✅ `max_level`: 최대 레벨 (MaxLv)
- ✅ `sp_cost`: 레벨별 SP 소모량
- ✅ `is_passive`: 패시브 스킬 여부
- ✅ `attack_range`: 레벨별 사거리
- ✅ `prerequisites`: 선행 스킬 요구사항

## 인코딩 처리
스크립트는 자동으로 여러 인코딩을 시도합니다:
1. `cp949` (한국 윈도우 기본)
2. `euc-kr`
3. `utf-8`

## 다음 단계

### 1. JSON → Database 임포트
```python
# import_skills.py 예시
import json
import mysql.connector

with open('skills.json', 'r', encoding='utf-8') as f:
    skills = json.load(f)

# MySQL 연결
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='your_password',
    database='ragnarok'
)

cursor = conn.cursor()

for skill in skills:
    cursor.execute("""
        INSERT INTO skill_info (skill_id, name_kr, max_level, sp_cost, is_passive)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        skill['skill_id'],
        skill['name_kr'],
        skill['max_level'],
        json.dumps(skill['sp_cost']),
        skill['is_passive']
    ))

conn.commit()
```

### 2. Spring Boot에서 사용
```java
@RestController
@RequestMapping("/api/skills")
public class SkillController {
    
    @Autowired
    private SkillRepository skillRepository;
    
    @GetMapping("/search")
    public List<Skill> searchSkills(@RequestParam String keyword) {
        return skillRepository.findByNameKrContaining(keyword);
    }
}
```

## 문제 해결

### 한글이 깨져 나올 때
- `.lua` 파일의 인코딩이 `cp949`가 아닐 수 있습니다
- 메모장++로 열어서 인코딩 확인: `인코딩 > 문자 집합 > 한국어 > EUC-KR`

### 파싱 실패 시
1. Lua 파일이 올바른 형식인지 확인
2. Python 3.7+ 사용 확인
3. 정규식 패턴이 실제 파일 구조와 맞는지 확인
