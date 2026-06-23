/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Shift, GlobalSettings, Staff, ExpenseEntry } from '../../../types';
import { logger } from '../../../lib/logger';

interface ExpenseEntryTabProps {
  t: (en: string, ur: string) => string;
  settings: GlobalSettings;
  activeShift: Shift;
  activeStationId: string;
  staff: Staff[];
   
  EXPENSE_CATEGORIES: unknown[];
  showToast: (msg: string, type: 'success'|'error') => void;
   
  onUpdateShift: (shift: Shift) => void;
  processExpense: (shiftId: string, stationId: string, branchId: string, payload: unknown, date: string) => Promise<unknown>;
  processReversal: (id: string, reason: string, shiftId: string, stationId: string, originalStationId: string, date: string) => Promise<void>;
  onAddShiftSalaryPayment?: (staffId: string, amount: number, note: string, paidFrom: "cash" | "bank", date: string, expenseId: string) => void;
  onDeleteShiftSalaryPayment?: (expenseId: string) => void;
}

export default function ExpenseEntryTab({
  t,
  settings,
  activeShift,
  activeStationId,
  staff,
  EXPENSE_CATEGORIES,
  showToast,
  onUpdateShift,
  processExpense,
  processReversal,
  onAddShiftSalaryPayment,
  onDeleteShiftSalaryPayment
}: ExpenseEntryTabProps) {
  const [expCategory, setExpCategory] = useState("meals");
  const [expAmount, setExpAmount] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expPaidFrom, setExpPaidFrom] = useState<"cash" | "bank">("cash");
  const [expStaffId, setExpStaffId] = useState("");

  const handleAddExpense = () => {
    const amount = Number(expAmount);
    if (!amount || amount <= 0) {
      showToast(
        t("Please enter a valid expense amount.", "براہ کرم درست رقم درج کریں۔"),
        "error"
      );
      return;
    }
    if (expCategory === "salary" && !expStaffId) {
      showToast(
        t("Please select a staff member for salary payment.", "تنخواہ کی ادائیگی کے لیے ملازم کا انتخاب کریں۔"),
        "error"
      );
      return;
    }

    const staffMember = staff.find((s) => s.id === expStaffId);
    const finalDesc =
      expDesc ||
      (expCategory === "salary" && staffMember
        ? `Salary/Advance: ${staffMember.name}`
        : expCategory.toUpperCase().replace("_", " "));

    const newExp: ExpenseEntry = {
      id: `exp_${Date.now()}`,
      category: expCategory,
      amount,
      description: finalDesc,
      paidFrom: expPaidFrom,
      staffId: expCategory === "salary" ? expStaffId : undefined,
      date: new Date().toISOString(),
    };

    if (expCategory === "salary" && expStaffId && onAddShiftSalaryPayment) {
      onAddShiftSalaryPayment(expStaffId, amount, finalDesc, expPaidFrom, activeShift.date, newExp.id);
    }

    onUpdateShift({
      ...activeShift,
      expenseEntries: [...activeShift.expenseEntries, newExp],
    });

    showToast(t("Expense added.", "اخراجات شامل کر لیے گئے۔"), "success");

    processExpense(
      activeShift.id,
      activeStationId,
      activeStationId,
      {
        category: expCategory, amount, description: finalDesc,
        paidFrom: expPaidFrom as "shift_cash" | "main_safe" | "owner_cash" | "bank",
        staffId: expCategory === "salary" ? expStaffId : undefined,
       
      },
      activeShift.date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-console
    ).catch((err: unknown) => logger.warn('[EOC] Expense pipeline:', err.message));

    setExpAmount("");
    setExpDesc("");
    setExpStaffId("");
  };

  const handleDeleteExpense = (id: string) => {
    const expToDelete = activeShift.expenseEntries.find((e) => e.id === id);
    if (expToDelete?.category === "salary" && onDeleteShiftSalaryPayment) {
      onDeleteShiftSalaryPayment(id);
    }
    showToast(
      t("This expense will be reversed with an audit entry.", "یہ اخراجات ریورسل انٹری کے ساتھ پلٹائے جائیں گے۔"),
      "success"
    );
     
    const updated = { ...activeShift, expenseEntries: activeShift.expenseEntries.filter((e) => e.id !== id) };
    onUpdateShift(updated);
    processReversal(id, t("User reversed expense entry", "صارف نے اخراجات اندراج پلٹایا"), activeShift.id, activeStationId, activeStationId, activeShift.date)
      .catch((err: Error) => logger.warn('[EOC] Expense reversal:', err.message));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-sans text-sm font-bold text-slate-200 border-b border-slate-700/50 pb-2 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
        {t("Operational Expenses", "آپریشنل اخراجات")}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t("Category:", "کیٹیگری:")}
          </label>
          <select
            value={expCategory}
            onChange={(e) => setExpCategory(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 font-sans text-xs text-slate-200 focus:border-red-500 focus:bg-slate-800 outline-none transition-colors"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon}{" "}
                {settings.language === "en" ? cat.label : cat.urdu}
              </option>
            ))}
          </select>
        </div>

        {expCategory === "salary" && (
          <div className="col-span-2 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 transition-all">
            <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
              <span>👷</span>{" "}
              {t("Staff Member:", "ملازم:")}
            </label>
            <select
              value={expStaffId}
              onChange={(e) => setExpStaffId(e.target.value)}
              className="w-full rounded-md border border-orange-500/30 bg-slate-900/50 px-3 py-2 font-sans text-xs text-slate-200 focus:border-orange-500 font-medium outline-none transition-colors"
            >
              <option value="">
                {t("-- Choose --", "-- منتخب کریں --")}
              </option>
              {staff
                .filter((st) => st.active)
                .map((st) => (
                  <option key={st.id} value={st.id}>
                    {settings.language === "en" ? st.name : st.urduName} ({st.role.toUpperCase()}) — {t(`Adv: Rs. ${st.advances || 0}`, `ایڈوانس: ${st.advances || 0} روپے`)}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t("Amount:", "رقم:")}
          </label>
          <input
            type="number"
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)}
            placeholder="e.g. 1200"
            className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 font-mono text-sm text-red-400 focus:border-red-500 focus:bg-slate-800 outline-none transition-colors"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t("Sourced From:", "منبع:")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setExpPaidFrom("cash")}
              className={`py-2 rounded-md border font-sans text-[10px] font-bold cursor-pointer transition-all ${
                expPaidFrom === "cash"
                  ? "border-red-500/50 bg-red-500/10 text-red-400"
                  : "border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700"
              }`}
            >
              💸 {t("Cash", "کیش")}
            </button>
            <button
              type="button"
              onClick={() => setExpPaidFrom("bank")}
              className={`py-2 rounded-md border font-sans text-[10px] font-bold cursor-pointer transition-all ${
                expPaidFrom === "bank"
                  ? "border-red-500/50 bg-red-500/10 text-red-400"
                  : "border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-700"
              }`}
            >
              🏦 {t("Bank", "بینک")}
            </button>
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t("Notes:", "نوٹ:")}
          </label>
          <input
            type="text"
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
            placeholder="e.g. Lunch tea for staff"
            className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 font-sans text-xs text-slate-200 focus:border-red-500 focus:bg-slate-800 outline-none transition-colors"
          />
        </div>
      </div>

      <button
        onClick={handleAddExpense}
        className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-sans text-xs font-bold rounded-xl hover:from-red-500 hover:to-red-400 cursor-pointer shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2 mt-2 transition-all uppercase tracking-wider"
      >
        <Plus className="h-4 w-4" />
        <span>{t("ADD EXPENSE", "خرچہ درج کریں")}</span>
      </button>

      {/* Registered Expenses List */}
      <div className="mt-6 border-t border-slate-700/50 pt-4">
        <h4 className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
          {t("Expenses This Shift:", "اس شفٹ میں اخراجات:")}
        </h4>
        {activeShift.expenseEntries.length === 0 ? (
          <p className="text-center py-6 font-sans text-xs text-slate-500 border border-slate-700/50 border-dashed rounded-xl bg-slate-800/20">
            {t(
              "No expense records logged in this session.",
              "ابھی کوئی خرچہ درج نہیں۔",
            )}
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {activeShift.expenseEntries.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/80 transition-colors"
              >
                <div className="font-sans text-slate-300 pr-4 flex-1 flex flex-wrap items-center gap-2">
                  <span className="font-bold uppercase tracking-widest text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md">
                    {e.category}
                  </span>
                  <span className="text-slate-200 font-medium">
                    {e.description}
                  </span>
                  {e.staffId && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
                      <span>👤</span>
                      <span>
                        {settings.language === "en"
                          ? staff.find((st) => st.id === e.staffId)
                              ?.name || "Staff"
                          : staff.find((st) => st.id === e.staffId)
                              ?.urduName || "ملازم"}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-red-400">
                    Rs. {e.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(e.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
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
  );
}
