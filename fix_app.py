import re
import os

def fix_app():
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    vars_to_prefix = ['setSuppliers', 'setShifts', 'setDigitalAccounts', 'setStockTxns', 'setRateHistory', 'setStaffFinance', 'setAttendance', 'setStandaloneExpenses', 'handleAddStation', 'handleEditStation', 'handleDeleteStation', 'showToast', 'showConfirm', 'showAlert', 'closeConfirm', 'action', 'category', 'details', 'context']
    
    for var in vars_to_prefix:
        content = re.sub(r'\b' + var + r'\b', '_' + var, content)
        
    content = re.sub(r"import IdleScreenLock from '\./components/shared/IdleScreenLock';\n", '', content)
    
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

fix_app()
