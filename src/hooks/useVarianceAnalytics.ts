import { useState, useEffect, useRef, useMemo } from 'react';
import { Shift } from '../types';

export interface TankDip {
  tankId: string;
  date: string;
  actualDip: number;
  expectedDip: number;
}

interface VarianceWorkerResult {
  totalSystemVariance: number;
  worstNozzleId: string;
  worstNozzleLoss: number;
  tankDeviations: string[];
  status: string;
}

export function useVarianceAnalytics(shifts: Shift[], expectedTankDips: TankDip[] = []) {
  const [analytics, setAnalytics] = useState<VarianceWorkerResult>({
    totalSystemVariance: 0,
    worstNozzleId: 'N/A',
    worstNozzleLoss: 0,
    tankDeviations: [],
    status: 'Normal'
  });

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/variance.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e) => {
      setAnalytics(e.data);
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Pre-aggregate before sending to worker to save serialization cost
  const summary = useMemo(() => {
    const summarizedShifts = shifts.slice(-90).map(s => {
      let totalVariance = 0;
      const nozzleVariances: { nozzleId: string, variance: number }[] = [];
      s.segments?.forEach(seg => {
        // Mock variance logic since segments don't explicitly store variance right now
        // Or if there is cashVariance in Shift
        const v = 0; // Or seg.variance if added
        totalVariance += v;
        nozzleVariances.push({ nozzleId: seg.nozzleId, variance: v });
      });
      totalVariance += (s.cashVariance || s.shortage || 0); // Include shift cash shortage
      
      return {
        date: s.date,
        totalVariance,
        nozzleVariances
      };
    });

    return {
      shifts: summarizedShifts,
      tankDips: expectedTankDips.slice(-30).map(d => ({
         tankId: d.tankId,
         date: d.date,
         actual: d.actualDip,
         expected: d.expectedDip
      }))
    };
  }, [shifts, expectedTankDips]);

  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ summary });
    }
  }, [summary]);

  return analytics;
}
