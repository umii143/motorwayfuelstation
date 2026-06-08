import React from 'react';
import { useStation } from '../../../contexts/StationContext';
import {
  Settings, Database, Fuel, DollarSign, Building, Shield, 
  Users, AlertTriangle, CheckCircle2, ChevronRight, Activity, Server, Droplets, ArrowRight
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
      id: 'fuel_setup',
      title: t('Fuel Setup', 'فیول سیٹ اپ'),
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      items: [
        { label: t('Fuel Products', 'فیول پروڈکٹس'), view: 'setup_products', icon: Droplets },
        { label: t('Tanks', 'ٹینک'), view: 'setup_tanks', icon: Database },
        { label: t('Nozzles', 'نوزل'), view: 'setup_nozzles', icon: Fuel },
        { label: t('Rates', 'ریٹس'), view: 'setup_rates', icon: Activity },
      ],
      hideForLube: true
    },
    {
      id: 'financial_setup',
      title: t('Financial Setup', 'مالیاتی سیٹ اپ'),
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      items: [
        { label: t('Banks & Cash Accounts', 'بینک اور کیش اکاؤنٹس'), view: 'setup_accounts', icon: Building },
        { label: t('Expense Categories', 'اخراجات کیٹیگریز'), view: 'setup_expenses', icon: DollarSign },
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
        { label: t('Users & Roles', 'یوزرز اور کردار'), view: 'setup_users', icon: Users },
        { label: t('Audit Settings & Logs', 'آڈٹ لاگز'), view: 'setup_audit', icon: Shield },
      ],
      hideForLube: false
    },
    {
      id: 'business_setup',
      title: t('Business Setup', 'بزنس سیٹ اپ'),
      icon: Settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      items: [
        { label: t('Station Profile', 'اسٹیشن پروفائل'), view: 'setup_profile', icon: Settings },
        { label: t('Tax Settings', 'ٹیکس سیٹنگز'), view: 'setup_tax', icon: DollarSign },
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

      {/* Setup Progress & KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Setup Progress Dashboard */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-600" />
            {t('Station Setup Progress', 'اسٹیشن کی تیاری')}
          </h3>
          <div className="space-y-3 font-sans text-sm font-semibold">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <span>{t('Fuel Products Configured', 'فیول پروڈکٹس')}</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <span>{t('Tanks Configured', 'ٹینک سیٹ اپ')}</span>
            </div>
            <div className="flex items-center gap-3 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{t('Nozzles Missing', 'نوزلز درکار ہیں')}</span>
            </div>
            <div className="flex items-center gap-3 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{t('Rates Missing', 'ریٹس درکار ہیں')}</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('Setup Score', 'اسکور')}</span>
              <span className="text-xl font-black text-emerald-600">65%</span>
            </div>
            <button 
              onClick={() => onNavigate('setup_nozzles')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>{t('Configure Nozzles', 'نوزلز سیٹ کریں')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Standard KPI Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              {t('Configured Tanks', 'ٹینک سیٹ اپ')}
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">8<span className="text-sm text-slate-400 font-medium">/8</span></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              {t('Configured Nozzles', 'نوزل سیٹ اپ')}
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">24<span className="text-sm text-slate-400 font-medium">/24</span></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              {t('Configured Staff', 'اسٹاف ممبرز')}
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">15</div>
          </div>
          <div className="bg-white border border-orange-200 bg-orange-50/50 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="text-orange-700 text-xs font-bold uppercase tracking-wider mb-1">
              {t('Missing Items', 'نامکمل سیٹ اپ')}
            </div>
            <div className="text-2xl font-black text-orange-600 mt-2">2</div>
          </div>
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
