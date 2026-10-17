import sys, base64

def write_b64_file(rel_path, b64_str):
    content = base64.b64decode(b64_str.encode('ascii'))
    with open(rel_path, 'wb') as f:
        f.write(content)
    print(f'Successfully wrote {rel_path} ({len(content)} bytes)')

if __name__ == '__main__':
    write_b64_file(sys.argv[1], sys.argv[2])
