/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  ShieldAlert,
  Coins,
  DollarSign,
  PlusCircle,
  HelpCircle,
  UserCheck,
  Calendar,
  Phone,
  Trash2,
  Lock,
  MinusCircle,
  Clock,
  Briefcase,
  FileText,
  TrendingDown,
  UserX,
  X,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { ModuleSearchBar } from '../shared/ModuleSearchBar';
import { Staff, GlobalSettings, StaffFinanceEntry, AttendanceRecord, Shift, SalaryTransaction, StaffLoan, SalaryAdvance } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency';
import { useStation } from '../../contexts/StationContext';
import { SalaryEngine } from '../../services/salaryEngine';
import RoleGuard from '../ui/RoleGuard';

interface StaffProps {
  settings: GlobalSettings;
  staff: Staff[];
  onAddStaff: (member: Staff) => void;
  onUpdateStaff: (member: Staff) => void;
  onDeleteStaff?: (id: string) => void;
  staffFinance: StaffFinanceEntry[];
  onAddStaffFinance: (newEntry: StaffFinanceEntry) => void;
  attendance: AttendanceRecord[];
  onAddAttendance: (records: AttendanceRecord[]) => void;
  shifts: Shift[];
}

export default function StaffPanel({
  settings,
  staff,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  staffFinance,
  onAddStaffFinance,
  attendance,
  onAddAttendance,
  shifts
}: StaffProps) {
  const { showToast, showAlert, showConfirm, salaryTransactions, staffLoans, salaryAdvances, handleAddSalaryTransaction, handleAddStaffLoan, handleAddSalaryAdvance, handleAddStandaloneExpense, handleUpdateBanks, banks } = useStation();
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Active section tab
  const [activeTab, setActiveTab] = useState<'crew' | 'finance' | 'legacy_finance' | 'attendance' | 'performance' | 'attendance_reports'>('crew');

  // Query and reporting states for Performance and Attendance tabs
  const [selectedPerfStaffId, setSelectedPerfStaffId] = useState<string>('all');
  const [attendanceReportView, setAttendanceReportView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [attendanceReportMonth, setAttendanceReportMonth] = useState(() => new Date().toISOString().substring(0, 7));

  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Register state overlays/toggles
  const [showAddStaff, setShowAddStaff] = useState(false);

  // Form caches: Crew Registration
  const [addName, setAddName] = useState('');
  const [addUrduName, setAddUrduName] = useState('');
  const [addRole, setAddRole] = useState<'owner' | 'manager' | 'cashier' | 'salesman'>('salesman');
  const [addSalary, setAddSalary] = useState('');
  const [addPin, setAddPin] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addCnic, setAddCnic] = useState('');

  // Form caches: Ledger Entries
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [financeType, setFinanceType] = useState<'advance' | 'loan' | 'accrual' | 'issue'>('advance');
  const [financeAmount, setFinanceAmount] = useState('');
  const [financeNote, setFinanceNote] = useState('');
  const [financeMode, setFinanceMode] = useState<'cash' | 'bank' | 'transfer'>('cash');
  const [financeDate, setFinanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [salaryMonth, setSalaryMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [loanInstallment, setLoanInstallment] = useState('');

  // Form caches: Daily Attendance Register (Module E1)
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, { status: 'present' | 'absent' | 'leave' | 'off' | 'late'; checkIn: string; checkOut: string }>>(() => {
    const initial: Record<string, { status: 'present' | 'absent' | 'leave' | 'off' | 'late'; checkIn: string; checkOut: string }> = {};
    staff.forEach(s => {
      initial[s.id] = { status: 'present', checkIn: '08:00', checkOut: '17:00' };
    });
    return initial;
  });

  // Selected Crew name helper
  const activeStaffToCharge = useMemo(() => {
    if (!selectedStaffId) return null;
    return staff.find(st => st.id === selectedStaffId) || null;
  }, [selectedStaffId, staff]);

  // Calculations for dashboard highlights
  const totalAdvancesSum = useMemo(() => {
    return staff.reduce((sum, s) => sum + (s.advanceBalance || 0), 0);
  }, [staff]);

  const totalMonthlyPayrollExpect = useMemo(() => {
    return staff.reduce((sum, s) => sum + (s.salary || 0), 0);
  }, [staff]);

  const todayAttendanceSummary = useMemo(() => {
    const todayRecs = attendance.filter(a => a.date === attendanceDate);
    const present = todayRecs.filter(r => r.status === 'present').length;
    const absent = todayRecs.filter(r => r.status === 'absent').length;
    return { present, absent, totalCount: todayRecs.length };
  }, [attendance, attendanceDate]);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;
    return staff.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.urduName && s.urduName.includes(searchQuery))
    );
  }, [staff, searchQuery]);

  // ==========================================
  // HANDLERS
  // ==========================================

  // Create Staff
  const handleCreateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || addName.trim() === '') {
      showToast(t('Please enter a name for the staff member!', 'برائے مہربانی ملازم کا نام درج کریں!'), 'error');
      return;
    }

    if (!addPin || addPin.length < 4 || addPin.length > 6) {
      showToast(t('Please set a valid 4 to 6 digit security login PIN!', 'برائے مہربانی درست 4 سے 6 ہندسوں کا سیکیورٹی لاگ ان پن سیٹ کریں!'), 'error');
      return;
    }

    const newPrs: Staff = {
      id: `st_${Date.now()}`,
      name: addName,
      urduName: addUrduName || addName,
      role: addRole,
      salary: Number(addSalary) || 25000,
      advances: 0,
      active: true,
      pin: addPin,
      phone: addPhone || '',
      cnic: addCnic || ''
    };

    onAddStaff(newPrs);

    // Bootstrap initial attendance state for this user
    setAttendanceStatuses(prev => ({
      ...prev,
      [newPrs.id]: { status: 'present', checkIn: '08:00', checkOut: '17:00' }
    }));

    setAddName('');
    setAddUrduName('');
    setAddSalary('');
    setAddPin('');
    setAddPhone('');
    setAddCnic('');
    setShowAddStaff(false);
    showToast(t('Pump crew member registered successfully!', 'پمپ ملازم کامیابی سے رجسٹر ہو گیا!'), 'success');
  };

  // Salary Engine Handler
  const handlePostFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    const staffMember = staff.find(s => s.id === selectedStaffId);
    if (!staffMember) return;

    const amt = Number(financeAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast(t('Please enter a valid monetary amount!', 'براہ کرم درست رقم لکھیں!'), 'error');
      return;
    }

    try {
      if (financeType === 'advance') {
        const adv = SalaryEngine.issueAdvance(staffMember.id, staffMember.name, amt);
        await handleAddSalaryAdvance(adv);
        // Also update staff advanceBalance
        onUpdateStaff({ ...staffMember, advanceBalance: (staffMember.advanceBalance || 0) + amt });
      } else if (financeType === 'loan') {
        const inst = Number(loanInstallment) || amt;
        const loan = SalaryEngine.issueLoan(staffMember.id, staffMember.name, amt, inst);
        await handleAddStaffLoan(loan);
        // Also update staff loanBalance
        onUpdateStaff({ ...staffMember, loanBalance: (staffMember.loanBalance || 0) + amt });
      } else if (financeType === 'accrual') {
        const txn = SalaryEngine.accrueSalary(staffMember.id, staffMember.name, amt, salaryMonth, 'system');
        await handleAddSalaryTransaction(txn);
        // Update staff salaryBalance
        onUpdateStaff({ ...staffMember, salaryBalance: (staffMember.salaryBalance || 0) + amt });
      } else if (financeType === 'issue') {
        const txn = SalaryEngine.accrueSalary(staffMember.id, staffMember.name, amt, salaryMonth, 'system');
        
        // Calculate deductions
        const maxAdvance = staffMember.advanceBalance || 0;
        const maxLoan = staffMember.loanBalance || 0;
        const loanInstallmentToDeduct = staffLoans.find(l => l.employeeId === staffMember.id && l.status === 'active')?.monthlyInstallment || 0;
        
        // Very basic deduction strategy for now (deduct all advance if possible, then loan installment)
        const advDed = Math.min(amt, maxAdvance);
        let remainingForLoan = amt - advDed;
        const loanDed = Math.min(remainingForLoan, Math.min(maxLoan, loanInstallmentToDeduct));

        txn.advanceDeduction = advDed;
        txn.loanDeduction = loanDed;

        const res = SalaryEngine.paySalary({
          salaryTx: txn,
          staffMember,
          paymentSource: financeMode,
          isBankOrDigital: financeMode !== 'cash',
          expenseDate: financeDate
        });
        
        await handleAddSalaryTransaction(res.updatedSalaryTx);
        handleAddStandaloneExpense(res.expenseEntry);

        // Update Bank Balance if needed
        if (res.cashEntry && banks && financeMode !== 'cash') {
          // Assume financeMode is the bank account ID when it's not 'cash'.
          const updatedBanks = banks.map(bk => bk.id === financeMode ? { ...bk, balance: bk.balance + res.cashEntry!.amount } : bk);
          handleUpdateBanks(updatedBanks);
        }

        // Update Staff Balances
        onUpdateStaff({
          ...staffMember,
          salaryBalance: Math.max(0, (staffMember.salaryBalance || 0) - amt),
          advanceBalance: Math.max(0, (staffMember.advanceBalance || 0) - advDed),
          loanBalance: Math.max(0, (staffMember.loanBalance || 0) - loanDed)
        });
      }

      setFinanceAmount('');
      setFinanceNote('');
      setLoanInstallment('');
      setSelectedStaffId(null);
      showToast(t('Transaction successfully recorded!', 'مالی لاگ محفوظ ہو گیا!'), 'success');
    } catch (err: any) {
      showToast(err.message || 'Error occurred', 'error');
    }
  };

  // Submit Active Attendance Register (Module E1)
  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const recordsToSave: AttendanceRecord[] = Object.entries(attendanceStatuses).map(([sId, val]) => {
      const data = val as { status: 'present' | 'absent' | 'leave' | 'off' | 'late'; checkIn: string; checkOut: string };
      return {
        id: `att_${sId}_${attendanceDate}`,
        staffId: sId,
        date: attendanceDate,
        status: data.status,
        checkIn: data.status === 'present' ? data.checkIn : '',
        checkOut: data.status === 'present' ? data.checkOut : ''
      };
    });

    onAddAttendance(recordsToSave);
    showToast(t(
      `Daily attendance register logged successfully for date: ${attendanceDate}!`,
      `ٹوٹل ملازمین کی حاضری شیٹ تاریخ ${attendanceDate} کیلئے کامیابی سے محفوظ ہو گئی!`
    ), 'success');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-5">

      {/* COMPACT BILINGUAL HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-600" />
            <span>{t('Staff, Attendance & Salaried Registers', 'عملے کا حاضری اور تنخواہ رجسٹر')}</span>
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-1">
            {t(
              'Audit daily operator attendance clocks, record advance credits and issue monthly payroll allocations securely.',
              'کیشیئرز، مینیجرز اور نوزل مین کی روزانہ ڈیوٹی حاضری شیٹ، ایڈوانس کھاتہ اور تنخواہ کارروائی یہاں سے کریں۔'
            )}
          </p>
        </div>

        <button
          onClick={() => setShowAddStaff(true)}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2.5 font-sans text-xs font-bold text-white shadow-md hover:bg-orange-700 transition-all cursor-pointer self-start sm:self-center"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{t('Register New Crew', 'نیا پمپ ملازم شامل کریں')}</span>
        </button>
      </div>

      {/* UNIVERSAL MODULE SEARCH BAR */}
      <ModuleSearchBar
        moduleName={t('Staff', 'عملہ')}
        placeholder={t('Search staff members...', 'عملہ تلاش کریں...')}
        onSearch={setSearchQuery}
        onExport={() => showToast(t('Export coming soon', 'ایکسپورٹ جلد آرہا ہے'), 'info')}
      />

      {/* CORE HIGHLIGHT CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 min-h-[90px] gap-3 sm:gap-4 sm:grid-cols-2">
        {/* Payroll burden */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-500"></div>
          <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            {t('Est. Monthly Payroll Allocation', 'ماہانہ تنخواہ کا مجموعی بوجھ')}
          </span>
          <strong className="font-mono text-xl font-bold text-slate-800 tracking-tight mt-1.5 block">
            {formatCurrency(totalMonthlyPayrollExpect, settings)}
          </strong>
        </div>

        {/* Advances outstanding */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-orange-500"></div>
          <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            {t('Total Outstanding Advances Lent', 'مجموعی واجب الاصول ایڈوانس رقم')}
          </span>
          <strong className="font-mono text-xl font-bold text-orange-600 tracking-tight mt-1.5 block">
            {formatCurrency(totalAdvancesSum, settings)}
          </strong>
        </div>

        {/* Attendance widget */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-teal-500"></div>
          <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            {t('Today Attendance Roster', 'آج کے روزانہ ملازمین حاضری')}
          </span>
          <strong className="font-sans text-sm font-bold text-slate-800 tracking-tight mt-1.5 block">
            {todayAttendanceSummary.present} Present / {todayAttendanceSummary.absent} Absent
          </strong>
        </div>
      </div>

      {/* INTERACTIVE NAVIGATION SUBTABS */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 pb-0.5 overflow-x-auto whitespace-nowrap no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('crew')}
          className={`px-3 sm:px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'crew'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('👥 Active Operators Roster', '👥 ملازمین کی بنیادی لسٹ')}
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3 sm:px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('📝 Daily Attendance Registers Sheet', '📝 روزانہ ڈیوٹی حاضری شیٹ')}
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`px-3 sm:px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'finance'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('💵 Salary & Advances Ledger', '💵 تنخواہ اور ایڈوانس لاگز')}
        </button>

        <button
          onClick={() => setActiveTab('legacy_finance')}
          className={`px-3 sm:px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'legacy_finance'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('📜 Legacy Salary History', '📜 پرانی تنخواہ کا ریکارڈ (صرف پڑھنے کے لیے)')}
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`px-3 sm:px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'performance'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('📊 Performance & Metrics History', '📊 کارکردگی اور ملازمین رپورٹ')}
        </button>

        <button
          onClick={() => setActiveTab('attendance_reports')}
          className={`px-3 sm:px-4 py-2.5 font-sans text-xs font-bold border-b-2 transition-all shrink-0 whitespace-nowrap ${
            activeTab === 'attendance_reports'
              ? 'border-orange-600 text-orange-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('📅 Duty Attendance Ledger Reports', '📅 حاضری کی تفصیلی رپورٹس')}
        </button>
      </div>

      {/* SUB-PANELS WORKSPACE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3 space-y-6 w-full max-w-full">

          {/* ==========================================
              TAB 1: STAFF CREW LIST (ROSTER)
              ========================================== */}
          {activeTab === 'crew' && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-x-auto">
              <table className="premium-table min-w-[800px]">
                <thead>
                  <tr className="text-slate-650 text-[10px]">
                    <th>{t('Crew Employee Name', 'ملازم کا نام')}</th>
                    <th>{t('Designated Station Role', 'عہدہ')}</th>
                    <th className="text-right">{t('Assigned Monthly Salary Rate', 'ماہانہ تنخواہ')}</th>
                    <th className="text-right">{t('Pending Advance Balance', 'ایڈوانس زِمہ واجب')}</th>
                    <th className="text-right">{t('Action Management', 'کھاتہ ایکشنز')}</th>
                  </tr>
                </thead>
                <tbody className="text-slate-705">
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 bg-slate-50/10">
                        <EmptyState
                          icon={Users}
                          title={t('No staff members yet.', 'کوئی ملازم موجود نہیں ہے۔')}
                          description={t('Track salesman commissions, advances, monthly wages, and fuel shifts duty roster.', 'پمپ سیلز مین، آپریٹرز، اور دیگر عملے کا کھاتہ، ایڈوانس، اور ڈیوٹی ریکارڈ کریں۔')}
                          actionLabel={t('+ Add Staff Member', '+ نیا ملازم شامل کریں')}
                          onAction={() => setShowAddStaff(true)}
                        />
                      </td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                        {t('No staff found matching search.', 'تلاش کے مطابق کوئی ملازم نہیں ملا۔')}
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map(mem => {
                      const activeAdvanceBalance = mem.advanceBalance || 0;
                      const activeLoanBalance = mem.loanBalance || 0;
                      const activeSalaryBalance = mem.salaryBalance || 0;

                      return (
                        <tr key={mem.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                                {mem.name.substring(0, 2)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 text-xs block">
                                  {t(mem.name, mem.urduName)}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">ID: {mem.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5">
                            <span className="rounded bg-slate-100 px-2.5 py-0.5 text-[10px] text-slate-600 font-bold capitalize select-none">
                              {mem.role}
                            </span>
                          </td>

                          <td className="py-3.5 text-right font-mono">
                            {formatCurrency(mem.salary, settings)}
                          </td>

                          <td className={`py-3.5 px-4 text-right font-mono font-bold ${activeAdvanceBalance > 0 || activeLoanBalance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            <div className="flex flex-col items-end gap-0.5">
                              {activeAdvanceBalance > 0 && <span className="text-[10px]"><span className="text-slate-500">Adv:</span> {formatCurrency(activeAdvanceBalance, settings)}</span>}
                              {activeLoanBalance > 0 && <span className="text-[10px]"><span className="text-slate-500">Loan:</span> {formatCurrency(activeLoanBalance, settings)}</span>}
                              {activeAdvanceBalance === 0 && activeLoanBalance === 0 && '—'}
                            </div>
                          </td>

                          <td className="py-3.5 text-right">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedStaffId(mem.id);
                                  setFinanceType('advance');
                                  setFinanceAmount('');
                                  setFinanceNote('');
                                }}
                                className="px-2.5 py-1 text-[10.5px] font-sans font-semibold rounded border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 cursor-pointer"
                              >
                                {t('💸 Advance', 'ایڈوانس')}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStaffId(mem.id);
                                  setFinanceType('loan');
                                  setFinanceAmount('');
                                  setFinanceNote('');
                                  setLoanInstallment('');
                                }}
                                className="px-2.5 py-1 text-[10.5px] font-sans font-semibold rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                              >
                                {t('🏦 Loan', 'قرضہ')}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStaffId(mem.id);
                                  setFinanceType('issue');
                                  setFinanceAmount('');
                                  setFinanceNote('');
                                }}
                                className="px-2.5 py-1 text-[10.5px] font-sans font-semibold rounded border border-teal-250 bg-teal-50 text-teal-700 hover:bg-teal-100 cursor-pointer"
                              >
                                {t('⚖️ Salary', 'تنخواہ')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ==========================================
              TAB 2: ATTENDANCE SHEET REGISTER (MODULE E1)
              ========================================== */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-row items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span>{t('Certified Crew Attendance Sheet', 'عملہ کی روزانہ حاضری رجسٹر')}</span>
                    </h3>
                    <p className="font-sans text-[11px] text-slate-400 mt-1">
                      {t('Enter shift roster attendances, check-in timestamps and check-out logs for duty operators.', 'آپریٹرز اور محاسبین کی روزانہ چیک ان، چیک آؤٹ ٹائم حاضری نشان زد کریں۔')}
                    </p>
                  </div>

                  {/* DATE SELECTOR WIDGET */}
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs font-bold text-slate-500">{t('Duty Date:', 'حاضری تاریخ:')}</span>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => {
                        setAttendanceDate(e.target.value);
                        // Pull existing data if present
                        const existingForDay = attendance.filter(a => a.date === e.target.value);
                        if (existingForDay.length > 0) {
                          const fetched: typeof attendanceStatuses = {};
                          existingForDay.forEach(r => {
                            fetched[r.staffId] = {
                              status: r.status,
                              checkIn: r.checkIn || '08:00',
                              checkOut: r.checkOut || '17:00'
                            };
                          });
                          setAttendanceStatuses(prev => ({ ...prev, ...fetched }));
                        }
                      }}
                      className="rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-mono text-xs px-2.5 py-1.5 outline-hidden focus:bg-white"
                    />
                  </div>
                </div>

                <form onSubmit={handleSaveAttendance} className="space-y-4">
                  {/* ATTENDANCE MATRIX BOARD */}
                  <div className="overflow-x-auto">
                    <table className="premium-table">
                      <thead>
                        <tr className="text-[10px]">
                          <th className="py-2.5 px-3">{t('Staff Name', 'عملہ ممبر')}</th>
                          <th className="py-2.5 text-center">{t('Status', 'ڈیوٹی پوزیشن')}</th>
                          <th className="py-2.5 text-center">{t('Absence', 'غیر حاضر')}</th>
                          <th className="py-2.5 text-center">{t('On Leave', 'رخصت')}</th>
                          <th className="py-2.5">{t('Check-In Time', 'چیک ان وقت')}</th>
                          <th className="py-2.5">{t('Check-Out Time', 'چیک آؤٹ وقت')}</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {staff.map(s => {
                          const current = attendanceStatuses[s.id] || { status: 'present', checkIn: '08:00', checkOut: '17:00' };

                          const setStatus = (st: typeof current['status']) => {
                            setAttendanceStatuses({
                              ...attendanceStatuses,
                              [s.id]: { ...current, status: st }
                            });
                          };

                          const setCheckIn = (val: string) => {
                            setAttendanceStatuses({
                              ...attendanceStatuses,
                              [s.id]: { ...current, checkIn: val }
                            });
                          };

                          const setCheckOut = (val: string) => {
                            setAttendanceStatuses({
                              ...attendanceStatuses,
                              [s.id]: { ...current, checkOut: val }
                            });
                          };

                          return (
                            <tr key={s.id} className="hover:bg-slate-50/20">
                              <td className="py-3.5 px-3">
                                <span className="font-bold text-slate-800 text-xs block">{t(s.name, s.urduName)}</span>
                                <span className="text-[10px] text-slate-450 block ml-0.5">{s.role.toUpperCase()}</span>
                              </td>

                              {/* PRESENT RADIO */}
                              <td className="py-3.5 text-center">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`att_${s.id}`}
                                    checked={current.status === 'present'}
                                    onChange={() => setStatus('present')}
                                    className="accent-teal-600 h-4 w-4"
                                  />
                                  <span className="text-xs font-bold text-teal-650">{t('Present', 'حاضر')}</span>
                                </label>
                              </td>

                              {/* ABSENT RADIO */}
                              <td className="py-3.5 text-center">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`att_${s.id}`}
                                    checked={current.status === 'absent'}
                                    onChange={() => setStatus('absent')}
                                    className="accent-red-600 h-4 w-4"
                                  />
                                  <span className="text-xs font-bold text-red-650">{t('Absent', 'غیر حاضر')}</span>
                                </label>
                              </td>

                              {/* LEAVE RADIO */}
                              <td className="py-3.5 text-center">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`att_${s.id}`}
                                    checked={current.status === 'leave'}
                                    onChange={() => setStatus('leave')}
                                    className="accent-amber-600 h-4 w-4"
                                  />
                                  <span className="text-xs font-bold text-amber-655">{t('Leave', 'رخصت')}</span>
                                </label>
                              </td>

                              {/* CHECK IN INPUT */}
                              <td className="py-3.5">
                                <input
                                  type="text"
                                  value={current.checkIn}
                                  onChange={(e) => setCheckIn(e.target.value)}
                                  disabled={current.status !== 'present'}
                                  placeholder="08:00"
                                  className="w-20 rounded border border-slate-200 bg-white p-1 text-center font-mono text-xs focus:border-orange-500 disabled:bg-slate-100 disabled:text-slate-400"
                                />
                              </td>

                              {/* CHECK OUT INPUT */}
                              <td className="py-3.5">
                                <input
                                  type="text"
                                  value={current.checkOut}
                                  onChange={(e) => setCheckOut(e.target.value)}
                                  disabled={current.status !== 'present'}
                                  placeholder="17:00"
                                  className="w-20 rounded border border-slate-200 bg-white p-1 text-center font-mono text-xs focus:border-orange-500 disabled:bg-slate-100 disabled:text-slate-400"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] font-sans text-xs font-bold text-white shadow-md hover:bg-orange-700 transition-colors cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{t('SAVE ATTENDANCE registers SHEET', 'آج کی حاضری شیٹ محفوظ کریں')}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* STATS RECORD HISTORY */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{t('Duty Attendance Historical Records log', 'گزشتہ حاضری ہسٹری لاگز')}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from(new Set(attendance.map(a => a.date))).map(dtKey => {
                    const dayRecs = attendance.filter(a => a.date === dtKey);
                    const prs = dayRecs.filter(r => r.status === 'present').length;
                    const abs = dayRecs.filter(r => r.status === 'absent').length;

                    return (
                      <div key={dtKey} className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <strong className="font-mono text-slate-800 text-[11.5px] block">{dtKey}</strong>
                          <span className="text-slate-450 block font-sans text-[10px]">
                            {prs} {t('Present', 'حاضر')} / {abs} {t('Absent', 'غیر حاضر')}
                          </span>
                        </div>
                        <span className="bg-teal-50 text-teal-700 select-none px-2 py-0.5 rounded-full text-[9px] font-bold">
                          {t('Logged', 'محفوظ شدہ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB: NEW SALARY ENGINE
              ========================================== */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              {/* SALARY TRANSACTIONS */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <h3 className="font-sans text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <span>{t('Salary Transactions', 'تنخواہ کی تفصیل')}</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="premium-table">
                    <thead>
                      <tr className="text-[10px]">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Month</th>
                        <th className="py-2.5 px-3">Employee</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3">Source</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {salaryTransactions.length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center">No transactions</td></tr>
                      ) : salaryTransactions.map(txn => (
                        <tr key={txn.id}>
                          <td className="px-3">{txn.paymentDate}</td>
                          <td className="px-3">{txn.month}</td>
                          <td className="px-3">{txn.employeeName}</td>
                          <td className="px-3 text-right">{formatCurrency(txn.amount, settings)}</td>
                          <td className="px-3">{txn.paymentSource}</td>
                          <td className="px-3">{txn.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STAFF LOANS */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <h3 className="font-sans text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Briefcase className="h-4 w-4 text-indigo-500" />
                  <span>{t('Staff Loans', 'ملازمین کے قرضے')}</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="premium-table">
                    <thead>
                      <tr className="text-[10px]">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Employee</th>
                        <th className="py-2.5 px-3 text-right">Loan Amount</th>
                        <th className="py-2.5 px-3 text-right">Monthly Inst.</th>
                        <th className="py-2.5 px-3 text-right">Remaining</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {staffLoans.length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center">No loans</td></tr>
                      ) : staffLoans.map(loan => (
                        <tr key={loan.id}>
                          <td className="px-3">{loan.dateIssued}</td>
                          <td className="px-3">{loan.employeeName}</td>
                          <td className="px-3 text-right">{formatCurrency(loan.loanAmount, settings)}</td>
                          <td className="px-3 text-right">{formatCurrency(loan.monthlyInstallment, settings)}</td>
                          <td className="px-3 text-right text-rose-600">{formatCurrency(loan.remainingBalance, settings)}</td>
                          <td className="px-3">{loan.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SALARY ADVANCES */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <h3 className="font-sans text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Coins className="h-4 w-4 text-orange-500" />
                  <span>{t('Salary Advances', 'تنخواہ کے ایڈوانس')}</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="premium-table">
                    <thead>
                      <tr className="text-[10px]">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Employee</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Recovered</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {salaryAdvances.length === 0 ? (
                        <tr><td colSpan={5} className="py-4 text-center">No advances</td></tr>
                      ) : salaryAdvances.map(adv => (
                        <tr key={adv.id}>
                          <td className="px-3">{adv.dateIssued}</td>
                          <td className="px-3">{adv.employeeName}</td>
                          <td className="px-3 text-right">{formatCurrency(adv.amount, settings)}</td>
                          <td className="px-3 text-right">{formatCurrency(adv.recoveredAmount, settings)}</td>
                          <td className="px-3">{adv.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: STAFF FINANCE AND PAYROLL LOG (MODULE E3)
              ========================================== */}
          {activeTab === 'legacy_finance' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <h3 className="font-sans text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span>{t('Salary, Accruals & Handouts Ledger Logs', 'تنخواہ، بقایا جات اور ایڈوانس کی مکمل ہسٹری')}</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="premium-table">
                    <thead>
                      <tr className="text-[10px] text-center">
                        <th className="py-2.5 px-3">{t('Post Date', 'تاریخ')}</th>
                        <th className="py-2.5">{t('Crew Employee', 'ملازم کا نام')}</th>
                        <th className="py-2.5">{t('Transaction Type', 'لین دین قسم')}</th>
                        <th className="py-2.5">{t('Posted Amount', 'رقم (روپے)')}</th>
                        <th className="py-2.5">{t('Pay Mode', 'طریقہ کار')}</th>
                        <th className="py-2.5">{t('Deducted Advance', 'ایڈوانس کٹوتی')}</th>
                        <th className="py-2.5 px-3 text-right">{t('Audit Reference / Notes', 'حوالہ / نوٹس')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 text-center">
                      {staffFinance.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400">
                            {t('No financial payroll actions registered yet.', 'سیلری ہسٹری تاحال خالی ہے۔')}
                          </td>
                        </tr>
                      ) : (
                        staffFinance.map(sf => {
                          const mem = staff.find(s => s.id === sf.staffId);
                          return (
                            <tr key={sf.id} className="hover:bg-slate-50/50">
                              <td className="px-3 font-mono">{sf.date}</td>
                              <td>
                                {mem ? t(mem.name, mem.urduName) : sf.staffId}
                              </td>
                              <td>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase select-none inline-flex items-center gap-1 ${
                                  sf.type === 'accrual'
                                    ? 'bg-purple-50 text-purple-700'
                                    : sf.type === 'advance'
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {sf.type === 'issue' ? (
                                    <>
                                      <span>✓</span>
                                      <span>{t('PAID', 'ادا شدہ')}</span>
                                    </>
                                  ) : (
                                    sf.type
                                  )}
                                </span>
                              </td>
                              <td className="font-mono">{formatCurrency(sf.amount, settings)}</td>
                              <td className="capitalize font-semibold">{sf.mode || '—'}</td>
                              <td className="font-mono text-rose-600">
                                {sf.deductedAdvance ? `${formatCurrency(sf.deductedAdvance, settings)}` : '—'}
                              </td>
                              <td className="px-3 text-right leading-relaxed overflow-hidden max-w-xs text-ellipsis">
                                <span className="block font-semibold text-slate-700">{sf.note}</span>
                                <span className="block text-[9px] font-mono text-slate-400">Ref: {sf.reference}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 4: STAFF PERFORMANCE & METRICS HISTORY
              ========================================== */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* KPIs Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('Total Shifts Conducted', 'کل شفٹیں برپا کی گئیں')}</span>
                  <strong className="font-mono text-lg font-bold text-slate-800 block mt-1">{shifts.length}</strong>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('Team Attendance Rate', 'عملہ کی مجموعی حاضری')}</span>
                  <strong className="font-mono text-lg font-bold text-emerald-600 block mt-1">
                    {attendance.length > 0
                      ? `${Math.round((attendance.filter(r => r.status === 'present').length / attendance.length) * 100)}%`
                      : '0%'}
                  </strong>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('Total Advances Remaining', 'مجموعی واجب الوصول ایڈوانس')}</span>
                  <strong className="font-mono text-lg font-bold text-rose-600 block mt-1">
                    {formatCurrency(staff.reduce((sum, s) => sum + (s.advanceBalance || 0), 0), settings)}
                  </strong>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('Team Wage Accruals', 'مجموعی بقایا تنخواہ')}</span>
                  <strong className="font-mono text-lg font-bold text-purple-650 block mt-1">
                    {formatCurrency(staff.reduce((sum, s) => sum + (s.salaryBalance || 0), 0), settings)}
                  </strong>
                </div>
              </div>

              {/* Main Performance auditing board */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-row items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-orange-600" />
                      <span>{t('Staff Duty Performance Audits', 'عملہ کی انفرادی کارکردگی اور تصفیہ رپورٹ')}</span>
                    </h3>
                    <p className="font-sans text-xs text-slate-400 mt-1">
                      {t('Analyze check-in punctuality, total volume processed, and cash compliance records shift-by-shift.', 'ہر آپریٹر کی شفٹ لاگ، نقد گنتی میں فرق، اور حاضری شیٹ کا مکمل آڈٹ۔')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs font-bold text-slate-500">{t('Filter Employee:', 'فلٹر ملازم:')}</span>
                    <select
                      value={selectedPerfStaffId}
                      onChange={(e) => setSelectedPerfStaffId(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-sans text-xs px-2.5 py-1.5 focus:bg-white focus:outline-hidden"
                    >
                      <option value="all">{t('All Active Workers', 'تمام ملازمین کا رکارڈ')}</option>
                      {staff.map(st => (
                        <option key={st.id} value={st.id}>{t(st.name, st.urduName)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="premium-table">
                    <thead>
                      <tr className="border-slate-150 text-[10px]">
                        <th className="py-2.5 px-3">{t('Staff Member', 'عملہ ممبر')}</th>
                        <th className="py-2.5 text-center">{t('Shifts Logged', 'کل شفٹیں')}</th>
                        <th className="py-2.5 text-center">{t('Attendance Rate', 'حاضری شرح')}</th>
                        <th className="py-2.5 px-3 text-right">{t('Salary Handed', 'بنیادی تنخواہ')}</th>
                        <th className="py-2.5 px-3 text-right">{t('Paid Advances', 'جاری ایڈوانس')}</th>
                        <th className="py-2.5 px-3 text-right">{t('Remaining Accruals', 'بقایا جات')}</th>
                        <th className="py-2.5 px-3 text-center">{t('Compliance Level', 'کارکردگی رینکنگ')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {staff
                        .filter(s => selectedPerfStaffId === 'all' || s.id === selectedPerfStaffId)
                        .map(s => {
                          const staffShifts = shifts.filter(sh => sh.staffId === s.id);
                          const staffAtt = attendance.filter(attr => attr.staffId === s.id);
                          const presentDays = staffAtt.filter(attr => attr.status === 'present').length;
                          const attRate = staffAtt.length > 0 ? Math.round((presentDays / staffAtt.length) * 100) : 100;

                          // Evaluate warning if discrepancies are high
                          const varianceCount = staffShifts.filter(sh => (sh.cashVariance || 0) !== 0).length;

                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50">
                              <td className="px-3">
                                <span className="font-bold text-slate-800 text-xs block">{t(s.name, s.urduName)}</span>
                                <span className="text-[10px] text-slate-450 block capitalize">{s.role} | {s.phone}</span>
                              </td>
                              <td className="text-center font-mono">{staffShifts.length}</td>
                              <td className="text-center">
                                <span className={`font-mono font-bold ${attRate < 80 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {attRate}%
                                </span>
                              </td>
                              <td className="px-3 text-right font-mono text-slate-600">{formatCurrency(s.salary, settings)}</td>
                              <td className="px-3 text-right font-mono text-rose-600">{formatCurrency(s.advanceBalance || 0, settings)}</td>
                              <td className="px-3 text-right font-mono text-purple-650">{formatCurrency(s.salaryBalance || 0, settings)}</td>
                              <td className="px-3 text-center">
                                {varianceCount === 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                    ✓ {t('Perfect Compliance', 'بہترین کارکردگی')}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-705">
                                    ⚠ {varianceCount} {t('Variances Logged', 'حساب میں تضاد')}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 5: STAFF ATTENDANCE REPORTS REGISTER
              ========================================== */}
          {activeTab === 'attendance_reports' && (
            <div className="space-y-6">
              {/* Report Controls Options */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-row items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span>{t('Comprehensive Attendance Ledger Dashboard', 'حاضری رجسٹر کا تفصیلی آڈٹ')}</span>
                    </h3>
                    <p className="font-sans text-xs text-slate-400 mt-1">
                      {t('Toggle between daily sheets, weekly rosters, and monthly attendance percentage metrics.', 'روزمرہ کی رپورٹ، ہفتہ وار شیٹ یا ماہانہ حاضری کا موازنہ یہاں دیکھیں۔')}
                    </p>
                  </div>

                  {/* Period selection */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setAttendanceReportView('daily')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        attendanceReportView === 'daily' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {t('Daily Sheet', 'روزانہ')}
                    </button>
                    <button
                      onClick={() => setAttendanceReportView('weekly')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        attendanceReportView === 'weekly' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {t('Weekly Matrix', 'ہفتہ وار')}
                    </button>
                    <button
                      onClick={() => setAttendanceReportView('monthly')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        attendanceReportView === 'monthly' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {t('Monthly Grid', 'ماہانہ')}
                    </button>
                  </div>
                </div>

                {/* Filter Selector Widgets */}
                <div className="flex items-center gap-2">
                  {attendanceReportView === 'daily' && (
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs font-bold text-slate-500">{t('Date Query:', 'تاریخ منتخب کریں:')}</span>
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-mono text-xs px-2.5 py-1.5 focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  )}

                  {attendanceReportView === 'monthly' && (
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs font-bold text-slate-500">{t('Month Query:', 'مہینہ منتخب کریں:')}</span>
                      <input
                        type="month"
                        value={attendanceReportMonth}
                        onChange={(e) => setAttendanceReportMonth(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-mono text-xs px-2.5 py-1.5 focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* RENDER VIEWS */}
              {attendanceReportView === 'daily' && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <h4 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {t(`Attendance status on date: ${attendanceDate}`, `روز مرہ حاضری بتاریخ: ${attendanceDate}`)}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="premium-table">
                      <thead>
                        <tr className="text-[10px]">
                          <th className="py-2.5 px-3">{t('Employee', 'ملازم کا نام')}</th>
                          <th className="py-2.5 px-3 text-center">{t('Duty Status', 'ڈیوٹی اسٹیٹس')}</th>
                          <th className="py-2.5 px-3 text-center">{t('Check-In', 'چیک ان')}</th>
                          <th className="py-2.5 px-3 text-center">{t('Check-Out', 'چیک آؤٹ')}</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {staff.map(st => {
                          const todayLog = attendance.find(a => a.date === attendanceDate && a.staffId === st.id);

                          return (
                            <tr key={st.id} className="hover:bg-slate-50/25">
                              <td className="px-3">{t(st.name, st.urduName)}</td>
                              <td className="px-3 text-center">
                                {!todayLog ? (
                                  <span className="rounded bg-slate-100 py-0.5 px-2 text-[10px] font-bold text-slate-400 uppercase">{t('No Log', 'غیر نشان زد')}</span>
                                ) : todayLog.status === 'present' ? (
                                  <span className="rounded bg-teal-50 py-0.5 px-2 text-[10px] font-bold text-teal-700 uppercase">{t('Present', 'ڈیوٹی پر حاضر')}</span>
                                ) : todayLog.status === 'leave' ? (
                                  <span className="rounded bg-amber-50 py-0.5 px-2 text-[10px] font-bold text-amber-700 uppercase">{t('Leave', 'رخصت')}</span>
                                ) : (
                                  <span className="rounded bg-rose-50 py-0.5 px-2 text-[10px] font-bold text-rose-700 uppercase">{t('Absent', 'غیر حاضر')}</span>
                                )}
                              </td>
                              <td className="px-3 text-center font-mono text-slate-700">{todayLog?.checkIn || '—'}</td>
                              <td className="px-3 text-center font-mono text-slate-700">{todayLog?.checkOut || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {attendanceReportView === 'weekly' && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <h4 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {t('Roster status matrix of the past 7 days', 'ہفتہ وار ملازمین حاضری گراف شیٹ')}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="premium-table">
                      <thead>
                        <tr className="text-[10px]">
                          <th className="py-2.5 px-3">{t('Staff Member', 'عملہ')}</th>
                          {Array.from({ length: 7 }).map((_, idx) => {
                            const date = new Date();
                            date.setDate(date.getDate() - idx);
                            const dtString = date.toISOString().split('T')[0].substring(5); // MM-DD
                            return <th key={idx} className="py-2.5 px-2 text-center whitespace-nowrap">{dtString}</th>;
                          })}
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {staff.map(st => (
                          <tr key={st.id} className="hover:bg-slate-50/25">
                            <td className="px-3">{t(st.name, st.urduName)}</td>
                            {Array.from({ length: 7 }).map((_, idx) => {
                              const date = new Date();
                              date.setDate(date.getDate() - idx);
                              const dtString = date.toISOString().split('T')[0];
                              const dayLog = attendance.find(a => a.date === dtString && a.staffId === st.id);

                              return (
                                <td key={idx} className="py-3 px-2 text-center">
                                  {!dayLog ? (
                                    <span className="text-slate-300 font-bold">—</span>
                                  ) : dayLog.status === 'present' ? (
                                    <strong className="text-teal-655 font-bold">✓</strong>
                                  ) : (
                                    <strong className="text-rose-600 font-bold">✕</strong>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {attendanceReportView === 'monthly' && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <h4 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {t(`Monthly aggregate metrics for: ${attendanceReportMonth}`, `ماہانہ خلاصہ حاضری شیٹ: ${attendanceReportMonth}`)}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="premium-table">
                      <thead>
                        <tr className="text-[10px]">
                          <th className="py-2.5 px-3">{t('Crew Employee', 'عملہ')}</th>
                          <th className="py-2.5 text-center">{t('Duty Days (Present)', 'کل حاضریاں')}</th>
                          <th className="py-2.5 text-center">{t('Absent Count', 'کل غیر حاضریاں')}</th>
                          <th className="py-2.5 text-center">{t('Approved Leaves (Off)', 'رخصتیں')}</th>
                          <th className="py-2.5 px-3 text-right">{t('Attendance Match Rate', 'مجموعی ٹریک شرح %')}</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {staff.map(st => {
                          const monthLogs = attendance.filter(a => a.date.startsWith(attendanceReportMonth) && a.staffId === st.id);
                          const presents = monthLogs.filter(a => a.status === 'present').length;
                          const absents = monthLogs.filter(a => a.status === 'absent').length;
                          const leaves = monthLogs.filter(a => a.status === 'leave').length;
                          const attRate = monthLogs.length > 0 ? Math.round((presents / monthLogs.length) * 100) : 100;

                          return (
                            <tr key={st.id} className="hover:bg-slate-50/25">
                              <td className="px-3">{t(st.name, st.urduName)}</td>
                              <td className="text-center font-mono text-slate-700">{presents}</td>
                              <td className="text-center font-mono text-rose-600">{absents}</td>
                              <td className="text-center font-mono text-amber-600">{leaves}</td>
                              <td className="px-3 text-right font-mono font-extrabold">{attRate}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ==========================================
          MODAL: ACCOUNT POST MODAL FOR PAYROLL OPERATIONS
          ========================================== */}
      <AnimatePresence>
        {selectedStaffId && activeStaffToCharge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-xl border border-slate-200 w-full max-w-xl p-5 space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h4 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-orange-600 animate-bounce" />
                  <span>{t('Post Finance Register Entry:', 'ملازم مالیاتی لیجر پوسٹ کارروائی:')}</span>
                </h4>
                <button onClick={() => setSelectedStaffId(null)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs font-sans space-y-1">
                <div>
                  <span className="text-slate-400 mr-2">{t('Employee Name:', 'ملازم کا نام:')}</span>
                  <strong className="text-slate-800">{isUrdu ? activeStaffToCharge.urduName : activeStaffToCharge.name}</strong>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>{t('Standard Base Pay:', 'ماہانہ تنخواہ:')} {formatCurrency(activeStaffToCharge.salary, settings)}</span>
                  <span>{t('Advances:', 'ایڈوانس بقایا:')} <strong className="text-rose-600">{formatCurrency(activeStaffToCharge.advanceBalance || 0, settings)}</strong></span>
                  <span>{t('Loans:', 'قرضہ بقایا:')} <strong className="text-rose-600">{formatCurrency(activeStaffToCharge.loanBalance || 0, settings)}</strong></span>
                </div>
              </div>

              <form onSubmit={handlePostFinance} className="space-y-4 font-sans text-xs">
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-505 font-bold mb-1">{t('Select Audit Aspect:', 'ٹرانزیکشن کی قسم:')}</label>
                    <select
                      value={financeType}
                      onChange={(e: any) => setFinanceType(e.target.value)}
                      className="premium-input border bg-white px-3 outline-hidden focus:border-orange-500"
                    >
                      <option value="advance">{t('Lent Short-term Advance', '💵 نیا ایڈوانس پے کریں')}</option>
                      <option value="loan">{t('Issue Long-term Loan', '🏦 نیا قرضہ دیں')}</option>
                      <option value="issue">{t('Monthly Net Salary Cashout', '⚖️ تنخواہ جاری کریں')}</option>
                      <option value="accrual">{t('Accrue Monthly Earned Salary Liabilities', '📊 تنخواہ اکاؤنٹ میں جمع کریں / جمع بقایا جات')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-505 font-bold mb-1">{t('Transaction Date:', 'ٹیکس تاریخ:')}</label>
                    <input
                      type="date"
                      required
                      value={financeDate}
                      onChange={(e) => setFinanceDate(e.target.value)}
                      className="premium-input border px-3 outline-hidden focus:border-orange-500 font-mono"
                    />
                  </div>

                  {(financeType === 'issue' || financeType === 'accrual') && (
                    <div>
                      <label className="block text-slate-505 font-bold mb-1">{t('Salary Month:', 'تنخواہ کا مہینہ:')}</label>
                      <input
                        type="month"
                        required
                        value={salaryMonth}
                        onChange={(e) => setSalaryMonth(e.target.value)}
                        className="premium-input border px-3 outline-hidden focus:border-orange-500 font-mono"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-505 font-bold mb-1">{t(`Monetary Amount (${getCurrencySymbol(settings)}):`, 'رقم (روپے):')}</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={financeAmount}
                      onChange={(e) => setFinanceAmount(e.target.value)}
                      className="premium-input border px-3 outline-hidden focus:border-orange-500 font-mono"
                    />
                  </div>

                  {financeType === 'loan' && (
                    <div>
                      <label className="block text-slate-505 font-bold mb-1">{t(`Monthly Installment (${getCurrencySymbol(settings)}):`, 'ماہانہ قسط (روپے):')}</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 1000"
                        value={loanInstallment}
                        onChange={(e) => setLoanInstallment(e.target.value)}
                        className="premium-input border px-3 outline-hidden focus:border-orange-500 font-mono"
                      />
                    </div>
                  )}

                  {financeType !== 'accrual' && (
                    <div>
                      <label className="block text-slate-505 font-bold mb-1">{t('Payment Mechanism Cash/Bank:', 'ادائیگی کا ذریعہ:')}</label>
                      <select
                        value={financeMode}
                        onChange={(e: any) => setFinanceMode(e.target.value)}
                        className="premium-input border bg-white px-3 outline-hidden focus:border-orange-500"
                      >
                        <option value="cash">{t('Station Daily Cash Box Outflow', 'روزانہ کیش فلو دراز')}</option>
                        <option value="bank">{t('Certified Corporate Bank Remittance', 'سرکاری اکاؤنٹ بینک ٹرانسفر')}</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-505 font-bold mb-1">{t('Auditor Internal Notes:', 'مخصوص معلومات یا ریمارکس:')}</label>
                    <input
                      type="text"
                      required
                      placeholder={t('e.g. Description or Reference', 'مثال: معلومات یا حوالہ')}
                      value={financeNote}
                      onChange={(e) => setFinanceNote(e.target.value)}
                      className="premium-input border px-3 outline-hidden focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedStaffId(null)}
                    className="bg-slate-105 text-slate-600 font-sans text-xs font-bold py-1.5 px-3 rounded hover:bg-slate-200 cursor-pointer uppercase"
                  >
                    {t('Cancel', 'کینسل')}
                  </button>
                  <RoleGuard 
                    allowedRoles={['Manager', 'Owner', 'Accountant']} 
                    fallback={<span className="text-red-500 font-bold self-center mr-2 text-[10px]">Unauthorized Role</span>}
                  >
                    <button
                      type="submit"
                      className="bg-orange-600 text-white font-sans text-xs font-bold py-1.5 px-4 rounded-lg hover:bg-orange-700 cursor-pointer uppercase shadow-xs"
                    >
                      {t('RECORD ADJUSTMENT LOG', 'اوساط لاگ درج کریں')}
                    </button>
                  </RoleGuard>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: ADD NEW STAFF MEMBER OVERLAY
          ========================================== */}
      <AnimatePresence>
        {showAddStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h4 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <PlusCircle className="h-4.5 w-4.5 text-orange-600 animate-pulse" />
                  <span>{t('Register New Crew Employee:', 'نیا پمپ ملازم بھرتی فارم:')}</span>
                </h4>
                <button onClick={() => setShowAddStaff(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateStaffSubmit} className="space-y-4 font-sans text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-505 font-bold mb-1">{t('Staff Name (English):', 'اسٹاف کا نام انگریزی میں:')}</label>
                    <input
                      type="text"
                      placeholder="e.g. Abdul Rehman"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="premium-input border px-3 outline-hidden focus:border-orange-500 font-sans text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-505 font-bold mb-1">{t('Staff Name (Urdu):', 'اسٹاف کا نام اردو میں:')}</label>
                    <input
                      type="text"
                      placeholder="e.g. عبد الرحمٰن"
                      value={addUrduName}
                      onChange={(e) => setAddUrduName(e.target.value)}
                      className="premium-input border px-3 outline-hidden focus:border-orange-500 font-sans text-right text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-505 font-bold mb-1">{t('Assigned Duty Role:', 'ڈیوٹی کا عہدہ:')}</label>
                    <select
                      value={addRole}
                      onChange={(e: any) => setAddRole(e.target.value)}
                      className="premium-input border bg-white px-3 outline-hidden focus:border-orange-500 font-sans text-slate-800"
                    >
                      <option value="salesman">{t('Nozzle Salesman / Operator', 'سیلزمین / نوزل آپریٹر')}</option>
                      <option value="cashier">{t('Cashier / Accountant', 'کیشیئر / کیش گننے والا')}</option>
                      <option value="manager">{t('Duty Station Manager', 'ڈیوٹی مینیجر')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-505 font-bold mb-1">{t(`Monthly Base Salary (${getCurrencySymbol(settings)}):`, 'ماہانہ बुनियादी تنخواہ:')}</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="25000"
                      value={addSalary}
                      onChange={(e) => setAddSalary(e.target.value)}
                      className="premium-input border pl-10 pr-3 outline-hidden focus:border-orange-500 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-505 font-bold mb-1">{t('Contact Phone Number (Optional):', 'فون نمبر (اختیاری):')}</label>
                    <input
                      type="tel"
                      placeholder="e.g. 03001234567"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      className="premium-input border px-3 outline-hidden focus:border-orange-500 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-505 font-bold mb-1">{t('National CNIC Number (Optional):', 'شناختی کارڈ نمبر (اختیاری):')}</label>
                    <input
                      type="text"
                      placeholder="e.g. 35201-1234567-1"
                      value={addCnic}
                      onChange={(e) => setAddCnic(e.target.value)}
                      className="premium-input border px-3 outline-hidden focus:border-orange-500 font-mono text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2 bg-orange-50/50 p-3 rounded-lg border border-orange-100 flex flex-col gap-1.5 text-slate-605 pt-2.5">
                    <div className="flex items-center gap-1.5 text-orange-700 font-bold">
                      <Lock className="h-3.5 w-3.5 text-orange-600" />
                      <span>{t('Assign Access Security PIN', 'سیکیورٹی پن کوڈ سیٹ کریں')}</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-slate-500">
                      {t('Assign a unique 4 to 6 digit login PIN for this worker to switch profiles securely from the Lock Screen.', 'ملازم کو لاگ ان اسکرین سے اپنا مخصوص سیشن کھولنے کے لیے 4 سے 6 ہندسوں کا پِن کوڈ تفویض کریں۔')}
                    </p>
                    <div className="mt-1">
                      <label className="block text-slate-755 font-bold mb-1 text-[10px] uppercase tracking-wider">
                        {t('Security PIN Code (4-6 digits):', 'سیکیورٹی پن کوڈ (4-6 ہندسے):')}
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="e.g. 1234"
                        pattern="\d*"
                        value={addPin}
                        onChange={(e) => setAddPin(e.target.value.replace(/\D/g, ''))}
                        className="w-32 border border-slate-200 rounded-lg p-2 text-center text-sm font-sans font-black tracking-widest outline-none focus:border-orange-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddStaff(false)}
                    className="bg-slate-105 text-slate-600 font-sans text-xs font-bold py-1.5 px-3 rounded hover:bg-slate-200 cursor-pointer uppercase"
                  >
                    {t('Cancel', 'کینسل')}
                  </button>
                  <button
                    type="submit"
                    className="bg-orange-600 text-white font-sans text-xs font-bold py-1.5 px-4 rounded-lg hover:bg-orange-700 cursor-pointer uppercase shadow-xs font-semibold"
                  >
                    {t('CREATE EMPLOYEE ACCOUNT', 'ملازم کا اکاؤنٹ بنائیں')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
