# -*- coding: utf-8 -*-
"""
Lua 5.1 Bytecode String Extractor for Ragnarok Online iteminfo
Lua bytecode에서 아이템 정보 문자열을 직접 추출합니다.
"""

import struct
import os
import json
import sqlite3
import re

# 설정
ITEMINFO_PATH = r"C:\Users\KJM\Desktop\게임\Ragnarok_250317\System\itemInfo_true.lub"
DB_PATH = r"e:\RAG\rano-spring-backend\ro_market.db"
OUTPUT_DIR = r"e:\RAG\rano-spring-backend\scripts\extracted"


class Lua51BytecodeParser:
    """Lua 5.1 bytecode 파서"""
    
    def __init__(self, data):
        self.data = data
        self.pos = 0
        self.strings = []
        
    def read_byte(self):
        val = self.data[self.pos]
        self.pos += 1
        return val
    
    def read_int(self, size=4):
        val = struct.unpack('<I' if size == 4 else '<Q', self.data[self.pos:self.pos+size])[0]
        self.pos += size
        return val
    
    def read_size_t(self, size):
        return self.read_int(size)
    
    def read_string(self, size_t_size):
        """Lua 문자열 읽기"""
        length = self.read_size_t(size_t_size)
        if length == 0:
            return None
        # Lua 문자열은 null terminator를 포함
        string_data = self.data[self.pos:self.pos + length - 1]  # -1 for null terminator
        self.pos += length
        
        # Try to decode as EUC-KR (Korean) or UTF-8
        try:
            return string_data.decode('euc-kr')
        except:
            try:
                return string_data.decode('utf-8')
            except:
                return string_data.decode('latin-1', errors='ignore')
    
    def parse_header(self):
        """Lua bytecode 헤더 파싱"""
        # 1B 4C 75 61 = "\x1bLua"
        signature = self.data[0:4]
        if signature != b'\x1bLua':
            raise ValueError("Not a Lua bytecode file")
        self.pos = 4
        
        version = self.read_byte()  # 0x51 = Lua 5.1
        format = self.read_byte()   # 0 = official format
        endianness = self.read_byte()  # 1 = little endian
        int_size = self.read_byte()   # 4
        size_t_size = self.read_byte()  # 4 or 8
        instruction_size = self.read_byte()  # 4
        lua_number_size = self.read_byte()  # 8
        lua_number_integral = self.read_byte()  # 0 = floating point
        
        return {
            'version': version,
            'format': format,
            'endianness': endianness,
            'int_size': int_size,
            'size_t_size': size_t_size,
            'instruction_size': instruction_size,
            'lua_number_size': lua_number_size,
            'lua_number_integral': lua_number_integral
        }
    
    def extract_all_strings(self):
        """바이트코드에서 모든 문자열 추출"""
        header = self.parse_header()
        print(f"Lua version: 0x{header['version']:02x}")
        print(f"size_t size: {header['size_t_size']}")
        
        size_t_size = header['size_t_size']
        
        # 간단한 방법: 전체 데이터에서 문자열 패턴 찾기
        strings = []
        
        # Lua bytecode에서 문자열은 size + data 형태로 저장됨
        # 문자열과 관련된 패턴을 찾아봄
        pos = self.pos
        
        while pos < len(self.data) - 10:
            # 문자열 길이 후보 읽기
            try:
                str_len = struct.unpack('<I', self.data[pos:pos+4])[0]
                
                # 합리적인 문자열 길이 (1 ~ 1000)
                if 1 < str_len < 1000 and pos + 4 + str_len <= len(self.data):
                    str_data = self.data[pos+4:pos+4+str_len-1]  # -1 for null
                    
                    # 유효한 문자열인지 확인
                    if str_len > 1 and self.data[pos+4+str_len-1:pos+4+str_len] == b'\x00':
                        try:
                            decoded = str_data.decode('euc-kr')
                            # 한국어가 포함된 문자열만 저장
                            if re.search(r'[\uac00-\ud7af]', decoded):
                                strings.append({
                                    'pos': pos,
                                    'text': decoded
                                })
                                pos += 4 + str_len
                                continue
                        except:
                            pass
            except:
                pass
            
            pos += 1
        
        return strings


