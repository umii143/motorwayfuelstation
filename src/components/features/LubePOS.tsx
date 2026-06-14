/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  Smartphone,
  Landmark,
  User,
  Package,
  ScanLine,
  Wrench,
  ArrowRight,
  Trash2,
  PlusCircle,
  History,
  TrendingUp,
  Printer,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import {
  BankAccount,
  Customer,
  DigitalAccount,
  GlobalSettings,
  LubePosSale,
  Product,
  Staff
} from '../../types';
import { formatCurrency } from '../../lib/currency';
import { t as translate } from '../../lib/translations';
import EmptyState from '../ui/EmptyState';
import { useStation } from '../../contexts/StationContext';

interface LubePOSProps {
  settings: GlobalSettings;
  staff: Staff[];
  products: Product[];
  customers: Customer[];
  banks: BankAccount[];
  digitalAccounts: DigitalAccount[];
  lubePosSales: LubePosSale[];
  onAddLubePosSale: (sale: LubePosSale) => void;
  onNavigate: (view: string) => void;
}

interface CartLine {
  productId: string;
  quantity: number;
}

export default function LubePOS({
  settings,
  staff,
  products,
  customers,
  banks,
  digitalAccounts,
  lubePosSales,
  onAddLubePosSale,
  onNavigate
}: LubePOSProps) {
  const { showToast, showAlert, showConfirm } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const isUrdu = settings.language === 'ur';

  const sellableProducts = useMemo(
    () => products.filter((product) => product.type === 'lube'),
    [products]
  );

  const cashierOptions = useMemo(
    () => staff.filter((member) => member.active),
    [staff]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [cashierId, setCashierId] = useState(cashierOptions[0]?.id || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank' | 'digital' | 'credit'>('cash');
  const [bankAccountId, setBankAccountId] = useState('');
  const [digitalAccountId, setDigitalAccountId] = useState('');
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [tax, setTax] = useState('0');
  const [amountReceived, setAmountReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSale, setLastSale] = useState<LubePosSale | null>(null);

  useEffect(() => {
    if (!cashierId && cashierOptions[0]?.id) {
      setCashierId(cashierOptions[0].id);
    }
  }, [cashierId, cashierOptions]);

  useEffect(() => {
    if (paymentMode !== 'bank') {
      setBankAccountId('');
    }
    if (paymentMode !== 'digital') {
      setDigitalAccountId('');
    }
    if (paymentMode === 'credit') {
      setAmountReceived('0');
    }
  }, [paymentMode]);

    const [activeCategory, setActiveCategory] = useState<string>('All');
  const [rateCardType, setRateCardType] = useState<'retail' | 'wholesale'>('retail');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    sellableProducts.forEach(p => {
      if (p.category) cats.add(p.category);
      else if (p.type) cats.add(p.type);
    });
    return ['All', ...Array.from(cats)];
  }, [sellableProducts]);

  const filteredProducts = useMemo(() => {
    let result = sellableProducts;
    if (activeCategory !== 'All') {
      result = result.filter(p => p.type === activeCategory || p.category === activeCategory);
    }
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((product) => {
        return (
          product.name.toLowerCase().includes(query) ||
          product.urduName.includes(searchQuery)
        );
      });
    }
    return result;
  }, [searchQuery, sellableProducts, activeCategory]);

