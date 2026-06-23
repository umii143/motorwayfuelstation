import { useMemo } from 'react';
import { useStation } from '../contexts/StationContext';

export function useTreasuryMetrics() {
  const { banks, customers, suppliers, digitalAccounts } = useStation();

  return useMemo(() => {
    // Only subscribe to relevant context fields
    const totalDigitalCash = (digitalAccounts || []).reduce((sum, d) => sum + d.balance, 0);

    // In FuelPro, 'banks' array actually contains all cash/bank accounts. 
    // Usually type === 'cash' vs 'bank'. Let's segregate them if type is available.
    let cashBalance = 0;
    let bankBalance = 0;

    banks.forEach(b => {
      if ((b as any).type?.toLowerCase() === 'cash') {
        cashBalance += b.balance;
      } else {
        bankBalance += b.balance;
      }
    });

    const totalReceivables = customers.reduce((sum, c) => c.balance > 0 ? sum + c.balance : sum, 0);
    const totalPayables = suppliers.reduce((sum, s) => s.balance > 0 ? sum + s.balance : sum, 0); 
    const netPosition = cashBalance + bankBalance + totalDigitalCash + totalReceivables - totalPayables;

    const topDebtors = [...customers].filter(c => c.balance > 0).sort((a,b) => b.balance - a.balance).slice(0, 5);
    const topSuppliers = [...suppliers].filter(s => s.balance > 0).sort((a,b) => b.balance - a.balance).slice(0, 5);

    return {
      cashInHand: cashBalance,
      bankBalance,
      digitalBalance: totalDigitalCash,
      totalCash: cashBalance + bankBalance + totalDigitalCash,
      totalReceivables,
      totalPayables,
      netPosition,
      topDebtors,
      topSuppliers
    };
  }, [banks, customers, suppliers, digitalAccounts]);
}
