import React from 'react';
import { motion } from 'motion/react';
import { Shift, Staff } from '../../../types';
import { Clock, ShieldCheck, Users, Wallet, PlayCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../../lib/currency';

interface ShiftProgressWidgetProps {
  activeShift?: Shift;
  staffList: Staff[];
  isUrdu: boolean;
}

export const ShiftProgressWidget: React.FC<ShiftProgressWidgetProps> = ({
  activeShift,
  staffList,
  isUrdu
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const shiftName = (activeShift as any)?.shiftName || 'Morning Shift';
  const supervisorName = (activeShift as any)?.supervisorName || staffList.find(s => s.role === 'manager' || s.role === 'owner')?.name || 'Ali Supervisor';
  const progressPercent = 63;
  const runningHours = '03h 52m';

  const assignedOperators = staffList.filter(s => s.dutyStatus === 'on_duty').slice(0, 4);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {shiftName}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                {progressPercent}% {t('Running', 'جاری')}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {t('Shift Elapsed Time:', 'شفٹ کا گزرا ہوا وقت:')} <span className="font-mono text-cyan-400 font-semibold">{runningHours}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 block text-[10px]">{t('Supervisor', 'سپروائزر')}</span>
            <span className="font-bold text-white flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {supervisorName}
            </span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 block text-[10px]">{t('Opening Float', 'ابتدائی کیش')}</span>
            <span className="font-bold text-emerald-400 font-mono">
              {formatCurrency((activeShift as any)?.openingCash || 50000)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1">
            <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
            {t('Shift Start: 08:00 AM', 'شفٹ کا آغاز: 08:00 صبح')}
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            {t('Target End: 04:00 PM', 'شفٹ اختتام: 04:00 شام')}
          </span>
        </div>
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 rounded-full shadow-lg"
          ></motion.div>
        </div>
      </div>

      {/* On-Duty Roster Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
        <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          {t('Active Crew on Shift:', 'شفٹ پر ڈیوٹی عملہ:')}
        </span>
        {assignedOperators.map((op) => (
          <span
            key={op.id}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {op.name} ({op.currentAssignment || op.role})
          </span>
        ))}
      </div>
    </div>
  );
};
