# -*- coding: utf-8 -*-
"""
GRF Item Extractor for Ragnarok Online
게임 클라이언트의 data.grf에서 아이템 정보를 추출합니다.
"""

import os
import sys
import json
import sqlite3
import re
from pathlib import Path

# GRF 파일 경로 설정
GRF_PATH = r"C:\Users\KJM\Desktop\게임\Ragnarok_250317\data.grf"
DB_PATH = r"e:\RAG\rano-spring-backend\ro_market.db"
OUTPUT_DIR = r"e:\RAG\rano-spring-backend\scripts\extracted"

def test_grf_access():
    """GRF 파일 접근 테스트"""
    print("=" * 50)
    print("GRF 파일 접근 테스트")
    print("=" * 50)
    
    try:
        from PyGRF import PyGRF
        print(f"✓ PyGRF 라이브러리 로드 성공")
    except ImportError as e:
        print(f"✗ PyGRF 라이브러리 로드 실패: {e}")
        return False
    
    if not os.path.exists(GRF_PATH):
        print(f"✗ GRF 파일을 찾을 수 없습니다: {GRF_PATH}")
        return False
    
    file_size = os.path.getsize(GRF_PATH) / (1024 * 1024 * 1024)
    print(f"✓ GRF 파일 발견: {file_size:.2f} GB")
    
    try:
        print("GRF 파일 열기 시도 중...")
        grf = GrfFile(GRF_PATH)
        file_count = len(grf.files)
        print(f"✓ GRF 파일 열기 성공")
        print(f"  - 총 파일 수: {file_count:,}")
        
        # iteminfo 관련 파일 찾기
        item_files = []
        system_files = []
        for file_path in grf.files:
            lower_path = file_path.lower()
            if 'iteminfo' in lower_path:
                item_files.append(file_path)
            if 'system' in lower_path and (lower_path.endswith('.lub') or lower_path.endswith('.lua')):
                system_files.append(file_path)
        
        print(f"\n아이템 관련 파일:")
        for f in item_files[:20]:  # 처음 20개만 표시
            print(f"  - {f}")
        
        if len(item_files) > 20:
            print(f"  ... 외 {len(item_files) - 20}개")
        
        print(f"\nSystem 폴더 Lua 파일:")
        for f in system_files[:20]:
            print(f"  - {f}")
        
        if len(system_files) > 20:
            print(f"  ... 외 {len(system_files) - 20}개")
        
        grf.close()
        return True
        
    except Exception as e:
        print(f"✗ GRF 파일 열기 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


def extract_iteminfo():
    """iteminfo.lub 파일을 추출합니다."""
    from pygrf import GrfFile
    
    print("\n" + "=" * 50)
    print("iteminfo 파일 추출")
    print("=" * 50)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    grf = GrfFile(GRF_PATH)
    
    # 찾을 파일 목록
    target_files = [
        'data\\lua files\\datainfo\\iteminfo.lub',
        'data\\lua files\\datainfo\\iteminfo.lua',
        'data\\luafiles514\\lua files\\datainfo\\iteminfo.lub',
        'data\\luafiles514\\lua files\\datainfo\\iteminfo.lua',
        'System\\iteminfo.lub',
        'System\\iteminfo.lua',
    ]
    
    extracted = []
    for target in target_files:
        # 대소문자 무시하고 검색
        for file_path in grf.files:
            if file_path.lower() == target.lower() or file_path.lower().endswith(target.lower().split('\\')[-1]):
                try:
                    content = grf.read(file_path)
                    output_name = file_path.replace('\\', '_').replace('/', '_')
                    output_path = os.path.join(OUTPUT_DIR, output_name)
                    
                    with open(output_path, 'wb') as f:
                        f.write(content)
                    
                    print(f"✓ 추출 완료: {file_path}")
                    print(f"  -> {output_path} ({len(content):,} bytes)")
                    extracted.append(output_path)
                except Exception as e:
                    print(f"✗ 추출 실패 ({file_path}): {e}")
    
    grf.close()
    
    if not extracted:
        print("✗ iteminfo 파일을 찾을 수 없습니다.")
        # 파일 목록에서 유사한 파일 검색
        print("\n사용 가능한 lua/lub 파일 목록 검색 중...")
        grf = GrfFile(GRF_PATH)
        lua_files = [f for f in grf.files if f.lower().endswith(('.lua', '.lub'))]
        grf.close()
        
        print(f"총 {len(lua_files)}개의 Lua 파일 발견")
        for f in lua_files[:50]:
            print(f"  - {f}")
        if len(lua_files) > 50:
            print(f"  ... 외 {len(lua_files) - 50}개")
    
    return extracted


def parse_iteminfo_lua(lua_content):
    """Lua 형식의 iteminfo를 파싱합니다."""
    items = {}
    
    # 바이너리인 경우 디코딩 시도
    if isinstance(lua_content, bytes):
        try:
            lua_content = lua_content.decode('utf-8')
        except:
            try:
                lua_content = lua_content.decode('euc-kr')
            except:
                print("✗ 파일 디코딩 실패 (바이너리 .lub 파일일 수 있음)")
                return items
    
    # 아이템 정의 패턴 찾기
    # [아이템ID] = { ... } 형식
    pattern = r'\[(\d+)\]\s*=\s*\{([^}]+)\}'
    matches = re.findall(pattern, lua_content, re.DOTALL)
    
    for item_id, item_data in matches:
        item = {'id': int(item_id)}
        
        # 각 필드 파싱
        fields = {
            'unidentifiedDisplayName': r'unidentifiedDisplayName\s*=\s*"([^"]*)"',
            'identifiedDisplayName': r'identifiedDisplayName\s*=\s*"([^"]*)"',
            'slotCount': r'slotCount\s*=\s*(\d+)',
            'ClassNum': r'ClassNum\s*=\s*(\d+)',
        }
        
        for field_name, field_pattern in fields.items():
            match = re.search(field_pattern, item_data)
            if match:
                value = match.group(1)
                if field_name in ['slotCount', 'ClassNum']:
                    value = int(value)
                item[field_name] = value
        
        # 설명 파싱 (여러 줄)
        desc_match = re.search(r'identifiedDescriptionName\s*=\s*\{([^}]+)\}', item_data, re.DOTALL)
        if desc_match:
            desc_lines = re.findall(r'"([^"]*)"', desc_match.group(1))
            item['description'] = '\n'.join(desc_lines)
        
        if item.get('identifiedDisplayName'):
            items[int(item_id)] = item
    
    return items


def save_to_database(items):
    """추출된 아이템 정보를 SQLite DB에 저장합니다."""
    print("\n" + "=" * 50)
    print("데이터베이스 저장")
    print("=" * 50)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 테이블 존재 확인 및 컬럼 추가
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name_kr TEXT,
            description TEXT,
            slots INTEGER,
            raw_data JSON,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            item_type INTEGER,
            class_num INTEGER
        )
    ''')
    
    # 기존 테이블에 컬럼 추가 시도
    try:
        cursor.execute('ALTER TABLE items ADD COLUMN item_type INTEGER')
    except:
        pass
    
    try:
        cursor.execute('ALTER TABLE items ADD COLUMN class_num INTEGER')
    except:
        pass
    
    # 데이터 삽입/업데이트
    count = 0
    for item_id, item in items.items():
        cursor.execute('''
            INSERT OR REPLACE INTO items (id, name_kr, description, slots, raw_data, class_num, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (
            item_id,
            item.get('identifiedDisplayName', ''),
            item.get('description', ''),
            item.get('slotCount', 0),
            json.dumps(item, ensure_ascii=False),
            item.get('ClassNum', 0)
        ))
        count += 1
    
    conn.commit()
    conn.close()
    
    print(f"✓ {count:,}개의 아이템이 저장되었습니다.")
    return count


