/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Reports Platform v2.0 — Layer Registry
 *
 * Manages the 15 Intelligence Layers that organize all enterprise reports.
 * Each layer represents a business domain (Executive, Fuel Ops, Financial, etc.)
 */

import type { IntelligenceLayerDefinition, IntelligenceLayerId } from '../types/enterpriseReportTypes';
import { ManifestRegistry } from '../manifest/manifestRegistry';

/**
 * Static registry of all 15 Intelligence Layers.
 * Ordered by layerNumber for consistent navigation.
 */
const LAYERS: readonly IntelligenceLayerDefinition[] = [
  {
    id: 'executive',
    nameEn: 'Executive Intelligence',
    nameUr: 'ایگزیکٹو انٹیلیجنس',
    layerNumber: 1,
    iconName: 'Crown',
    emoji: '👑',
    descriptionEn: 'Business health scores, P&L, executive KPIs, and strategic overview.',
    descriptionUr: 'کاروباری صحت، نفع و نقصان، اور ایگزیکٹو اشاریے۔',
    isEnabled: true
  },
  {
    id: 'fuel_operations',
    nameEn: 'Fuel Operations Intelligence',
    nameUr: 'فیول آپریشنز انٹیلیجنس',
    layerNumber: 2,
    iconName: 'Fuel',
    emoji: '⛽',
    descriptionEn: 'Pump-wise sales, nozzle efficiency, shift performance, and dispenser analytics.',
    descriptionUr: 'پمپ وائز فروخت، نازل کارکردگی، اور شفٹ تجزیات۔',
    isEnabled: true
  },
  {
    id: 'wet_stock',
    nameEn: 'Wet Stock & Tank Intelligence',
    nameUr: 'ٹینک اسٹاک انٹیلیجنس',
    layerNumber: 3,
    iconName: 'Droplets',
    emoji: '🛢️',
    descriptionEn: 'Tank dip levels, variance detection, shrinkage analysis, and ATG telemetry.',
    descriptionUr: 'ٹینک سطح، فرق تجزیہ، نقصان تحقیقات، اور اے ٹی جی ڈیٹا۔',
    isEnabled: true
  },
  {
    id: 'financial',
    nameEn: 'Financial & General Ledger',
    nameUr: 'مالیاتی اور عام لیجر',
    layerNumber: 4,
    iconName: 'DollarSign',
    emoji: '📒',
    descriptionEn: 'Revenue, expenses, profit margins, cash flow, and general ledger reports.',
    descriptionUr: 'آمدنی، اخراجات، منافع، نقد بہاؤ، اور عام لیجر رپورٹیں۔',
    isEnabled: true
  },
  {
    id: 'banking',
    nameEn: 'Banking & Digital Wallet',
    nameUr: 'بینکنگ اور ڈیجیٹل والیٹ',
    layerNumber: 5,
    iconName: 'Building',
    emoji: '🏦',
    descriptionEn: 'Bank deposits, reconciliation, digital wallet transactions, and cash management.',
    descriptionUr: 'بینک ڈپازٹ، مفاہمت، ڈیجیٹل والیٹ، اور نقدی انتظام۔',
    isEnabled: true
  },
  {
    id: 'staff',
    nameEn: 'Staff & Shift Intelligence',
    nameUr: 'عملہ اور شفٹ انٹیلیجنس',
    layerNumber: 6,
    iconName: 'Users',
    emoji: '👥',
    descriptionEn: 'Staff performance, shift analytics, attendance, salary, and workforce KPIs.',
    descriptionUr: 'عملے کی کارکردگی، شفٹ تجزیات، حاضری، اور تنخواہ۔',
    isEnabled: true
  },
  {
    id: 'supplier',
    nameEn: 'Supplier & Purchase',
    nameUr: 'سپلائر اور خریداری',
    layerNumber: 7,
    iconName: 'Truck',
    emoji: '🚚',
    descriptionEn: 'Supplier ledger, purchase orders, payment tracking, and procurement analytics.',
    descriptionUr: 'سپلائر لیجر، خریداری آرڈر، ادائیگی ٹریکنگ، اور خریداری تجزیات۔',
    isEnabled: true
  },
  {
    id: 'customer',
    nameEn: 'Customer & Credit',
    nameUr: 'گاہک اور ادھار',
    layerNumber: 8,
    iconName: 'Award',
    emoji: '🤝',
    descriptionEn: 'Customer ledger, credit management, aging reports, and CRM intelligence.',
    descriptionUr: 'گاہک لیجر، ادھار انتظام، عمر رسیدہ رپورٹیں، اور سی آر ایم۔',
    isEnabled: true
  },
  {
    id: 'fleet',
    nameEn: 'Fleet & Corporate',
    nameUr: 'فلیٹ اور کارپوریٹ',
    layerNumber: 9,
    iconName: 'Truck',
    emoji: '🏢',
    descriptionEn: 'Fleet accounts, vehicle tracking, corporate sales, and bulk transactions.',
    descriptionUr: 'فلیٹ اکاؤنٹ، گاڑیوں کی ٹریکنگ، کارپوریٹ فروخت۔',
    isEnabled: true
  },
  {
    id: 'risk',
    nameEn: 'Risk & Compliance',
    nameUr: 'رسک اور تعمیل',
    layerNumber: 10,
    iconName: 'ShieldAlert',
    emoji: '⚠️',
    descriptionEn: 'Fraud detection, loss prevention, compliance monitoring, and risk scoring.',
    descriptionUr: 'دھوکا دہی کا پتہ لگانا، نقصان کی روک تھام، تعمیل نگرانی۔',
    isEnabled: true
  },
  {
    id: 'forecast',
    nameEn: 'Forecast & Business Intelligence',
    nameUr: 'پیشنگوئی اور بزنس انٹیلیجنس',
    layerNumber: 11,
    iconName: 'TrendingUp',
    emoji: '📈',
    descriptionEn: 'Demand forecasting, trend analysis, predictive analytics, and business intelligence.',
    descriptionUr: 'ڈیمانڈ کی پیشنگوئی، ٹرینڈ تجزیہ، اور بزنس انٹیلیجنس۔',
    isEnabled: true
  },
  {
    id: 'audit',
    nameEn: 'Audit & Investigation',
    nameUr: 'آڈٹ اور تحقیقات',
    layerNumber: 12,
    iconName: 'Eye',
    emoji: '🔍',
    descriptionEn: 'Audit trails, investigation tools, data integrity, and compliance reports.',
    descriptionUr: 'آڈٹ ٹریل، تحقیقاتی ٹولز، ڈیٹا انٹیگریٹی، اور تعمیل رپورٹیں۔',
    isEnabled: true
  },
  {
    id: 'valuation',
    nameEn: 'Inventory Valuation',
    nameUr: 'انوینٹری ویلیوایشن',
    layerNumber: 13,
    iconName: 'Layers',
    emoji: '📦',
    descriptionEn: 'FIFO/LIFO valuation, asset value, stock aging, and inventory health.',
    descriptionUr: 'فیفو/لائفو ویلیوایشن، اثاثہ قیمت، اسٹاک عمر، اور انوینٹری صحت۔',
    isEnabled: true
  },
  {
    id: 'tax',
    nameEn: 'Tax & Regulatory',
    nameUr: 'ٹیکس اور ریگولیٹری',
    layerNumber: 14,
    iconName: 'Scale',
    emoji: '⚖️',
    descriptionEn: 'Tax calculations, OGRA compliance, GST/WHT reports, and regulatory filings.',
    descriptionUr: 'ٹیکس حسابات، اوگرا تعمیل، جی ایس ٹی رپورٹیں، اور ریگولیٹری فائلنگ۔',
    isEnabled: true
  },
  {
    id: 'multi_branch',
    nameEn: 'Multi-Branch Consolidated',
    nameUr: 'ملٹی برانچ مجموعی',
    layerNumber: 15,
    iconName: 'Sparkles',
    emoji: '🌐',
    descriptionEn: 'Cross-branch consolidation, comparative analytics, and enterprise-wide rollups.',
    descriptionUr: 'کراس برانچ مجموعی، تقابلی تجزیات، اور انٹرپرائز رول اپ۔',
    isEnabled: true
  }
] as const;

