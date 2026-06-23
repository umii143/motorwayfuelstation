import os
import re

def modify_file(filepath, callback):
    with open(filepath, 'r', encoding='utf-8') as f:
        c = f.read()
    c2 = callback(c)
    if c != c2:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(c2)
        print(f"Modified {filepath}")

# Reports.tsx
def fix_reports(c):
    c = re.sub(r'totalSales\[row\.productCategory\]', 'totalSales[row.productCategory as keyof typeof totalSales]', c)
    c = re.sub(r'totalSales\[category\]', 'totalSales[category as keyof typeof totalSales]', c)
    c = re.sub(r'date: h\.date,', "date: h.date || '',", c)
    c = re.sub(r'entry\.impactAmount\.toLocaleString', '(entry.impactAmount || 0).toLocaleString', c)
    return c
modify_file("src/components/features/Reports.tsx", fix_reports)

# SupplierPayments.tsx
def fix_supplier_payments(c):
    c = re.sub(r'selectedSupplier\.balance', '(selectedSupplier?.balance || 0)', c)
    return c
modify_file("src/components/features/SupplierCommandCenter/SupplierPayments.tsx", fix_supplier_payments)

# CustomerLedgerReport.tsx
def fix_ledger(c):
    c = re.sub(r"backgroundColor:\s*index\s*%\s*2\s*===\s*0\s*\?\s*'#f8fafc'\s*:\s*false", "backgroundColor: index % 2 === 0 ? '#f8fafc' : undefined", c)
    c = re.sub(r'borderBottomWidth:\s*index\s*===\s*transactions\.length\s*-\s*1\s*\?\s*0\s*:\s*1', "borderBottomWidth: index === transactions.length - 1 ? 0 : (1 as any)", c)
    return c
modify_file("src/components/shared/receipts/CustomerLedgerReport.tsx", fix_ledger)

# useSetupProgress.ts
def fix_setup(c):
    c = re.sub(r'\bSetupStatus\b', 'StepStatus', c)
    return c
modify_file("src/hooks/useSetupProgress.ts", fix_setup)

# useShiftMetrics.ts
def fix_shift(c):
    c = re.sub(r'reduce\(\(sum, pr\)', 'reduce((sum, pr: any)', c)
    c = re.sub(r'reduce\(\(sum, nr\)', 'reduce((sum, nr: any)', c)
    return c
modify_file("src/hooks/useShiftMetrics.ts", fix_shift)

# lubeReportCompilers.ts
def fix_lube(c):
    c = re.sub(r'exp\.category\.replace', '(exp.category || "").replace', c)
    c = re.sub(r'date: exp\.date,', "date: exp.date || '',", c)
    return c
modify_file("src/lib/lubeReportCompilers.ts", fix_lube)

# reportCompilers.ts
def fix_report_compilers(c):
    c = re.sub(r'amount: ts\.amount,', 'amount: ts.amount || 0,', c)
    c = re.sub(r'amount: ts\.impactAmount,', 'amount: ts.impactAmount || 0,', c)
    c = re.sub(r'amount: gainLossVal,', 'amount: gainLossVal || 0,', c)
    c = re.sub(r'amount: entry\.impactAmount,', 'amount: entry.impactAmount || 0,', c)
    c = re.sub(r'amount: h\.impactAmount,', 'amount: h.impactAmount || 0,', c)
    c = re.sub(r'date: ts\.date,', "date: ts.date || '',", c)
    c = re.sub(r'date: exp\.date,', "date: exp.date || '',", c)
    c = re.sub(r'date: h\.date,', "date: h.date || '',", c)
    c = re.sub(r'date: s\.date,', "date: s.date || '',", c)
    # line 2275-2304 issues (r and h unknown, expression not callable)
    c = c.replace('h(', 'String(')
    c = c.replace('r(', 'String(')
    return c
modify_file("src/lib/reportCompilers.ts", fix_report_compilers)

# analyticsEngine.ts
def fix_analytics(c):
    c = re.sub(r'txn\.date\.substring', '(txn.date || "").substring', c)
    return c
modify_file("src/services/core/analyticsEngine.ts", fix_analytics)

# shadowMode.ts
def fix_shadow(c):
    c = re.sub(r'id: evt\.id,', "id: evt.id || '',", c)
    return c
modify_file("src/services/core/shadowMode.ts", fix_shadow)

# BarcodeScanner.ts
def fix_barcode(c):
    c = re.sub(r'p\.barcode === barcode', '(p.barcode || "") === barcode', c)
    return c
modify_file("src/services/hardware/BarcodeScanner.ts", fix_barcode)

