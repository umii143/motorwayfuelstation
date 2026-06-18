import re

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove haptic.light();
content = content.replace("haptic.light();", "")

# 2. Add missing icons to lucide-react import
# Find the end of lucide-react import block
lucide_import_pattern = r'(\bZap\n)(\s*\}\s*from\s*"lucide-react";)'
lucide_import_replacement = r'\1  , CheckCircle2, Sun, Moon, Fuel, Info\n\2'

new_content = re.sub(lucide_import_pattern, lucide_import_replacement, content)

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
