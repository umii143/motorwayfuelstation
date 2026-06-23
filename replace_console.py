import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'console.' not in content:
        return

    # Determine relative path to lib/logger
    parts = filepath.replace('\\\\', '/').split('src/')[-1].split('/')
    depth = len(parts) - 1
    rel_path = '../' * depth + 'lib/logger' if depth > 0 else './lib/logger'

    import_stmt = f"import {{ logger }} from '{rel_path}';\n"
    
    # Add import if not present
    if 'import { logger }' not in content:
        # insert after last import
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

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

files = [
    'src/App.tsx',
    'src/components/features/Reports.tsx',
    'src/components/widgets/WidgetWrapper.tsx',
    'src/hooks/useJarvis.ts',
    'src/services/core/shadowMode.ts',
    'src/services/hardware/BarcodeScanner.ts'
]

for f in files:
    fix_file(f)
