import localforage from 'localforage';
import { Network } from '@capacitor/network';
import { firestoreDb } from '../../data/firestore';
import { logger } from '../../lib/logger';

export interface MutationQueueItem {
    id: string;
    entityType: 'shift' | 'customer' | 'supplier' | 'expense' | 'inventory' | 'treasury' | 'settings' | 'journal' | 'other';
    operation: 'create' | 'update' | 'delete' | 'reverse';
    payload: unknown;
    referenceId?: string;
    createdAt: number;
    retryCount: number;
    status: 'pending' | 'processing' | 'synced' | 'failed';
    priority: 'critical' | 'high' | 'normal';
    error?: string;
    
    // Additional metadata for SyncEngine to reconstruct the request
    orgId: string;
    stationId: string;
    businessType: 'fuel_station' | 'cng' | 'lube';
    collectionName: string;
    docId: string;
}

const QUEUE_KEY = 'fuelpro_sync_queue';
const INTEGRITY_LOG_KEY = 'fuelpro_integrity_drift_logs';

export interface IntegrityDriftLog {
    id: string;
    entityType: string;
    referenceId: string;
    error: string;
    timestamp: number;
    resolved: boolean;
    resolvedBy?: string;
}

class SyncEngineClass {
    private queue: MutationQueueItem[] = [];
    private isProcessing = false;
    private pollingInterval: ReturnType<typeof setInterval> | null = null;
    private initialized = false;

    // Listeners for UI state
    private listeners: ((state: { pending: number; failed: number; isOnline: boolean; isProcessing: boolean }) => void)[] = [];
    private isOnline = true;

    private async loadQueue() {
        let storedQueue: MutationQueueItem[] | null = null;
        try {
            storedQueue = await localforage.getItem<MutationQueueItem[]>(QUEUE_KEY);
        } catch (e) {
            logger.warn('SyncEngine localforage load failed:', e);
        }
        
        if (!storedQueue && typeof localStorage !== 'undefined') {
            try {
                const lsQueue = localStorage.getItem(QUEUE_KEY);
                if (lsQueue) storedQueue = JSON.parse(lsQueue);
             
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) { /* ignore */ }
        }
        
        if (storedQueue) {
            this.queue = storedQueue;
        }
        this.notifyListeners();
    }

