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
    () => products.filter((product) => product.type !== 'fuel'),
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

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return sellableProducts;
    }

    return sellableProducts.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.urduName.includes(searchQuery)
      );
    });
  }, [searchQuery, sellableProducts]);

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
              <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-colors">
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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="rounded-[1.5rem] sm:rounded-[2rem] border border-white/80 bg-white/50 p-4 sm:p-6 shadow-[0_8px_40px_rgb(0,0,0,0.04)] backdrop-blur-2xl">
            <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white pb-4 sm:pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white text-blue-600 shadow-[0_4px_20px_rgb(0,0,0,0.05)]">
                  <ScanLine className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="font-sans text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                    {t('Product Catalog', 'پروڈکٹ کیٹلاگ')}
                  </h3>
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    {filteredProducts.length} items available
                  </span>
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Search products...', 'تلاش کریں...')}
                  className="w-full rounded-xl sm:rounded-2xl border border-white bg-white/60 py-2 sm:py-3 pl-9 sm:pl-11 pr-4 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 shadow-inner backdrop-blur-md transition-all focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 2xl:grid-cols-3">
              <AnimatePresence>
                {filteredProducts.map((product, index) => {
                  const isHiddenOnMobile = !searchQuery.trim() && index >= 4;
                  return (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    whileHover={product.currentStock > 0 ? { y: -2, scale: 1.02 } : {}}
                    whileTap={product.currentStock > 0 ? { scale: 0.98 } : {}}
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product.id)}
                    disabled={product.currentStock <= 0}
                    className={`group relative overflow-hidden rounded-[1rem] sm:rounded-[1.5rem] border p-3 sm:p-5 text-left transition-all duration-300 ${isHiddenOnMobile ? 'hidden sm:block' : ''} ${
                      product.currentStock <= 0
                        ? 'cursor-not-allowed border-slate-100 bg-slate-50/50 text-slate-400 grayscale'
                        : 'border-white/80 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-md hover:border-blue-200 hover:bg-white hover:shadow-[0_15px_40px_rgb(59,130,246,0.12)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <strong className={`block text-[11px] sm:text-base font-black tracking-tight truncate transition-colors ${product.currentStock > 0 ? 'text-slate-900 group-hover:text-blue-600' : 'text-slate-400'}`}>
                          {isUrdu ? product.urduName : product.name}
                        </strong>
                        <span className="mt-0.5 sm:mt-1 block text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate">
                          {product.type} • {product.unit}
                        </span>
                      </div>
                      <div className={`flex h-6 w-6 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 ${product.currentStock > 0 ? 'bg-white text-slate-400 shadow-[0_2px_10px_rgb(0,0,0,0.04)] group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-[0_4px_15px_rgb(59,130,246,0.4)]' : 'bg-slate-100 text-slate-300'}`}>
                        <PlusCircle className="h-3 w-3 sm:h-5 sm:w-5" />
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-0">
                      <div>
                        <span className="block text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1">
                          {t('Rate', 'ریٹ')}
                        </span>
                        <span className={`font-mono text-sm sm:text-xl font-black ${product.currentStock > 0 ? 'bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent' : 'text-slate-400'}`}>
                          {formatCurrency(product.rate, settings)}
                        </span>
                      </div>
                      <span className={`w-fit rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.16em] shadow-sm backdrop-blur-md ${
                        product.currentStock > 10 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        product.currentStock > 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {t('Stock', 'اسٹاک')} {product.currentStock}
                      </span>
                    </div>
                  </motion.button>
                )})}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>

        {/* Right Panel - Cart */}
        <div className="space-y-6">
          <div className="sticky top-6 rounded-[2.5rem] border border-white/80 bg-white/60 p-8 shadow-[0_8px_40px_rgb(0,0,0,0.06)] backdrop-blur-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl" />
            
            <div className="relative z-10 mb-8 flex items-center gap-4 border-b border-white pb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.05)]">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-black tracking-tight text-slate-900">
                {t('Current Order', 'موجودہ آرڈر')}
              </h3>
            </div>

            <div className="relative z-10 space-y-6">
              {/* Form Elements */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                      {t('Cashier', 'کیشیئر')}
                    </label>
                    <select
                      value={cashierId}
                      onChange={(e) => setCashierId(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 shadow-inner backdrop-blur-md focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 transition-all"
                    >
                      <option value="">{t('Select cashier', 'کیشیئر منتخب کریں')}</option>
                      {cashierOptions.map((member) => (
                        <option key={member.id} value={member.id}>
                          {isUrdu ? member.urduName : member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                      {t('Vehicle', 'گاڑی')}
                    </label>
                    <input
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                      placeholder={t('Optional', 'اختیاری')}
                      className="w-full rounded-2xl border border-white bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 placeholder-slate-400 shadow-inner backdrop-blur-md focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                      {t('Account', 'کسٹمر کھاتہ')}
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 shadow-inner backdrop-blur-md focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 transition-all"
                    >
                      <option value="">{t('Walk-in', 'وا ک اِن')}</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {isUrdu ? customer.urduName : customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                      {t('Name', 'نام')}
                    </label>
                    <input
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder={t('Optional', 'اختیاری')}
                      className="w-full rounded-2xl border border-white bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 placeholder-slate-400 shadow-inner backdrop-blur-md focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Cart Items Area */}
              <div className="rounded-[2rem] border border-white bg-slate-50/50 p-5 shadow-inner">
                <div className="mb-4 flex items-center justify-between px-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {t('Items', 'آئٹمز')}
                  </span>
                  {cartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('Clear All', 'سب صاف کریں')}
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 max-h-[300px] overflow-y-auto px-1">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                        key={item.productId} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:p-3 shadow-sm transition-all hover:border-blue-200"
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <strong className="block text-[11px] sm:text-sm font-black text-slate-900 leading-tight truncate">
                            {isUrdu ? item.product.urduName : item.product.name}
                          </strong>
                          <span className="block text-[9px] sm:text-[11px] font-semibold text-slate-400 mt-0.5">
                            {formatCurrency(item.product.rate, settings)} / {item.product.unit}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 shadow-inner">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded bg-white text-slate-600 shadow-sm transition-all hover:scale-105 hover:text-rose-500"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-[1.5rem] text-center font-mono text-[10px] sm:text-xs font-black text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded bg-white text-slate-600 shadow-sm transition-all hover:scale-105 hover:text-blue-600"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-mono text-[11px] sm:text-sm font-black text-blue-600 w-16 text-right">
                            {formatCurrency(item.lineTotal, settings)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {cartItems.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/60 bg-white/40 py-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-300 mb-3">
                        <ShoppingCart className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 px-6">
                        {t('Tap products on the left to build the cart.', 'بل بنانے کے لیے بائیں طرف سے پروڈکٹس منتخب کریں۔')}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                      {t('Payment Mode', 'ادائیگی کا طریقہ')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 h-full">
                      <button type="button" onClick={() => setPaymentMode('cash')} className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-bold rounded-xl border transition-all ${paymentMode === 'cash' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white/70 text-slate-600 border-slate-200 hover:border-blue-200 hover:bg-white'}`}>{t('Cash', 'نقد')}</button>
                      <button type="button" onClick={() => setPaymentMode('bank')} className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-bold rounded-xl border transition-all ${paymentMode === 'bank' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white/70 text-slate-600 border-slate-200 hover:border-blue-200 hover:bg-white'}`}>{t('Bank', 'بینک')}</button>
                      <button type="button" onClick={() => setPaymentMode('digital')} className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-bold rounded-xl border transition-all ${paymentMode === 'digital' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white/70 text-slate-600 border-slate-200 hover:border-blue-200 hover:bg-white'}`}>{t('Digital', 'ڈیجیٹل')}</button>
                      <button type="button" onClick={() => setPaymentMode('credit')} className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-bold rounded-xl border transition-all ${paymentMode === 'credit' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white/70 text-slate-600 border-slate-200 hover:border-blue-200 hover:bg-white'}`}>{t('Credit', 'ادھار')}</button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                      {t('Received', 'وصول شدہ رقم')}
                    </label>
                    <input
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      disabled={paymentMode === 'credit'}
                      placeholder={paymentMode === 'credit' ? '0' : '0.00'}
                      className="w-full rounded-2xl border border-white bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 placeholder-slate-400 shadow-inner backdrop-blur-md focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {paymentMode === 'bank' && (
                  <div>
                    <select
                      value={bankAccountId}
                      onChange={(e) => setBankAccountId(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 shadow-inner backdrop-blur-md focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 transition-all"
                    >
                      <option value="">{t('Select receiving bank', 'بینک منتخب کریں')}</option>
                      {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}

                {paymentMode === 'digital' && (
                  <div>
                    <select
                      value={digitalAccountId}
                      onChange={(e) => setDigitalAccountId(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 shadow-inner backdrop-blur-md focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 transition-all"
                    >
                      <option value="">{t('Select digital wallet', 'ڈیجیٹل والٹ منتخب کریں')}</option>
                      {digitalAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder={t('Discount amt', 'ڈسکاؤنٹ')}
                        className="w-full rounded-2xl border border-white bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 placeholder-slate-400 shadow-inner backdrop-blur-md focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'amount' | 'percentage')}
                      className="w-[4.5rem] appearance-none rounded-2xl border border-white bg-white/70 px-2 py-3 text-sm font-bold text-slate-700 shadow-inner backdrop-blur-md focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 transition-all text-center"
                    >
                      <option value="amount">Rs</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                  <div>
                    <input
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      placeholder={t('Tax / Service', 'ٹیکس')}
                      className="w-full rounded-2xl border border-white bg-white/70 px-4 py-3 text-sm font-bold text-slate-700 placeholder-slate-400 shadow-inner backdrop-blur-md focus:border-blue-400 focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-linear-to-br from-blue-50 to-indigo-50/50 p-6 shadow-sm">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between text-slate-500 text-sm font-bold">
                    <span>{t('Subtotal', 'سب ٹوٹل')}</span>
                    <span className="font-mono text-slate-700">{formatCurrency(totals.subtotal, settings)}</span>
                  </div>
                  {(totals.discount > 0 || totals.tax > 0) && (
                    <>
                      <div className="flex justify-between text-slate-500 text-sm font-bold">
                        <span>{t('Discount', 'ڈسکاؤنٹ')}</span>
                        <span className="font-mono text-emerald-600">-{formatCurrency(totals.discount, settings)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-sm font-bold">
                        <span>{t('Tax', 'ٹیکس')}</span>
                        <span className="font-mono text-rose-500">+{formatCurrency(totals.tax, settings)}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-blue-200/50 pt-4" />
                  <div className="flex items-end justify-between">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-800/60">
                      {t('Total Due', 'کل بل')}
                    </span>
                    <span className="font-mono text-3xl font-black bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-xs">
                      {formatCurrency(totals.total, settings)}
                    </span>
                  </div>
                  {paymentMode !== 'credit' && Number(amountReceived) > totals.total && (
                    <div className="mt-4 flex justify-between rounded-xl bg-white/60 p-3 text-emerald-700 backdrop-blur-md border border-white shadow-sm">
                      <span className="font-bold text-sm">{t('Change', 'واپسی')}</span>
                      <span className="font-mono font-black">{formatCurrency(totals.change, settings)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkout Action */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="group flex w-full items-center justify-center gap-3 rounded-[2rem] bg-linear-to-r from-slate-900 to-slate-800 px-6 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_10px_30px_rgb(0,0,0,0.2)] transition-all hover:shadow-[0_15px_40px_rgb(0,0,0,0.3)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {t('Confirm Payment', 'ادائیگی کی تصدیق کریں')}
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Print/Invoice Modal */}
      <AnimatePresence>
        {lastSale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #print-invoice, #print-invoice * { visibility: visible; }
                  #print-invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
                  .no-print { display: none !important; }
                }
              `}</style>
              
              <div id="print-invoice" className="flex-1 overflow-y-auto bg-white p-6 text-slate-900">
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-black">{settings.stationName}</h2>
                  <p className="text-sm font-medium text-slate-500">{t('Lube POS Receipt', 'لیوب پی او ایس رسید')}</p>
                </div>
                
                <div className="mb-6 space-y-1 border-b border-dashed border-slate-300 pb-4 text-xs font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>{t('Invoice No', 'بل نمبر')}:</span>
                    <strong className="text-slate-900">{lastSale.invoiceNo}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('Date', 'تاریخ')}:</span>
                    <strong className="text-slate-900">{lastSale.date} {lastSale.time}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('Customer', 'کسٹمر')}:</span>
                    <strong className="text-slate-900">{lastSale.customerName}</strong>
                  </div>
                  {lastSale.vehicleNo && (
                    <div className="flex justify-between">
                      <span>{t('Vehicle', 'گاڑی')}:</span>
                      <strong className="text-slate-900">{lastSale.vehicleNo}</strong>
                    </div>
                  )}
                  {lastSale.isReturn && (
                    <div className="mt-2 text-center font-bold text-rose-600 uppercase">
                      *** RETURN / REFUND ***
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="pb-2 text-left font-bold">{t('Item', 'آئٹم')}</th>
                        <th className="pb-2 text-center font-bold">{t('Qty', 'مقدار')}</th>
                        <th className="pb-2 text-right font-bold">{t('Total', 'کل')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lastSale.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 font-medium">{item.productName}</td>
                          <td className="py-2 text-center">{item.quantity}</td>
                          <td className="py-2 text-right">{formatCurrency(item.lineTotal, settings)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1.5 border-t border-slate-800 pt-4 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>{t('Subtotal', 'سب ٹوٹل')}:</span>
                    <span>{formatCurrency(lastSale.subtotal, settings)}</span>
                  </div>
                  {lastSale.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>{t('Discount', 'ڈسکاؤنٹ')}:</span>
                      <span>-{formatCurrency(lastSale.discount, settings)}</span>
                    </div>
                  )}
                  {lastSale.tax > 0 && (
                    <div className="flex justify-between text-rose-500">
                      <span>{t('Tax', 'ٹیکس')}:</span>
                      <span>+{formatCurrency(lastSale.tax, settings)}</span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between border-t border-dashed border-slate-300 pt-2 text-base font-black">
                    <span>{t('Total', 'کل بل')}:</span>
                    <span>{formatCurrency(lastSale.total, settings)}</span>
                  </div>
                </div>

                <div className="mt-8 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <p>{t('Thank you for your visit!', 'آپ کی آمد کا شکریہ!')}</p>
                </div>
              </div>
              
              <div className="no-print border-t border-slate-100 bg-slate-50 p-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setLastSale(null)}
                    className="flex-1 rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-300 transition-colors"
                  >
                    {t('Close', 'بند کریں')}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_15px_rgb(37,99,235,0.3)] hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    {t('Print', 'پرنٹ')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
