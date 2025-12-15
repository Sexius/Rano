# -*- coding: utf-8 -*-
"""아이템 28145 상세 분석 - 결과를 파일로 저장"""
import re

LUA_PATH = r"e:\RAG\rano-spring-backend\scripts\extracted\iteminfo.lua"
OUTPUT_PATH = r"e:\RAG\rano-spring-backend\scripts\debug_output.txt"

def decode_lua_string(s):
    if not s:
        return ''
    result_bytes = bytearray()
    i = 0
    while i < len(s):
        if s[i] == '\\' and i + 1 < len(s):
            j = i + 1
            num_str = ''
            while j < len(s) and s[j].isdigit() and len(num_str) < 3:
                num_str += s[j]
                j += 1
            if num_str:
                byte_val = int(num_str)
                if byte_val < 256:
                    result_bytes.append(byte_val)
                    i = j
                    continue
            else:
                if i + 1 < len(s):
                    c = s[i + 1]
                    if c == 'n':
                        result_bytes.append(ord('\n'))
                    elif c == '\\':
                        result_bytes.append(ord('\\'))
                    elif c == '"':
                        result_bytes.append(ord('"'))
                    else:
                        result_bytes.append(ord(c))
                    i += 2
                    continue
        result_bytes.append(ord(s[i]))
        i += 1
    try:
        return bytes(result_bytes).decode('euc-kr')
    except:
        return bytes(result_bytes).decode('latin-1', errors='replace')

output = []
output.append("파일 읽는 중...")

with open(LUA_PATH, 'r', encoding='utf-8', errors='replace') as f:
    line_num = 0
    in_block = False
    block_lines = []
    
    for line in f:
        line_num += 1
        if '[28145]' in line:
            in_block = True
            output.append(f"[28145] 발견 at line {line_num}")
        
        if in_block:
            block_lines.append(line)
            if len(block_lines) > 2 and re.match(r'\s*\[\d+\]\s*=', line):
                block_lines.pop()
                break
            if len(block_lines) > 100:
                break

block = ''.join(block_lines)
output.append(f"\n=== 블록 ({len(block_lines)}줄) ===")
output.append(block[:5000])

output.append("\n=== 필드 추출 테스트 ===")

# unidentifiedDisplayName
m1 = re.search(r'unidentifiedDisplayName\s*=\s*"((?:[^"\\]|\\.)*)"', block)
if m1:
    raw = m1.group(1)
    output.append(f"unidentifiedDisplayName raw: {repr(raw)}")
    output.append(f"unidentifiedDisplayName decoded: {decode_lua_string(raw)}")

# identifiedDisplayName  
m2 = re.search(r'identifiedDisplayName\s*=\s*"((?:[^"\\]|\\.)*)"', block)
if m2:
    raw = m2.group(1)
    output.append(f"identifiedDisplayName raw: {repr(raw)}")
    output.append(f"identifiedDisplayName decoded: {decode_lua_string(raw)}")
else:
    output.append("identifiedDisplayName NOT FOUND!")

# 파일로 저장
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))

print(f"결과 저장: {OUTPUT_PATH}")
