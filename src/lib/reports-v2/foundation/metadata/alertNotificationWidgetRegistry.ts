/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0
 * Domain: Metadata
 * Registry: Alert & Notification Registries
 */

// ==========================================
// Alert Registry
// ==========================================

export interface AlertDefinition {
  readonly id: string;
  readonly nameEn: string;
  readonly nameUr: string;
  readonly severity: 'INFO' | 'WARNING' | 'CRITICAL';
  readonly conditionField: string;
  readonly defaultThreshold: number;
  readonly ownerRole: string;
  readonly version: string;
}

class AlertRegistryImpl {
  private readonly alerts: Map<string, AlertDefinition> = new Map();
  constructor() {
    this.alerts.set('ALERT_LOW_MARGIN', {
      id: 'ALERT_LOW_MARGIN', nameEn: 'Low Gross Margin', nameUr: 'کم منافع',
      severity: 'WARNING', conditionField: 'grossMarginPercent', defaultThreshold: 2.0, ownerRole: 'manager', version: '1.0.0'
    });
    this.alerts.set('ALERT_CRITICAL_LOSS', {
      id: 'ALERT_CRITICAL_LOSS', nameEn: 'Critical Wet Stock Loss', nameUr: 'ویٹ اسٹاک کا خطرناک نقصان',
      severity: 'CRITICAL', conditionField: 'variancePercent', defaultThreshold: -0.5, ownerRole: 'owner', version: '1.0.0'
    });
  }
  get(id: string) { return this.alerts.get(id)!; }
}
export const AlertRegistry = new AlertRegistryImpl();

// ==========================================
// Notification Registry
// ==========================================

export interface NotificationRule {
  readonly id: string;
  readonly eventTrigger: string; // e.g., 'REPORT_GENERATED', 'ALERT_TRIGGERED'
  readonly channels: ('IN_APP' | 'EMAIL' | 'WHATSAPP' | 'PUSH')[];
  readonly targetRoles: string[];
  readonly templateEn: string;
  readonly templateUr: string;
  readonly version: string;
}

class NotificationRegistryImpl {
  private readonly rules: Map<string, NotificationRule> = new Map();
  constructor() {
    this.rules.set('NOTIFY_CRITICAL_ALERT', {
      id: 'NOTIFY_CRITICAL_ALERT', eventTrigger: 'ALERT_CRITICAL', channels: ['IN_APP', 'PUSH', 'WHATSAPP'],
      targetRoles: ['owner', 'manager'], templateEn: 'Critical Alert: {{alertName}} triggered at {{stationName}}.',
      templateUr: 'خطرناک الرٹ: {{stationName}} پر {{alertName}} متحرک ہوا۔', version: '1.0.0'
    });
  }
  get(id: string) { return this.rules.get(id)!; }
}
export const NotificationRegistry = new NotificationRegistryImpl();

// ==========================================
// Widget Registry
// ==========================================

export interface WidgetDefinition {
  readonly id: string;
  readonly type: 'KPI' | 'CHART' | 'TABLE' | 'AI_SUMMARY';
  readonly targetId: string; // Refers to KPI/Chart/Register ID
  readonly defaultWidth: number; // grid columns (1-12)
  readonly defaultHeight: number; // grid rows
  readonly version: string;
}

class WidgetRegistryImpl {
  private readonly widgets: Map<string, WidgetDefinition> = new Map();
  constructor() {
    this.widgets.set('WIDGET_GROSS_PROFIT', {
      id: 'WIDGET_GROSS_PROFIT', type: 'KPI', targetId: 'KPI_GROSS_PROFIT', defaultWidth: 3, defaultHeight: 1, version: '1.0.0'
    });
    this.widgets.set('WIDGET_SALES_TREND', {
      id: 'WIDGET_SALES_TREND', type: 'CHART', targetId: 'CHART_SALES_TREND_7D', defaultWidth: 6, defaultHeight: 2, version: '1.0.0'
    });
  }
  get(id: string) { return this.widgets.get(id)!; }
}
export const WidgetRegistry = new WidgetRegistryImpl();
