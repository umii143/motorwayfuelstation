/**
 * FuelPro Enterprise — Repository Interfaces (PRD v6.1 A.6)
 *
 * All database access must go through these interfaces.
 * Direct Firebase SDK imports in business logic are banned.
 */

export interface IQueryRepository {
  /**
   * Fetch documents from a collection matching the given domain and context.
   */
  fetchDocuments(
    collectionName: string,
    context: { stationId: string; orgId: string; dateFrom?: Date; dateTo?: Date; filters?: Record<string, any> }
  ): Promise<{ documents: any[]; count: number; fetchedAt: Date; executionTimeMs: number }>;

  /**
   * Setup a realtime listener on a collection.
   */
  subscribeToDocuments(
    collectionName: string,
    context: { stationId: string; orgId: string; dateFrom?: Date; dateTo?: Date; filters?: Record<string, any> },
    onUpdate: (data: { documents: any[]; count: number; fetchedAt: Date; executionTimeMs: number }) => void,
    onError: (error: Error) => void
  ): () => void; // Returns unsubscribe function
}
