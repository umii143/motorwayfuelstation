import json
data = json.loads(open('eslint_features4.json', encoding='utf-16le').read().lstrip('\ufeff'))
with open('any_fixes.txt', 'w', encoding='utf-8') as f:
    for file in data:
        lines_with_any = []
        try:
            with open(file['filePath'], 'r', encoding='utf-8') as src:
                src_lines = src.readlines()
            for msg in file['messages']:
                if msg.get('ruleId') == '@typescript-eslint/no-explicit-any':
                    line_num = msg['line']
                    lines_with_any.append((line_num, src_lines[line_num-1].strip()))
            if lines_with_any:
                f.write(f'# {file["filePath"].split("fuelpro\\\\")[-1]}\n')
                for l, text in lines_with_any:
                    f.write(f'- {l}: {text}\n')
        except Exception as e:
            pass
