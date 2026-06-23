import os
import glob
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Remove eslint-disable-next-line completely for no-explicit-any
    content = re.sub(r'//\s*eslint-disable-next-line\s+@typescript-eslint/no-explicit-any\n\s*', '', content)
    content = re.sub(r'/\*\s*eslint-disable-next-line\s+@typescript-eslint/no-explicit-any\s*\*/\n\s*', '', content)
    
    # Remove for no-console
    content = re.sub(r'//\s*eslint-disable-next-line\s+no-console\n\s*', '', content)
    
    # Remove plain eslint-disable
    content = re.sub(r'/\*\s*eslint-disable\s+@typescript-eslint/no-explicit-any\s*\*/\n\s*', '', content)
    content = re.sub(r'/\*\s*eslint-disable\s+no-console\s*\*/\n\s*', '', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            fix_file(os.path.join(root, file))

print("Done fixing eslint-disable")
