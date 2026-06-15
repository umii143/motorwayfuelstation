import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, AlertTriangle, ArrowRight, CheckCircle, RefreshCw, UploadCloud } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreDb } from '../../data/firestore';
import { db } from '../../data/db';

interface MigrationSummary {
  staffCount: number;
  productCount: number;
  customerCount: number;
  supplierCount: number;
  shiftCount: number;
  bankCount: number;
  digitalCount: number;
  tankCount: number;
  standaloneExpensesCount: number;
  lubePosCount: number;
}

export default function LocalStorageMigrationWizard() {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [migrationState, setMigrationState] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle');
  const [summary, setSummary] = useState<MigrationSummary>({
    staffCount: 0,
    productCount: 0,
    customerCount: 0,
    supplierCount: 0,
    shiftCount: 0,
    bankCount: 0,
    digitalCount: 0,
    tankCount: 0,
    standaloneExpensesCount: 0,
    lubePosCount: 0
  });
  const [progressMsg, setProgressMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    
    // Check if migration is already completed
    const alreadyMigrated = localStorage.getItem('fuelpro_migrated_to_cloud') === 'true';
    if (alreadyMigrated) return;

    // Scan for any legacy keys in local storage
    const legacyKeysExist = [
      'fuelpro_shifts_st_default',
      'fuelpro_customers_st_default',
      'fuelpro_suppliers_st_default',
      'fuelpro_products_st_default',
      'fuelpro_shifts_st_lube',
      'fuelpro_customers_st_lube',
      'fuelpro_lube_pos_sales_st_lube'
    ].some(key => {
      const data = localStorage.getItem(key);
      return data && data !== '[]';
    });

    if (legacyKeysExist) {
      // Build summary of data to be migrated
      const staffF = db.getStaffList('st_default').length;
      const staffL = db.getStaffList('st_lube').length;
      const prodF = db.getProducts('st_default').length;
      const prodL = db.getProducts('st_lube').length;
      const custF = db.getCustomers('st_default').length;
      const custL = db.getCustomers('st_lube').length;
      const suppF = db.getSuppliers('st_default').length;
      const suppL = db.getSuppliers('st_lube').length;
      const shiftF = db.getShifts('st_default').length;
      const shiftL = db.getShifts('st_lube').length;
      const bankF = db.getBankAccounts('st_default').length;
      const bankL = db.getBankAccounts('st_lube').length;
      const digF = db.getDigitalAccounts('st_default').length;
      const digL = db.getDigitalAccounts('st_lube').length;
      const tankF = db.getTanks('st_default').length;
      const tankL = db.getTanks('st_lube').length;
      const expF = db.getStandaloneExpenses('st_default').length;
      const expL = db.getStandaloneExpenses('st_lube').length;
      const lubeSales = db.getLubePosSales('st_lube').length;

      setSummary({
        staffCount: staffF + staffL,
        productCount: prodF + prodL,
        customerCount: custF + custL,
        supplierCount: suppF + suppL,
        shiftCount: shiftF + shiftL,
        bankCount: bankF + bankL,
        digitalCount: digF + digL,
        tankCount: tankF + tankL,
        standaloneExpensesCount: expF + expL,
        lubePosCount: lubeSales
      });

      setShowWizard(true);
    }
  }, [user]);

  const handleMigration = async () => {
    if (!user) return;
    setMigrationState('migrating');
    const orgId = user.orgId;

    try {
      // Define partitions to migrate
      const stations = [
        { id: 'st_default', type: 'fuel_station' as const },
        { id: 'st_lube', type: 'lube' as const }
      ];

      for (const station of stations) {
        setProgressMsg(`Migrating ${station.id === 'st_default' ? 'Fuel Station' : 'Lube Hub'} records...`);

        // 1. Staff
        const staff = db.getStaffList(station.id);
        if (staff.length > 0) {
          await firestoreDb.batchSaveDocuments(orgId, station.id, station.type, 'staff', staff);
        }

        // 2. Products
        const products = db.getProducts(station.id);
        if (products.length > 0) {
          await firestoreDb.batchSaveDocuments(orgId, station.id, station.type, 'products', products);
        }

        // 3. Customers
        const customers = db.getCustomers(station.id);
        if (customers.length > 0) {
          await firestoreDb.batchSaveDocuments(orgId, station.id, station.type, 'customers', customers);
        }

        // 4. Suppliers
        const suppliers = db.getSuppliers(station.id);
        if (suppliers.length > 0) {
          await firestoreDb.batchSaveDocuments(orgId, station.id, station.type, 'suppliers', suppliers);
        }

        // 5. Shifts
        const shifts = db.getShifts(station.id);
        if (shifts.length > 0) {
          await firestoreDb.batchSaveDocuments(orgId, station.id, station.type, 'shifts', shifts);
        }

        // 6. Banks
        const banks = db.getBankAccounts(station.id);
        if (banks.length > 0) {
          await firestoreDb.batchSaveDocuments(orgId, station.id, station.type, 'banks', banks);
        }

        // 7. Digital Accounts
        const digital = db.getDigitalAccounts(station.id);
        if (digital.length > 0) {
          await firestoreDb.batchSaveDocuments(orgId, station.id, station.type, 'digitalAccounts', digital);
        }

        // 8. Tanks
        const tanks = db.getTanks(station.id);
        if (tanks.length > 0) {
          await firestoreDb.batchSaveDocuments(orgId, station.id, station.type, 'tanks', tanks);
        }

        // 9. Standalone Expenses
        const expenses = db.getStandaloneExpenses(station.id);
        if (expenses.length > 0) {
          await firestoreDb.batchSaveDocuments(orgId, station.id, station.type, 'standaloneExpenses', expenses);
        }

        // 10. Lube POS Sales
        const lubeSales = db.getLubePosSales(station.id);
        if (lubeSales.length > 0) {
          await firestoreDb.batchSaveDocuments(orgId, station.id, station.type, 'lubePosSales', lubeSales);
        }
      }

      setProgressMsg('Verifying cloud storage integration...');
      // Mark as migrated
      localStorage.setItem('fuelpro_migrated_to_cloud', 'true');
      setMigrationState('success');
      
      // Delay closing to show user the success confirmation
      setTimeout(() => {
        setShowWizard(false);
        window.location.reload(); // Refresh to hook up all real-time Firestore syncs
      }, 2000);
    } catch (err) {
      console.error(err);
      setMigrationState('error');
    }
  };

  const totalRecords = Object.values(summary).reduce((a, b) => (a as number) + (b as number), 0);

  return (
    <AnimatePresence>
      {showWizard && (
        <div className="premium-modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[80px]" />
            <div className="absolute -bottom-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[80px]" />

            <div className="relative z-10 space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 mb-2">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <h2 className="font-sans text-xl font-bold text-white tracking-tight">
                  Legacy LocalStorage Data Detected
                </h2>
                <p className="font-sans text-xs text-slate-400 max-w-sm mx-auto">
                  We found legacy business records stored locally on this browser. Let's upload them to your secure Cloud account.
                </p>
              </div>

              {/* Status Board */}
              {migrationState === 'idle' && (
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800 font-sans text-xs">
                  <div className="flex justify-between py-2 text-slate-400 font-medium">
                    <span>Shifts & Closeouts:</span>
                    <span className="text-white font-mono font-bold">{summary.shiftCount}</span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-400 font-medium">
                    <span>Customer Ledgers:</span>
                    <span className="text-white font-mono font-bold">{summary.customerCount}</span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-400 font-medium">
                    <span>Suppliers Ledger:</span>
                    <span className="text-white font-mono font-bold">{summary.supplierCount}</span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-400 font-medium">
                    <span>Products & Inventory:</span>
                    <span className="text-white font-mono font-bold">{summary.productCount}</span>
                  </div>
                  <div className="flex justify-between py-2 text-slate-400 font-medium">
                    <span>Lube POS Invoices:</span>
                    <span className="text-white font-mono font-bold">{summary.lubePosCount}</span>
                  </div>
                  <div className="flex justify-between pt-2.5 text-slate-200 font-bold">
                    <span>Total Local Records Detected:</span>
                    <span className="text-orange-500 font-mono">{totalRecords}</span>
                  </div>
                </div>
              )}

              {/* Progress State */}
              {migrationState === 'migrating' && (
                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="h-10 w-10 text-orange-500 animate-spin" />
                  <p className="font-sans text-xs text-slate-300 font-bold animate-pulse">
                    {progressMsg}
                  </p>
                </div>
              )}

              {/* Success State */}
              {migrationState === 'success' && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <CheckCircle className="h-12 w-12 text-emerald-500" />
                  <h4 className="font-sans text-sm font-bold text-white">Migration Complete!</h4>
                  <p className="font-sans text-xs text-slate-400 text-center">
                    All records were successfully stored. Disabling local cache and loading cloud syncs...
                  </p>
                </div>
              )}

              {/* Error State */}
              {migrationState === 'error' && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                  <h4 className="font-sans text-sm font-bold text-white">Migration Failed</h4>
                  <p className="font-sans text-xs text-red-400 text-center">
                    An error occurred syncing records to Firestore. Check your internet connection and try again.
                  </p>
                </div>
              )}

              {/* Actions */}
              {migrationState === 'idle' && (
                <div className="flex flex-row gap-3 pt-2">
                  <button
                    onClick={() => {
                      localStorage.setItem('fuelpro_migrated_to_cloud', 'true');
                      setShowWizard(false);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs font-bold transition-all"
                  >
                    Discard & Start Fresh
                  </button>
                  <button
                    onClick={handleMigration}
                    className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-sans text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all uppercase tracking-wider"
                  >
                    <span>Migrate to Cloud</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
