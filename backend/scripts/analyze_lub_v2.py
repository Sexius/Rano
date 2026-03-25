"""
skilldescript.lub 파일 구조 분석 - 결과를 파일로 저장
"""
import re

FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"
OUTPUT_PATH = "lub_analysis_result.txt"

target_skills = [
    ('데프트 스탭', 'ABC_DEFT_STAB'),
    ('체이싱 브레이크', 'ABC_CHASING_BREAK'),
]

with open(FILE_PATH, 'rb') as f:
    content = f.read()

with open(OUTPUT_PATH, 'w', encoding='utf-8') as out:
    out.write(f"파일 크기: {len(content):,} bytes\n\n")

    for kr_name, eng_name in target_skills:
        name_bytes = kr_name.encode('cp949')
        idx = content.find(name_bytes)
        
        if idx == -1:
            out.write(f"❌ {kr_name} 찾을 수 없음\n")
            continue
        
        # 이름 주변 800바이트 추출
        start = max(0, idx - 20)
        end = min(len(content), idx + 800)
        chunk = content[start:end]
        
        out.write(f"\n{'=' * 60}\n")
        out.write(f"스킬: {kr_name} ({eng_name})\n")
        out.write(f"위치: {idx}\n")
        out.write(f"{'=' * 60}\n\n")
        
        # CP949로 디코딩
        try:
            text = chunk.decode('cp949', errors='replace')
            clean = ''.join(c if c.isprintable() or c in '\n\r\t' else '.' for c in text)
            out.write("--- 원본 텍스트 ---\n")
            out.write(clean)
            out.write("\n\n")
        except:
            out.write("[디코딩 실패]\n")
        
        # ATK 패턴
        atk_matches = re.findall(rb'ATK[^\d]*(\d+)%', chunk)
        out.write(f"📊 ATK 값: {[int(m) for m in atk_matches]}\n")
        
        # 타수 패턴
        hits_matches = re.findall(rb'(\d+)\s*\xc8\xb8', chunk)
        out.write(f"📊 타수: {[int(m) for m in hits_matches]}\n")

print(f"✅ 분석 결과 저장: {OUTPUT_PATH}")
