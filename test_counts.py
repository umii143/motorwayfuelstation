import json

data = json.load(open('eslint_features.json', encoding='utf-16'))
counts = []
for f in data:
    if f['errorCount'] > 0:
        counts.append((f['filePath'], f['errorCount']))
counts.sort(key=lambda x: x[1], reverse=True)
for path, c in counts[:10]:
    print(str(c) + " : " + path[-50:])
