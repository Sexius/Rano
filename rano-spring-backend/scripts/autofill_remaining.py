"""
Auto-fill Remaining Items Script
75건 미채움 아이템에 대해:
1) iteminfo.lua에서 다시 추출 시도 (파싱 오류 수정)
2) 이름 기반 자동 템플릿 적용

수동 입력 없음 - 완전 자동화
"""

import sqlite3
import csv
import re
from datetime import datetime

DB_PATH = "ro_market.db"
LUA_FILE = "scripts/extracted/iteminfo.lua"
REMAINING_CSV = "scripts/remaining_items_verified.csv"

# 이름 기반 자동 템플릿
NAME_TEMPLATES = {
    # 테스트 아이템
    r'테스트\d*': '개발용 테스트 아이템입니다.',
    
    # 개조/강화 상자
    r'개조\s*상자': '장비 개조에 사용되는 상자입니다.',
    r'강화': '장비 강화에 사용되는 아이템입니다.',
    r'리폼': '장비 리폼에 사용되는 아이템입니다.',
    r'업그레이드': '장비 업그레이드에 사용되는 아이템입니다.',
    r'인챈트': '인챈트에 사용되는 아이템입니다.',
    
    # 룬 관련
    r'룬': '룬 시스템에 사용되는 아이템입니다.',
    
    # 정화/의식
    r'정화': '정화 의식에 사용되는 아이템입니다.',
    
    # 추출/변환
    r'추출': '추출에 사용되는 아이템입니다.',
    r'변환': '아이템 변환에 사용됩니다.',
    
    # 봉인 관련
    r'봉인': '봉인된 아이템입니다.',
    
    # 상자/보상
    r'상자': '각종 보상이 들어있는 상자입니다.',
    r'보상': '보상 아이템입니다.',
    r'캡슐': '캡슐 아이템입니다.',
    
    # 장비 (투구, 가면 등)
    r'투구': '머리에 착용하는 장비입니다.',
    r'가면': '얼굴에 착용하는 장비입니다.',
    r'안경': '얼굴에 착용하는 장비입니다.',
    r'모자': '머리에 착용하는 장비입니다.',
    r'액세서리': '액세서리 장비입니다.',
    r'머리띠': '머리에 착용하는 장비입니다.',
    r'수염': '얼굴에 착용하는 장비입니다.',
    
    # 투척용
    r'투척용': '투척용 아이템입니다.',
    
    # 시스템 아이템
    r'카탈로그': '시스템 카탈로그입니다.',
    r'교환목록': '교환 목록 아이템입니다.',
    r'NPC용': 'NPC 전용 아이템입니다.',
    
    # 기타
    r'각인': '각인에 사용되는 아이템입니다.',
    r'부여': '효과 부여에 사용되는 아이템입니다.',
    r'판화': '판화 아이템입니다.',
    r'체인져': '변경에 사용되는 아이템입니다.',
}

# 기본 템플릿 (매칭되는 것이 없을 때)
DEFAULT_TEMPLATE = '시스템 아이템입니다.'
DEFAULT_TEMPLATE_NO_NAME = '미확인 아이템입니다.'

def decode_euckr_escape(text):
    """Lua escape sequence를 EUC-KR로 디코딩"""
    if not text:
        return text
    
    def replace_escape(match):
        byte_val = int(match.group(1))
        return chr(byte_val)
    
    decoded = re.sub(r'\\(\d{1,3})', replace_escape, text)
    
    try:
        byte_seq = decoded.encode('latin-1')
        return byte_seq.decode('euc-kr', errors='replace')
    except:
        return decoded

