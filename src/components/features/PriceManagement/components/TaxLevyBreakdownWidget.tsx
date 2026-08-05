import React from 'react';
import { taxLevyBreakdownEngine } from '../../../../services/priceManagement/taxLevyBreakdownEngine';
import { Building2, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../../../lib/currency';

interface TaxLevyBreakdownWidgetProps {
  isUrdu: boolean;
  petrolPrice: number;
  dieselPrice: number;
}

export const TaxLevyBreakdownWidget: React.FC<TaxLevyBreakdownWidgetProps> = ({
  isUrdu,
  petrolPrice,
  dieselPrice
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const petrolBreakdown = taxLevyBreakdownEngine.getBreakdownForProduct('Super Petrol', petrolPrice);
  const dieselBreakdown = taxLevyBreakdownEngine.getBreakdownForProduct('HSD Diesel', dieselPrice);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-purple-600/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              {t('Official OGRA Price Build-Up & Tax Breakdown', 'سرکاری اوگرا قیمت سازی اور ٹیکس بریک ڈاؤن')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('Ex-refinery price, IFEM, Petroleum Levy (PL), GST & Dealer Margin breakdown', 'ایکس ریفائنری، لیوی اور ڈیلر مارجن کی تفصیلات')}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
          Official Build-Up
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[petrolBreakdown, dieselBreakdown].map((b) => (
          <div key={b.productName} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-emerald-400 text-sm border-b border-slate-700/60 pb-2">{b.productName}</h4>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">{t('Ex-Refinery Price:', 'ایکس ریفائنری قیمت:')}</span>
                <span className="font-mono text-slate-200">{formatCurrency(b.exRefineryPrice)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">{t('IFEM (Inland Freight):', 'کرایہ فریٹ (IFEM):')}</span>
                <span className="font-mono text-slate-200">{formatCurrency(b.ifem)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">{t('Petroleum Levy (PL):', 'پیٹرولیم لیوی:')}</span>
                <span className="font-mono text-amber-300 font-bold">{formatCurrency(b.petroleumLevy)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">{t('Sales Tax (GST):', 'سیلز ٹیکس:')}</span>
                <span className="font-mono text-slate-200">{formatCurrency(b.salesTaxGST)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">{t('Dealer Margin:', 'ڈیلر مارجن:')}</span>
                <span className="font-mono text-emerald-400 font-bold">{formatCurrency(b.dealerMargin)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/40">
                <span className="text-slate-400">{t('OMC Margin:', 'او ایم سی مارجن:')}</span>
                <span className="font-mono text-cyan-300">{formatCurrency(b.omcMargin)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-sm bg-slate-900/60 p-2 rounded-lg text-white">
                <span>{t('Final Retail Price:', 'حتمی ریٹیل قیمت:')}</span>
                <span className="font-mono text-emerald-400">{formatCurrency(b.finalRetailPrice)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
