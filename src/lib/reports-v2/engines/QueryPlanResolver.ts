/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v3.0
 * Query Plan Resolver (v2.1 Patch A.1)
 *
 * ARCHITECTURAL RULE:
 * This is the ONLY layer that resolves WHICH collections/documents a report needs
 * and HOW they join. It takes a declarative queryPlan object and returns resolved
 * raw rows with join data merged in.
 *
 * Query Engine (low-level) → fetches a single collection by domain key.
 * Query Plan Resolver (this) → orchestrates base + joins, performs client-side merge.
 *
 * Register Engine never sees a collection name — it only receives mergedRows.
 * This is what keeps report #300 from needing a developer to know the database schema.
 * They write a queryPlan, not a query.
 */

import { QueryEngine } from './QueryEngine';
import { logger } from '../../logger';
import {
  QueryPlan,
  QueryJoin,
  QueryContext,
  ResolvedQueryResult,
  RawDataResult,
} from './types';

export class QueryPlanResolver {
  private static instance: QueryPlanResolver;
  private queryEngine: QueryEngine;

  private constructor() {
    this.queryEngine = QueryEngine.getInstance();
  }

  static getInstance(): QueryPlanResolver {
    if (!QueryPlanResolver.instance) {
      QueryPlanResolver.instance = new QueryPlanResolver();
    }
    return QueryPlanResolver.instance;
  }

  /**
   * Resolves a declarative queryPlan into joined/merged raw rows.
   *
   * Steps:
   * 1. Fetch base collection via QueryEngine
   * 2. Fetch each join collection via QueryEngine
   * 3. Perform client-side merge join (base rows enriched with join data)
   * 4. Return ResolvedQueryResult with base, joins, and mergedRows
   *
   * @param plan - Declarative query plan (base + joins + filters)
   * @param context - Tenant context (orgId/stationId required)
   * @param useArchive - Read from archive window cache first (Rule #92)
   * @returns ResolvedQueryResult with merged rows
   */
  async resolve(
    plan: QueryPlan,
    context: QueryContext,
    useArchive = false
  ): Promise<ResolvedQueryResult> {
    const startTime = performance.now();

    if (!plan || !plan.base) {
      logger.warn('[QueryPlanResolver] Invalid queryPlan: missing base collection.');
      return {
        base: this.emptyResult('unknown'),
        joins: {},
        mergedRows: [],
        totalExecutionTimeMs: 0,
      };
    }

    // Tenant isolation — fallback to defaults if not provided in dev context
    const resolvedOrgId = context.orgId || 'default-org';
    const resolvedStationId = context.stationId || 'default-station';
    context.orgId = resolvedOrgId;
    context.stationId = resolvedStationId;

    try {
      // Step 1: Fetch base collection
      const baseResult = await this.queryEngine.query(plan.base, context, useArchive);

      // Step 2: Fetch all join collections in parallel
      const joinDomains = (plan.joins || []).map(j => j.collection);
      const joinResults = await this.queryEngine.queryMultiple(joinDomains, context, useArchive);

      // Step 3: Perform client-side merge join
      const mergedRows = this.mergeJoin(
        baseResult.documents,
        plan.joins || [],
        joinResults
      );

      const totalExecutionTimeMs = Math.round(performance.now() - startTime);

      return {
        base: baseResult,
        joins: joinResults,
        mergedRows,
        totalExecutionTimeMs,
      };
    } catch (error: any) {
      logger.error(`[QueryPlanResolver] Failed to resolve queryPlan (base: ${plan.base}):`, error);
      return {
        base: this.emptyResult(plan.base),
        joins: {},
        mergedRows: [],
        totalExecutionTimeMs: Math.round(performance.now() - startTime),
      };
    }
  }

