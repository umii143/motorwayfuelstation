import re
import sys

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Let's count unclosed tags manually in python
def find_tag_mismatch():
    stack = []
    for i, line in enumerate(lines):
        # Very simple div counter
        opens = len(re.findall(r'<div\b[^>]*>', line)) + len(re.findall(r'<div\s*>', line))
        closes = len(re.findall(r'</div>', line))
        for _ in range(opens):
            stack.append(i)
        for _ in range(closes):
            if stack:
                stack.pop()
    print("Unclosed div tags opened at lines:", stack)

find_tag_mismatch()
