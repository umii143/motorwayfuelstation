import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronDown, BookOpen, Search } from 'lucide-react';
import { GlobalSettings } from '../../types';
import { t as translate } from '../../lib/translations';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalSettings;
}

export default function HelpGuideModal({ isOpen, onClose, settings }: HelpGuideModalProps) {
  const t = (en: string, ur: string) => translate(en, ur, settings);
  const isUrdu = settings.language === 'ur';

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('getting_started');

  const guideSections = [
    {
      id: 'getting_started',
      title: t('1. Getting Started', '١. شروعات'),
      content: t(
        'Welcome to FuelPro POS! To get started, you must first register your products, storage tanks, and staff in the system. Use the Navigation menu on the left to access these modules.',
        'فیول پرو پی او ایس میں خوش آمدید! شروع کرنے کے لیے، آپ کو سب سے پہلے سسٹم میں اپنی پروڈکٹس، سٹوریج ٹینکس اور عملے کو رجسٹر کرنا ہوگا۔ ان ماڈیولز تک رسائی کے لیے بائیں جانب نیویگیشن مینو کا استعمال کریں۔'
      )
    },
    {
      id: 'inventory',
      title: t('2. Managing Inventory & Stock', '٢. اسٹاک اور انوینٹری کا انتظام'),
      content: t(
        'Go to the "Inventory" section to add fuel, lube, and spare parts. When receiving new stock, click "Record Delivery" and enter the supplier, quantity, and purchasing price. The retail price will be updated automatically.',
        'پٹرول، ڈیزل، لیوب اور اسپیئر پارٹس شامل کرنے کے لیے "انوینٹری" سیکشن میں جائیں۔ نیا اسٹاک وصول کرتے وقت، "Record Delivery" پر کلک کریں اور سپلائر، مقدار اور خرید کی قیمت درج کریں۔ خوردہ قیمت خود بخود اپ ڈیٹ ہو جائے گی۔'
      )
    },
    {
      id: 'shifts',
      title: t('3. Daily Shifts (Nozzle Reading)', '٣. روزانہ شفٹس (نوزل ریڈنگ)'),
      content: t(
        'Use the "Shifts" module to record daily fuel sales. Start a new shift, assign a staff member, and record the opening meter reading. At the end of the shift, enter the closing reading, and the system will automatically calculate the liters sold and cash expected.',
        'پٹرول کی روزانہ فروخت ریکارڈ کرنے کے لیے "شفٹس" ماڈیول استعمال کریں۔ نئی شفٹ شروع کریں، عملے کا ممبر منتخب کریں، اور ابتدائی میٹر ریڈنگ درج کریں۔ شفٹ کے اختتام پر حتمی ریڈنگ درج کریں، اور سسٹم خود بخود فروخت شدہ لیٹر اور متوقع کیش کا حساب لگا لے گا۔'
      )
    },
    {
      id: 'lube_pos',
      title: t('4. Lube POS (Direct Billing)', '٤. لیوب پی او ایس (ڈائریکٹ بلنگ)'),
      content: t(
        'For selling lubricants and spare parts, use the "Lube POS" module. Add items to the cart, apply any discounts or tax, select the payment mode (Cash, Bank, Digital, or Credit), and checkout. An invoice will be generated instantly.',
        'لیوبریکنٹس اور اسپیئر پارٹس فروخت کرنے کے لیے، "لیوب پی او ایس" ماڈیول استعمال کریں۔ کارٹ میں آئٹمز شامل کریں، کوئی ڈسکاؤنٹ یا ٹیکس لاگو کریں، ادائیگی کا طریقہ منتخب کریں (نقد، بینک، ڈیجیٹل، یا ادھار)، اور بل فائنل کریں۔ ایک انوائس فوراً تیار ہو جائے گی۔'
      )
    },
    {
      id: 'customers',
      title: t('5. Customer & Credit Accounts', '٥. کسٹمر اور ادھار کھاتہ'),
      content: t(
        'Register customers in the "Customers" module to track credit limits and pending balances. When a customer pays off their debt, record a "Receipt" to update their ledger.',
        'ادھار کی حد اور بقایا جات کو ٹریک کرنے کے لیے "کسٹمرز" ماڈیول میں گاہکوں کو رجسٹر کریں۔ جب کوئی گاہک اپنا ادھار ادا کرے، تو ان کا کھاتہ اپ ڈیٹ کرنے کے لیے "Receipt" یعنی وصولی ریکارڈ کریں۔'
      )
    },
    {
      id: 'suppliers',
      title: t('6. Suppliers & Payables', '٦. سپلائرز اور ادائیگی'),
      content: t(
        'Register your vendors in the "Suppliers" module. Whenever you purchase stock on credit, the supplier balance will increase. Record a payment to reduce your payable balance.',
        'اپنے وینڈرز کو "سپلائرز" ماڈیول میں رجسٹر کریں۔ جب بھی آپ ادھار پر اسٹاک خریدیں گے، سپلائر کا بیلنس بڑھ جائے گا۔ اپنا قابل ادا بیلنس کم کرنے کے لیے ادائیگی (Payment) ریکارڈ کریں۔'
      )
    },
    {
      id: 'expenses',
      title: t('7. Expenses Management', '٧. اخراجات کا انتظام'),
      content: t(
        'Track day-to-day station operations costs in the "Expenses" module. You can categorize expenses (e.g., utility bills, salaries) and see how they impact your overall profit.',
        'اسٹیشن کے روزمرہ کے اخراجات کو "اخراجات" ماڈیول میں ٹریک کریں۔ آپ اخراجات کی درجہ بندی کر سکتے ہیں (جیسے بجلی کے بل، تنخواہیں) اور دیکھ سکتے ہیں کہ وہ آپ کے مجموعی منافع پر کیسے اثر انداز ہوتے ہیں۔'
      )
    },
    {
      id: 'reports',
      title: t('8. Financial Reports', '٨. مالیاتی رپورٹس'),
      content: t(
        'Access the "Reports" module for deep insights into your business. View Profit & Loss statements, Tax summaries, Inventory Valuation, and Staff Performance.',
        'اپنے کاروبار کی گہرائی سے معلومات کے لیے "رپورٹس" ماڈیول تک رسائی حاصل کریں۔ منافع اور نقصان کے گوشوارے، ٹیکس کا خلاصہ، انوینٹری کی قیمت، اور عملے کی کارکردگی دیکھیں۔'
      )
    }
  ];

  const filteredSections = guideSections.filter(
    (sec) =>
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
            isUrdu ? 'text-right' : 'text-left'
          } dir-${settings.language}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-sans text-xl font-black text-slate-900">
                  {t('Comprehensive Help Guide', 'یوزر گائیڈ (اے سے زیڈ)')}
                </h2>
                <p className="font-sans text-xs font-semibold text-slate-500">
                  {t('Learn how to use FuelPro POS effectively.', 'فیول پرو پی او ایس کو مؤثر طریقے سے استعمال کرنے کا طریقہ سیکھیں۔')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="border-b border-slate-100 p-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("Search the guide...", "گائیڈ میں تلاش کریں...")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 font-sans text-sm font-semibold text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-hidden transition-all"
              />
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-2">
              {filteredSections.map((section) => {
                const isExpanded = expandedSection === section.id;
                return (
                  <div
                    key={section.id}
                    className={`rounded-xl border transition-all duration-200 ${
                      isExpanded
                        ? 'border-orange-200 bg-orange-50/30 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className="flex w-full items-center justify-between p-4 cursor-pointer focus:outline-hidden"
                    >
                      <span className="font-sans font-bold text-slate-800">{section.title}</span>
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                          isExpanded ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-slate-100 px-4 pb-4 pt-3 font-sans text-sm leading-relaxed text-slate-600">
                            {section.content}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {filteredSections.length === 0 && (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="font-sans font-semibold text-slate-500">
                    {t('No guide sections found matching your search.', 'آپ کی تلاش کے مطابق کوئی رہنمائی نہیں ملی۔')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
