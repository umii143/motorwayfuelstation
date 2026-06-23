import { WidgetManifest, DashboardLayoutSnapshot } from '../../types/widget.types';

export const CORE_WIDGETS: WidgetManifest[] = [
  {
    id: 'hero-performance',
    name: 'Hero Performance',
    description: 'Executive overview of daily operations, health score, and profit.',
    size: 'hero',
    type: 'analytical',
    category: 'operations',
    permissions: { visibleTo: ['owner', 'manager'] },
    lazy: true,
    enabled: true,
    removable: false,
    systemWidget: true,
    layoutVersion: 1,
    minWidth: 2,
    minHeight: 1
  },
  {
    id: 'tank-health',
    name: 'Tank Health & Capacity',
    description: 'Live tank levels, depletion forecasts, and status alerts.',
    size: 'large',
    type: 'interactive',
    category: 'tank_intelligence',
    permissions: { visibleTo: ['owner', 'manager', 'salesman'] },
    lazy: true,
    enabled: true,
    removable: true,
    systemWidget: true,
    layoutVersion: 2,
    minWidth: 2,
    minHeight: 2,
    defaultSettings: { showForecast: true, showCapacity: true }
  },
  {
    id: 'active-shift',
    name: 'Live Shift Status',
    description: 'Real-time monitoring of active shift sales and cash.',
    size: 'medium',
    type: 'live',
    category: 'operations',
    permissions: { visibleTo: ['owner', 'manager', 'salesman', 'accountant'] },
    lazy: true,
    enabled: true,
    removable: true,
    systemWidget: true,
    layoutVersion: 1,
    minWidth: 2,
    minHeight: 1
  },
  {
    id: 'treasury',
    name: 'Treasury Center',
    description: 'Financial oversight including cash, bank, receivables, and payables.',
    size: 'large',
    type: 'analytical',
    category: 'treasury',
    permissions: { 
      visibleTo: ['owner', 'manager', 'accountant'],
      editableBy: ['owner']
    },
    lazy: true,
    enabled: true,
    removable: false,
    systemWidget: true,
    layoutVersion: 2,
    minWidth: 2,
    minHeight: 2
  },
  {
    id: 'seasonal-outlook',
    name: 'Seasonal Outlook',
    description: 'Demand forecasts based on Islamic events, weather, and weekly trends.',
    size: 'medium',
    type: 'analytical',
    category: 'analytics',
    permissions: { visibleTo: ['owner'] },
    lazy: true,
    enabled: true,
    removable: true,
    systemWidget: false,
    layoutVersion: 1,
    workerDependencies: ['forecast.worker.ts'],
    minWidth: 2,
    minHeight: 1
  },
  {
    id: 'sales-overview',
    name: 'Sales Overview',
    description: '7-Day Revenue Trend Chart',
    size: 'large',
    type: 'analytical',
    category: 'analytics',
    permissions: { visibleTo: ['owner', 'manager'] },
    lazy: true,
    enabled: true,
    removable: true,
    systemWidget: true,
    layoutVersion: 1,
    minWidth: 4,
    minHeight: 2
  },
  {
    id: 'activity-feed',
    name: 'Activity Feed',
    description: 'Real-time activity feed for shifts and stock',
    size: 'medium',
    type: 'live',
    category: 'operations',
    permissions: { visibleTo: ['owner', 'manager'] },
    lazy: true,
    enabled: true,
    removable: true,
    systemWidget: true,
    layoutVersion: 1,
    minWidth: 2,
    minHeight: 3
  }
];

export const DEFAULT_OWNER_LAYOUT: DashboardLayoutSnapshot = {
  id: 'default-owner-layout',
  name: 'Owner Command Center',
  description: 'Default layout for station owners focusing on profit, tanks, and treasury.',
  createdAt: Date.now(),
  isDefault: true,
  roleRestriction: ['owner'],
  widgets: [
    { instanceId: 'hero-1', manifestId: 'hero-performance', x: 0, y: 0, w: 12, h: 2, settings: { /* empty */ } },
    { instanceId: 'tank-1', manifestId: 'tank-health', x: 0, y: 2, w: 8, h: 3, settings: { /* empty */ } },
    { instanceId: 'shift-1', manifestId: 'active-shift', x: 8, y: 2, w: 4, h: 2, settings: { /* empty */ } },
    { instanceId: 'treasury-1', manifestId: 'treasury', x: 8, y: 4, w: 4, h: 2, settings: { /* empty */ } },
    { instanceId: 'sales-1', manifestId: 'sales-overview', x: 0, y: 5, w: 8, h: 3, settings: { /* empty */ } },
    { instanceId: 'activity-1', manifestId: 'activity-feed', x: 8, y: 6, w: 4, h: 3, settings: { /* empty */ } }
  ]
};
