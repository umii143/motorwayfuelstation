import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Customer, Product, Shift } from '../../../types';

interface ShiftDebtorsProps {
  t: (en: string, ur: string) => string;
  settings: any;
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
    <div className="space-y-3">
      <h3 className="font-sans text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-3">
        {t("💳 Credit Sales (Udhar)", "ادھار فروخت")}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              {t("Customer:", "گاہک:")}
            </label>
            {onAddCustomer && (
              <button
                onClick={() => setShowQuickCustomer(true)}
                className="text-[9px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded hover:bg-orange-100 transition-colors pointer-events-auto"
              >
                + {t("Quick Add", "نیا")}
              </button>
            )}
          </div>

          {showQuickCustomer ? (
            <form onSubmit={handleQuickAddCustomer} className="flex gap-1">
              <input
                autoFocus
                type="text"
                placeholder={t("Name...", "نام...")}
                value={quickCustomerName}
                onChange={(e) => setQuickCustomerName(e.target.value)}
                className="w-full rounded-md border border-orange-300 bg-white px-2 py-1.5 font-sans text-xs text-slate-800 shadow-xs focus:border-orange-500 outline-none"
              />
              <button
                type="submit"
                className="bg-orange-600 text-white px-2 py-1.5 rounded-md font-bold text-[10px] uppercase shadow-sm"
              >
                {t("Save", "سیو")}
              </button>
              <button
                type="button"
                onClick={() => setShowQuickCustomer(false)}
                className="bg-slate-200 text-slate-600 px-2 py-1.5 rounded-md font-bold text-[10px] uppercase"
              >
                X
              </button>
            </form>
          ) : (
            <select
              value={debCustId}
              onChange={(e) => setDebCustId(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-sans text-xs text-slate-800 shadow-xs focus:border-orange-500"
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
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            {t("Product:", "آئٹم:")}
          </label>
          <select
            value={debProdId}
            onChange={(e) => setDebProdId(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-sans text-xs text-slate-800 shadow-xs focus:border-orange-500"
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
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            {debProdId === "general_debit"
              ? t("Amount:", "رقم:")
              : t(`Quantity:`, `تعداد:`)}
          </label>
          <input
            type="number"
            value={debQty}
            onChange={(e) => setDebQty(e.target.value)}
            placeholder={debProdId === "general_debit" ? "e.g. 5000" : "e.g. 50"}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs focus:border-orange-500"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            {t("Note:", "نوٹ:")}
          </label>
          <input
            type="text"
            value={debNote}
            onChange={(e) => setDebNote(e.target.value)}
            placeholder={debProdId === "general_debit" ? "e.g. Cash Loan" : "e.g. Truck S-98"}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-sans text-xs focus:border-orange-500"
          />
        </div>
      </div>

      <div className="mt-2 flex justify-between items-center bg-slate-50 p-2 rounded-md border border-slate-200 border-dashed">
        <span className="font-sans text-[10px] font-semibold text-slate-500">
          {t("Total:", "کل رقم:")}
        </span>
        <span className="font-mono text-sm font-bold text-slate-800">
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
        className="w-full py-2 bg-orange-600 text-white font-sans text-xs font-bold rounded-lg hover:bg-orange-700 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5 mt-2"
      >
        <Plus className="h-3 w-3" />
        <span>{t("ADD DEBIT", "ادھار لکھیں")}</span>
      </button>

      {/* Registered Debits Lists */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          {t("Added Debits This Shift:", "اس شفٹ میں شامل کردہ قرضے:")}
        </h4>
        {activeShift.debitEntries.length === 0 ? (
          <p className="text-center py-4 font-sans text-xs text-slate-400 border border-slate-100 border-dashed rounded-lg bg-slate-50/50">
            {t("No debit transactions added yet.", "ابھی تک کوئی انٹری نہیں لکھی گئی۔")}
          </p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
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
                  className="flex justify-between items-center text-xs p-2 rounded-lg border border-slate-100 bg-slate-50/20"
                >
                  <div className="font-sans text-slate-700 pr-4">
                    <span className="font-bold">{cName}</span> —{" "}
                    {isGen ? "" : `${d.quantity} ${unitStr}`} {pName}{" "}
                    {d.note && `(${d.note})`}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-rose-500">
                      Rs. {d.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeleteDebit(d.id)}
                      className="text-red-500 hover:text-red-700 cursor-pointer"
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