const cartItems = useMemo(() => {
    return cart
      .map((line) => {
        const product = sellableProducts.find((item) => item.id === line.productId);
        if (!product) return null;

        return {
          ...line,
          product,
          lineTotal: line.quantity * product.rate
        };
      })
      .filter(Boolean) as Array<CartLine & { product: Product; lineTotal: number }>;
  }, [cart, sellableProducts]);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const discountNum = Math.max(0, Number(discount) || 0);
    const discountValue = discountType === 'percentage' 
      ? (subtotal * discountNum) / 100 
      : discountNum;
    const taxValue = Math.max(0, Number(tax) || 0);
    const total = Math.max(0, subtotal - discountValue + taxValue);
    const received = paymentMode === 'credit' ? 0 : Number(amountReceived || 0);
    const change = paymentMode === 'credit' ? 0 : Math.max(0, received - total);

    return {
      subtotal,
      discount: discountValue,
      tax: taxValue,
      total,
      received,
      change
    };
  }, [amountReceived, cartItems, discount, discountType, paymentMode, tax]);

  const todaySales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return lubePosSales.filter((sale) => sale.date === today);
  }, [lubePosSales]);

  const kpis = useMemo(() => {
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const todayUnits = todaySales.reduce(
      (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
    const avgTicket = todaySales.length > 0 ? todayRevenue / todaySales.length : 0;
    const creditOpen = customers.reduce((sum, customer) => {
      return customer.balance > 0 ? sum + customer.balance : sum;
    }, 0);

    return {
      todayRevenue,
      todayUnits,
      avgTicket,
      creditOpen
    };
  }, [customers, todaySales]);

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === productId);
      const product = sellableProducts.find((item) => item.id === productId);
      if (!product) return prev;

      if (existing) {
        return prev.map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.min(product.currentStock, line.quantity + 1) }
            : line
        );
      }

      return [...prev, { productId, quantity: product.currentStock > 0 ? 1 : 0 }].filter(
        (line) => line.quantity > 0
      );
    });
  };

  const updateCartQty = (productId: string, nextQty: number) => {
    const product = sellableProducts.find((item) => item.id === productId);
    if (!product) return;

    if (nextQty <= 0) {
      setCart((prev) => prev.filter((line) => line.productId !== productId));
      return;
    }

    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.min(product.currentStock, nextQty) }
          : line
      )
    );
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setWalkInName('');
    setVehicleNo('');
    setPaymentMode('cash');
    setBankAccountId('');
    setDigitalAccountId('');
    setDiscount('0');
    setTax('0');
    setAmountReceived('');
    setNotes('');
    setCart([]);
  };

  const handleCheckout = () => {
    if (!cashierId) {
      showToast(t('Please select the cashier/operator first.', 'سب سے پہلے کیشیئر یا آپریٹر منتخب کریں۔'), 'error');
      return;
    }

    if (cartItems.length === 0) {
      showToast(t('Add at least one lube or part item to the cart.', 'کم از کم ایک لیوب یا پارٹ آئٹم کارٹ میں شامل کریں۔'), 'error');
      return;
    }

    // Check inventory stock limits
    for (const item of cartItems) {
      if (item.quantity > item.product.currentStock) {
        showToast(
          t(
            `Insufficient inventory for ${item.product.name}. Available stock: ${item.product.currentStock} ${item.product.unit}. Requested: ${item.quantity}.`,
            `${item.product.name} کا اسٹاک ناکافی ہے۔ دستیاب اسٹاک: ${item.product.currentStock} ${item.product.unit}۔ مطلوبہ: ${item.quantity}۔`
          ),
          'error'
        );
        return;
      }
    }

    if (paymentMode === 'credit' && !selectedCustomerId) {
      showToast(t('Credit sales require a customer account.', 'کریڈٹ سیل کے لیے کسٹمر کھاتہ ضروری ہے۔'), 'error');
      return;
    }

    if (paymentMode === 'bank' && !bankAccountId) {
      showToast(t('Choose the receiving bank account.', 'وصولی کے لیے بینک اکاؤنٹ منتخب کریں۔'), 'error');
      return;
    }

    if (paymentMode === 'digital' && !digitalAccountId) {
      showToast(t('Choose the receiving digital account.', 'وصولی کے لیے ڈیجیٹل اکاؤنٹ منتخب کریں۔'), 'error');
      return;
    }

    if (paymentMode !== 'credit' && totals.received < totals.total) {
      showToast(t('Received amount cannot be less than the bill total.', 'وصول شدہ رقم بل سے کم نہیں ہو سکتی۔'), 'error');
      return;
    }

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    const invoiceNo = `LPS-${date.replace(/-/g, '')}-${String(now.getTime()).slice(-5)}`;
    const customer = customers.find((item) => item.id === selectedCustomerId);

    const sale: LubePosSale = {
      id: `lps_${Date.now()}`,
      invoiceNo,
      date,
      time,
      cashierId,
      customerId: customer?.id,
      customerName: customer
        ? (isUrdu ? customer.urduName : customer.name)
        : walkInName.trim() || t('Walk-in Customer', 'وا ک اِن کسٹمر'),
      vehicleNo: vehicleNo.trim() || undefined,
      paymentMode,
      bankAccountId: paymentMode === 'bank' ? bankAccountId : undefined,
      digitalAccountId: paymentMode === 'digital' ? digitalAccountId : undefined,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      amountReceived: totals.received,
      changeGiven: totals.change,
      notes: notes.trim() || undefined,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        productName: isUrdu ? item.product.urduName : item.product.name,
        quantity: item.quantity,
        unit: item.product.unit,
        unitPrice: item.product.rate,
        lineTotal: item.lineTotal
      }))
    };

    onAddLubePosSale(sale);
    resetForm();
    setLastSale(sale);
  };

  const handleReturn = (sale: LubePosSale) => {
    showConfirm(
      t('Refund Invoice', 'بل واپس کریں'),
      t('Are you sure you want to refund this entire invoice?', 'کیا آپ واقعی اس مکمل بل کو واپس کرنا چاہتے ہیں؟'),
      () => {
        const returnSale: LubePosSale = {
          ...sale,
          id: `lps_ret_${Date.now()}`,
          isReturn: true,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          returnedSaleId: sale.id
        };
        onAddLubePosSale(returnSale);
        showToast(t('Return processed successfully', 'واپسی کامیابی سے مکمل ہو گئی'), 'success');
      }
    );
  };

  if (sellableProducts.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title={t('No Lube POS inventory ready', 'لیوب پی او ایس کے لیے انوینٹری تیار نہیں')}
        description={t(
          'Add lubricants or parts in inventory first, then the lube POS can start billing instantly.',
          'پہلے انوینٹری میں لیوبریکنٹس یا پارٹس شامل کریں، پھر لیوب پی او ایس فوراً بلنگ شروع کر دے گا۔'
        )}
        actionLabel={t('Open Inventory', 'انوینٹری کھولیں')}
        onAction={() => onNavigate('inventory')}
      />
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 pb-16 lg:pb-0 rounded-xl sm:rounded-2xl border-x sm:border border-slate-200/80 bg-slate-50/40 p-1 sm:p-4 lg:p-6 shadow-[0_0_40px_rgb(0,0,0,0.02)] backdrop-blur-xl">
      {/* Compact Header */}
      <div className="relative overflow-hidden rounded-[1rem] sm:rounded-[1.5rem] bg-white/80 p-2 sm:p-4 shadow-sm backdrop-blur-2xl border border-slate-200 flex flex-row items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <ShoppingCart className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h2 className="font-sans text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none">
              {t('Lube POS', 'لیوب پی او ایس')}
            </h2>
            <p className="mt-1 font-sans text-[10px] sm:text-xs font-medium text-slate-500">
              {t('Fast billing for lubes & parts', 'لیوب اور پارٹس کی بلنگ')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex-1 sm:flex-none rounded-lg sm:rounded-xl border border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            {showHistory ? <ShoppingCart className="h-4 w-4" /> : <History className="h-4 w-4" />}
            <span>{showHistory ? t('New Sale', 'نئی سیل') : t('History', 'ہسٹری')}</span>
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="flex-1 sm:flex-none rounded-lg sm:rounded-xl bg-slate-900 px-3 py-2 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <Package className="h-4 w-4" />
            <span>{t('Inventory', 'انوینٹری')}</span>
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-sm backdrop-blur-2xl">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <History className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">{t('Invoice History', 'بل ہسٹری')}</h3>
            </div>
          </div>
          <div className="space-y-3">
            {lubePosSales.slice().reverse().map((sale) => (
              <div key={sale.id} className="flex flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-sm font-black text-slate-900">{sale.invoiceNo}</strong>
                    {sale.isReturn && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">RETURNED</span>}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {sale.date} {sale.time} • {sale.customerName} • {sale.items.length} items
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-0 border-slate-100 pt-3 sm:pt-0">
                  <div className="text-right mr-4">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">{t('Total', 'کل')}</span>
                    <strong className={`text-base font-black ${sale.isReturn ? 'text-rose-500' : 'text-slate-900'}`}>
                      {formatCurrency(sale.total, settings)}
                    </strong>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setLastSale(sale)} className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100" title="Print Invoice">
                      <Printer className="h-4 w-4" />
                    </button>
                    {!sale.isReturn && !lubePosSales.some(s => s.returnedSaleId === sale.id) && (
                      <button onClick={() => handleReturn(sale)} className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100" title="Return / Refund">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {lubePosSales.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm font-medium">
                {t('No sales history available.', 'کوئی سیل ہسٹری موجود نہیں۔')}
              </div>
            )}
          </div>
        </div>
      ) : (
      <div className="flex flex-col lg:flex-row gap-4 xl:gap-6 min-h-[calc(100vh-14rem)]">
        {/* Left Panel - Product Catalog */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 rounded-[2rem] border border-slate-200/80 shadow-sm p-4 sm:p-6 overflow-hidden">
          
          {/* Top Search Bar */}
          <div className="relative w-full mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search by product name, grade (0W-20), brand...', 'پروڈکٹ کا نام یا برانڈ سے تلاش کریں...')}
              className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm shadow-[0_2px_10px_rgb(0,0,0,0.02)] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-medium"
            />
          </div>

          {/* Top Fast-Moving Lubricants */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-yellow-500 text-lg">💡</span>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('Top Fast-Moving Lubricants', 'تیزی سے بکنے والے لیوبریکنٹس')}</h4>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {sellableProducts.slice().sort((a, b) => b.currentStock - a.currentStock).slice(0, 4).map(product => (
                <div key={'fast_'+product.id} className="flex-shrink-0 flex items-center justify-between w-full max-w-[220px] bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group" onClick={() => addToCart(product.id)}>
                  <div className="pr-2">
                    <h5 className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2">{isUrdu ? product.urduName : product.name}</h5>
                    <span className="text-xs font-black text-emerald-600 mt-1 block">Rs {formatCurrency(product.rate, settings)}</span>
                  </div>
                  <button className="h-8 w-8 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4 border-b border-slate-100/60">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {cat === 'All' ? t('All Lubricants & Filters', 'تمام لیوبریکنٹس اور فلٹرز') : cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 pb-10">
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={product.id}
                    className={`relative flex flex-col bg-white border rounded-3xl p-4 shadow-sm transition-all duration-300 group ${
                      product.currentStock <= 0
                        ? 'border-slate-100 bg-slate-50/50 opacity-60 grayscale cursor-not-allowed'
                        : 'border-slate-200/80 hover:border-blue-300 hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)] cursor-pointer'
                    }`}
                    onClick={() => { if (product.currentStock > 0) addToCart(product.id) }}
                  >
                    {/* Top tags row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase truncate max-w-full max-w-[120px]">
                        {product.category || product.type}
                      </div>
                      {product.currentStock > 0 && product.currentStock <= 5 && (
                        <div className="bg-rose-100 text-rose-600 px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase">
                          LOW STOCK
                        </div>
                      )}
                    </div>
                    
                    {/* Product Name */}
                    <h3 className="font-bold text-slate-800 text-sm leading-snug mb-5 min-h-[2.5rem] line-clamp-2">
                      {isUrdu ? product.urduName : product.name}
                    </h3>

                    {/* Price and Add button */}
                    <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-3">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">{t('Retail Price', 'ریٹیل قیمت')}</span>
                        <span className="text-base font-black text-emerald-600 tracking-tight">PKR {formatCurrency(product.rate, settings)}</span>
                      </div>
                      <button 
                        disabled={product.currentStock <= 0}
                        className="h-10 w-10 shrink-0 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors disabled:opacity-50"
                      >
                        <ShoppingCart className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Panel - Billing Cart */}
        <div className="w-full lg:w-full max-w-[400px] xl:w-[440px] flex flex-col bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_8px_40px_rgb(0,0,0,0.06)] overflow-hidden shrink-0">
          
          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100/80">
            <div className="flex items-center gap-3">
              <span className="text-xl">🛒</span>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">{t('Itemized Billing Cart', 'آئٹمائزڈ بلنگ کارٹ')}</h3>
            </div>
            <div className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-full text-xs shadow-sm">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col bg-slate-50/30">
            
            {/* Customer & Rate Type */}
            <div className="mb-6 space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t('Tag Customer Account', 'کسٹمر اکاؤنٹ ٹیگ کریں')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pl-11 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                  >
                    <option value="">Walk-In Grahak (Cash Customer) (Retail)</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {isUrdu ? customer.urduName : customer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-1.5 bg-slate-100/80 rounded-[1.25rem] border border-slate-200/60">
                <div className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest flex-1">{t('Product Rate card type', 'ریٹ کارڈ کی قسم')}</div>
                <div className="flex bg-white rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] p-1">
                  <button 
                    onClick={() => setRateCardType('retail')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${rateCardType === 'retail' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    RETAIL
                  </button>
                  <button 
                    onClick={() => setRateCardType('wholesale')}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${rateCardType === 'wholesale' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    WHOLESALE (تھوک)
                  </button>
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 flex flex-col">
              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <ShoppingCart className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 max-w-full max-w-[200px] leading-relaxed">{t('Cart is empty. Tap products left.', 'کارٹ خالی ہے۔ بائیں طرف سے پروڈکٹس منتخب کریں۔')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {cartItems.map(item => (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        key={item.productId}
                        className="flex flex-col gap-3 pb-4 border-b border-slate-100 last:border-0"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-[13px] font-bold text-slate-800 leading-snug pr-2">{isUrdu ? item.product.urduName : item.product.name}</span>
                          <span className="text-sm font-black text-slate-900 shrink-0">Rs {formatCurrency(item.lineTotal, settings)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Rs {formatCurrency(item.product.rate, settings)} / {item.product.unit}</span>
                          <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                            <button onClick={() => updateCartQty(item.productId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-all">
                              <Minus className="h-3 w-3" strokeWidth={3} />
                            </button>
                            <span className="text-xs font-black text-slate-800 w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.productId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-all">
                              <Plus className="h-3 w-3" strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
            
            {/* Totals Section */}
            <div className="mt-6 pt-6 border-t border-slate-200 border-dashed space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('Invoice-wise Flat Discount (Rs)', 'انوائس ڈسکاؤنٹ')}</span>
                <input 
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-24 px-3 py-2 text-right text-sm font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Retail Subtotal</span>
                <span>Rs {formatCurrency(totals.subtotal, settings)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-500 uppercase tracking-wider">
                <span>Total Deduction / Discount</span>
                <span>-Rs {formatCurrency(totals.discount, settings)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-4 border-b border-slate-100">
                <span>Sales GST Standard (17%)</span>
                <span>Rs {formatCurrency(totals.tax, settings)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-black text-slate-900 uppercase tracking-tight">GRAND BILL TOTAL</span>
                <span className="text-xl font-black text-emerald-600">Rs {formatCurrency(totals.total, settings)}</span>
              </div>
            </div>

            {/* Posting Type & Action */}
            <div className="mt-8 space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                  <span className="text-slate-800">🔒</span> CHOOSE LEDGER POSTING TYPE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-2">
                  <button onClick={() => setPaymentMode('cash')} className={`py-3 px-2 rounded-[14px] text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${paymentMode === 'cash' ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Cash</button>
                  <button onClick={() => setPaymentMode('credit')} className={`py-3 px-2 rounded-[14px] text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${paymentMode === 'credit' ? 'bg-blue-500 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Credit</button>
                  <button onClick={() => setPaymentMode('bank')} className={`py-3 px-2 rounded-[14px] text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${paymentMode === 'bank' ? 'bg-purple-500 border-purple-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Bank</button>
                  <button onClick={() => setPaymentMode('digital')} className={`py-3 px-2 rounded-[14px] text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${paymentMode === 'digital' ? 'bg-orange-500 border-orange-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>Digital</button>
                </div>

                {/* Conditional inputs for bank/digital/cash received */}
                <div className="mt-3 space-y-3">
                  {paymentMode === 'bank' && (
                    <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400">
                      <option value="">{t('Select receiving bank', 'بینک منتخب کریں')}</option>
                      {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  )}
                  {paymentMode === 'digital' && (
                    <select value={digitalAccountId} onChange={(e) => setDigitalAccountId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400">
                      <option value="">{t('Select digital wallet', 'ڈیجیٹل والٹ منتخب کریں')}</option>
                      {digitalAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  )}
                  {paymentMode !== 'credit' && (
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{t('Amount Received', 'وصول شدہ رقم')}</span>
                      <input value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} placeholder={totals.total.toString()} className="w-28 text-right font-black text-base text-slate-800 bg-transparent focus:outline-none" />
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="w-full py-4.5 rounded-[1.25rem] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[15px] flex items-center justify-center gap-3 shadow-[0_8px_20px_rgb(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgb(16,185,129,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                Save Bill & Create Receipt (PKR {formatCurrency(totals.total, settings)})
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
