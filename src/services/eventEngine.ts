/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise Business Event Engine
 *
 * Single source of truth. Every operation emits a standardized BusinessEvent
 * via `EventEngine.emit(...)`. Events are persisted per-station, mirrored
 * into the legacy activity register for backward compatibility, and carry
 * Business Graph entity references so Roznamcha → Graph → everything is linked.
 *
 * Architecture rule: nothing bypasses the Event Engine.
 * Operation → EventEngine.emit → Digital Roznamcha → Business Graph
 */

import { BusinessEvent, BusinessEventType, EventEntityRef, EventSeverity, EventApprovalStatus } from '../types';
import { db } from '../data/db';
import { useAuthStore } from '../stores/useAuthStore';
import { AuditLogger } from './auditLogger';
import { logger } from '../lib/logger';

export interface EmitOptions {
 eventType: BusinessEventType;
 module: string;
 summary: string;
 entity?: EventEntityRef;
 relatedEntities?: EventEntityRef[];
 oldValue?: any;
 newValue?: any;
 reason?: string;
 referenceNumber?: string;
 attachments?: { name: string; url: string; type: string }[];
 gps?: { lat: number; lng: number };
 severity?: EventSeverity;
 tags?: string[];
 approvalStatus?: EventApprovalStatus;
 amount?: number;
 shiftId?: string;
 stationId?: string;
 stationName?: string;
 userId?: string;
 skipLegacy?: boolean; // when true, do not also write to old activity register
}

// Human-readable event labels (en/ur handled at UI layer)
export const EVENT_LABELS: Record<BusinessEventType, string> = {
 SHIFT_OPENED: 'Shift Opened',
 SHIFT_CLOSED: 'Shift Closed',
 SHIFT_FINALIZED: 'Shift Finalized',
 SALE_CREATED: 'Fuel Sale',
 SALE_VOIDED: 'Sale Voided',
 LUBE_SALE_CREATED: 'Lube Sale',
 CUSTOMER_CREATED: 'Customer Created',
 CUSTOMER_UPDATED: 'Customer Updated',
 SUPPLIER_PAYMENT: 'Supplier Payment',
 PRICE_CHANGED: 'Price Changed',
 BANK_DEPOSIT: 'Bank Deposit',
 DIGITAL_PAYMENT: 'Digital Payment',
 EXPENSE_ADDED: 'Expense Added',
 EXPENSE_APPROVED: 'Expense Approved',
 TANK_DELIVERY: 'Tank Delivery',
 TANK_DIP: 'Tank Dip Reading',
 NOZZLE_READING: 'Nozzle Reading',
 METER_READING: 'Meter Reading',
 INVENTORY_ADJUSTMENT: 'Inventory Adjustment',
 STOCK_TRANSFER: 'Stock Transfer',
 PRODUCT_CREATED: 'Product Created',
 PRODUCT_UPDATED: 'Product Updated',
 CREDIT_SALE: 'Credit Sale',
 RECOVERY_RECEIVED: 'Customer Recovery',
 CASH_DEPOSIT: 'Cash Deposit',
 JOURNAL_ENTRY: 'Journal Entry',
 LOGIN: 'User Login',
 PERMISSION_CHANGED: 'Permission Changed',
 SETTINGS_CHANGED: 'Settings Changed',
 BACKUP_CREATED: 'Backup Created',
 REPORT_EXPORTED: 'Report Exported',
 METER_RESET: 'Meter Reset'
};

export const EventEngine = {
 /** Emit + persist a standardized business event. */
 emit(opts: EmitOptions): BusinessEvent {
 const auth = useAuthStore.getState();
 const user = auth.user;
 const stationId = opts.stationId || db.getActiveStationId();
 const now = new Date();

 const event: BusinessEvent = {
 id: `evt_${Date.now()}_${crypto.randomUUID().split('-')[0]}`,
 eventType: opts.eventType,
 timestamp: now.toISOString().replace('T', ' ').slice(0, 19),
 businessDate: new Date().toISOString().slice(0, 10),
 shiftId: opts.shiftId,
 userId: user?.userId || opts.userId || 'system',
 userName: user?.name || 'System',
 userRole: user?.role || 'System',
 stationId,
 stationName: opts.stationName,
 module: opts.module,
 entity: opts.entity,
 relatedEntities: opts.relatedEntities,
 oldValue: opts.oldValue,
 newValue: opts.newValue,
 reason: opts.reason,
 referenceNumber: opts.referenceNumber,
 attachments: opts.attachments,
 gps: opts.gps,
 device: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
 ip: 'Client',
 severity: opts.severity || 'info',
 tags: opts.tags,
 approvalStatus: opts.approvalStatus || 'not_required',
 amount: opts.amount,
 summary: opts.summary,
 createdAt: now.getTime(),
 updatedAt: now.getTime()
 };

 // Persist to per-station event store (single source of truth)
 try {
 const existing = db.getBusinessEvents(stationId) || [];
 const updated = [event, ...existing].slice(0, 20000);
 db.saveBusinessEvents(stationId, updated);
 } catch (err) {
 logger.error('EventEngine: failed to persist event', err);
 }

 // Mirror into legacy activity register for backward compatibility
 if (!opts.skipLegacy) {
 AuditLogger.logAction(
 EVENT_LABELS[opts.eventType],
 opts.module,
 opts.summary,
 opts.oldValue,
 opts.newValue,
 undefined,
 stationId,
 opts.reason,
 opts.referenceNumber
 );
 }

 logger.info('📡 [Business Event]', event.eventType, event.summary);
 return event;
 },

 /** Read all events for a station (optionally filtered). */
 list(stationId?: string, filter?: (e: BusinessEvent) => boolean): BusinessEvent[] {
 const sid = stationId || db.getActiveStationId();
 const all = (db.getBusinessEvents(sid) || []) as BusinessEvent[];
 return filter ? all.filter(filter) : all;
 },

 /** Events for a specific business date. */
 forDate(stationId: string, businessDate: string): BusinessEvent[] {
 return EventEngine.list(stationId, e => e.businessDate === businessDate);
 },

 /** Events linked to a given Business Graph entity. */
 forEntity(stationId: string, kind: string, id: string): BusinessEvent[] {
 return EventEngine.list(stationId, e =>
 e.entity?.kind === kind && e.entity?.id === id ||
 (e.relatedEntities || []).some(r => r.kind === kind && r.id === id)
 );
 }
};
