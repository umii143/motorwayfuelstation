import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Customer, Product, Shift } from '../../../types';

interface ShiftDebtorsProps {
  t: (en: string, ur: string) => string;
   
  settings: unknown;
  activeShift: Shift;
  customers: Customer[];
  effectiveCustomers: (Customer & { effectiveBalance: number })[];
  products: Product[];
  debCustId: string;
  setDebCustId: (val: string) => void;
  debProdId: string;
  setDebProdId: (val: string) => void;
  debQty: string;
  setDebQty: (val: string) => void;
  debNote: string;
  setDebNote: (val: string) => void;
  showQuickCustomer: boolean;
  setShowQuickCustomer: (val: boolean) => void;
  quickCustomerName: string;
  setQuickCustomerName: (val: string) => void;
  onAddCustomer?: (customer: Customer) => void;
  handleQuickAddCustomer: (e: React.FormEvent) => void;
  handleAddDebit: () => void;
  handleDeleteDebit: (id: string) => void;
}

export function ShiftDebtors({
  t,
  settings,
  activeShift,
  customers,
  effectiveCustomers,
  products,
  debCustId,
  setDebCustId,
  debProdId,
  setDebProdId,
  debQty,
  setDebQty,
  debNote,
  setDebNote,
  showQuickCustomer,
  setShowQuickCustomer,
  quickCustomerName,
  setQuickCustomerName,
  onAddCustomer,
  handleQuickAddCustomer,
  handleAddDebit,
  handleDeleteDebit,
}: ShiftDebtorsProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-sans text-sm font-bold text-slate-200 border-b border-slate-700/50 pb-2 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
        {t("Credit Sales (Udhar)", "ادھار فروخت")}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t("Customer:", "گاہک:")}
            </label>
            {onAddCustomer && (
              <button
                onClick={() => setShowQuickCustomer(true)}
                className="text-[9px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded hover:bg-rose-500/20 transition-colors pointer-events-auto"
              >
                + {t("Quick Add", "نیا")}
              </button>
            )}
          </div>

          {showQuickCustomer ? (
            <form onSubmit={handleQuickAddCustomer} className="flex gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
              <input
                autoFocus
                type="text"
                placeholder={t("Name...", "نام...")}
                value={quickCustomerName}
                onChange={(e) => setQuickCustomerName(e.target.value)}
                className="w-full rounded-md border border-slate-600 bg-slate-900/50 px-2.5 py-1.5 font-sans text-xs text-slate-200 focus:border-rose-500 outline-none"
              />
              <button
                type="submit"
                className="bg-rose-600 text-white px-3 py-1.5 rounded-md font-bold text-[10px] uppercase shadow-sm hover:bg-rose-500 transition-colors"
              >
                {t("Save", "سیو")}
              </button>
              <button
                type="button"
                onClick={() => setShowQuickCustomer(false)}
                className="bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md font-bold text-[10px] uppercase hover:bg-slate-600 transition-colors"
              >
                X
              </button>
            </form>
          ) : (
            <select
              value={debCustId}
              onChange={(e) => setDebCustId(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 font-sans text-xs text-slate-200 focus:border-rose-500 focus:bg-slate-800 outline-none transition-colors"
            >
              <option value="">
                {t("-- Select --", "-- منتخب کریں --")}
              </option>
              {effectiveCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {settings.language === "en" ? c.name : c.urduName} ({t(`Rs. ${c.effectiveBalance}`, `${c.effectiveBalance} روپے`)})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t("Product:", "آئٹم:")}
          </label>
          <select
            value={debProdId}
            onChange={(e) => setDebProdId(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 font-sans text-xs text-slate-200 focus:border-rose-500 focus:bg-slate-800 outline-none transition-colors"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {settings.language === "en" ? p.name : p.urduName} ({t(`Rs. ${p.rate}/${p.unit}`, `${p.rate} روپے`)})
              </option>
            ))}
            <option value="general_debit">
              ⚡ {t("Cash Loan", "نقد قرض")}
            </option>
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {debProdId === "general_debit"
              ? t("Amount:", "رقم:")
              : t(`Quantity:`, `تعداد:`)}
          </label>
          <input
            type="number"
            value={debQty}
            onChange={(e) => setDebQty(e.target.value)}
            placeholder={debProdId === "general_debit" ? "e.g. 5000" : "e.g. 50"}
            className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 font-mono text-sm text-rose-400 focus:border-rose-500 focus:bg-slate-800 outline-none transition-colors"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t("Note:", "نوٹ:")}
          </label>
          <input
            type="text"
            value={debNote}
            onChange={(e) => setDebNote(e.target.value)}
            placeholder={debProdId === "general_debit" ? "e.g. Cash Loan" : "e.g. Truck S-98"}
            className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 font-sans text-xs text-slate-200 focus:border-rose-500 focus:bg-slate-800 outline-none transition-colors"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
        <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {t("Total:", "کل رقم:")}
        </span>
        <span className="font-mono text-lg font-bold text-rose-400">
          Rs.{" "}
          {(
            (Number(debQty) || 0) *
            (debProdId === "general_debit"
              ? 1
              : products.find((p) => p.id === debProdId)?.rate || 0)
          ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>

      <button
        onClick={handleAddDebit}
        className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-sans text-xs font-bold rounded-xl hover:from-rose-500 hover:to-rose-400 cursor-pointer shadow-lg shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-2 mt-2 transition-all uppercase tracking-wider"
      >
        <Plus className="h-4 w-4" />
        <span>{t("ADD DEBIT", "ادھار لکھیں")}</span>
      </button>

      {/* Registered Debits Lists */}
      <div className="mt-6 border-t border-slate-700/50 pt-4">
        <h4 className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
          {t("Added Debits This Shift:", "اس شفٹ میں شامل کردہ قرضے:")}
        </h4>
        {activeShift.debitEntries.length === 0 ? (
          <p className="text-center py-6 font-sans text-xs text-slate-500 border border-slate-700/50 border-dashed rounded-xl bg-slate-800/20">
            {t("No debit transactions added yet.", "ابھی تک کوئی انٹری نہیں لکھی گئی۔")}
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {activeShift.debitEntries.map((d) => {
              const cName = customers.find((c) => c.id === d.customerId)?.name || "Debtor";
              const isGen = d.productId === "general_debit";
              const pName = isGen
                ? t("General Debit / Loan", "جنرل ڈیبٹ / نقد قرض")
                : products.find((p) => p.id === d.productId)?.name || "Fuel";
              const unitStr = isGen
                ? "Rs."
                : products.find((p) => p.id === d.productId)?.unit || "L";
              return (
                <div
                  key={d.id}
                  className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/80 transition-colors"
                >
                  <div className="font-sans text-slate-300 pr-4">
                    <span className="font-bold text-slate-200">{cName}</span> <span className="text-slate-500">—</span>{" "}
                    {isGen ? "" : <span className="font-mono text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">{d.quantity} {unitStr}</span>} <span className="font-medium">{pName}</span>{" "}
                    {d.note && <span className="text-slate-500 ml-1">({d.note})</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-rose-400">
                      Rs. {d.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeleteDebit(d.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
