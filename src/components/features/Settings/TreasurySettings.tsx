import React from 'react';
import { Landmark, ArrowRight } from 'lucide-react';
import { GlobalSettings } from '../../../types';

export default function TreasurySettings({ settings }: { settings: GlobalSettings }) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="h-6 w-6 text-indigo-600" />
          {t('Treasury Settings', 'ٹریژری سیٹنگز')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Configure cash handling rules and safe drop limits.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Landmark className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Treasury Management Center</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          Manage your bank accounts, digital wallets, and petty cash directly from the "Banks & Wallets" section.
        </p>
      </div>
    </div>
  );
}
