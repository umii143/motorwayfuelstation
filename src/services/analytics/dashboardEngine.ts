import { Shift, Product, Customer, Nozzle, LubePosSale } from '../../types';

export const getFuelCategory = (productId: string, products: Product[]): 'petrol' | 'diesel' | 'cng' | null => {
  const p = products.find((prod) => prod.id === productId);
  if (!p) return null;
  if (p.type !== 'fuel') return null;

  const idLower = p.id.toLowerCase();
  const nameLower = p.name.toLowerCase();

  if (
    idLower === 'petrol' ||
    idLower === 'prod_f1' ||
    idLower === 'prod_f3' ||
    nameLower.includes('petrol') ||
    nameLower.includes('pmg') ||
    nameLower.includes('hobc') ||
    nameLower.includes('octane') ||
    nameLower.includes('super')
  ) {
    return 'petrol';
  }
  if (
    idLower === 'diesel' ||
    idLower === 'prod_f2' ||
    nameLower.includes('diesel') ||
    nameLower.includes('hsd')
  ) {
    return 'diesel';
  }
  if (
    idLower === 'cng' ||
    nameLower.includes('cng') ||
    nameLower.includes('gas')
  ) {
    return 'cng';
  }
  return null;
};

export const generateDashboardStats = (
  selectedDate: string,
  shifts: Shift[],
  products: Product[],
  customers: Customer[],
  nozzles: Nozzle[],
  isLube: boolean,
  lubePosSales: LubePosSale[]
) => {
  let totalSalesVal = 0;
  let estimatedMargin = 0;
  let expectedCashOnHand = 0;

  if (isLube) {
    const salesOnDate = lubePosSales.filter((sale) => sale.date === selectedDate);
    salesOnDate.forEach((sale) => {
      totalSalesVal += sale.total;
      estimatedMargin += sale.items.reduce((sum, item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        const marginRate = product?.type === 'lube' ? 0.22 : 0.18;
        return sum + item.lineTotal * marginRate;
      }, 0);
      if (sale.paymentMode === 'cash') expectedCashOnHand += sale.total;
    });
  } else {
    const shiftsOnDate = shifts.filter(s => s.date === selectedDate);
    const petrolProduct = products.find(p => getFuelCategory(p.id, products) === 'petrol');
    const dieselProduct = products.find(p => getFuelCategory(p.id, products) === 'diesel');
    const cngProduct = products.find(p => getFuelCategory(p.id, products) === 'cng');

    const petrolRate = petrolProduct?.rate || 272.50;
    const dieselRate = dieselProduct?.rate || 281.20;
    const cngRate = cngProduct?.rate || 210.00;

    shiftsOnDate.forEach(s => {
      let petrolLiters = 0;
      let dieselLiters = 0;
      let cngKgs = 0;

      nozzles.forEach(nz => {
        const open = s.openingReadings?.[nz.id] || 0;
        const close = s.status === 'closed' ? (s.closingReadings?.[nz.id] || 0) : (nz.currentReading || open);
        const diff = Math.max(0, close - open);
        const fuelCat = getFuelCategory(nz.productId, products);
        if (fuelCat === 'petrol') petrolLiters += diff;
        else if (fuelCat === 'diesel') dieselLiters += diff;
        else if (fuelCat === 'cng') cngKgs += diff;
      });

      petrolLiters = Math.max(0, petrolLiters - (s.testLiters?.petrol || 0));
      dieselLiters = Math.max(0, dieselLiters - (s.testLiters?.diesel || 0));
      cngKgs = Math.max(0, cngKgs - (s.testLiters?.cng || 0));

      const petrolSales = petrolLiters * petrolRate;
      const dieselSales = dieselLiters * dieselRate;
      const cngSales = cngKgs * cngRate;

      const grossShiftSales = petrolSales + dieselSales + cngSales;
      totalSalesVal += grossShiftSales;
      estimatedMargin += grossShiftSales * 0.045;

      if (s.status === 'closed') {
        expectedCashOnHand += s.submittedCash;
      } else {
        expectedCashOnHand += (grossShiftSales
          + (s.recoveryEntries?.reduce((acc, r) => acc + r.amount, 0) || 0)
          - (s.debitEntries?.reduce((acc, d) => acc + d.amount, 0) || 0)
          - (s.expenseEntries?.reduce((acc, e) => acc + e.amount, 0) || 0)
          - (s.supplierPayments?.reduce((acc, p) => acc + p.amount, 0) || 0)
          - (s.bankCashEntries?.reduce((acc, b) => acc + b.amount, 0) || 0)
          - (s.digitalCashEntries?.reduce((acc, d) => acc + d.amount, 0) || 0));
      }
    });
  }

  const totalDueRecovery = customers.reduce((acc, c) => acc + c.balance, 0);

  return {
    totalSales: totalSalesVal,
    margin: estimatedMargin,
    cashOnHand: expectedCashOnHand,
    dueRecovery: totalDueRecovery
  };
};
