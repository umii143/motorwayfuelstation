import React from 'react';
import { motion } from 'motion/react';
import { WorkforceAuditEvent } from '../../../types';
import { Activity, Clock, ShieldAlert, CheckCircle, UserCheck, DollarSign, Calendar, Flame } from 'lucide-react';

interface ActivityFeedDrawerProps {
  auditLogs: WorkforceAuditEvent[];
  isUrdu: boolean;
}

export const ActivityFeedDrawer: React.FC<ActivityFeedDrawerProps> = ({ auditLogs, isUrdu }) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const getEventBadge = (type: WorkforceAuditEvent['eventType']) => {
    switch (type) {
      case 'CLOCK_IN':
        return { icon: UserCheck, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'CLOCK_OUT':
        return { icon: Clock, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'SHIFT_OPEN':
      case 'SHIFT_CLOSE':
        return { icon: Flame, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      case 'PAYROLL_APPROVED':
        return { icon: DollarSign, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'LEAVE_APPROVED':
        return { icon: Calendar, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      default:
        return { icon: Activity, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
    }
  };

  const sampleLogs: WorkforceAuditEvent[] = auditLogs.length > 0 ? auditLogs : [
    {
      id: 'aud_1',
      timestamp: new Date().toISOString(),
      userId: 'usr_1',
      userName: 'Ali Raza',
      eventType: 'CLOCK_IN',
      details: 'Ali Raza clocked in at 08:57 AM (Assigned Pump 1 - Nozzle 2)'
    },
    {
      id: 'aud_2',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      userId: 'usr_2',
      userName: 'Usama Manager',
      eventType: 'SHIFT_OPEN',
      details: 'Morning Shift Opened by Usama Manager with Rs. 50,000 opening float'
    },
    {
      id: 'aud_3',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      userId: 'usr_3',
      userName: 'Bilal Cashier',
      eventType: 'CLOCK_IN',
      details: 'Bilal Cashier clocked in at 08:15 AM (Assigned Cash Counter)'
    },
    {
      id: 'aud_4',
      timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
      userId: 'usr_4',
      userName: 'Admin',
      eventType: 'PAYROLL_APPROVED',
      details: 'Generated and approved July Payroll for 12 employees'
    },
    {
      id: 'aud_5',
      timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
      userId: 'usr_5',
      userName: 'Manager',
      eventType: 'LEAVE_APPROVED',
      details: 'Approved 2 days Annual Leave for Tariq'
    }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {t('Live Activity Feed', 'لائیو سرگرمی فیڈ')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('Realtime operational audit events & log stream', 'عملے اور شفٹ سے متعلق تمام لائیو ایونٹس')}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          ● {t('Live Stream', 'لائیو سٹریم')}
        </span>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {sampleLogs.map((log, idx) => {
          const badge = getEventBadge(log.eventType);
          const IconComp = badge.icon;
          const timeFormatted = new Date(log.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          return (
            <motion.div
              key={log.id || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex items-start gap-3 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs"
            >
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${badge.color}`}>
                <IconComp className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{log.userName}</span>
                  <span className="font-mono text-[10px] text-slate-400">{timeFormatted}</span>
                </div>
                <p className="text-slate-300 mt-0.5">{log.details}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
