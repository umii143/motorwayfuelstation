import os
import re

TARGET_DIR = r"d:\newfuelstation5\fuelpro\src"

replacements = [
    # text colors
    (r'(?<!dark:)text-slate-800(?!\sdark:)', r'text-slate-800 dark:text-slate-200'),
    (r'(?<!dark:)text-slate-900(?!\sdark:)', r'text-slate-900 dark:text-white'),
    (r'(?<!dark:)text-gray-900(?!\sdark:)', r'text-gray-900 dark:text-white'),
    (r'(?<!dark:)text-gray-800(?!\sdark:)', r'text-gray-800 dark:text-gray-200'),
    
    # backgrounds
    (r'(?<!dark:)bg-white(?!\sdark:)', r'bg-white dark:bg-[#151521]'),
    (r'(?<!dark:)bg-slate-50(?!\sdark:)', r'bg-slate-50 dark:bg-white/5'),
    (r'(?<!dark:)bg-gray-50(?!\sdark:)', r'bg-gray-50 dark:bg-gray-800/40'),
    (r'(?<!dark:)bg-slate-100(?!\sdark:)', r'bg-slate-100 dark:bg-white/10'),
    
    # borders
    (r'(?<!dark:)border-slate-200(?!\sdark:)', r'border-slate-200 dark:border-white/10'),
    (r'(?<!dark:)border-slate-100(?!\sdark:)', r'border-slate-100 dark:border-white/5'),
    (r'(?<!dark:)border-gray-200(?!\sdark:)', r'border-gray-200 dark:border-gray-800'),
]

modified_files = 0
for root, dirs, files in os.walk(TARGET_DIR):
    for filename in files:
        if filename.endswith(".tsx"):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for pattern, replacement in replacements:
                # We want to replace inside className="..." strings or template literals className={...}
                # Using a simpler regex that just looks for the word, but avoids replacing if it's already followed/preceded by dark:
                # The negative lookbehind and lookahead in the pattern should handle this.
                content = re.sub(pattern, replacement, content)
                
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                modified_files += 1

print(f"Patched {modified_files} files with dark mode classes.")
