def search_binary():
    filepath = r"e:\RAG\rano-spring-backend\scripts\extracted\iteminfo.lua"
    targets = [
        "바이올로".encode("euc-kr"),
        "바이올로".encode("utf-8"),
        "인퀴지터".encode("euc-kr"),
        "인퀴지터".encode("utf-8"),
        b"400494",
        b"400497"
    ]
    
    try:
        size = os.path.getsize(filepath)
        print(f"File size: {size:,} bytes")
        with open(filepath, 'rb') as f:
            content = f.read()
            for target in targets:
                pos = content.find(target)
                if pos != -1:
                    print(f"Found target {target} at position {pos}")
                # Print 500 bytes around
                start = max(0, pos - 100)
                end = min(len(content), pos + 1000)
                chunk = content[start:end]
                print("Chunk preview (decoded as EUC-KR):")
                print(chunk.decode('euc-kr', errors='replace'))
            else:
                print("Not found in binary search")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import os
    search_binary()
