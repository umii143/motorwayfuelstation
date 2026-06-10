import { InventorySnapshot, Product, Tank, TankSnapshotDetail } from '../../types';

export const inventorySnapshotEngine = {
  createSnapshot: (
    product: Product,
    tanks: Tank[],
    userId: string,
    oldPrice: number,
    newPrice: number
  ): InventorySnapshot => {
    // 1. Gather tank-wise stock
    const relevantTanks = tanks.filter(t => t.productId === product.id);
    
    let totalStock = 0;
    const tankDetails: TankSnapshotDetail[] = [];

    if (relevantTanks.length > 0) {
      relevantTanks.forEach(t => {
        const stock = t.currentStock || 0;
        totalStock += stock;
        tankDetails.push({
          tankId: t.id,
          tankName: t.name,
          stockQuantity: stock,
          // waterLevel and temperature can be populated if we integrate ATG later
        });
      });
    } else {
      // Fallback if no tanks configured for this product
      totalStock = product.currentStock || 0;
    }
    
    // 2. Value based on before and after rates
    const snapshotValueBefore = totalStock * oldPrice;
    const snapshotValueAfter = totalStock * newPrice;

    // 3. Generate snapshot
    const now = new Date();
    return {
      id: `snap_${now.getTime()}_${Math.random().toString(36).substring(2, 5)}`,
      snapshotDate: now.toISOString().split('T')[0],
      snapshotTime: now.toTimeString().split(' ')[0],
      productId: product.id,
      productName: product.name,
      stockQuantity: totalStock,
      currentPrice: newPrice,
      inventoryValue: snapshotValueAfter, // Current value is the new value
      snapshotValueBefore,
      snapshotValueAfter,
      tankDetails,
      createdBy: userId,
      createdAt: now.getTime(),
      updatedAt: now.getTime()
    };
  }
};
