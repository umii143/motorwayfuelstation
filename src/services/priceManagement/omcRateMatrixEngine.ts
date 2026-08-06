export interface OMCRateEntry {
  company: 'PSO' | 'Shell' | 'Attock' | 'GO' | 'Hascol' | 'APL' | 'Euro Oil' | 'Byco';
  petrolPrice: number;
  dieselPrice: number;
  hobcPrice: number;
  petrolDiff: number; // vs our current price
  dieselDiff: number; // vs our current price
  wholesalePetrol: number;
  wholesaleDiesel: number;
  dealerMargin: number;
  lastUpdated: string;
  source: string;
}

export const omcRateMatrixEngine = {
  getOMCComparison: (ourPetrol: number = 285.45, ourDiesel: number = 293.80): OMCRateEntry[] => {
    // Realtime OMC Matrix Engine
    // Currently returns empty array as per Rule #1 (Zero Dummy Data).
    // In production, this will fetch competitor rates from Firestore.
    return [];
  }
};
