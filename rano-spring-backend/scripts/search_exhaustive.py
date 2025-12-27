import os

def search_any_400497():
    filepath = r"e:\RAG\rano-spring-backend\scripts\extracted\iteminfo.lua"
    if not os.path.exists(filepath):
        print("File not found")
        return
        
    targets = [b"400497", b"400494"]
    
    with open(filepath, 'rb') as f:
        content = f.read()
        for target in targets:
            pos = 0
            while True:
                pos = content.find(target, pos)
                if pos == -1: break
                print(f"Found {target} at {pos}")
                # Print 200 bytes before and 1000 bytes after
                start = max(0, pos - 200)
                end = min(len(content), pos + 1500)
                chunk = content[start:end]
                print("--- CHUNK ---")
                try:
                    # Try to decode safely
                    decoded = chunk.decode('euc-kr', errors='replace')
                    print(decoded)
                except:
                    print(chunk)
                pos += len(target)

if __name__ == "__main__":
    search_any_400497()
