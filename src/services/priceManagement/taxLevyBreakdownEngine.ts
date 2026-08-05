export interface OGRATaxBreakdown {
  productName: string;
  exRefineryPrice: number; // e.g. 195.40
  ifem: number; // e.g. 4.75
  petroleumLevy: number; // e.g. 60.00
  salesTaxGST: number; // e.g. 16.66
  dealerMargin: number; // e.g. 8.64
  omcMargin: number; // e.g. 7.87
  finalRetailPrice: number; // e.g. 285.45
}

export const taxLevyBreakdownEngine = {
  getBreakdownForProduct: (productName: string, retailPrice: number): OGRATaxBreakdown => {
    const isPetrol = productName.toLowerCase().includes('petrol');
    const isDiesel = productName.toLowerCase().includes('diesel');

    if (isPetrol) {
      return {
        productName: 'Super Petrol (MS 92)',
        exRefineryPrice: 198.54,
        ifem: 3.76,
        petroleumLevy: 60.00,
        salesTaxGST: 0.00, // Zero-rated or integrated
        dealerMargin: 8.64,
        omcMargin: 7.87,
        finalRetailPrice: retailPrice || 285.45
      };
    } else if (isDiesel) {
      return {
        productName: 'High Speed Diesel (HSD)',
        exRefineryPrice: 209.43,
        ifem: 4.22,
        petroleumLevy: 60.00,
        salesTaxGST: 0.00,
        dealerMargin: 8.64,
        omcMargin: 7.87,
        finalRetailPrice: retailPrice || 293.80
      };
    }

    return {
      productName: productName,
      exRefineryPrice: Math.round(retailPrice * 0.70 * 100) / 100,
      ifem: 3.50,
      petroleumLevy: 50.00,
      salesTaxGST: Math.round(retailPrice * 0.18 * 100) / 100,
      dealerMargin: 12.50,
      omcMargin: 8.00,
      finalRetailPrice: retailPrice
    };
  }
};
