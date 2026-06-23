import json

data = json.load(open('eslint_features.json', encoding='utf-16'))
for file in data:
    if 'Dashboard.tsx' in file['filePath']:
        for msg in file['messages']:
            print(f"Line {msg['line']}: {msg['message']}")
