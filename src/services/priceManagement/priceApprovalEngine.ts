import { RateHistoryEntry, InventorySnapshot, Product, Tank } from '../../types';
import { inventorySnapshotEngine } from './inventorySnapshotEngine';
import { inventoryRevaluationEngine } from './inventoryRevaluationEngine';

export const priceApprovalEngine = {
  createRequest: (
    product: Product,
    tanks: Tank[],
    newPrice: number,
    userId: string,
    reason: any = 'Manual Correction',
    attachments: any[] = []
  ): { snapshot: InventorySnapshot; rateHistoryEntry: RateHistoryEntry } => {
    const oldPrice = product.rate || 0;

    // 1. Create Snapshot
    const snapshot = inventorySnapshotEngine.createSnapshot(product, tanks, userId, oldPrice, newPrice);
    
    // 2. Calculate Impact
    const impact = inventoryRevaluationEngine.calculateImpact(snapshot, newPrice);
    
    // 3. Create Pending Rate History Entry
    const now = new Date();
    const rateHistoryEntry: RateHistoryEntry = {
      id: `rh_${now.getTime()}_${Math.random().toString(36).substring(2, 5)}`,
      productId: product.id,
      productName: product.name,
      oldPrice: impact.oldPrice,
      newPrice: impact.newPrice,
      difference: impact.difference,
      changeType: impact.changeType,
      stockAtTimeOfChange: snapshot.stockQuantity,
      inventoryImpact: impact.inventoryImpact,
      snapshotId: snapshot.id,
      effectiveDate: now.toISOString().split('T')[0],
      effectiveTime: now.toTimeString().split(' ')[0],
      changedBy: userId,
      approvalStatus: 'pending',
      reason: reason,
      attachments: attachments,
      createdAt: now.getTime(),
      updatedAt: now.getTime()
    };

    return {
      snapshot,
      rateHistoryEntry
    };
  }
};
