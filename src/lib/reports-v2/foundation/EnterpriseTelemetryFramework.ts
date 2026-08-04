/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — Enterprise Ecosystem
 *
 * Enterprise Telemetry Framework.
 * Measures Report Open Time, Render Time, Error Rate, Memory Usage.
 */

export interface TelemetryMetric {
  metricName: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  tags: Record<string, string>;
  timestamp: string;
}

export class EnterpriseTelemetryFramework {
  private static instance: EnterpriseTelemetryFramework;
  private metricsQueue: TelemetryMetric[] = [];

  private constructor() {
    // In production, setup batch shipping to observability backend
  }

  public static getInstance(): EnterpriseTelemetryFramework {
    if (!EnterpriseTelemetryFramework.instance) {
      EnterpriseTelemetryFramework.instance = new EnterpriseTelemetryFramework();
    }
    return EnterpriseTelemetryFramework.instance;
  }

  public recordMetric(metricName: string, value: number, unit: 'ms' | 'bytes' | 'count' | 'percent', tags: Record<string, string> = {}): void {
    const metric: TelemetryMetric = {
      metricName,
      value,
      unit,
      tags,
      timestamp: new Date().toISOString()
    };
    this.metricsQueue.push(metric);
    
    if (this.metricsQueue.length >= 100) {
      this.flushQueue();
    }
  }

  public startTimer(metricName: string, tags: Record<string, string> = {}): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(metricName, duration, 'ms', tags);
    };
  }

  private flushQueue(): void {
    // Ship to telemetry backend
    this.metricsQueue = [];
  }
}
