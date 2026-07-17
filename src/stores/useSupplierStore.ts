import { create } from 'zustand';
import { Supplier } from '../types';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';
import { getBusinessTypeForStation, isolateTenantRecords, withBusinessScope } from '../lib/businessScope';
import { AuditLogger } from '../services/auditLogger';

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
    const stationId = db.getActiveStationId();
    const scopedSuppliers = isolateTenantRecords(suppliers, stationId);
    set({ suppliers: scopedSuppliers });
    if (stationId) {
      db.saveSuppliers(stationId, scopedSuppliers);
    }
  },

  handleAddSupplier: async (newSupplier, orgId, stationId, language, showToast) => {
    const sId = stationId || db.getActiveStationId();
    const activeBType = getBusinessTypeForStation(sId);
    const supplierWithBType: Supplier = withBusinessScope(newSupplier, sId, orgId);

    set((state) => {
      const updated = [...state.suppliers, supplierWithBType];
      db.saveSuppliers(sId, updated);
      return { suppliers: updated };
    });

    AuditLogger.logAction(
      'CREATE_SUPPLIER',
      'suppliers',
      `Created supplier profile for "${newSupplier.name}" with initial balance Rs. ${newSupplier.balance}`,
      undefined,
      supplierWithBType,
      orgId,
      sId
    );

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
    const activeBType = getBusinessTypeForStation(sId);
    const supplierWithBType: Supplier = withBusinessScope(updatedSupplier, sId, orgId);

    let oldSupplier: Supplier | undefined;
    set((state) => {
      oldSupplier = state.suppliers.find((s) => s.id === updatedSupplier.id);
      const updated = state.suppliers.map((s) => (s.id === updatedSupplier.id ? supplierWithBType : s));
      db.saveSuppliers(sId, updated);
      return { suppliers: updated };
    });

    if (oldSupplier) {
      AuditLogger.logAction(
        'UPDATE_SUPPLIER',
        'suppliers',
        `Updated supplier profile details for "${updatedSupplier.name}"`,
        oldSupplier,
        supplierWithBType,
        orgId,
        sId
      );
    }

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

    let oldSupplier: Supplier | undefined;
    set((state) => {
      oldSupplier = state.suppliers.find((s) => s.id === supplierId);
      const updated = state.suppliers.filter((s) => s.id !== supplierId);
      db.saveSuppliers(sId, updated);
      return { suppliers: updated };
    });

    if (oldSupplier) {
      AuditLogger.logAction(
        'DELETE_SUPPLIER',
        'suppliers',
        `Deleted supplier profile for "${oldSupplier.name}"`,
        oldSupplier,
        undefined,
        orgId,
        sId
      );
    }

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
