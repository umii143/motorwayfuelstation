/**
 * FuelPro Enterprise — Firestore Adapter (PRD v6.1 A.6)
 *
 * Implements IQueryRepository.
 * This is the ONLY file allowed to import 'firebase/firestore' directly
 * (aside from the core firebase config).
 */

import { collection, getDocs, onSnapshot, query, where, orderBy, Query } from 'firebase/firestore';
import { dbFS } from '../../lib/firebase';
import { IQueryRepository } from '../interfaces/IQueryRepository';
import { logger } from '../../lib/logger';

class FirestoreAdapterImpl implements IQueryRepository {
  async fetchDocuments(
    collectionName: string,
    context: { stationId: string; orgId: string; dateFrom?: Date; dateTo?: Date; filters?: Record<string, any> }
  ) {
    const start = performance.now();
    const q = this._buildQuery(collectionName, context);
    
    try {
      const snapshot = await getDocs(q);
      const documents = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const executionTimeMs = Math.round(performance.now() - start);

      return {
        documents,
        count: documents.length,
        fetchedAt: new Date(),
        executionTimeMs
      };
    } catch (err) {
      logger.error(`[FirestoreAdapter] fetch error for ${collectionName}:`, err);
      throw err;
    }
  }

  subscribeToDocuments(
    collectionName: string,
    context: { stationId: string; orgId: string; dateFrom?: Date; dateTo?: Date; filters?: Record<string, any> },
    onUpdate: (data: { documents: any[]; count: number; fetchedAt: Date; executionTimeMs: number }) => void,
    onError: (error: Error) => void
  ) {
    const q = this._buildQuery(collectionName, context);
    
    return onSnapshot(q, (snapshot) => {
      const start = performance.now();
      const documents = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const executionTimeMs = Math.round(performance.now() - start);
      
      onUpdate({
        documents,
        count: documents.length,
        fetchedAt: new Date(),
        executionTimeMs
      });
    }, onError);
  }

  private _buildQuery(
    collectionName: string,
    context: { stationId: string; orgId: string; dateFrom?: Date; dateTo?: Date; filters?: Record<string, any> }
  ): Query {
    // Determine path based on org/station
    // Standard path: organizations/{orgId}/stations/{stationId}/{collectionName}
    // Fallback path (legacy): stations/{stationId}/{collectionName}
    
    // For now, using the most common legacy path to not break existing apps,
    // but parameterized for future strict org boundaries.
    const path = context.orgId && context.orgId !== 'legacy' 
      ? `organizations/${context.orgId}/stations/${context.stationId}/${collectionName}`
      : `stations/${context.stationId}/${collectionName}`;

    let q = query(collection(dbFS, path));

    // Optional: add date bounds if field exists
    if (context.dateFrom) {
      q = query(q, where('date', '>=', context.dateFrom.toISOString().split('T')[0]));
    }
    if (context.dateTo) {
      q = query(q, where('date', '<=', context.dateTo.toISOString().split('T')[0]));
    }

    // Apply custom filters
    if (context.filters) {
      for (const [k, v] of Object.entries(context.filters)) {
        if (v !== undefined && v !== null && v !== '') {
          q = query(q, where(k, '==', v));
        }
      }
    }

    return q;
  }
}

export const FirestoreAdapter = new FirestoreAdapterImpl();
