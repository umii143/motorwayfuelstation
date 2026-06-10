import { Shift, Tank } from '../../types';

export interface TankForecast {
  tankId: string;
  tankName: string;
  productId: string;
  currentStock: number;
  consumption7Day: number;
  consumption14Day: number;
  consumption30Day: number;
  averageConsumption: number;
  stockCoverageDays: number;
  suggestedOrder: number;
  reorderDate: string;
}

export const forecastFuelDemand = (
  shifts: Shift[] = [],
  tanks: Tank[] = [],
  nozzles: any[] = [], // we use any to avoid importing Nozzle if not needed, but we can import Nozzle from '../../types'
  branchId: string = 'main'
): TankForecast[] => {
  if (!shifts) shifts = [];
  if (!tanks) tanks = [];
  if (!nozzles) nozzles = [];
  
  const branchShifts = shifts.filter(s => !s.orgId || s.orgId === branchId);
  const branchTanks = tanks.filter(t => !t.orgId || t.orgId === branchId);

  // Sort shifts chronologically
  const sortedShifts = [...branchShifts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return branchTanks.map(tank => {
    // Calculate sales velocity for this specific tank
    let sold7 = 0;
    let sold14 = 0;
    let sold30 = 0;

    const now = new Date();
    
    // Find nozzles linked to this tank or this product
    const tankNozzles = nozzles.filter(n => n.tankId === tank.id || (!n.tankId && n.productId === tank.productId));
    const tankNozzleIds = tankNozzles.map(n => n.id);
    
    sortedShifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      const daysDiff = (now.getTime() - shiftDate.getTime()) / (1000 * 3600 * 24);
      
      let litersSold = 0;
      tankNozzleIds.forEach(nid => {
        const open = shift.openingReadings?.[nid] || 0;
        const close = shift.closingReadings?.[nid] || 0;
        if (close > open) {
          litersSold += (close - open);
        }
      });
      
      // We don't have per-tank testing liters, so we subtract testing liters by product proportionally or just assume 0 for simplicity.
      // For basic forecasting, ignoring testing liters or subtracting all testing liters for this product:
      const testingLitersForProduct = shift.testLiters?.[tank.productId] || 0;
      // If there are multiple tanks for same product, we might over-subtract. Just a rough estimate:
      const netSold = Math.max(0, litersSold - testingLitersForProduct);

      if (daysDiff <= 7) sold7 += netSold;
      if (daysDiff <= 14) sold14 += netSold;
      if (daysDiff <= 30) sold30 += netSold;
    });

    const c7 = sold7 / 7 || 0;
    const c14 = sold14 / 14 || 0;
    const c30 = sold30 / 30 || 0;
    
    // Use weighted average favoring recent consumption
    const averageConsumption = (c7 * 0.5) + (c14 * 0.3) + (c30 * 0.2) || 1000; // Fallback to 1000 if 0

    const coverage = Number(tank.currentStock || 0) / averageConsumption;
    
    // Reorder point: order enough to fill tank, assuming delivery takes 1 day
    const suggestedOrder = Math.max(0, Number(tank.capacity || 0) - Number(tank.currentStock || 0));

    let reorderDate = 'N/A';
    if (!isNaN(coverage) && isFinite(coverage)) {
      const reorderDateObj = new Date(now.getTime() + (coverage * 24 * 60 * 60 * 1000));
      if (!isNaN(reorderDateObj.getTime())) {
        reorderDate = reorderDateObj.toISOString().split('T')[0];
      }
    }

    return {
      tankId: tank.id,
      tankName: tank.name,
      productId: tank.productId,
      currentStock: Number(tank.currentStock || 0),
      consumption7Day: c7,
      consumption14Day: c14,
      consumption30Day: c30,
      averageConsumption,
      stockCoverageDays: Number(coverage.toFixed(2)),
      suggestedOrder,
      reorderDate
    };
  });
};
