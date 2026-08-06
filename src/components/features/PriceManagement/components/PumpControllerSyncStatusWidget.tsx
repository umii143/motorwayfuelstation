import React from 'react';
import { pumpControllerSyncEngine } from '../../../../services/priceManagement/pumpControllerSyncEngine';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import { formatCurrency } from '../../../../lib/currency';

interface PumpControllerSyncStatusWidgetProps {
  isUrdu: boolean;
  petrolRate: number;
  dieselRate: number;
}

export const PumpControllerSyncStatusWidget: React.FC<PumpControllerSyncStatusWidgetProps> = ({
  isUrdu,
  petrolRate,
  dieselRate
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const hardwareUnits = pumpControllerSyncEngine.getHardwareSyncStatus(petrolRate, dieselRate);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-main)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 dark:from-cyan-600 dark:to-blue-500 flex items-center justify-center font-black text-white text-lg shadow-md">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2">
              {t('Dispenser & Hardware Price Sync Status', 'ڈسپینسر پمپ اور ڈجیٹل بورڈ لائیو سائنک اسٹیٹس')}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {t('Realtime monitoring of fuel prices displayed across physical pump heads & POS', 'پمپوں اور پرائس بورڈ پر لائیو ریٹ سائنک مانیٹر')}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 animate-pulse">
          🟢 All Controllers Online
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {hardwareUnits.map((unit) => (
          <div key={unit.id} className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl p-3.5 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[var(--text-main)] text-xs">{unit.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Synced
              </span>
            </div>
            <div className="flex justify-between items-baseline mt-2 text-[var(--text-main)] font-mono">
              <span className="text-[10px] text-[var(--text-muted)]">Displayed:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{formatCurrency(unit.currentRateDisplayed)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1 border-t border-[var(--border-muted)] pt-1">
              <span>IP: {unit.ipAddress || '192.168.1.x'}</span>
              <span>{unit.lastSyncedAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