def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("  라그나로크 온라인 아이템 추출기")
    print("=" * 60)
    
    # 1. GRF 접근 테스트
    if not test_grf_access():
        print("\n[실패] GRF 파일에 접근할 수 없습니다.")
        return 1
    
    # 2. iteminfo 추출
    extracted_files = extract_iteminfo()
    
    if not extracted_files:
        print("\n[경고] iteminfo 파일을 찾을 수 없습니다.")
        print("GRF 내부 구조를 확인해주세요.")
        return 1
    
    # 3. 추출된 파일 파싱 시도
    print("\n" + "=" * 50)
    print("파일 파싱")
    print("=" * 50)
    
    all_items = {}
    for file_path in extracted_files:
        print(f"\n파싱 중: {file_path}")
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # 컴파일된 Lua인지 확인
            if content.startswith(b'\x1bLua'):
                print("  -> 컴파일된 Lua 바이트코드입니다.")
                print("  -> unluac 디컴파일러가 필요합니다.")
                # TODO: unluac 실행
                continue
            
            items = parse_iteminfo_lua(content)
            print(f"  -> {len(items):,}개 아이템 파싱됨")
            all_items.update(items)
            
        except Exception as e:
            print(f"  -> 파싱 실패: {e}")
    
    # 4. DB 저장
    if all_items:
        save_to_database(all_items)
        print("\n[완료] 아이템 추출 및 저장이 완료되었습니다!")
    else:
        print("\n[경고] 파싱된 아이템이 없습니다.")
        print(".lub 파일의 경우 unluac 디컴파일러가 필요합니다.")
    
    return 0


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        test_grf_access()
    else:
        sys.exit(main())
