import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { NativeSounds } from '../../utils/SoundManager';
import { logger } from '../../lib/logger';

export class NativeHaptics {
  /**
   * Check if haptics are supported (available only on native devices)
   */
  static isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Trigger a selection feedback (light click)
   * Use for tab changes, minor button clicks, checking checkboxes
   */
  static async selection() {
    NativeSounds.playClick();
    if (!this.isSupported()) return;
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (e) {
      logger.warn('Haptics failed', e);
    }
  }

  /**
   * Trigger an impact feedback (like a physical button press)
   * @param style Light, Medium, or Heavy
   */
  static async impact(style: ImpactStyle = ImpactStyle.Medium) {
    NativeSounds.playClick();
    if (!this.isSupported()) return;
    try {
      await Haptics.impact({ style });
    } catch (e) {
      logger.warn('Haptics failed', e);
    }
  }

  /**
   * Trigger a notification feedback (Success, Warning, Error)
   */
  static async notification(type: NotificationType) {
    if (type === NotificationType.Success) NativeSounds.playSuccess();
    else if (type === NotificationType.Error) NativeSounds.playError();
    else if (type === NotificationType.Warning) NativeSounds.playError();

    if (!this.isSupported()) return;
    try {
      await Haptics.notification({ type });
    } catch (e) {
      logger.warn('Haptics failed', e);
    }
  }

  /**
   * Vibrate the device for a specific duration (Android/Web only, not iOS)
   * @param duration Duration in ms
   */
  static async vibrate(duration: number = 300) {
    if (!this.isSupported()) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (e) {
      logger.warn('Haptics failed', e);
    }
  }

  // Pre-defined convenient methods for specific app actions

  static async success() {
    await this.notification(NotificationType.Success);
  }

  static async error() {
    await this.notification(NotificationType.Error);
  }

  static async warning() {
    await this.notification(NotificationType.Warning);
  }

  static async lightClick() {
    await this.impact(ImpactStyle.Light);
  }

  static async heavyClick() {
    await this.impact(ImpactStyle.Heavy);
  }
}
