import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App as CapacitorApp } from '@capacitor/app';

class MobileExperienceEngine {
  private isMobile: boolean;
  private fpsHistory: number[] = [];
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private monitoringInterval: any = null;
  private logInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.isMobile = Capacitor.isNativePlatform();
  }

  /**
   * Initializes native mobile experience settings
   */
  async initialize() {
    if (!this.isMobile) return;

    try {
      // Configure Status Bar for dark mode aesthetics
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0F172A' });

      // Handle Android Hardware Back Button
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[MobileExperienceEngine] Status/Nav bar setup failed', e);
    }

    this.startPerformanceMonitoring();
  }

  /**
   * Starts an internal loop to track UI responsiveness (FPS)
   */
  private startPerformanceMonitoring() {
    if (!this.isMobile) return;
    
    let lastTime = performance.now();
    const loop = () => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;
      
      const fps = 1000 / delta;
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 60) this.fpsHistory.shift(); // keep last 60 frames

      this.monitoringInterval = requestAnimationFrame(loop);
    };

    this.monitoringInterval = requestAnimationFrame(loop);
    
    // Log average FPS every 10 seconds
    this.logInterval = setInterval(() => {
      if (this.fpsHistory.length === 0) return;
      const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      if (avgFps < 45) {
        // eslint-disable-next-line no-console
        console.warn(`[MobileExperienceEngine] LOW FPS DETECTED: ${Math.round(avgFps)} fps`);
      }
    }, 10000);
  }

  /**
   * Cleans up intervals and monitoring to prevent memory leaks
   */
  dispose() {
    if (this.monitoringInterval) {
      cancelAnimationFrame(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.logInterval) {
      clearInterval(this.logInterval);
      this.logInterval = null;
    }
  }

  /**
   * Measures time taken for an action and logs if it's too slow.
   */
  trackInteractionLatency(actionName: string, startTime: number) {
    const latency = performance.now() - startTime;
    if (latency > 150) {
      // eslint-disable-next-line no-console
      console.warn(`[MobileExperienceEngine] SLOW INTERACTION (${actionName}): ${Math.round(latency)}ms`);
    }
  }

  /**
   * Prevents the screen from sleeping. Crucial during Shift Operations.
   */
  async keepScreenAwake() {
    if (!this.isMobile) return;
    try {
      await KeepAwake.keepAwake();
      // eslint-disable-next-line no-console
      console.log('[MobileExperienceEngine] Screen wake lock acquired.');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[MobileExperienceEngine] Failed to acquire wake lock', e);
    }
  }

  /**
   * Allows the screen to sleep again.
   */
  async allowScreenSleep() {
    if (!this.isMobile) return;
    try {
      await KeepAwake.allowSleep();
      // eslint-disable-next-line no-console
      console.log('[MobileExperienceEngine] Screen wake lock released.');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[MobileExperienceEngine] Failed to release wake lock', e);
    }
  }

  /**
   * Triggers a heavy haptic feedback, useful for errors or major actions
   */
  async heavyHaptic() {
    if (!this.isMobile) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Ignored
    }
  }

  /**
   * Triggers a light haptic feedback, useful for normal button presses
   */
  async lightHaptic() {
    if (!this.isMobile) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Ignored
    }
  }

  /**
   * Checks if the app is currently running in a native environment
   */
  isNative() {
    return this.isMobile;
  }
}

export const mobileEngine = new MobileExperienceEngine();
