import { create } from 'zustand';
import { Supplier } from '../types';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';

interface SupplierState {
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  handleAddSupplier: (newSupplier: Supplier, orgId?: string, stationId?: string, language?: string, showToast?: (m: string, t?: 'success' | 'error' | 'info') => void) => Promise<void>;
  handleUpdateSupplier: (updatedSupplier: Supplier, orgId?: string, stationId?: string, language?: string, showToast?: (m: string, t?: 'success' | 'error' | 'info') => void) => Promise<void>;
  handleDeleteSupplier: (supplierId: string, orgId?: string, stationId?: string, language?: string, showToast?: (m: string, t?: 'success' | 'error' | 'info') => void) => Promise<void>;
}

export const useSupplierStore = create<SupplierState>((set) => ({
  suppliers: db.getSuppliers(db.getActiveStationId()),

  setSuppliers: (suppliers) => {
    set({ suppliers });
    const stationId = db.getActiveStationId();
    if (stationId) {
      db.saveSuppliers(stationId, suppliers);
    }
  },

  handleAddSupplier: async (newSupplier, orgId, stationId, language, showToast) => {
    const sId = stationId || db.getActiveStationId();
    const activeBType = sId === 'st_lube' ? 'lube' : 'fuel_station';
    const supplierWithBType: Supplier = { ...newSupplier, businessType: activeBType as 'fuel_station' | 'cng' | 'lube' };

    set((state) => {
      const updated = [...state.suppliers, supplierWithBType];
      db.saveSuppliers(sId, updated);
      return { suppliers: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, activeBType, 'suppliers', newSupplier.id, supplierWithBType);
    }

    if (showToast) {
      const msg = language === 'ur'
        ? 'سپلائر کامیابی سے شامل ہو گیا۔'
        : 'Supplier profile successfully created.';
      showToast(msg, 'success');
    }
  },

  handleUpdateSupplier: async (updatedSupplier, orgId, stationId, language, showToast) => {
    const sId = stationId || db.getActiveStationId();
    const activeBType = sId === 'st_lube' ? 'lube' : 'fuel_station';
    const supplierWithBType: Supplier = { ...updatedSupplier, businessType: activeBType as 'fuel_station' | 'cng' | 'lube' };

    set((state) => {
      const updated = state.suppliers.map((s) => (s.id === updatedSupplier.id ? supplierWithBType : s));
      db.saveSuppliers(sId, updated);
      return { suppliers: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, activeBType, 'suppliers', updatedSupplier.id, supplierWithBType);
    }

    if (showToast) {
      const msg = language === 'ur'
        ? 'سپلائر کی تفصیلات کامیابی سے اپ ڈیٹ ہو گئیں۔'
        : 'Supplier profile successfully updated.';
      showToast(msg, 'success');
    }
  },

  handleDeleteSupplier: async (supplierId, orgId, stationId, language, showToast) => {
    const sId = stationId || db.getActiveStationId();

    set((state) => {
      const updated = state.suppliers.filter((s) => s.id !== supplierId);
      db.saveSuppliers(sId, updated);
      return { suppliers: updated };
    });

    if (orgId) {
      await firestoreDb.deleteDocument(orgId, sId, 'suppliers', supplierId);
    }

    if (showToast) {
      const msg = language === 'ur'
        ? 'سپلائر کامیابی سے حذف ہو گیا۔'
        : 'Supplier profile successfully deleted.';
      showToast(msg, 'success');
    }
  }
}));
