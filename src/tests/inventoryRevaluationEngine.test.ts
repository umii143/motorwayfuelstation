import { describe, it, expect } from 'vitest';
import { inventoryRevaluationEngine } from '../services/priceManagement/inventoryRevaluationEngine';
import { InventorySnapshot } from '../types';

describe('inventoryRevaluationEngine', () => {
  it('should correctly calculate impact for a price increase', () => {
    const snapshot: InventorySnapshot = {
      id: 'snap1',
      productId: 'prod1',
      snapshotDate: '2023-01-01',
      snapshotTime: '12:00',
      productName: 'Product 1',
      stockQuantity: 1000,
      currentPrice: 200,
      inventoryValue: 200000,
      createdBy: 'user1',
      tankDetails: []
    };

    const newPrice = 250;
    const result = inventoryRevaluationEngine.calculateImpact(snapshot, newPrice);

    expect(result.oldPrice).toBe(200);
    expect(result.newPrice).toBe(250);
    expect(result.difference).toBe(50);
    expect(result.inventoryImpact).toBe(50000); // 1000 * 50
    expect(result.changeType).toBe('increase');
  });

  it('should correctly calculate impact for a price decrease', () => {
    const snapshot: InventorySnapshot = {
      id: 'snap2',
      productId: 'prod1',
      snapshotDate: '2023-01-01',
      snapshotTime: '12:00',
      productName: 'Product 1',
      stockQuantity: 500,
      currentPrice: 300,
      inventoryValue: 150000,
      createdBy: 'user1',
      tankDetails: []
    };

    const newPrice = 250;
    const result = inventoryRevaluationEngine.calculateImpact(snapshot, newPrice);

    expect(result.oldPrice).toBe(300);
    expect(result.newPrice).toBe(250);
    expect(result.difference).toBe(-50);
    expect(result.inventoryImpact).toBe(-25000); // 500 * -50
    expect(result.changeType).toBe('decrease');
  });
});
