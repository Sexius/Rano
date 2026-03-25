"""
원본 skilldescript.lub 파일 샘플 분석
- 파일 구조 확인
- 실제 스킬 데이터 형식 파악
"""
import os

FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"

with open(FILE_PATH, 'rb') as f:
    raw = f.read()

print(f"파일 크기: {len(raw)} bytes")

# 첫 5000바이트 출력 (ASCII + 무시)
sample = raw[:10000]
try:
    text = sample.decode('cp949', errors='replace')
except:
    text = sample.decode('latin1', errors='replace')

# 파일에 저장
with open('file_sample.txt', 'w', encoding='utf-8', errors='replace') as f:
    f.write(text)

print("file_sample.txt 저장 완료 (첫 10000바이트)")

# SKID 패턴 검색
import re
skid_matches = re.findall(rb'\[SKID\.([A-Z0-9_]+)\]', raw[:50000])
print(f"\n발견된 SKID 패턴 (처음 50KB): {len(skid_matches)}개")
for m in skid_matches[:10]:
    print(f"  - {m.decode('ascii')}")
