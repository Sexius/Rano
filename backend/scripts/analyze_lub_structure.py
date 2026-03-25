"""
skilldescript.lub 파일 구조 분석
특정 스킬 주변의 실제 텍스트를 추출하여 패턴 파악
"""
FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"

# 스킬 이름 (CP949 인코딩)
target_skills = [
    ('데프트 스탭', 'ABC_DEFT_STAB'),
    ('체이싱 브레이크', 'ABC_CHASING_BREAK'),
]

with open(FILE_PATH, 'rb') as f:
    content = f.read()

print(f"파일 크기: {len(content):,} bytes\n")

for kr_name, eng_name in target_skills:
    name_bytes = kr_name.encode('cp949')
    idx = content.find(name_bytes)
    
    if idx == -1:
        print(f"❌ {kr_name} 찾을 수 없음")
        continue
    
    # 이름 주변 500바이트 추출
    start = max(0, idx - 50)
    end = min(len(content), idx + 800)
    chunk = content[start:end]
    
    print(f"\n{'=' * 60}")
    print(f"스킬: {kr_name} ({eng_name})")
    print(f"위치: {idx}")
    print(f"{'=' * 60}")
    
    # CP949로 디코딩 시도 (에러 무시)
    try:
        text = chunk.decode('cp949', errors='replace')
        # 출력 가능한 문자만 필터
        clean = ''.join(c if c.isprintable() or c in '\n\r\t' else '.' for c in text)
        print(clean)
    except:
        print("[디코딩 실패]")
    
    # ATK 패턴 찾기
    import re
    atk_matches = re.findall(rb'ATK[^\d]*(\d+)%', chunk)
    print(f"\n📊 발견된 ATK 값: {[int(m) for m in atk_matches]}")
    
    # 타수 패턴 찾기
    hits_matches = re.findall(rb'(\d+)\s*\xc8\xb8', chunk)  # 숫자 + 회
    print(f"📊 발견된 타수: {[int(m) for m in hits_matches]}")
