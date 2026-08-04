/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Phase 1.2 — Enterprise Ecosystem
 *
 * Enterprise Command Registry.
 * Standardizes direct actions (Print, Export, Share). 
 * Buttons -> Command -> Handler -> Execution.
 */

export interface CommandContext {
  userId: string;
  reportId?: string;
  payload?: any;
}

export type CommandHandler = (context: CommandContext) => Promise<void>;

export class EnterpriseCommandRegistry {
  private static instance: EnterpriseCommandRegistry;
  private commands: Map<string, CommandHandler> = new Map();

  private constructor() {}

  public static getInstance(): EnterpriseCommandRegistry {
    if (!EnterpriseCommandRegistry.instance) {
      EnterpriseCommandRegistry.instance = new EnterpriseCommandRegistry();
    }
    return EnterpriseCommandRegistry.instance;
  }

  public registerCommand(commandId: string, handler: CommandHandler): void {
    if (this.commands.has(commandId)) {
      throw new Error(`[EnterpriseCommandRegistry] Command ${commandId} already registered.`);
    }
    this.commands.set(commandId, handler);
  }

  public async executeCommand(commandId: string, context: CommandContext): Promise<void> {
    const handler = this.commands.get(commandId);
    if (!handler) {
      console.warn(`[EnterpriseCommandRegistry] Unregistered command invoked: ${commandId}`);
      return;
    }
    // Execution intercepts (e.g. Permission checks, Audit logs) go here
    try {
      await handler(context);
    } catch (error) {
      console.error(`[EnterpriseCommandRegistry] Command ${commandId} failed:`, error);
      throw error;
    }
  }
}
