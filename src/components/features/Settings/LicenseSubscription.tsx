import React from 'react';
import { Key, ShieldCheck, CreditCard, ExternalLink } from 'lucide-react';
import { GlobalSettings } from '../../../types';

export default function LicenseSubscription({ settings }: { settings: GlobalSettings }) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Key className="h-6 w-6 text-indigo-600" />
          {t('License & Subscription', 'لائسنس اور سبسکرپشن')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Manage your FuelPro Enterprise licensing and billing details.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border-2 border-emerald-100 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-emerald-100 rounded-bl-xl">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Current Plan</h3>
          <p className="text-3xl font-bold text-slate-900 mb-1">Enterprise V3.0</p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </div>
          
          <div className="mt-8 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">License Key</span>
              <span className="font-mono font-bold text-slate-800 text-xs">FP-ENT-8842-XXXX</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Valid Until</span>
              <span className="font-bold text-slate-800">Lifetime Local License</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Max Stations</span>
              <span className="font-bold text-slate-800">Unlimited</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Billing & Upgrades</h3>
            <p className="text-sm text-slate-600">Your current license is a fully unlocked local installation. Cloud sync and AI features may require additional subscription tiers.</p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold shadow-xs hover:bg-slate-50 transition-colors">
              <CreditCard className="h-4 w-4" /> Manage Billing Profile
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-xs hover:bg-indigo-700 transition-colors">
              <ExternalLink className="h-4 w-4" /> Explore Cloud Plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
