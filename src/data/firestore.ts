import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { dbFS, auth } from '../lib/firebase';

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
  return {
    orgId,
    stationId,
    businessType,
    createdBy: uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const firestoreDb = {
  // Generic single save/update
  saveDocument: async (
    orgId: string, 
    stationId: string, 
    businessType: 'fuel_station' | 'cng' | 'lube',
    collectionName: string, 
    docId: string, 
    data: any
  ) => {
    try {
      const docRef = getDocumentRef(orgId, stationId, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      const meta = docSnap.exists() 
        ? { updatedAt: new Date().toISOString() } 
        : createMetadata(orgId, stationId, businessType);

      await setDoc(docRef, { ...data, ...meta }, { merge: true });
    } catch (err) {
      console.error(`Error saving document in ${collectionName}:`, err);
      throw err;
    }
  },

  // Generic single delete
  deleteDocument: async (orgId: string, stationId: string, collectionName: string, docId: string) => {
    try {
      const docRef = getDocumentRef(orgId, stationId, collectionName, docId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(`Error deleting document in ${collectionName}:`, err);
      throw err;
    }
  },

  // Generic fetch collection
  fetchCollection: async <T>(orgId: string, stationId: string, collectionName: string): Promise<T[]> => {
    try {
      const colRef = getCollectionRef(orgId, stationId, collectionName);
      const q = query(colRef);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as T[];
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
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as unknown as T[];
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
      const batch = writeBatch(dbFS);
      items.forEach((item) => {
        const docId = item.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        const docRef = getDocumentRef(orgId, stationId, collectionName, docId);
        
        const metadata = createMetadata(orgId, stationId, businessType);
        batch.set(docRef, { ...item, ...metadata }, { merge: true });
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
      throw err;
    }
  }
};
