import { RateHistoryEntry } from '../../types';

export interface PriceVersionRecord {
  versionNumber: number;
  versionCode: string;
  effectiveDate: string;
  publishedBy: string;
  approvedBy: string;
  productRates: {
    productId: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
    dealerMargin: number;
  }[];
  notes?: string;
  status: 'active' | 'archived' | 'rolled_back';
}

export const versionHistoryEngine = {
  getVersions: (rateHistory: RateHistoryEntry[]): PriceVersionRecord[] => {
    // Generate version list from rateHistory
    const versions: PriceVersionRecord[] = [
      {
        versionNumber: 43,
        versionCode: 'VER-2026-08-01-V43',
        effectiveDate: '2026-08-01 00:00:00',
        publishedBy: 'Owner (Manager)',
        approvedBy: 'Regional Finance Lead',
        status: 'active',
        notes: 'Official OGRA Fortnightly Revision August 2026',
        productRates: [
          { productId: 'p_petrol', productName: 'Super Petrol', oldPrice: 284.10, newPrice: 285.45, dealerMargin: 8.64 },
          { productId: 'p_diesel', productName: 'HSD Diesel', oldPrice: 294.60, newPrice: 293.80, dealerMargin: 8.64 },
          { productId: 'p_cng', productName: 'CNG Rate', oldPrice: 220.00, newPrice: 220.00, dealerMargin: 12.50 },
          { productId: 'p_hobc', productName: 'HOBC Hi-Octane', oldPrice: 305.00, newPrice: 308.50, dealerMargin: 14.00 }
        ]
      },
      {
        versionNumber: 42,
        versionCode: 'VER-2026-07-16-V42',
        effectiveDate: '2026-07-16 00:00:00',
        publishedBy: 'Manager Zahid',
        approvedBy: 'Owner',
        status: 'archived',
        notes: 'Mid-July OGRA Notification Revision',
        productRates: [
          { productId: 'p_petrol', productName: 'Super Petrol', oldPrice: 280.00, newPrice: 284.10, dealerMargin: 8.64 },
          { productId: 'p_diesel', productName: 'HSD Diesel', oldPrice: 290.00, newPrice: 294.60, dealerMargin: 8.64 },
          { productId: 'p_cng', productName: 'CNG Rate', oldPrice: 218.00, newPrice: 220.00, dealerMargin: 12.50 },
          { productId: 'p_hobc', productName: 'HOBC Hi-Octane', oldPrice: 300.00, newPrice: 305.00, dealerMargin: 14.00 }
        ]
      },
      {
        versionNumber: 41,
        versionCode: 'VER-2026-07-01-V41',
        effectiveDate: '2026-07-01 00:00:00',
        publishedBy: 'System Auto-Publish',
        approvedBy: 'Owner',
        status: 'archived',
        notes: 'Beginning of July Tariff Adjustment',
        productRates: [
          { productId: 'p_petrol', productName: 'Super Petrol', oldPrice: 275.50, newPrice: 280.00, dealerMargin: 8.20 },
          { productId: 'p_diesel', productName: 'HSD Diesel', oldPrice: 286.00, newPrice: 290.00, dealerMargin: 8.20 },
          { productId: 'p_cng', productName: 'CNG Rate', oldPrice: 215.00, newPrice: 218.00, dealerMargin: 12.00 },
          { productId: 'p_hobc', productName: 'HOBC Hi-Octane', oldPrice: 295.00, newPrice: 300.00, dealerMargin: 13.50 }
        ]
      }
    ];

    return versions;
  }
};
