import { Product, Customer, Shift } from '../types';
import { useStation } from '../contexts/StationContext';

export interface AlertNotification {
  id: string;
  type: 'Low Stock' | 'Credit Risk' | 'Shift Variance' | 'Expense Spike';
  level: 'Critical' | 'Warning' | 'Information';
  message: string;
  timestamp: number;
  actionRequired?: boolean;
  actionUrl?: string;
}

export class AutomationEngine {
  /**
   * Run rules engine over current station state.
   * In a real backend, this would run periodically in a worker.
   * Since this is Local-First, we run it on demand (e.g. periodically in a useEffect or on state change).
   */
  static evaluateRules(
    products: Product[],
    customers: Customer[],
    shifts: Shift[]
  ): AlertNotification[] {
    const alerts: AlertNotification[] = [];
    const now = Date.now();

    // RULE 1: Low Stock (If Petrol/Diesel < 5000 Liters)
    // For MVP we just use product.minStock or a hard limit.
    products.forEach(p => {
      // Assuming fuel products have higher thresholds, maybe a hard check
      if (p.type === 'fuel' && p.currentStock < 5000) {
        alerts.push({
          id: `alert_stock_${p.id}_${now}`,
          type: 'Low Stock',
          level: 'Critical',
          message: `${p.name} running critically low: ${p.currentStock.toFixed(0)} Liters remaining.`,
          timestamp: now,
          actionRequired: true,
        });
      } else if (p.currentStock <= p.minStock) {
        alerts.push({
          id: `alert_stock_${p.id}_${now}`,
          type: 'Low Stock',
          level: 'Warning',
          message: `${p.name} stock has reached minimum levels (${p.currentStock.toFixed(0)}).`,
          timestamp: now,
        });
      }
    });

    // RULE 2: High Credit Risk (If Customer Balance > 100,000)
    customers.forEach(c => {
      if (c.balance > 100000) {
        alerts.push({
          id: `alert_credit_${c.id}_${now}`,
          type: 'Credit Risk',
          level: 'Critical',
          message: `${c.name} has exceeded 100,000 PKR pending balance (Current: ${c.balance.toLocaleString()} PKR).`,
          timestamp: now,
          actionRequired: true,
        });
      } else if (c.balance > c.creditLimit) {
        alerts.push({
          id: `alert_credit_${c.id}_${now}`,
          type: 'Credit Risk',
          level: 'Warning',
          message: `${c.name} has exceeded their credit limit.`,
          timestamp: now,
        });
      }
    });

    // RULE 3: Shift Variance (If Variance > 1000 PKR)
    shifts.forEach(s => {
      if (s.status === 'closed' && (s.shortage || 0) < -1000) {
        alerts.push({
          id: `alert_shift_${s.id}_${now}`,
          type: 'Shift Variance',
          level: 'Critical',
          message: `Shift closed on ${s.date} has an unresolved shortage of ${Math.abs(s.shortage).toLocaleString()} PKR. Requires Manager Approval.`,
          timestamp: now,
          actionRequired: true,
        });
      }
    });

    return alerts;
  }

  /**
   * Generates an Executive EOD Summary to be sent via WhatsApp.
   */
  static generateEodSummary(
    shifts: Shift[],
    products: Product[],
    customers: Customer[],
    targetDate: string = new Date().toISOString().split('T')[0]
  ): string {
    const todaysShifts = shifts.filter(s => s.date === targetDate && s.status === 'closed');
    
    // Aggregate Sales by Product type (Petrol, Diesel, Lubricants)
    let petrolSales = 0;
    let dieselSales = 0;
    let lubeSales = 0;
    let totalExpenses = 0;
    let netCash = 0;

    todaysShifts.forEach(shift => {
      // Very rough calculation for MVP based on existing fields
      shift.segments?.forEach(seg => {
        const product = products.find(p => p.id === seg.productId);
        if (product) {
          if (product.name.toLowerCase().includes('petrol')) {
            petrolSales += seg.revenue;
          } else if (product.name.toLowerCase().includes('diesel')) {
            dieselSales += seg.revenue;
          }
        }
      });
      
      shift.lubeSales?.forEach(ls => {
        lubeSales += ls.amount;
      });

      shift.expenseEntries?.forEach(exp => {
        totalExpenses += exp.amount;
      });

      netCash += shift.submittedCash;
    });

    const outstandingCredit = customers.reduce((sum, c) => sum + c.balance, 0);

    const summary = `Daily Sales - ${targetDate}

Petrol:
PKR ${petrolSales.toLocaleString()}

Diesel:
PKR ${dieselSales.toLocaleString()}

Lubricants:
PKR ${lubeSales.toLocaleString()}

Expenses:
PKR ${totalExpenses.toLocaleString()}

Net Cash:
PKR ${netCash.toLocaleString()}

Outstanding Credit:
PKR ${outstandingCredit.toLocaleString()}

⚡ Powered by Umar Ali ⚡`;

    return summary;
  }
}
