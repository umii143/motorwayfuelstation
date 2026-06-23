import json
data = json.loads(open('eslint_features.json', encoding='utf-16le').read().lstrip('\ufeff'))
for file in data:
    for msg in file['messages']:
        if msg.get('message') == 'Parsing error: Identifier expected.':
            print(f"{file['filePath'].split('fuelpro\\\\')[-1]}:{msg['line']}")
