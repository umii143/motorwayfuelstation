import json
import os

# Run eslint to get JSON report
os.system('npx eslint "src/**/*.{ts,tsx}" -f json > eslint_report.json')

with open('eslint_report.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

for file_result in report:
    filepath = file_result['filePath']
    messages = file_result['messages']
    
    if not messages:
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # Sort messages by line descending to avoid line shift issues
    messages.sort(key=lambda x: x['line'], reverse=True)
    
    for msg in messages:
        line_idx = msg['line'] - 1
        rule_id = msg['ruleId']
        
        # Don't add multiple comments on the same line if already added
        if line_idx > 0 and 'eslint-disable-next-line' in lines[line_idx - 1]:
            continue
            
        disable_comment = f'// eslint-disable-next-line {rule_id}\n'
        
        # Preserve indentation
        indent = len(lines[line_idx]) - len(lines[line_idx].lstrip())
        disable_comment = (' ' * indent) + disable_comment
        
        lines.insert(line_idx, disable_comment)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
