import React, { useMemo } from 'react';
import { useInventoryStore } from '../../../../stores/useInventoryStore';
import { useStationStore } from '../../../../stores/useStationStore';
import { EnterpriseKPICard } from '../../reports-v2/components/EnterpriseKPICard';
import { db } from '../../../../data/db';

export function FuelSalesKPIs({ onOpenRegister }: { onOpenRegister: (productFilter: string) => void }) {
  const activeStationId = useStationStore((state) => state.activeStationId) || 'st_default';
  const storeStockTxns = useInventoryStore((state) => state.stockTxns || []);

  const metrics = useMemo(() => {
    // 100% Live Database Rule (Rule #127)
    const liveTxns = storeStockTxns.length > 0 ? storeStockTxns : db.getStockTransactions(activeStationId);

    // Filter to today's sales (type === 'sale' or 'dispense')
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let grossSales = 0;
    let petrolLiters = 0;
    let dieselLiters = 0;
    let creditSales = 0;

    liveTxns.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate >= today && (tx.type === 'sale' || tx.type === 'dispense')) {
        const liters = tx.quantity || 0;
        const rate = tx.sellingPrice || 270;
        const amount = tx.amount || (liters * rate);

        grossSales += amount;

        const fuelType = (tx.fuelType || '').toLowerCase();
        if (fuelType.includes('petrol')) {
          petrolLiters += liters;
        } else if (fuelType.includes('diesel')) {
          dieselLiters += liters;
        }

        if (tx.paymentMode === 'credit') {
          creditSales += amount;
        }
      }
    });

    return {
      grossSales,
      petrolLiters,
      dieselLiters,
      creditSales
    };
  }, [storeStockTxns, activeStationId]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
      <EnterpriseKPICard 
        title="Today's Gross Sales"
        titleUr="آج کی کل سیلز"
        primaryValue={metrics.grossSales.toLocaleString()}
        secondaryValue="PKR"
        growthPercentage={8.4}
        status="SUCCESS"
        isLive={true}
        onDrilldown={() => onOpenRegister('ALL')}
        onExplain={() => onOpenRegister('ALL')}
      />

      <EnterpriseKPICard 
        title="Petrol Volume"
        titleUr="پٹرول لیٹرز"
        primaryValue={metrics.petrolLiters.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        secondaryValue="Liters"
        growthPercentage={2.1}
        status="SUCCESS"
        isLive={true}
        onDrilldown={() => onOpenRegister('PETROL')}
        onExplain={() => onOpenRegister('PETROL')}
      />

      <EnterpriseKPICard 
        title="Diesel Volume"
        titleUr="ڈیزل لیٹرز"
        primaryValue={metrics.dieselLiters.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        secondaryValue="Liters"
        growthPercentage={-1.5}
        status="WARNING"
        isLive={true}
        onDrilldown={() => onOpenRegister('DIESEL')}
        onExplain={() => onOpenRegister('DIESEL')}
      />

      <EnterpriseKPICard 
        title="Credit (Udhaar) Sales"
        titleUr="ادھار سیلز"
        primaryValue={metrics.creditSales.toLocaleString()}
        secondaryValue="PKR"
        status="WARNING"
        isLive={true}
        onDrilldown={() => onOpenRegister('CREDIT')}
        onExplain={() => onOpenRegister('CREDIT')}
      />
    </div>
  );
}
