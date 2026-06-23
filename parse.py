import json

with open('eslint_report.json', 'r', encoding='utf-16') as f:
    data = json.load(f)

for file in data:
    for msg in file.get('messages', []):
        if msg.get('ruleId') == '@typescript-eslint/no-explicit-any':
            print(f"{file['filePath']} - Line {msg['line']}")
