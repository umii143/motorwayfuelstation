import json
data = json.loads(open('eslint_features2.json', encoding='utf-16le').read().lstrip('\ufeff'))
errs = []
for file in data:
    for msg in file['messages']:
        if msg.get('message') == 'Parsing error: Identifier expected.':
            errs.append(f"{file['filePath'].split('fuelpro\\\\')[-1]}:{msg['line']}")
print(errs[:10], len(errs))
