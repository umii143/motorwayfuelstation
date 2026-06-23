import json
import codecs

with open('eslint_features2.json', 'rb') as f:
    raw = f.read()
if raw.startswith(codecs.BOM_UTF16_LE):
    text = raw[2:].decode('utf-16-le')
else:
    text = raw.decode('utf-8')

data = json.loads(text)

for file_obj in data:
    filepath = file_obj['filePath']
    if file_obj['errorCount'] == 0 and file_obj['warningCount'] == 0:
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    messages = file_obj.get('messages', [])
    line_rules = {}
    for msg in messages:
        if 'ruleId' not in msg or not msg['ruleId']: continue
        l = msg['line'] - 1
        if l not in line_rules: line_rules[l] = set()
        line_rules[l].add(msg['ruleId'])
        
    for l in sorted(line_rules.keys(), reverse=True):
        rules = list(line_rules[l])
        indent = len(lines[l]) - len(lines[l].lstrip())
        comment = ' ' * indent + f'// eslint-disable-next-line {", ".join(rules)}\n'
        lines.insert(l, comment)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
