import { describe, it, expect } from 'vitest';
import { pctDelta, statusFor } from '../lib/reports-v2/ebip/reports/deltaLogic';

describe('pctDelta', () => {
  it('computes positive growth', () => {
    expect(pctDelta(110, 100)).toBeCloseTo(10, 5);
  });

  it('computes decline as a negative percentage', () => {
    expect(pctDelta(80, 100)).toBeCloseTo(-20, 5);
  });

  it('returns null when previous is 0 (no fabricated percentage)', () => {
    expect(pctDelta(500, 0)).toBeNull();
  });

  it('returns 0 for no change', () => {
    expect(pctDelta(100, 100)).toBe(0);
  });

  it('handles negative previous values via absolute baseline', () => {
    expect(pctDelta(-80, -100)).toBeCloseTo(20, 5);
  });
});

describe('statusFor', () => {
  it('flags growth as UP when higher is better', () => {
    expect(statusFor(12, true)).toBe('UP');
  });

  it('flags growth as DOWN for a cost metric (higher is worse)', () => {
    expect(statusFor(12, false)).toBe('DOWN');
  });

  it('flags decline as DOWN when higher is better', () => {
    expect(statusFor(-8, true)).toBe('DOWN');
  });

  it('flags decline as UP for a cost metric', () => {
    expect(statusFor(-8, false)).toBe('UP');
  });

  it('treats sub-0.5% movement as FLAT (never over-claims a trend)', () => {
    expect(statusFor(0.3, true)).toBe('FLAT');
    expect(statusFor(-0.4, false)).toBe('FLAT');
  });

  it('returns NA when the delta cannot be computed', () => {
    expect(statusFor(null, true)).toBe('NA');
  });
});
