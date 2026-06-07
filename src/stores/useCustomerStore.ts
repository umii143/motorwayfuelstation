import { create } from 'zustand';
import { Customer } from '../types';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';

interface CustomerState {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  handleAddCustomer: (newCustomer: Customer, orgId?: string, stationId?: string, language?: string, showToast?: (m: string, t?: 'success' | 'error' | 'info') => void) => Promise<void>;
  handleUpdateCustomer: (updatedCustomer: Customer, orgId?: string, stationId?: string, language?: string, showToast?: (m: string, t?: 'success' | 'error' | 'info') => void) => Promise<void>;
  handleDeleteCustomer: (customerId: string, orgId?: string, stationId?: string, language?: string, showToast?: (m: string, t?: 'success' | 'error' | 'info') => void) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: db.getCustomers(db.getActiveStationId()),

  setCustomers: (customers) => {
    set({ customers });
    const stationId = db.getActiveStationId();
    if (stationId) {
      db.saveCustomers(stationId, customers);
    }
  },

  handleAddCustomer: async (newCustomer, orgId, stationId, language, showToast) => {
    const sId = stationId || db.getActiveStationId();
    const activeBType = sId === 'st_lube' ? 'lube' : 'fuel_station';
    const customerWithBType: Customer = { ...newCustomer, businessType: activeBType as 'fuel_station' | 'cng' | 'lube' };
    
    set((state) => {
      const updated = [...state.customers, customerWithBType];
      db.saveCustomers(sId, updated);
      return { customers: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, activeBType, 'customers', newCustomer.id, customerWithBType);
    }

    if (showToast) {
      const msg = language === 'ur'
        ? 'گاہک کا کھاتہ کامیابی سے شامل ہو گیا۔'
        : 'Customer profile successfully created.';
      showToast(msg, 'success');
    }
  },

  handleUpdateCustomer: async (updatedCustomer, orgId, stationId, language, showToast) => {
    const sId = stationId || db.getActiveStationId();
    const activeBType = sId === 'st_lube' ? 'lube' : 'fuel_station';
    const customerWithBType: Customer = { ...updatedCustomer, businessType: activeBType as 'fuel_station' | 'cng' | 'lube' };

    set((state) => {
      const updated = state.customers.map((c) => (c.id === updatedCustomer.id ? customerWithBType : c));
      db.saveCustomers(sId, updated);
      return { customers: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, activeBType, 'customers', updatedCustomer.id, customerWithBType);
    }

    if (showToast) {
      const msg = language === 'ur'
        ? 'گاہک کی تفصیلات کامیابی سے اپ ڈیٹ ہو گئیں۔'
        : 'Customer profile successfully updated.';
      showToast(msg, 'success');
    }
  },

  handleDeleteCustomer: async (customerId, orgId, stationId, language, showToast) => {
    const sId = stationId || db.getActiveStationId();
    
    set((state) => {
      const updated = state.customers.filter((c) => c.id !== customerId);
      db.saveCustomers(sId, updated);
      return { customers: updated };
    });

    if (orgId) {
      await firestoreDb.deleteDocument(orgId, sId, 'customers', customerId);
    }

    if (showToast) {
      const msg = language === 'ur'
        ? 'گاہک کا کھاتہ کامیابی سے حذف ہو گیا۔'
        : 'Customer profile successfully deleted.';
      showToast(msg, 'success');
    }
  }
}));
