import socket

def scan_ports():
    target = '127.0.0.1'
    ports = [3306, 3307, 3308, 3309, 13306, 5432]
    
    print(f"Scanning ports for database on {target}...")
    for port in ports:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((target, port))
        if result == 0:
            print(f"Port {port} is OPEN")
        sock.close()

if __name__ == "__main__":
    scan_ports()
