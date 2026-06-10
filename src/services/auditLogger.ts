import { AuditTrailEntry } from '../types';
import { useAuthStore } from '../stores/useAuthStore';
import { db } from '../data/db';
import { firestoreDb } from '../data/firestore';

export class AuditLogger {
  static async logAction(
    action: string,
    category: string,
    details: string,
    oldValue?: string | object,
    newValue?: string | object,
    orgId?: string,
    stationId?: string
  ): Promise<void> {
    const authState = useAuthStore.getState();
    const user = authState.user;
    
    // Fallbacks if user is not available
    const userName = user?.name || 'System';
    const userRole = user?.role || 'System';
    const branch = stationId || user?.branchId || db.getActiveStationId() || 'Unknown Branch';
    
    const entryId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const entry: AuditTrailEntry = {
      id: entryId,
      timestamp: new Date().toISOString(),
      category,
      action,
      details,
      user: userName,
      role: userRole,
      branch,
      oldValue,
      newValue,
      ip: 'Client', // In a real backend, this would be retrieved from the request
      device: navigator.userAgent, // Basic device info from browser
    };

    // Save locally
    const activeStationId = db.getActiveStationId();
    if (activeStationId) {
      // We don't have a specific db.saveAuditLogs right now, so we'll just console log or add to a store if available
      // In a real implementation we would save this to IndexedDB
      console.log('📝 [Audit Log]', entry);
    }

    // Save to Firebase if orgId is provided
    if (orgId && stationId) {
      try {
        await firestoreDb.saveDocument(orgId, stationId, 'fuel_station', 'auditLogs', entry.id, entry);
      } catch (err) {
        console.error('Failed to sync audit log to cloud:', err);
      }
    }
  }
}