    async start() {
        if (this.initialized) return;

        await this.loadQueue();

        // Initialize Network listener
        const status = await Network.getStatus();
        this.isOnline = status.connected;

        Network.addListener('networkStatusChange', status => {
            logger.info('Network status changed', status);
            this.isOnline = status.connected;
            this.notifyListeners();
            if (status.connected) {
                this.processQueue();
            }
        });

        // Browser fallback listener
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.notifyListeners();
                this.processQueue();
            });
            window.addEventListener('offline', () => {
                this.isOnline = false;
                this.notifyListeners();
            });
        }

        // Fallback polling (60 seconds)
        this.pollingInterval = setInterval(() => {
            if (this.isOnline) {
                this.processQueue();
            }
        }, 60000);

        this.initialized = true;
        this.notifyListeners();
        
        // Initial process
        if (this.isOnline) {
            this.processQueue();
        }
    }

    stop() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.initialized = false;
    }

    async enqueue(item: Omit<MutationQueueItem, 'id' | 'createdAt' | 'retryCount' | 'status'>) {
        const newItem: MutationQueueItem = {
            ...item,
            id: `sync_${Date.now()}_${crypto.randomUUID().split('-')[0]}`,
            createdAt: Date.now(),
            retryCount: 0,
            status: 'pending',
        };

        this.queue.push(newItem);
        await this.persistQueue();
        this.notifyListeners();

        // Attempt immediate process if online
        if (this.isOnline) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.isProcessing || !this.isOnline || this.queue.length === 0) return;

        this.isProcessing = true;
        this.notifyListeners();

        // Filter and sort queue (Critical first, then High, then Normal. Then by creation date)
        const priorityOrder = { critical: 1, high: 2, normal: 3 };
        
        const itemsToProcess = this.queue
            .filter(item => item.status === 'pending' || item.status === 'failed')
            .sort((a, b) => {
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return a.createdAt - b.createdAt;
            });

        for (const item of itemsToProcess) {
            // Update status
            const index = this.queue.findIndex(q => q.id === item.id);
            if (index === -1) continue;

            this.queue[index].status = 'processing';
            await this.persistQueue();

            try {
                // Actually push to Firestore directly (bypassing firestoreDb saveDocument to avoid circular enqueue)
                // Wait, firestoreDb.saveDocument doesn't enqueue by itself unless we refactor it to.
                // It's better if we call a raw Firestore save here, or pass a flag to firestoreDb.saveDocument(..., bypassQueue=true)
                
                if (item.operation === 'delete' || item.operation === 'reverse') {
                   // Delete operation
                   await firestoreDb._rawDeleteDocument(item.orgId, item.stationId, item.collectionName, item.docId);
                } else {
                   // Create / Update operation
                   await firestoreDb._rawSaveDocument(item.orgId, item.stationId, item.businessType, item.collectionName, item.docId, item.payload);
                }

                // Success! Remove from queue
                this.queue = this.queue.filter(q => q.id !== item.id);
                await this.persistQueue();
            } catch (error: unknown) {
                // Failed
                logger.error(`Sync Engine failed to process item ${item.id}:`, error);
                
                const qIndex = this.queue.findIndex(q => q.id === item.id);
                if (qIndex > -1) {
                    this.queue[qIndex].retryCount += 1;
                    this.queue[qIndex].status = 'failed';
                    this.queue[qIndex].error = error.message || 'Unknown error';

                    // Retry strategy limit: e.g., 60 attempts (~1 hr of polling)
                    if (this.queue[qIndex].retryCount >= 60) {
                        this.queue[qIndex].status = 'failed';
                        await this.logIntegrityDrift(this.queue[qIndex]);
                    }
                    await this.persistQueue();
                }
            }
        }

        this.isProcessing = false;
        this.notifyListeners();
    }

    private async persistQueue() {
        // Enforce a hard limit on the offline queue to prevent local storage bloat/OOM on low-end devices
        const MAX_QUEUE_SIZE = 5000;
        
        if (this.queue.length > MAX_QUEUE_SIZE) {
            logger.warn(`Sync queue exceeded ${MAX_QUEUE_SIZE} items. Truncating oldest items to conserve memory.`);
            
            // Sort by newest first (descending createdAt)
            this.queue.sort((a, b) => b.createdAt - a.createdAt);
            
            // Identify items to be purged
            const truncatedItems = this.queue.slice(MAX_QUEUE_SIZE);
            
            // Keep only the newest items
            this.queue = this.queue.slice(0, MAX_QUEUE_SIZE);
            
            // Log the purged items to the integrity drift log so they are not silently lost
            for (const item of truncatedItems) {
                await this.logIntegrityDrift({
                    ...item,
                    error: 'Purged from local queue due to memory limits (device offline for too long)'
                });
            }
        }
        
        await localforage.setItem(QUEUE_KEY, this.queue).catch(() => { /* empty */ });
         
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        try { if (typeof localStorage !== 'undefined') localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue)); } catch (e) { /* ignore */ }
    }

    private async logIntegrityDrift(item: MutationQueueItem) {
        const log: IntegrityDriftLog = {
            id: `drift_${Date.now()}`,
            entityType: item.entityType,
            referenceId: item.referenceId || item.docId,
            error: item.error || 'Max retries exceeded',
            timestamp: Date.now(),
            resolved: false
        };

        const existingLogs = await localforage.getItem<IntegrityDriftLog[]>(INTEGRITY_LOG_KEY).catch(() => null) || [];
        existingLogs.push(log);
        await localforage.setItem(INTEGRITY_LOG_KEY, existingLogs).catch(() => { /* empty */ });
         
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        try { if (typeof localStorage !== 'undefined') localStorage.setItem(INTEGRITY_LOG_KEY, JSON.stringify(existingLogs)); } catch (e) { /* ignore */ }
    }

    getQueueStatus() {
        const pending = this.queue.filter(q => q.status === 'pending' || q.status === 'processing').length;
        const failed = this.queue.filter(q => q.status === 'failed').length;
        return {
            pending,
            failed,
            isOnline: this.isOnline,
            isProcessing: this.isProcessing,
            queue: this.queue
        };
    }

    subscribe(listener: (state: unknown) => void) {
        this.listeners.push(listener);
        listener(this.getQueueStatus());
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        const status = this.getQueueStatus();
        this.listeners.forEach(l => l(status));
    }
}

export const SyncEngine = new SyncEngineClass();
