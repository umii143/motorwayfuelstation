import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  Flame, 
  DollarSign, 
  CheckCircle2, 
  Award, 
  Calendar, 
  UserX 
} from 'lucide-react';
import { RealtimeWorkforceKPIs } from '../../../types/workforce.types';
import { formatCurrency } from '../../../lib/currency';

interface LiveKPIBarProps {
  kpis: RealtimeWorkforceKPIs;
  isUrdu: boolean;
}

export const LiveKPIBar: React.FC<LiveKPIBarProps> = ({ kpis, isUrdu }) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const cards = [
    {
      id: 'total_employees',
      label: t('Total Employees', 'کل ملازمین'),
      value: kpis.totalEmployees,
      icon: Users,
      color: 'from-blue-600 to-indigo-700',
      badge: 'Live Firestore',
      subtext: t('Active Staff Roster', 'فعال عملہ')
    },
    {
      id: 'present_now',
      label: t('Present Now', 'فی الوقت موجود'),
      value: kpis.presentNow,
      icon: UserCheck,
      color: 'from-emerald-600 to-teal-700',
      badge: '🟢 Realtime',
      subtext: t('Clocked In Currently', 'حاضر عملہ')
    },
    {
      id: 'on_shift',
      label: t('Currently On Shift', 'شفٹ میں موجود'),
      value: kpis.currentlyOnShift,
      icon: Clock,
      color: 'from-cyan-600 to-blue-700',
      badge: 'Shift Engine',
      subtext: t('Active Duty Roles', 'فعال ڈیوٹی')
    },
    {
      id: 'late_today',
      label: t('Late Today', 'آج دیر سے آئے'),
      value: kpis.lateToday,
      icon: AlertTriangle,
      color: 'from-amber-600 to-orange-700',
      badge: kpis.lateToday > 0 ? '⚠️ Alert' : 'Normal',
      subtext: t('Over Grace Period', 'تاخیر سے آمد')
    },
    {
      id: 'overtime_running',
      label: t('Overtime Running', 'اوور ٹائم جاری'),
      value: kpis.overtimeRunning,
      icon: Flame,
      color: 'from-purple-600 to-pink-700',
      badge: 'Active OT',
      subtext: t('Extra Duty Staff', 'اضافی وقت')
    },
    {
      id: 'payroll_due',
      label: t('Payroll Due', 'پے رول واجب الادا'),
      value: formatCurrency(kpis.payrollDueAmount),
      icon: DollarSign,
      color: 'from-rose-600 to-red-700',
      badge: 'Finance',
      subtext: t('Pending Salaries', 'واجب الادا تنخواہ')
    },
    {
      id: 'attendance_percent',
      label: t("Today's Attendance %", 'آج کی حاضری فیصد'),
      value: `${kpis.todayAttendancePercent}%`,
      icon: CheckCircle2,
      color: 'from-emerald-600 to-green-700',
      badge: 'Rate',
      subtext: t('Turnout Metric', 'حاضری کا تناسب')
    },
    {
      id: 'perf_score',
      label: t('Performance Score', 'کارکردگی اسکور'),
      value: `${kpis.averagePerformanceScore}%`,
      icon: Award,
      color: 'from-blue-600 to-indigo-700',
      badge: 'AI Score',
      subtext: t('Avg Crew Rating', 'اوسط کارکردگی')
    },
    {
      id: 'on_leave',
      label: t('Employees On Leave', 'چھٹی پر ملازمین'),
      value: kpis.employeesOnLeave,
      icon: Calendar,
      color: 'from-indigo-600 to-purple-700',
      badge: 'Approved',
      subtext: t('Scheduled Off', 'ممنوعہ حاضری')
    },
    {
      id: 'absent_today',
      label: t('Absent Today', 'آج غیر حاضر'),
      value: kpis.absentToday,
      icon: UserX,
      color: 'from-slate-600 to-gray-800',
      badge: kpis.absentToday > 0 ? 'Unexplained' : 'Clean',
      subtext: t('Unapproved Absence', 'غیر حاضر ملازمین')
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.03 }}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.color} p-4 text-white shadow-lg border border-white/10 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                {card.badge}
              </span>
              <IconComponent className="w-5 h-5 text-white/80" />
            </div>
            <div className="text-xl md:text-2xl font-black tracking-tight mb-1">
              {card.value}
            </div>
            <div className="text-xs font-semibold text-white/90">
              {card.label}
            </div>
            <div className="text-[10px] text-white/70 mt-0.5">
              {card.subtext}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
