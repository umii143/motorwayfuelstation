import json
data = json.loads(open('eslint_zero.json', encoding='utf-16le').read().lstrip('\ufeff'))
unused = []
for file in data:
    for msg in file['messages']:
        if msg['ruleId'] == '@typescript-eslint/no-unused-vars':
            var_name = msg['message'].split("'")[1] if "'" in msg['message'] else msg['message']
            unused.append((file['filePath'].split('fuelpro\\\\')[-1], msg['line'], var_name))

with open('unused_vars.txt', 'w', encoding='utf-8') as f:
    for file_path, line, var_name in sorted(unused):
        f.write(f'{file_path}:{line} -> {var_name}\n')
