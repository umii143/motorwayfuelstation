import React, { useState } from 'react';
import { Key, ShieldCheck, CreditCard, ExternalLink, Calendar, Clock, Search, CheckCircle2, Zap, AlertTriangle, Building, History, Activity, Power, Download } from 'lucide-react';
import { GlobalSettings } from '../../../types';

export default function LicenseSubscription({ settings }: { settings: GlobalSettings }) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [searchQuery, setSearchQuery] = useState('');
  const [isPlanActive, setIsPlanActive] = useState(true);

  // Mock data for the powerful view
  const totalDays = 365;
  const daysRemaining = isPlanActive ? 124 : 0;
  const daysPassed = isPlanActive ? totalDays - daysRemaining : totalDays;
  const progressPercentage = (daysPassed / totalDays) * 100;

  // Client specific mock data
  const clientSinceDate = new Date('2022-03-10');
  const today = new Date();
  const clientYears = Math.floor((today.getTime() - clientSinceDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  const clientMonths = Math.floor(((today.getTime() - clientSinceDate.getTime()) % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
  const totalPurchases = 5;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Key className="h-6 w-6 text-indigo-600" />
            {t('License & Subscription', 'لائسنس اور سبسکرپشن')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('Manage your FuelPro Enterprise licensing, billing, and active plans.', 'اپنے فیول پرو انٹرپرائز لائسنس، بلنگ اور فعال پلانز کا نظم کریں۔')}
          </p>
        </div>
        
        {/* Searchbar */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
            placeholder={t('Search plans, invoices...', 'پلانز، انوائسز تلاش کریں...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Client Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="h-16 w-16 bg-gradient-to-br from-indigo-100 to-slate-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-2xl border-4 border-white shadow-sm shrink-0">
              AK
           </div>
           <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Ahmed Khan 
                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                  <Zap className="h-3 w-3 fill-amber-500" /> VIP Client
                </span>
              </h3>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                <Building className="h-4 w-4 text-slate-400" /> Khan Petroleum LLC
              </p>
           </div>
        </div>
        
        <div className="flex gap-6 sm:gap-8 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
           <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Client Since', 'کلائنٹ کب سے ہیں')}</span>
              <span className="text-slate-800 font-bold flex items-center gap-1.5"><Calendar className="h-4 w-4 text-indigo-500" /> Mar 2022</span>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 inline-flex px-2 py-0.5 rounded w-fit">{clientYears} Yrs, {clientMonths} Mos</span>
           </div>
           <div className="w-px bg-slate-200 hidden sm:block"></div>
           <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Total Purchases', 'کل خریداریاں')}</span>
              <span className="text-slate-800 font-bold flex items-center gap-1.5"><History className="h-4 w-4 text-emerald-500" /> {totalPurchases} Licenses</span>
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 inline-flex px-2 py-0.5 rounded w-fit">LTV: $4,500</span>
           </div>
           <div className="w-px bg-slate-200 hidden sm:block"></div>
           <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Account Status', 'اکاؤنٹ کی حیثیت')}</span>
              <span className={`text-sm font-bold flex items-center gap-1.5 ${isPlanActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                 <Activity className="h-4 w-4" /> {isPlanActive ? t('Good Standing', 'بہتر حیثیت') : t('Suspended', 'معطل شدہ')}
              </span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Subscription Card */}
        <div className={`lg:col-span-2 premium-card border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white relative transition-all duration-300 ${!isPlanActive ? 'opacity-80 grayscale-[0.4] bg-slate-50' : ''}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
          
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                {isPlanActive ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t('Active Plan', 'فعال پلان')}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full mb-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    {t('Suspended Plan', 'معطل شدہ پلان')}
                  </div>
                )}
                
                <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  FuelPro Enterprise <Zap className={`h-6 w-6 ${isPlanActive ? 'text-amber-500 fill-amber-500' : 'text-slate-400 fill-slate-400'}`} />
                </h3>
                <p className="text-slate-500 mt-2 font-medium max-w-md">
                  {t('Comprehensive management suite with cloud sync and AI analytics.', 'کلاؤڈ سنک اور اے آئی اینالیٹکس کے ساتھ جامع مینجمنٹ سویٹ۔')}
                </p>
              </div>
              <div className={`hidden sm:flex h-16 w-16 rounded-2xl items-center justify-center border shadow-inner ${isPlanActive ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-100 border-slate-200'}`}>
                <ShieldCheck className={`h-8 w-8 ${isPlanActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold mb-1">
                  <Calendar className="h-4 w-4" /> 
                  {t('Activated On', 'فعال ہونے کی تاریخ')}
                </div>
                <div className="text-slate-900 font-bold text-lg">15 Jun 2025</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold mb-1">
                  <Clock className="h-4 w-4" /> 
                  {t('Valid Until', 'میعاد')}
                </div>
                <div className="text-slate-900 font-bold text-lg">15 Jun 2026</div>
              </div>
              <div className={`rounded-xl p-4 border relative overflow-hidden ${isPlanActive ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
                <div className="absolute right-0 bottom-0 opacity-10">
                  <Clock className={`h-16 w-16 -mb-4 -mr-4 ${isPlanActive ? 'text-indigo-600' : 'text-rose-600'}`} />
                </div>
                <div className={`flex items-center gap-2 text-sm font-semibold mb-1 ${isPlanActive ? 'text-indigo-700' : 'text-rose-700'}`}>
                  {t('Days Remaining', 'باقی دن')}
                </div>
                <div className={`font-black text-2xl ${isPlanActive ? 'text-indigo-900' : 'text-rose-900'}`}>{daysRemaining}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-600">{t('Subscription Progress', 'سبسکرپشن کی پیشرفت')}</span>
                <span className={isPlanActive ? "text-indigo-600" : "text-rose-600"}>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${isPlanActive ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-rose-500'}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 text-right mt-1">
                {daysPassed} {t('days used out of', 'دن استعمال ہو چکے ہیں')} {totalDays}
              </p>
            </div>
          </div>
          
          <div className="bg-slate-50 border-t border-slate-100 px-6 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 w-full">
               <div className="flex items-center gap-2 text-slate-600">
                 <span className="text-slate-400">{t('License Key:', 'لائسنس کی:')}</span>
                 <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">FP-ENT-8842-XXXX</span>
               </div>
               <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></div>
               <div className="flex items-center gap-2 text-slate-600">
                 <span className="text-slate-400">{t('Stations:', 'اسٹیشنز:')}</span>
                 <span className="font-bold text-slate-800">Unlimited</span>
               </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">{t('Billing & Management', 'بلنگ اور مینجمنٹ')}</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {t('Manage your payment methods, download past invoices, and explore upgrades.', 'اپنے ادائیگی کے طریقے منظم کریں، پچھلی انوائسز ڈاؤن لوڈ کریں، اور اپ گریڈز دیکھیں۔')}
            </p>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-50 transition-all group">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  {t('Payment Methods', 'ادائیگی کے طریقے')}
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
              </button>
              
              <button 
                onClick={() => setIsPlanActive(!isPlanActive)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl text-sm font-semibold shadow-sm transition-all group ${isPlanActive ? 'border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700' : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
              >
                <div className="flex items-center gap-3">
                  <Power className={`h-5 w-5 transition-colors ${isPlanActive ? 'text-slate-400 group-hover:text-rose-600' : 'text-emerald-600'}`} />
                  <span className={`transition-colors ${isPlanActive ? 'group-hover:text-rose-600' : 'text-emerald-700'}`}>
                    {isPlanActive ? t('Suspend Subscription', 'سبسکرپشن معطل کریں') : t('Re-activate Subscription', 'دوبارہ فعال کریں')}
                  </span>
                </div>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <button className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all rounded-xl ${isPlanActive ? 'premium-button' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`} disabled={!isPlanActive}>
                <Zap className="h-4 w-4" /> {t('Upgrade to Premium Plus', 'پریمیم پلس پر اپ گریڈ کریں')}
              </button>
            </div>
          </div>
          
          {/* Features Included */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">{t('Included in Enterprise', 'انٹرپرائز میں شامل')}</h3>
             <ul className="space-y-3 text-sm font-medium">
               <li className="flex items-center gap-3 text-slate-200">
                 <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                 {t('Unlimited Users & Roles', 'لامحدود صارفین اور کردار')}
               </li>
               <li className="flex items-center gap-3 text-slate-200">
                 <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                 {t('Real-time Cloud Synchronization', 'ریئل ٹائم کلاؤڈ ہم آہنگی')}
               </li>
               <li className="flex items-center gap-3 text-slate-200">
                 <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                 {t('Advanced AI Analytics (Beta)', 'ایڈوانسڈ اے آئی اینالیٹکس (بیٹا)')}
               </li>
               <li className="flex items-center gap-3 text-slate-200">
                 <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                 {t('24/7 Priority Support', '24/7 ترجیحی سپورٹ')}
               </li>
             </ul>
          </div>
        </div>
      </div>

      {/* Advanced Features & History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-6">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('Purchase & Activation History', 'خریداری اور ایکٹیویشن کی تاریخ')}</h3>
            <p className="text-sm text-slate-500 mt-1">{t('Detailed log of all your software purchases and active licenses.', 'آپ کی تمام سافٹ ویئر کی خریداریوں اور فعال لائسنسز کا تفصیلی لاگ۔')}</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-4 py-2 rounded-xl transition-colors">
            <Download className="h-4 w-4" />
            {t('Export Log', 'لاگ ایکسپورٹ کریں')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">{t('Date', 'تاریخ')}</th>
                <th className="px-6 py-4">{t('Product', 'پروڈکٹ')}</th>
                <th className="px-6 py-4">{t('Type', 'قسم')}</th>
                <th className="px-6 py-4">{t('Amount', 'رقم')}</th>
                <th className="px-6 py-4">{t('Status', 'حیثیت')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">15 Jun 2025</td>
                <td className="px-6 py-4 font-bold text-indigo-600">FuelPro Enterprise V3.0</td>
                <td className="px-6 py-4 font-medium text-slate-700">Renewal</td>
                <td className="px-6 py-4 font-mono font-medium">$1,200.00</td>
                <td className="px-6 py-4">
                   <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">Paid</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">15 Jun 2024</td>
                <td className="px-6 py-4 font-bold text-indigo-600">FuelPro Enterprise V2.0</td>
                <td className="px-6 py-4 font-medium text-slate-700">Renewal</td>
                <td className="px-6 py-4 font-mono font-medium">$1,200.00</td>
                <td className="px-6 py-4">
                   <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">Paid</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">10 Mar 2022</td>
                <td className="px-6 py-4 font-bold text-indigo-600">FuelPro Pro V1.0</td>
                <td className="px-6 py-4 font-medium text-amber-700">New Purchase</td>
                <td className="px-6 py-4 font-mono font-medium">$2,100.00</td>
                <td className="px-6 py-4">
                   <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200">Paid</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
