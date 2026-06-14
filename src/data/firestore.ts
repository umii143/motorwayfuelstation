import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  onSnapshot, 
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { dbFS, auth } from '../lib/firebase';
import {
  getBusinessTypeForStation,
  isRecordInBusinessScope,
  withBusinessScope
} from '../lib/businessScope';
// Lazy import SyncEngine to avoid circular dependency issues at boot
import { SyncEngine } from '../services/core/SyncEngine';

// Helper to construct references
const getCollectionRef = (orgId: string, stationId: string, collectionName: string) => {
  return collection(dbFS, 'organizations', orgId, 'stations', stationId, collectionName);
};

const getDocumentRef = (orgId: string, stationId: string, collectionName: string, docId: string) => {
  return doc(dbFS, 'organizations', orgId, 'stations', stationId, collectionName, docId);
};

// Generic interface for metadata addition
const createMetadata = (orgId: string, stationId: string, businessType: 'fuel_station' | 'cng' | 'lube') => {
  const uid = auth.currentUser?.uid || 'system';
  const enforcedBusinessType = getBusinessTypeForStation(stationId);
  return {
    orgId,
    stationId,
    businessId: stationId,
    businessType: enforcedBusinessType,
    createdBy: uid,
    createdAt: new Date().toISOString(),
    updatedBy: uid,
    updatedAt: new Date().toISOString()
  };
};

export const firestoreDb = {
  // Raw save used by SyncEngine when internet is restored
  _rawSaveDocument: async (
    orgId: string, 
    stationId: string, 
    businessType: 'fuel_station' | 'cng' | 'lube',
    collectionName: string, 
    docId: string, 
    data: any
  ) => {
    const enforcedBusinessType = getBusinessTypeForStation(stationId);
    const docRef = getDocumentRef(orgId, stationId, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    const meta = docSnap.exists() 
      ? {
          orgId,
          stationId,
          businessId: stationId,
          businessType: enforcedBusinessType,
          updatedBy: auth.currentUser?.uid || 'system',
          updatedAt: new Date().toISOString()
        } 
      : createMetadata(orgId, stationId, businessType);

    await setDoc(docRef, { ...withBusinessScope(data, stationId, orgId), ...meta }, { merge: true });
  },

  // Generic single save/update (intercepted by Sync Engine)
  saveDocument: async (
    orgId: string, 
    stationId: string, 
    businessType: 'fuel_station' | 'cng' | 'lube',
    collectionName: string, 
    docId: string, 
    data: any
  ) => {
    try {
      if (!SyncEngine.getQueueStatus().isOnline) {
        throw new Error('Offline mode active - enqueueing mutation');
      }
      await firestoreDb._rawSaveDocument(orgId, stationId, businessType, collectionName, docId, data);
    } catch (err) {
      console.log(`[Offline Sync] Queueing save for ${collectionName}/${docId}`);
      await SyncEngine.enqueue({
        entityType: collectionName as any,
        operation: 'update',
        payload: data,
        referenceId: docId,
        priority: (collectionName === 'shifts' || collectionName === 'treasury') ? 'critical' : 'high',
        orgId,
        stationId,
        businessType,
        collectionName,
        docId
      });
    }
  },

  // Raw delete used by SyncEngine
  _rawDeleteDocument: async (orgId: string, stationId: string, collectionName: string, docId: string) => {
    const docRef = getDocumentRef(orgId, stationId, collectionName, docId);
    await deleteDoc(docRef);
  },

  // Generic single delete (intercepted by Sync Engine)
  deleteDocument: async (orgId: string, stationId: string, collectionName: string, docId: string) => {
    try {
      if (!SyncEngine.getQueueStatus().isOnline) {
        throw new Error('Offline mode active - enqueueing deletion');
      }
      await firestoreDb._rawDeleteDocument(orgId, stationId, collectionName, docId);
    } catch (err) {
      console.log(`[Offline Sync] Queueing delete for ${collectionName}/${docId}`);
      await SyncEngine.enqueue({
        entityType: collectionName as any,
        operation: 'delete',
        payload: null,
        referenceId: docId,
        priority: 'high',
        orgId,
        stationId,
        businessType: getBusinessTypeForStation(stationId) as any,
        collectionName,
        docId
      });
    }
  },

  // Generic fetch collection
  fetchCollection: async <T>(orgId: string, stationId: string, collectionName: string): Promise<T[]> => {
    try {
      const colRef = getCollectionRef(orgId, stationId, collectionName);
      const q = query(colRef);
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((item) => isRecordInBusinessScope(item as any, stationId, orgId))
        .map((item) => withBusinessScope(item as any, stationId, orgId)) as unknown as T[];
    } catch (err) {
      console.error(`Error fetching collection ${collectionName}:`, err);
      return [];
    }
  },

  // Generic subscribe to collection in real-time
  subscribeToCollection: <T>(
    orgId: string, 
    stationId: string, 
    collectionName: string, 
    callback: (data: T[]) => void
  ) => {
    const colRef = getCollectionRef(orgId, stationId, collectionName);
    return onSnapshot(colRef, (snapshot) => {
      const items = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((item) => isRecordInBusinessScope(item as any, stationId, orgId))
        .map((item) => withBusinessScope(item as any, stationId, orgId)) as unknown as T[];
      callback(items);
    }, (error) => {
      console.error(`Real-time subscription error in ${collectionName}:`, error);
    });
  },

  // Bulk save (Batch writes for Migration Wizard)
  batchSaveDocuments: async (
    orgId: string, 
    stationId: string, 
    businessType: 'fuel_station' | 'cng' | 'lube',
    collectionName: string, 
    items: any[]
  ) => {
    try {
      const enforcedBusinessType = getBusinessTypeForStation(stationId);
      const batch = writeBatch(dbFS);
      items.forEach((item) => {
        const docId = item.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        const docRef = getDocumentRef(orgId, stationId, collectionName, docId);
        
        const metadata = createMetadata(orgId, stationId, enforcedBusinessType);
        batch.set(docRef, { ...withBusinessScope(item, stationId, orgId), ...metadata }, { merge: true });
      });
      await batch.commit();
      
      // Write audit log for migration success
      const auditLog = {
        id: `aud_mig_${Date.now()}`,
        userId: auth.currentUser?.uid || 'system',
        email: auth.currentUser?.email || 'system',
        action: 'data_migration',
        details: `Successfully migrated ${items.length} records to ${collectionName} for station ${stationId}`,
        ip: '127.0.0.1',
        device: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(dbFS, 'auditLogs', auditLog.id), auditLog);
    } catch (err) {
      console.error(`Error executing batch save in ${collectionName}:`, err);
      // Not queueing batch migrations for now, as they are typically run when strictly online
      throw err;
    }
  }
};
