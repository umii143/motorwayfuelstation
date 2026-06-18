import re

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Missing </div> before lg:col-span-12
content = content.replace(
"""            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">{t("Active Shifts Today", "آج کی سرگرم شفٹیں")}</p>
              <h4 className="mt-1 text-xl font-bold text-slate-200">3</h4>
            </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">""",
"""            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">{t("Active Shifts Today", "آج کی سرگرم شفٹیں")}</p>
              <h4 className="mt-1 text-xl font-bold text-slate-200">3</h4>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">"""
)

# Fix 2: Leftover light mode code in Discount tab
content = content.replace(
"""              {activeTab === "discount" && (
                <div className="space-y-3">
                  <h3 className="font-sans text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-3">
                    {t("📉 Discount", "ڈسکاؤنٹ")}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        {t("Amount:", "رقم:")}
                      </label>
                <div className="space-y-4">""",
"""              {activeTab === "discount" && (
                <div className="space-y-4">"""
)

# Fix 3: Corrupted Right Column in Step 6
pattern_step6 = re.compile(
    r'(?<=Grand Total Footer \*/\n              <div className="bg-gradient-to-r from-emerald-900/80 to-slate-900 border-t border-emerald-500/20 p-6">).*?(?=\n\n        </div>\n      \)}\n\n      {\/\* ==========================================\n          STEP 7: FINAL COMPREHENSIVE SHIFT RECEIPT CARD)',
    re.DOTALL
)

step6_correct_right_col = """
                <p className="text-[11px] font-bold text-emerald-400/70 uppercase tracking-widest mb-1">
                  {t("Expected Drawer Cash", "مطلوبہ دراز کیش")}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-400">Rs.</span>
                  <span className="text-4xl font-mono font-black tracking-tight text-white">
                    {expectedTotals.expectedCash.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Calculations Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 shadow-sm">
              <h3 className="font-sans text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-400" />
                {t("System Calculation Breakdown", "سسٹم کے حساب کتاب کی تفصیل")}
              </h3>

              <div className="space-y-6">
                {/* Gross Receivables */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Gross Receivables</h4>
                  <div className="space-y-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    {expectedTotals.petrolSales > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Petrol Sales</span>
                        <span className="font-mono font-bold text-slate-200">Rs. {expectedTotals.petrolSales.toLocaleString()}</span>
                      </div>
                    )}
                    {expectedTotals.dieselSales > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Diesel Sales</span>
                        <span className="font-mono font-bold text-slate-200">Rs. {expectedTotals.dieselSales.toLocaleString()}</span>
                      </div>
                    )}
                    {expectedTotals.cngSales > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">CNG Sales</span>
                        <span className="font-mono font-bold text-slate-200">Rs. {expectedTotals.cngSales.toLocaleString()}</span>
                      </div>
                    )}
                    {expectedTotals.lubeSales > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Lubes Sales</span>
                        <span className="font-mono font-bold text-slate-200">Rs. {expectedTotals.lubeSales.toLocaleString()}</span>
                      </div>
                    )}
                    {expectedTotals.recoveries > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Recoveries</span>
                        <span className="font-mono font-bold text-slate-200">Rs. {expectedTotals.recoveries.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Gross Inflow</span>
                      <span className="font-mono font-black text-emerald-400">Rs. {(expectedTotals.grossSales + expectedTotals.recoveries).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-4 bg-red-500 rounded-full"></div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {t("Deductions (-)", "منہا کی جانے والی رقم (-)")}
                    </h4>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 space-y-3 shadow-sm">
                    {expectedTotals.debits > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Credit Sales</span>
                        <span className="font-mono font-bold text-slate-200">Rs. {expectedTotals.debits.toLocaleString()}</span>
                      </div>
                    )}
                    {expectedTotals.expenses > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Expenses</span>
                        <span className="font-mono font-bold text-slate-200">Rs. {expectedTotals.expenses.toLocaleString()}</span>
                      </div>
                    )}
                    {expectedTotals.supplierPmts > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Supplier Payments</span>
                        <span className="font-mono font-bold text-slate-200">Rs. {expectedTotals.supplierPmts.toLocaleString()}</span>
                      </div>
                    )}
                    {(expectedTotals.bank + expectedTotals.digital) > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Bank/Digital</span>
                        <span className="font-mono font-bold text-slate-200">Rs. {(expectedTotals.bank + expectedTotals.digital).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase">Total Outflow</span>
                      <span className="font-mono font-black text-rose-400">Rs. {(expectedTotals.debits + expectedTotals.expenses + expectedTotals.supplierPmts + expectedTotals.bank + expectedTotals.digital).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Grand Total Footer */}
              <div className="bg-gradient-to-r from-indigo-900/80 to-blue-900/50 border-t border-indigo-500/20 p-6">
                <p className="text-[11px] font-bold text-indigo-400/70 uppercase tracking-widest mb-1">
                  {t("Expected Drawer Cash", "مطلوبہ دراز کیش")}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-indigo-400">Rs.</span>
                  <span className="text-4xl font-mono font-black tracking-tight text-white">
                    {expectedTotals.expectedCash.toLocaleString()}
                  </span>
                </div>
              </div>

            </div>
          </div>"""

content = pattern_step6.sub(step6_correct_right_col, content)

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
