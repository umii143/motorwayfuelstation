import re

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Staff Avatar logic safely without touching outer divs
old_avatar = '''                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold uppercase shadow-sm">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-sans text-sm font-bold ${selectedStaffId === s.id ? 'text-blue-900' : 'text-slate-700'}`}>
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-500">{s.role}</p>
                      </div>
                    </div>
                    {selectedStaffId === s.id && (
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    )}'''

new_avatar = '''                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 border border-slate-700 overflow-hidden shadow-sm">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1e293b&color=f97316&bold=true`} alt={s.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className={`font-sans text-sm font-bold ${selectedStaffId === s.id ? 'text-orange-400' : 'text-slate-200'}`}>
                          {s.name}
                        </p>
                        <p className="text-xs text-slate-400">{s.role}</p>
                      </div>
                    </div>
                    {selectedStaffId === s.id && (
                      <CheckCircle2 className="h-5 w-5 text-orange-500" />
                    )}'''

content = content.replace(old_avatar, new_avatar)

# 2. Extract ExpenseEntryTab
old_expense_tab = '''              {/* TAB 4: EXPENSES */}
              {activeTab === "expense" && (
                <div className="space-y-6">
                  <h3 className="font-sans text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                    {t("💸 Expenses (Operations)", "اخراجات")}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        {t("Category:", "زمرہ:")}
                      </label>
                      <select
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value)}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 font-sans text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        {t("Amount:", "رقم:")}
                      </label>
                      <input
                        type="number"
                        value={expAmount}
                        onChange={(e) => setExpAmount(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        {t("Description:", "تفصیل:")}
                      </label>
                      <input
                        type="text"
                        value={expDesc}
                        onChange={(e) => setExpDesc(e.target.value)}
                        placeholder="e.g. Tea for staff"
                        className="w-full rounded-md border border-slate-200 px-3 py-2 font-sans text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddExpense}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 font-sans text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t("ADD EXPENSE", "خرچہ شامل کریں")}</span>
                  </button>

                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <h4 className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                      {t("Recorded Expenses:", "درج شدہ اخراجات:")}
                    </h4>
                    {activeShift.expenses.length === 0 ? (
                      <p className="text-center py-4 font-sans text-xs text-slate-400 border border-slate-100 border-dashed rounded-lg bg-slate-50/50">
                        {t("No expenses recorded.", "ابھی تک کوئی خرچہ درج نہیں کیا گیا۔")}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {activeShift.expenses.map((ex) => (
                          <div
                            key={ex.id}
                            className="flex justify-between items-center text-xs p-2 rounded-lg border border-slate-100 bg-white shadow-sm"
                          >
                            <div className="font-sans text-slate-700">
                              <span className="font-bold text-slate-900">
                                {EXPENSE_CATEGORIES.find((c) => c.id === ex.category)?.label || ex.category}
                              </span>
                              {ex.description && <span className="text-slate-500 ml-1">({ex.description})</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-900">
                                Rs. {ex.amount.toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleDeleteExpense(ex.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}'''

new_expense_tab = '''              {/* TAB 4: EXPENSES */}
              {activeTab === "expense" && (
                <ExpenseEntryTab 
                  activeShift={activeShift}
                  setActiveShift={setActiveShift}
                  t={t}
                />
              )}'''

content = content.replace(old_expense_tab, new_expense_tab)


# 3. Add ExpenseEntryTab to imports
if 'import { ExpenseEntryTab }' not in content:
    content = content.replace('import { ShiftDebtors } from "./ShiftWizard/ShiftDebtors";', 
                              'import { ShiftDebtors } from "./ShiftWizard/ShiftDebtors";\nimport { ExpenseEntryTab } from "./ShiftWizard/ExpenseEntryTab";')

# 4. Step 1 Top Metrics border/bg
content = content.replace('className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"', 'className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 shadow-sm"')
content = content.replace('text-slate-900', 'text-slate-200') # This is globally safe for the dark mode!
content = content.replace('bg-white', 'bg-slate-900/50')
content = content.replace('border-slate-200', 'border-slate-700/50')
content = content.replace('border-slate-100', 'border-slate-700/50')
content = content.replace('bg-slate-50', 'bg-slate-800/50')
content = content.replace('text-slate-800', 'text-slate-200')
content = content.replace('text-blue-800', 'text-blue-200')
content = content.replace('text-blue-900', 'text-blue-300')
content = content.replace('bg-blue-50/50', 'bg-blue-500/10')
content = content.replace('bg-blue-50', 'bg-blue-500/20')
content = content.replace('bg-blue-100', 'bg-blue-500/30')
content = content.replace('text-blue-600', 'text-blue-400')
content = content.replace('border-blue-100', 'border-blue-500/20')
content = content.replace('bg-emerald-50', 'bg-emerald-500/10')
content = content.replace('border-emerald-100', 'border-emerald-500/20')
content = content.replace('text-emerald-700', 'text-emerald-400')
content = content.replace('bg-orange-50', 'bg-orange-500/10')
content = content.replace('border-orange-200', 'border-orange-500/50')
content = content.replace('bg-indigo-50', 'bg-indigo-500/10')
content = content.replace('border-indigo-200', 'border-indigo-500/50')

with open('d:/newfuelstation5/fuelpro/src/components/features/ShiftWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

