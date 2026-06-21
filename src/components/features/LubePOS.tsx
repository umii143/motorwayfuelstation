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
    const received = paymentMode === 'credit' ? 0 : Number(amountReceived || total);
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
    <div className="flex flex-col h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] w-full max-w-[1600px] mx-auto bg-[#0f172a] rounded-none sm:rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800/60 font-sans text-slate-300">
      
      {/* HEADER SECTION */}
      <div className="flex-none px-4 sm:px-6 py-3 sm:py-4 bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/20">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white leading-none">
              {t('Lube POS Terminal', 'لیوب پی او ایس ٹرمینل')}
            </h2>
            <p className="mt-1 text-[10px] sm:text-xs font-medium text-slate-400">
              {t('Fast billing for lubes & parts', 'لیوب اور پارٹس کی بلنگ')}
            </p>
          </div>
        </div>

        {/* Global Search inside Header on Desktop / Hidden on small mobile if not needed */}
        <div className="relative w-full sm:w-auto sm:min-w-[300px] lg:min-w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search by product name, grade (0W-20), brand...', 'پروڈکٹ کا نام یا برانڈ سے تلاش کریں...')}
            className="w-full pl-10 pr-12 py-2 sm:py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 border border-slate-600 rounded bg-[#1e293b] px-1.5 py-0.5">
            Ctrl / K
          </div>
        </div>

        <div className="flex gap-2 shrink-0 hidden lg:flex">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="rounded-xl border border-slate-700 bg-[#1e293b] px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-slate-800 hover:text-white flex items-center justify-center gap-2"
          >
            {showHistory ? <ShoppingCart className="h-4 w-4" /> : <History className="h-4 w-4" />}
            <span>{showHistory ? t('New Sale', 'نئی سیل') : t('History', 'ہسٹری')}</span>
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0f172a] custom-scrollbar">
          <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e293b] text-orange-500 border border-slate-700">
                <History className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-white">{t('Invoice History', 'بل ہسٹری')}</h3>
            </div>
            {/* Mobile back button */}
            <button onClick={() => setShowHistory(false)} className="lg:hidden px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold">Back to POS</button>
          </div>
          <div className="space-y-3 max-w-4xl mx-auto">
            {lubePosSales.slice().reverse().map((sale) => (
              <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#1e293b] p-4 shadow-sm hover:border-slate-600 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-sm font-black text-white">{sale.invoiceNo}</strong>
                    {sale.isReturn && <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">RETURNED</span>}
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    {sale.date} {sale.time} • {sale.customerName} • {sale.items.length} items
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-0 border-slate-800 pt-3 sm:pt-0">
                  <div className="text-right mr-4">
                    <span className="block text-[10px] font-bold uppercase text-slate-500">{t('Total', 'کل')}</span>
                    <strong className={`text-base font-black ${sale.isReturn ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatCurrency(sale.total, settings)}
                    </strong>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setLastSale(sale)} className="rounded-lg bg-slate-800 p-2 text-blue-400 hover:bg-slate-700 border border-slate-700" title="Print Invoice">
                      <Printer className="h-4 w-4" />
                    </button>
                    {!sale.isReturn && !lubePosSales.some(s => s.returnedSaleId === sale.id) && (
                      <button onClick={() => handleReturn(sale)} className="rounded-lg bg-slate-800 p-2 text-rose-400 hover:bg-slate-700 border border-slate-700" title="Return / Refund">
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
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        
        {/* Left Panel - Product Catalog */}
        <div className="flex-none lg:flex-1 min-h-[550px] lg:min-h-0 flex flex-col min-w-0 p-3 sm:p-5 overflow-hidden">
          
          {/* Top Fast-Moving Lubricants Carousel */}
          <div className="flex-none mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-orange-500 text-lg">🔥</span>
              <h4 className="text-xs font-black text-white/90 uppercase tracking-widest">{t('Top Fast Moving Lubricants', 'تیزی سے بکنے والے لیوبریکنٹس')}</h4>
            </div>
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {sellableProducts.slice().sort((a, b) => b.currentStock - a.currentStock).slice(0, 5).map(product => (
                <div 
                  key={'fast_'+product.id} 
                  className="snap-start flex-shrink-0 flex items-center gap-3 w-[260px] sm:w-[280px] bg-[#1e293b] border border-slate-700/60 rounded-2xl p-3 hover:border-slate-500 hover:bg-slate-800 transition-all cursor-pointer group shadow-lg"
                  onClick={() => { if (product.currentStock > 0) addToCart(product.id) }}
                >
                  <div className="h-12 w-10 shrink-0 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
                    <Package className="h-6 w-6 text-slate-500 group-hover:text-orange-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <h5 className="text-[12px] font-bold text-white leading-tight truncate">{isUrdu ? product.urduName : product.name}</h5>
                    <span className="text-xs font-black text-emerald-400 mt-1 block tracking-tight">Rs. {formatCurrency(product.rate, settings)}</span>
                  </div>
                  <button className="h-8 w-8 shrink-0 rounded-lg bg-[#0f172a] border border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex-none flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2 border-b border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 sm:px-6 py-2.5 rounded-full text-[11px] sm:text-[12px] font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 border border-orange-500'
                    : 'bg-[#1e293b] border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {cat === 'All' ? t('All Products', 'تمام پروڈکٹس') : cat}
              </button>
            ))}
            <button className="flex-shrink-0 px-4 py-2.5 rounded-full text-[11px] font-bold bg-[#1e293b] border border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center gap-1">
              More <ArrowRight className="h-3 w-3" />
            </button>
            <div className="flex-1"></div>
            <button className="hidden sm:flex flex-shrink-0 h-10 w-10 rounded-full bg-[#1e293b] border border-slate-700 items-center justify-center text-slate-300 hover:bg-slate-800">
              <ScanLine className="h-4 w-4" />
            </button>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar pb-20 lg:pb-24">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 pb-4 mt-2">
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={product.id}
                    className={`relative flex flex-col bg-[#1e293b] border rounded-2xl p-3 sm:p-4 shadow-lg transition-all duration-300 group ${
                      product.currentStock <= 0
                        ? 'border-slate-800 bg-[#0f172a]/50 opacity-50 grayscale cursor-not-allowed'
                        : 'border-slate-700/60 hover:border-orange-500/50 hover:bg-slate-800 cursor-pointer hover:shadow-orange-500/10'
                    }`}
                    onClick={() => { if (product.currentStock > 0) addToCart(product.id) }}
                  >
                    {/* Icon & Details */}
                    <div className="flex flex-col mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-10 sm:h-16 sm:w-12 bg-[#0f172a] rounded-lg flex items-center justify-center border border-slate-800">
                           <Package className="h-6 w-6 sm:h-8 sm:w-8 text-slate-600 group-hover:text-orange-400 transition-colors" />
                        </div>
                        <button 
                          className="text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); /* Delete action if needed */ }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      
                      <h3 className="font-black text-white text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
                        {isUrdu ? product.urduName : product.name}
                      </h3>
                      <span className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase tracking-widest">{product.category || 'N/A'} • {product.unit}</span>
                    </div>

                    {/* Price and Stock Bottom Row */}
                    <div className="mt-auto flex items-end justify-between pt-3">
                      <div>
                        <span className="text-sm sm:text-base font-black text-orange-400 tracking-tight block">Rs. {formatCurrency(product.rate, settings)}</span>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${product.currentStock > 0 ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_8px_currentColor]`} />
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider">
                            {product.currentStock > 0 ? `In Stock ${product.currentStock}` : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                      <button 
                        disabled={product.currentStock <= 0}
                        className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-500 transition-colors disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Floating Action Bar (Desktop only) */}
          <div className="hidden lg:flex absolute bottom-6 left-6 right-[460px] h-16 bg-[#1e293b]/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl items-center px-2 shadow-[0_20px_40px_rgb(0,0,0,0.3)] z-20">
            <div className="flex gap-2 w-full">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors">
                <span className="h-6 w-6 rounded bg-slate-900 flex items-center justify-center text-[10px] border border-slate-700">F6</span>
                <span className="text-xs font-bold">Hold Bill</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors">
                <span className="h-6 w-6 rounded bg-slate-900 flex items-center justify-center text-[10px] border border-slate-700">F7</span>
                <span className="text-xs font-bold">Park Order</span>
              </button>
              <button onClick={() => setShowHistory(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors">
                <span className="h-6 w-6 rounded bg-slate-900 flex items-center justify-center text-[10px] border border-slate-700">F8</span>
                <span className="text-xs font-bold">Recent Bills</span>
              </button>
              <div className="w-px bg-slate-700 my-2 mx-1"></div>
              <button onClick={resetForm} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-rose-500/10 text-rose-400 transition-colors">
                <span className="h-6 w-6 rounded bg-slate-900 flex items-center justify-center text-[10px] border border-rose-900/50">F9</span>
                <Trash2 className="h-4 w-4" />
                <span className="text-xs font-bold">Clear Cart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Cart & Billing */}
        <div className="w-full lg:w-[400px] xl:w-[440px] flex flex-col bg-[#1e293b] border-l border-slate-800/80 shadow-[-10px_0_40px_rgb(0,0,0,0.2)] z-30 flex-none shrink-0 border-t lg:border-t-0 rounded-t-[2rem] lg:rounded-none min-h-[650px] lg:min-h-0 h-auto mt-4 lg:mt-0">
          
          {/* Customer Selection Row */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0f172a]/40">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-700 bg-[#1e293b] px-4 py-3 sm:py-3.5 pl-10 text-[12px] sm:text-[13px] font-bold text-white shadow-inner focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="">Walk-In Grahak (Cash Customer) (Retail)</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {isUrdu ? customer.urduName : customer.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <div className="h-6 w-6 bg-slate-800 rounded flex items-center justify-center border border-slate-700">
                  <User className="h-3 w-3 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar bg-[#1e293b]">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <ShoppingCart className="h-12 w-12 text-slate-600 mb-4" strokeWidth={1.5} />
                <p className="text-sm font-bold text-slate-500">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <AnimatePresence>
                  {cartItems.map(item => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      key={item.productId}
                      className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-800/80 last:border-0"
                    >
                      {/* Thumbnail */}
                      <div className="h-10 w-8 sm:h-12 sm:w-10 bg-slate-900 rounded-md flex items-center justify-center border border-slate-700 shrink-0">
                         <Package className="h-5 w-5 text-slate-500" />
                      </div>
                      
                      {/* Name & Rate */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] sm:text-[12px] font-bold text-white truncate">{isUrdu ? item.product.urduName : item.product.name}</h4>
                        <span className="text-[9px] sm:text-[10px] text-orange-400 font-black mt-0.5 block">Rs. {formatCurrency(item.product.rate, settings)}</span>
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center gap-1 bg-[#0f172a] rounded-lg border border-slate-700 p-0.5 shrink-0">
                        <button onClick={() => updateCartQty(item.productId, item.quantity - 1)} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-all">
                          <Minus className="h-3 w-3" strokeWidth={3} />
                        </button>
                        <span className="text-[11px] sm:text-xs font-black text-white w-5 sm:w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQty(item.productId, item.quantity + 1)} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-all">
                          <Plus className="h-3 w-3" strokeWidth={3} />
                        </button>
                      </div>

                      {/* Total & Delete */}
                      <div className="flex flex-col items-end gap-2 shrink-0 w-[60px] sm:w-[70px]">
                         <button onClick={() => updateCartQty(item.productId, 0)} className="text-slate-600 hover:text-rose-500 transition-colors">
                           <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                         </button>
                         <span className="text-[11px] sm:text-xs font-black text-white">Rs. {formatCurrency(item.lineTotal, settings)}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Discount / Promo Code Button */}
          <div className="px-4 sm:px-5 py-2 sm:py-3 bg-[#0f172a]/60 border-y border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors">
             <div className="flex items-center gap-2 text-slate-400">
               <Receipt className="h-4 w-4" />
               <span className="text-[11px] sm:text-xs font-bold">Discount / Promo Code</span>
             </div>
             <ArrowRight className="h-4 w-4 text-slate-500" />
          </div>
          
          {/* Totals Summary */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 bg-[#1e293b] space-y-2 sm:space-y-3 text-[11px] sm:text-xs">
            <div className="flex justify-between font-medium text-slate-400">
              <span>Subtotal ({cartItems.length} items)</span>
              <span className="text-white font-bold">Rs. {formatCurrency(totals.subtotal, settings)}</span>
            </div>
            
            <div className="flex justify-between font-medium text-slate-400 items-center">
              <span>Invoice Discount</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-16 bg-[#0f172a] border border-slate-700 rounded px-2 py-1 text-right text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  placeholder="0"
                />
                <span className="text-emerald-400 font-bold">- Rs. {formatCurrency(totals.discount, settings)}</span>
              </div>
            </div>
            <div className="flex justify-between font-medium text-slate-400">
              <span>Sales Tax (GST 17%)</span>
              <span className="text-white font-bold">Rs. {formatCurrency(totals.tax, settings)}</span>
            </div>
            
            <div className="flex justify-between items-end pt-2 sm:pt-3 border-t border-slate-800 mt-2 sm:mt-3">
              <span className="text-sm sm:text-base font-black text-white">Grand Total</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400">Rs. {formatCurrency(totals.total, settings)}</span>
            </div>
          </div>

          {/* Payment Options */}
          <div className="p-4 sm:p-5 bg-[#0f172a] border-t border-slate-800 pb-20 lg:pb-5">
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button onClick={() => setPaymentMode('cash')} className={`py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${paymentMode === 'cash' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                <Landmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Cash
              </button>
              <button onClick={() => setPaymentMode('credit')} className={`py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${paymentMode === 'credit' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Credit
              </button>
              <button onClick={() => setPaymentMode('bank')} className={`py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${paymentMode === 'bank' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                <Landmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Bank
              </button>
              <button onClick={() => setPaymentMode('digital')} className={`py-2 rounded-xl text-[10px] sm:text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${paymentMode === 'digital' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Digital
              </button>
            </div>

            {/* Amount Received Input */}
            {paymentMode !== 'credit' && (
              <div className="flex items-center justify-between bg-[#1e293b] rounded-xl border border-slate-800 px-4 py-2 sm:py-3 mb-3 sm:mb-4">
                <span className="text-[11px] sm:text-xs font-bold text-slate-400">Amount Received</span>
                <input 
                  value={amountReceived} 
                  onChange={(e) => setAmountReceived(e.target.value)} 
                  placeholder={totals.total.toString()} 
                  className="w-24 sm:w-32 text-right font-black text-sm sm:text-base text-white bg-transparent border-b border-slate-700 focus:border-orange-500 focus:outline-none pb-1" 
                />
              </div>
            )}
            
            {/* Bank/Digital selects */}
            {paymentMode === 'bank' && (
              <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className="w-full mb-3 sm:mb-4 rounded-xl border border-slate-700 bg-[#1e293b] px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-blue-400">
                <option value="">{t('Select receiving bank', 'بینک منتخب کریں')}</option>
                {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            {paymentMode === 'digital' && (
              <select value={digitalAccountId} onChange={(e) => setDigitalAccountId(e.target.value)} className="w-full mb-3 sm:mb-4 rounded-xl border border-slate-700 bg-[#1e293b] px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-blue-400">
                <option value="">{t('Select digital wallet', 'ڈیجیٹل والٹ منتخب کریں')}</option>
                {digitalAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}

            <div className="flex items-center justify-between mb-4 sm:mb-6 px-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-400">Change</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">Rs. {formatCurrency(totals.change, settings)}</span>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-black text-sm sm:text-[15px] flex items-center justify-between px-6 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span>Save Bill & Create Receipt</span>
              <span className="flex items-center gap-2">Rs. {formatCurrency(totals.total, settings)} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></span>
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
