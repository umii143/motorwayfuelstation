import os
import re

with open('unused_vars.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

file_vars = {}
for line in lines:
    if '->' not in line: continue
    path_line, var = line.strip().split(' -> ')
    file_path, line_num = path_line.split(':')
    var = var.strip()
    file_path = file_path.strip()
    if file_path not in file_vars:
        file_vars[file_path] = set()
    file_vars[file_path].add(var)

for file_path, vars_to_prefix in file_vars.items():
    full_path = os.path.join('src', *file_path.split('\\'))
    if not os.path.exists(full_path):
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()

    for var in vars_to_prefix:
        # Check if it's an import. If it is an import, we can remove it from the import list.
        # Simple heuristic: if it's imported, we might just comment it out or prefix it. 
        # Prefixing with _ is safer for everything.
        content = re.sub(r'\b' + var + r'\b', '_' + var, content)

    # Also remove @ts-ignore
    content = content.replace('// @ts-ignore', '')
    content = content.replace('/* @ts-ignore */', '')

    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
