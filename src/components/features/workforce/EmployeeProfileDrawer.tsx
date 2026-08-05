import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Staff, WorkforceAttendanceRecord, WorkforcePayrollRecord, WorkforceLeaveRequest, WorkforceAuditEvent } from '../../../types';
import { 
  X, 
  User, 
  Phone, 
  CreditCard, 
  Clock, 
  Calendar, 
  Award, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  DollarSign, 
  Building2, 
  Zap, 
  Activity, 
  TrendingUp, 
  FileCheck 
} from 'lucide-react';
import { formatCurrency } from '../../../lib/currency';

interface EmployeeProfileDrawerProps {
  employee: Staff | null;
  attendance: WorkforceAttendanceRecord[];
  payroll: WorkforcePayrollRecord[];
  leaveRequests: WorkforceLeaveRequest[];
  auditLogs: WorkforceAuditEvent[];
  isUrdu: boolean;
  onClose: () => void;
}

export const EmployeeProfileDrawer: React.FC<EmployeeProfileDrawerProps> = ({
  employee,
  attendance,
  payroll,
  leaveRequests,
  auditLogs,
  isUrdu,
  onClose
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'attendance' | 'payroll' | 'performance' | 'leaves' | 'documents' | 'training' | 'shift_history' | 'audit' | 'timeline'
  >('overview');

  if (!employee) return null;

  const empAttendance = attendance.filter((a) => a.employeeId === employee.id);
  const empPayroll = payroll.filter((p) => p.employeeId === employee.id);
  const empLeaves = leaveRequests.filter((l) => l.employeeId === employee.id);
  const empLogs = auditLogs.filter((l) => l.userId === employee.id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 text-white h-full flex flex-col shadow-2xl overflow-y-auto"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 border-2 border-emerald-400 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-emerald-500/20">
                {employee.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {employee.name}
                  {employee.dutyStatus === 'on_duty' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 capitalize">
                  {employee.role} • {employee.designation || 'Fuel Operations'} • {employee.currentAssignment || 'Main Counter 1'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 10 Navigation Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950 px-4 text-xs font-semibold overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: t('Overview', 'خلاصہ') },
              { id: 'attendance', label: t('Attendance', 'حاضری') },
              { id: 'payroll', label: t('Payroll', 'پے رول') },
              { id: 'performance', label: t('Performance', 'کارکردگی') },
              { id: 'leaves', label: t('Leaves', 'چھٹیاں') },
              { id: 'documents', label: t('Documents', 'دستاویزات') },
              { id: 'training', label: t('Training', 'تربیت') },
              { id: 'shift_history', label: t('Shift History', 'شفٹ ہسٹری') },
              { id: 'audit', label: t('Audit Log', 'آڈٹ لاگ') },
              { id: 'timeline', label: t('Timeline', 'ٹائم لائن') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-400 text-emerald-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Drawer Body Content */}
          <div className="p-5 space-y-4 flex-1">

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-2">
                  <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-400" />
                    {t('Personal & Organization Profile', 'شخصی اور ادارہ جاتی معلومات')}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex justify-between py-1 border-b border-slate-700/50">
                      <span className="text-slate-400">{t('Urdu Name:', 'اردو نام:')}</span>
                      <span className="font-bold text-white">{employee.urduName || employee.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-700/50">
                      <span className="text-slate-400">{t('CNIC:', 'شناختی کارڈ:')}</span>
                      <span className="font-mono text-slate-200">{employee.cnic || '35202-1234567-1'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-700/50">
                      <span className="text-slate-400">{t('Phone:', 'فون نمبر:')}</span>
                      <span className="font-mono text-slate-200">{employee.phone || '+92 300 1234567'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-700/50">
                      <span className="text-slate-400">{t('Branch / Station:', 'برانچ / اسٹیشن:')}</span>
                      <span className="font-semibold text-cyan-300">Bakhshali Station</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-700/50">
                      <span className="text-slate-400">{t('Department:', 'شعبہ:')}</span>
                      <span className="font-semibold text-purple-300">Fuel Operations</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-700/50">
                      <span className="text-slate-400">{t('Base Salary:', 'بنیادی تنخواہ:')}</span>
                      <span className="font-mono font-bold text-emerald-400">{formatCurrency(employee.salary || 35000)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">{t('Advance Balance', 'پیشگی بیلنس')}</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {formatCurrency(employee.advanceBalance || 0)}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">{t('Loan Balance', 'قرضہ بیلنس')}</span>
                    <span className="font-mono font-bold text-rose-400 text-sm">
                      {formatCurrency(employee.loanBalance || 0)}
                    </span>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 block">{t('KPI Score', 'کارکردگی اسکور')}</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">96%</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ATTENDANCE */}
            {activeTab === 'attendance' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700 text-center">
                    <span className="text-[10px] text-slate-400 block">Monthly Turnout</span>
                    <span className="font-bold text-emerald-400 text-sm">98%</span>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700 text-center">
                    <span className="text-[10px] text-slate-400 block">Late Arrivals</span>
                    <span className="font-bold text-amber-400 text-sm">1</span>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700 text-center">
                    <span className="text-[10px] text-slate-400 block">OT Hours Logged</span>
                    <span className="font-bold text-cyan-400 text-sm">14h</span>
                  </div>
                </div>
                {empAttendance.map((att) => (
                  <div key={att.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{att.date}</div>
                      <div className="text-[10px] text-slate-400">In: {att.clockIn} | Out: {att.clockOut || 'Active'}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 capitalize">
                      {att.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: PAYROLL */}
            {activeTab === 'payroll' && (
              <div className="space-y-2 text-xs">
                {empPayroll.map((p) => (
                  <div key={p.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{p.month}</div>
                      <div className="text-[10px] text-slate-400">Gross: {formatCurrency(p.grossSalary || p.baseSalary)} | Net: {formatCurrency(p.netSalary)}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${p.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: PERFORMANCE */}
            {activeTab === 'performance' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Fuel Sold (L)</span>
                    <span className="font-bold text-cyan-300 text-base font-mono">24,500 L</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Revenue Handled</span>
                    <span className="font-bold text-emerald-400 text-base font-mono">Rs 6,982,500</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Punctuality Rate</span>
                    <span className="font-bold text-emerald-400 text-base font-mono">99.2%</span>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Cash Difference</span>
                    <span className="font-bold text-emerald-400 text-base font-mono">Rs 0 (Exact)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: LEAVES */}
            {activeTab === 'leaves' && (
              <div className="space-y-2 text-xs">
                {empLeaves.map((l) => (
                  <div key={l.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white capitalize">{l.leaveType} Leave ({l.totalDays} Days)</div>
                      <div className="text-[10px] text-slate-400">{l.startDate} to {l.endDate}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Approved</span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 6: DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="space-y-2 text-xs">
                <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">CNIC Smart Card Scan</div>
                    <div className="text-[10px] text-slate-400">Expires: 2028-12-31</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Valid</span>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Employment Agreement</div>
                    <div className="text-[10px] text-slate-400">Signed 2024-01-01</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>
                </div>
              </div>
            )}

            {/* TAB 7: TRAINING */}
            {activeTab === 'training' && (
              <div className="space-y-2 text-xs">
                <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Petroleum Safety & Fire Extinguisher Handling</div>
                    <div className="text-[10px] text-slate-400">Completed 2025-03-15</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Certified</span>
                </div>
              </div>
            )}

            {/* TAB 8: SHIFT HISTORY */}
            {activeTab === 'shift_history' && (
              <div className="space-y-2 text-xs">
                <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                  <div className="font-bold text-white">Morning Shift • Pump 01 - Nozzle 01</div>
                  <div className="text-[10px] text-slate-400">Supervisor: Zahid | Date: Today</div>
                </div>
              </div>
            )}

            {/* TAB 9: AUDIT LOG */}
            {activeTab === 'audit' && (
              <div className="space-y-2 text-xs">
                {empLogs.map((log) => (
                  <div key={log.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                    <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-1">
                      <span>{log.eventType}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-200">{log.details}</p>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 10: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="space-y-3 text-xs pl-2 border-l-2 border-slate-800 ml-2">
                <div className="relative pl-4">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500"></div>
                  <div className="font-bold text-white">08:00 AM — Clocked In</div>
                  <div className="text-[10px] text-slate-400">Assigned Pump 1 - Nozzle 01 (Petrol)</div>
                </div>
                <div className="relative pl-4">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-cyan-500"></div>
                  <div className="font-bold text-white">Yesterday — July Payroll Processed</div>
                  <div className="text-[10px] text-slate-400">Rs 41,500 credited via Cash Account</div>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
