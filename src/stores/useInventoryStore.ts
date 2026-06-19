import { create } from 'zustand';
import { Product, Tank, Nozzle, Pump, StockTransaction, RateHistoryEntry, InventoryMovement, StockBatch, CogsRecord, DealerMarginSetting, InventorySnapshot, FIFODeduction, SupplierClaim, SupplierPerformanceScore, MeterResetEvent } from '../types';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';
import { getBusinessTypeForStation, isolateProductRecords, withBusinessScope } from '../lib/businessScope';

interface InventoryState {
  products: Product[];
  tanks: Tank[];
  nozzles: Nozzle[];
  pumps: Pump[];
  stockTxns: StockTransaction[];
  rateHistory: RateHistoryEntry[];
  inventoryMovements: InventoryMovement[];
  stockBatches: StockBatch[];
  cogsRecords: CogsRecord[];
  dealerMarginSettings: DealerMarginSetting[];
  inventorySnapshots: InventorySnapshot[];
  // Enterprise v2
  fifoDeductions: FIFODeduction[];
  supplierClaims: SupplierClaim[];
  supplierPerformance: SupplierPerformanceScore[];
  meterResets: MeterResetEvent[];

  getFuelProducts: () => Product[];
  getLubeProducts: () => Product[];

  setProducts: (products: Product[]) => void;
  setTanks: (tanks: Tank[]) => void;
  setNozzles: (nozzles: Nozzle[]) => void;
  setPumps: (pumps: Pump[]) => void;
  setStockTxns: (txns: StockTransaction[]) => void;
  setRateHistory: (history: RateHistoryEntry[]) => void;
  setInventoryMovements: (movements: InventoryMovement[]) => void;
  setStockBatches: (batches: StockBatch[]) => void;
  setCOGSRecords: (records: CogsRecord[]) => void;
  setDealerMarginSettings: (settings: DealerMarginSetting[]) => void;
  setInventorySnapshots: (snapshots: InventorySnapshot[]) => void;
  // Enterprise v2 setters
  setFIFODeductions: (deductions: FIFODeduction[]) => void;
  setSupplierClaims: (claims: SupplierClaim[]) => void;
  setSupplierPerformance: (scores: SupplierPerformanceScore[]) => void;
  setMeterResets: (resets: MeterResetEvent[]) => void;

  handleAddMeterReset: (reset: MeterResetEvent, orgId?: string, stationId?: string) => Promise<void>;

  handleUpdateDealerMargin: (setting: DealerMarginSetting, orgId?: string, stationId?: string, checkPerm?: any) => Promise<void>;
  handleAddSupplierClaim: (claim: SupplierClaim, orgId?: string, stationId?: string) => Promise<void>;
  handleUpdateSupplierClaim: (claim: SupplierClaim, orgId?: string, stationId?: string) => Promise<void>;

  handleUpdateProductStock: (productId: string, newStock: number, orgId?: string, stationId?: string, checkPerm?: any) => Promise<void>;
  handleUpdateProductRate: (productId: string, newRate: number, reason?: string, changedBy?: string, dateStr?: string, orgId?: string, stationId?: string, checkPerm?: any, attachments?: any[]) => Promise<void>;
  handleDeleteRateHistory: (id: string, orgId?: string, stationId?: string, checkPerm?: any) => Promise<void>;
  handleUpdateProduct: (updatedProduct: Product, orgId?: string, stationId?: string) => Promise<void>;
  handleDeleteProduct: (productId: string, orgId?: string, stationId?: string) => Promise<void>;
  handleAddProduct: (newProduct: Product, orgId?: string, stationId?: string) => Promise<void>;
  handleAddTank: (newTank: Tank, orgId?: string, stationId?: string, checkPerm?: any) => Promise<void>;
  handleUpdateTank: (updatedTank: Tank, orgId?: string, stationId?: string, checkPerm?: any) => Promise<void>;
  handleDeleteTank: (id: string, orgId?: string, stationId?: string, checkPerm?: any) => Promise<void>;
  handleAddNozzle: (newNozzle: Nozzle, orgId?: string, stationId?: string) => Promise<void>;
  handleUpdateNozzle: (updatedNozzle: Nozzle, orgId?: string, stationId?: string) => Promise<void>;
  handleDeleteNozzle: (id: string, orgId?: string, stationId?: string) => Promise<void>;
  handleAddStockReceipt: (txn: StockTransaction, orgId?: string, stationId?: string, checkPerm?: any) => Promise<void>;
  handleAddStockBatch: (batch: StockBatch, orgId?: string, stationId?: string, checkPerm?: any) => Promise<void>;
}

