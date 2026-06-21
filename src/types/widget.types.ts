export type WidgetSize = 'small' | 'medium' | 'large' | 'hero';
export type WidgetCategory = 'operations' | 'fuel_intelligence' | 'tank_intelligence' | 'treasury' | 'recovery' | 'supplier' | 'analytics' | 'ai' | 'sales' | 'inventory' | 'customers' | 'custom';
export type WidgetType = 'static' | 'interactive' | 'analytical' | 'live';
export type UserRole = 'owner' | 'manager' | 'accountant' | 'salesman' | 'auditor';

export interface WidgetPermissions {
  visibleTo: UserRole[];
  editableBy?: UserRole[];
}

export interface WidgetManifest {
  id: string;
  name: string;
  description: string;
  size: WidgetSize;
  type: WidgetType;
  category: WidgetCategory;
  permissions: WidgetPermissions;
  lazy: boolean;
  enabled: boolean;
  removable: boolean;
  systemWidget: boolean;
  premium?: boolean;
  layoutVersion: number;
  workerDependencies?: string[];
  defaultSettings?: Record<string, any>;
  previewImage?: string; // Optional URL for the Marketplace
  minWidth?: number;     // For react-grid-layout grid units
  minHeight?: number;    // For react-grid-layout grid units
}

export interface WidgetInstance {
  instanceId: string;
  manifestId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  settings: Record<string, any>;
}

export interface DashboardLayoutSnapshot {
  id: string;
  name: string;
  description?: string;
  widgets: WidgetInstance[];
  createdAt: number;
  isDefault: boolean;
  roleRestriction?: UserRole[];
}

// Global user preferences for dashboard
export interface DashboardPreferences {
  activeLayoutId: string;
  savedLayouts: DashboardLayoutSnapshot[];
}

export interface WidgetEngineState {
  manifests: Record<string, WidgetManifest>;
  registerWidget: (manifest: WidgetManifest) => void;
  getWidgetManifest: (id: string) => WidgetManifest | undefined;
  getInstalledWidgets: () => WidgetManifest[];
  getAvailableWidgets: () => WidgetManifest[];
}
