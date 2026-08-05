import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WorkforceLeaveRequest, Staff } from '../../../types';
import { Calendar, CheckCircle2, XCircle, Clock, PlusCircle, UserCheck } from 'lucide-react';

interface LeaveEngineTabProps {
  leaveRequests: WorkforceLeaveRequest[];
  staffList: Staff[];
  isUrdu: boolean;
  onApproveLeave: (id: string, approverName: string) => Promise<void>;
  onRejectLeave: (id: string, approverName: string, reason?: string) => Promise<void>;
  onSubmitLeave: (req: WorkforceLeaveRequest) => Promise<void>;
}

export const LeaveEngineTab: React.FC<LeaveEngineTabProps> = ({
  leaveRequests,
  staffList,
  isUrdu,
  onApproveLeave,
  onRejectLeave,
  onSubmitLeave
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);
  const [showModal, setShowModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || '');
  const [leaveType, setLeaveType] = useState<'annual' | 'casual' | 'sick' | 'unpaid'>('annual');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find(s => s.id === selectedStaffId);
    if (!staff) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

    const req: WorkforceLeaveRequest = {
      id: `lve_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      employeeId: staff.id,
      employeeName: staff.name,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason: reason || 'Personal work',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await onSubmitLeave(req);
    setShowModal(false);
    setReason('');
  };

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved');
  const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              {t('Leave Management Engine', 'چھٹیوں کا نظم و ضبط انجن')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('Pending approvals, approved roster & substitute coverage', 'منظوری کی درخواستیں اور چھٹیوں کا ریکارڈ')}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          {t('Apply Leave', 'چھٹی کی درخواست')}
        </button>
      </div>

      {/* Grid of Leave Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Requests Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {t('Pending Approvals', 'زیرِ التوا درخواستیں')} ({pendingRequests.length})
          </h4>

          {pendingRequests.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
              {t('No pending leave requests', 'کوئی التوا کی درخواست نہیں ہے')}
            </div>
          ) : (
            pendingRequests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-bold text-white text-sm">{req.employeeName}</h5>
                    <span className="text-[11px] font-semibold text-indigo-400 capitalize">
                      {req.leaveType} Leave • {req.totalDays} {t('Days', 'دن')}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {t('Pending', 'التوا')}
                  </span>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 mb-3 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">{t('Dates:', 'تاریخیں:')}</span>
                    <span className="font-mono text-cyan-300 font-medium">{req.startDate} to {req.endDate}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">{t('Reason:', 'وجہ:')}</span>
                    <span className="text-slate-200">{req.reason}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApproveLeave(req.id, 'Manager')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('Approve', 'منظور کریں')}
                  </button>
                  <button
                    onClick={() => onRejectLeave(req.id, 'Manager', 'Coverage issue')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    {t('Reject', 'مسترد کریں')}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Approved Roster Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {t('Approved Roster', 'منظور شدہ ہسٹری')} ({approvedRequests.length})
          </h4>

          {approvedRequests.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
              {t('No approved leave history', 'کوئی منظور شدہ رخصت نہیں ہے')}
            </div>
          ) : (
            approvedRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow flex items-center justify-between"
              >
                <div>
                  <h5 className="font-bold text-white text-sm">{req.employeeName}</h5>
                  <p className="text-[11px] text-slate-400 capitalize">
                    {req.leaveType} Leave • {req.startDate} to {req.endDate} ({req.totalDays} {t('days', 'دن')})
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  {t('Approved', 'منظور شد')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-white"
          >
            <h3 className="text-lg font-bold mb-4">{t('Submit Leave Request', 'چھٹی کی درخواست درج کریں')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('Select Staff', 'ملازم منتخب کریں')}</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('Leave Type', 'چھٹی کی قسم')}</label>
                <select
                  value={leaveType}
                  onChange={(e: any) => setLeaveType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('Start Date', 'شروع کی تاریخ')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('End Date', 'اختتام کی تاریخ')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('Reason', 'وجہ')}</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Enter reason..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  {t('Cancel', 'منسوخ')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
                >
                  {t('Submit', 'جمع کریں')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
