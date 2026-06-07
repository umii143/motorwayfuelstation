import { describe, it, expect } from 'vitest';

// Core dip chart calculator with VCF from server.ts
export function calculateDipLiters(params: {
  dipCm: number;
  dipChart: { cm: number; liters: number }[];
  temperatureCelsius?: number;
}) {
  const { dipCm, dipChart, temperatureCelsius } = params;
  if (dipChart.length < 2) {
    throw new Error('Valid dip chart array with at least 2 points required.');
  }

  // Sort chart by height (cm) ascending
  const sorted = [...dipChart].sort((a, b) => a.cm - b.cm);
  
  // Boundary clamping to prevent negative or wild extrapolation
  const minCm = sorted[0].cm;
  const maxCm = sorted[sorted.length - 1].cm;
  const clampedCm = Math.max(minCm, Math.min(maxCm, dipCm));

  // Find lower and upper bounds
  let lower = sorted[0];
  let upper = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (clampedCm >= sorted[i].cm && clampedCm <= sorted[i + 1].cm) {
      lower = sorted[i];
      upper = sorted[i + 1];
      break;
    }
  }

  // Linear interpolation formula
  const heightDiff = upper.cm - lower.cm;
  const ratio = heightDiff === 0 ? 0 : (clampedCm - lower.cm) / heightDiff;
  const liters = lower.liters + ratio * (upper.liters - lower.liters);

  // Temperature VCF compensation (ATC standard 15°C baseline)
  const temp = temperatureCelsius ?? 15;
  const vcf = 1 - 0.00065 * (temp - 15);
  
  const rawLiters = Math.round(liters * 10) / 10;
  const correctedLiters = Math.round(liters * vcf * 10) / 10;

  return {
    rawLiters,
    correctedLiters,
    vcf: Math.round(vcf * 10000) / 10000
  };
}

describe('Tanks Dip Chart & ATC Correction Calculations', () => {
  const mockDipChart = [
    { cm: 0, liters: 0 },
    { cm: 50, liters: 4000 },
    { cm: 100, liters: 9000 },
    { cm: 150, liters: 15000 },
    { cm: 200, liters: 22000 },
    { cm: 250, liters: 25000 }
  ];

  it('should return exact point volume when dip matches a chart calibration point', () => {
    const result = calculateDipLiters({
      dipCm: 100,
      dipChart: mockDipChart,
      temperatureCelsius: 15 // baseline temp (no contraction/expansion)
    });

    expect(result.rawLiters).toBe(9000);
    expect(result.correctedLiters).toBe(9000);
    expect(result.vcf).toBe(1.0);
  });

  it('should correctly interpolate volume between calibration points', () => {
    // Interpolating 75cm (exactly halfway between 50cm [4000L] and 100cm [9000L])
    // Expected raw liters = 4000 + 0.5 * (9000 - 4000) = 6500L
    const result = calculateDipLiters({
      dipCm: 75,
      dipChart: mockDipChart,
      temperatureCelsius: 15
    });

    expect(result.rawLiters).toBe(6500);
    expect(result.correctedLiters).toBe(6500);
  });

  it('should apply volume contraction at low temperatures (<15°C)', () => {
    // Scenario: Fuel is cold (5°C) -> contracts -> volume is less than raw
    // VCF = 1 - 0.00065 * (5 - 15) = 1 - 0.00065 * (-10) = 1.0065
    // Net volume expands when converted to standard 15°C baseline
    const result = calculateDipLiters({
      dipCm: 100,
      dipChart: mockDipChart,
      temperatureCelsius: 5
    });

    expect(result.vcf).toBe(1.0065);
    expect(result.rawLiters).toBe(9000);
    expect(result.correctedLiters).toBe(9058.5); // 9000 * 1.0065 = 9058.5
  });

  it('should apply volume expansion at high temperatures (>15°C)', () => {
    // Scenario: Fuel is hot (35°C) -> expands -> volume is greater than standard
    // VCF = 1 - 0.00065 * (35 - 15) = 1 - 0.00065 * (20) = 0.987
    // Net volume contracts when corrected to 15°C baseline
    const result = calculateDipLiters({
      dipCm: 100,
      dipChart: mockDipChart,
      temperatureCelsius: 35
    });

    expect(result.vcf).toBe(0.987);
    expect(result.rawLiters).toBe(9000);
    expect(result.correctedLiters).toBe(8883); // 9000 * 0.987 = 8883
  });

  it('should boundary lock the calculation to tank limits', () => {
    // Under 0cm height limit
    const resultMin = calculateDipLiters({
      dipCm: -5,
      dipChart: mockDipChart,
      temperatureCelsius: 15
    });
    expect(resultMin.rawLiters).toBe(0);

    // Over maximum height (250cm, 25000L)
    const resultMax = calculateDipLiters({
      dipCm: 280,
      dipChart: mockDipChart,
      temperatureCelsius: 15
    });
    expect(resultMax.rawLiters).toBe(25000);
  });
});
