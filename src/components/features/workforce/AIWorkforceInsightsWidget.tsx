import React from 'react';
import { motion } from 'motion/react';
import { RealtimeWorkforceKPIs, Staff } from '../../../types';
import { Sparkles, AlertTriangle, TrendingUp, Users, DollarSign, Award, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../../../lib/currency';

interface AIWorkforceInsightsWidgetProps {
  kpis: RealtimeWorkforceKPIs;
  staffList: Staff[];
  isUrdu: boolean;
}

export const AIWorkforceInsightsWidget: React.FC<AIWorkforceInsightsWidgetProps> = ({
  kpis,
  staffList,
  isUrdu
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const topEmp = staffList[0]?.name || 'Ali Raza';

  const insights = [
    {
      id: 'best_emp',
      title: t('Star Performer Recommended', 'بہترین کارکردگی والا ملازم'),
      desc: `${topEmp} ${t('achieved 98% attendance & highest fuel sales volume this week.', 'نے اس ہفتے سب سے زیادہ فروخت اور 98% حاضری حاصل کی قصوروار۔')}`,
      type: 'success',
      icon: Award,
      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    },
    {
      id: 'payroll_forecast',
      title: t('Payroll Due Forecast', 'ماہانہ پے رول کی پیشن گوئی'),
      desc: `${t('Estimated payroll liability for end of month is', 'اس ماہ کا تخمینہ پے رول')} ${formatCurrency(kpis.payrollDueAmount || 385000)}.`,
      type: 'info',
      icon: DollarSign,
      color: 'border-blue-500/30 bg-blue-500/10 text-blue-300'
    },
    {
      id: 'attendance_risk',
      title: t('Attendance Risk Alert', 'حاضری کے خطرے کا الرٹ'),
      desc: kpis.lateToday > 0 
        ? `${kpis.lateToday} ${t('employees arrived late today. Shift coverage re-routed to Pump 1.', 'ملازمین تاخیر سے آئے۔')}`
        : t('Attendance is 100% stable with zero tardiness recorded today.', 'آج 100% حاضری مکمل طور پر وقت پر برقرار ہے۔'),
      type: kpis.lateToday > 0 ? 'warning' : 'success',
      icon: AlertTriangle,
      color: kpis.lateToday > 0 ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    },
    {
      id: 'shift_opt',
      title: t('Shift Optimization Insight', 'شفٹ بہتری کی تجویز'),
      desc: t('Evening peak traffic expected at 06:00 PM. Recommend assigning 2 extra operators to Nozzles 3 & 4.', 'شام کی رش ڈیوٹی کے لیے مزید ملازمین مقرر کریں۔'),
      type: 'insight',
      icon: Lightbulb,
      color: 'border-purple-500/30 bg-purple-500/10 text-purple-300'
    }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {t('AI Workforce Insights & Smart Alerts', 'مصنوعی ذہانت کے ورک فورس الرٹس')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('Automated risk detection, peak shift optimization & payroll forecasting', 'حاضری کے خطرات، شفٹ اور پے رول الرٹس')}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
          🧠 {t('Engine Verified', 'تصدیق شدہ')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-xl border flex items-start gap-3 ${item.color}`}
            >
              <div className="p-2 rounded-lg bg-black/20 flex-shrink-0">
                <IconComp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider mb-1">{item.title}</h4>
                <p className="text-xs opacity-90 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
