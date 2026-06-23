import json
import codecs

with open('eslint_features2.json', 'rb') as f:
    raw = f.read()
if raw.startswith(codecs.BOM_UTF16_LE):
    text = raw[2:].decode('utf-16-le')
else:
    text = raw.decode('utf-8')

data = json.loads(text)
for f in data:
    if 'Reports.tsx' in f['filePath'] and 'LubeReports.tsx' not in f['filePath']:
        for msg in f['messages']:
            print(f"Line {msg['line']}: {msg['message']}")
