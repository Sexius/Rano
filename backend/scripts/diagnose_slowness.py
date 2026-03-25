#!/usr/bin/env python3
"""
검색 속도 저하 원인 진단 스크립트
"""
import time
import requests
import psycopg2
from datetime import datetime, timedelta

# 설정
BACKEND_URL = "https://rano.onrender.com"
DB_URL = "postgresql://rano_db_user:08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4@dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com/rano_db"

def check_backend_health():
    """백엔드 상태 확인 (Cold Start 감지)"""
    print("\n" + "="*60)
    print("[1] 백엔드 헬스체크 (Cold Start 감지)")
    print("="*60)
    
    try:
        # 첫 번째 요청 (Cold Start 시 느림)
        start1 = time.time()
        resp1 = requests.get(f"{BACKEND_URL}/api/health", timeout=60)
        elapsed1 = time.time() - start1
        
        print(f"  1차 요청: {elapsed1:.2f}초 (상태: {resp1.status_code})")
        
        if elapsed1 > 5:
            print(f"  ⚠️  Cold Start 감지! (5초 초과)")
            print(f"     → Render 무료 플랜은 15분 미사용 시 인스턴스 슬립")
        
        # 두 번째 요청 (Warm 상태)
        time.sleep(1)
        start2 = time.time()
        resp2 = requests.get(f"{BACKEND_URL}/api/health", timeout=30)
        elapsed2 = time.time() - start2
        
        print(f"  2차 요청: {elapsed2:.2f}초 (상태: {resp2.status_code})")
        
        if elapsed2 < 1:
            print(f"  ✅ Warm 상태 확인됨")
        
        return elapsed1
        
    except requests.exceptions.Timeout:
        print("  ❌ 타임아웃! 백엔드가 슬립 상태이거나 다운됨")
        return 999
    except Exception as e:
        print(f"  ❌ 오류: {e}")
        return 999

def check_search_api():
    """검색 API 응답 시간 측정"""
    print("\n" + "="*60)
    print("[2] 검색 API 응답 시간 측정")
    print("="*60)
    
    test_keyword = "천공"
    
    try:
        # 1차 검색 (캐시 미스 예상)
        start1 = time.time()
        resp1 = requests.get(
            f"{BACKEND_URL}/api/vending/v2/search",
            params={"item": test_keyword, "server": "baphomet", "page": 1, "size": 10},
            timeout=60
        )
        elapsed1 = time.time() - start1
        
        data1 = resp1.json() if resp1.ok else {}
        total1 = data1.get("total", 0)
        
        print(f"  1차 검색 '{test_keyword}': {elapsed1:.2f}초 (결과: {total1}건)")
        
        # 2차 검색 (캐시 히트 예상)
        time.sleep(0.5)
        start2 = time.time()
        resp2 = requests.get(
            f"{BACKEND_URL}/api/vending/v2/search",
            params={"item": test_keyword, "server": "baphomet", "page": 1, "size": 10},
            timeout=30
        )
        elapsed2 = time.time() - start2
        
        data2 = resp2.json() if resp2.ok else {}
        total2 = data2.get("total", 0)
        
        print(f"  2차 검색 '{test_keyword}': {elapsed2:.2f}초 (결과: {total2}건)")
        
        # 분석
        if elapsed1 > 3:
            print(f"\n  ⚠️  1차 검색이 느림 (캐시 미스 + GNJOY 크롤링)")
        
        if elapsed2 > 1:
            print(f"  ⚠️  2차 검색도 느림 (캐시가 작동 안 함!)")
        elif elapsed2 < 0.5:
            print(f"  ✅ 캐시 정상 작동 ({elapsed2:.2f}초)")
            
        return elapsed1, elapsed2
        
    except Exception as e:
        print(f"  ❌ 오류: {e}")
        return 999, 999

def check_db_cache_status():
    """DB 캐시 테이블 상태 확인"""
    print("\n" + "="*60)
    print("[3] DB 캐시 상태 확인")
    print("="*60)
    
    try:
        conn = psycopg2.connect(DB_URL, connect_timeout=15)
        cur = conn.cursor()
        
        # 캐시 통계
        cur.execute("SELECT COUNT(*) FROM vending_search_cache;")
        total_cache = cur.fetchone()[0]
        
        # 유효한 캐시 수 (expires_at > now)
        cur.execute("SELECT COUNT(*) FROM vending_search_cache WHERE expires_at > NOW();")
        valid_cache = cur.fetchone()[0]
        
        # 만료된 캐시 수
        expired_cache = total_cache - valid_cache
        
        print(f"  전체 캐시: {total_cache}건")
        print(f"  유효 캐시: {valid_cache}건")
        print(f"  만료 캐시: {expired_cache}건")
        
        if valid_cache == 0:
            print(f"\n  ⚠️  유효한 캐시가 0개! 모든 검색이 GNJOY 크롤링 필요")
        
        # 가장 최근 캐시 시간
        cur.execute("SELECT MAX(cached_at) FROM vending_search_cache;")
        last_cached = cur.fetchone()[0]
        
        if last_cached:
            print(f"\n  마지막 캐시 시간: {last_cached}")
            # 2주 전인지 확인
            if last_cached.replace(tzinfo=None) < datetime.now() - timedelta(days=7):
                print(f"  ⚠️  7일 이상 캐시 갱신 없음!")
        else:
            print(f"  ⚠️  캐시 데이터 없음!")
        
        # vending_listings 상태
        cur.execute("SELECT COUNT(*) FROM vending_listings;")
        listings_count = cur.fetchone()[0]
        
        cur.execute("SELECT MAX(scraped_at) FROM vending_listings;")
        last_scraped = cur.fetchone()[0]
        
        print(f"\n  노점 스냅샷: {listings_count}건")
        if last_scraped:
            print(f"  마지막 스크랩: {last_scraped}")
        
        cur.close()
        conn.close()
        
        return valid_cache
        
    except Exception as e:
        print(f"  ❌ DB 연결 오류: {e}")
        return -1

