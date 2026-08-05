export interface PumpHardwareStatus {
  id: string;
  name: string;
  type: 'dispenser_pump' | 'pos_terminal' | 'price_board' | 'tank_gauge';
  currentRateDisplayed: number;
  expectedRate: number;
  syncStatus: 'synced' | 'pending' | 'failed' | 'updating';
  lastSyncedAt: string;
  ipAddress?: string;
}

export const pumpControllerSyncEngine = {
  getHardwareSyncStatus: (petrolRate: number = 285.45, dieselRate: number = 293.80): PumpHardwareStatus[] => {
    return [
      {
        id: 'pump_01',
        name: 'Gilbarco Dispenser 01 (Petrol Bay 1 & 2)',
        type: 'dispenser_pump',
        currentRateDisplayed: petrolRate,
        expectedRate: petrolRate,
        syncStatus: 'synced',
        lastSyncedAt: 'Today 00:01:12',
        ipAddress: '192.168.1.101'
      },
      {
        id: 'pump_02',
        name: 'Wayne Dispenser 02 (Diesel Bay 1 & 2)',
        type: 'dispenser_pump',
        currentRateDisplayed: dieselRate,
        expectedRate: dieselRate,
        syncStatus: 'synced',
        lastSyncedAt: 'Today 00:01:14',
        ipAddress: '192.168.1.102'
      },
      {
        id: 'pump_03',
        name: 'Tokheim Dispenser 03 (Hi-Octane Bay)',
        type: 'dispenser_pump',
        currentRateDisplayed: 308.50,
        expectedRate: 308.50,
        syncStatus: 'synced',
        lastSyncedAt: 'Today 00:01:15',
        ipAddress: '192.168.1.103'
      },
      {
        id: 'pos_counter_1',
        name: 'Main POS Terminal 01',
        type: 'pos_terminal',
        currentRateDisplayed: petrolRate,
        expectedRate: petrolRate,
        syncStatus: 'synced',
        lastSyncedAt: 'Today 00:00:05',
        ipAddress: '192.168.1.50'
      },
      {
        id: 'pos_counter_2',
        name: 'Lube POS Counter 02',
        type: 'pos_terminal',
        currentRateDisplayed: petrolRate,
        expectedRate: petrolRate,
        syncStatus: 'synced',
        lastSyncedAt: 'Today 00:00:06',
        ipAddress: '192.168.1.51'
      },
      {
        id: 'price_board_main',
        name: 'Digital Canopy LED Price Board',
        type: 'price_board',
        currentRateDisplayed: petrolRate,
        expectedRate: petrolRate,
        syncStatus: 'synced',
        lastSyncedAt: 'Today 00:02:00',
        ipAddress: '192.168.1.200'
      }
    ];
  }
};
