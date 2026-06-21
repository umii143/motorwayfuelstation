// Store state typing removed since we use any in completionCheck

export type StepStatus = 'completed' | 'active' | 'pending' | 'locked';

export interface SetupStep {
  id: string;
  viewId: string;           // matches activeView in App.tsx
  label: string;
  icon: string;             // Material Symbol name
  stepNumber: number;
  dependsOn: string[];      // which step IDs must be complete first
  completionCheck: (store: any) => boolean;
}

export const getSetupSteps = (isLube: boolean): SetupStep[] => {
  if (isLube) {
    return [
      {
        id: 'profile',
        viewId: 'profile', // Matches the actual viewId in Settings 'profile'
        label: 'Station Profile',
        icon: 'storefront',
        stepNumber: 1,
        dependsOn: [],
        completionCheck: (store) => store.settings && store.settings.stationName && store.settings.stationName.length > 0,
      },
    ];
  }

  return [
    {
      id: 'products',
      viewId: 'setup_products',
      label: 'Fuel Products',
      icon: 'science',
      stepNumber: 1,
      dependsOn: [],           // always available
      completionCheck: (store) => store.products && store.products.length > 0,
    },
    {
      id: 'tanks',
      viewId: 'setup_tanks',
      label: 'Tank Setup',
      icon: 'propane_tank',
      stepNumber: 2,
      dependsOn: ['products'], // need products first
      completionCheck: (store) => store.tanks && store.tanks.length > 0,
    },
    {
      id: 'nozzles',
      viewId: 'setup_nozzles',
      label: 'Nozzle Setup',
      icon: 'local_gas_station',
      stepNumber: 3,
      dependsOn: ['tanks'],    // need tanks first
      completionCheck: (store) => store.nozzles && store.nozzles.length > 0,
    },
    {
      id: 'prices',
      viewId: 'setup_rates',
      label: 'Price Setup',
      icon: 'payments',
      stepNumber: 4,
      dependsOn: ['products', 'nozzles'], // need products and nozzles
      completionCheck: (store) => {
          return store.products && store.products.some((p: any) => p.rate > 0);
      },
    },
    {
      id: 'profile',
      viewId: 'setup_profile',
      label: 'Station Profile',
      icon: 'storefront',
      stepNumber: 5,
      dependsOn: [],           // independent
      completionCheck: (store) => store.settings && store.settings.stationName && store.settings.stationName.length > 0,
    },
  ];
};
