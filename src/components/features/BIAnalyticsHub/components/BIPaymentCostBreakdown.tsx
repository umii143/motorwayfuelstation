import React from 'react';
import { CreditCard, PieChart } from 'lucide-react';

export function BIPaymentCostBreakdown({ metrics }: any) {
  const { paymentBreakdown, costs } = metrics;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);

  const totalPayments = paymentBreakdown.cash + paymentBreakdown.bank + paymentBreakdown.digital + paymentBreakdown.credit;
  const totalCosts = costs.cogs + costs.carriage + costs.otherExpenses;

  const renderPaymentRow = (label: string, amount: number, icon: string, colorClass: string) => {
    const share = totalPayments > 0 ? ((amount / totalPayments) * 100).toFixed(1) : '0.0';
    return (
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="py-3 px-5 font-medium flex items-center gap-2">
          <span className="text-xl">{icon}</span> {label}
        </td>
        <td className="py-3 px-5 font-bold text-slate-800 text-right">{formatCurrency(amount)}</td>
        <td className="py-3 px-5 text-right">
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${colorClass}`}>{share}%</span>
        </td>
      </tr>
    );
  };

  const renderCostRow = (label: string, amount: number, colorClass: string) => {
    const share = totalCosts > 0 ? ((amount / totalCosts) * 100).toFixed(1) : '0.0';
    return (
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="py-3 px-5 font-medium">{label}</td>
        <td className="py-3 px-5 font-bold text-slate-800 text-right">{formatCurrency(amount)}</td>
        <td className="py-3 px-5 text-right">
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${colorClass}`}>{share}%</span>
        </td>
      </tr>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Payment Method Breakdown */}
      <div className="premium-card border overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-600" />
            <h3 className="font-sans text-lg font-bold text-slate-900">Payment Analysis — Sales Inflow</h3>
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white text-slate-500 border-b border-slate-100">
                <th className="py-3 px-5 font-semibold">Method</th>
                <th className="py-3 px-5 font-semibold text-right">Amount</th>
                <th className="py-3 px-5 font-semibold text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {renderPaymentRow('Cash', paymentBreakdown.cash, '💵', 'bg-emerald-50 text-emerald-700')}
              {renderPaymentRow('Bank Transfer', paymentBreakdown.bank, '🏦', 'bg-blue-50 text-blue-700')}
              {renderPaymentRow('Digital Wallet', paymentBreakdown.digital, '📱', 'bg-purple-50 text-purple-700')}
              {renderPaymentRow('Credit Sales', paymentBreakdown.credit, '📋', 'bg-amber-50 text-amber-700')}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td className="py-3 px-5">TOTAL</td>
                <td className="py-3 px-5 text-right text-sky-700">{formatCurrency(totalPayments)}</td>
                <td className="py-3 px-5 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="premium-card border overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-rose-600" />
            <h3 className="font-sans text-lg font-bold text-slate-900">Cost Breakdown</h3>
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white text-slate-500 border-b border-slate-100">
                <th className="py-3 px-5 font-semibold">Category</th>
                <th className="py-3 px-5 font-semibold text-right">Amount</th>
                <th className="py-3 px-5 font-semibold text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {renderCostRow('🛢️ Stock Purchase (COGS)', costs.cogs, 'bg-slate-100 text-slate-700')}
              {renderCostRow('🚛 Carriage / Transport', costs.carriage, 'bg-orange-50 text-orange-700')}
              {renderCostRow('📋 Other Expenses (Staff/Utilities)', costs.otherExpenses, 'bg-rose-50 text-rose-700')}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td className="py-3 px-5">TOTAL</td>
                <td className="py-3 px-5 text-right text-rose-700">{formatCurrency(totalCosts)}</td>
                <td className="py-3 px-5 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