def load_remaining_items():
    """remaining_items_verified.csv에서 75건 item_id 로드"""
    items = []
    with open(REMAINING_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            items.append({
                'id': int(row['item_id']),
                'name': row['name'],
                'slots': int(row['slots']) if row['slots'] else 0,
                'source': row['source']
            })
    return items

def search_lua_for_description(item_id, lua_content):
    """iteminfo.lua에서 특정 아이템의 설명 재추출 시도"""
    # [item_id] = { ... } 블록 찾기
    pattern = rf'\[{item_id}\]\s*=\s*\{{([^}}]+(?:\{{[^}}]*\}}[^}}]*)*)\}}'
    match = re.search(pattern, lua_content, re.DOTALL)
    
    if not match:
        return None
    
    block = match.group(1)
    
    # identifiedDescriptionName 추출
    desc_start_match = re.search(r'identifiedDescriptionName\s*=\s*\{', block)
    if not desc_start_match:
        # unidentifiedDescriptionName 시도
        desc_start_match = re.search(r'unidentifiedDescriptionName\s*=\s*\{', block)
    
    if not desc_start_match:
        return None
    
    # 브레이스 매칭으로 설명 블록 추출
    desc_start = desc_start_match.end()
    brace_count = 1
    desc_end = desc_start
    
    for j in range(desc_start, len(block)):
        if block[j] == '{':
            brace_count += 1
        elif block[j] == '}':
            brace_count -= 1
            if brace_count == 0:
                desc_end = j
                break
    
    desc_block = block[desc_start:desc_end]
    
    # 문자열 추출
    desc_lines = re.findall(r'"([^"]*)"', desc_block)
    if not desc_lines:
        return None
    
    decoded_lines = [decode_euckr_escape(line) for line in desc_lines]
    description = '\n'.join(decoded_lines)
    
    # 빈 설명 체크
    if not description or not description.strip():
        return None
    
    return description

def generate_template_description(name):
    """이름 기반 자동 템플릿 설명 생성"""
    if not name or not name.strip():
        return DEFAULT_TEMPLATE_NO_NAME
    
    for pattern, template in NAME_TEMPLATES.items():
        if re.search(pattern, name, re.IGNORECASE):
            return template
    
    return DEFAULT_TEMPLATE

def update_item_description(conn, item_id, description, source='AUTO_TEMPLATE'):
    """DB에 설명 업데이트"""
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    
    cursor.execute("""
        UPDATE items 
        SET description = ?, source = ?, source_updated_at = ?, updated_at = ?
        WHERE id = ?
    """, (description, source, now, now, item_id))
    
    conn.commit()
    return cursor.rowcount > 0

def main():
    print("=" * 70)
    print("AUTO-FILL REMAINING ITEMS")
    print("=" * 70)
    
    # 1) 75건 로드
    remaining_items = load_remaining_items()
    print(f"\n[1] Remaining items loaded: {len(remaining_items)}")
    
    # 2) Lua 파일 로드
    print(f"\n[2] Loading Lua file: {LUA_FILE}")
    with open(LUA_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        lua_content = f.read()
    
    # 3) DB 연결
    conn = sqlite3.connect(DB_PATH)
    
    # 결과 추적
    lua_extracted = []
    template_applied = []
    unresolved = []
    
    print(f"\n[3] Processing {len(remaining_items)} items...")
    
    for item in remaining_items:
        item_id = item['id']
        name = item['name']
        
        # 1차: Lua에서 재추출 시도
        lua_desc = search_lua_for_description(item_id, lua_content)
        
        if lua_desc:
            if update_item_description(conn, item_id, lua_desc, 'LUA_REPARSE'):
                lua_extracted.append({'id': item_id, 'name': name, 'desc': lua_desc[:50]})
                continue
        
        # 2차: 템플릿 적용
        template_desc = generate_template_description(name)
        if update_item_description(conn, item_id, template_desc, 'AUTO_TEMPLATE'):
            template_applied.append({'id': item_id, 'name': name, 'desc': template_desc})
        else:
            unresolved.append({'id': item_id, 'name': name})
    
    conn.close()
    
    # 결과 리포트
    print("\n" + "=" * 70)
    print("RESULTS")
    print("=" * 70)
    
    print(f"\n[Lua 재추출 성공] {len(lua_extracted)}건")
    for item in lua_extracted[:10]:
        print(f"  [{item['id']}] {item['name']}: {item['desc']}...")
    
    print(f"\n[템플릿 적용] {len(template_applied)}건")
    for item in template_applied[:10]:
        print(f"  [{item['id']}] {item['name']}: {item['desc']}")
    if len(template_applied) > 10:
        print(f"  ... 외 {len(template_applied) - 10}건")
    
    print(f"\n[미해결] {len(unresolved)}건")
    for item in unresolved:
        print(f"  [{item['id']}] {item['name']}")
    
    # CSV 저장
    print(f"\n[4] Saving results...")
    
    with open('scripts/autofill_lua_extracted.csv', 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['item_id', 'name', 'description_preview'])
        for item in lua_extracted:
            writer.writerow([item['id'], item['name'], item['desc']])
    
    with open('scripts/autofill_template_applied.csv', 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['item_id', 'name', 'template_description'])
        for item in template_applied:
            writer.writerow([item['id'], item['name'], item['desc']])
    
    with open('scripts/autofill_unresolved.csv', 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['item_id', 'name'])
        for item in unresolved:
            writer.writerow([item['id'], item['name']])
    
    print(f"  - scripts/autofill_lua_extracted.csv ({len(lua_extracted)}건)")
    print(f"  - scripts/autofill_template_applied.csv ({len(template_applied)}건)")
    print(f"  - scripts/autofill_unresolved.csv ({len(unresolved)}건)")
    
    print("\n" + "=" * 70)
    print(f"COMPLETE: {len(lua_extracted)} Lua + {len(template_applied)} Template = {len(lua_extracted) + len(template_applied)} filled")
    print("=" * 70)

if __name__ == "__main__":
    main()
