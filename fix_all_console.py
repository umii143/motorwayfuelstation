import os
import re

def fix_console(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'console.' not in content:
        return

    original = content

    # Calculate relative path
    parts = filepath.replace('\\', '/').split('src/')[-1].split('/')
    depth = len(parts) - 1
    rel_path = '../' * depth + 'lib/logger' if depth > 0 else './lib/logger'
    import_stmt = f"import {{ logger }} from '{rel_path}';\n"

    # Add import if missing
    if 'import { logger }' not in content:
        lines = content.split('\n')
        last_import = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        lines.insert(last_import + 1, import_stmt.strip())
        content = '\n'.join(lines)

    content = content.replace('console.log', 'logger.info')
    content = content.replace('console.warn', 'logger.warn')
    content = content.replace('console.error', 'logger.error')
    content = content.replace('console.debug', 'logger.debug')

    # Fix potential duplicate imports or weird stuff
    # Wait, we just inserted it safely.

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            fix_console(os.path.join(root, file))

print("Done fixing all console logs")
