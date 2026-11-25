/**
 * Offline Sync Service & Service Worker Management
 * Coordinates IndexedDB (Dexie) offline queues, Background Sync, and network transitions.
 */

import { localDb, LocalSyncQueue, SyncStatus } from '../lib/db';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface OfflineSyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTimestamp: number | null;
  serviceWorkerRegistered: boolean;
  storageUsageMb?: number;
}

type SyncListener = (status: OfflineSyncStatus) => void;

export class OfflineSyncService {
  private static instance: OfflineSyncService;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private lastSyncTimestamp: number | null = null;
  private serviceWorkerRegistered: boolean = false;
  private listeners: Set<SyncListener> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Listen for Background Sync triggers from Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'TRIGGER_BACKGROUND_SYNC') {
            console.log('[OfflineSync] Received background sync trigger from SW.');
            this.syncPendingQueue();
          }
        });
      }

      this.initServiceWorker();
    }
  }

  public static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  /**
   * Safe service worker registration that respects sandboxed iframes and localhost
   */
  public async initServiceWorker(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      // In sandboxed iframes without allow-same-origin, registration might reject gracefully
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.serviceWorkerRegistered = true;
      console.log('[SW] Service Worker successfully registered with scope:', registration.scope);

      // Check for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available! Activating...');
              installingWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          };
        }
      };

      this.notifyListeners();
    } catch (err) {
      console.warn('[SW] Service Worker registration unavailable in this environment (benign):', err);
      this.serviceWorkerRegistered = false;
      this.notifyListeners();
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    console.log('[OfflineSync] Network status changed to ONLINE. Initiating sync...');
    this.notifyListeners();
    this.syncPendingQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
    console.log('[OfflineSync] Network status changed to OFFLINE.');
    this.notifyListeners();
  };

  /**
   * Enqueue an operation to Dexie for offline persistence and later sync
   */
  public async queueOperation(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    collection: string,
    documentId: string,
    payload: any
  ): Promise<void> {
    try {
      await localDb.syncQueue.add({
        operation,
        collection,
        documentId,
        payload,
        timestamp: Date.now(),
        retryCount: 0
      });

      this.notifyListeners();

      // If online, trigger immediate sync
      if (this.isOnline) {
        this.syncPendingQueue();
      }
    } catch (err) {
      console.error('[OfflineSync] Failed to queue offline operation:', err);
    }
  }

  /**
   * Flushes all pending queued operations to Firebase Firestore
   */
  public async syncPendingQueue(): Promise<{ processed: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) {
      return { processed: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let processed = 0;
    let failed = 0;

    try {
      const pendingItems = await localDb.syncQueue.toArray();
      if (pendingItems.length === 0) {
        this.isSyncing = false;
        this.lastSyncTimestamp = Date.now();
        this.notifyListeners();
        return { processed: 0, failed: 0 };
      }

      console.log(`[OfflineSync] Syncing ${pendingItems.length} pending items...`);

      for (const item of pendingItems) {
        try {
          const docRef = doc(db, item.collection, item.documentId);
          if (item.operation === 'CREATE' || item.operation === 'UPDATE') {
            await setDoc(docRef, { ...item.payload, updatedAt: Date.now(), syncStatus: 'synced' }, { merge: true });
          } else if (item.operation === 'DELETE') {
            await deleteDoc(docRef);
          }

          // Remove item from Dexie syncQueue upon success
          if (item.id) {
            await localDb.syncQueue.delete(item.id);
          }
          processed++;
        } catch (opErr) {
          console.warn(`[OfflineSync] Error syncing item ${item.documentId}:`, opErr);
          if (item.id) {
            await localDb.syncQueue.update(item.id, {
              retryCount: (item.retryCount || 0) + 1
            });
          }
          failed++;
        }
      }

      this.lastSyncTimestamp = Date.now();
    } catch (err) {
      console.error('[OfflineSync] Error during sync loop:', err);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { processed, failed };
  }

  /**
   * Returns current sync status
   */
  public async getStatus(): Promise<OfflineSyncStatus> {
    let pendingCount = 0;
    try {
      pendingCount = await localDb.syncQueue.count();
    } catch (e) {
      pendingCount = 0;
    }

    let storageUsageMb = 0;
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage) {
          storageUsageMb = Math.round((estimate.usage / (1024 * 1024)) * 10) / 10;
        }
      } catch (e) {}
    }

    return {
      isOnline: this.isOnline,
      pendingCount,
      isSyncing: this.isSyncing,
      lastSyncTimestamp: this.lastSyncTimestamp,
      serviceWorkerRegistered: this.serviceWorkerRegistered,
      storageUsageMb
    };
  }

  /**
   * Subscribe to sync state changes
   */
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.getStatus().then(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }
}

export const offlineSyncService = OfflineSyncService.getInstance();