class LayerRegistryImpl {
  private readonly layers: Map<IntelligenceLayerId, IntelligenceLayerDefinition> = new Map();

  constructor() {
    for (const layer of LAYERS) {
      this.layers.set(layer.id, layer);
    }
  }

  /**
   * Get a specific layer by ID.
   */
  getLayer(id: IntelligenceLayerId): IntelligenceLayerDefinition | null {
    return this.layers.get(id) ?? null;
  }

  /**
   * Get all layers sorted by layerNumber.
   */
  getAllLayers(): IntelligenceLayerDefinition[] {
    return Array.from(this.layers.values()).sort((a, b) => a.layerNumber - b.layerNumber);
  }

  /**
   * Get only enabled layers.
   */
  getEnabledLayers(): IntelligenceLayerDefinition[] {
    return this.getAllLayers().filter(l => l.isEnabled);
  }

  /**
   * Get total layer count.
   */
  getLayerCount(): number {
    return this.layers.size;
  }

  /**
   * Get report count for a specific layer (from ManifestRegistry).
   */
  getLayerReportCount(layerId: IntelligenceLayerId): number {
    return ManifestRegistry.getByLayer(layerId).length;
  }

  /**
   * Check if a layer exists.
   */
  hasLayer(id: IntelligenceLayerId): boolean {
    return this.layers.has(id);
  }
}

/**
 * Singleton Layer Registry instance.
 */
export const LayerRegistry = new LayerRegistryImpl();
