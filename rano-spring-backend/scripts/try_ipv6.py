import pymysql

def try_ipv6_mariadb():
    try:
        print("Trying to connect to MariaDB on ::1...")
        conn = pymysql.connect(
            host='::1',
            user='root',
            password='1234',
            db='rano',
            charset='utf8mb4'
        )
        print("✅ SUCCESS!")
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM items WHERE description IS NOT NULL AND description != ''")
        print(f"Items with descriptions: {cur.fetchone()[0]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ IPv6 Failed: {e}")
        
    try:
        print("\nTrying to connect to MariaDB on 127.0.0.1...")
        conn = pymysql.connect(
            host='127.0.0.1',
            user='root',
            password='1234',
            db='rano',
            charset='utf8mb4'
        )
        print("✅ SUCCESS!")
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM items WHERE description IS NOT NULL AND description != ''")
        print(f"Items with descriptions: {cur.fetchone()[0]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ IPv4 Failed: {e}")

if __name__ == "__main__":
    try_ipv6_mariadb()
