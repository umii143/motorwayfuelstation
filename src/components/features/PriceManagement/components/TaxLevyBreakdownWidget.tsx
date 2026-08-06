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
    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-main)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2">
              {t('Official OGRA Price Build-Up & Tax Breakdown', 'سرکاری اوگرا قیمت سازی اور ٹیکس بریک ڈاؤن')}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {t('Ex-refinery price, IFEM, Petroleum Levy (PL), GST & Dealer Margin breakdown', 'ایکس ریفائنری، لیوی اور ڈیلر مارجن کی تفصیلات')}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/20">
          Official Build-Up
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[petrolBreakdown, dieselBreakdown].map((b) => (
          <div key={b.productName} className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-sm border-b border-[var(--border-main)] pb-2">{b.productName}</h4>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between py-1 border-b border-[var(--border-muted)]">
                <span className="text-[var(--text-muted)]">{t('Ex-Refinery Price:', 'ایکس ریفائنری قیمت:')}</span>
                <span className="font-mono text-[var(--text-main)]">{formatCurrency(b.exRefineryPrice)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-muted)]">
                <span className="text-[var(--text-muted)]">{t('IFEM (Inland Freight):', 'کرایہ فریٹ (IFEM):')}</span>
                <span className="font-mono text-[var(--text-main)]">{formatCurrency(b.ifem)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-muted)]">
                <span className="text-[var(--text-muted)]">{t('Petroleum Levy (PL):', 'پیٹرولیم لیوی:')}</span>
                <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{formatCurrency(b.petroleumLevy)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-muted)]">
                <span className="text-[var(--text-muted)]">{t('Sales Tax (GST):', 'سیلز ٹیکس:')}</span>
                <span className="font-mono text-[var(--text-main)]">{formatCurrency(b.salesTaxGST)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-muted)]">
                <span className="text-[var(--text-muted)]">{t('Dealer Margin:', 'ڈیلر مارجن:')}</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(b.dealerMargin)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-muted)]">
                <span className="text-[var(--text-muted)]">{t('OMC Margin:', 'او ایم سی مارجن:')}</span>
                <span className="font-mono text-amber-700 dark:text-cyan-300 font-bold">{formatCurrency(b.omcMargin)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-sm bg-[var(--bg-card)] p-2 rounded-lg text-[var(--text-main)] border border-[var(--border-main)]">
                <span>{t('Final Retail Price:', 'حتمی ریٹیل قیمت:')}</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(b.finalRetailPrice)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
