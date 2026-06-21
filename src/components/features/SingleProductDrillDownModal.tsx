import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Package, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  History,
  ShoppingCart,
  Truck,
  Pencil,
  Trash2,
  BarChart2
} from 'lucide-react';
import { formatCurrency } from '../../lib/currency';
import { GlobalSettings, Product, StockTransaction, Supplier } from '../../types';

interface SingleProductDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  stockTransactions: StockTransaction[];
  suppliers: Supplier[];
  settings: GlobalSettings;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function SingleProductDrillDownModal({
  isOpen,
  onClose,
  product,
  stockTransactions,
  suppliers,
  settings,
  onEdit,
  onDelete
}: SingleProductDrillDownModalProps) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Compute metrics only when product is available
  const metrics = useMemo(() => {
    if (!product) return null;

    // Get all transactions for this specific product
    const productTxns = stockTransactions
      .filter(t => t.itemId === product.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Receipts
    const receipts = productTxns.filter(t => t.type === 'receipt');
    const lastReceipt = receipts[0];

    // Sales
    const sales = productTxns.filter(t => t.type === 'sale');
    const lastSale = sales[0];

    // Supplier Info
    let lastSupplierName = 'N/A';
    if (lastReceipt?.supplierId) {
      const sup = suppliers.find(s => s.id === lastReceipt.supplierId);
      lastSupplierName = sup ? sup.name : 'Unknown';
    } else if (lastReceipt?.by) {
      lastSupplierName = lastReceipt.by;
    }

    // Pricing
    const purchasePrice = product.purchasePrice || lastReceipt?.purchasePrice || product.rate;
    const sellPrice = product.rate;
    const currentStock = product.currentStock;
    const totalStockValue = currentStock * sellPrice;
    
    // Profit
    const profitPerUnit = sellPrice - purchasePrice;
    const profitMargin = sellPrice > 0 ? (profitPerUnit / sellPrice) * 100 : 0;
    
    // Quick history for chart (Last 6 transactions)
    const recentTxns = [...productTxns].slice(0, 6).reverse();

    return {
      purchasePrice,
      sellPrice,
      currentStock,
      totalStockValue,
      profitPerUnit,
      profitMargin,
      lastReceipt,
      lastSale,
      lastSupplierName,
      recentTxns
    };
  }, [product, stockTransactions, suppliers]);

  if (!isOpen || !product || !metrics) return null;

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
          className="relative w-full max-w-4xl max-h-[90vh] bg-slate-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* HEADER */}
          <div className="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${product.currentStock <= product.minStock ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {isUrdu ? product.urduName : product.name}
                  {product.currentStock <= product.minStock && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </span>
                  )}
                </h2>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                  {product.type} • {product.category || 'General'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); onEdit(product); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-xs border border-slate-200"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t('Edit', 'ترمیم')}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); onDelete(product); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors text-xs border border-red-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('Delete', 'حذف')}
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button 
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* MAIN SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* KPI GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="premium-card border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {t('Current Stock', 'موجودہ اسٹاک')}
                </span>
                <h3 className="text-2xl font-black text-slate-900">{metrics.currentStock.toLocaleString()} <span className="text-sm font-medium text-slate-500">{product.unit}</span></h3>
                <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500 border-t pt-2">
                  <span>{t('Min Threshold:', 'کم از کم حد:')}</span>
                  <span>{product.minStock} {product.unit}</span>
                </div>
              </div>

              <div className="premium-card border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {t('Total Stock Value', 'کل اسٹاک ویلیو')}
                </span>
                <h3 className="text-2xl font-black text-slate-900">{formatCurrency(metrics.totalStockValue, settings)}</h3>
                <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500 border-t pt-2">
                  <span>{t('Selling Price:', 'فروخت قیمت:')}</span>
                  <span className="text-orange-600">Rs. {metrics.sellPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="premium-card border border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {t('Profit Margin', 'منافع مارجن')}
                </span>
                <h3 className="text-2xl font-black text-emerald-600">+{metrics.profitMargin.toFixed(1)}%</h3>
                <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500 border-t pt-2">
                  <span>{t('Purchase Price:', 'خرید قیمت:')}</span>
                  <span>Rs. {metrics.purchasePrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="premium-card border border-slate-200 bg-slate-800 text-white">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  {t('Profit Per Unit', 'فی یونٹ منافع')}
                </span>
                <h3 className="text-2xl font-black text-emerald-400">+ Rs. {metrics.profitPerUnit.toLocaleString()}</h3>
                <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-400 border-t border-slate-700 pt-2">
                  <span>{t('Unit type:', 'یونٹ:')}</span>
                  <span className="uppercase">{product.unit}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* LAST ACTIVITY LOGS */}
              <div className="premium-card border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-400" />
                  {t('Recent Analytics & Sourcing', 'حالیہ تجزیات')}
                </h3>
                
                <div className="space-y-4">
                  {/* Sourcing details */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="h-10 w-10 shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Last Purchased From', 'آخری سپلائر')}</div>
                      <div className="font-bold text-slate-800">{metrics.lastSupplierName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {metrics.lastReceipt ? new Date(metrics.lastReceipt.date).toLocaleDateString() : 'No record'}
                      </div>
                    </div>
                  </div>

                  {/* Sale details */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="h-10 w-10 shrink-0 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Last Sale Record', 'آخری فروخت')}</div>
                      <div className="font-bold text-slate-800">
                        {metrics.lastSale ? `${metrics.lastSale.quantity} ${product.unit} sold` : 'No recent sale log'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {metrics.lastSale ? new Date(metrics.lastSale.date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MINI TREND CHART */}
              <div className="premium-card border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-slate-400" />
                  {t('Recent Transaction Flow', 'حالیہ ٹرانزیکشن فلو')}
                </h3>
                
                {metrics.recentTxns.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-slate-400 text-sm font-medium">
                    No transactions recorded yet.
                  </div>
                ) : (
                  <div className="h-40 flex items-end justify-between gap-2 px-2 pb-6 pt-4 border-b border-slate-100 relative">
                    {/* Y-axis placeholder line */}
                    <div className="absolute left-0 bottom-6 w-full border-t border-dashed border-slate-200"></div>
                    
                    {metrics.recentTxns.map((txn, idx) => {
                      const maxQty = Math.max(...metrics.recentTxns.map(t => t.quantity));
                      const heightPct = (txn.quantity / maxQty) * 100;
                      const isReceipt = txn.type === 'receipt';
                      
                      return (
                        <div key={txn.id || idx} className="flex flex-col items-center gap-2 group relative w-full">
                          {/* Tooltip */}
                          <div className="absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                            {isReceipt ? 'Purchased' : 'Sold'} {txn.quantity} {product.unit}
                            <br/>
                            {new Date(txn.date).toLocaleDateString()}
                          </div>
                          
                          {/* Bar */}
                          <div 
                            className={`w-full max-w-[2rem] rounded-t-sm transition-all duration-500 ${isReceipt ? 'bg-blue-400 hover:bg-blue-500' : 'bg-emerald-400 hover:bg-emerald-500'}`}
                            style={{ height: `${Math.max(10, heightPct)}%` }}
                          ></div>
                          
                          {/* Label */}
                          <div className="absolute -bottom-6 text-[9px] font-bold text-slate-400 truncate w-full text-center">
                            {isReceipt ? 'IN' : 'OUT'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-bold text-slate-500 uppercase">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Stock IN (Receipts)</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Stock OUT (Sales)</div>
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
