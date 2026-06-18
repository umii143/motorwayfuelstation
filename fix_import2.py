with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we don't have it at all
content = content.replace('import { ExpenseEntryTab } from "./ShiftWizard/ExpenseEntryTab";\n', '')

# Replace ONLY the FIRST occurrence of ShiftDebtors import
parts = content.split('import { ShiftDebtors } from "./ShiftWizard/ShiftDebtors";', 1)
if len(parts) == 2:
    content = parts[0] + 'import { ShiftDebtors } from "./ShiftWizard/ShiftDebtors";\nimport { ExpenseEntryTab } from "./ShiftWizard/ExpenseEntryTab";' + parts[1]

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
