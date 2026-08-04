import { describe, it, expect, beforeEach } from 'vitest';
import { HistoricalArchive } from '../lib/reports-v2/archival/HistoricalArchive';

// Node test env has no localStorage — provide a minimal in-memory stub.
const storage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => { storage.set(k, v); },
  removeItem: (k: string) => { storage.delete(k); },
  clear: () => storage.clear()
};

describe('HistoricalArchive window cache', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('returns null on a cold miss and counts it', () => {
    const archive = HistoricalArchive.getInstance();
    const hitsBefore = archive.stats().hits;
    const missesBefore = archive.stats().misses;
    expect(archive.getWindow('cold-key')).toBeNull();
    expect(archive.stats().misses).toBe(missesBefore + 1);
    expect(archive.stats().hits).toBe(hitsBefore);
  });

  it('returns cached docs on a warm hit and counts it', () => {
    const archive = HistoricalArchive.getInstance();
    const hitsBefore = archive.stats().hits;
    archive.putWindow('warm-key', [{ a: 1 }], 60_000);
    const docs = archive.getWindow('warm-key');
    expect(docs).toEqual([{ a: 1 }]);
    expect(archive.stats().hits).toBe(hitsBefore + 1);
  });

  it('evicts expired entries (TTL) instead of serving stale data', () => {
    const archive = HistoricalArchive.getInstance();
    const now = 1_000_000;
    archive.putWindow('ttl-key', [{ a: 1 }], 1000, now);
    // 2s later the entry is expired
    expect(archive.getWindow('ttl-key', now + 2000)).toBeNull();
    // exactly at expiry it is still valid
    archive.putWindow('ttl-key-2', [{ a: 1 }], 1000, now);
    expect(archive.getWindow('ttl-key-2', now + 1000)).not.toBeNull();
  });

  it('bounds the LRU cache at the 400-window cap and evicts the oldest', () => {
    const archive = HistoricalArchive.getInstance();
    // Fill far beyond the 400-window cap with distinct keys
    for (let i = 0; i < 405; i++) {
      archive.putWindow(`lru-key-${i}`, [{ i }], 60_000);
    }
    const stats = archive.stats();
    expect(stats.cachedWindows).toBe(400); // capped exactly
    expect(stats.evictions).toBeGreaterThan(0);
    // The oldest (first inserted) was evicted
    expect(archive.getWindow('lru-key-0')).toBeNull();
  });

  it('stores immutable state — consumer mutation cannot corrupt the cache', () => {
    const archive = HistoricalArchive.getInstance();
    archive.putWindow('copy-key', [{ id: 'x', amount: 100 }], 60_000);
    const firstRead = archive.getWindow('copy-key')!;
    // Documents are frozen on write: mutation must throw (Rule #106)
    expect(() => { firstRead[0].amount = 999; }).toThrow(TypeError);
    const secondRead = archive.getWindow('copy-key')!;
    expect(secondRead[0].amount).toBe(100);
  });

  it('builds tenant-isolated cache keys', () => {
    const k1 = HistoricalArchive.key('orgA', 'station1', 'SALES', 'sales', undefined, undefined);
    const k2 = HistoricalArchive.key('orgA', 'station2', 'SALES', 'sales', undefined, undefined);
    const k3 = HistoricalArchive.key('orgA', 'station1', 'TANKS', 'tanks', undefined, undefined);
    expect(k1).not.toBe(k2);
    expect(k1).not.toBe(k3);
  });
});

describe('HistoricalArchive immutable snapshots', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('captures and persists a snapshot with tenant tags', () => {
    const archive = HistoricalArchive.getInstance();
    const captured = archive.captureSnapshot({
      reportId: 'B-001',
      engineType: 'SalesRegister',
      reportName: 'Daily Sales Performance',
      orgId: 'orgA',
      stationId: 'station1',
      windowLabel: '2026-07-01 → 2026-07-31',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      capturedAt: new Date().toISOString(),
      dataQuality: 'VERIFIED',
      totalExecutionTimeMs: 42,
      kpis: [{ label: 'Total Sales', value: 100000, unit: 'PKR' }],
      registerCount: 25
    });
    expect(captured).not.toBeNull();
    expect(captured!.orgId).toBe('orgA');
    expect(captured!.stationId).toBe('station1');
    const restored = archive.getSnapshots();
    expect(restored.length).toBe(1);
    expect(restored[0].reportId).toBe('B-001');
    expect(restored[0].stationId).toBe('station1');
  });

  it('caps the snapshot list at 15 (oldest evicted)', () => {
    const archive = HistoricalArchive.getInstance();
    for (let i = 0; i < 20; i++) {
      archive.captureSnapshot({
        reportId: 'X-001',
        engineType: 'BusinessDashboard',
        orgId: 'orgA',
        stationId: 'station1',
        windowLabel: `w${i}`,
        dateFrom: '2026-01-01',
        dateTo: '2026-01-02',
        capturedAt: new Date().toISOString(),
        dataQuality: 'VERIFIED',
        totalExecutionTimeMs: 1,
        kpis: [],
        registerCount: 0
      });
    }
    const snapshots = archive.getSnapshots();
    expect(snapshots.length).toBe(15);
    expect(snapshots[0].windowLabel).toBe('w19'); // newest first
  });

  it('clears all snapshots', () => {
    const archive = HistoricalArchive.getInstance();
    archive.captureSnapshot({
      reportId: 'B-001', engineType: 'SalesRegister', orgId: 'orgA', stationId: 'station1',
      windowLabel: 'w', dateFrom: '2026-01-01', dateTo: '2026-01-02',
      capturedAt: new Date().toISOString(), dataQuality: 'VERIFIED',
      totalExecutionTimeMs: 1, kpis: [], registerCount: 0
    });
    archive.clearSnapshots();
    expect(archive.getSnapshots().length).toBe(0);
    expect(archive.stats().snapshots).toBe(0);
  });
});
