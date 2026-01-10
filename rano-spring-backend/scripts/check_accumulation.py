#!/usr/bin/env python3
"""
누적 수집 현황 확인
"""
import os
import sys
import argparse
import psycopg2
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description='누적 수집 현황 확인')
    parser.add_argument('--server', required=True, help='서버명 (e.g., baphomet)')
    parser.add_argument('--keyword', required=True, help='검색 키워드 (e.g., 천공)')
    args = parser.parse_args()

    db_url = os.environ.get('DB_URL')
    if not db_url:
        print("ERROR: DB_URL 환경변수가 필요합니다")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    server = args.server
    keyword = args.keyword

    # a) prefix COUNT
    cur.execute(
        "SELECT COUNT(*) FROM vending_listings WHERE server=%s AND item_name LIKE %s",
        (server, f'{keyword}%')
    )
    prefix_count = cur.fetchone()[0]

    # b) contains COUNT
    cur.execute(
        "SELECT COUNT(*) FROM vending_listings WHERE server=%s AND item_name LIKE %s",
        (server, f'%{keyword}%')
    )
    contains_count = cur.fetchone()[0]

    # c) 최근 1시간 갱신 COUNT
    cur.execute(
        "SELECT COUNT(*) FROM vending_listings WHERE server=%s AND scraped_at > NOW() - INTERVAL '1 hour'",
        (server,)
    )
    recent_count = cur.fetchone()[0]

    cur.close()
    conn.close()

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {server} | {keyword}")
    print(f"  prefix  ({keyword}%):   {prefix_count}")
    print(f"  contains (%{keyword}%): {contains_count}")
    print(f"  recent (1h):           {recent_count}")

if __name__ == "__main__":
    main()
