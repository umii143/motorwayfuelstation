import { IntelligenceLayerDef, IntelligenceLayerId } from './types';

export const LayerRegistry: Record<IntelligenceLayerId, IntelligenceLayerDef> = {
  executive: { id: 'executive', name: '1. Executive Intelligence', layerNumber: 1, iconName: 'Crown', emoji: '👑' },
  fuel_operations: { id: 'fuel_operations', name: '2. Fuel Operations Intelligence', layerNumber: 2, iconName: 'Fuel', emoji: '⛽' },
  wet_stock: { id: 'wet_stock', name: '3. Wet Stock & Tank Intelligence', layerNumber: 3, iconName: 'Droplets', emoji: '🛢️' },
  financial: { id: 'financial', name: '4. Financial & General Ledger', layerNumber: 4, iconName: 'DollarSign', emoji: '📒' },
  banking: { id: 'banking', name: '5. Banking & Digital Wallet', layerNumber: 5, iconName: 'Building', emoji: '🏦' },
  staff: { id: 'staff', name: '6. Staff & Shift Intelligence', layerNumber: 6, iconName: 'Users', emoji: '👥' },
  supplier: { id: 'supplier', name: '7. Supplier & Purchase', layerNumber: 7, iconName: 'Truck', emoji: '🚚' },
  customer: { id: 'customer', name: '8. Customer & Credit', layerNumber: 8, iconName: 'Award', emoji: '🤝' },
  fleet: { id: 'fleet', name: '9. Fleet & Corporate', layerNumber: 9, iconName: 'Users', emoji: '🏢' },
  risk: { id: 'risk', name: '10. Risk & Compliance', layerNumber: 10, iconName: 'ShieldAlert', emoji: '⚠️' },
  forecast: { id: 'forecast', name: '11. Forecast & Business Intelligence', layerNumber: 11, iconName: 'TrendingUp', emoji: '📈' },
  audit: { id: 'audit', name: '12. Audit & Investigation', layerNumber: 12, iconName: 'Eye', emoji: '🔍' },
  valuation: { id: 'valuation', name: '13. Inventory Valuation', layerNumber: 13, iconName: 'Layers', emoji: '📦' },
  tax: { id: 'tax', name: '14. Tax & Regulatory', layerNumber: 14, iconName: 'Scale', emoji: '⚖️' },
  multi_branch: { id: 'multi_branch', name: '15. Multi-Branch Consolidated', layerNumber: 15, iconName: 'Sparkles', emoji: '🌐' }
};

export const getAllLayers = (): IntelligenceLayerDef[] => {
  return Object.values(LayerRegistry).sort((a, b) => a.layerNumber - b.layerNumber);
};
