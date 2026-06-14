import React, { useState } from 'react';
import { Gauge, AlertTriangle, Key, Save, Calculator, Upload, TrendingDown, TrendingUp, ShieldAlert, ArrowRight } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { db } from '../../../data/db';
import { GlobalSettings, Nozzle, Product, AuditTrailEntry, InventoryMovement } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

export default function MeterManagement({ settings, activeStationId }: { settings: GlobalSettings, activeStationId: string }) {
  const { showToast, showAlert } = useStation();
  const { user } = useAuth();
  
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [nozzles, setNozzles] = useState<Nozzle[]>(db.getNozzles(activeStationId));
  const [products] = useState<Product[]>(db.getProducts(activeStationId));
  
  const [selectedNozzleId, setSelectedNozzleId] = useState('');
  const [reason, setReason] = useState('');
  const [newReading, setNewReading] = useState('');
  const [pin, setPin] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Setup, 2: Impact Analysis, 3: Execution
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const selectedNozzle = nozzles.find(n => n.id === selectedNozzleId);
  const selectedProduct = selectedNozzle ? products.find(p => p.id === selectedNozzle.productId) : null;

  const currentReading = selectedNozzle?.currentReading || 0;
  const newReadingNum = parseFloat(newReading) || 0;
  const readingDifference = newReadingNum - currentReading;
  const financialImpact = readingDifference * (selectedProduct?.rate || 0);

  const handleCalculateImpact = () => {
    if (!selectedNozzleId || !newReading || !reason) {
      showToast(t('Please fill all required fields.', 'براہ کرم تمام ضروری خانے پُر کریں۔'), 'error');
      return;
    }
    setStep(2);
  };

  const executeReset = () => {
    if (!selectedNozzle) return;
    
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
      // 1. Update Nozzle
      const updatedNozzle = { ...selectedNozzle, currentReading: newReadingNum };
      const updatedNozzles = nozzles.map(n => n.id === selectedNozzle.id ? updatedNozzle : n);
      db.saveNozzles(activeStationId, updatedNozzles);
      setNozzles(updatedNozzles);

      // 2. Log Audit Trail
      const auditEntry: AuditTrailEntry = {
        id: 'aud_' + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        category: 'SECURITY_CRITICAL',
        action: 'METER_RESET',
        details: `Meter reset for ${selectedNozzle.name}. Reason: ${reason}`,
        oldValue: currentReading.toString(),
        newValue: newReadingNum.toString(),
        user: user?.email || 'Owner',
        role: user?.role || 'Owner',
        branch: activeStationId
      };
      
      const existingAudits = db.getSettingsAuditTrail(activeStationId);
      db.saveSettingsAuditTrail(activeStationId, [auditEntry, ...existingAudits]);

      // 3. Optional: Inventory Adjustment (mock for now, or real if you want to strictly tie it)
      if (readingDifference !== 0 && selectedProduct) {
        const invMovement: InventoryMovement = {
          id: 'inv_' + Date.now(),
          productId: selectedProduct.id,
          type: 'Adjustment',
          quantity: -readingDifference, // If reading goes forward, fuel was lost/dispensed
          date: new Date().toISOString(),
          notes: `Automatic adjustment from Meter Reset. Reason: ${reason}`
        };
        const movements = db.getInventoryMovements(activeStationId);
        db.saveInventoryMovements(activeStationId, [...movements, invMovement]);
        
        // Update current stock
        const updatedProduct = { ...selectedProduct, currentStock: selectedProduct.currentStock - readingDifference };
        db.saveProducts(activeStationId, products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      }

      showToast(t('Meter reset successfully.', 'میٹر کامیابی سے ری سیٹ ہو گیا۔'), 'success');
      
      // Reset form
      setStep(1);
      setSelectedNozzleId('');
      setNewReading('');
      setReason('');
      setPin('');
      setConfirmationText('');
      setEvidenceFile(null);
      
    } catch (err) {
      console.error(err);
      showToast(t('Failed to reset meter.', 'میٹر ری سیٹ کرنے میں ناکامی۔'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Gauge className="h-6 w-6 text-rose-600" />
          {t('Meter Management', 'میٹر مینجمنٹ')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('Strictly controlled zone for dispenser replacements and meter jump corrections.', 'ڈسپینسر کی تبدیلی اور میٹر جمپ کی درستگی کے لیے سختی سے کنٹرول شدہ زون۔')}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Progress Steps */}
        <div className="flex items-center border-b border-slate-100 bg-slate-50 px-6 py-3">
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>1</span>
            Setup
          </div>
          <div className="h-px w-8 bg-slate-300 mx-3"></div>
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 2 ? 'text-rose-600' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-rose-600 text-white' : 'bg-slate-200'}`}>2</span>
            Impact Analysis
          </div>
          <div className="h-px w-8 bg-slate-300 mx-3"></div>
          <div className={`flex items-center gap-2 text-sm font-bold ${step >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-slate-900 text-white' : 'bg-slate-200'}`}>3</span>
            Execution
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
                  <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Current Reading', 'موجودہ ریڈنگ')}</label>
                      <input 
                        type="text" 
                        value={currentReading}
                        disabled
                        className="w-full px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-500 cursor-not-allowed"
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
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Reason for Reset', 'ری سیٹ کی وجہ')}</label>
                    <textarea 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Dispenser meter replaced, System error jump..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Evidence / Photo (Optional)', 'ثبوت / تصویر')}</label>
                    <div className="w-full border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                      />
                      <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-600">
                        {evidenceFile ? evidenceFile.name : t('Upload meter photo', 'میٹر کی تصویر اپ لوڈ کریں')}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={handleCalculateImpact}
                      className="px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-xs hover:bg-slate-800 transition-colors flex items-center gap-2"
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
                  {t('Review the financial and inventory impact of this meter adjustment before proceeding.', 'آگے بڑھنے سے پہلے اس میٹر تبدیلی کے مالیاتی اور انوینٹری کے اثرات کا جائزہ لیں۔')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Difference</p>
                  <p className="text-2xl font-mono font-bold text-slate-800">
                    {readingDifference > 0 ? '+' : ''}{readingDifference.toFixed(2)} L
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sales Impact</p>
                  <p className={`text-2xl font-mono font-bold flex items-center justify-center gap-1 ${readingDifference > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {readingDifference > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    {settings.currency} {Math.abs(financialImpact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Inventory Adjust</p>
                  <p className={`text-2xl font-mono font-bold ${readingDifference > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {readingDifference > 0 ? '-' : '+'}{Math.abs(readingDifference).toFixed(2)} L
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-slate-800 mb-2">Ledger Impact Summary</h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                  <li>Current stock of <strong>{selectedProduct?.name}</strong> will be adjusted by <strong>{readingDifference > 0 ? '-' : '+'}{Math.abs(readingDifference).toFixed(2)} L</strong>.</li>
                  <li>An immutable audit log will be generated and flagged as a critical security event.</li>
                  <li>No cash ledgers will be modified. This is purely an inventory and meter adjustment.</li>
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
    </div>
  );
}
