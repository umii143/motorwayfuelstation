/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Theme
 * Registry: Theme Token Registry
 *
 * Colors must never be hardcoded. 
 * Every chart, widget, and report must use these tokens.
 */

export type ThemeTokenId =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'ACCENT'
  | 'SUCCESS'
  | 'WARNING'
  | 'DANGER'
  | 'INFO'
  | 'MUTED'
  | 'BACKGROUND'
  | 'SURFACE';

export interface ThemeTokenDefinition {
  readonly id: ThemeTokenId;
  readonly cssVariable: string;
  readonly description: string;
  readonly version: string;
}

class ThemeTokenRegistryImpl {
  private readonly tokens: Map<ThemeTokenId, ThemeTokenDefinition> = new Map();

  constructor() {
    this.initializeTokens();
  }

  private register(def: ThemeTokenDefinition): void {
    this.tokens.set(def.id, def);
  }

  get(id: ThemeTokenId): ThemeTokenDefinition {
    const t = this.tokens.get(id);
    if (!t) throw new Error(`Theme Token not found: ${id}`);
    return t;
  }

  private initializeTokens(): void {
    this.register({ id: 'PRIMARY', cssVariable: 'var(--primary-main)', description: 'Brand primary color', version: '1.0.0' });
    this.register({ id: 'SECONDARY', cssVariable: 'var(--secondary-main)', description: 'Brand secondary color', version: '1.0.0' });
    this.register({ id: 'ACCENT', cssVariable: 'var(--color-accent)', description: 'Highlights and interactive elements', version: '1.0.0' });
    this.register({ id: 'SUCCESS', cssVariable: 'var(--color-success)', description: 'Positive trends, approvals', version: '1.0.0' });
    this.register({ id: 'WARNING', cssVariable: 'var(--color-warning)', description: 'Alerts, pending states', version: '1.0.0' });
    this.register({ id: 'DANGER', cssVariable: 'var(--color-error)', description: 'Critical loss, rejection', version: '1.0.0' });
    this.register({ id: 'INFO', cssVariable: 'var(--color-info)', description: 'Informational data', version: '1.0.0' });
    this.register({ id: 'MUTED', cssVariable: 'var(--text-muted)', description: 'Secondary text, inactive elements', version: '1.0.0' });
    this.register({ id: 'BACKGROUND', cssVariable: 'var(--bg-app)', description: 'Main application background', version: '1.0.0' });
    this.register({ id: 'SURFACE', cssVariable: 'var(--bg-card)', description: 'Card and container background', version: '1.0.0' });
  }
}

export const ThemeTokenRegistry = new ThemeTokenRegistryImpl();
