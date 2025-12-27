import os

def search_iteminfo():
    filepath = r"e:\RAG\rano-spring-backend\scripts\extracted\iteminfo.lua"
    if not os.path.exists(filepath):
        print("File not found")
        return
        
    # Search for [470213]
    target = b"[470213] ="
    
    with open(filepath, 'rb') as f:
        content = f.read()
        pos = content.find(target)
        if pos != -1:
            print(f"Found {target} at {pos}")
            # Show next 2000 bytes
            chunk = content[pos:pos+2000]
            try:
                print(chunk.decode('euc-kr', errors='replace'))
            except:
                print(chunk)
        else:
            print(f"Target {target} not found")

if __name__ == "__main__":
    search_iteminfo()
