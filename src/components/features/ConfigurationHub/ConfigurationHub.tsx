import React from 'react';
import { useStation } from '../../../contexts/StationContext';
import { 
  Settings, Database, Fuel, DollarSign, Building, Shield, 
  Users, AlertTriangle, CheckCircle2, ChevronRight, Activity, Server
} from 'lucide-react';

interface ConfigurationHubProps {
  onNavigate: (view: string) => void;
  language: 'en' | 'ur' | 'ar' | 'es' | 'zh';
  isLube: boolean;
}

export default function ConfigurationHub({ onNavigate, language, isLube }: ConfigurationHubProps) {
  const isUrdu = language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const modules = [
    {
      id: 'infrastructure',
      title: t('Fuel Infrastructure', 'فیول انفراسٹرکچر'),
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      items: [
        { label: t('Tank Configuration', 'ٹینک سیٹ اپ'), view: 'setup_tanks', icon: Database },
        { label: t('Nozzle Configuration', 'نوزل سیٹ اپ'), view: 'setup_nozzles', icon: Fuel },
      ],
      hideForLube: true
    },
    {
      id: 'product_pricing',
      title: t('Product & Pricing', 'پروڈکٹ اور قیمتیں'),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      items: [
        { label: t('Rate Management', 'فیول ریٹ سیٹ اپ'), view: 'setup_rates', icon: Activity },
      ],
      hideForLube: false
    },
    {
      id: 'financial',
      title: t('Financial Settings', 'مالیاتی ترتیبات'),
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      items: [
        { label: t('Chart of Accounts', 'اکاؤنٹس چارٹ'), view: 'setup_accounts', icon: Building },
      ],
      hideForLube: false
    },
    {
      id: 'station_setup',
      title: t('Station Setup', 'اسٹیشن سیٹ اپ'),
      icon: Settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      items: [
        { label: t('Station Profile', 'اسٹیشن پروفائل'), view: 'setup_profile', icon: Settings },
      ],
      hideForLube: false
    },
    {
      id: 'staff_security',
      title: t('Staff & Security', 'اسٹاف اور سیکیورٹی'),
      icon: Shield,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      items: [
        { label: t('Audit Settings & Logs', 'آڈٹ لاگز'), view: 'setup_audit', icon: Shield },
      ],
      hideForLube: false
    }
  ];

  const visibleModules = modules.filter(m => !(isLube && m.hideForLube));

  return (
    <div className="space-y-6 pb-20 lg:pb-5 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="h-7 w-7 text-orange-600" />
            <span>{t('Configuration Command Center', 'کنفیگریشن ہب')}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('Enterprise operations blueprint and central configuration matrix.', 'مرکزی سیٹ اپ اور کاروباری ترتیبات کا کنٹرول سینٹر۔')}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            {t('Configured Tanks', 'ٹینک سیٹ اپ')}
          </div>
          <div className="text-2xl font-black text-slate-800">8<span className="text-sm text-slate-400 font-medium">/8</span></div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            {t('Configured Nozzles', 'نوزل سیٹ اپ')}
          </div>
          <div className="text-2xl font-black text-slate-800">24<span className="text-sm text-slate-400 font-medium">/24</span></div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            {t('Configured Staff', 'اسٹاف ممبرز')}
          </div>
          <div className="text-2xl font-black text-slate-800">15</div>
        </div>
        <div className="bg-white border border-orange-200 bg-orange-50/50 rounded-xl p-4 shadow-sm">
          <div className="text-orange-700 text-xs font-bold uppercase tracking-wider mb-1">
            {t('Missing Items', 'نامکمل سیٹ اپ')}
          </div>
          <div className="text-2xl font-black text-orange-600">2</div>
        </div>
        <div className="bg-white border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 shadow-sm col-span-2 md:col-span-4 lg:col-span-1">
          <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            {t('Config Score', 'سسٹم اسکور')}
          </div>
          <div className="text-2xl font-black text-emerald-600">96%</div>
        </div>
      </div>

      {/* Alerts */}
      <div className="flex flex-col gap-2">
        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
          <span className="text-sm font-semibold text-orange-800">
            {t('Tank #3 Missing Calibration Chart', 'ٹینک 3 کا کیلیبریشن چارٹ نامکمل ہے')}
          </span>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg flex items-center gap-3">
          <Shield className="h-5 w-5 text-blue-600 shrink-0" />
          <span className="text-sm font-semibold text-blue-800">
            {t('2 Users Have Weak Passwords', 'دو یوزرز کا پاس ورڈ کمزور ہے')}
          </span>
        </div>
      </div>

      {/* Category Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visibleModules.map((module) => (
          <div key={module.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-4 flex items-center gap-3 border-b border-slate-100 ${module.bgColor}`}>
              <module.icon className={`h-6 w-6 ${module.color}`} />
              <h3 className={`font-bold text-lg ${module.color}`}>{module.title}</h3>
            </div>
            <div className="p-2">
              <div className="flex flex-col">
                {module.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigate(item.view)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-white group-hover:text-orange-600 group-hover:shadow-sm transition-all">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-slate-700 group-hover:text-slate-900">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
