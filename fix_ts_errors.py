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

# 1. src/components/features/FleetHub/CustomerDetailsFullPage.tsx
fix_file("src/components/features/FleetHub/CustomerDetailsFullPage.tsx", [
    ("date: s.date,", "date: s.date || '',"),
    ("timestamp: new Date(s.date).getTime()", "timestamp: new Date(s.date || '').getTime()"),
    ("date: r.date,", "date: r.date || '',"),
    ("timestamp: new Date(r.date).getTime()", "timestamp: new Date(r.date || '').getTime()"),
    ("new Date(txn.date).toLocaleDateString()", "new Date(txn.date || '').toLocaleDateString()"),
    ("txn.type === 'Sale'", "txn.type === 'Credit Sale'"),
    ("txn.type === 'Purchase'", "txn.type === 'Recovery'"),
    ("new Date(s.date)", "new Date(s.date || '')"),
    ("new Date(r.date)", "new Date(r.date || '')")
])

# 2. src/components/features/InvestigationModal.tsx
fix_file("src/components/features/InvestigationModal.tsx", [
    ("let nozzleSales = [];", "let nozzleSales: any[] = [];")
])

# 3. src/components/features/PriceManagement/AdvancedPriceManagement.tsx
fix_file("src/components/features/PriceManagement/AdvancedPriceManagement.tsx", [
    ("rh.newRate", "(rh.newRate || 0)"),
    ("rh.oldRate", "(rh.oldRate || 0)"),
    ("rh.date", "(rh.date || '')"),
    ("p.effectiveTime", "(p.effectiveTime || '')")
])

# 4. src/components/features/Reports.tsx
fix_file("src/components/features/Reports.tsx", [
    ("date: h.date,", "date: h.date || '',"),
    ("entry.impactAmount.toLocaleString()", "(entry.impactAmount || 0).toLocaleString()"),
    ("totalSales[row.productCategory]", "totalSales[row.productCategory as keyof typeof totalSales]"),
    ("totalSales[category]", "totalSales[category as keyof typeof totalSales]")
])

# 5. src/components/features/Settings.tsx
fix_file("src/components/features/Settings.tsx", [
    ("tab.isDanger", "(tab as any).isDanger")
])

# 6. src/components/features/SupplierCommandCenter/SupplierPayments.tsx
fix_file("src/components/features/SupplierCommandCenter/SupplierPayments.tsx", [
    ("selectedSupplier.balance", "(selectedSupplier?.balance || 0)")
])

# 7. src/components/layouts/ConfigSidebarItem.tsx
fix_file("src/components/layouts/ConfigSidebarItem.tsx", [
    ("STATUS_MAP[status]", "STATUS_MAP[status as keyof typeof STATUS_MAP]")
])

# 8. src/components/widgets/instances/ActivityFeedWidget.tsx
fix_file("src/components/widgets/instances/ActivityFeedWidget.tsx", [
    ("s.status === 'Open'", "s.status === 'active'")
])

# 9. src/hooks/useSetupProgress.ts
fix_file("src/hooks/useSetupProgress.ts", [
    ("import { SETUP_STEPS, SetupStatus }", "import { SETUP_STEPS, StepStatus }"),
    ("status: SetupStatus", "status: StepStatus"),
    ("type SetupStatus =", "type StepStatus =")
])

# 10. src/hooks/useShiftMetrics.ts
fix_file("src/hooks/useShiftMetrics.ts", [
    ("reduce((sum, pr) =>", "reduce((sum, pr: any) =>"),
    ("reduce((sum, nr) =>", "reduce((sum, nr: any) =>")
])

# 11. src/lib/lubeReportCompilers.ts
fix_file("src/lib/lubeReportCompilers.ts", [
    ("exp.category.replace", "(exp.category || '').replace"),
    ("date: exp.date,", "date: exp.date || '',")
])

# 12. src/lib/reportCompilers.ts
fix_file("src/lib/reportCompilers.ts", [
    ("date: s.date,", "date: s.date || '',"),
    ("date: h.date,", "date: h.date || '',"),
    ("date: exp.date,", "date: exp.date || '',"),
    ("date: ts.date,", "date: ts.date || '',"),
    ("h.oldRate", "(h.oldRate || 0)"),
    ("h.newRate", "(h.newRate || 0)"),
    ("h.stockAtTime", "(h.stockAtTime || 0)"),
    ("entry.impactAmount", "(entry.impactAmount || 0)"),
    ("stockVal", "(stockVal || 0)")
])

# 13. src/services/core/analyticsEngine.ts
fix_file("src/services/core/analyticsEngine.ts", [
    ("monthlyData[txn.date.substring", "monthlyData[(txn.date || '').substring"),
    ("dailyData[txn.date.substring", "dailyData[(txn.date || '').substring")
])

# 14. src/services/core/shadowMode.ts
fix_file("src/services/core/shadowMode.ts", [
    ("id: evt.id,", "id: evt.id || '',")
])

# 15. src/services/hardware/BarcodeScanner.ts
fix_file("src/services/hardware/BarcodeScanner.ts", [
    ("return p.barcode === barcode", "return (p.barcode || '') === barcode")
])
