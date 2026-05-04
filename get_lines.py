import sys
def get_lines(filename, start, end):
    with open(filename, 'r') as f:
        lines = f.readlines()
        for i in range(start - 1, end):
            if i < len(lines):
                print(f"{i+1}: {lines[i]}", end='')
if __name__ == '__main__':
    get_lines(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]))
