/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Business Graph Engine
 *
 * The unified relationship spine for FuelPro OS. Every entity
 * (Customer, Supplier, Shift, Product, Tank, Nozzle, Invoice, Payment,
 * Expense, Ledger, Journal, Audit, Roznamcha, Staff, Batch) becomes a
 * graph node and is connected with typed edges. Any record can resolve
 * its full neighbourhood so users never lose context when drilling down.
 *
 *   Invoice → Customer → Ledger → Payment → Journal → Audit →
 *   Roznamcha → Shift → Tank → Nozzle → Product
 */

import { GraphNode, GraphEdge, GraphNodeKind, EntityRef } from '../types/search.types';
import { GlobalSettings, Shift, Product, Customer, Supplier, Tank, Nozzle, BankAccount, DigitalAccount, Staff } from '../types';

export interface GraphData {
  settings: GlobalSettings;
  shifts: Shift[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  tanks: Tank[];
  nozzles: Nozzle[];
  banks: BankAccount[];
  digitalAccounts: DigitalAccount[];
  staff: Staff[];
  lubePosSales?: any[];
  activityLogs?: any[];
  cogsRecords?: any[];
}

const nodeId = (kind: GraphNodeKind, id: string) => `${kind}:${id}`;

export function buildGraph(data: GraphData): { nodes: Map<string, GraphNode>; edges: GraphEdge[] } {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const add = (n: GraphNode) => { nodes.set(n.id, n); return n; };
  const link = (from: string, to: string, relation: string) => edges.push({ from, to, relation });

  // ── Customers ──
  data.customers.forEach(c => {
    add({ id: nodeId('customer', c.id), kind: 'customer', label: c.name, sublabel: c.contact || 'Customer', meta: c.balance ? `Bal ${c.balance}` : undefined, viewId: 'customers', contextData: { customerId: c.id } });
  });

  // ── Suppliers ──
  data.suppliers.forEach(s => {
    add({ id: nodeId('supplier', s.id), kind: 'supplier', label: s.name, sublabel: s.contact || 'Supplier', meta: s.balance ? `Payable ${s.balance}` : undefined, viewId: 'suppliers', contextData: { supplierId: s.id } });
  });

  // ── Staff ──
  data.staff.forEach(st => {
    add({ id: nodeId('staff', st.id), kind: 'staff', label: st.name, sublabel: st.role, viewId: 'staff_payroll', contextData: { staffId: st.id } });
  });

  // ── Products ──
  data.products.forEach(p => {
    add({ id: nodeId('product', p.id), kind: 'product', label: p.name, sublabel: `${p.type} • Rs.${p.rate}`, meta: `${p.currentStock} ${p.unit}`, viewId: 'inventory', contextData: { productId: p.id } });
  });

  // ── Tanks ──
  data.tanks.forEach(t => {
    const prod = data.products.find(p => p.id === t.productId);
    add({ id: nodeId('tank', t.id), kind: 'tank', label: t.name, sublabel: prod?.name || t.productId, meta: `${t.currentStock}/${t.capacity} L`, viewId: 'fuel_stock', contextData: { tankId: t.id } });
    if (prod) link(nodeId('tank', t.id), nodeId('product', t.productId), 'STORES');
  });

  // ── Nozzles ──
  data.nozzles.forEach(n => {
    const prod = data.products.find(p => p.id === n.productId);
    add({ id: nodeId('nozzle', n.id), kind: 'nozzle', label: n.name, sublabel: prod?.name || n.productId, viewId: 'inventory', contextData: { nozzleId: n.id } });
    if (prod) link(nodeId('nozzle', n.id), nodeId('product', n.productId), 'DISPENSES');
    if (n.tankId) link(nodeId('nozzle', n.id), nodeId('tank', n.tankId), 'FED_BY');
  });

  // ── Shifts + invoices ──
  data.shifts.forEach(s => {
    const op = data.staff.find(st => st.id === s.staffId);
    add({ id: nodeId('shift', s.id), kind: 'shift', label: `Shift #${s.id}`, sublabel: `${s.date} • ${op?.name || s.staffId}`, meta: s.status, viewId: 'shift_intelligence', contextData: { shiftId: s.id } });

    if (op) link(nodeId('shift', s.id), nodeId('staff', s.staffId), 'OPERATED_BY');

    // Credit (debit) entries → customer
    (s.debitEntries || []).forEach(d => {
      const inv = add({ id: nodeId('invoice', `deb_${d.id}`), kind: 'invoice', label: `Credit Sale ${d.slipNumber || d.id}`, sublabel: `${d.quantity} × ${d.rate}`, meta: `Rs.${d.amount}`, viewId: 'customers', contextData: { customerId: d.customerId } });
      if (d.customerId) { const cn = nodeId('customer', d.customerId); if (nodes.has(cn)) link(inv.id, cn, 'CREDITED_TO'); }
      link(inv.id, nodeId('shift', s.id), 'RECORDED_IN');
    });

    // Recovery entries → customer + payment
    (s.recoveryEntries || []).forEach(r => {
      const pay = add({ id: nodeId('payment', `rec_${r.id}`), kind: 'payment', label: `Recovery ${r.receiptNumber || r.id}`, sublabel: `${r.mode}`, meta: `Rs.${r.amount}`, viewId: 'customers', contextData: { customerId: r.customerId } });
      if (r.customerId) { const cn = nodeId('customer', r.customerId); if (nodes.has(cn)) link(pay.id, cn, 'RECOVERED_FROM'); }
      link(pay.id, nodeId('shift', s.id), 'RECORDED_IN');
    });

    // Expense entries → expense node
    (s.expenseEntries || []).forEach(e => {
      const exp = add({ id: nodeId('expense', e.id), kind: 'expense', label: `Expense ${e.categoryName || e.category || 'Misc'}`, sublabel: e.description, meta: `Rs.${e.amount}`, viewId: 'expenses', contextData: { expenseId: e.id } });
      link(exp.id, nodeId('shift', s.id), 'INCURRED_IN');
    });

    // Bank deposits → bank invoice
    (s.bankCashEntries || []).forEach(b => {
      const dep = add({ id: nodeId('invoice', `bank_${b.id}`), kind: 'invoice', label: `Bank Deposit ${b.reference || b.id}`, sublabel: data.banks.find(x => x.id === b.bankAccountId)?.name || 'Bank', meta: `Rs.${b.amount}`, viewId: 'bank_cash', contextData: { bankId: b.bankAccountId } });
      link(dep.id, nodeId('shift', s.id), 'DEPOSITED_IN');
    });

    // Digital payments
    (s.digitalCashEntries || []).forEach(d => {
      const dig = add({ id: nodeId('invoice', `dig_${d.id}`), kind: 'invoice', label: `Digital ${d.method}`, sublabel: d.transactionId, meta: `Rs.${d.amount}`, viewId: 'digital_cash', contextData: { digitalId: d.id } });
      link(dig.id, nodeId('shift', s.id), 'RECORDED_IN');
    });
  });

  // ── Lube POS sales (invoices) ──
  (data.lubePosSales || []).forEach(sale => {
    const inv = add({ id: nodeId('invoice', `lube_${sale.id}`), kind: 'invoice', label: `Lube Invoice ${sale.invoiceNo}`, sublabel: `${sale.paymentMode}`, meta: `Rs.${sale.total}`, viewId: 'lube_pos', contextData: { saleId: sale.id } });
    if (sale.customerId) { const cn = nodeId('customer', sale.customerId); if (nodes.has(cn)) link(inv.id, cn, 'SOLD_TO'); }
    if (sale.shiftId) { const sn = nodeId('shift', sale.shiftId); if (nodes.has(sn)) link(inv.id, sn, 'RECORDED_IN'); }
  });

  // ── Activity / Roznamcha logs ──
  (data.activityLogs || []).forEach(log => {
    const ref = log.relatedTransactionId;
    if (!ref) return;
    // Try to attach audit node to a known entity id
    const cand = [...nodes.keys()].find(k => k.endsWith(`:${ref}`) || k.includes(ref));
    if (cand) {
      const auditId = nodeId('audit', log.id);
      add({ id: auditId, kind: 'audit', label: `Audit: ${log.action}`, sublabel: log.category, viewId: 'activity_register', contextData: { logId: log.id } });
      link(auditId, cand, 'LOGGED_FOR');
      // roznamcha alias
      const rozId = nodeId('roznamcha', log.id);
      add({ id: rozId, kind: 'roznamcha', label: `Roznamcha: ${log.action}`, sublabel: log.timestamp, viewId: 'activity_register', contextData: { logId: log.id } });
      link(rozId, cand, 'EVENT_FOR');
    }
  });

  return { nodes, edges };
}

/** Resolve the full relationship trail for any entity reference. */
export function resolveTrail(
  ref: EntityRef,
  graph: { nodes: Map<string, GraphNode>; edges: GraphEdge[] }
): GraphNode[] {
  const startId = nodeId(ref.kind as GraphNodeKind, ref.id);
  if (!graph.nodes.has(startId)) return [];

  // BFS up to depth 2 to collect a meaningful neighbourhood
  const visited = new Set<string>([startId]);
  const queue = [startId];
  const found: string[] = [];

  for (let depth = 0; depth < 2 && queue.length; depth++) {
    const next: string[] = [];
    for (const cur of queue) {
      graph.edges.forEach(e => {
        const other = e.from === cur ? e.to : e.to === cur ? e.from : null;
        if (other && !visited.has(other)) {
          visited.add(other);
          found.push(other);
          next.push(other);
        }
      });
    }
    queue.push(...next);
  }

  const nodes = [graph.nodes.get(startId)!, ...found.map(id => graph.nodes.get(id)!).filter(Boolean)];
  return nodes;
}

/** Count of directly connected entities (for "linked records" badges). */
export function degreeOf(ref: EntityRef, graph: { nodes: Map<string, GraphNode>; edges: GraphEdge[] }): number {
  const id = nodeId(ref.kind as GraphNodeKind, ref.id);
  return graph.edges.filter(e => e.from === id || e.to === id).length;
}
