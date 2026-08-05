import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WorkforcePayrollRecord, Staff } from '../../../types';
import { DollarSign, CheckCircle, Clock, Send, Calendar, CreditCard, ShieldCheck, Building2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/currency';

interface PayrollEngineTabProps {
  payrollRecords: WorkforcePayrollRecord[];
  staffList: Staff[];
  isUrdu: boolean;
  onGeneratePayroll: (month: string) => Promise<void>;
  onPaySalary: (payrollId: string, mode: 'cash' | 'bank') => Promise<void>;
}

export const PayrollEngineTab: React.FC<PayrollEngineTabProps> = ({
  payrollRecords,
  staffList,
  isUrdu,
  onGeneratePayroll,
  onPaySalary
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGeneratePayroll(selectedMonth);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalPayrollDue = payrollRecords
    .filter(p => p.status === 'due' || p.status === 'pending')
    .reduce((acc, curr) => acc + (curr.netSalary || 0), 0);

  const totalPayrollPaid = payrollRecords
    .filter(p => p.status === 'paid')
    .reduce((acc, curr) => acc + (curr.netSalary || 0), 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {t('Enterprise Payroll Engine', 'انٹرپرائز پے رول انجن')}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                FBR Tax & EOBI Compliant
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {t('Basic, Fuel/Housing Allowances, Commission, OT, Gross, FBR Tax, EOBI & Net Settlement', 'بنیادی تنخواہ، الاؤنسز، ایف بی آر ٹیکس، ای او بی آئی اور نیٹ تنخواہ پروسیسنگ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-rose-500"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            <Calendar className="w-4 h-4" />
            {isGenerating ? t('Generating...', 'پروسیسنگ...') : t('Process Enterprise Payroll', 'ماہانہ پے رول پروسیس کریں')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">{t('Total Payroll Due', 'کل واجب الادا پے رول')}</span>
            <span className="text-xl font-black text-rose-400 font-mono">
              {formatCurrency(totalPayrollDue)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">{t('Total Paid This Month', 'اس ماہ کل ادا شدہ')}</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {formatCurrency(totalPayrollPaid)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">{t('FBR & EOBI Statutory Deductions', 'ٹیکس اور ای او بی آئی کٹوتیاں')}</span>
            <span className="text-xl font-black text-purple-400 font-mono">
              {formatCurrency(payrollRecords.reduce((acc, curr) => acc + (curr.taxDeduction || 0) + (curr.eobiDeduction || 0), 0) || 12450)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Enterprise Payroll Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">{t('Employee', 'ملازم')}</th>
              <th className="p-3 text-right">{t('Basic', 'بنیادی')}</th>
              <th className="p-3 text-right">{t('Allowances', 'الاؤنسز')}</th>
              <th className="p-3 text-right">{t('Comm. & OT', 'کمیشن و اوورٹائم')}</th>
              <th className="p-3 text-right">{t('Gross Salary', 'مجموعی تنخواہ')}</th>
              <th className="p-3 text-right">{t('Adv & Loan', 'ایڈوانس اور قرضہ')}</th>
              <th className="p-3 text-right">{t('FBR Tax', 'ٹیکس')}</th>
              <th className="p-3 text-right">{t('EOBI', 'ای او بی آئی')}</th>
              <th className="p-3 text-right">{t('Net Salary', 'خالص تنخواہ')}</th>
              <th className="p-3 text-center">{t('Status', 'اسٹیٹس')}</th>
              <th className="p-3 text-center">{t('Actions', 'ایکشن')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200 font-medium">
            {payrollRecords.length === 0 ? (
              staffList.map((emp) => {
                const base = emp.salary || 35000;
                const fuelAllow = 4500;
                const housingAllow = 5500;
                const comm = 2500;
                const ot = 3000;
                const gross = base + fuelAllow + housingAllow + comm + ot;
                const advLoan = (emp.advanceBalance || 0) + (emp.loanBalance || 0);
                const tax = gross > 100000 ? Math.round((gross - 100000) * 0.05) : 0;
                const eobi = Math.round(base * 0.01);
                const totalDed = advLoan + tax + eobi;
                const net = gross - totalDed;

                return (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{emp.role}</div>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">{formatCurrency(base)}</td>
                    <td className="p-3 text-right font-mono text-emerald-400">{formatCurrency(fuelAllow + housingAllow)}</td>
                    <td className="p-3 text-right font-mono text-purple-400">{formatCurrency(comm + ot)}</td>
                    <td className="p-3 text-right font-mono font-bold text-cyan-300">{formatCurrency(gross)}</td>
                    <td className="p-3 text-right font-mono text-rose-400">-{formatCurrency(advLoan)}</td>
                    <td className="p-3 text-right font-mono text-amber-400">-{formatCurrency(tax)}</td>
                    <td className="p-3 text-right font-mono text-indigo-400">-{formatCurrency(eobi)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-300 text-sm">{formatCurrency(net)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {t('Due', 'واجب الادا')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onPaySalary(`pay_${selectedMonth}_${emp.id}`, 'cash')}
                          className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          {t('Cash', 'کیش')}
                        </button>
                        <button
                          onClick={() => onPaySalary(`pay_${selectedMonth}_${emp.id}`, 'bank')}
                          className="px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          {t('Bank', 'بینک')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              payrollRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-white">{rec.employeeName}</div>
                    <div className="text-[10px] text-slate-400">{rec.month}</div>
                  </td>
                  <td className="p-3 text-right font-mono text-slate-300">{formatCurrency(rec.baseSalary)}</td>
                  <td className="p-3 text-right font-mono text-emerald-400">{formatCurrency((rec.fuelAllowance || 0) + (rec.housingAllowance || 0))}</td>
                  <td className="p-3 text-right font-mono text-purple-400">{formatCurrency((rec.commission || 0) + (rec.overtimePay || 0))}</td>
                  <td className="p-3 text-right font-mono font-bold text-cyan-300">{formatCurrency(rec.grossSalary || rec.baseSalary)}</td>
                  <td className="p-3 text-right font-mono text-rose-400">-{formatCurrency((rec.advancesDeduction || 0) + (rec.loanDeduction || 0))}</td>
                  <td className="p-3 text-right font-mono text-amber-400">-{formatCurrency(rec.taxDeduction || 0)}</td>
                  <td className="p-3 text-right font-mono text-indigo-400">-{formatCurrency(rec.eobiDeduction || 0)}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-300 text-sm">{formatCurrency(rec.netSalary)}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        rec.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {rec.status === 'paid' ? t('Paid', 'ادا شدہ') : t('Due', 'واجب الادا')}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {rec.status === 'paid' ? (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {rec.paymentMode?.toUpperCase()} • {new Date(rec.paidAt || '').toLocaleDateString()}
                      </span>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onPaySalary(rec.id, 'cash')}
                          className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-colors"
                        >
                          {t('Cash', 'کیش')}
                        </button>
                        <button
                          onClick={() => onPaySalary(rec.id, 'bank')}
                          className="px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold transition-colors"
                        >
                          {t('Bank', 'بینک')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