def extract_strings_simple(filepath):
    """간단한 문자열 추출 - 정규식 기반"""
    with open(filepath, 'rb') as f:
        data = f.read()
    
    print(f"File size: {len(data):,} bytes")
    
    strings = []
    items = {}
    
    # iteminfo.lua 형식의 패턴 찾기
    # 예: identifiedDisplayName = "아이템이름"
    # 바이너리에서 특정 패턴 검색
    
    # 1. "identifiedDisplayName" 패턴 후의 문자열 찾기
    patterns = [
        b'identifiedDisplayName',
        b'unidentifiedDisplayName',
        b'identifiedDescriptionName',
        b'slotCount',
        b'ClassNum',
    ]
    
    # EUC-KR로 전체 디코딩 시도
    try:
        text_content = data.decode('euc-kr', errors='replace')
        
        # 아이템 ID와 이름 매핑 추출 시도
        # 패턴: [아이템ID] = { ... identifiedDisplayName = "이름" ... }
        
        # 먼저 숫자 키와 문자열 값 패턴 찾기
        # Lua 테이블: [12345] = { identifiedDisplayName = "아이템명", ... }
        
        # 간단한 방법: 연속된 한국어 문자열 추출
        korean_strings = []
        current_string = ""
        
        for char in text_content:
            if '\uac00' <= char <= '\ud7af' or '\u3130' <= char <= '\u318f' or char in '[]0123456789 ()+-,.%':
                current_string += char
            else:
                if len(current_string) >= 3:
                    # 한국어가 포함된 경우만
                    if any('\uac00' <= c <= '\ud7af' for c in current_string):
                        korean_strings.append(current_string.strip())
                current_string = ""
        
        print(f"Found {len(korean_strings)} Korean strings")
        return korean_strings
        
    except Exception as e:
        print(f"Error: {e}")
        return []


def extract_items_from_bytecode(filepath):
    """Lua bytecode에서 아이템 정보 추출"""
    with open(filepath, 'rb') as f:
        data = f.read()
    
    print(f"File size: {len(data):,} bytes")
    print(f"Header: {data[:4]}")
    
    # 아이템 정보 추출
    items = {}
    
    # Lua 5.1 bytecode에서 문자열 상수 테이블 파싱
    # String format: [size_t: length][bytes: string_data][0x00]
    
    pos = 12  # 헤더 건너뛰기
    item_names = []
    item_descs = []
    
    # 문자열 상수들을 순서대로 추출
    # iteminfo의 구조상 아이템 이름과 설명이 연속으로 나옴
    
    # 더 정교한 방법: Lua 바이트코드 구조 분석
    # 일단 모든 문자열 추출
    all_strings = []
    
    i = 0
    while i < len(data) - 8:
        # 4바이트 길이 + 문자열 + null 패턴 검색
        try:
            str_len = struct.unpack('<I', data[i:i+4])[0]
            
            if 4 < str_len < 500 and i + 4 + str_len <= len(data):
                str_data = data[i+4:i+4+str_len-1]
                
                # null로 끝나는지 확인
                if data[i+4+str_len-1:i+4+str_len] == b'\x00':
                    try:
                        decoded = str_data.decode('euc-kr')
                        
                        # 아이템 이름 패턴 (한국어 + 영어/숫자 혼합)
                        if len(decoded) >= 2 and any('\uac00' <= c <= '\ud7af' for c in decoded):
                            all_strings.append({
                                'pos': i,
                                'len': str_len,
                                'text': decoded
                            })
                    except:
                        pass
        except:
            pass
        
        i += 1
    
    print(f"Extracted {len(all_strings)} Korean strings from bytecode")
    
    # 아이템 이름 후보 필터링
    # 일반적으로 아이템 이름은 특정 패턴을 따름 (예: 끝에 [N] 슬롯 표시)
    item_name_candidates = []
    for s in all_strings:
        text = s['text']
        # 아이템 이름 패턴: 한국어 + 선택적 [숫자] 슬롯
        if re.match(r'^[\uac00-\ud7af\u3130-\u318fa-zA-Z0-9\s\[\]()_+-]+$', text):
            if 2 <= len(text) <= 50:
                item_name_candidates.append(text)
    
    print(f"Found {len(item_name_candidates)} item name candidates")
    
    return item_name_candidates, all_strings


def main():
    """메인 실행"""
    print("=" * 60)
    print("  라그나로크 아이템 정보 추출기 (Lua Bytecode Parser)")
    print("=" * 60)
    
    if not os.path.exists(ITEMINFO_PATH):
        print(f"Error: File not found: {ITEMINFO_PATH}")
        return 1
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 아이템 이름 추출
    item_names, all_strings = extract_items_from_bytecode(ITEMINFO_PATH)
    
    # 결과 저장
    output_file = os.path.join(OUTPUT_DIR, 'extracted_strings.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            'item_name_candidates': item_names[:1000],  # 처음 1000개
            'total_strings': len(all_strings),
            'sample_strings': [s['text'] for s in all_strings[:500]]
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\nResults saved to: {output_file}")
    
    # 샘플 출력
    print("\n" + "=" * 40)
    print("Sample item names (first 50):")
    print("=" * 40)
    for name in item_names[:50]:
        print(f"  - {name}")
    
    return 0


if __name__ == '__main__':
    main()
