import { Product, Staff } from '../../types';
// UTILITY HELPERS
// ==========================================
export const getStaffInfo = (staffList: Staff[], staffId: string) => {
 const s = staffList.find(x => x.id === staffId);
 return {
 name: s ? s.name : staffId || 'System',
 role: s ? s.role.toUpperCase() : 'CASHIER'
 };
};

export const getProductRate = (productList: Product[], productId: string, fallback: number) => {
 const p = productList.find(x => x.id === productId);
 return p ? p.rate : fallback;
};

/**
 * Classifies a fuel product as petrol, diesel, cng, or null (non-fuel).
 * Resolution order:
 * 1. product.type must be 'fuel'
 * 2. Match by product ID semantics (prod_f1/petrol = petrol, prod_f2/diesel = diesel)
 * 3. Match by product name keywords
 */
export const getFuelCategory = (productId: string, products: Product[]): 'petrol' | 'diesel' | 'cng' | null => {
 const p = products.find(prod => prod.id === productId);
 if (!p) return null;
 if (p.type !== 'fuel') return null;

 const idLower = p.id.toLowerCase();
 const nameLower = p.name.toLowerCase();

 if (
 idLower === 'petrol' ||
 idLower === 'prod_f1' ||
 idLower === 'prod_f3' ||
 nameLower.includes('petrol') ||
 nameLower.includes('pmg') ||
 nameLower.includes('hobc') ||
 nameLower.includes('octane') ||
 nameLower.includes('super')
 ) {
 return 'petrol';
 }
 if (
 idLower === 'diesel' ||
 idLower === 'prod_f2' ||
 nameLower.includes('diesel') ||
 nameLower.includes('hsd')
 ) {
 return 'diesel';
 }
 if (
 idLower === 'cng' ||
 nameLower.includes('cng') ||
 nameLower.includes('gas')
 ) {
 return 'cng';
 }
 return null;
};

/**
 * Returns a COGS (cost of goods sold) estimate per unit for a product.
 * For fuel products, uses a margin band relative to the sale rate:
 * petrol/hobc: rate minus ~Rs.4.5
 * diesel: rate minus ~Rs.4.0
 * cng: rate minus ~Rs.3.0
 * lube/other: 92% of sale rate
 */
export const getFuelCogsRate = (productId: string, products: Product[]): number => {
 const p = products.find(prod => prod.id === productId);
 if (!p) return 268;
 const cat = getFuelCategory(productId, products);
 if (cat === 'petrol') return Math.max(0, p.rate - 4.5);
 if (cat === 'diesel') return Math.max(0, p.rate - 4.0);
 if (cat === 'cng') return Math.max(0, p.rate - 3.0);
 return p.rate * 0.92;
};

