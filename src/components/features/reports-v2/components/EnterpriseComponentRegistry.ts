/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.3 — Enterprise Component Library Framework
 *
 * Enterprise Component Registry.
 * Every reusable ECL component must register itself here.
 */

export interface EnterpriseComponent {
  id: string;
  version: string;
  owner: string;
  category: 'CARD' | 'CHART' | 'REGISTER' | 'TIMELINE' | 'DRILLDOWN' | 'LAYOUT' | 'ANALYTICS' | 'EXPORT' | 'PRINT' | 'AUDIT' | 'COMMON';
  status: 'PRODUCTION' | 'BETA' | 'DEPRECATED';
  accessibility: 'WCAG_AA' | 'WCAG_AAA' | 'PENDING';
  themeSupport: boolean;
}

export class EnterpriseComponentRegistry {
  private static instance: EnterpriseComponentRegistry;
  private components: Map<string, EnterpriseComponent> = new Map();

  private constructor() {}

  public static getInstance(): EnterpriseComponentRegistry {
    if (!EnterpriseComponentRegistry.instance) {
      EnterpriseComponentRegistry.instance = new EnterpriseComponentRegistry();
    }
    return EnterpriseComponentRegistry.instance;
  }

  public register(component: EnterpriseComponent): void {
    if (this.components.has(component.id)) {
      console.warn(`[ECL Registry] Component ${component.id} is already registered.`);
      return;
    }
    this.components.set(component.id, component);
  }

  public getComponentInfo(id: string): EnterpriseComponent | undefined {
    return this.components.get(id);
  }

  public getAllComponents(): EnterpriseComponent[] {
    return Array.from(this.components.values());
  }
}
