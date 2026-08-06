import { firestoreDb } from '../../data/firestore';
import { db } from '../../data/db';
import { Product, TenantDocument } from '../../types';

export interface FuelPriceMasterRecord extends TenantDocument {
  id: string;
  productId: string;
  productName: string;
  currentPrice: number;
  oldPrice: number;
  newPrice: number;
  effectiveDate: string;
  effectiveTime: string;
  approvedBy?: string;
  publishedBy?: string;
  status: 'draft' | 'waiting' | 'approved' | 'published' | 'rolled_back';
  version: number;
  dealerMargin: number;
  reason?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface PricingAuditEventRecord extends TenantDocument {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole?: string;
  actionType: 'DRAFT_CREATED' | 'PRICE_APPROVED' | 'PRICE_PUBLISHED' | 'VERSION_ROLLED_BACK' | 'SCHEDULED_CREATED';
  productName: string;
  oldPrice: number;
  newPrice: number;
  details: string;
  deviceInfo?: string;
}

export const pricingEngine = {
  // Subscribe to fuel prices (fuelpro_fuel_prices)
  subscribeFuelPrices: (orgId: string, stationId: string, callback: (data: FuelPriceMasterRecord[]) => void) => {
    return firestoreDb.subscribeToCollection<FuelPriceMasterRecord>(orgId, stationId, 'fuelpro_fuel_prices', (data) => {
      callback(data);
    });
  },

  // Subscribe to audit logs (fuelpro_price_audit)
  subscribeAuditLogs: (orgId: string, stationId: string, callback: (data: PricingAuditEventRecord[]) => void) => {
    return firestoreDb.subscribeToCollection<PricingAuditEventRecord>(orgId, stationId, 'fuelpro_price_audit', (data) => {
      const sorted = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(sorted);
    });
  },

  // Log Pricing Audit Event
  logAuditEvent: async (
    orgId: string,
    stationId: string,
    event: {
      userId: string;
      userName: string;
      userRole?: string;
      actionType: PricingAuditEventRecord['actionType'];
      productName: string;
      oldPrice: number;
      newPrice: number;
      details: string;
    }
  ) => {
    const docId = `aud_prc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload: PricingAuditEventRecord = {
      id: docId,
      timestamp: new Date().toISOString(),
      userId: event.userId,
      userName: event.userName,
      userRole: event.userRole || 'Manager',
      actionType: event.actionType,
      productName: event.productName,
      oldPrice: event.oldPrice,
      newPrice: event.newPrice,
      details: event.details,
      deviceInfo: 'FuelPro Desktop Client'
    };

    await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'fuelpro_price_audit', docId, payload);
  },

  // Create Price Proposal Draft
  createPriceDraft: async (
    orgId: string,
    stationId: string,
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number,
    effectiveDate: string,
    effectiveTime: string,
    reason: string,
    creatorName: string
  ) => {
    const docId = `prc_${Date.now()}_${productId}`;
    const payload: FuelPriceMasterRecord = {
      id: docId,
      productId,
      productName,
      currentPrice: oldPrice,
      oldPrice,
      newPrice,
      effectiveDate,
      effectiveTime,
      status: 'waiting',
      version: 44,
      dealerMargin: 8.64,
      reason,
      createdAt: new Date().toISOString()
    };

    await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'fuelpro_fuel_prices', docId, payload);

    await pricingEngine.logAuditEvent(orgId, stationId, {
      userId: 'usr_manager',
      userName: creatorName,
      userRole: 'Manager',
      actionType: 'DRAFT_CREATED',
      productName,
      oldPrice,
      newPrice,
      details: `Created price update proposal for ${productName} from Rs. ${oldPrice} to Rs. ${newPrice} (Effective ${effectiveDate} ${effectiveTime})`
    });
  },

  // Approve Price Revision
  approvePriceRevision: async (
    orgId: string,
    stationId: string,
    priceId: string,
    approverName: string
  ) => {
    const prices = await firestoreDb.fetchCollection<FuelPriceMasterRecord>(orgId, stationId, 'fuelpro_fuel_prices');
    const existing = prices.find(p => p.id === priceId);
    if (!existing) return;

    const updated: FuelPriceMasterRecord = {
      ...existing,
      status: 'approved',
      approvedBy: approverName,
      updatedAt: new Date().toISOString()
    };

    await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'fuelpro_fuel_prices', priceId, updated);

    await pricingEngine.logAuditEvent(orgId, stationId, {
      userId: 'usr_owner',
      userName: approverName,
      userRole: 'Owner',
      actionType: 'PRICE_APPROVED',
      productName: existing.productName,
      oldPrice: existing.oldPrice,
      newPrice: existing.newPrice,
      details: `Approved price revision for ${existing.productName} (New Rate: Rs. ${existing.newPrice})`
    });
  },

  // Publish Price Revision (Live Sync to Products, Pumps & POS)
  publishPriceRevision: async (
    orgId: string,
    stationId: string,
    priceId: string,
    publisherName: string
  ) => {
    const prices = await firestoreDb.fetchCollection<FuelPriceMasterRecord>(orgId, stationId, 'fuelpro_fuel_prices');
    const existing = prices.find(p => p.id === priceId);
    if (!existing) return;

    const updated: FuelPriceMasterRecord = {
      ...existing,
      status: 'published',
      publishedBy: publisherName,
      updatedAt: new Date().toISOString()
    };

    await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'fuelpro_fuel_prices', priceId, updated);

    // Update Product Rate in db & Firestore
    const products = db.getProducts(stationId);
    const targetProduct = products.find(p => p.id === existing.productId);
    if (targetProduct) {
      const updatedProduct: Product = {
        ...targetProduct,
        rate: existing.newPrice
      };
      await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'products', existing.productId, updatedProduct);
    }

    await pricingEngine.logAuditEvent(orgId, stationId, {
      userId: 'usr_owner',
      userName: publisherName,
      userRole: 'Owner',
      actionType: 'PRICE_PUBLISHED',
      productName: existing.productName,
      oldPrice: existing.oldPrice,
      newPrice: existing.newPrice,
      details: `Published live price for ${existing.productName} (Rs. ${existing.newPrice}). Synced to POS & Dispenser controllers.`
    });
  },

  // Rollback Price Version
  rollbackPriceVersion: async (
    orgId: string,
    stationId: string,
    targetPrice: FuelPriceMasterRecord,
    operatorName: string
  ) => {
    // Restore product rate
    const products = db.getProducts(stationId);
    const targetProduct = products.find(p => p.id === targetPrice.productId);
    if (targetProduct) {
      const restoredProduct: Product = {
        ...targetProduct,
        rate: targetPrice.oldPrice
      };
      await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'products', targetPrice.productId, restoredProduct);
    }

    await pricingEngine.logAuditEvent(orgId, stationId, {
      userId: 'usr_owner',
      userName: operatorName,
      userRole: 'Owner',
      actionType: 'VERSION_ROLLED_BACK',
      productName: targetPrice.productName,
      oldPrice: targetPrice.newPrice,
      newPrice: targetPrice.oldPrice,
      details: `Rolled back ${targetPrice.productName} rate from Rs. ${targetPrice.newPrice} to previous rate Rs. ${targetPrice.oldPrice}`
    });
  },

  // Post Double-Entry Inventory Revaluation Journal
  postRevaluationJournal: async (
    orgId: string,
    stationId: string,
    productName: string,
    gainLossAmount: number,
    stockQty: number,
    oldRate: number,
    newRate: number
  ) => {
    const journalId = `jrn_reval_${Date.now()}`;
    const payload = {
      id: journalId,
      date: new Date().toISOString().split('T')[0],
      reference: `INV-REVAL-${productName.replace(/\s+/g, '-').toUpperCase()}`,
      description: `Automated Rule #174 Revaluation Journal for ${productName} (Stock: ${stockQty.toLocaleString()} L | Rate Delta: Rs. ${(newRate - oldRate).toFixed(2)})`,
      entries: [
        {
          accountId: gainLossAmount >= 0 ? '1100-Inventory-Asset' : '5200-Inventory-Loss',
          accountName: gainLossAmount >= 0 ? 'Fuel Inventory Asset' : 'Inventory Loss Account',
          debit: Math.abs(gainLossAmount),
          credit: 0
        },
        {
          accountId: gainLossAmount >= 0 ? '4200-Revaluation-Gain' : '1100-Inventory-Asset',
          accountName: gainLossAmount >= 0 ? 'Inventory Revaluation Gain Account' : 'Fuel Inventory Asset',
          debit: 0,
          credit: Math.abs(gainLossAmount)
        }
      ],
      postedBy: 'System Realtime Engine',
      postedAt: new Date().toISOString()
    };

    await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'fuelpro_journal_entries', journalId, payload);

    await pricingEngine.logAuditEvent(orgId, stationId, {
      userId: 'system',
      userName: 'Realtime Engine',
      userRole: 'System',
      actionType: 'PRICE_PUBLISHED',
      productName,
      oldPrice: oldRate,
      newPrice: newRate,
      details: `Posted balanced Revaluation Journal Entry (${journalId}) for ${productName} (Amount: Rs. ${Math.abs(gainLossAmount).toLocaleString()})`
    });
  }
};
