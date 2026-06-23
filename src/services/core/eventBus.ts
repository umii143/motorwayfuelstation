/**
import { logger } from '../../lib/logger';
 * FuelPro EOC — Event Bus
 * Lightweight pub/sub system for decoupled module communication.
 * Every operational event is broadcast. Modules subscribe independently.
 * Powered by Umar Ali ⚡
 */

// ─── Event Catalog ────────────────────────────────────────────────────────────

export const EOC_EVENTS = {
  SHIFT_OPENED:           'SHIFT_OPENED',
  SHIFT_CLOSED:           'SHIFT_CLOSED',
  CREDIT_SALE_CREATED:    'CREDIT_SALE_CREATED',
  CREDIT_SALE_REVERSED:   'CREDIT_SALE_REVERSED',
  RECOVERY_RECEIVED:      'RECOVERY_RECEIVED',
  RECOVERY_REVERSED:      'RECOVERY_REVERSED',
  EXPENSE_POSTED:         'EXPENSE_POSTED',
  EXPENSE_REVERSED:       'EXPENSE_REVERSED',
  SUPPLIER_PAYMENT:       'SUPPLIER_PAYMENT',
  SUPPLIER_PAYMENT_REVERSED: 'SUPPLIER_PAYMENT_REVERSED',
  BANK_DEPOSIT:           'BANK_DEPOSIT',
  DIGITAL_PAYMENT:        'DIGITAL_PAYMENT',
  DISCOUNT_POSTED:        'DISCOUNT_POSTED',
  LUBE_SALE_POSTED:       'LUBE_SALE_POSTED',
  PRICE_CHANGED:          'PRICE_CHANGED',
  JOURNAL_POSTED:         'JOURNAL_POSTED',
  JOURNAL_LOCKED:         'JOURNAL_LOCKED',
  APPROVAL_REQUESTED:     'APPROVAL_REQUESTED',
  APPROVAL_GRANTED:       'APPROVAL_GRANTED',
  APPROVAL_REJECTED:      'APPROVAL_REJECTED',
  FRAUD_ALERT:            'FRAUD_ALERT',
  INTEGRITY_WARNING:      'INTEGRITY_WARNING',
  PERIOD_CLOSED:          'PERIOD_CLOSED',
  PERIOD_LOCKED:          'PERIOD_LOCKED',
  BUSINESS_DAY_CLOSED:    'BUSINESS_DAY_CLOSED',
  SNAPSHOT_CREATED:       'SNAPSHOT_CREATED',
  TREASURY_TRANSFER:      'TREASURY_TRANSFER',
  OWNER_DRAWING:          'OWNER_DRAWING',
} as const;

export type EOCEventName = typeof EOC_EVENTS[keyof typeof EOC_EVENTS];

export interface EOCEvent<T = unknown> {
  eventName: EOCEventName;
  payload: T;
  stationId: string;
  branchId: string;
  shiftId?: string;
  timestamp: string;
  triggeredBy: string;
}

type EventHandler<T = unknown> = (event: EOCEvent<T>) => void | Promise<void>;

// ─── Event Bus Implementation ─────────────────────────────────────────────────

class EOCEventBus {
  private handlers: Map<EOCEventName, Set<EventHandler<unknown>>> = new Map();
  private eventLog: EOCEvent[] = [];
  private readonly MAX_LOG_SIZE = 500;

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<T = unknown>(eventName: EOCEventName, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler as EventHandler<unknown>);
    return () => this.off(eventName, handler);
  }

  /** Unsubscribe from an event. */
  off<T = unknown>(eventName: EOCEventName, handler: EventHandler<T>): void {
    this.handlers.get(eventName)?.delete(handler as EventHandler<unknown>);
  }

  /** Subscribe to an event — fires only once. */
  once<T = unknown>(eventName: EOCEventName, handler: EventHandler<T>): void {
    const wrappedHandler: EventHandler<T> = (event) => {
      handler(event);
      this.off(eventName, wrappedHandler);
    };
    this.on(eventName, wrappedHandler);
  }

  /** Emit an event to all registered handlers. */
  emit<T = unknown>(
    eventName: EOCEventName,
    payload: T,
    stationId: string,
    branchId: string,
    triggeredBy: string,
    shiftId?: string
  ): void {
    const event: EOCEvent<T> = {
      eventName,
      payload,
      stationId,
      branchId,
      shiftId,
      timestamp: new Date().toISOString(),
      triggeredBy,
    };

    // Log event
    this.eventLog.push(event as EOCEvent);
    if (this.eventLog.length > this.MAX_LOG_SIZE) {
      this.eventLog.shift();
    }

    // Dispatch to handlers
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (err) {
          logger.error(`[EOCEventBus] Handler error for ${eventName}:`, err);
        }
      });
    }
  }

  /** Get recent event log (for timeline display). */
  getEventLog(limit: number = 50): EOCEvent[] {
    return this.eventLog.slice(-limit).reverse();
  }

  /** Get events for a specific shift. */
  getShiftEvents(shiftId: string): EOCEvent[] {
    return this.eventLog.filter(e => e.shiftId === shiftId);
  }

  /** Clear all handlers (for testing). */
  clearAll(): void {
    this.handlers.clear();
    this.eventLog = [];
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

export const eventBus = new EOCEventBus();
