import { create } from 'zustand';
import { Product, Tank, Nozzle, Pump, StockTransaction, RateHistoryEntry, InventoryMovement, StockBatch, COGSRecord } from '../types';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';

interface InventoryState {
  products: Product[];
  tanks: Tank[];
  nozzles: Nozzle[];
  pumps: Pump[];
  stockTxns: StockTransaction[];
  rateHistory: RateHistoryEntry[];
  inventoryMovements: InventoryMovement[];
  stockBatches: StockBatch[];
  cogsRecords: COGSRecord[];

  setProducts: (products: Product[]) => void;
  setTanks: (tanks: Tank[]) => void;
  setNozzles: (nozzles: Nozzle[]) => void;
  setPumps: (pumps: Pump[]) => void;
  setStockTxns: (txns: StockTransaction[]) => void;
  setRateHistory: (history: RateHistoryEntry[]) => void;
  setInventoryMovements: (movements: InventoryMovement[]) => void;
  setStockBatches: (batches: StockBatch[]) => void;
  setCOGSRecords: (records: COGSRecord[]) => void;

  handleUpdateProductStock: (productId: string, newStock: number, orgId?: string, stationId?: string, checkPerm?: any) => Promise<void>;
  handleUpdateProductRate: (productId: string, newRate: number, reason?: string, changedBy?: string, dateStr?: string, orgId?: string, stationId?: string, checkPerm?: any) => Promise<void>;
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
  if (stationId === 'st_lube') return 'lube';
  return 'fuel_station';
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

  setProducts: (products) => {
    set({ products });
    const sId = db.getActiveStationId();
    if (sId) db.saveProducts(sId, products);
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

  handleUpdateProductRate: async (productId, newRate, reason = 'Market revision Adjustment', changedBy = 'Admin (Owner)', dateStr, orgId, stationId, checkPerm) => {
    if (checkPerm) checkPerm('pricing.manage', 'manage pricing', 'قیمتوں کا انتظام کرنے');
    const sId = stationId || db.getActiveStationId();
    const dStr = dateStr || new Date().toISOString().replace('T', ' ').substring(0, 16);

    const productsCopy = [...get().products];
    const tanksCopy = [...get().tanks];

    const updatedProducts = productsCopy.map((p) => {
      if (p.id === productId) {
        const oldRate = p.rate;
        const change = newRate - oldRate;
        
        const relevantTanks = tanksCopy.filter(t => t.productId === productId);
        const totalStock = relevantTanks.reduce((s, t) => s + t.currentStock, 0) || p.currentStock;
        const impact = change * totalStock;

        const newRateHistory: RateHistoryEntry = {
          id: 'rh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          productId,
          date: dStr,
          oldRate,
          newRate,
          change,
          stockAtTime: totalStock,
          impactAmount: Number(impact.toFixed(2)),
          reason,
          changedBy,
          difference: change,
          stockAtChange: totalStock,
          gainLoss: Number(impact.toFixed(2)),
          changedAt: Date.now()
        };

        set((state) => {
          const updatedRH = [newRateHistory, ...state.rateHistory];
          db.saveRateHistory(sId, updatedRH);
          return { rateHistory: updatedRH };
        });

        if (orgId) {
          const bType = getBusinessType(sId);
          firestoreDb.saveDocument(orgId, sId, bType, 'rateHistory', newRateHistory.id, newRateHistory);
          firestoreDb.saveDocument(orgId, sId, bType, 'products', productId, { ...p, rate: newRate });
        }

        return { ...p, rate: newRate };
      }
      return p;
    });

    set({ products: updatedProducts });
    db.saveProducts(sId, updatedProducts);
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
    set((state) => {
      const updated = state.products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
      db.saveProducts(sId, updated);
      return { products: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'products', updatedProduct.id, updatedProduct);
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
    set((state) => {
      const updated = [...state.products, newProduct];
      db.saveProducts(sId, updated);
      return { products: updated };
    });

    if (orgId) {
      await firestoreDb.saveDocument(orgId, sId, getBusinessType(sId), 'products', newProduct.id, newProduct);
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
    if (batch.carriage > 0) {
       // use dynamic import for useFinancialStore
       import('./useFinancialStore').then(({ useFinancialStore }) => {
         const financialStore = useFinancialStore.getState();
         const categoryName = bType === 'lube' ? 'Carriage & Freight' : 'Carriage & Freight (Karaya)';
         const expenseCat = financialStore.expenseCategories.find(c => c.name === categoryName);
         if (expenseCat) {
           financialStore.handleAddExpense({
              id: `exp_carr_${batch.id}`,
              amount: batch.carriage,
              date: new Date().toISOString().split('T')[0],
              categoryId: expenseCat.id,
              notes: `Carriage for Batch ${batch.batchNumber} (Product: ${batch.productId})`,
              paidBy: 'Cash'
           }, orgId, sId);
         } else {
           // Optionally, if category doesn't exist, create it and log?
           // For now, log to console
           console.warn('Carriage expense category not found. Auto-logging skipped.');
         }
       }).catch(err => {
         console.error('Failed to dynamic import useFinancialStore:', err);
       });
    }
  }
}));
