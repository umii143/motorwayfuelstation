import os
import re

def fix_imports(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern: \nimport {\nimport { logger } from '...';\n
    pattern = re.compile(r'(import\s+\{)\s*\n(\s*import\s+\{\s*logger\s*\}\s*from\s+[\'"][^\'"]+[\'"];)\s*\n', re.MULTILINE)

    if pattern.search(content):
        # We need to move the logger import BEFORE the import {
        new_content = pattern.sub(r'\2\n\1\n', content)
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            fix_imports(os.path.join(root, file))

print("Done fixing broken imports")
