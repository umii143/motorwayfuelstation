import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { NativeSounds } from './SoundManager';

export const haptic = {
  // Light tap — navigation, selection
  light: async () => {
    NativeSounds.playClick();
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Ignore if not on a device that supports haptics
    }
  },

  // Medium tap — button press, action
  medium: async () => {
    NativeSounds.playClick();
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      // Ignore
    }
  },

  // Heavy tap — important action, shift start/close
  heavy: async () => {
    NativeSounds.playClick();
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      // Ignore
    }
  },

  // Success — shift closed, payment recorded
  success: async () => {
    NativeSounds.playSuccess();
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      // Ignore
    }
  },

  // Warning — low stock, shortage
  warning: async () => {
    NativeSounds.playError();
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) {
      // Ignore
    }
  },

  // Error — validation failed, fraud alert
  error: async () => {
    NativeSounds.playError();
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
      // Ignore
    }
  },
};
