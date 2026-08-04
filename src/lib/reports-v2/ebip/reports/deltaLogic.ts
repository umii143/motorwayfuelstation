/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro EBIP — Period Comparison Delta Logic
 *
 * Pure, deterministic helpers for the deep-analytics period comparison.
 * Extracted from the panel so the exact business rules are unit-testable
 * (Rule #110: business logic lives in the registry/layer, not the UI).
 */

export type DeltaStatus = 'UP' | 'DOWN' | 'FLAT' | 'NA';

/**
 * Percentage change from previous to current. Returns null when the previous
 * value is 0 (a percentage would be meaningless — the caller must report the
 * fact instead of inferring a trend, per Rules #123/#124).
 */
export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Classifies a delta as UP / DOWN / FLAT / NA relative to business intent.
 * `higherIsBetter` inverts the meaning: a rising expense (cost metric) is
 * DOWN (bad), while a rising revenue is UP (good).
 */
export function statusFor(delta: number | null, higherIsBetter: boolean): DeltaStatus {
  if (delta === null) return 'NA';
  if (delta > 0.5) return higherIsBetter ? 'UP' : 'DOWN';
  if (delta < -0.5) return higherIsBetter ? 'DOWN' : 'UP';
  return 'FLAT';
}
