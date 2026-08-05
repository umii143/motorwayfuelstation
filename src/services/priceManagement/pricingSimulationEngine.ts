import { Product, Tank } from '../../types';

export interface PricingSimulationResult {
  productId: string;
  productName: string;
  currentRate: number;
  proposedRate: number;
  rateDelta: number;
  stockVolume: number;
  oldValuation: number;
  newValuation: number;
  inventoryGainLoss: number;
  oldDealerMargin: number;
  newDealerMargin: number;
  dealerMarginDelta: number;
  projectedMonthlyProfitImpact: number;
  journalEntryPreview: {
    debitAccount: string;
    creditAccount: string;
    amount: number;
    description: string;
  };
}

export const pricingSimulationEngine = {
  simulatePriceRevision: (
    product: Product,
    proposedRate: number,
    tanks: Tank[] = []
  ): PricingSimulationResult => {
    const currentRate = product.rate || 285.45;
    const rateDelta = proposedRate - currentRate;

    // Sum stock volume across associated tanks or use product currentStock
    const productTanks = tanks.filter((t) => t.productId === product.id);
    const tankStock = productTanks.reduce((sum, t) => sum + (t.currentStock || (t as any).currentLevel || 0), 0);
    const stockVolume = tankStock > 0 ? tankStock : (product.currentStock || 20500);

    const oldValuation = stockVolume * currentRate;
    const newValuation = stockVolume * proposedRate;
    const inventoryGainLoss = newValuation - oldValuation;

    const oldDealerMargin = product.dealerMarginPerUnit || 8.64;
    const newDealerMargin = oldDealerMargin + (rateDelta * 0.4); // Estimated 40% margin adjustment
    const dealerMarginDelta = newDealerMargin - oldDealerMargin;

    // Projected monthly sales volume estimated at 120,000 Liters
    const monthlyVolume = 120000;
    const projectedMonthlyProfitImpact = monthlyVolume * dealerMarginDelta + inventoryGainLoss;

    return {
      productId: product.id,
      productName: product.name,
      currentRate,
      proposedRate,
      rateDelta,
      stockVolume,
      oldValuation,
      newValuation,
      inventoryGainLoss,
      oldDealerMargin,
      newDealerMargin,
      dealerMarginDelta,
      projectedMonthlyProfitImpact,
      journalEntryPreview: {
        debitAccount: inventoryGainLoss >= 0 ? '1100-Fuel Inventory Asset' : '5200-Inventory Loss Account',
        creditAccount: inventoryGainLoss >= 0 ? '4200-Inventory Revaluation Gain Account' : '1100-Fuel Inventory Asset',
        amount: Math.abs(inventoryGainLoss),
        description: `Rule #173 Revaluation Gain/Loss on price update of ${product.name} from Rs. ${currentRate} to Rs. ${proposedRate} (Stock: ${stockVolume.toLocaleString()} L)`
      }
    };
  }
};
