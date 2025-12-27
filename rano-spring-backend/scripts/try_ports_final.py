import pymysql

def try_connect(port):
    try:
        print(f"Trying port {port}...")
        conn = pymysql.connect(
            host='127.0.0.1',
            user='root',
            password='1234',
            db='rano',
            port=port,
            charset='utf8mb4'
        )
        print(f"✅ SUCCESS on port {port}")
        cur = conn.cursor()
        cur.execute("SELECT id, name_kr FROM items WHERE name_kr LIKE '%진노%' LIMIT 5")
        rows = cur.fetchall()
        for r in rows:
            print(f" Found: [{r[0]}] {r[1]}")
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Failed on port {port}: {e}")
        return False

if __name__ == "__main__":
    if not try_connect(3306):
        try_connect(13306)
