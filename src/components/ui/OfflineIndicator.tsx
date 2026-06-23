import React, { useEffect, useState } from 'react';
import { SyncEngine } from '../../services/core/SyncEngine';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function OfflineIndicator() {
  const [status, setStatus] = useState({
    pending: 0,
    failed: 0,
    isOnline: true,
    isProcessing: false,
    queue: []
  });

  useEffect(() => {
    const unsubscribe = SyncEngine.subscribe(setStatus);
    return () => unsubscribe();
  }, []);

  if (status.isOnline && status.pending === 0 && status.failed === 0) {
    return null; // Don't show anything if fully synced and online
  }

  const getStatusConfig = () => {
    if (!status.isOnline) {
      return {
        icon: <WifiOff className="h-4 w-4 text-red-500" />,
        text: 'Offline Mode',
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-600',
        borderColor: 'border-red-200'
      };
    }
    
    if (status.failed > 0) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
        text: `${status.failed} Sync Failed`,
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-600',
        borderColor: 'border-orange-200',
        action: () => SyncEngine.processQueue()
      };
    }
    
    if (status.isProcessing) {
      return {
        icon: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
        text: 'Synchronizing...',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200'
      };
    }
    
    if (status.pending > 0) {
      return {
        icon: <RefreshCw className="h-4 w-4 text-yellow-500" />,
        text: `${status.pending} Pending Sync`,
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-600',
        borderColor: 'border-yellow-200'
      };
    }
    
    return {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      text: 'Synced',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    };
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
      >
        <button
          onClick={config.action}
          disabled={!config.action}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm backdrop-blur-sm transition-all ${config.bgColor} ${config.borderColor} ${config.action ? 'cursor-pointer hover:shadow-md hover:scale-105' : 'cursor-default'}`}
        >
          {config.icon}
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.text}
          </span>
          {config.action && (
            <span className={`text-xs ml-1 underline ${config.textColor}`}>
              Retry
            </span>
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
