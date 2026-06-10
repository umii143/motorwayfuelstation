import { InventorySnapshot } from '../../types';

export const inventoryRevaluationEngine = {
  calculateImpact: (
    snapshot: InventorySnapshot,
    newPrice: number
  ) => {
    const oldPrice = snapshot.currentPrice;
    const difference = newPrice - oldPrice;
    
    // Inventory Gain or Loss
    const inventoryImpact = snapshot.stockQuantity * difference;
    
    const changeType: 'increase' | 'decrease' = difference >= 0 ? 'increase' : 'decrease';

    return {
      oldPrice,
      newPrice,
      difference,
      inventoryImpact,
      changeType
    };
  }
};
