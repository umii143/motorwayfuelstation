import { useState, useEffect, useRef, useMemo } from 'react';
import { Shift, Tank, Product } from '../types';
import { GlobalSettings } from '../types';
import { ForecastResult, ForecastInput } from '../workers/forecast.worker';

export function useForecastEngine(shifts: Shift[], tanks: Tank[], products: Product[], settings?: GlobalSettings) {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/forecast.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current.onmessage = (e: MessageEvent<ForecastResult>) => {
      setForecast(e.data);
      setIsComputing(false);
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Pre-aggregate daily data for the worker to avoid serializing the entire Shift history
  const summary = useMemo(() => {
    // Group shifts by date
    const dailyMap = new Map<string, ForecastInput['dailyData'][0]>();

    shifts.forEach(shift => {
      const date = shift.date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          totalVolume: 0,
          totalProfit: 0,
          txnCount: 0,
          productVolumes: { /* empty */ }
        });
      }

      const day = dailyMap.get(date)!;
      day.txnCount += 1;

      // Extract volume and profit from segments (fallback to legacy properties if needed)
      if (shift.segments && shift.segments.length > 0) {
        shift.segments.forEach(seg => {
          const vol = seg.litersSold || 0;
          day.totalVolume += vol;
          
          if (seg.productId) {
            day.productVolumes[seg.productId] = (day.productVolumes[seg.productId] || 0) + vol;
            
            const product = products.find(p => p.id === seg.productId);
            if (product) {
              const cost = product.purchasePrice || product.rate || 0;
              day.totalProfit += vol * ((seg.newRate || product.rate || 0) - cost);
            }
          }
        });
      } else {
        // Legacy fallback
        const legacyShift = shift as Shift & {
          nozzleReadings?: {
            closingReading: number;
            openingReading: number;
            productId?: string;
            rate?: number;
          }[]
        };
        if (legacyShift.nozzleReadings) {
          legacyShift.nozzleReadings.forEach((nr) => {
            const vol = nr.closingReading > 0 ? Math.max(0, nr.closingReading - nr.openingReading) : 0;
            day.totalVolume += vol;
            if (nr.productId) {
              day.productVolumes[nr.productId] = (day.productVolumes[nr.productId] || 0) + vol;
              const product = products.find(p => p.id === nr.productId);
              if (product) {
                const cost = product.purchasePrice || product.rate || 0;
                day.totalProfit += vol * ((nr.rate || product.rate || 0) - cost);
              }
            }
          });
        }
      }
    });

    const mappedTanks = tanks.map(t => ({
      id: t.id,
      name: t.name,
      productId: t.productId,
      currentStock: t.currentStock
    }));

    const shiftsData = shifts.map(s => {
      let shiftVolume = 0;
      if (s.segments && s.segments.length > 0) {
        s.segments.forEach(seg => { shiftVolume += seg.litersSold || 0; });
      } else {
        const legacyShift = s as Shift & {
          nozzleReadings?: { closingReading: number; openingReading: number }[]
        };
        if (legacyShift.nozzleReadings) {
          legacyShift.nozzleReadings.forEach((nr) => {
            const vol = nr.closingReading > 0 ? Math.max(0, nr.closingReading - nr.openingReading) : 0;
            shiftVolume += vol;
          });
        }
      }
      return {
        date: s.date,
        shiftType: s.type,
        volume: shiftVolume
      };
    });

    return {
      dailyData: Array.from(dailyMap.values()),
      shiftsData,
      tanks: mappedTanks,
      settings
    };
  }, [shifts, tanks, products, settings]);

  useEffect(() => {
    if (workerRef.current && summary.dailyData.length > 0) {
      setIsComputing(true);
      workerRef.current.postMessage(summary);
    }
  }, [summary]);

  return { forecast, isComputing };
}
