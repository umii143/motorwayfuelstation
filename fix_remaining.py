import os

files = [
    r'src\components\features\BIAnalyticsHub\components\BIInvestmentChart.tsx',
    r'src\components\features\FuelDashboard.tsx',
    r'src\components\features\SecurityScreen.tsx',
    r'src\components\features\ShiftLogs.tsx',
    r'src\components\features\ShiftSidebar.tsx',
    r'src\components\features\SupplierCommandCenter\SupplierCommandCenter.tsx',
    r'src\components\layouts\SidebarDrawer.tsx'
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # remove all logger lines
    new_lines = []
    logger_line = None
    
    for line in lines:
        if 'import { logger }' in line:
            logger_line = line.lstrip()
        else:
            new_lines.append(line)
            
    if logger_line:
        # Find the last top-level import
        last_import = 0
        for i, line in enumerate(new_lines):
            if line.startswith('import '):
                last_import = i
                
        new_lines.insert(last_import + 1, logger_line)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Fixed {filepath}")
