/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Workflow Engine (v2.1 Patch A.4)
 *
 * Seventh shared engine — approval chains and state transitions.
 * Formalizes what Phase 6's "never auto-post without Owner confirmation" did informally.
 *
 * Given a workflowId (e.g., WORKFLOW_EXPENSE_APPROVAL), moves an entity
 * through a defined sequence of states (Pending → Manager Review → Posted),
 * each transition gated by a role check (via Permission Engine) and optionally
 * triggering an Event Bus event on completion.
 *
 * ARCHITECTURAL RULE:
 * No UI. Pure state machine logic. Firestore persistence is delegated to caller.
 */

import { logger } from '../../logger';
import { WorkflowDefinition, WorkflowInstance, WorkflowState, WorkflowTransition } from './types';

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private workflows: Map<string, WorkflowDefinition> = new Map();

  private constructor() {
    this.seedWorkflows();
  }

  static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  private register(workflow: WorkflowDefinition) {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Gets the workflow definition by ID.
   */
  getWorkflow(workflowId: string): WorkflowDefinition | null {
    return this.workflows.get(workflowId) ?? null;
  }

  /**
   * Gets the initial state for a workflow.
   */
  getInitialState(workflowId: string): WorkflowState | null {
    return this.workflows.get(workflowId)?.initialState ?? null;
  }

  /**
   * Gets all valid transitions from a given state for a workflow.
   */
  getTransitionsFrom(workflowId: string, fromState: WorkflowState): WorkflowTransition[] {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return [];
    return workflow.transitions.filter(t => t.from === fromState);
  }

  /**
   * Validates whether a role can transition an entity from one state to another.
   *
   * @param workflowId - The workflow definition ID
   * @param fromState - Current state
   * @param toState - Target state
   * @param role - User's role (Manager, Owner, Admin)
   * @param entity - The entity being transitioned (for condition evaluation)
   * @returns { valid: boolean, reason?: string }
   */
  validateTransition(
    workflowId: string,
    fromState: WorkflowState,
    toState: WorkflowState,
    role: string,
    entity?: Record<string, any>
  ): { valid: boolean; reason?: string } {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return { valid: false, reason: `Workflow ${workflowId} not found.` };
    }

    // Find the matching transition
    const transition = workflow.transitions.find(
      t => t.from === fromState && t.to === toState
    );

    if (!transition) {
      return {
        valid: false,
        reason: `No transition from ${fromState} to ${toState} in workflow ${workflowId}.`,
      };
    }

    // Check role permission
    const roleLevel = this.getRoleLevel(role);
    const requiredLevel = this.getRoleLevel(transition.requiredRole);
    if (roleLevel < requiredLevel) {
      return {
        valid: false,
        reason: `Role ${role} cannot perform this transition. Requires ${transition.requiredRole}.`,
      };
    }

    // Check condition if defined
    if (transition.condition && entity) {
      if (!transition.condition(entity)) {
        return {
          valid: false,
          reason: `Condition not met for transition ${fromState} → ${toState}.`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Creates a new workflow instance for an entity.
   *
   * @param workflowId - The workflow definition ID
   * @param entityId - The entity being tracked (e.g., expense ID)
   * @returns Initial WorkflowInstance
   */
  createInstance(workflowId: string, entityId: string): WorkflowInstance {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`[WorkflowEngine] Workflow ${workflowId} not found.`);
    }

    return {
      workflowId,
      entityId,
      currentState: workflow.initialState,
      history: [],
    };
  }

  /**
   * Applies a transition to a workflow instance.
   * Returns the updated instance and the event to publish (if any).
   *
   * @param instance - Current workflow instance
   * @param toState - Target state
   * @param userId - User performing the transition
   * @param userRole - User's role
   * @param entity - The entity being transitioned (for condition evaluation)
   * @param reason - Optional reason for the transition
   * @returns { instance, publishEvent? } or throws if invalid
   */
  applyTransition(
    instance: WorkflowInstance,
    toState: WorkflowState,
    userId: string,
    userRole: string,
    entity?: Record<string, any>,
    reason?: string
  ): { instance: WorkflowInstance; publishEvent?: string } {
    const validation = this.validateTransition(
      instance.workflowId,
      instance.currentState,
      toState,
      userRole,
      entity
    );

    if (!validation.valid) {
      throw new Error(`[WorkflowEngine] Transition rejected: ${validation.reason}`);
    }

    const workflow = this.workflows.get(instance.workflowId)!;
    const transition = workflow.transitions.find(
      t => t.from === instance.currentState && t.to === toState
    )!;

    const updatedInstance: WorkflowInstance = {
      ...instance,
      currentState: toState,
      history: [
        ...instance.history,
        {
          fromState: instance.currentState,
          toState,
          userId,
          userRole,
          timestamp: new Date(),
          reason,
        },
      ],
    };

    logger.info(
      `[WorkflowEngine] ${instance.workflowId}: ${instance.currentState} → ${toState} by ${userId} (${userRole})`
    );

    return {
      instance: updatedInstance,
      publishEvent: transition.publishEvent,
    };
  }

  /**
   * Returns all registered workflow IDs.
   */
  getWorkflowIds(): string[] {
    return Array.from(this.workflows.keys());
  }

  /**
   * Returns all registered workflow definitions (metadata only).
   */
  getWorkflowMetadata(): Array<{ id: string; version: string; description: string; entityCollection: string }> {
    return Array.from(this.workflows.values()).map(w => ({
      id: w.id,
      version: w.version,
      description: w.description,
      entityCollection: w.entityCollection,
    }));
  }

  // ──────────────────────────────────────────────
  // ROLE HIERARCHY
  // ──────────────────────────────────────────────

  private getRoleLevel(role: string): number {
    const roleMap: Record<string, number> = {
      'Staff': 0,
      'Cashier': 0,
      'Manager': 1,
      'Owner': 2,
      'Admin': 3,
    };
    return roleMap[role] ?? 0;
  }

  // ──────────────────────────────────────────────
  // SEED WORKFLOWS
  // ──────────────────────────────────────────────

  private seedWorkflows() {
    // 1. Expense Approval Workflow
    // Pending → (Manager approves, if amount < ₨10,000) → Posted
    // Pending → (Manager approves, if amount >= ₨10,000) → OwnerReview → (Owner approves) → Posted
    this.register({
      id: 'WORKFLOW_EXPENSE_APPROVAL',
      version: '1.0.0',
      description: 'Expense approval chain: Manager review, Owner review for amounts >= ₨10,000.',
      entityCollection: 'expenses',
      initialState: 'Pending',
      transitions: [
        {
          from: 'Pending',
          to: 'Posted',
          requiredRole: 'Manager',
          condition: (entity) => Number(entity?.amount) < 10000,
          publishEvent: 'expense.posted',
        },
        {
          from: 'Pending',
          to: 'OwnerReview',
          requiredRole: 'Manager',
          condition: (entity) => Number(entity?.amount) >= 10000,
        },
        {
          from: 'OwnerReview',
          to: 'Posted',
          requiredRole: 'Owner',
          publishEvent: 'expense.posted',
        },
        {
          from: 'Pending',
          to: 'Rejected',
          requiredRole: 'Manager',
        },
        {
          from: 'OwnerReview',
          to: 'Rejected',
          requiredRole: 'Owner',
        },
      ],
    });

    // 2. Supplier Invoice Approval Workflow
    // Pending → (Owner approves) → Posted
    this.register({
      id: 'WORKFLOW_SUPPLIER_INVOICE_APPROVAL',
      version: '1.0.0',
      description: 'Supplier invoice approval: Owner review required for all invoices.',
      entityCollection: 'supplierInvoices',
      initialState: 'Pending',
      transitions: [
        {
          from: 'Pending',
          to: 'Posted',
          requiredRole: 'Owner',
          publishEvent: 'supplierInvoice.posted',
        },
        {
          from: 'Pending',
          to: 'Rejected',
          requiredRole: 'Owner',
        },
      ],
    });

    // 3. Monthly Closing Workflow
    // Pending → (Manager reviews) → OwnerReview → (Owner approves) → Posted
    this.register({
      id: 'WORKFLOW_MONTHLY_CLOSING',
      version: '1.0.0',
      description: 'Monthly closing: Manager review, then Owner approval.',
      entityCollection: 'monthlyClosings',
      initialState: 'Pending',
      transitions: [
        {
          from: 'Pending',
          to: 'OwnerReview',
          requiredRole: 'Manager',
        },
        {
          from: 'OwnerReview',
          to: 'Posted',
          requiredRole: 'Owner',
          publishEvent: 'monthlyClosing.posted',
        },
        {
          from: 'Pending',
          to: 'Rejected',
          requiredRole: 'Manager',
        },
        {
          from: 'OwnerReview',
          to: 'Rejected',
          requiredRole: 'Owner',
        },
      ],
    });
  }
}