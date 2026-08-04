/**
 * FuelPro Enterprise — ASTM D1250 / API MPMS Standard Petroleum Engineering Engine
 * 
 * Implements Standard ASTM D1250 / API MPMS Volume Correction Factor (VCF) 
 * for Gasoline (MS/HOBC) and Diesel (HSD) at 15°C (59°F) reference temperature.
 */

export interface ASTMCorrectionResult {
  observedTempC: number;
  observedDensity: number; // g/cm³ or kg/m³
  referenceTempC: number;  // 15°C
  alpha15: number;          // Thermal expansion coefficient
  vcf: number;              // Volume Correction Factor (VCF)
  grossVolumeL: number;
  netVolumeL: number;       // Adjusted volume at 15°C
  temperatureDeltaC: number;
  varianceVolumeL: number;
  fuelGroup: 'GASOLINE' | 'DIESEL' | 'HOBC' | 'LUBRICANT';
}

export class ASTMD1250Engine {
  /**
   * Calculate Volume Correction Factor (VCF) at 15°C
   * Formula derived from ASTM D1250-04 Table 54B / 54A
   */
  static calculateVCF(
    observedTempC: number,
    observedDensityGcm3: number,
    productType: 'MS' | 'HSD' | 'HOBC' | 'LUBE' | string = 'MS'
  ): number {
    // Standard reference temp is 15°C
    const referenceTempC = 15.0;
    const tempDiff = observedTempC - referenceTempC;

    if (Math.abs(tempDiff) < 0.05) return 1.0;

    // Convert density to kg/m³ if supplied in g/cm³ (e.g. 0.745 -> 745 kg/m³)
    const densityKgM3 = observedDensityGcm3 < 10 ? observedDensityGcm3 * 1000 : observedDensityGcm3;

    // Thermal expansion coefficient alpha15 at 15°C
    let alpha15 = 0.0012; // Default Gasoline

    if (productType === 'HSD' || densityKgM3 > 800) {
      // Diesel Fuel / Gas Oil (Group 54B)
      alpha15 = 0.00084;
    } else if (productType === 'HOBC' || (densityKgM3 >= 720 && densityKgM3 <= 775)) {
      // Premium Gasoline
      alpha15 = 0.00125;
    } else if (productType === 'MS') {
      // Motor Spirit Gasoline
      alpha15 = 0.00120;
    }

    // ASTM D1250 VCF approximation: VCF = exp(-alpha15 * (T - 15) * (1 + 0.8 * alpha15 * (T - 15)))
    const vcf = Math.exp(-alpha15 * tempDiff * (1 + 0.8 * alpha15 * tempDiff));

    return parseFloat(vcf.toFixed(5));
  }

  /**
   * Correct Gross Volume to Standard Net Volume at 15°C
   */
  static correctVolumeAt15C(
    grossVolumeL: number,
    observedTempC: number,
    observedDensityGcm3: number,
    productType: string = 'MS'
  ): ASTMCorrectionResult {
    const vcf = this.calculateVCF(observedTempC, observedDensityGcm3, productType);
    const netVolumeL = Math.round(grossVolumeL * vcf);
    const tempDiff = observedTempC - 15.0;
    const varianceVolumeL = netVolumeL - grossVolumeL;

    let fuelGroup: 'GASOLINE' | 'DIESEL' | 'HOBC' | 'LUBRICANT' = 'GASOLINE';
    if (productType === 'HSD') fuelGroup = 'DIESEL';
    if (productType === 'HOBC') fuelGroup = 'HOBC';
    if (productType === 'LUBE') fuelGroup = 'LUBRICANT';

    return {
      observedTempC,
      observedDensity: observedDensityGcm3,
      referenceTempC: 15.0,
      alpha15: productType === 'HSD' ? 0.00084 : 0.0012,
      vcf,
      grossVolumeL,
      netVolumeL,
      temperatureDeltaC: parseFloat(tempDiff.toFixed(1)),
      varianceVolumeL,
      fuelGroup
    };
  }

  /**
   * Water Dip Volume Deduction Calculator
   * Converts water dip height (mm) to water volume (L) using cylindrical tank geometry
   */
  static calculateWaterVolumeLiters(
    waterDepthMm: number,
    tankDiameterMm: number = 2500,
    tankLengthMm: number = 8000
  ): number {
    if (waterDepthMm <= 0) return 0;

    const r = tankDiameterMm / 2000; // Radius in meters
    const h = waterDepthMm / 1000;   // Water height in meters
    const L = tankLengthMm / 1000;   // Length in meters

    if (h >= 2 * r) return Math.round(Math.PI * r * r * L * 1000);

    // Segment area of cylinder formula: A = r^2 * acos((r-h)/r) - (r-h) * sqrt(2*r*h - h^2)
    const term = Math.max(-1, Math.min(1, (r - h) / r));
    const segmentArea = r * r * Math.acos(term) - (r - h) * Math.sqrt(2 * r * h - h * h);
    const waterVolumeM3 = segmentArea * L;

    return Math.round(waterVolumeM3 * 1000);
  }
}