def check_caffeine_cache():
    """Caffeine 인메모리 캐시 상태 (추론)"""
    print("\n" + "="*60)
    print("[4] Caffeine 인메모리 캐시 상태 (추론)")
    print("="*60)
    
    print("  Caffeine 캐시는 JVM 메모리에 저장됨")
    print("  → Cold Start 시 완전히 초기화됨")
    print("  → TTL: 60초 (1분)")
    print("")
    print("  2주 미사용 후:")
    print("  → Render 인스턴스 슬립 → JVM 종료 → Caffeine 캐시 삭제")
    print("  → 재시작 시 모든 캐시가 비어있음")

def check_item_cache():
    """ItemCacheService 상태 (아이템 ID 매핑)"""
    print("\n" + "="*60)
    print("[5] ItemCacheService 상태")
    print("="*60)
    
    print("  items 테이블 → ConcurrentHashMap (시작 시 로딩)")
    print("  → 21,945건 로딩에 약 1-3초 소요")
    print("  → Cold Start 시마다 재로딩 필요")

def summarize_diagnosis(health_time, search1, search2, valid_cache):
    """진단 결과 요약"""
    print("\n" + "="*60)
    print("[결론] 속도 저하 원인 분석")
    print("="*60)
    
    causes = []
    
    if health_time > 5:
        causes.append(("Cold Start", "Render 무료 플랜 인스턴스 슬립 (15분 미사용 시)", "높음"))
    
    if valid_cache == 0:
        causes.append(("DB 캐시 만료", "vending_search_cache 유효 캐시 0건", "높음"))
    
    if search2 > 1:
        causes.append(("Caffeine 캐시 비활성", "인메모리 캐시가 작동 안 함", "중간"))
    
    if search1 > 3:
        causes.append(("GNJOY 크롤링", "외부 사이트 응답 대기 (정상 동작)", "낮음"))
    
    if not causes:
        print("  ✅ 특별한 문제 없음")
    else:
        print("\n  발견된 원인:")
        print("  " + "-"*50)
        for i, (cause, detail, severity) in enumerate(causes, 1):
            icon = "🔴" if severity == "높음" else "🟡" if severity == "중간" else "🟢"
            print(f"  {i}. {icon} [{severity}] {cause}")
            print(f"     └ {detail}")
        print()
        
        # 주요 원인 분석
        print("  📋 상세 분석:")
        print("  " + "-"*50)
        
        if health_time > 5:
            print("""
  🔴 Cold Start 문제 (가장 큰 원인)
     ─────────────────────────────────
     • Render 무료 플랜은 15분 미사용 시 인스턴스 종료
     • 2주 미사용 → 인스턴스 완전 슬립 → 첫 요청 시 재시작
     • 재시작 시:
       - JVM 부팅: 5-15초
       - Spring Boot 초기화: 3-5초  
       - ItemCacheService 로딩: 1-3초
       - DB 커넥션 풀 초기화: 1-2초
     • 총 Cold Start 시간: 10-25초
            """)
        
        if valid_cache == 0:
            print("""
  🔴 DB 캐시 만료 문제
     ─────────────────────────────────
     • vending_search_cache TTL: 10분
     • 2주 미사용 → 모든 캐시 만료
     • 캐시 미스 → GNJOY 실시간 크롤링 필요 (2-5초)
            """)
        
        if search2 > 1:
            print("""
  🟡 Caffeine 인메모리 캐시 비활성
     ─────────────────────────────────
     • Caffeine TTL: 60초
     • Cold Start 시 완전 초기화
     • 재검색도 캐시 미스 발생
            """)

def main():
    print("="*60)
    print(" 검색 속도 저하 원인 진단")
    print(f" 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # 1. 백엔드 상태
    health_time = check_backend_health()
    
    # 2. 검색 API 테스트
    search1, search2 = check_search_api()
    
    # 3. DB 캐시 상태
    valid_cache = check_db_cache_status()
    
    # 4. Caffeine 캐시 상태
    check_caffeine_cache()
    
    # 5. ItemCacheService
    check_item_cache()
    
    # 6. 결론
    summarize_diagnosis(health_time, search1, search2, valid_cache)
    
    print("\n[진단 완료]")

if __name__ == "__main__":
    main()
