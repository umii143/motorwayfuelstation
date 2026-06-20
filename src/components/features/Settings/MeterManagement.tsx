import React, { useState, useMemo } from 'react';
import { Gauge, AlertTriangle, Key, Save, Calculator, Upload, TrendingDown, TrendingUp, ShieldAlert, ArrowRight, History, Search, Calendar, FileText } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { db } from '../../../data/db';
import { GlobalSettings, MeterResetEvent, AuditTrailEntry, InventoryMovement } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

export default function MeterManagement({ settings, activeStationId }: { settings: GlobalSettings, activeStationId: string }) {
  const { showToast, showAlert, nozzles, products, shifts, staff, handleAddMeterReset, meterResets } = useStation();
  const { user } = useAuth();
  
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [activeTab, setActiveTab] = useState<'setup' | 'history'>('setup');

  // Setup State
  const [selectedNozzleId, setSelectedNozzleId] = useState('');
  const [reason, setReason] = useState('');
  const [newReading, setNewReading] = useState('');
  const [pin, setPin] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Setup, 2: Impact Analysis, 3: Execution
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  // History State
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const selectedNozzle = nozzles.find(n => n.id === selectedNozzleId);
  const selectedProduct = selectedNozzle ? products.find(p => p.id === selectedNozzle.productId) : null;

  const currentReading = selectedNozzle?.currentReading || 0;
  const newReadingNum = parseFloat(newReading) || 0;
  const readingDifference = newReadingNum - currentReading;
  const financialImpact = readingDifference * (selectedProduct?.rate || 0);

  const handleCalculateImpact = () => {
    if (!selectedNozzleId || newReading === '' || !reason) {
      showToast(t('Please fill all required fields.', 'براہ کرم تمام ضروری خانے پُر کریں۔'), 'error');
      return;
    }
    const hasActiveShift = shifts.some(s => s.status === 'active');
    if (hasActiveShift) {
      showToast(t('Cannot reset meter while a shift is active. Please close the active shift first.', 'شفٹ ایکٹو ہونے کی صورت میں میٹر ری سیٹ نہیں کیا جا سکتا۔ پہلے شفٹ کلوز کریں۔'), 'error');
      return;
    }
    setStep(2);
  };

  const executeReset = async () => {
    if (!selectedNozzle || !selectedProduct) return;
    
    // Check PIN
    if (settings.security?.requirePinForMeterReset !== false) {
      if (pin !== settings.security?.masterPin) {
        showToast(t('Invalid Master PIN.', 'ماسٹر پن غلط ہے۔'), 'error');
        return;
      }
    }

    if (confirmationText !== 'RESET METER') {
      showToast(t('Please type RESET METER to confirm.', 'تصدیق کے لیے RESET METER ٹائپ کریں۔'), 'error');
      return;
    }

    try {
      // Find Active Shift for this Nozzle to log who was on duty
      // For simplicity, we just find any active shift or the last one
      const activeShift = shifts.find(s => s.status === 'active');
      const activeSalesman = activeShift ? staff.find(st => st.id === activeShift.staffId) : null;

      // 1. Log Meter Reset Event
      const resetEvent: MeterResetEvent = {
        id: 'mr_' + Date.now(),
        nozzleId: selectedNozzle.id,
        nozzleName: selectedNozzle.name,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        oldReading: currentReading,
        newReading: newReadingNum,
        stockAtReset: selectedProduct.currentStock,
        priceAtReset: selectedProduct.rate,
        reason: reason,
        isRollover: newReadingNum < currentReading && newReadingNum === 0,
        activeShiftId: activeShift?.id,
        salesmanName: activeSalesman ? activeSalesman.name : 'No Active Shift',
        authorizedBy: user?.email || 'Owner',
        timestamp: new Date().toISOString()
      };

      await handleAddMeterReset(resetEvent);

      // 2. Update Nozzle
      const updatedNozzle = { ...selectedNozzle, currentReading: newReadingNum };
      const updatedNozzles = nozzles.map(n => n.id === selectedNozzle.id ? updatedNozzle : n);
      db.saveNozzles(activeStationId, updatedNozzles);
      // Wait for app re-render or trigger nozzle update manually if needed (handled by DB mostly, but for immediate UI we might need context reload)
      // We will reload window or let db sync
      
      // 3. Log Audit Trail
      const auditEntry: AuditTrailEntry = {
        id: 'aud_' + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        category: 'SECURITY_CRITICAL',
        action: 'METER_RESET',
        details: `Meter reset for ${selectedNozzle.name}. Reason: ${reason}. Old: ${currentReading}, New: ${newReadingNum}`,
        oldValue: currentReading.toString(),
        newValue: newReadingNum.toString(),
        user: user?.email || 'Owner',
        role: user?.role || 'Owner',
        branch: activeStationId
      };
      
      const existingAudits = db.getSettingsAuditTrail(activeStationId);
      db.saveSettingsAuditTrail(activeStationId, [auditEntry, ...existingAudits]);

      showToast(t('Meter reset successfully.', 'میٹر کامیابی سے ری سیٹ ہو گیا۔'), 'success');
      
      // Reset form
      setStep(1);
      setSelectedNozzleId('');
      setNewReading('');
      setReason('');
      setPin('');
      setConfirmationText('');
      setEvidenceFile(null);
      
      // Force reload to apply nozzle state if not using bound context
      setTimeout(() => window.location.reload(), 1500);
      
    } catch (err) {
      console.error(err);
      showToast(t('Failed to reset meter.', 'میٹر ری سیٹ کرنے میں ناکامی۔'), 'error');
    }
  };

  // History Filtering
  const filteredHistory = useMemo(() => {
    return meterResets.filter(reset => {
      const matchSearch = 
        reset.nozzleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reset.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reset.authorizedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reset.salesmanName && reset.salesmanName.toLowerCase().includes(searchQuery.toLowerCase()));

      const resetDate = reset.timestamp.split('T')[0];
      const matchDate = (!startDate || resetDate >= startDate) && (!endDate || resetDate <= endDate);

      return matchSearch && matchDate;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [meterResets, searchQuery, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Gauge className="h-6 w-6 text-rose-600" />
            {t('Meter Management', 'میٹر مینجمنٹ')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('Strictly controlled zone for dispenser replacements and meter jump corrections.', 'ڈسپینسر کی تبدیلی اور میٹر جمپ کی درستگی کے لیے سختی سے کنٹرول شدہ زون۔')}
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${
              activeTab === 'setup' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gauge className="h-4 w-4" />
            {t('Reset Meter', 'ری سیٹ میٹر')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${
              activeTab === 'history' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-4 w-4" />
            {t('Reset History', 'ری سیٹ ہسٹری')}
          </button>
        </div>
      </div>

      {activeTab === 'setup' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Progress Steps */}
          <div className="flex items-center border-b border-slate-100 bg-slate-50 px-6 py-3">
            <div className={`flex items-center gap-2 text-sm font-bold ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>1</span>
              Setup
            </div>
            <div className="h-px w-8 bg-slate-300 mx-3 hidden sm:block"></div>
            <div className={`flex items-center gap-2 text-sm font-bold ${step >= 2 ? 'text-rose-600' : 'text-slate-400'} ml-4 sm:ml-0`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-rose-600 text-white' : 'bg-slate-200'}`}>2</span>
              Analysis
            </div>
            <div className="h-px w-8 bg-slate-300 mx-3 hidden sm:block"></div>
            <div className={`flex items-center gap-2 text-sm font-bold ${step >= 3 ? 'text-slate-900' : 'text-slate-400'} ml-4 sm:ml-0`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>3</span>
              Execute
            </div>
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Select Nozzle', 'نوزل منتخب کریں')}</label>
                  <select 
                    value={selectedNozzleId}
                    onChange={(e) => setSelectedNozzleId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="">{t('-- Select Nozzle --', '-- نوزل منتخب کریں --')}</option>
                    {nozzles.map(n => (
                      <option key={n.id} value={n.id}>{n.name} (Current: {n.currentReading})</option>
                    ))}
                  </select>
                </div>

                {selectedNozzleId && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Current Reading', 'موجودہ ریڈنگ')}</label>
                        <input 
                          type="text" 
                          value={currentReading}
                          disabled
                          className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-500 cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-rose-600">{t('New Reading', 'نئی ریڈنگ')}</label>
                        <input 
                          type="number" 
                          value={newReading}
                          onChange={(e) => setNewReading(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-sm font-mono font-bold text-rose-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        />
                        <p className="text-xs text-rose-600 mt-1">If rolling over, enter 0</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Reason for Reset', 'ری سیٹ کی وجہ')}</label>
                      <textarea 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Dispenser meter replaced, System error jump, Meter Rollover..."
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 min-h-[80px]"
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button 
                        onClick={handleCalculateImpact}
                        className="px-6 py-3 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-xs hover:bg-slate-800 transition-colors flex items-center gap-2"
                      >
                        <Calculator className="h-4 w-4" />
                        {t('Calculate Impact', 'اثرات کا حساب لگائیں')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-center">
                  <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-rose-900">{t('Impact Analysis', 'اثرات کا تجزیہ')}</h3>
                  <p className="text-sm text-rose-700 mt-1 max-w-md mx-auto">
                    {t('Review the details of this meter adjustment before proceeding.', 'آگے بڑھنے سے پہلے اس میٹر تبدیلی کے اثرات کا جائزہ لیں۔')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Difference</p>
                    <p className="text-2xl font-mono font-bold text-slate-800">
                      {readingDifference > 0 ? '+' : ''}{readingDifference.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Financial Check</p>
                    <p className={`text-2xl font-mono font-bold flex items-center justify-center gap-1 ${readingDifference > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {settings.currency} {Math.abs(financialImpact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Snapshot</p>
                    <p className="text-2xl font-mono font-bold text-blue-600">
                      {selectedProduct?.currentStock.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Record Capture Summary</h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Current stock of <strong>{selectedProduct?.name}</strong> is <strong>{selectedProduct?.currentStock.toFixed(2)} L</strong>. This stock level will be recorded in the reset history.</li>
                    <li>Current rate of <strong>{settings.currency} {selectedProduct?.rate}</strong> will be logged.</li>
                    <li>An immutable audit log will be generated and flagged as a critical security event.</li>
                    <li>The active shift and salesman information will be permanently attached to this reset record.</li>
                  </ul>
                </div>

                <div className="pt-4 flex justify-between">
                  <button 
                    onClick={() => setStep(1)}
                    className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-bold shadow-xs hover:bg-slate-50 transition-colors"
                  >
                    {t('Back', 'پیچھے')}
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-bold shadow-xs hover:bg-rose-700 transition-colors flex items-center gap-2"
                  >
                    {t('Acknowledge & Proceed', 'تسلیم کریں اور آگے بڑھیں')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <div className="text-center">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-inner">
                    <ShieldAlert className="h-8 w-8 text-rose-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{t('Owner Authorization', 'مالک کی اجازت')}</h3>
                  <p className="text-sm text-slate-500 mt-1">This action is irreversible and fully audited.</p>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  {settings.security?.requirePinForMeterReset !== false && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Master Owner PIN', 'ماسٹر اونر پن')}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key className="h-5 w-5 text-slate-400" />
                        </div>
                        <input 
                          type="password" 
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          maxLength={6}
                          placeholder="******"
                          className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-lg text-lg font-mono font-bold text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-center tracking-widest"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Type "RESET METER" to confirm', 'تصدیق کے لیے "RESET METER" ٹائپ کریں')}</label>
                    <input 
                      type="text" 
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder="RESET METER"
                      className="w-full px-3 py-3 bg-white border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-center"
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button 
                      onClick={executeReset}
                      className="w-full px-4 py-3 bg-rose-600 text-white rounded-lg text-sm font-bold shadow-xs hover:bg-rose-700 transition-colors flex justify-center items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {t('EXECUTE RESET', 'ری سیٹ چلائیں')}
                    </button>
                    <button 
                      onClick={() => setStep(2)}
                      className="w-full px-4 py-3 bg-transparent text-slate-500 rounded-lg text-sm font-bold hover:text-slate-700 transition-colors"
                    >
                      {t('Cancel', 'کینسل')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t('Search', 'تلاش کریں')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('Search reason, nozzle, salesman...', 'وجہ، نوزل، سیلزمین تلاش کریں...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t('From Date', 'تاریخ سے')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-40 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t('To Date', 'تاریخ تک')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-40 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Date & Time', 'تاریخ اور وقت')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Nozzle', 'نوزل')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('Old Reading', 'پرانی ریڈنگ')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('New Reading', 'نئی ریڈنگ')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('Stock At Reset', 'ری سیٹ پر اسٹاک')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('Price At Reset', 'ری سیٹ پر قیمت')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Salesman', 'سیلزمین')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Auth By', 'اجازت دہندہ')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider max-w-xs">{t('Reason', 'وجہ')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((reset) => (
                      <tr key={reset.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                          {new Date(reset.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900">
                          {reset.nozzleName}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-slate-600 text-right">
                          {reset.oldReading.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-bold text-rose-600 text-right">
                          {reset.newReading.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 text-right font-mono">
                          {reset.stockAtReset.toFixed(2)} L
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 text-right font-mono">
                          {settings.currency} {reset.priceAtReset}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {reset.salesmanName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {reset.authorizedBy}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate" title={reset.reason}>
                          {reset.reason}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-10 w-10 text-slate-300 mb-3" />
                          <p className="text-sm font-medium">{t('No meter reset history found.', 'کوئی میٹر ری سیٹ کی ہسٹری نہیں ملی۔')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
