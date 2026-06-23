import { create } from 'zustand';
import { Station, GlobalSettings, ToastConfig, ConfirmConfig } from '../types';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface StationState {
  activeStationId: string;
  stations: Station[];
  settings: GlobalSettings;
  toast: ToastConfig;
  confirmDialog: ConfirmConfig;
  
  isAIAssistantVisible: boolean;
  setAIAssistantVisible: (visible: boolean) => void;
  
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, isAlert?: boolean, confirmText?: string, cancelText?: string) => void;
  showAlert: (title: string, message: string, onConfirm?: () => void) => void;
  closeConfirm: () => void;
  
  setStations: (stations: Station[]) => void;
  setSettings: (settings: GlobalSettings) => void;
  setActiveStationId: (id: string) => void;
  
  handleAddStation: (station: Station) => void;
  handleEditStation: (updatedStation: Station) => void;
  handleDeleteStation: (stationId: string, callback?: () => void) => void;
  handleSwitchStation: (stationId: string) => void;
  handleUpdateSettings: (newSettings: GlobalSettings, orgId?: string) => Promise<void>;
}

const getBusinessType = (stationId: string): 'fuel_station' | 'cng' | 'lube' => {
  if (stationId === 'st_lube') return 'lube';
  return 'fuel_station';
};

export const useStationStore = create<StationState>((set, get) => {
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  return {
    activeStationId: db.getActiveStationId(),
    stations: db.getStationsList(),
    settings: db.getSettings(db.getActiveStationId()),
    isAIAssistantVisible: true,
    toast: { message: '', type: 'success', visible: false },
    confirmDialog: {
      title: '',
      message: '',
      visible: false,
      onConfirm: () => { /* empty */ },
      onCancel: () => { /* empty */ }
    },

    setAIAssistantVisible: (visible) => set({ isAIAssistantVisible: visible }),

    showToast: (message, type = 'success') => {
      if (toastTimeout) {
        clearTimeout(toastTimeout);
      }
      set({ toast: { message, type, visible: true } });
      
      try {
        if (type === 'error') {
          Haptics.impact({ style: ImpactStyle.Heavy });
        } else if (type === 'success') {
          Haptics.impact({ style: ImpactStyle.Medium });
        } else {
          Haptics.impact({ style: ImpactStyle.Light });
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
         // ignore on web
      }

      toastTimeout = setTimeout(() => {
        set((state) => ({ toast: { ...state.toast, visible: false } }));
      }, 3000);
    },

    showConfirm: (title, message, onConfirm, isAlert = false, confirmText, cancelText) => {
      set({
        confirmDialog: {
          title,
          message,
          visible: true,
          isAlert,
          confirmText,
          cancelText,
          onConfirm: () => {
            onConfirm();
            set((state) => ({ confirmDialog: { ...state.confirmDialog, visible: false } }));
          },
          onCancel: () => {
            set((state) => ({ confirmDialog: { ...state.confirmDialog, visible: false } }));
          }
        }
      });
    },

    showAlert: (title, message, onConfirm) => {
      set({
        confirmDialog: {
          title,
          message,
          visible: true,
          isAlert: true,
          onConfirm: () => {
            if (onConfirm) onConfirm();
            set((state) => ({ confirmDialog: { ...state.confirmDialog, visible: false } }));
          },
          onCancel: () => {
            set((state) => ({ confirmDialog: { ...state.confirmDialog, visible: false } }));
          }
        }
      });
    },

    closeConfirm: () => {
      set((state) => ({ confirmDialog: { ...state.confirmDialog, visible: false } }));
    },

    setStations: (stations) => {
      set({ stations });
      db.saveStationsList(stations);
    },

    setSettings: (settings) => {
      set({ settings });
      if (!db.getActiveStationId()) return;
      db.saveSettings(get().activeStationId, settings);
    },

    setActiveStationId: (activeStationId) => {
      set({ activeStationId });
      db.setActiveStationId(activeStationId);
    },

    handleAddStation: (station) => {
      const { stations, settings } = get();
      const updatedStations = [...stations, station];
      set({ stations: updatedStations });
      db.saveStationsList(updatedStations);
      
      const initialSettings: GlobalSettings = {
        stationName: station.name,
        stationUrduName: station.urduName,
        address: station.address,
        ntn: station.ntn,
        ownerContact: station.ownerContact,
        theme: 'light',
        language: settings.language
      };
      db.saveSettings(station.id, initialSettings);
      db.setActiveStationId(station.id);
      set({ activeStationId: station.id, settings: initialSettings });
    },

    handleEditStation: (updatedStation) => {
      const { stations, activeStationId } = get();
      const updated = stations.map((s) => (s.id === updatedStation.id ? updatedStation : s));
      set({ stations: updated });
      db.saveStationsList(updated);
      
      const currentSettings = db.getSettings(updatedStation.id);
      const updatedSettings: GlobalSettings = {
        ...currentSettings,
        stationName: updatedStation.name,
        stationUrduName: updatedStation.urduName,
        address: updatedStation.address,
        ntn: updatedStation.ntn,
        ownerContact: updatedStation.ownerContact
      };
      db.saveSettings(updatedStation.id, updatedSettings);
      if (updatedStation.id === activeStationId) {
        set({ settings: updatedSettings });
      }
    },

    handleDeleteStation: (stationId, callback) => {
      const { settings, activeStationId, stations } = get();
      if (stationId === 'st_default') {
        get().showAlert(
          settings.language === 'ur' ? 'خرابی' : 'Error',
          settings.language === 'ur' ? 'بنیادی پہلے سے طے شدہ اسٹیشن کو حذف نہیں کیا جا سکتا۔' : 'The core default station cannot be deleted.'
        );
        return;
      }
      
      get().showConfirm(
        settings.language === 'ur' ? 'کیا آپ کو یقین ہے؟' : 'Are You Sure?',
        settings.language === 'ur' ? 'کیا آپ واقعی اس اسٹیشن کا سارا ڈیٹا ہمیشہ کے لیے حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to permanently delete this station and all its isolated records? This cannot be undone.',
        () => {
          const updated = stations.filter((s) => s.id !== stationId);
          set({ stations: updated });
          db.saveStationsList(updated);
          db.clearStationData(stationId);

          if (activeStationId === stationId) {
            db.setActiveStationId('st_default');
            set({ activeStationId: 'st_default', settings: db.getSettings('st_default') });
          }
          get().showToast(
            settings.language === 'ur' ? 'اسٹیشن کامیابی سے حذف ہو گیا!' : 'Station deleted successfully!',
            'success'
          );
          if (callback) callback();
        }
      );
    },

    handleSwitchStation: (stationId) => {
      db.setActiveStationId(stationId);
      const newSettings = db.getSettings(stationId);
      set({ activeStationId: stationId, settings: newSettings });
    },

    handleUpdateSettings: async (newSettings, orgId) => {
      const { activeStationId } = get();
      set({ settings: newSettings });
      db.saveSettings(activeStationId, newSettings);
      if (orgId) {
        await firestoreDb.saveDocument(orgId, activeStationId, getBusinessType(activeStationId), 'settings', 'global', newSettings);
      }
    }
  };
});
