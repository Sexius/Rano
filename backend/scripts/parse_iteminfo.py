# -*- coding: utf-8 -*-
"""
Lua iteminfo.lua 파서 및 DB 저장
디컴파일된 iteminfo.lua 파일을 파싱하여 SQLite DB에 저장합니다.
"""

import re
import json
import sqlite3
import os

# 설정
ITEMINFO_LUA_PATH = r"e:\RAG\rano-spring-backend\scripts\extracted\iteminfo.lua"
DB_PATH = r"e:\RAG\rano-spring-backend\ro_market.db"


def parse_iteminfo_lua(filepath):
    """iteminfo.lua 파일을 파싱하여 아이템 정보 추출"""
    print(f"파일 읽기: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    print(f"파일 크기: {len(content):,} bytes")
    
    items = {}
    
    # 아이템 블록 패턴: [아이템ID] = { ... }
    # 예: [12754] = { unidentifiedDisplayName = "...", ... }
    
    # 먼저 모든 아이템 ID 찾기
    item_pattern = r'\[(\d+)\]\s*=\s*\{'
    item_matches = list(re.finditer(item_pattern, content))
    
    print(f"발견된 아이템 수: {len(item_matches):,}")
    
    for i, match in enumerate(item_matches):
        item_id = int(match.group(1))
        start_pos = match.end()
        
        # 다음 아이템 시작 위치 또는 파일 끝
        if i + 1 < len(item_matches):
            end_pos = item_matches[i + 1].start()
        else:
            end_pos = len(content)
        
        item_block = content[start_pos:end_pos]
        
        # 각 필드 추출
        item = {'id': item_id}
        
        # 줄 단위로 파싱하여 정확한 필드 추출
        lines = item_block.split('\n')
        for line in lines:
            line = line.strip()
            
            # identifiedDisplayName 추출
            if line.startswith('identifiedDisplayName') and '=' in line:
                match_val = re.search(r'identifiedDisplayName\s*=\s*"([^"]*)"', line)
                if match_val:
                    item['name'] = decode_lua_string(match_val.group(1))
            
            # unidentifiedDisplayName 추출
            elif line.startswith('unidentifiedDisplayName') and '=' in line:
                match_val = re.search(r'unidentifiedDisplayName\s*=\s*"([^"]*)"', line)
                if match_val:
                    item['unidentified_name'] = decode_lua_string(match_val.group(1))
            
            # slotCount 추출
            elif 'slotCount' in line:
                match_val = re.search(r'slotCount\s*=\s*(\d+)', line)
                if match_val:
                    item['slots'] = int(match_val.group(1))
            
            # ClassNum 추출
            elif 'ClassNum' in line:
                match_val = re.search(r'ClassNum\s*=\s*(\d+)', line)
                if match_val:
                    item['class_num'] = int(match_val.group(1))
        
        # 이름이 없으면 unidentified_name 사용
        if not item.get('name') and item.get('unidentified_name'):
            item['name'] = item['unidentified_name']
        
        # ID가 있으면 저장
        items[item_id] = item
        
        # 진행 상황 출력
        if (i + 1) % 5000 == 0:
            print(f"  처리 중: {i + 1:,} / {len(item_matches):,}")
    
    return items


def decode_lua_string(s):
    """Lua 이스케이프 시퀀스를 디코딩"""
    if not s:
        return ''
    
    # \숫자 형태를 바이트로 변환
    result_bytes = bytearray()
    i = 0
    while i < len(s):
        if s[i] == '\\' and i + 1 < len(s):
            # 이스케이프 시퀀스 처리
            j = i + 1
            num_str = ''
            while j < len(s) and s[j].isdigit() and len(num_str) < 3:
                num_str += s[j]
                j += 1
            
            if num_str:
                # \숫자 -> 바이트
                byte_val = int(num_str)
                if byte_val < 256:
                    result_bytes.append(byte_val)
                    i = j
                    continue
            else:
                # 다른 이스케이프 문자 처리
                if i + 1 < len(s):
                    c = s[i + 1]
                    if c == 'n':
                        result_bytes.append(ord('\n'))
                    elif c == 't':
                        result_bytes.append(ord('\t'))
                    elif c == '\\':
                        result_bytes.append(ord('\\'))
                    elif c == '"':
                        result_bytes.append(ord('"'))
                    else:
                        result_bytes.append(ord(c))
                    i += 2
                    continue
        
        # 일반 문자
        result_bytes.append(ord(s[i]))
        i += 1
    
    # EUC-KR로 디코딩 시도
    try:
        return bytes(result_bytes).decode('euc-kr')
    except:
        try:
            return bytes(result_bytes).decode('utf-8', errors='replace')
        except:
            return bytes(result_bytes).decode('latin-1', errors='replace')


def save_to_database(items):
    """추출된 아이템 정보를 SQLite DB에 저장"""
    print(f"\nDB 저장 시작: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 기존 items 테이블 삭제 후 재생성 (스키마 맞추기)
    cursor.execute('DROP TABLE IF EXISTS items')
    cursor.execute('''
        CREATE TABLE items (
            id INTEGER PRIMARY KEY,
            name_kr TEXT,
            description TEXT,
            slots INTEGER DEFAULT 0,
            raw_data TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            item_type INTEGER DEFAULT 0,
            class_num INTEGER DEFAULT 0
        )
    ''')
    
    # 데이터 삽입
    count = 0
    for item_id, item in items.items():
        cursor.execute('''
            INSERT INTO items (id, name_kr, description, slots, raw_data, class_num, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (
            item_id,
            item.get('name', ''),
            item.get('description', ''),
            item.get('slots', 0),
            json.dumps(item, ensure_ascii=False),
            item.get('class_num', 0)
        ))
        count += 1
        
        if count % 5000 == 0:
            print(f"  저장 중: {count:,}")
    
    conn.commit()
    conn.close()
    
    print(f"✓ {count:,}개 아이템 저장 완료!")
    return count


def main():
    """메인 실행"""
    print("=" * 60)
    print("  라그나로크 아이템 정보 파서 (iteminfo.lua)")
    print("=" * 60)
    
    if not os.path.exists(ITEMINFO_LUA_PATH):
        print(f"Error: 파일을 찾을 수 없습니다: {ITEMINFO_LUA_PATH}")
        return 1
    
    # 1. Lua 파일 파싱
    items = parse_iteminfo_lua(ITEMINFO_LUA_PATH)
    
    print(f"\n총 파싱된 아이템: {len(items):,}개")
    
    # 샘플 출력
    print("\n샘플 아이템 (처음 10개):")
    for i, (item_id, item) in enumerate(list(items.items())[:10]):
        print(f"  [{item_id}] {item.get('name', 'N/A')} (슬롯: {item.get('slots', 0)})")
    
    # 2. DB 저장
    save_to_database(items)
    
    # 3. 결과 JSON 저장
    output_json = os.path.join(os.path.dirname(ITEMINFO_LUA_PATH), 'items_parsed.json')
    sample_items = dict(list(items.items())[:100])  # 샘플 100개만
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(sample_items, f, ensure_ascii=False, indent=2)
    print(f"\n샘플 JSON 저장: {output_json}")
    
    print("\n" + "=" * 60)
    print("  완료!")
    print("=" * 60)
    
    return 0


if __name__ == '__main__':
    exit(main())
