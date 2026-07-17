import { useEffect } from 'react';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useStationStore } from '../stores/useStationStore';
import { useStaffStore } from '../stores/useStaffStore';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useSupplierStore } from '../stores/useSupplierStore';
import { useShiftStore } from '../stores/useShiftStore';
import { useFinancialStore } from '../stores/useFinancialStore';
import { buildSearchIndex } from '../services/searchService';

export const useAppStoreProps = () => {
  const activeStationId = useStationStore((state) => state.activeStationId);
  const stations = useStationStore((state) => state.stations);
  const settings = useStationStore((state) => state.settings);
  const staff = useStaffStore((state) => state.staff);
  const products = useInventoryStore((state) => state.products);
  const pumps = useInventoryStore((state) => state.pumps);
  const nozzles = useInventoryStore((state) => state.nozzles);
  const customers = useCustomerStore((state) => state.customers);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const shifts = useShiftStore((state) => state.shifts);
  const banks = useFinancialStore((state) => state.banks);
  const digitalAccounts = useFinancialStore((state) => state.digitalAccounts);
  const stockTxns = useInventoryStore((state) => state.stockTxns);
  const tanks = useInventoryStore((state) => state.tanks);
  const rateHistory = useInventoryStore((state) => state.rateHistory);
  const staffFinance = useStaffStore((state) => state.staffFinance);
  const attendance = useStaffStore((state) => state.attendance);
  const standaloneExpenses = useFinancialStore((state) => state.standaloneExpenses);
  const lubePosSales = useFinancialStore((state) => state.lubePosSales);
  
  const setStations = useStationStore((state) => state.setStations);
  const setSettings = useStationStore((state) => state.setSettings);
  const setStaff = useStaffStore((state) => state.setStaff);
  const setProducts = useInventoryStore((state) => state.setProducts);
  const setPumps = useInventoryStore((state) => state.setPumps);
  const setNozzles = useInventoryStore((state) => state.setNozzles);
  const setCustomers = useCustomerStore((state) => state.setCustomers);
  const _setSuppliers = useSupplierStore((state) => state.setSuppliers);
  const _setShifts = useShiftStore((state) => state.setShifts);
  const setBanks = useFinancialStore((state) => state.setBanks);
  const _setDigitalAccounts = useFinancialStore((state) => state.setDigitalAccounts);
  const _setStockTxns = useInventoryStore((state) => state.setStockTxns);
  const setTanks = useInventoryStore((state) => state.setTanks);
  const _setRateHistory = useInventoryStore((state) => state.setRateHistory);
  const _setStaffFinance = useStaffStore((state) => state.setStaffFinance);
  const _setAttendance = useStaffStore((state) => state.setAttendance);
  const _setStandaloneExpenses = useFinancialStore((state) => state.setStandaloneExpenses);
  const _handleAddStation = useStationStore((state) => state.handleAddStation);
  const _handleEditStation = useStationStore((state) => state.handleEditStation);
  const _handleDeleteStation = useStationStore((state) => state.handleDeleteStation);
  
  const handleSwitchStation = useStationStore((state) => state.handleSwitchStation);
  const handleUpdateSettings = useStationStore((state) => state.handleUpdateSettings);
  const handleAddStaff = useStaffStore((state) => state.handleAddStaff);
  const handleUpdateStaff = useStaffStore((state) => state.handleUpdateStaff);
  const handleAddCustomer = useCustomerStore((state) => state.handleAddCustomer);
  const handleUpdateCustomer = useCustomerStore((state) => state.handleUpdateCustomer);
  const handleDeleteCustomer = useCustomerStore((state) => state.handleDeleteCustomer);
  const handleAddSupplier = useSupplierStore((state) => state.handleAddSupplier);
  const handleUpdateSupplier = useSupplierStore((state) => state.handleUpdateSupplier);
  const handleDeleteSupplier = useSupplierStore((state) => state.handleDeleteSupplier);
  const handleAddShift = useShiftStore((state) => state.handleAddShift);
  const handleUpdateShift = useShiftStore((state) => state.handleUpdateShift);
  const handleAddStockReceipt = useInventoryStore((state) => state.handleAddStockReceipt);
  const handleUpdateProductStock = useInventoryStore((state) => state.handleUpdateProductStock);
  const handleUpdateProductRate = useInventoryStore((state) => state.handleUpdateProductRate);
  const handleUpdateProduct = useInventoryStore((state) => state.handleUpdateProduct);
  const handleDeleteProduct = useInventoryStore((state) => state.handleDeleteProduct);
  const handleAddProduct = useInventoryStore((state) => state.handleAddProduct);
  const handleAddTank = useInventoryStore((state) => state.handleAddTank);
  const handleUpdateTank = useInventoryStore((state) => state.handleUpdateTank);
  const handleDeleteTank = useInventoryStore((state) => state.handleDeleteTank);
  const handleAddNozzle = useInventoryStore((state) => state.handleAddNozzle);
  const handleUpdateNozzle = useInventoryStore((state) => state.handleUpdateNozzle);
  const handleDeleteNozzle = useInventoryStore((state) => state.handleDeleteNozzle);
  const handleAddStaffFinance = useStaffStore((state) => state.handleAddStaffFinance);
  const handleAddShiftSalaryPayment = useStaffStore((state) => state.handleAddShiftSalaryPayment);
  const handleDeleteShiftSalaryPayment = useStaffStore((state) => state.handleDeleteShiftSalaryPayment);
  const handleAddAttendance = useStaffStore((state) => state.handleAddAttendance);
  const handleAddStandaloneExpense = useFinancialStore((state) => state.handleAddStandaloneExpense);
  const handleAddLubePosSale = useFinancialStore((state) => state.handleAddLubePosSale);
  const handleAddBank = useFinancialStore((state) => state.handleAddBank);
  const handleUpdateBanks = useFinancialStore((state) => state.handleUpdateBanks);
  const handleAddDigitalAccount = useFinancialStore((state) => state.handleAddDigitalAccount);
  const handleUpdateDigitalAccounts = useFinancialStore((state) => state.handleUpdateDigitalAccounts);
  const handleDeleteDebitEntry = useShiftStore((state) => state.handleDeleteDebitEntry);
  const handleDeleteRecoveryEntry = useShiftStore((state) => state.handleDeleteRecoveryEntry);
  const handleDeleteSupplierPayment = useShiftStore((state) => state.handleDeleteSupplierPayment);
  
  const toast = useStationStore((state) => state.toast);
  const confirmDialog = useStationStore((state) => state.confirmDialog);
  const showToast = useStationStore((state) => state.showToast);
  const _showConfirm = useStationStore((state) => state.showConfirm);
  const _showAlert = useStationStore((state) => state.showAlert);
  const _closeConfirm = useStationStore((state) => state.closeConfirm);

  // ── Build the global Business Graph search index from live data ──
  // Runs whenever any indexed dataset changes so "Search Everything"
  // always finds the latest invoice, customer, tank, product, etc.
  useEffect(() => {
    const productName = (pid?: string) => products.find(p => p.id === pid)?.name || pid || '';
    const custName = (cid?: string) => customers.find(c => c.id === cid)?.name || '';

    const normCustomers = customers.map(c => ({ ...c, outstandingBalance: c.balance }));
    const normShifts = shifts.map(s => ({
      ...s,
      shiftNumber: s.shiftNumber || s.id,
      salesmanName: staff.find(st => st.id === s.staffId)?.name || s.staffId,
      totalRevenue: s.submittedCash || s.expectedCash || 0
    }));
    const normTanks = tanks.map(t => ({ ...t, productName: productName(t.productId) }));
    const normNozzles = nozzles.map(n => ({ ...n, productName: productName(n.productId) }));

    // Invoices = lube POS sales + shift credit (debit) entries
    const invoices: any[] = [];
    lubePosSales.forEach(s => invoices.push({
      id: s.id, invoiceNo: s.invoiceNo, customerName: s.customerName || custName(s.customerId),
      customerId: s.customerId, paymentMode: s.paymentMode, total: s.total
    }));
    shifts.forEach(s => (s.debitEntries || []).forEach(d => invoices.push({
      id: `deb_${d.id}`, invoiceNo: d.slipNumber || `CR-${d.id.slice(-5)}`, customerName: custName(d.customerId),
      customerId: d.customerId, paymentMode: 'credit', total: d.amount, reference: d.id
    })));

    const normExpenses = standaloneExpenses.map(e => ({
      ...e, category: e.categoryName || e.category, paidTo: e.description, expenseDate: e.date, amount: e.amount
    }));

    buildSearchIndex({
      customers: normCustomers,
      suppliers,
      shifts: normShifts,
      batches: (useInventoryStore.getState().stockBatches as any[]) || [],
      expenses: normExpenses,
      staff,
      tanks: normTanks,
      nozzles: normNozzles,
      products,
      invoices
    });
  }, [customers, suppliers, shifts, staff, products, tanks, nozzles, standaloneExpenses, lubePosSales]);

  return {
    activeStationId, stations, settings, staff, products, pumps, nozzles, customers, suppliers, shifts, banks, digitalAccounts, stockTxns, tanks, rateHistory, staffFinance, attendance, standaloneExpenses, lubePosSales,
    setStations, setSettings, setStaff, setProducts, setPumps, setNozzles, setCustomers, _setSuppliers, _setShifts, setBanks, _setDigitalAccounts, _setStockTxns, setTanks, _setRateHistory, _setStaffFinance, _setAttendance, _setStandaloneExpenses, _handleAddStation, _handleEditStation, _handleDeleteStation,
    handleSwitchStation, handleUpdateSettings, handleAddStaff, handleUpdateStaff, handleAddCustomer, handleUpdateCustomer, handleDeleteCustomer, handleAddSupplier, handleUpdateSupplier, handleDeleteSupplier, handleAddShift, handleUpdateShift, handleAddStockReceipt, handleUpdateProductStock, handleUpdateProductRate, handleUpdateProduct, handleDeleteProduct, handleAddProduct, handleAddTank, handleUpdateTank, handleDeleteTank, handleAddNozzle, handleUpdateNozzle, handleDeleteNozzle, handleAddStaffFinance, handleAddShiftSalaryPayment, handleDeleteShiftSalaryPayment, handleAddAttendance, handleAddStandaloneExpense, handleAddLubePosSale, handleAddBank, handleUpdateBanks, handleAddDigitalAccount, handleUpdateDigitalAccounts, handleDeleteDebitEntry, handleDeleteRecoveryEntry, handleDeleteSupplierPayment,
    toast, confirmDialog, showToast, _showConfirm, _showAlert, _closeConfirm
  };
};
