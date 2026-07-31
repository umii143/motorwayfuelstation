import { AuditTrailEntry } from '../types';
import { useAuthStore } from '../stores/useAuthStore';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';
import { logger } from '../lib/logger';

export class AuditLogger {
 static async logAction(
 action: string,
 category: string,
 details: string,
 oldValue?: string | object,
 newValue?: string | object,
 orgId?: string,
 stationId?: string,
 notes?: string,
 relatedTransactionId?: string
 ): Promise<void> {
 const authState = useAuthStore.getState();
 const user = authState.user;
 
 // Fallbacks if user is not available
 const userName = user?.name || 'System';
 const userRole = user?.role || 'System';
 const branch = stationId || user?.branchId || db.getActiveStationId() || 'st_default';
 
 const entryId = `audit_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;
 
 const entry: AuditTrailEntry = {
 id: entryId,
 timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
 category,
 action,
 details,
 user: userName,
 role: userRole,
 branch,
 oldValue: oldValue && typeof oldValue === 'object' ? JSON.stringify(oldValue, null, 2) : oldValue,
 newValue: newValue && typeof newValue === 'object' ? JSON.stringify(newValue, null, 2) : newValue,
 ip: 'Client',
 device: navigator.userAgent,
 notes,
 relatedTransactionId
 };

 // Save locally
 const activeStationId = branch;
 if (activeStationId) {
 try {
 const existing = db.getActivityRegister(activeStationId) || [];
 // Keep a rolling limit of 10,000 entries locally
 const updated = [entry, ...existing].slice(0, 10000);
 db.saveActivityRegister(activeStationId, updated);
 logger.info('📝 [Activity Register Logged]', entry);
 } catch (err) {
 logger.error('Failed to save log to local activity register:', err);
 }
 }

 // Save to Firebase if orgId is provided
 if (orgId && activeStationId) {
 try {
 await firestoreDb.saveDocument(orgId, activeStationId, 'fuel_station', 'auditLogs', entry.id, entry);
 } catch (err) {
 logger.error('Failed to sync audit log to cloud:', err);
 }
 }
 }
}
