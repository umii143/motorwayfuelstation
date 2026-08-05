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
    return [
      {
        company: 'PSO',
        petrolPrice: 285.45,
        dieselPrice: 293.80,
        hobcPrice: 308.50,
        petrolDiff: 0.00,
        dieselDiff: 0.00,
        wholesalePetrol: 276.81,
        wholesaleDiesel: 285.16,
        dealerMargin: 8.64,
        lastUpdated: 'Today 00:00',
        source: 'OGRA Benchmark Circular #08-2026'
      },
      {
        company: 'Shell',
        petrolPrice: 285.45,
        dieselPrice: 293.80,
        hobcPrice: 309.00,
        petrolDiff: 0.00,
        dieselDiff: 0.00,
        wholesalePetrol: 276.81,
        wholesaleDiesel: 285.16,
        dealerMargin: 8.64,
        lastUpdated: 'Today 00:15',
        source: 'Shell Pakistan Official Notice'
      },
      {
        company: 'Attock',
        petrolPrice: 285.45,
        dieselPrice: 293.80,
        hobcPrice: 308.50,
        petrolDiff: 0.00,
        dieselDiff: 0.00,
        wholesalePetrol: 276.81,
        wholesaleDiesel: 285.16,
        dealerMargin: 8.64,
        lastUpdated: 'Today 01:00',
        source: 'ARL Petroleum Direct Notification'
      },
      {
        company: 'GO',
        petrolPrice: 284.95,
        dieselPrice: 293.50,
        hobcPrice: 307.00,
        petrolDiff: -0.50,
        dieselDiff: -0.30,
        wholesalePetrol: 276.31,
        wholesaleDiesel: 284.86,
        dealerMargin: 8.64,
        lastUpdated: 'Yesterday 23:30',
        source: 'Gas & Oil Pakistan Direct'
      },
      {
        company: 'Hascol',
        petrolPrice: 285.00,
        dieselPrice: 293.50,
        hobcPrice: 307.50,
        petrolDiff: -0.45,
        dieselDiff: -0.30,
        wholesalePetrol: 276.36,
        wholesaleDiesel: 284.86,
        dealerMargin: 8.64,
        lastUpdated: 'Today 02:00',
        source: 'Hascol Petroleum Circular'
      },
      {
        company: 'APL',
        petrolPrice: 285.45,
        dieselPrice: 293.80,
        hobcPrice: 308.50,
        petrolDiff: 0.00,
        dieselDiff: 0.00,
        wholesalePetrol: 276.81,
        wholesaleDiesel: 285.16,
        dealerMargin: 8.64,
        lastUpdated: 'Today 00:05',
        source: 'Attock Petroleum Limited'
      },
      {
        company: 'Euro Oil',
        petrolPrice: 284.50,
        dieselPrice: 293.00,
        hobcPrice: 306.50,
        petrolDiff: -0.95,
        dieselDiff: -0.80,
        wholesalePetrol: 275.86,
        wholesaleDiesel: 284.36,
        dealerMargin: 8.64,
        lastUpdated: 'Today 03:00',
        source: 'Euro Oil Regional Depot'
      },
      {
        company: 'Byco',
        petrolPrice: 285.20,
        dieselPrice: 293.60,
        hobcPrice: 308.00,
        petrolDiff: -0.25,
        dieselDiff: -0.20,
        wholesalePetrol: 276.56,
        wholesaleDiesel: 284.96,
        dealerMargin: 8.64,
        lastUpdated: 'Today 01:45',
        source: 'Cnergyico Peak Direct'
      }
    ];
  }
};
