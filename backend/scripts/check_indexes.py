#!/usr/bin/env python3
"""
배포 환경 PostgreSQL 인덱스 현황 점검 스크립트
"""
import psycopg2

DB_URL = "postgresql://rano_db_user:08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4@dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com/rano_db"

def main():
    try:
        print("Render PostgreSQL에 연결 중...")
        conn = psycopg2.connect(DB_URL, connect_timeout=15)
        cur = conn.cursor()
        
        print("\n" + "="*60)
        print("=== vending_listings 테이블 인덱스 현황 ===")
        print("="*60)
        cur.execute("""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'vending_listings'
            ORDER BY indexname;
        """)
        indexes = cur.fetchall()
        if indexes:
            for row in indexes:
                print(f"\n[INDEX] {row[0]}")
                print(f"  DEF: {row[1]}")
        else:
            print(">>> 인덱스 없음! <<<")
        
        print("\n" + "="*60)
        print("=== vending_search_cache 테이블 인덱스 현황 ===")
        print("="*60)
        cur.execute("""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'vending_search_cache'
            ORDER BY indexname;
        """)
        indexes = cur.fetchall()
        if indexes:
            for row in indexes:
                print(f"\n[INDEX] {row[0]}")
                print(f"  DEF: {row[1]}")
        else:
            print(">>> 인덱스 없음! <<<")
        
        print("\n" + "="*60)
        print("=== items 테이블 인덱스 현황 ===")
        print("="*60)
        cur.execute("""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'items'
            ORDER BY indexname;
        """)
        indexes = cur.fetchall()
        if indexes:
            for row in indexes:
                print(f"\n[INDEX] {row[0]}")
                print(f"  DEF: {row[1]}")
        else:
            print(">>> 인덱스 없음! <<<")
        
        print("\n" + "="*60)
        print("=== pg_trgm 확장 상태 ===")
        print("="*60)
        cur.execute("SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_trgm';")
        ext = cur.fetchone()
        if ext:
            print(f"pg_trgm: 활성화됨 (버전 {ext[1]})")
        else:
            print("pg_trgm: 비활성화 (부분검색 성능 저하 가능)")
        
        print("\n" + "="*60)
        print("=== 테이블 행 수 ===")
        print("="*60)
        for table in ['vending_listings', 'vending_search_cache', 'items']:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table};")
                count = cur.fetchone()[0]
                print(f"{table}: {count:,}건")
            except Exception as e:
                print(f"{table}: 테이블 없음 또는 오류")
        
        cur.close()
        conn.close()
        print("\n[완료] 인덱스 점검 완료")
        
    except Exception as e:
        print(f"[오류] DB 연결 실패: {e}")

if __name__ == "__main__":
    main()
