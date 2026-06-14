import { BiometricAuth, CheckBiometryResult } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';

export class BiometricService {
  /**
   * Checks if biometrics are available and configured on the device.
   */
  static async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const result: CheckBiometryResult = await BiometricAuth.checkBiometry();
      return result.isAvailable;
    } catch (error) {
      console.warn("Biometry check failed:", error);
      return false;
    }
  }

  /**
   * Prompts the user to authenticate using biometrics.
   */
  static async authenticate(reason: string = 'Please authenticate to continue'): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // On web, we could fallback to a PIN prompt or just allow it if in dev mode
      console.warn("Biometrics requested on non-native platform");
      return true; // Auto-pass for web testing
    }

    try {
      await BiometricAuth.authenticate({
        reason: reason,
        cancelTitle: 'Cancel',
        allowDeviceCredential: true, // Allow fallback to device PIN
      });
      return true;
    } catch (error: any) {
      // User canceled or failed
      console.error("Biometric auth failed:", error);
      return false;
    }
  }
}
