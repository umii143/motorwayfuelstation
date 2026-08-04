/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — Enterprise Ecosystem
 *
 * Enterprise Feature Flag Engine.
 * Controls Feature States (Beta, Production, Deprecated, Experimental, Disabled).
 */

export type FeatureState = 'BETA' | 'PRODUCTION' | 'DEPRECATED' | 'EXPERIMENTAL' | 'DISABLED';

export interface FeatureFlag {
  id: string;
  state: FeatureState;
  description: string;
  enabledByOverride?: boolean;
}

export class EnterpriseFeatureFlags {
  private static instance: EnterpriseFeatureFlags;
  private flags: Map<string, FeatureFlag> = new Map();

  private constructor() {
    this.initializeCoreFlags();
  }

  public static getInstance(): EnterpriseFeatureFlags {
    if (!EnterpriseFeatureFlags.instance) {
      EnterpriseFeatureFlags.instance = new EnterpriseFeatureFlags();
    }
    return EnterpriseFeatureFlags.instance;
  }

  private initializeCoreFlags() {
    this.registerFlag('AI_COPILOT', 'EXPERIMENTAL', 'AI Decision Engine integration');
    this.registerFlag('TIME_MACHINE', 'BETA', 'Historical state playback');
    this.registerFlag('FORECAST_MODULE', 'DISABLED', 'Demand forecasting algorithms');
    this.registerFlag('MULTI_TENANT', 'PRODUCTION', 'Multi-station sync support');
  }

  public registerFlag(id: string, state: FeatureState, description: string): void {
    this.flags.set(id, { id, state, description });
  }

  public isEnabled(id: string): boolean {
    const flag = this.flags.get(id);
    if (!flag) return false;
    
    if (flag.enabledByOverride !== undefined) {
      return flag.enabledByOverride;
    }
    
    return ['PRODUCTION', 'BETA', 'EXPERIMENTAL'].includes(flag.state);
  }

  public setOverride(id: string, override: boolean): void {
    const flag = this.flags.get(id);
    if (flag) {
      flag.enabledByOverride = override;
    }
  }
}