  /**
   * Performs a client-side merge join — enriches base rows with data from join collections.
   *
   * For each base row, looks up matching join rows by the join key field.
   * If `asOf` is specified (temporal join), finds the join row whose timestamp is
   * closest to (but not after) the base row's timestamp field.
   *
   * Join fields are merged into the base row with an optional prefix to avoid collisions.
   *
   * @param baseRows - Rows from the base collection
   * @param joins - Join definitions (collection, on, asOf, type, prefix)
   * @param joinResults - Fetched join data keyed by domain
   * @returns Merged rows (base rows enriched with join data)
   */
  private mergeJoin(
    baseRows: Record<string, any>[],
    joins: QueryJoin[],
    joinResults: Record<string, RawDataResult>
  ): Record<string, any>[] {
    if (joins.length === 0 || baseRows.length === 0) {
      return baseRows;
    }

    // Build lookup maps for each join collection, keyed by the join field value
    const joinMaps: Map<string, Map<string, Record<string, any>[]>> = new Map();
    const temporalJoinConfigs: Map<string, { asOf: string; joinField: string }> = new Map();

    for (const join of joins) {
      const joinData = joinResults[join.collection];
      if (!joinData || joinData.documents.length === 0) {
        continue;
      }

      // Build a map: joinKeyValue → array of join rows (for one-to-many relationships)
      const lookupMap = new Map<string, Record<string, any>[]>();
      for (const doc of joinData.documents) {
        const joinKeyValue = String(doc[join.on] ?? doc._id ?? '');
        if (joinKeyValue) {
          if (!lookupMap.has(joinKeyValue)) {
            lookupMap.set(joinKeyValue, []);
          }
          lookupMap.get(joinKeyValue)!.push(doc);
        }
      }
      joinMaps.set(join.collection, lookupMap);

      // Track temporal join config
      if (join.asOf) {
        temporalJoinConfigs.set(join.collection, {
          asOf: join.asOf,
          joinField: join.on,
        });
      }
    }

    // Merge join data into each base row
    return baseRows.map(baseRow => {
      const merged = { ...baseRow };

      for (const join of joins) {
        const lookupMap = joinMaps.get(join.collection);
        if (!lookupMap) continue;

        const joinKeyValue = String(baseRow[join.on] ?? '');
        const candidates = lookupMap.get(joinKeyValue);

        if (!candidates || candidates.length === 0) {
          // Left join: keep base row even if no match (join fields stay undefined)
          if (join.type === 'inner') {
            // Inner join: filter out base rows with no match
            return null;
          }
          continue;
        }

        // Pick the best join row
        let bestMatch: Record<string, any>;
        const temporalConfig = temporalJoinConfigs.get(join.collection);

        if (temporalConfig) {
          // Temporal join: find the join row whose timestamp is closest to (but not after)
          // the base row's timestamp field
          const baseTimestamp = this.extractTimestamp(baseRow, temporalConfig.asOf);
          bestMatch = this.findClosestBefore(candidates, baseTimestamp);
        } else {
          // Regular join: take the first match
          bestMatch = candidates[0];
        }

        // Merge join fields into the base row with optional prefix
        const prefix = join.prefix || '';
        for (const [key, value] of Object.entries(bestMatch)) {
          if (key === '_id') continue; // Don't overwrite _id
          const targetKey = prefix ? `${prefix}${key}` : key;
          // Only set if not already present (base row fields take precedence)
          if (!(targetKey in merged)) {
            merged[targetKey] = value;
          }
        }
      }

      return merged;
    }).filter((row): row is Record<string, any> => row !== null);
  }

  /**
   * Extracts a timestamp from a document using a dot-notation path.
   * e.g., "shiftReadings.recordedAt" → doc.recordedAt (if base is shiftReadings)
   */
  private extractTimestamp(doc: Record<string, any>, fieldPath: string): number {
    // Handle dot notation: "shiftReadings.recordedAt" → take the part after the first dot
    const parts = fieldPath.split('.');
    const fieldName = parts.length > 1 ? parts[parts.length - 1] : parts[0];

    const raw = doc[fieldName] || doc.timestamp || doc.date || doc.createdAt;
    if (!raw) return 0;

    const t = raw instanceof Date ? raw.getTime() : new Date(raw).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  /**
   * Finds the join row whose timestamp is closest to (but not after) the target timestamp.
   * Used for temporal joins (e.g., "productRates as of shiftReadings.recordedAt").
   */
  private findClosestBefore(
    candidates: Record<string, any>[],
    targetTimestamp: number
  ): Record<string, any> {
    if (candidates.length === 1) return candidates[0];

    let best = candidates[0];
    let bestTime = this.extractTimestamp(best, 'timestamp');

    for (let i = 1; i < candidates.length; i++) {
      const candidateTime = this.extractTimestamp(candidates[i], 'timestamp');
      // Candidate must be before or at the target time, and closer than current best
      if (candidateTime <= targetTimestamp && candidateTime > bestTime) {
        best = candidates[i];
        bestTime = candidateTime;
      }
    }

    return best;
  }

  /**
   * Realtime subscription for a queryPlan — subscribes to the base collection
   * and re-merges with cached join data on every update.
   *
   * @param plan - Declarative query plan
   * @param context - Tenant context
   * @param onChange - Called with the freshest merged result after every change
   * @returns Unsubscribe function
   */
  subscribe(
    plan: QueryPlan,
    context: QueryContext,
    onChange: (result: ResolvedQueryResult) => void
  ): () => void {
    if (!context.orgId || !context.stationId || !plan.base) {
      return () => {};
    }

    // Cache join data (joins don't change as frequently as base)
    let cachedJoinResults: Record<string, RawDataResult> = {};

    // Pre-fetch join data once
    const joinDomains = (plan.joins || []).map(j => j.collection);
    if (joinDomains.length > 0) {
      this.queryEngine.queryMultiple(joinDomains, context, false).then(results => {
        cachedJoinResults = results;
      });
    }

    // Subscribe to base collection
    const unsubscribe = this.queryEngine.subscribeCollection(
      plan.base,
      context,
      (baseResult) => {
        // Re-merge with cached join data
        const mergedRows = this.mergeJoin(
          baseResult.documents,
          plan.joins || [],
          cachedJoinResults
        );

        onChange({
          base: baseResult,
          joins: cachedJoinResults,
          mergedRows,
          totalExecutionTimeMs: 0,
        });
      }
    );

    return unsubscribe;
  }

  private emptyResult(collection: string): RawDataResult {
    return {
      collection,
      documents: [],
      count: 0,
      fetchedAt: new Date(),
      executionTimeMs: 0,
    };
  }
}