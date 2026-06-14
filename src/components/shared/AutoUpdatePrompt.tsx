import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, AlertCircle, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { checkForUpdates, downloadAndInstallUpdate, ReleaseInfo } from '../../services/updater/GitHubUpdater';
import { haptic } from '../../utils/haptics';

export function AutoUpdatePrompt() {
  const [updateInfo, setUpdateInfo] = useState<ReleaseInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Check for updates shortly after the app starts
    const timer = setTimeout(async () => {
      const info = await checkForUpdates();
      if (info?.isNewer) {
        setUpdateInfo(info);
        setIsVisible(true);
        // Haptic feedback for importance
        try { await haptic.heavy(); } catch (e) {}
      }
    }, 3000); // Wait 3 seconds to avoid blocking initial render

    return () => clearTimeout(timer);
  }, []);

  if (!updateInfo) return null;

  const handleUpdate = async () => {
    await haptic.light();
    setIsDownloading(true);
    
    // Simulate a brief loading state before opening browser
    setTimeout(async () => {
      await downloadAndInstallUpdate(updateInfo.downloadUrl);
      setIsVisible(false);
    }, 1500);
  };

  const handleDismiss = async () => {
    await haptic.light();
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-theme-card border border-theme-main rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header Art */}
            <div className="h-32 bg-gradient-to-br from-orange-500 to-orange-600 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              
              <div className="relative z-10 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                <Download className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-theme-main mb-1">Update Available!</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                A new version of FuelPro (v{updateInfo.version}) is ready. We highly recommend installing it to get the latest features and security fixes.
              </p>

              <div className="bg-[var(--bg-app)] rounded-xl p-3 mb-6 border border-theme-main text-sm text-[var(--text-main)] max-h-24 overflow-y-auto">
                <div className="font-bold mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  What's New:
                </div>
                <div className="text-xs whitespace-pre-wrap pl-6">
                  {updateInfo.notes}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleUpdate}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-orange-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Downloading...
                    </span>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download & Install Now
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="w-full text-sm font-bold text-slate-500 hover:text-slate-700 py-2 transition-colors"
                >
                  Remind Me Later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
