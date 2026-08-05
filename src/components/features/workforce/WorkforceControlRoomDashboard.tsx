import React from 'react';
import { motion } from 'motion/react';
import { RealtimeWorkforceKPIs, Staff, WorkforceAttendanceRecord, WorkforceNozzleAssignment } from '../../../types';
import { 
  Users, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  Award, 
  DollarSign, 
  Flame, 
  ShieldCheck, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  Zap, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../../../lib/currency';

interface WorkforceControlRoomDashboardProps {
  kpis: RealtimeWorkforceKPIs;
  staffList: Staff[];
  attendance: WorkforceAttendanceRecord[];
  isUrdu: boolean;
  onSelectEmployee: (emp: Staff) => void;
  onClockIn: (id: string, name: string) => void;
  onClockOut: (id: string, name: string) => void;
}

export const WorkforceControlRoomDashboard: React.FC<WorkforceControlRoomDashboardProps> = ({
  kpis,
  staffList,
  attendance,
  isUrdu,
  onSelectEmployee,
  onClockIn,
  onClockOut
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Mock Expiry Chips
  const expiryChips = [
    { id: 'exp_1', title: t('CNIC Expiring Soon', 'شناختی کارڈ معیاد ختم'), detail: 'Ali Raza (CNIC 35202-1234567-1) expires in 12 days', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    { id: 'exp_2', title: t('Contract Renewal Due', 'معاہدہ کی تجدید'), detail: 'Bilal Cashier contract due for renewal on 2026-08-31', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { id: 'exp_3', title: t('Late Arrival Alert', 'تاخیر سے آمد'), detail: 'Usama arrived 18 mins after shift start', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
    { id: 'exp_4', title: t('Payroll Processing Due', 'پے رول پروسیسنگ واجب'), detail: 'July 2026 Payroll due for 24 employees', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' }
  ];

  return (
    <div className="space-y-6">

      {/* CONTROL ROOM TOP SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg text-white">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
            {t("Today's Workforce", 'کل ملازمین')}
          </span>
          <div className="text-2xl font-black text-white font-mono">{kpis.totalEmployees}</div>
          <span className="text-[10px] text-emerald-400 font-semibold">{kpis.todayAttendancePercent}% Turnout</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg text-white">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
            {t('Present Now', 'موجود')}
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono">{kpis.presentNow}</div>
          <span className="text-[10px] text-slate-400 font-semibold">🟢 Active Duty</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg text-white">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
            {t('Absent Today', 'غیر حاضر')}
          </span>
          <div className="text-2xl font-black text-rose-400 font-mono">{kpis.absentToday}</div>
          <span className="text-[10px] text-rose-300 font-semibold">Unexplained</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg text-white">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
            {t('Late Arrival', 'تاخیر')}
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono">{kpis.lateToday}</div>
          <span className="text-[10px] text-amber-300 font-semibold">Over Grace</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg text-white">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
            {t('On Leave', 'چھٹی پر')}
          </span>
          <div className="text-2xl font-black text-indigo-400 font-mono">{kpis.employeesOnLeave}</div>
          <span className="text-[10px] text-indigo-300 font-semibold">Approved</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg text-white">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
            {t('Overtime Running', 'اوور ٹائم')}
          </span>
          <div className="text-2xl font-black text-cyan-400 font-mono">{kpis.overtimeRunning}</div>
          <span className="text-[10px] text-cyan-300 font-semibold">Extra Duty</span>
        </div>
      </div>

      {/* SHIFT METER & TOP PERFORMER & PAYROLL GAUGE ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Current Shift Status Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {t('Current Shift Status', 'موجودہ شفٹ اسٹیٹس')}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              Morning Shift
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[11px] text-slate-400 block">{t('Supervisor', 'سپروائزر')}</span>
                <span className="font-bold text-white text-sm flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Zahid Supervisor
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">{t('Running Duration', 'گزرا ہوا وقت')}</span>
                <span className="font-mono text-cyan-300 font-bold text-sm">04h 15m</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                <span>08:00 AM</span>
                <span className="text-cyan-400">63% Completed</span>
                <span>04:00 PM</span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-0.5">
                <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 rounded-full" style={{ width: '63%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performer Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              {t('Top Performer of the Week', 'اس ہفتے کا بہترین ملازم')}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              ⭐ Star Crew
            </span>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              {kpis.topPerformerName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="font-bold text-white text-base">{kpis.topPerformerName}</h4>
              <p className="text-xs text-slate-400">{t('Lead Pump Operator • Pump 1', 'سینئر پمپ آپریٹر')}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {kpis.topPerformerScore}% Rating
                </span>
                <span className="text-[11px] text-slate-300 font-mono">24,500 L Sold</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payroll Settlement Gauge */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              {t('Payroll Settlement Status', 'پے رول کی صورتحال')}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Monthly Cycle
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-emerald-400 font-mono">{kpis.payrollProcessedPercent}%</span>
              <span className="text-xs text-slate-400 font-mono">{t('Processed & Disbursed', 'ادا شدہ')}</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-0.5">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${kpis.payrollProcessedPercent}%` }}></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>{t('Due Amount:', 'واجب الادا:')} {formatCurrency(kpis.payrollDueAmount)}</span>
              <span className="text-emerald-400">22 Paid / 2 Pending</span>
            </div>
          </div>
        </div>

      </div>

      {/* SMART NOTIFICATION & EXPIRY CHIPS ROW */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            {t('Smart Compliance & Expiry Alerts', 'سمارٹ تنبیہات اور معیاد الرٹس')}
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">Realtime Monitor</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {expiryChips.map((chip) => (
            <div key={chip.id} className={`p-3 rounded-xl border text-xs ${chip.color}`}>
              <div className="font-bold mb-0.5">{chip.title}</div>
              <div className="text-[11px] opacity-90">{chip.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE WORKFORCE MAP WITH PUMP & NOZZLE ASSIGNMENTS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              {t('Live Workforce Deployment Map', 'لائیو ورک فورس تعیناتی نقشہ')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('Realtime location, pump & nozzle assignments across fuel bays & counters', 'پمپ اور نوزل پر عملے کی لائیو ڈیوٹی')}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
            🟢 Realtime Sync
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {staffList.map((emp, index) => {
            const isOperator = emp.role === 'salesman' || emp.role === 'operator';
            const nozzleId = (index % 4) + 1;
            const fuelType = index % 2 === 0 ? 'Petrol' : 'Diesel';
            const assignmentText = isOperator 
              ? `Pump 01 • Nozzle 0${nozzleId} (${fuelType})` 
              : emp.role === 'cashier' 
                ? 'Main Cash Counter 1' 
                : emp.role === 'manager' 
                  ? 'Station Control Room' 
                  : 'Tank Storage Area';

            const isOnDuty = emp.dutyStatus === 'on_duty' || emp.dutyStatus === 'break';

            return (
              <motion.div
                key={emp.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => onSelectEmployee(emp)}
                className="bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/50 rounded-xl p-4 transition-all shadow-md cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                      {emp.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 capitalize">{emp.role}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isOnDuty ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border-rose-500/40'}`}>
                    {isOnDuty ? '🟢 Working' : '🔴 Off Duty'}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1 my-3">
                  <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    {assignmentText}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>In: {emp.clockInTime || (isOnDuty ? '08:00 AM' : '--:--')}</span>
                    <span className="font-mono text-cyan-400">Status: Running</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs pt-1" onClick={(e) => e.stopPropagation()}>
                  {isOnDuty ? (
                    <button
                      onClick={() => onClockOut(emp.id, emp.name)}
                      className="w-full py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-colors"
                    >
                      Clock Out
                    </button>
                  ) : (
                    <button
                      onClick={() => onClockIn(emp.id, emp.name)}
                      className="w-full py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-colors"
                    >
                      Clock In
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
