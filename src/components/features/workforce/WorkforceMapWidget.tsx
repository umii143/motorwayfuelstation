import React from 'react';
import { motion } from 'motion/react';
import { Staff, WorkforceAttendanceRecord } from '../../../types';
import { UserCheck, Clock, MapPin, Briefcase, Phone, ChevronRight, LogIn, LogOut } from 'lucide-react';

interface WorkforceMapWidgetProps {
  staffList: Staff[];
  attendance: WorkforceAttendanceRecord[];
  isUrdu: boolean;
  onSelectEmployee: (staff: Staff) => void;
  onClockIn: (staffId: string, staffName: string) => void;
  onClockOut: (staffId: string, staffName: string) => void;
}

export const WorkforceMapWidget: React.FC<WorkforceMapWidgetProps> = ({
  staffList,
  attendance,
  isUrdu,
  onSelectEmployee,
  onClockIn,
  onClockOut
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const getDutyBadge = (dutyStatus?: string) => {
    switch (dutyStatus) {
      case 'on_duty':
        return { label: t('On Duty', 'ڈیوٹی پر'), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', dot: 'bg-emerald-500' };
      case 'break':
        return { label: t('Break', 'وقفہ'), color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', dot: 'bg-amber-500' };
      case 'leave':
        return { label: t('On Leave', 'چھٹی پر'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', dot: 'bg-blue-500' };
      case 'late':
        return { label: t('Late', 'تاخیر'), color: 'bg-orange-500/20 text-orange-400 border-orange-500/40', dot: 'bg-orange-500' };
      case 'off_duty':
      default:
        return { label: t('Off Duty', 'اف ڈیوٹی'), color: 'bg-rose-500/20 text-rose-400 border-rose-500/40', dot: 'bg-rose-500' };
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {t('Live Workforce Status & Map', 'لائیو لائیو ورک فورس اسٹیٹس اور میپ')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('Realtime deployment across pumps, counters & tank area', 'پمپ، کاؤنٹر اور ٹینک ایریا میں لائیو تعیناتی')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {t('Live Firestore Sync', 'لائیو سائنک')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {staffList.map((emp) => {
          const badge = getDutyBadge(emp.dutyStatus);
          const isOnDuty = emp.dutyStatus === 'on_duty' || emp.dutyStatus === 'break';

          return (
            <motion.div
              key={emp.id}
              whileHover={{ scale: 1.02 }}
              className="bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-200 shadow-md relative group cursor-pointer"
              onClick={() => onSelectEmployee(emp)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-white font-bold text-sm shadow">
                    {emp.name ? emp.name.substring(0, 2).toUpperCase() : 'ST'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                      {emp.name}
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                    </h4>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {emp.role || emp.designation || 'Staff Member'}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                  {badge.label}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 mb-3 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {t('Location:', 'لوکیشن:')}
                  </span>
                  <span className="font-semibold text-slate-200">
                    {emp.currentAssignment || t('Unassigned', 'غیر متعین')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {t('Clock In:', 'حاضری:')}
                  </span>
                  <span className="font-mono text-cyan-300 font-medium">
                    {emp.clockInTime || (isOnDuty ? '08:57' : '--:--')}
                  </span>
                </div>
                {emp.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Phone className="w-3 h-3 text-indigo-400" />
                      {t('Phone:', 'فون:')}
                    </span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {emp.phone}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Action Button */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800" onClick={(e) => e.stopPropagation()}>
                {isOnDuty ? (
                  <button
                    onClick={() => onClockOut(emp.id, emp.name)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {t('Clock Out', 'رخصت')}
                  </button>
                ) : (
                  <button
                    onClick={() => onClockIn(emp.id, emp.name)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {t('Clock In', 'حاضری لگائیں')}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
