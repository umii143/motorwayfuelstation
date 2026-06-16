import React from 'react';
import { 
  X, LayoutDashboard, RefreshCw, History, Users, Factory, 
  BookOpen, Landmark, Smartphone, Fuel, TrendingDown, 
  FileBarChart, Building, Wrench, DollarSign, Settings,
  Shield, CreditCard, MessageCircle, Database, AlertTriangle,
  Sun, Moon, Globe, LogOut
} from 'lucide-react';
import { GlobalSettings } from '../../types';
import { t } from '../../lib/translations';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onViewChange: (view: string) => void;
  activeView: string;
  settings: GlobalSettings;
  isLubeBusiness: boolean;
  onLanguageToggle: () => void;
  onThemeToggle: () => void;
  onLogout: () => void;
  isSuperAdmin?: boolean;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onViewChange, 
  activeView,
  settings,
  isLubeBusiness,
  onLanguageToggle,
  onThemeToggle,
  onLogout,
  isSuperAdmin = false
}) => {
  if (!isOpen) return null;

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', urdu: 'ڈیش بورڈ' },
    { id: isLubeBusiness ? 'lube_pos' : 'shift_wizard', icon: RefreshCw, label: isLubeBusiness ? 'Lube POS Terminal' : 'Shift Wizard', urdu: isLubeBusiness ? 'لیوب پی او ایس' : 'شفٹ وزرڈ' },
    { id: 'shift_logs', icon: History, label: 'Shift Logs & Audit', urdu: 'شفٹ لاگز', hideInLube: true },
    { id: 'price_management', icon: DollarSign, label: 'Price Management', urdu: 'قیمتیں اور نرخ', hideInLube: true },
    { id: 'ledger', icon: BookOpen, label: 'Accounts & Billing', urdu: 'کھاتہ اور بلنگ' },
    { id: 'customers', icon: Users, label: 'Customers Khata', urdu: 'گاہکوں کا کھاتہ' },
    { id: 'suppliers', icon: Factory, label: isLubeBusiness ? 'Suppliers' : 'Suppliers Depot', urdu: isLubeBusiness ? 'سپلائرز' : 'سپلائرز ڈپو' },
    { id: 'inventory', icon: isLubeBusiness ? Wrench : Fuel, label: isLubeBusiness ? 'Product & Parts Stock' : 'Fuel Stock', urdu: isLubeBusiness ? 'پروڈکٹ اسٹاک' : 'فیول اسٹاک' },
    { id: 'bank_cash', icon: Landmark, label: 'Bank Cash', urdu: 'بینک کیش' },
    { id: 'digital_cash', icon: Smartphone, label: 'Digital Cash', urdu: 'ڈیجیٹل کیش' },
    { id: 'enterprise_hub', icon: Building, label: 'Enterprise Modules', urdu: 'انٹرپرائز ماڈیولز' },
    { id: 'expenses', icon: TrendingDown, label: 'Expenses', urdu: 'اخراجات' },
    { id: 'reports', icon: FileBarChart, label: isLubeBusiness ? 'Lube Reports' : 'Advanced Reports', urdu: isLubeBusiness ? 'لیوب رپورٹس' : 'ایڈوانسڈ رپورٹس' },
    { id: 'setup_tanks', icon: Database, label: 'Tanks Setup', urdu: 'ٹینکس سیٹ اپ' },
    { id: 'setup_nozzles', icon: Fuel, label: 'Nozzles Setup', urdu: 'نوزلز سیٹ اپ' },
    { id: 'setup_rates', icon: DollarSign, label: 'Rates Change', urdu: 'ریٹس تبدیل کریں' },
    { id: 'setup_accounts', icon: Building, label: 'Chart of Accounts', urdu: 'اکاؤنٹس چارٹ' },
    { id: 'setup_profile', icon: Settings, label: 'Station Profile', urdu: 'اسٹیشن پروفائل' },
    { id: 'security_hub', icon: Shield, label: 'Security & Roles', urdu: 'سیکیورٹی ہب' },
    { id: 'subscription_hub', icon: CreditCard, label: 'Subscription', urdu: 'بلنگ' },
    ...(isSuperAdmin ? [{ id: 'license_manager', icon: Shield, label: 'License Manager', urdu: 'لائسنس مینیجر' }] : []),
    { id: 'communication_center', icon: MessageCircle, label: 'Communication Center', urdu: 'مواصلاتی مرکز' },
    { id: 'sync_center', icon: RefreshCw, label: 'Sync Center', urdu: 'سنک سینٹر' }
  ];

  const visibleItems = menuItems.filter(item => !(isLubeBusiness && item.hideInLube));

  const handleItemClick = (id: string) => {
    onViewChange(id);
    onClose();
  };

  const handleThemeToggle = () => {
    // App handles theme state, we can dispatch an event or rely on the same global hook if passed
    // For now, since Sidebar is a dumb component, we need to pass a callback or update global settings
    // To keep it simple, we use a custom event or let the TopHeader handle it.
    // Wait, the user wants it HERE. Let's add props for Theme and Language toggling.
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-[#151521] border-r border-slate-200 dark:border-white/5 z-[110] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 dark:border-white/5 shrink-0">
          <span className="font-black tracking-tight text-slate-800 dark:text-white uppercase text-lg">
            Navigation
          </span>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scroll-container pb-24">
          {visibleItems.map(item => {
            const isActive = activeView === item.id || (activeView.startsWith('setup_') && item.id === activeView);
            
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                  isActive 
                    ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{t(item.label, item.urdu, settings)}</span>
              </button>
            );
          })}
        </div>
        {/* Bottom Toggles */}
        <div className="border-t border-slate-100 dark:border-white/5 p-4 shrink-0 bg-slate-50 dark:bg-white/5 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={onLanguageToggle}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:border-orange-200 transition-colors shadow-xs"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              {settings.language === 'ur' ? 'اردو' : 'English'}
            </button>
            <button
              onClick={onThemeToggle}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-[#1A1A24] border border-slate-200 dark:border-white/10 px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-orange-600 hover:border-orange-200 transition-colors shadow-xs"
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
              {t('Theme', 'تھیم', settings)}
            </button>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            {t('Sign Out', 'لاگ آؤٹ', settings)}
          </button>
        </div>

      </div>
    </>
  );
};
