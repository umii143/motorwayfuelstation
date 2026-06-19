import React, { useState, useRef } from 'react';
import { DownloadCloud, UploadCloud, ShieldAlert, FileJson, Clock, Calendar, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { db } from '../../../data/db';
import { GlobalSettings } from '../../../types';

export default function BackupRecovery({ settings, activeStationId }: { settings: GlobalSettings, activeStationId: string }) {
  const { showToast, showAlert } = useStation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const generateBackup = async (type: 'quick' | 'daily' | 'full') => {
    setIsExporting(true);
    try {
      const backupData: any = {
        version: "3.0",
        createdAt: new Date().toISOString(),
        stationId: activeStationId,
        type: type,
        data: {}
      };

      // Helper to fetch data safely
      const fetchData = () => {
        const data: any = {};
        
        if (type === 'quick' || type === 'full') {
          data.settings = db.getSettings(activeStationId);
          data.staff = db.getStaffList(activeStationId);
          data.banks = db.getBankAccounts(activeStationId);
          data.digitalAccounts = db.getDigitalAccounts(activeStationId);
          data.cashAccounts = db.getCashAccounts(activeStationId);
          data.dealerMargins = db.getDealerMarginSettings(activeStationId);
        }
        
        if (type === 'daily' || type === 'full') {
          data.shifts = db.getShifts(activeStationId);
          data.customers = db.getCustomers(activeStationId);
          data.suppliers = db.getSuppliers(activeStationId);
          data.products = db.getProducts(activeStationId);
          data.tanks = db.getTanks(activeStationId);
          data.nozzles = db.getNozzles(activeStationId);
          data.pumps = db.getPumps(activeStationId);
          data.rateHistory = db.getRateHistory(activeStationId);
        }
        
        if (type === 'full') {
          data.stockTransactions = db.getStockTransactions(activeStationId);
          data.standaloneExpenses = db.getStandaloneExpenses(activeStationId);
          data.auditTrail = db.getSettingsAuditTrail(activeStationId);
          data.lubeSales = db.getLubePosSales(activeStationId);
          data.fleetAccounts = db.getFleetAccounts(activeStationId);
          data.fleetTransactions = db.getFleetTransactions(activeStationId);
          data.journalEntries = db.getJournalEntries(activeStationId);
          data.inventoryMovements = db.getInventoryMovements(activeStationId);
          data.stockBatches = db.getStockBatches(activeStationId);
          data.salaryTransactions = db.getSalaryTransactions(activeStationId);
          data.staffLoans = db.getStaffLoans(activeStationId);
          data.salaryAdvances = db.getSalaryAdvances(activeStationId);
          data.cashReconciliations = db.getCashReconciliations(activeStationId);
        }

        return data;
      };

      backupData.data = fetchData();

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FuelPro_Backup_${type.toUpperCase()}_${new Date().toISOString().split('T')[0]}.fuelpro`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(t(`Backup (${type}) created successfully!`, `بیک اپ (${type}) کامیابی سے بن گیا!`), 'success');
    } catch (err) {
      console.error('Backup failed:', err);
      showToast(t('Failed to generate backup.', 'بیک اپ بنانے میں ناکامی۔'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.fuelpro')) {
        showToast(t('Invalid file format. Please select a .fuelpro file.', 'غلط فائل فارمیٹ۔ براہ کرم .fuelpro فائل منتخب کریں۔'), 'error');
        return;
      }
      setRestoreFile(file);
    }
  };

  const handleRestore = () => {
    if (!restoreFile) return;

    showAlert(
      t('Restore Database?', 'ڈیٹا بیس بحال کریں؟'),
      t('This will OVERWRITE your current data with the backup file. This action cannot be undone. Are you sure?', 'یہ آپ کے موجودہ ڈیٹا کو بیک اپ فائل سے بدل دے گا۔ کیا آپ واقعی ایسا کرنا چاہتے ہیں؟'),
      () => {
        setIsRestoring(true);
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const backupData = JSON.parse(content);

            if (backupData.version !== "3.0") {
              showToast(t('Unsupported backup version.', 'غیر تائید شدہ بیک اپ ورژن۔'), 'error');
              setIsRestoring(false);
              return;
            }

            if (backupData.stationId !== activeStationId) {
              showToast(t('This backup belongs to a different station.', 'یہ بیک اپ کسی اور اسٹیشن کا ہے۔'), 'error');
              setIsRestoring(false);
              return;
            }

            const data = backupData.data;

            // Restore data based on what's available
            if (data.settings) db.saveSettings(activeStationId, data.settings);
            if (data.staff) db.saveStaffList(activeStationId, data.staff);
            if (data.banks) db.saveBankAccounts(activeStationId, data.banks);
            if (data.digitalAccounts) db.saveDigitalAccounts(activeStationId, data.digitalAccounts);
            if (data.cashAccounts) db.saveCashAccounts(activeStationId, data.cashAccounts);
            if (data.dealerMargins) db.saveDealerMarginSettings(activeStationId, data.dealerMargins);
            
            if (data.shifts) db.saveShifts(activeStationId, data.shifts);
            if (data.customers) db.saveCustomers(activeStationId, data.customers);
            if (data.suppliers) db.saveSuppliers(activeStationId, data.suppliers);
            if (data.products) db.saveProducts(activeStationId, data.products);
            if (data.tanks) db.saveTanks(activeStationId, data.tanks);
            if (data.nozzles) db.saveNozzles(activeStationId, data.nozzles);
            if (data.pumps) db.savePumps(activeStationId, data.pumps);
            if (data.rateHistory) db.saveRateHistory(activeStationId, data.rateHistory);

            if (data.stockTransactions) db.saveStockTransactions(activeStationId, data.stockTransactions);
            if (data.standaloneExpenses) db.saveStandaloneExpenses(activeStationId, data.standaloneExpenses);
            if (data.auditTrail) db.saveSettingsAuditTrail(activeStationId, data.auditTrail);
            if (data.lubeSales) db.saveLubePosSales(activeStationId, data.lubeSales);
            if (data.fleetAccounts) db.saveFleetAccounts(activeStationId, data.fleetAccounts);
            if (data.fleetTransactions) db.saveFleetTransactions(activeStationId, data.fleetTransactions);
            if (data.journalEntries) db.saveJournalEntries(activeStationId, data.journalEntries);
            if (data.inventoryMovements) db.saveInventoryMovements(activeStationId, data.inventoryMovements);
            if (data.stockBatches) db.saveStockBatches(activeStationId, data.stockBatches);
            if (data.salaryTransactions) db.saveSalaryTransactions(activeStationId, data.salaryTransactions);
            if (data.staffLoans) db.saveStaffLoans(activeStationId, data.staffLoans);
            if (data.salaryAdvances) db.saveSalaryAdvances(activeStationId, data.salaryAdvances);
            if (data.cashReconciliations) db.saveCashReconciliations(activeStationId, data.cashReconciliations);

            showToast(t('Database restored successfully! Reloading...', 'ڈیٹا بیس کامیابی سے بحال ہو گیا! ری لوڈ ہو رہا ہے...'), 'success');
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (err) {
            console.error('Restore failed:', err);
            showToast(t('Failed to parse backup file.', 'بیک اپ فائل پڑھنے میں ناکامی۔'), 'error');
            setIsRestoring(false);
          }
        };
        reader.readAsText(restoreFile);
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">{t('Backup & Recovery', 'بیک اپ اور ریکوری')}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('Export your data securely to a .fuelpro file, or restore from a previous backup.', 'اپنا ڈیٹا محفوظ طریقے سے .fuelpro فائل میں ایکسپورٹ کریں، یا پچھلے بیک اپ سے بحال کریں۔')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* EXPORT SECTION */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <DownloadCloud className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{t('Export Backup', 'بیک اپ ایکسپورٹ کریں')}</h3>
          </div>
          
          <div className="p-6 flex-1 flex flex-col space-y-4">
            <p className="text-sm text-slate-600 mb-2">
              {t('Select the type of backup you want to generate. It will download as a .fuelpro file.', 'بیک اپ کی قسم منتخب کریں جو آپ بنانا چاہتے ہیں۔ یہ .fuelpro فائل کے طور پر ڈاؤن لوڈ ہوگا۔')}
            </p>

            <button 
              onClick={() => generateBackup('quick')}
              disabled={isExporting}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left disabled:opacity-50"
            >
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{t('Quick Backup', 'فوری بیک اپ')}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Settings, Users, Treasury</p>
              </div>
            </button>

            <button 
              onClick={() => generateBackup('daily')}
              disabled={isExporting}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left disabled:opacity-50"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{t('Daily Backup', 'یومیہ بیک اپ')}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Shifts, Customers, Suppliers, Inventory</p>
              </div>
            </button>

            <button 
              onClick={() => generateBackup('full')}
              disabled={isExporting}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left disabled:opacity-50 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-1.5 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg border-b border-l border-orange-200">
                Recommended
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{t('Full Backup', 'مکمل بیک اپ')}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Everything included.</p>
              </div>
            </button>
          </div>
        </div>

        {/* IMPORT SECTION */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
              <UploadCloud className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800">{t('Restore Backup', 'بیک اپ بحال کریں')}</h3>
          </div>
          
          <div className="p-6 flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 m-6 rounded-xl bg-slate-50 relative">
            <input 
              type="file" 
              accept=".fuelpro"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {restoreFile ? (
              <div className="text-center w-full px-4">
                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 truncate px-4">{restoreFile.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{(restoreFile.size / 1024).toFixed(1)} KB</p>
                
                <div className="mt-6 flex flex-col gap-2 w-full max-w-xs mx-auto">
                  <button 
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="w-full px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] bg-slate-900 text-white rounded-lg text-sm font-bold shadow-xs hover:bg-slate-800 transition-colors disabled:opacity-70"
                  >
                    {isRestoring ? t('Restoring...', 'بحال ہو رہا ہے...') : t('Restore Database', 'ڈیٹا بیس بحال کریں')}
                  </button>
                  <button 
                    onClick={() => setRestoreFile(null)}
                    disabled={isRestoring}
                    className="w-full px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-bold shadow-xs hover:bg-slate-50 transition-colors disabled:opacity-70"
                  >
                    {t('Cancel', 'کینسل')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <FileJson className="h-8 w-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">{t('Select .fuelpro File', '.fuelpro فائل منتخب کریں')}</h4>
                <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                  {t('Upload a previously generated backup file to restore your system data.', 'سسٹم کا ڈیٹا بحال کرنے کے لیے پہلے سے بنائی گئی بیک اپ فائل اپ لوڈ کریں۔')}
                </p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold shadow-xs hover:bg-slate-50 transition-all hover:border-slate-400"
                >
                  {t('Browse Files', 'فائلیں براؤز کریں')}
                </button>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <strong className="block mb-1">{t('Warning: Data Replacement', 'انتباہ: ڈیٹا کی تبدیلی')}</strong>
              {t('Restoring a backup will overwrite your current data. Any changes made after the backup was created will be permanently lost.', 'بیک اپ بحال کرنے سے آپ کا موجودہ ڈیٹا تبدیل ہو جائے گا۔ بیک اپ بننے کے بعد کی گئی کوئی بھی تبدیلی ہمیشہ کے لیے ضائع ہو جائے گی۔')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
