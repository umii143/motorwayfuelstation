/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — Enterprise Ecosystem
 *
 * Enterprise Event Bus.
 * Global Pub/Sub to decouple React Components.
 */

type EventCallback = (payload: any) => void;

export class EnterpriseEventBus {
  private static instance: EnterpriseEventBus;
  private listeners: Map<string, EventCallback[]> = new Map();

  private constructor() {}

  public static getInstance(): EnterpriseEventBus {
    if (!EnterpriseEventBus.instance) {
      EnterpriseEventBus.instance = new EnterpriseEventBus();
    }
    return EnterpriseEventBus.instance;
  }

  public subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        this.listeners.set(eventType, callbacks.filter(cb => cb !== callback));
      }
    };
  }

  public publish(eventType: string, payload: any): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[EnterpriseEventBus] Error in listener for ${eventType}:`, e);
        }
      });
    }
  }
}
