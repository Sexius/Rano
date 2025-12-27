import os

def search_iteminfo():
    filepath = r"e:\RAG\rano-spring-backend\scripts\extracted\iteminfo.lua"
    target = "[400494]"
    
    try:
        # Try EUC-KR first
        with open(filepath, 'r', encoding='euc-kr', errors='replace') as f:
            for i, line in enumerate(f):
                if target in line:
                    print(f"Found in line {i+1}:")
                    print(line.strip())
                    # Print next 20 lines
                    for _ in range(30):
                        try:
                            print(next(f).strip())
                        except StopIteration:
                            break
                    break
            else:
                print(f"Target {target} not found in {filepath}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_iteminfo()
