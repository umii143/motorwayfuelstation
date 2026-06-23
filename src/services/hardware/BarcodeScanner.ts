import { Capacitor } from '@capacitor/core';
import { 
  BarcodeScanner as MLKitScanner, 
  BarcodeFormat
} from '@capacitor-mlkit/barcode-scanning';

export class NativeBarcodeScanner {
  /**
   * Check and request camera permissions
   */
  static async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    
    try {
      const { camera } = await MLKitScanner.requestPermissions();
      return camera === 'granted' || camera === 'limited';
    } catch (error) {
      console.error("Camera permission error:", error);
      return false;
    }
  }

  /**
   * Starts scanning and returns the barcode content.
   * Note: You must make the WebView background transparent in your React UI
   * before calling this function so the camera preview is visible.
   */
  static async startScan(formats: BarcodeFormat[] = [BarcodeFormat.QrCode, BarcodeFormat.Ean13]): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      console.warn("Native scanner not available on Web.");
      // Fallback or mock behavior could be implemented here
      return prompt("SIMULATED SCAN: Enter barcode value:");
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error("Camera permission denied.");
    }

    try {
      // document.querySelector('body')?.classList.add('barcode-scanner-active'); // Handled by UI component
      
      const result = await MLKitScanner.scan({
        formats,
      });

      return result.barcodes.length > 0 ? (result.barcodes[0].rawValue || null) : null;
    } catch (error: unknown) {
      console.error("Scanning failed:", error);
      throw error;
    } finally {
      // document.querySelector('body')?.classList.remove('barcode-scanner-active');
    }
  }

  /**
   * Toggles the flashlight.
   */
  static async toggleTorch(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const res = await MLKitScanner.isTorchEnabled() as { enabled?: boolean; isEnabled?: boolean };
      if (res.enabled || res.isEnabled) {
        await MLKitScanner.disableTorch();
      } else {
        await MLKitScanner.enableTorch();
      }
    } catch (error) {
      console.error("Torch error:", error);
    }
  }

  /**
   * Stops the active scanning process.
   */
  static async stopScan(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await MLKitScanner.stopScan();
    } catch (error) {
      console.error("Stop scan error:", error);
    }
  }
}
