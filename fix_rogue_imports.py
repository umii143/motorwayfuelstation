import os

files = [
    r'src\components\features\BIAnalyticsHub\components\BIInvestmentChart.tsx',
    r'src\components\features\FuelDashboard.tsx',
    r'src\components\features\LubeReports.tsx',
    r'src\components\features\SecurityScreen.tsx',
    r'src\components\features\ShiftLogs.tsx',
    r'src\components\features\ShiftSidebar.tsx',
    r'src\components\features\ShiftWizard\ExpenseEntryTab.tsx',
    r'src\components\features\SupplierCommandCenter\SupplierCommandCenter.tsx',
    r'src\components\layouts\SidebarDrawer.tsx',
    r'src\services\fileStorage.service.ts',
    r'src\utils\SoundManager.ts'
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    logger_line = None
    logger_index = -1
    for i, line in enumerate(lines):
        if 'import { logger }' in line:
            # check if it is embedded inside another import
            if i > 0 and 'import {' in lines[i-1] and '}' not in lines[i-1]:
                # It's inside a destructured import block
                logger_line = line
                logger_index = i
                break
            # check if it is inside a class or function
            if i > 0 and ('class ' in lines[i-1] or 'function ' in lines[i-1] or '=>' in lines[i-1] or '{' in lines[i-1]):
                logger_line = line
                logger_index = i
                break
            
            # Or if it's just strangely indented
            if line.startswith(' '):
                logger_line = line
                logger_index = i
                break

    if logger_index != -1:
        del lines[logger_index]
        
        # Find the last valid import
        last_import = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        
        lines.insert(last_import + 1, logger_line.lstrip())
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"Fixed {filepath}")
    else:
        print(f"Could not automatically fix {filepath}")