const getBusinessType = (stationId: string): 'fuel_station' | 'cng' | 'lube' => {
  return getBusinessTypeForStation(stationId);
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: db.getProducts(db.getActiveStationId()),
  tanks: db.getTanks(db.getActiveStationId()),
  nozzles: db.getNozzles(db.getActiveStationId()),
  pumps: db.getPumps(db.getActiveStationId()),
  stockTxns: db.getStockTransactions(db.getActiveStationId()),
  rateHistory: db.getRateHistory(db.getActiveStationId()),
  inventoryMovements: db.getInventoryMovements(db.getActiveStationId()),
  stockBatches: db.getStockBatches(db.getActiveStationId()),
  cogsRecords: db.getCOGSRecords(db.getActiveStationId()),
  dealerMarginSettings: db.getDealerMarginSettings(db.getActiveStationId()),
  inventorySnapshots: db.getInventorySnapshots(db.getActiveStationId()),
  // Enterprise v2
  fifoDeductions: db.getFIFODeductions(db.getActiveStationId()),
  supplierClaims: db.getSupplierClaims(db.getActiveStationId()),
  supplierPerformance: db.getSupplierPerformance(db.getActiveStationId()),
  meterResets: db.getMeterResets(db.getActiveStationId()),

  getFuelProducts: () => {
    return get().products.filter(p => p.type === 'fuel');
  },
  getLubeProducts: () => {
    return get().products.filter(p => p.type === 'lube');
  },

  setProducts: (products) => {
    const sId = db.getActiveStationId();
    const scopedProducts = isolateProductRecords(products, sId);
    set({ products: scopedProducts });
    if (sId) db.saveProducts(sId, scopedProducts);
  },
  setTanks: (tanks) => {
    set({ tanks });
    const sId = db.getActiveStationId();
    if (sId) db.saveTanks(sId, tanks);
  },
  setNozzles: (nozzles) => {
    set({ nozzles });
    const sId = db.getActiveStationId();
    if (sId) db.saveNozzles(sId, nozzles);
  },
  setPumps: (pumps) => {
    set({ pumps });
    const sId = db.getActiveStationId();
    if (sId) db.savePumps(sId, pumps);
  },
  setStockTxns: (stockTxns) => {
    set({ stockTxns });
    const sId = db.getActiveStationId();
    if (sId) db.saveStockTransactions(sId, stockTxns);
  },
  setRateHistory: (rateHistory) => {
    set({ rateHistory });
    const sId = db.getActiveStationId();
    if (sId) db.saveRateHistory(sId, rateHistory);
  },
  setInventoryMovements: (inventoryMovements) => {
    set({ inventoryMovements });
    const sId = db.getActiveStationId();
    if (sId) db.saveInventoryMovements(sId, inventoryMovements);
  },
  setStockBatches: (stockBatches) => {
    set({ stockBatches });
    const sId = db.getActiveStationId();
    if (sId) db.saveStockBatches(sId, stockBatches);
  },
  setCOGSRecords: (cogsRecords) => {
    set({ cogsRecords });
    const sId = db.getActiveStationId();
    if (sId) db.saveCOGSRecords(sId, cogsRecords);
  },
  
  setDealerMarginSettings: (dealerMarginSettings) => {
    set({ dealerMarginSettings });
    const sId = db.getActiveStationId();
    if (sId) db.saveDealerMarginSettings(sId, dealerMarginSettings);
  },
  
  setInventorySnapshots: (inventorySnapshots) => {
    set({ inventorySnapshots });
    const sId = db.getActiveStationId();
    if (sId) db.saveInventorySnapshots(sId, inventorySnapshots);
  },

  setFIFODeductions: (fifoDeductions) => {
    set({ fifoDeductions });
    const sId = db.getActiveStationId();
    if (sId) db.saveFIFODeductions(sId, fifoDeductions);
  },

  setSupplierClaims: (supplierClaims) => {
    set({ supplierClaims });
    const sId = db.getActiveStationId();
    if (sId) db.saveSupplierClaims(sId, supplierClaims);
  },

  setSupplierPerformance: (supplierPerformance) => {
    set({ supplierPerformance });
    const sId = db.getActiveStationId();
    if (sId) db.saveSupplierPerformance(sId, supplierPerformance);
  },

  setMeterResets: (meterResets) => {
    set({ meterResets });
    const sId = db.getActiveStationId();
    if (sId) db.saveMeterResets(sId, meterResets);
  },

  handleAddMeterReset: async (reset, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    
    // Hash generation
    const rawString = `${reset.timestamp}-${reset.nozzleId}-${reset.oldReading}-${reset.newReading}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawString));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    reset.eventHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const currentResets = get().meterResets;
    const updatedResets = [reset, ...currentResets];
    get().setMeterResets(updatedResets);

    // Update Nozzle Offset
    const nozzleToUpdate = get().nozzles.find(n => n.id === reset.nozzleId);
    if (nozzleToUpdate) {
      const prevOffset = nozzleToUpdate.meterOffset || 0;
      const addedOffset = reset.oldReading; // typically we add the old reading
      const newOffset = prevOffset + addedOffset;
      
      const newHistoryEntry = {
        timestamp: reset.timestamp,
        previousOffset: prevOffset,
        addedOffset: addedOffset,
        newOffset: newOffset,
        resetEventId: reset.id
      };
      
      const updatedNozzle = {
        ...nozzleToUpdate,
        meterOffset: newOffset,
        offsetHistory: [...(nozzleToUpdate.offsetHistory || []), newHistoryEntry]
      };
      
      const updatedNozzles = get().nozzles.map(n => n.id === updatedNozzle.id ? updatedNozzle : n);
      set({ nozzles: updatedNozzles });
      db.saveNozzles(sId, updatedNozzles);
      if (orgId) {
        await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'nozzles', updatedNozzle.id, updatedNozzle);
      }
    }

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'meter_resets', reset.id, reset);
    }
  },

  handleAddSupplierClaim: async (claim, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set((state) => {
      const updated = [claim, ...state.supplierClaims];
      db.saveSupplierClaims(sId, updated);
      return { supplierClaims: updated };
    });
    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'supplierClaims', claim.id, claim);
    }
  },

  handleUpdateSupplierClaim: async (claim, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set((state) => {
      const updated = state.supplierClaims.map(c => c.id === claim.id ? claim : c);
      db.saveSupplierClaims(sId, updated);
      return { supplierClaims: updated };
    });
    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'supplierClaims', claim.id, claim);
    }
  },

  handleUpdateDealerMargin: async (setting, orgId, stationId, checkPerm) => {
    if (checkPerm) checkPerm('settings.manage', 'manage dealer margins', 'ڈیلر مارجن تبدیل کرنے');
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);
    
    set((state) => {
       const existing = state.dealerMarginSettings.filter(s => s.id !== setting.id);
       const updated = [...existing, setting];
       db.saveDealerMarginSettings(sId, updated);
       return { dealerMarginSettings: updated };
    });
    
    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, bType, 'dealerMarginSettings', setting.id, setting);
    }
  },

  handleUpdateProductStock: async (productId, newStock, orgId, stationId, checkPerm) => {
    if (checkPerm) checkPerm('inventory.manage', 'update product stock', 'پراڈکٹ کا اسٹاک تبدیل کرنے');
    const sId = stationId || db.getActiveStationId();

    set((state) => {
      const updated = state.products.map((p) => (p.id === productId ? { ...p, currentStock: newStock } : p));
      db.saveProducts(sId, updated);
      return { products: updated };
    });

    if (orgId) {
      const product = get().products.find(p => p.id === productId);
      if (product) {
        await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'products', productId, { ...product, currentStock: newStock });
      }
    }
  },

  handleUpdateProductRate: async (productId, newRate, reason = 'Manual Correction', changedBy = 'Admin (Owner)', dateStr, orgId, stationId, checkPerm, attachments = []) => {
    if (checkPerm) checkPerm('pricing.manage', 'manage pricing', 'قیمتوں کا انتظام کرنے');
    const sId = stationId || db.getActiveStationId();
    
    // Import engine and financial store dynamically to avoid circular dependencies
    const { priceChangeEngine } = await import('../services/priceManagement/priceChangeEngine');
    const { useFinancialStore } = await import('./useFinancialStore');
    const financialStore = useFinancialStore.getState();

    const productsCopy = [...get().products];
    const tanksCopy = [...get().tanks];
    const productToUpdate = productsCopy.find(p => p.id === productId);

    if (!productToUpdate) return;

    const result = priceChangeEngine.applyPriceChange(
      productToUpdate,
      tanksCopy,
      newRate,
      changedBy,
      reason,
      orgId,
      sId,
      attachments
    );

    // ─── REVALUATION TRIGGER ────────────────────────────────────────────────
    import('../services/fifoEngine').then(({ revaluateInventory }) => {
      const oldRate = productToUpdate.rate;
      if (oldRate !== newRate) {
        const revalResult = revaluateInventory(sId, productId, oldRate, newRate);
        if (revalResult.batchesRevalued > 0) {
          set(() => ({
            stockBatches: db.getStockBatches(sId)
          }));
        }
      }
    }).catch(err => console.error('Failed to revaluate inventory:', err));

    // ─── PENDING PRICE REVISION TRIGGER ─────────────────────────────────────
    import('./useShiftStore').then(({ useShiftStore }) => {
      const oldRate = productToUpdate.rate;
      if (oldRate !== newRate) {
        useShiftStore.getState().handleAddPendingPriceRevision(
          productId, 
          oldRate, 
          newRate, 
          dateStr || new Date().toISOString(), 
          orgId, 
          sId
        ).catch(err => console.error('Failed to add pending price revision:', err));
      }
    });

    const updatedProducts = productsCopy.map(p => p.id === productId ? result.updatedProduct : p);

    set((state) => {
      const updatedRH = [result.rateHistoryEntry, ...state.rateHistory];
      const updatedSnapshots = [result.snapshot, ...state.inventorySnapshots];
      db.saveRateHistory(sId, updatedRH);
      db.saveInventorySnapshots(sId, updatedSnapshots);
      db.saveProducts(sId, updatedProducts);
      return { 
        rateHistory: updatedRH, 
        inventorySnapshots: updatedSnapshots,
        products: updatedProducts
      };
    });

    if (result.journalEntry) {
      await financialStore.handleAddJournalEntry(result.journalEntry, orgId, sId);
    }

    if (orgId) {
      const bType = getBusinessType(sId);
      firestoreDb.saveDocument(orgId, sId, bType, 'inventorySnapshots', result.snapshot.id, result.snapshot);
      firestoreDb.saveDocument(orgId, sId, bType, 'rateHistory', result.rateHistoryEntry.id, result.rateHistoryEntry);
      firestoreDb.saveDocument(orgId, sId, bType, 'products', productId, result.updatedProduct);
    }
  },

  handleDeleteRateHistory: async (id, orgId, stationId, checkPerm) => {
    if (checkPerm) checkPerm('pricing.manage', 'delete rate history entry', 'ریٹ ہسٹری حذف کرنے');
    const sId = stationId || db.getActiveStationId();

    set((state) => {
      const updated = state.rateHistory.filter((rh) => rh.id !== id);
      db.saveRateHistory(sId, updated);
      return { rateHistory: updated };
    });

    if (orgId) {
      await firestoreDb.deleteDocument(orgId, sId, 'rateHistory', id);
    }
  },

  handleUpdateProduct: async (updatedProduct, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const scopedProduct = withBusinessScope(updatedProduct, sId, orgId);
    set((state) => {
      const updated = isolateProductRecords(
        state.products.map((p) => (p.id === updatedProduct.id ? scopedProduct : p)),
        sId,
        orgId
      );
      db.saveProducts(sId, updated);
      return { products: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'products', scopedProduct.id, scopedProduct);
    }
  },

  handleDeleteProduct: async (productId, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set((state) => {
      const updated = state.products.filter((p) => p.id !== productId);
      db.saveProducts(sId, updated);
      return { products: updated };
    });

    if (orgId) {
      await firestoreDb.deleteDocument(orgId, sId, 'products', productId);
    }
  },

  handleAddProduct: async (newProduct, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    const scopedProduct = withBusinessScope(newProduct, sId, orgId);
    set((state) => {
      const updated = isolateProductRecords([...state.products, scopedProduct], sId, orgId);
      db.saveProducts(sId, updated);
      return { products: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'products', scopedProduct.id, scopedProduct);
    }
  },

  handleAddTank: async (newTank, orgId, stationId, checkPerm) => {
    if (checkPerm) checkPerm('tank.manage', 'add tank', 'ٹینک شامل کرنے');
    const sId = stationId || db.getActiveStationId();

    set((state) => {
      const updated = [...state.tanks, newTank];
      db.saveTanks(sId, updated);
      return { tanks: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'tanks', newTank.id, newTank);
    }
  },

  handleUpdateTank: async (updatedTank, orgId, stationId, checkPerm) => {
    if (checkPerm) checkPerm('tank.manage', 'update tank', 'ٹینک تبدیل کرنے');
    const sId = stationId || db.getActiveStationId();

    set((state) => {
      const updated = state.tanks.map((t) => (t.id === updatedTank.id ? updatedTank : t));
      db.saveTanks(sId, updated);
      return { tanks: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'tanks', updatedTank.id, updatedTank);
    }
  },

  handleDeleteTank: async (id, orgId, stationId, checkPerm) => {
    if (checkPerm) checkPerm('tank.manage', 'delete tank', 'ٹینک حذف کرنے');
    const sId = stationId || db.getActiveStationId();

    set((state) => {
      const updated = state.tanks.filter((t) => t.id !== id);
      db.saveTanks(sId, updated);
      return { tanks: updated };
    });

    if (orgId) {
      await firestoreDb.deleteDocument(orgId, sId, 'tanks', id);
    }
  },

  handleAddNozzle: async (newNozzle, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set((state) => {
      const updated = [...state.nozzles, newNozzle];
      db.saveNozzles(sId, updated);
      return { nozzles: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'nozzles', newNozzle.id, newNozzle);
    }
  },

  handleUpdateNozzle: async (updatedNozzle, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set((state) => {
      const updated = state.nozzles.map((n) => (n.id === updatedNozzle.id ? updatedNozzle : n));
      db.saveNozzles(sId, updated);
      return { nozzles: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'nozzles', updatedNozzle.id, updatedNozzle);
    }
  },

  handleDeleteNozzle: async (id, orgId, stationId) => {
    const sId = stationId || db.getActiveStationId();
    set((state) => {
      const updated = state.nozzles.filter((n) => n.id !== id);
      db.saveNozzles(sId, updated);
      return { nozzles: updated };
    });

    if (orgId) {
      await firestoreDb.deleteDocument(orgId, sId, 'nozzles', id);
    }
  },

  handleAddStockReceipt: async (txn, orgId, stationId, checkPerm) => {
    if (checkPerm) checkPerm('inventory.manage', 'add stock receipt', 'اسٹاک وصول کرنے');
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);

    // Create movement
    const movementId = `mov_refill_${txn.id}`;
    const movement: InventoryMovement = {
      id: movementId,
      productId: txn.itemId,
      type: 'Tank Refill',
      quantity: txn.quantity,
      date: new Date().toISOString(),
      referenceId: txn.id,
      notes: `Stock Receipt Refill. Supplier: ${txn.supplierId || 'Direct'}`,
      tankId: txn.tankId || undefined,
      orgId: orgId || undefined,
      stationId: sId,
      businessType: bType,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    set((state) => {
      const nextTxns = [txn, ...state.stockTxns];
      db.saveStockTransactions(sId, nextTxns);

      const nextProducts = state.products.map((p) => {
        if (p.id === txn.itemId) {
          const newRate = txn.sellingPrice && txn.sellingPrice > 0 ? txn.sellingPrice : p.rate;
          return { ...p, currentStock: p.currentStock + txn.quantity, rate: newRate };
        }
        return p;
      });
      db.saveProducts(sId, nextProducts);

      const nextTanks = txn.tankId
        ? state.tanks.map((t) => (t.id === txn.tankId ? { ...t, currentStock: t.currentStock + txn.quantity } : t))
        : state.tanks;
      if (txn.tankId) {
        db.saveTanks(sId, nextTanks);
      }

      const nextMovements = [movement, ...state.inventoryMovements];
      db.saveInventoryMovements(sId, nextMovements);

      return {
        stockTxns: nextTxns,
        products: nextProducts,
        tanks: nextTanks,
        inventoryMovements: nextMovements
      };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, bType, 'stockTxns', txn.id, txn);
      await firestoreDb.saveDocument(orgId, sId, bType, 'inventoryMovements', movementId, movement);
      
      const product = get().products.find(p => p.id === txn.itemId);
      if (product) {
        await firestoreDb.saveDocument(orgId, sId, bType, 'products', product.id, product);
      }

      if (txn.tankId) {
        const tank = get().tanks.find(t => t.id === txn.tankId);
        if (tank) {
          await firestoreDb.saveDocument(orgId, sId, bType, 'tanks', tank.id, tank);
        }
      }
    }

    // --- FINANCIAL INTEGRATION FOR PURCHASES ---
    if (txn.supplierId && txn.amount !== undefined) {
       const totalBill = txn.amount + (txn.carriageCost || 0);
       const amountPaid = txn.amountPaid || 0;
       
       Promise.all([
         import('./useSupplierStore'),
         import('./useFinancialStore')
       ]).then(([{ useSupplierStore }, { useFinancialStore }]) => {
         const supplierStore = useSupplierStore.getState();
         const financialStore = useFinancialStore.getState();
         
         const supplier = supplierStore.suppliers.find(s => s.id === txn.supplierId);
         if (supplier) {
           // Update Supplier Balance (Total Bill added to Credit Balance)
           const newBalance = (supplier.balance || 0) + totalBill;
           supplierStore.handleUpdateSupplier({
             ...supplier,
             balance: newBalance
           }, orgId, sId);

           // 1. Purchase Journal Entry
           const purchaseJournalId = `jr_pur_${txn.id}`;
           const purchaseJournal: import('../types').JournalEntry = {
              id: purchaseJournalId,
              date: new Date().toISOString(),
              partyId: supplier.id,
              partyType: 'supplier',
              partyName: supplier.name,
              type: 'credit',
              amount: totalBill,
              description: `Stock Purchase (${txn.fuelType || 'Item'}) - Invoice: ${txn.invoiceNo || 'N/A'}`,
              referenceId: txn.id,
              orgId: orgId || undefined,
              stationId: sId,
              businessType: bType,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              isLocked: false
           };
           
           const entriesToSave = [purchaseJournal];

           // 2. Payment Journal Entry & Balance Update (If paid immediately)
           if (amountPaid > 0) {
              const updatedSupplier = useSupplierStore.getState().suppliers.find(s => s.id === txn.supplierId) || supplier;
              const balanceAfterPayment = (updatedSupplier.balance || 0) - amountPaid;
              
              supplierStore.handleUpdateSupplier({
                ...updatedSupplier,
                balance: balanceAfterPayment
              }, orgId, sId);

              const paymentJournalId = `jr_pay_${txn.id}`;
              const paymentJournal: import('../types').JournalEntry = {
                  id: paymentJournalId,
                  date: new Date().toISOString(),
                  partyId: supplier.id,
                  partyType: 'supplier',
                  partyName: supplier.name,
                  type: 'debit',
                  amount: amountPaid,
                  description: `Payment for Purchase ${txn.invoiceNo || 'N/A'} via ${txn.paymentMode}`,
                  referenceId: txn.id,
                  orgId: orgId || undefined,
                  stationId: sId,
                  businessType: bType,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  isLocked: false
              };
              entriesToSave.push(paymentJournal);

              // 3. Cash/Bank Outflow
              if (txn.paymentMode === 'cash') {
                 entriesToSave.push({
                    id: `jr_cashout_${txn.id}`,
                    date: new Date().toISOString(),
                    partyType: 'expense',
                    type: 'credit',
                    amount: amountPaid,
                    description: `Cash outflow for Supplier Payment ${supplier.name}`,
                    referenceId: txn.id,
                    orgId: orgId || undefined,
                    stationId: sId,
                    businessType: bType,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    isLocked: false
                 });
              } else if (txn.paymentMode === 'bank' && txn.bankAccountId) {
                 entriesToSave.push({
                    id: `jr_bankout_${txn.id}`,
                    date: new Date().toISOString(),
                    partyId: txn.bankAccountId,
                    partyType: 'bank',
                    type: 'credit',
                    amount: amountPaid,
                    description: `Bank outflow for Supplier Payment ${supplier.name}`,
                    referenceId: txn.id,
                    orgId: orgId || undefined,
                    stationId: sId,
                    businessType: bType,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    isLocked: false
                 });
                 // Deduct from bank
                 const bank = financialStore.banks.find(b => b.id === txn.bankAccountId);
                 if (bank) {
                    financialStore.handleUpdateBanks(
                       financialStore.banks.map(b => b.id === bank.id ? { ...b, balance: (b.balance || 0) - amountPaid } : b),
                       orgId, sId
                    );
                 }
              }
           }
           
           // Save journal entries
           financialStore.setJournalEntries([...entriesToSave, ...financialStore.journalEntries]);
           entriesToSave.forEach(entry => {
             if (orgId) {
               firestoreDb.saveDocument(orgId, sId, bType, 'journalEntries', entry.id, entry);
             }
           });
         }
       }).catch(err => {
         console.error("Error integrating purchase financials:", err);
       });
    }
  },

  handleAddStockBatch: async (batch, orgId, stationId, checkPerm) => {
    if (checkPerm) checkPerm('inventory.manage', 'add stock batch', 'اسٹاک بیچ بنانے');
    const sId = stationId || db.getActiveStationId();
    const bType = getBusinessType(sId);

    set((state) => {
      const nextBatches = [batch, ...state.stockBatches];
      db.saveStockBatches(sId, nextBatches);
      return { stockBatches: nextBatches };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, bType, 'stockBatches', batch.id, batch);
    }

    // Process Carriage as an Expense dynamically to avoid circular dependencies
    if (batch.carriageTotal > 0) {
       // use dynamic import for useFinancialStore
       import('./useFinancialStore').then(({ useFinancialStore }) => {
         const financialStore = useFinancialStore.getState();
         financialStore.handleAddStandaloneExpense({
            id: `exp_carr_${batch.id}`,
            amount: batch.carriageTotal,
            date: new Date().toISOString().split('T')[0],
            category: bType === 'lube' ? 'Carriage & Freight' : 'Carriage & Freight (Karaya)',
            description: `Carriage for Batch ${batch.batchNumber} (Product: ${batch.productId})`,
            paidFrom: 'cash'
         }, orgId, sId);
       }).catch(err => {
         console.error('Failed to dynamic import useFinancialStore:', err);
       });
    }

    // ─── SUPPLIER LEDGER SYNC ──────────────────────────────────────────────
    if (batch.supplierId) {
      import('./useSupplierStore').then(({ useSupplierStore }) => {
        const supplierStore = useSupplierStore.getState();
        const supplier = supplierStore.suppliers.find(s => s.id === batch.supplierId);
        
        if (supplier) {
          let updatedBalance = supplier.balance || 0;
          
          if (batch.paymentMethod === 'credit') {
            updatedBalance += batch.totalLandedCost;
          } else if (batch.paymentMethod === 'partial') {
            updatedBalance += (batch.outstandingBalance || 0);
          }
          // cash or bank don't increase the outstanding payable balance
          
          if (updatedBalance !== supplier.balance) {
            supplierStore.handleUpdateSupplier({
              ...supplier,
              balance: updatedBalance,
              updatedAt: Date.now()
            }, orgId, sId);
          }
        }
      }).catch(err => {
        console.error('Failed to sync supplier ledger:', err);
      });
    }
  }
}));
