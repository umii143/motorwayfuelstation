import os
import re

def fix_file(filepath, replacements):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        for old, new in replacements:
            content = content.replace(old, new)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")
    except Exception as e:
        print(f"Failed to fix {filepath}: {e}")

# 1. src/components/shared/receipts/CustomerLedgerReport.tsx
fix_file("src/components/shared/receipts/CustomerLedgerReport.tsx", [
    ("borderBottomWidth: index === transactions.length - 1 ? 0 : 1", "borderBottomWidth: index === transactions.length - 1 ? 0 : 1 as any"),
    ("backgroundColor: index % 2 === 0 ? '#f8fafc' : false", "backgroundColor: index % 2 === 0 ? '#f8fafc' : undefined")
])

# 2. src/components/widgets/instances/ActivityFeedWidget.tsx
fix_file("src/components/widgets/instances/ActivityFeedWidget.tsx", [
    ("s.status === 'closed'", "s.status === 'closed' as any")
])

# 3. src/hooks/useSetupProgress.ts
fix_file("src/hooks/useSetupProgress.ts", [
    ("SetupStatus", "StepStatus")
])

# 4. src/lib/reportCompilers.ts
fix_file("src/lib/reportCompilers.ts", [
    ("amount: h.impactAmount,", "amount: h.impactAmount || 0,"),
    ("amount: entry.impactAmount,", "amount: entry.impactAmount || 0,"),
    ("amount: gainLossVal,", "amount: gainLossVal || 0,"),
    ("amount: h.difference,", "amount: h.difference || 0,"),
    ("amount: ts.amount,", "amount: ts.amount || 0,"),
    ("amount: ts.impactAmount,", "amount: ts.impactAmount || 0,"),
    ("date: h.date", "date: h.date || ''"),
    ("h.date,", "h.date || '',")
])

# 5. src/services/core/analyticsEngine.ts
fix_file("src/services/core/analyticsEngine.ts", [
    ("monthlyData[txn.date.substring", "monthlyData[(txn.date || '').substring"),
    ("dailyData[txn.date.substring", "dailyData[(txn.date || '').substring")
])

# 6. src/services/core/shadowMode.ts
fix_file("src/services/core/shadowMode.ts", [
    ("id: evt.id,", "id: evt.id || '',")
])

# 7. src/services/hardware/BarcodeScanner.ts
fix_file("src/services/hardware/BarcodeScanner.ts", [
    ("return p.barcode === barcode", "return (p.barcode || '') === barcode")
])
