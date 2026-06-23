import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Browser } from '@capacitor/browser';
import { logger } from '../../lib/logger';

// REPOSITORY TO CHECK FOR UPDATES
const GITHUB_REPO = 'umii143/motorwayfuelstation';

export interface ReleaseInfo {
  version: string;
  notes: string;
  downloadUrl: string;
  isNewer: boolean;
}

/**
 * Checks GitHub for a new release of the FuelPro APK.
 */
export async function checkForUpdates(): Promise<ReleaseInfo | null> {
  try {
    const deviceInfo = await Device.getInfo();
    
    // Only check for updates natively on Android (skip on web/iOS for now)
    if (deviceInfo.platform !== 'android') {
      return null;
    }

    // 1. Get current installed app version
    const appInfo = await App.getInfo();
    const currentVersion = appInfo.version;

    // 2. Query GitHub API for the latest release
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
    
    if (!response.ok) {
      logger.error('Failed to fetch GitHub releases');
      return null;
    }

    const release = await response.json();
    const latestVersion = release.tag_name.replace('v', '');
    
    // 3. Find the APK asset in the release
    const apkAsset = release.assets?.find((asset: unknown) => asset.name.endsWith('.apk'));
    
    if (!apkAsset) {
      return null; // No APK uploaded in the latest release
    }

    // 4. Compare versions
    const isNewer = compareVersions(latestVersion, currentVersion) > 0;

    return {
      version: latestVersion,
      notes: release.body || 'Bug fixes and performance improvements.',
      downloadUrl: apkAsset.browser_download_url,
      isNewer
    };

  } catch (error) {
    logger.error('Error checking for updates:', error);
    return null;
  }
}

/**
 * Helper to compare version strings (e.g., 1.0.5 vs 1.0.4)
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Opens the device browser to download the APK.
 * The browser will automatically prompt to install the APK once downloaded.
 */
export async function downloadAndInstallUpdate(url: string) {
  await Browser.open({ url });
}
