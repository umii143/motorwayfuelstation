import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '../../lib/currency';
import { GlobalSettings, Product } from '../../types';

interface LubeInventoryDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalSettings;
  products: Product[];
}

export default function LubeInventoryDrillDownModal({
  isOpen,
  onClose,
  settings,
  products
}: LubeInventoryDrillDownModalProps) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const lubeProducts = useMemo(() => {
    return products.filter(p => p.type === 'lube');
  }, [products]);

  const metrics = useMemo(() => {
    const totalQty = lubeProducts.reduce((sum, p) => sum + p.currentStock, 0);
    const totalValue = lubeProducts.reduce((sum, p) => sum + (p.currentStock * p.rate), 0);
    const totalCost = lubeProducts.reduce((sum, p) => sum + (p.currentStock * (p.purchasePrice || p.rate)), 0);
    const expectedProfit = totalValue - totalCost;
    const profitMarginPct = totalValue > 0 ? (expectedProfit / totalValue) * 100 : 0;
    const lowStockCount = lubeProducts.filter(p => p.currentStock <= p.minStock).length;

    return {
      totalQty,
      totalValue,
      expectedProfit,
      profitMarginPct,
      totalCost,
      lowStockCount
    };
  }, [lubeProducts]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* HEADER */}
          <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {t('Lubricant Inventory Intelligence', 'لبریکنٹ اسٹاک انٹیلی جنس')}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {t('Stock Value, Margins & Product Breakdown', 'اسٹاک ویلیو، منافع اور تفصیل')}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* MAIN SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* EXECUTIVE KPI HEADER */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="premium-card border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {t('Total Quantity', 'کل مقدار')}
                </span>
                <h3 className="text-2xl font-black text-slate-900">{metrics.totalQty.toLocaleString()} <span className="text-sm">Units</span></h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Package className="h-3.5 w-3.5" />
                  {t('Physical stock on hand', 'موجودہ فزیکل اسٹاک')}
                </div>
              </div>

              <div className="premium-card border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {t('Total Retail Value', 'کل ریٹیل ویلیو')}
                </span>
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(metrics.totalValue, settings)}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <DollarSign className="h-3.5 w-3.5" />
                  {t('If sold at current rate', 'اگر موجودہ ریٹ پر فروخت ہو')}
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 shadow-sm">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block mb-1">
                  {t('Expected Profit', 'متوقع منافع')}
                </span>
                <h3 className="text-2xl font-black text-emerald-900">+{formatCurrency(metrics.expectedProfit, settings)}</h3>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {metrics.profitMarginPct.toFixed(1)}% {t('Average Margin', 'اوسط مارجن')}
                </div>
              </div>

              <div className={`${metrics.lowStockCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'} rounded-xl border p-5 shadow-sm`}>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${metrics.lowStockCount > 0 ? 'text-red-800' : 'text-slate-500'}`}>
                  {t('Low Stock Alerts', 'کم اسٹاک الرٹ')}
                </span>
                <h3 className={`text-2xl font-black ${metrics.lowStockCount > 0 ? 'text-red-900' : 'text-slate-900'}`}>
                  {metrics.lowStockCount} {t('Items', 'آئٹمز')}
                </h3>
                <div className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${metrics.lowStockCount > 0 ? 'text-red-700' : 'text-slate-500'}`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t('Below minimum threshold', 'کم از کم حد سے نیچے')}
                </div>
              </div>
            </div>

            {/* PRODUCT BREAKDOWN */}
            <div className="premium-card border overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {t('Product Level Breakdown', 'پروڈکٹ کی تفصیل')}
                </h3>
              </div>

              <div className="overflow-x-auto max-h-[400px]">
                <table className="premium-table">
                  <thead className="sticky top-0 z-10 shadow-sm">
                    <tr className="text-[10px] font-black">
                      <th className="p-3">{t('Product Name', 'پروڈکٹ کا نام')}</th>
                      <th className="p-3 text-right">{t('Stock Qty', 'اسٹاک مقدار')}</th>
                      <th className="p-3 text-right">{t('Purchase Price', 'خرید قیمت')}</th>
                      <th className="p-3 text-right">{t('Selling Price', 'فروخت قیمت')}</th>
                      <th className="p-3 text-right">{t('Total Value', 'کل ویلیو')}</th>
                      <th className="p-3 text-right">{t('Profit Margin', 'منافع مارجن')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lubeProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 text-sm font-medium">
                          {t('No lubricant products found.', 'کوئی لبریکنٹ پروڈکٹ نہیں ملی۔')}
                        </td>
                      </tr>
                    ) : (
                      lubeProducts.sort((a, b) => b.currentStock - a.currentStock).map((prod) => {
                        const cost = prod.purchasePrice || prod.rate;
                        const value = prod.currentStock * prod.rate;
                        const profit = value - (prod.currentStock * cost);
                        const margin = value > 0 ? (profit / value) * 100 : 0;
                        const isLow = prod.currentStock <= prod.minStock;

                        return (
                          <tr key={prod.id} className={`hover:bg-slate-50/50 transition-colors ${isLow ? 'bg-red-50/30' : ''}`}>
                            <td className="p-3">
                              <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                {isUrdu ? prod.urduName : prod.name}
                                {isLow && <span title="Low Stock"><AlertTriangle className="h-3 w-3 text-red-500" /></span>}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              <span className={`font-mono text-xs font-bold ${isLow ? 'text-red-600' : 'text-slate-700'}`}>
                                {prod.currentStock} {prod.unit}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-mono text-xs text-slate-500">
                                {cost.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {prod.rate.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="font-mono text-xs font-bold text-emerald-700">
                                {formatCurrency(value, settings)}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className={`font-mono text-[10px] font-black px-2 py-1 rounded-md ${margin > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {margin > 0 ? '+' : ''}{margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
