import { GlobalSettings } from '../types';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  urduSymbol: string;
  name: string;
  urduName: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'PKR', symbol: 'Rs.', urduSymbol: 'روپے', name: 'Pakistani Rupee', urduName: 'پاکستانی روپیہ' },
  { code: 'USD', symbol: '$', urduSymbol: 'ڈالر', name: 'US Dollar', urduName: 'امریکی ڈالر' },
  { code: 'EUR', symbol: '€', urduSymbol: 'یورو', name: 'Euro', urduName: 'یورو' },
  { code: 'GBP', symbol: '£', urduSymbol: 'پاؤنڈ', name: 'British Pound', urduName: 'برطانوی پاؤنڈ' },
  { code: 'AED', symbol: 'د.إ', urduSymbol: 'درہم', name: 'UAE Dirham', urduName: 'اماراتی درہم' },
  { code: 'SAR', symbol: 'ر.س', urduSymbol: 'ریال', name: 'Saudi Riyal', urduName: 'سعودی ریال' }
];

export function getCurrencyConfig(settings?: GlobalSettings): CurrencyConfig {
  const currencyCode = settings?.currency || 'PKR';
  return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
}

export function formatCurrency(amount: number, settings?: GlobalSettings): string {
  const cfg = getCurrencyConfig(settings);
  const formatted = typeof amount === 'number' 
    ? amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : '0';

  if (settings?.language === 'ur') {
    return `${formatted} ${cfg.urduSymbol}`;
  }
  return `${cfg.symbol} ${formatted}`;
}

export function getCurrencySymbol(settings?: GlobalSettings): string {
  return getCurrencyConfig(settings).symbol;
}
