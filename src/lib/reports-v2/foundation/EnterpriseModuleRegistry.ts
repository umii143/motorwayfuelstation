/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — Enterprise Ecosystem
 *
 * Enterprise Module Registry.
 * Every module (Executive, Financial, Operations, etc) must register here.
 */

export interface EnterpriseModule {
  id: string;
  name: string;
  version: string;
  owner: string;
  dependencies: string[];
  permission: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED' | 'BETA';
  route: string;
  icon: string;
  theme: string;
}

export class EnterpriseModuleRegistry {
  private static instance: EnterpriseModuleRegistry;
  private modules: Map<string, EnterpriseModule> = new Map();

  private constructor() {
    this.registerCoreModules();
  }

  public static getInstance(): EnterpriseModuleRegistry {
    if (!EnterpriseModuleRegistry.instance) {
      EnterpriseModuleRegistry.instance = new EnterpriseModuleRegistry();
    }
    return EnterpriseModuleRegistry.instance;
  }

  private registerCoreModules() {
    this.register({
      id: 'MOD-EXEC-01',
      name: 'Executive Intelligence',
      version: '1.0.0',
      owner: 'FuelPro Core Team',
      dependencies: ['QueryEngine', 'DecisionEngine'],
      permission: 'ROLE_ADMIN',
      status: 'ACTIVE',
      route: '/reports/executive',
      icon: 'CROWN',
      theme: 'ExecutiveTheme'
    });
    // Placeholder for Financial, Fuel Operations, Inventory, Treasury, Compliance, AI
  }

  public register(module: EnterpriseModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`[EnterpriseModuleRegistry] Module ${module.id} is already registered.`);
    }
    this.modules.set(module.id, module);
  }

  public getModule(id: string): EnterpriseModule | undefined {
    return this.modules.get(id);
  }

  public getAllModules(): EnterpriseModule[] {
    return Array.from(this.modules.values());
  }
}
