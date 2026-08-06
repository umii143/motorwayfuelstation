import { create } from 'zustand';
import { FuelPriceMasterRecord, PricingAuditEventRecord, pricingEngine } from '../services/priceManagement/pricingEngine';

interface PricingStoreState {
  fuelPrices: FuelPriceMasterRecord[];
  auditLogs: PricingAuditEventRecord[];
  isSubscribed: boolean;
  activeOrgId: string;
  activeStationId: string;

  // Actions
  initRealtimeListeners: (orgId: string, stationId: string) => () => void;
  createDraftProposal: (
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number,
    effectiveDate: string,
    effectiveTime: string,
    reason: string,
    creatorName: string
  ) => Promise<void>;
  approveRevision: (priceId: string, approverName: string) => Promise<void>;
  publishRevision: (priceId: string, publisherName: string) => Promise<void>;
  rollbackVersion: (targetPrice: FuelPriceMasterRecord, operatorName: string) => Promise<void>;
  postRevaluationJournal: (
    productName: string,
    gainLossAmount: number,
    stockQty: number,
    oldRate: number,
    newRate: number
  ) => Promise<void>;
}

export const usePricingStore = create<PricingStoreState>((set, get) => ({
  fuelPrices: [],
  auditLogs: [],
  isSubscribed: false,
  activeOrgId: '',
  activeStationId: '',

  initRealtimeListeners: (orgId: string, stationId: string) => {
    set({ activeOrgId: orgId, activeStationId: stationId, isSubscribed: true });

    const unsubPrices = pricingEngine.subscribeFuelPrices(orgId, stationId, (data) => set({ fuelPrices: data }));
    const unsubAudit = pricingEngine.subscribeAuditLogs(orgId, stationId, (data) => set({ auditLogs: data }));

    return () => {
      unsubPrices();
      unsubAudit();
      set({ isSubscribed: false });
    };
  },

  createDraftProposal: async (
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number,
    effectiveDate: string,
    effectiveTime: string,
    reason: string,
    creatorName: string
  ) => {
    const { activeOrgId, activeStationId } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || 'st_default';
    await pricingEngine.createPriceDraft(orgId, stationId, productId, productName, oldPrice, newPrice, effectiveDate, effectiveTime, reason, creatorName);
  },

  approveRevision: async (priceId: string, approverName: string) => {
    const { activeOrgId, activeStationId } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || 'st_default';
    await pricingEngine.approvePriceRevision(orgId, stationId, priceId, approverName);
  },

  publishRevision: async (priceId: string, publisherName: string) => {
    const { activeOrgId, activeStationId } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || 'st_default';
    await pricingEngine.publishPriceRevision(orgId, stationId, priceId, publisherName);
  },

  rollbackVersion: async (targetPrice: FuelPriceMasterRecord, operatorName: string) => {
    const { activeOrgId, activeStationId } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || 'st_default';
    await pricingEngine.rollbackPriceVersion(orgId, stationId, targetPrice, operatorName);
  },

  postRevaluationJournal: async (
    productName: string,
    gainLossAmount: number,
    stockQty: number,
    oldRate: number,
    newRate: number
  ) => {
    const { activeOrgId, activeStationId } = get();
    const orgId = activeOrgId || 'org_main';
    const stationId = activeStationId || 'st_default';
    await pricingEngine.postRevaluationJournal(orgId, stationId, productName, gainLossAmount, stockQty, oldRate, newRate);
  }
}));
