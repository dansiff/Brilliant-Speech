import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  CheckCircle2, 
  Database, 
  AlertCircle, 
  X,
  HardDrive,
  Sparkles
} from 'lucide-react';
import { offlineSyncService, OfflineSyncStatus } from '../services/offlineSyncService';
import { toast } from 'sonner';

export interface OfflineSyncBannerProps {
  onOpenSettings?: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ onOpenSettings }) => {
  const [status, setStatus] = useState<OfflineSyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncTimestamp: null,
    serviceWorkerRegistered: false,
    storageUsageMb: 0
  });
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((newStatus) => {
      setStatus(newStatus);
      if (!newStatus.isOnline) {
        setIsDismissed(false); // Re-show banner when going offline
      }
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    toast.info('Syncing offline speech attempts with cloud storage...');
    const result = await offlineSyncService.syncPendingQueue();
    if (result.processed > 0) {
      toast.success(`Successfully synchronized ${result.processed} offline records!`);
    } else if (result.failed > 0) {
      toast.error(`Failed to sync ${result.failed} items. Will retry automatically.`);
    } else {
      toast.success('All local therapy records are up to date.');
    }
  };

  // Only show when offline OR when there are pending offline records to sync
  if ((status.isOnline && status.pendingCount === 0 && !isDetailsOpen) || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-2.5 shadow-md border-b border-indigo-500/20 z-50 text-xs"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Status Left */}
          <div className="flex items-center gap-3">
            {!status.isOnline ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold">
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                Offline Mode Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">
                <Wifi className="w-3.5 h-3.5" />
                Online
              </span>
            )}

            <p className="text-slate-200 hidden sm:inline">
              {!status.isOnline
                ? 'Local DSP, Sound Ladder, AAC boards, and Dexie audio recording remain 100% functional offline.'
                : status.pendingCount > 0
                ? `${status.pendingCount} offline records awaiting cloud synchronization.`
                : 'PWA Cache & Local Storage fully synchronized.'}
            </p>
          </div>

          {/* Actions Right */}
          <div className="flex items-center gap-2 ml-auto">
            {status.pendingCount > 0 && status.isOnline && (
              <button
                onClick={handleManualSync}
                disabled={status.isSyncing}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${status.isSyncing ? 'animate-spin' : ''}`} />
                {status.isSyncing ? 'Syncing...' : `Sync ${status.pendingCount} Records`}
              </button>
            )}

            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors"
            >
              <Database className="w-3 h-3 text-indigo-400" />
              <span>Storage {status.storageUsageMb ? `(${status.storageUsageMb} MB)` : ''}</span>
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Detailed Storage & Sync Dropdown Modal */}
        {isDetailsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-slate-800 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] text-slate-300"
          >
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 font-bold text-white mb-1">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                Workbox-Style Cache
              </div>
              <p className="text-slate-400">
                Pre-cached HTML shell, icons, audio cues, and fonts for immediate offline startup.
              </p>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 font-bold text-white mb-1">
                <Database className="w-4 h-4 text-indigo-400" />
                Dexie IndexedDB Queue
              </div>
              <p className="text-slate-400">
                Pending sync items: <span className="font-mono text-white font-bold">{status.pendingCount}</span>
                {status.lastSyncTimestamp && (
                  <span className="block text-[10px] text-slate-500 mt-1">
                    Last sync: {new Date(status.lastSyncTimestamp).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 font-bold text-white mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Deterministic Local DSP
              </div>
              <p className="text-slate-400">
                Zero-cloud fallback analyzes phonemes, acoustic latency, and decibels entirely on-device.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
