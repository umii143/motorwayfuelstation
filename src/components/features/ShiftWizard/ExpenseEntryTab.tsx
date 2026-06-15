/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Shift, GlobalSettings, Staff, ExpenseEntry } from '../../../types';

interface ExpenseEntryTabProps {
  t: (en: string, ur: string) => string;
  settings: GlobalSettings;
  activeShift: Shift;
  activeStationId: string;
  staff: Staff[];
  EXPENSE_CATEGORIES: any[];
  showToast: (msg: string, type: 'success'|'error') => void;
  onUpdateShift: (shift: Shift) => void;
  processExpense: (shiftId: string, stationId: string, branchId: string, payload: any, date: string) => Promise<any>;
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
    ).catch((err: any) => console.warn('[EOC] Expense pipeline:', err.message));

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
      .catch((err: Error) => console.warn('[EOC] Expense reversal:', err.message));
  };

  return (
    <div className="space-y-3">
      <h3 className="font-sans text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-3">
        {t("💸 Operational Expenses", "آپریشنل اخراجات")}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            {t("Category:", "کیٹیگری:")}
          </label>
          <select
            value={expCategory}
            onChange={(e) => setExpCategory(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-sans text-xs text-slate-800 shadow-xs focus:border-orange-500"
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
          <div className="col-span-2 bg-orange-50/40 p-2 rounded-md border border-orange-200/60 transition-all">
            <label className="block text-[10px] font-bold text-orange-805 uppercase tracking-wide mb-1 flex items-center gap-1">
              <span>👷</span>{" "}
              {t("Staff Member:", "ملازم:")}
            </label>
            <select
              value={expStaffId}
              onChange={(e) => setExpStaffId(e.target.value)}
              className="w-full rounded-md border border-orange-300 bg-white px-2 py-1.5 font-sans text-xs text-slate-800 shadow-xs focus:border-orange-500 font-medium"
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
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            {t("Amount:", "رقم:")}
          </label>
          <input
            type="number"
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)}
            placeholder="e.g. 1200"
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs focus:border-orange-500"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            {t("Sourced From:", "منبع:")}
          </label>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setExpPaidFrom("cash")}
              className={`py-1.5 rounded-md border font-sans text-[10px] font-bold cursor-pointer transition-all ${
                expPaidFrom === "cash"
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              💸 {t("Cash", "کیش")}
            </button>
            <button
              type="button"
              onClick={() => setExpPaidFrom("bank")}
              className={`py-1.5 rounded-md border font-sans text-[10px] font-bold cursor-pointer transition-all ${
                expPaidFrom === "bank"
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              🏦 {t("Bank", "بینک")}
            </button>
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            {t("Notes:", "نوٹ:")}
          </label>
          <input
            type="text"
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
            placeholder="e.g. Lunch tea for staff"
            className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-sans text-xs focus:border-orange-500"
          />
        </div>
      </div>

      <button
        onClick={handleAddExpense}
        className="w-full py-2 bg-orange-600 text-white font-sans text-xs font-bold rounded-lg hover:bg-orange-700 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
      >
        <Plus className="h-3 w-3" />
        <span>{t("ADD EXPENSE", "خرچہ درج کریں")}</span>
      </button>

      {/* Registered Expenses List */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <h4 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          {t("Expenses This Shift:", "اس شفٹ میں اخراجات:")}
        </h4>
        {activeShift.expenseEntries.length === 0 ? (
          <p className="text-center py-4 font-sans text-xs text-slate-400 border border-slate-100 border-dashed rounded-lg bg-slate-50/50">
            {t(
              "No expense records logged in this session.",
              "ابھی کوئی خرچہ درج نہیں۔",
            )}
          </p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {activeShift.expenseEntries.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center text-xs p-2 rounded-lg border border-slate-100 bg-slate-50/20"
              >
                <div className="font-sans text-slate-700 pr-4 flex-1 flex flex-wrap items-center gap-0.5">
                  <span className="font-bold uppercase tracking-tight text-[10px] bg-red-50 text-red-650 px-1.5 py-0.5 rounded-sm mr-2">
                    {e.category}
                  </span>
                  <span className="text-slate-800 font-medium">
                    {e.description}
                  </span>
                  {e.staffId && (
                    <span className="ml-2 inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-sm">
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
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-red-550">
                    Rs. {e.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(e.id)}
                    className="text-red-500 hover:text-red-700 cursor-pointer"
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
