import { create } from 'zustand';
import { WidgetManifest, DashboardLayoutSnapshot, WidgetInstance } from '../types/widget.types';

interface WidgetEngineStore {
  // Registry
  manifests: Record<string, WidgetManifest>;
  registerWidget: (manifest: WidgetManifest) => void;
  getWidgetManifest: (id: string) => WidgetManifest | undefined;
  
  // Active Layout State
  isEditMode: boolean;
  setEditMode: (isEdit: boolean) => void;
  activeLayout: DashboardLayoutSnapshot | null;
  setActiveLayout: (layout: DashboardLayoutSnapshot) => void;
  
  // Edit Actions
  updateWidgetLayouts: (newLayouts: { i: string; x: number; y: number; w: number; h: number }[]) => void;
  removeWidget: (instanceId: string) => void;
  addWidget: (manifestId: string, x: number, y: number) => void;
  updateWidgetSettings: (instanceId: string, settings: Record<string, unknown>) => void;
}

export const useWidgetEngine = create<WidgetEngineStore>((set, get) => ({
  manifests: { /* empty */ },
  registerWidget: (manifest) => set((state) => ({
    manifests: { ...state.manifests, [manifest.id]: manifest }
  })),
  getWidgetManifest: (id) => get().manifests[id],

  isEditMode: false,
  setEditMode: (isEdit) => set({ isEditMode: isEdit }),
  activeLayout: null,
  setActiveLayout: (layout) => set({ activeLayout: layout }),

  updateWidgetLayouts: (newLayouts) => set((state) => {
    if (!state.activeLayout) return state;
    const updatedWidgets = state.activeLayout.widgets.map(w => {
      const layoutMatch = newLayouts.find((l) => l.i === w.instanceId);
      if (layoutMatch) {
        return { ...w, x: layoutMatch.x, y: layoutMatch.y, w: layoutMatch.w, h: layoutMatch.h };
      }
      return w;
    });
    return { activeLayout: { ...state.activeLayout, widgets: updatedWidgets } };
  }),

  removeWidget: (instanceId) => set((state) => {
    if (!state.activeLayout) return state;
    return {
      activeLayout: {
        ...state.activeLayout,
        widgets: state.activeLayout.widgets.filter(w => w.instanceId !== instanceId)
      }
    };
  }),

  addWidget: (manifestId, x, y) => set((state) => {
    if (!state.activeLayout) return state;
    const manifest = get().manifests[manifestId];
    if (!manifest) return state;

    const newWidget: WidgetInstance = {
      instanceId: `${manifestId}-${Date.now()}`,
      manifestId,
      x,
      y,
      w: manifest.minWidth || 2,
      h: manifest.minHeight || 2,
      settings: manifest.defaultSettings || { /* empty */ }
    };

    return {
      activeLayout: {
        ...state.activeLayout,
        widgets: [...state.activeLayout.widgets, newWidget]
      }
    };
  }),

  updateWidgetSettings: (instanceId, settings) => set((state) => {
    if (!state.activeLayout) return state;
    return {
      activeLayout: {
        ...state.activeLayout,
        widgets: state.activeLayout.widgets.map(w => 
          w.instanceId === instanceId ? { ...w, settings: { ...w.settings, ...settings } } : w
        )
      }
    };
  }),
}));
