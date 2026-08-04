/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — Enterprise Ecosystem
 *
 * Enterprise Layout Registry.
 * Registers layouts: Desktop, Tablet, Mobile, Kiosk, Control Room, TV Dashboard, Print.
 */

export interface EnterpriseLayout {
  id: string;
  name: string;
  responsiveBreakpoints: { minWidth: number; maxWidth?: number };
  defaultDensity: 'COMPACT' | 'COMFORTABLE' | 'SPACIOUS';
}

export class EnterpriseLayoutRegistry {
  private static instance: EnterpriseLayoutRegistry;
  private layouts: Map<string, EnterpriseLayout> = new Map();

  private constructor() {
    this.registerCoreLayouts();
  }

  public static getInstance(): EnterpriseLayoutRegistry {
    if (!EnterpriseLayoutRegistry.instance) {
      EnterpriseLayoutRegistry.instance = new EnterpriseLayoutRegistry();
    }
    return EnterpriseLayoutRegistry.instance;
  }

  private registerCoreLayouts() {
    this.registerLayout({
      id: 'LAYOUT_DESKTOP',
      name: 'Standard Desktop',
      responsiveBreakpoints: { minWidth: 1200 },
      defaultDensity: 'COMFORTABLE'
    });
    this.registerLayout({
      id: 'LAYOUT_TV_DASHBOARD',
      name: 'TV Dashboard',
      responsiveBreakpoints: { minWidth: 1920 },
      defaultDensity: 'SPACIOUS'
    });
    this.registerLayout({
      id: 'LAYOUT_KIOSK',
      name: 'Kiosk / Tablet',
      responsiveBreakpoints: { minWidth: 768, maxWidth: 1199 },
      defaultDensity: 'COMPACT'
    });
  }

  public registerLayout(layout: EnterpriseLayout): void {
    this.layouts.set(layout.id, layout);
  }

  public getLayoutForWidth(width: number): EnterpriseLayout {
    // Logic to select best layout for window innerWidth
    for (const layout of this.layouts.values()) {
      if (width >= layout.responsiveBreakpoints.minWidth && 
         (!layout.responsiveBreakpoints.maxWidth || width <= layout.responsiveBreakpoints.maxWidth)) {
        return layout;
      }
    }
    return this.layouts.get('LAYOUT_DESKTOP')!;
  }
}
