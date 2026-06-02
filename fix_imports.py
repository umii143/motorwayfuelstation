import os

def fix_file(file_path, depth):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = []
    if depth == 2:
        # Should be ../../
        replacements = [
            ("from '../types'", "from '../../types'"),
            ('from "../types"', 'from "../../types"'),
            ("from '../lib", "from '../../lib"),
            ('from "../lib', 'from "../../lib'),
            ("from '../data", "from '../../data"),
            ('from "../data', 'from "../../data')
        ]
    elif depth == 3:
        # Should be ../../../
        replacements = [
            ("from '../../types'", "from '../../../types'"),
            ('from "../../types"', 'from "../../../types"'),
            ("from '../../lib", "from '../../../lib"),
            ('from "../../lib', 'from "../../../lib'),
            ("from '../../data", "from '../../../data"),
            ('from "../../data', 'from "../../../data')
        ]

    for old, new in replacements:
        content = content.replace(old, new)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = 'src/components'
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            # Depth 2: ui, features, layouts (e.g. src/components/features)
            # Depth 3: features/Settings (e.g. src/components/features/Settings)
            rel_path = os.path.relpath(root, base_dir)
            depth = len(rel_path.split(os.sep)) + 1
            fix_file(os.path.join(root, f), depth)

# Fix App.tsx
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    app_content = f.read()

app_content = app_content.replace("from './components/Settings/RateWizard'", "from './components/features/Settings/RateWizard'")
# Make sure no other features are missing
with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_content)

print("Fixed imports")
