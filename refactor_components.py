import os
import shutil
import re

# 1. Create directories
base_dir = 'src/components'
ui_dir = os.path.join(base_dir, 'ui')
features_dir = os.path.join(base_dir, 'features')
layouts_dir = os.path.join(base_dir, 'layouts')

os.makedirs(ui_dir, exist_ok=True)
os.makedirs(features_dir, exist_ok=True)
os.makedirs(layouts_dir, exist_ok=True)

# 2. Define destinations
file_dests = {
    'EmptyState.tsx': 'ui',
    'Navigation.tsx': 'layouts',
    'AuthInterface.tsx': 'layouts'
}

# 3. Move files
moved_files = []
for item in os.listdir(base_dir):
    src_path = os.path.join(base_dir, item)
    if os.path.isdir(src_path) and item in ['ui', 'features', 'layouts']:
        continue
    
    if item in file_dests:
        dest_dir = os.path.join(base_dir, file_dests[item])
    else:
        dest_dir = features_dir
        
    dest_path = os.path.join(dest_dir, item)
    shutil.move(src_path, dest_path)
    moved_files.append((item, file_dests.get(item, 'features')))

# 4. Update imports inside the moved files
def update_imports(file_path, new_category):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # If it's in components/features/Settings/ (depth 3)
    if 'Settings' in file_path and os.path.isdir(file_path) == False:
        content = content.replace("from '../../types'", "from '../../../types'")
        content = content.replace("from '../../lib", "from '../../../lib")
        content = content.replace("from '../../data", "from '../../../data")
        content = content.replace("from '../EmptyState'", "from '../../ui/EmptyState'")
    # If it's in components/ui, components/features, or components/layouts (depth 2)
    elif os.path.isdir(file_path) == False:
        content = content.replace("from '../types'", "from '../../types'")
        content = content.replace("from '../lib", "from '../../lib")
        content = content.replace("from '../data", "from '../../data")
        content = content.replace("from './EmptyState'", "from '../ui/EmptyState'")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# Apply updates to all files in the new directories
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            category = root.replace(base_dir, '').strip('/\\').split('/')[0]
            update_imports(os.path.join(root, f), category)

# 5. Update App.tsx and StationContext.tsx
def update_root_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace layout imports
    content = content.replace("from './components/Navigation'", "from './components/layouts/Navigation'")
    content = content.replace("from './components/AuthInterface'", "from './components/layouts/AuthInterface'")
    
    # Replace UI imports
    content = content.replace("from './components/EmptyState'", "from './components/ui/EmptyState'")
    
    # Replace feature imports
    for item in moved_files:
        filename, dest = item
        if dest == 'features':
            if filename.endswith('.tsx'):
                name = filename[:-4]
                content = content.replace(f"from './components/{name}'", f"from './components/features/{name}'")
            elif filename == 'Settings':
                content = content.replace("from './components/Settings'", "from './components/features/Settings'")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

update_root_file('src/App.tsx')
if os.path.exists('src/contexts/StationContext.tsx'):
    update_root_file('src/contexts/StationContext.tsx')

print("Refactoring complete.")
