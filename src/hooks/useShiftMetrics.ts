import { useMemo } from 'react';
import { useStation } from '../contexts/StationContext';
import { Shift } from '../types';

type ExtendedShift = Shift & {
  pumpReadings?: { nozzleReadings?: { nozzleId: string }[] }[];
  cashierName?: string;
  openingCash?: number;
  totalSales?: number;
};

export function useShiftMetrics() {
  const { shifts, nozzles } = useStation();

  return useMemo(() => {
    const activeShifts = shifts.filter(s => s.status === 'active');
    const activeShift = activeShifts[0]; // Assuming one main active shift

    const totalShiftsToday = shifts.filter(s => {
      const shiftDate = new Date(s.startTime);
      const today = new Date();
      return shiftDate.getDate() === today.getDate() && 
             shiftDate.getMonth() === today.getMonth() && 
             shiftDate.getFullYear() === today.getFullYear();
    });

    const activeNozzles = new Set<string>();
    activeShifts.forEach(shift => {
      (shift as ExtendedShift).pumpReadings?.forEach((pr) => {
        pr.nozzleReadings?.forEach((nr) => {
          activeNozzles.add(nr.nozzleId);
        });
      });
    });

    // Active Shift Details
    let shiftOperator = 'N/A';
    let openingCash = 0;
    let expectedCash = 0;
    let variance = 0;
    let shiftDuration = '0h 0m';

    if (activeShift) {
      shiftOperator = (activeShift as ExtendedShift).cashierName || 'System';
      openingCash = (activeShift as ExtendedShift).openingCash || 0;
      expectedCash = openingCash + ((activeShift as ExtendedShift).totalSales || 0);
      const currentCash = expectedCash; // Need proper tracking if possible
      variance = currentCash - expectedCash;

      const startMs = new Date(activeShift.startTime).getTime();
      const diffMs = new Date().getTime() - startMs;
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      shiftDuration = `${diffHrs}h ${diffMins}m`;
    }

    return {
      activeShifts,
      activeShift,
      totalShiftsToday: totalShiftsToday.length,
      activeNozzlesCount: activeNozzles.size,
      totalNozzles: nozzles.length,
      
      shiftOperator,
      openingCash,
      expectedCash,
      variance,
      shiftDuration
    };
  }, [shifts, nozzles]);
}
