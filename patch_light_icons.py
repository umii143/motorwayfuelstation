import re

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add missing icons to lucide-react import
lucide_import_pattern = r'(?<=from "lucide-react";)'

# Actually, let's just do a targeted replacement on the lucide-react import block end
lucide_import_pattern2 = r'(Info)(\s*\}\s*from\s*"lucide-react";)'
lucide_import_replacement = r'\1, TrendingUp, Coins, ChevronRight, Check, Activity, Zap, FileText\n\2'

new_content = re.sub(lucide_import_pattern2, lucide_import_replacement, content)

# Just in case Info is not the last one, let's safely append them if they are not already in the file
import_match = re.search(r'import\s+\{([^}]+)\}\s+from\s+"lucide-react";', content)
if import_match:
    existing_imports = import_match.group(1)
    to_add = []
    for icon in ["TrendingUp", "Coins", "ChevronRight", "Check", "Activity", "Zap", "FileText"]:
        if icon not in existing_imports:
            to_add.append(icon)
    
    if to_add:
        # replace the closing brace of the import
        new_import_block = existing_imports + ", " + ", ".join(to_add) + "\n"
        new_content = content.replace(existing_imports, new_import_block)

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
