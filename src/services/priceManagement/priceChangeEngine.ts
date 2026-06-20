import { Product, Tank, RateHistoryEntry, JournalEntry } from '../../types';
import { inventorySnapshotEngine } from './inventorySnapshotEngine';
import { inventoryRevaluationEngine } from './inventoryRevaluationEngine';

export const priceChangeEngine = {
  applyPriceChange: (
    product: Product,
    tanks: Tank[],
    newPrice: number,
    userId: string,
    reason: any = 'Manual Correction',
    orgId?: string,
    stationId?: string,
    attachments: any[] = []
  ) => {
    // 1. Calculate Impact first to get oldPrice cleanly
    // Wait, the original code called createSnapshot first, then calculateImpact.
    // Let's get oldPrice from product.
    const oldPrice = product.rate || 0;

    // 2. Create Snapshot
    const snapshot = inventorySnapshotEngine.createSnapshot(product, tanks, userId, oldPrice, newPrice);
    
    // 3. Calculate Impact
    const impact = inventoryRevaluationEngine.calculateImpact(snapshot, newPrice);
    
    // 4. Create Rate History Entry
    const now = new Date();
    const rateHistoryEntry: RateHistoryEntry = {
      id: `rh_${now.getTime()}_${crypto.randomUUID().split('-')[0]}`,
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
      approvalStatus: 'approved',
      reason: reason,
      attachments: attachments,
      createdAt: now.getTime(),
      updatedAt: now.getTime()
    };

    // 4. Create Financial Journal
    let journalEntry: JournalEntry | null = null;
    
    if (impact.inventoryImpact !== 0) {
      journalEntry = {
        id: `jr_rev_${now.getTime()}_${crypto.randomUUID().split('-')[0]}`,
        date: now.toISOString(),
        partyId: product.id,
        partyType: 'asset',
        partyName: product.name,
        type: impact.inventoryImpact > 0 ? 'credit' : 'debit',
        amount: Math.abs(impact.inventoryImpact),
        description: impact.inventoryImpact > 0 
          ? `Inventory Revaluation Gain for ${product.name} (+${impact.difference} PKR/Unit on ${snapshot.stockQuantity} Units)`
          : `Inventory Revaluation Loss for ${product.name} (${impact.difference} PKR/Unit on ${snapshot.stockQuantity} Units)`,
        referenceId: rateHistoryEntry.id,
        orgId,
        stationId,
        businessType: product.type === 'lube' ? 'lube' : 'fuel_station',
        createdAt: now.getTime(),
        updatedAt: now.getTime(),
        isLocked: true // Immutable Revaluation Ledger
      };
    }

    return {
      snapshot,
      rateHistoryEntry,
      journalEntry,
      updatedProduct: { ...product, rate: newPrice }
    };
  }
};
