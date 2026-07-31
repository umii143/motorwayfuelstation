/**
 * FuelPro Enterprise — Data Contracts & Audit Metadata
 * Defines explicit data sources, formulas, refresh triggers, update frequency,
 * fallback rules, and audit traceability for every single Dashboard Widget.
 * 
 * Powered by Umar Ali ⚡
 */

export interface WidgetDataContract {
  widgetId: string;
  widgetName: string;
  dataSource: string;
  formula: string;
  refreshTrigger: string;
  updateFrequency: 'Realtime (<20ms)' | 'Event-driven' | 'Reactive';
  fallbackRule: string;
  auditTraceability: string;
}

export const FUELPRO_DATA_CONTRACTS: Record<string, WidgetDataContract> = {
  STATION_HEALTH_SCORE: {
    widgetId: 'STATION_HEALTH_SCORE',
    widgetName: 'Station Operational Health Score',
    dataSource: 'useInventoryStore (tanks, nozzles) + useShiftStore (shifts) + useCustomerStore (customers)',
    formula: '(Tank Stock Health % + Nozzle Uptime % + Customer Recovery Rate % + Shift Variance Accuracy %) / 4',
    refreshTrigger: 'EOC_EVENTS.SHIFT_CLOSED | EOC_EVENTS.DIP_RECORDED | Store Mutations',
    updateFrequency: 'Realtime (<20ms)',
    fallbackRule: '100% when no items exist',
    auditTraceability: 'Calculated dynamically per station session'
  },
  TODAYS_REVENUE: {
    widgetId: 'TODAYS_REVENUE',
    widgetName: 'Today\'s Total Revenue',
    dataSource: 'useShiftStore.shifts',
    formula: 'SUM(shift.totalSales) WHERE date = TODAY and stationId = activeStationId',
    refreshTrigger: 'EOC_EVENTS.SHIFT_OPENED | EOC_EVENTS.SHIFT_CLOSED | Nozzle Meter Entry',
    updateFrequency: 'Realtime (<20ms)',
    fallbackRule: 'Rs 0 (Only if no sales recorded today)',
    auditTraceability: 'Traceable to shift nozzle readings & sales receipts'
  },
  LITERS_SOLD: {
    widgetId: 'LITERS_SOLD',
    widgetName: 'Total Liters Sold Today',
    dataSource: 'useShiftStore.shifts.nozzleReadings',
    formula: 'SUM(Math.max(0, closingReading - openingReading)) WHERE shift.date = TODAY',
    refreshTrigger: 'EOC_EVENTS.SHIFT_CLOSED | Nozzle Reading Entry',
    updateFrequency: 'Realtime (<20ms)',
    fallbackRule: '0 L (Only if no nozzle readings recorded)',
    auditTraceability: 'Traceable to physical pump nozzle meter counters'
  },
  ESTIMATED_PROFIT: {
    widgetId: 'ESTIMATED_PROFIT',
    widgetName: 'Estimated Net Profit Today',
    dataSource: 'useShiftStore.shifts + useInventoryStore.products',
    formula: 'SUM(saleVolume * (sellingRate - purchaseCost)) - SUM(standaloneExpenses)',
    refreshTrigger: 'EOC_EVENTS.EXPENSE_POSTED | EOC_EVENTS.PRICE_CHANGED | Shift Entry',
    updateFrequency: 'Realtime (<20ms)',
    fallbackRule: 'Rs 0 (Only if no margin calculated)',
    auditTraceability: 'Traceable to product purchase rates and expense vouchers'
  },
  SHIFT_VARIANCE: {
    widgetId: 'SHIFT_VARIANCE',
    widgetName: 'Active Shift Cash Variance',
    dataSource: 'useShiftStore.activeShift',
    formula: 'actualCashSubmitted - (openingCash + expectedSales)',
    refreshTrigger: 'EOC_EVENTS.SHIFT_CLOSED | Cash Reconciliation Entry',
    updateFrequency: 'Realtime (<20ms)',
    fallbackRule: 'Rs 0 Balanced',
    auditTraceability: 'Traceable to cashier shift closing audit records'
  },
  TREASURY_NET_POSITION: {
    widgetId: 'TREASURY_NET_POSITION',
    widgetName: 'Treasury Net Liquidity Position',
    dataSource: 'useFinancialStore.banks + useCustomerStore.customers + useSupplierStore.suppliers',
    formula: 'SUM(bankBalances) + SUM(customerReceivables) - SUM(supplierPayables)',
    refreshTrigger: 'EOC_EVENTS.BANK_DEPOSIT | EOC_EVENTS.RECOVERY_RECEIVED | EOC_EVENTS.SUPPLIER_PAYMENT',
    updateFrequency: 'Realtime (<20ms)',
    fallbackRule: 'Rs 0 (Only if no accounts configured)',
    auditTraceability: 'Traceable to double-entry general ledger accounts'
  },
  TANK_LEVEL_INTELLIGENCE: {
    widgetId: 'TANK_LEVEL_INTELLIGENCE',
    widgetName: 'Tank-by-Tank Realtime Liquid Stock & Fill %',
    dataSource: 'useInventoryStore.tanks + useInventoryStore.products',
    formula: 'tankPct = capacity > 0 ? (currentStock / capacity) * 100 : 0',
    refreshTrigger: 'EOC_EVENTS.SNAPSHOT_CREATED | Dip Chart Calculation | Refill Receipt',
    updateFrequency: 'Realtime (<20ms)',
    fallbackRule: '0% Fill when stock is 0 L',
    auditTraceability: 'Traceable to physical tank dip charts and calibration logs'
  },
  AI_TANK_DECISION_SUPPORT: {
    widgetId: 'AI_TANK_DECISION_SUPPORT',
    widgetName: 'AI Tank Refill & Risk Recommendation',
    dataSource: 'demandForecastEngine + useInventoryStore',
    formula: 'remainingDays = currentStock / max(1, avgDailySales); refillOrder = capacity - currentStock',
    refreshTrigger: 'EOC_EVENTS.SHIFT_CLOSED | Tank Level Update',
    updateFrequency: 'Event-driven',
    fallbackRule: 'Safe Refill Suggestion based on historical consumption',
    auditTraceability: 'Traceable to AI forecast model confidence parameters'
  }
};
