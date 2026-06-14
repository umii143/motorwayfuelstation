import React from 'react';
import { LinkIcon, Server, Database } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { GlobalSettings } from '../../../types';

export default function Integrations({ settings, activeStationId }: { settings: GlobalSettings, activeStationId: string }) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <LinkIcon className="h-6 w-6 text-indigo-600" />
          {t('Integrations', 'انضمام')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Connect FuelPro to external APIs, ATG systems, and third-party accounting.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center opacity-70">
          <Server className="h-10 w-10 text-slate-400 mb-3" />
          <h3 className="font-bold text-slate-800">Automatic Tank Gauging (ATG)</h3>
          <p className="text-xs text-slate-500 mt-2 mb-4">Connect Gilbarco, Veeder-Root, or Wayne systems.</p>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">Coming Soon</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center opacity-70">
          <Database className="h-10 w-10 text-slate-400 mb-3" />
          <h3 className="font-bold text-slate-800">QuickBooks / Xero</h3>
          <p className="text-xs text-slate-500 mt-2 mb-4">Sync journal entries automatically to cloud accounting.</p>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
