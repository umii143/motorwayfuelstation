/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  RefreshCw,
  History,
  Users,
  Factory,
  BookOpen,
  Landmark,
  Smartphone,
  Fuel,
  TrendingDown,
  FileBarChart,
  Settings,
  Users2,
  Menu,
  X,
  Languages,
  UserCircle,
  Shield,
  LogOut,
  ChevronDown,
  Plus,
  Trash2,
  Edit,
  Building,
  DollarSign,
  Truck,
  ArrowRightLeft,
  Wrench,
  ShieldAlert,
  Gift,
  LineChart,
  BarChart3,
  Network,
  Camera,
  Link,
  Tag,
  CreditCard,
  Sun,
  Moon,
  Bell,
  HelpCircle,
  Search,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sliders,
  Database,
  Droplets,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  ScanLine
} from 'lucide-react';
import { GlobalSettings, Station } from '../../types';
import { t as translate } from '../../lib/translations';
import HelpGuideModal from '../ui/HelpGuideModal';
import AIDocumentScanner from '../ui/AIDocumentScanner';
import { useStation } from '../../contexts/StationContext';
import { fetchWithAuth } from '../../lib/api';
import { useSetupProgress } from '../../hooks/useSetupProgress';
import { ConfigSidebarItem } from './ConfigSidebarItem';

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  settings: GlobalSettings;
  onSettingsUpdate: (settings: GlobalSettings) => void;
  user?: any;
  onLogout?: () => void;
  stations?: Station[];
  activeStationId?: string;
  onSwitchStation?: (id: string) => void;
  onAddStation?: (station: Station) => void;
  onEditStation?: (station: Station) => void;
  onDeleteStation?: (stationId: string) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: (collapsed: boolean) => void;
}

export default function Navigation({
  activeView,
  onViewChange,
  settings,
  onSettingsUpdate,
  user,
  onLogout,
  stations = [],
  activeStationId = 'st_default',
  onSwitchStation,
  onAddStation,
  onEditStation,
  onDeleteStation,
  isSidebarCollapsed = false,
  onToggleSidebar
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  
  // Modal controllers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<Station | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUrduName, setFormUrduName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNtn, setFormNtn] = useState('');
  const [formContact, setFormContact] = useState('');

  const isUrdu = settings.language === 'ur';

  // Translates helper
  const t = (en: string, ur: string) => translate(en, ur, settings);

  const isLube = activeStationId === 'st_lube';

  const allMenuItems = [
    // MAIN
    { id: 'dashboard', section: 'main', icon: LayoutDashboard, label: 'Dashboard', urdu: 'ڈیش بورڈ', showInLube: true },
    { id: isLube ? 'lube_pos' : 'shift_wizard', section: 'main', icon: RefreshCw, label: isLube ? 'Lube POS Terminal' : 'Shift Wizard', urdu: isLube ? 'لیوب پی او ایس' : 'شفٹ وزرڈ', showInLube: true },
    { id: 'shift_logs', section: 'main', icon: History, label: 'Shift Logs & Audit', urdu: 'شفٹ لاگز', showInLube: false },
    { id: 'price_management', section: 'main', icon: DollarSign, label: 'Price Management', urdu: 'قیمتیں اور نرخ', showInLube: false },
    { id: 'ledger', section: 'main', icon: BookOpen, label: 'Accounts & Billing', urdu: 'کھاتہ اور بلنگ', showInLube: true },
    { id: 'customers', section: 'main', icon: Users, label: 'Customers Khata', urdu: 'گاہکوں کا کھاتہ', showInLube: true },
    { id: 'suppliers', section: 'main', icon: Factory, label: isLube ? 'Suppliers' : 'Suppliers Depot', urdu: isLube ? 'سپلائرز' : 'سپلائرز ڈپو', showInLube: true },
    { id: 'inventory', section: 'main', icon: isLube ? Wrench : Fuel, label: isLube ? 'Product & Parts Stock' : 'Fuel Stock', urdu: isLube ? 'پروڈکٹ اسٹاک' : 'فیول اسٹاک', showInLube: true },
    { id: 'bank_cash', section: 'main', icon: Landmark, label: 'Bank Cash', urdu: 'بینک کیش', showInLube: true },
    { id: 'digital_cash', section: 'main', icon: Smartphone, label: 'Digital Cash', urdu: 'ڈیجیٹل کیش', showInLube: true },
    { 
      id: 'enterprise_hub', 
      section: 'main',
      icon: Building, 
      label: 'Enterprise Modules', 
      urdu: 'انٹرپرائز ماڈیولز', 
      showInLube: true,
      children: [
        { id: 'fleet', icon: Truck, label: 'Fleet Accounts', urdu: 'فلیٹ منیجمنٹ', showInLube: false },
        { id: 'tanker_delivery', icon: ArrowRightLeft, label: isLube ? 'Supplier Deliveries' : 'Tankers & Delivery', urdu: isLube ? 'سپلائر ڈیلیوری' : 'ٹینکر شیڈول', showInLube: false },
        { id: 'loss_prevention', icon: ShieldAlert, label: 'Loss Prevention', urdu: 'نقصان کی روک تھام', showInLube: false },
        { id: 'loyalty', icon: Gift, label: 'Loyalty & Rewards', urdu: 'لائلٹی پروگرام', showInLube: true },
        { id: 'maintenance', icon: Wrench, label: 'Maintenance & Assets', urdu: 'مرمت', showInLube: true },
        { id: 'bi_analytics', icon: LineChart, label: 'BI Analytics', urdu: 'بی آئی اینالٹکس', showInLube: true },
        { id: 'demand_forecast', icon: BarChart3, label: 'Demand Forecast', urdu: 'ڈیمانڈ', showInLube: true },
        { id: 'erp_integration', icon: Link, label: 'ERP Connect', urdu: 'ای آر پی کنیکٹ', showInLube: true },
        { id: 'cctv', icon: Camera, label: 'CCTV Security', urdu: 'سی سی ٹی وی', showInLube: true },
        { id: 'api_gateway', icon: Network, label: 'API Gateway', urdu: 'اے پی آئی گیٹ وے', showInLube: true },
      ]
    },
    // OPERATIONS
    { id: 'discounts', section: 'operations', icon: Tag, label: 'Discounts', urdu: 'ڈسکاؤنٹس', showInLube: true },
    { id: 'expenses', section: 'operations', icon: TrendingDown, label: 'Expenses', urdu: 'اخراجات', showInLube: true },
    { id: 'staff', section: 'operations', icon: Users2, label: 'Staff & Payroll', urdu: 'اسٹاف اور تنخواہ', showInLube: true },
    // ANALYTICS
    { id: 'reports', section: 'analytics', icon: FileBarChart, label: isLube ? 'Lube Reports' : 'Advanced Reports (104)', urdu: isLube ? 'لیوب رپورٹس' : 'ایڈوانسڈ رپورٹس', showInLube: true },
    { id: 'dip_calculator', section: 'analytics', icon: Droplets, label: 'Dip Chart Calculator', urdu: 'دپ چارٹ کیلکولیٹر', showInLube: false },
    { id: 'ogra_sync', section: 'analytics', icon: ShieldCheck, label: 'OGRA Price Sync', urdu: 'OGRA قیمت سنک', showInLube: false },
    { id: 'ai_analytics', section: 'analytics', icon: Sparkles, label: 'AI Analytics Hub', urdu: 'اے آئی اینالٹکس', showInLube: true },
    // SYSTEM
    { id: 'security_hub', section: 'system', icon: Shield, label: 'Security & Roles', urdu: 'سیکیورٹی ہب', showInLube: true },
    { id: 'subscription_hub', section: 'system', icon: CreditCard, label: 'Subscription & Billing', urdu: 'بلنگ اور پلان', showInLube: true },
    { id: 'whatsapp_alerts', section: 'system', icon: MessageCircle, label: 'WhatsApp Alerts', urdu: 'واٹس ایپ الرٹس', showInLube: true }
  ];

  // Filter menu items based on business type
  const menuItems = isLube
    ? allMenuItems.filter(item => item.showInLube)
    : allMenuItems;

  const toggleLanguage = () => {
    const languages: ('en' | 'ur' | 'ar' | 'es' | 'zh')[] = ['en', 'ur', 'ar', 'es', 'zh'];
    const currentIndex = languages.indexOf(settings.language || 'en');
    const nextIndex = (currentIndex + 1) % languages.length;
    const newLang = languages[nextIndex];
    const updated = { ...settings, language: newLang };
    onSettingsUpdate(updated);
  };

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // NEW CONTEXT & STATES
  const { products, customers, staff, shifts, banks, standaloneExpenses, stockTxns, tanks, suppliers, nozzles } = useStation();
  const { steps, setupComplete, progressPercent, firstIncompleteStep } = useSetupProgress();
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  // AI Search states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchResult, setAiSearchResult] = useState<string | null>(null);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  
  // Document Scanner state
  const [isDocScannerOpen, setIsDocScannerOpen] = useState(false);

  // 1. Theme Logic
  const availableThemes = [
    { id: 'light', icon: Sun, label: 'Light', urdu: 'لائٹ' },
    { id: 'dark', icon: Moon, label: 'Dark', urdu: 'ڈارک' },
    { id: 'blue', icon: LayoutDashboard, label: 'Ocean Blue', urdu: 'نیلا' },
    { id: 'emerald', icon: Factory, label: 'Emerald', urdu: 'سبز' },
    { id: 'orange', icon: TrendingDown, label: 'Sunset Orange', urdu: 'نارنجی' },
  ];

  const handleSelectTheme = (themeId: string) => {
    onSettingsUpdate({ ...settings, theme: themeId as any });
    setIsThemeOpen(false);
  };

  // 2. Notification Logic
  const notifications = React.useMemo(() => {
    const alerts: any[] = [];
    const lowStockProducts = products.filter(p => p.currentStock <= p.minStock);
    const highBalanceCustomers = customers.filter(c => c.balance > (c.creditLimit || 50000));
    
    lowStockProducts.forEach(p => {
      alerts.push({
        id: `stock_${p.id}`,
        type: 'warning',
        title: t('Low Stock Alert', 'اسٹاک کم ہے'),
        message: `${t(p.name, p.urduName)}: ${p.currentStock} ${p.unit} ${t('remaining', 'باقی')}`,
        icon: Package
      });
    });

    highBalanceCustomers.forEach(c => {
      alerts.push({
        id: `credit_${c.id}`,
        type: 'danger',
        title: t('High Credit Balance', 'زیادہ ادھار'),
        message: `${t(c.name, c.urduName)}: ${c.balance.toLocaleString()}`,
        icon: AlertTriangle
      });
    });

    return alerts;
  }, [products, customers, settings.language]);

  // 3. Search Logic
  const searchResults = React.useMemo(() => {
    if (!globalSearch || globalSearch.length < 2) return null;
    const query = globalSearch.toLowerCase();
    return {
      customers: customers.filter(c => c.name.toLowerCase().includes(query) || c.contact.includes(query)).slice(0, 4),
      products: products.filter(p => p.name.toLowerCase().includes(query) || (p.urduName && p.urduName.includes(query))).slice(0, 4),
      staff: staff.filter(s => s.name.toLowerCase().includes(query) || (s.urduName && s.urduName.includes(query))).slice(0, 4)
    };
  }, [globalSearch, customers, products, staff]);

  const handleSearchSelect = (view: string) => {
    onViewChange(view);
    setGlobalSearch('');
    setIsSearchOpen(false);
  };

  const handleAskAI = async () => {
    if (!globalSearch.trim()) return;
    
    setAiSearchQuery(globalSearch);
    setIsSearchOpen(false);
    setIsAiModalOpen(true);
    setIsAiSearching(true);
    setAiSearchResult(null);
    setGlobalSearch('');

    try {
      // Prepare compact data context to avoid overwhelming the payload size
      // Take only the most relevant fields or a subset for extremely large arrays.
      const aiContext = {
        customers: customers.map(c => ({ name: c.name, balance: c.balance, limit: c.creditLimit })),
        suppliers: suppliers.map(s => ({ name: s.name, balance: s.balance })),
        products: products.map(p => ({ name: p.name, stock: p.currentStock, price: p.rate })),
        banks: banks.map(b => ({ name: b.name, balance: b.balance })),
        recentShifts: shifts.slice(0, 10).map(s => ({ date: s.date, status: s.status, overage: s.overage, shortage: s.shortage })),
        staff: staff.map(s => ({ name: s.name, role: s.role, status: s.status })),
        recentStockTxns: stockTxns.slice(0, 15).map(t => ({ itemId: t.itemId, type: t.type, qty: t.quantity, date: t.date })),
        recentExpenses: standaloneExpenses.slice(0, 15).map(e => ({ category: e.category, amount: e.amount, date: e.date }))
      };

      const response = await fetchWithAuth('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'You are an AI enterprise assistant for a fuel station. Answer the user\'s query based ONLY on the provided JSON data context representing the current state of the enterprise (customers, stock, banks, shifts, etc). If the data is not in the context, say you do not know.',
          userMessage: `Context: ${JSON.stringify(aiContext)}\n\nQuery: ${globalSearch}`,
          conversationHistory: [],
          language: settings.language
        })
      });

      if (!response.ok) throw new Error('Failed to generate AI response');
      const data = await response.json();
      setAiSearchResult(data.reply);
    } catch (error) {
      console.error(error);
      setAiSearchResult("⚠️ Failed to reach AI services or data context too large.");
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleItemClick = (id: string) => {
    onViewChange(id);
    setMobileMenuOpen(false);
    if (onToggleSidebar) {
      onToggleSidebar(true);
    }
  };

  // Open add Modal
  const openAddModal = () => {
    setFormName('');
    setFormUrduName('');
    setFormAddress('');
    setFormNtn('');
    setFormContact('');
    setShowAddModal(true);
    setStationDropdownOpen(false);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleSaveNewStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newStation: Station = {
      id: `st_${Date.now()}`,
      name: formName.trim(),
      urduName: formUrduName.trim() || formName.trim(),
      address: formAddress.trim(),
      ntn: formNtn.trim(),
      ownerContact: formContact.trim()
    };

    if (onAddStation) {
      onAddStation(newStation);
    }
    setShowAddModal(false);
  };

  // Open edit Modal
  const openEditModal = (station: Station, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent switching station when clicking edit button
    setStationToEdit(station);
    setFormName(station.name);
    setFormUrduName(station.urduName);
    setFormAddress(station.address);
    setFormNtn(station.ntn);
    setFormContact(station.ownerContact);
    setShowEditModal(true);
    setStationDropdownOpen(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setStationToEdit(null);
  };

  const handleSaveEditStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationToEdit || !formName.trim()) return;

    const updated: Station = {
      ...stationToEdit,
      name: formName.trim(),
      urduName: formUrduName.trim() || formName.trim(),
      address: formAddress.trim(),
      ntn: formNtn.trim(),
      ownerContact: formContact.trim()
    };

    if (onEditStation) {
      onEditStation(updated);
    }
    setShowEditModal(false);
    setStationToEdit(null);
  };

  // Handle station switch
  const handlePerformSwitch = (stationId: string) => {
    if (onSwitchStation) {
      onSwitchStation(stationId);
    }
    setStationDropdownOpen(false);
  };

  // Handle station delete
  const handlePerformDelete = (stationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent switching station when clicking delete button
    if (onDeleteStation) {
      onDeleteStation(stationId);
    }
  };

  return (
    <>
      {/* HEADER BAR */}
      <header className="fixed top-0 left-0 right-0 h-[65px] z-50 flex items-center justify-between border-b border-border glass px-4 py-3 shadow-md transition-all duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1 sm:p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden font-medium cursor-pointer shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className={`hidden xs:flex sm:flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-md transition-all duration-300 ${
              isLube ? 'bg-blue-600 shadow-blue-500/20' : 'bg-orange-600 shadow-orange-500/20'
            }`}>
              FP
            </div>
            
            {/* STATIONS SWITCHER DROPDOWN */}
            <div className="relative min-w-0">
              <button
                onClick={() => setStationDropdownOpen(!stationDropdownOpen)}
                className="group flex items-center gap-1 sm:gap-2 rounded-lg px-1 sm:px-2.5 py-1 text-left transition-all hover:bg-slate-50 cursor-pointer focus:outline-hidden min-w-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <h1 className="font-sans text-sm md:text-base lg:text-lg font-bold tracking-tight text-slate-900 leading-none group-hover:text-orange-600 transition-colors max-w-[80px] xs:max-w-[120px] sm:max-w-[160px] md:max-w-[280px] truncate">
                      {t(stations.find(s => s.id === activeStationId)?.name || settings.stationName, stations.find(s => s.id === activeStationId)?.urduName || settings.stationUrduName)}
                    </h1>
                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-orange-600 transition-colors shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-mono text-[9px] md:text-[10px] text-slate-400">
                      {t('Station Isolation Mode Active', 'مستقل اسٹیشن ڈیٹا سیکیورٹی')}
                    </span>
                  </div>
                </div>
              </button>

              {/* DROPDOWN CARD */}
              {stationDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 md:w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-slate-900/5 focus:outline-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100">
                    <span className="font-sans text-xs font-bold text-slate-500 tracking-wider uppercase">
                      {t('Switch ERP Station', 'دوسرے اسٹیشن پر جائیں')}
                    </span>
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {stations.map((st) => {
                      const isActive = st.id === activeStationId;
                      return (
                        <div
                          key={st.id}
                          onClick={() => handlePerformSwitch(st.id)}
                          className={`group flex items-center justify-between rounded-lg p-2.5 text-left cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-orange-50/80 border border-orange-200'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 max-w-[80%]">
                            <Building className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                            <div className="truncate">
                              <p className={`font-sans text-sm font-semibold truncate ${isActive ? 'text-orange-950' : 'text-slate-900'}`}>
                                {t(st.name, st.urduName)}
                              </p>
                              {st.address && (
                                <p className="font-sans text-[11px] text-slate-400 truncate mt-0.5">
                                  {st.address}
                                </p>
                              )}
                              {st.ntn && (
                                <p className="font-mono text-[9px] text-slate-500 font-bold mt-0.5">
                                  NTN: {st.ntn}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => openEditModal(st, e)}
                              className="p-1 text-slate-400 hover:text-orange-600 hover:bg-slate-100 rounded-md transition-colors"
                              title={t('Edit Station Info', 'ترمیم کریں')}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            {st.id !== 'st_default' && (
                              <button
                                onClick={(e) => handlePerformDelete(st.id, e)}
                                className="p-1 text-slate-400 hover:text-red-650 hover:bg-slate-100 rounded-md transition-colors text-red-500"
                                title={t('Delete Station Data', 'حذف کریں')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={openAddModal}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-center font-sans text-xs font-bold text-white transition-colors shadow-xs ${
                        isLube ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t('Register New Station', 'نیا اسٹیشن برانچ شامل کریں')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SEGMENTED SLIDER FOR THE TWO INDEPENDENT PRIMARY BUSINESSES */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0 select-none ml-2">
              <button
                type="button"
                onClick={() => handlePerformSwitch('st_default')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeStationId === 'st_default'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                <Fuel className="h-3.5 w-3.5" />
                <span>{t('Fuel Station', 'فیول اسٹیشن')}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePerformSwitch('st_lube')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeStationId === 'st_lube'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>{t('Lube Business', 'لیوب بزنس')}</span>
              </button>
            </div>

          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0 ml-auto">
          <button
            onClick={() => setIsDocScannerOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2 sm:px-3 py-1.5 font-sans text-[10px] sm:text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-100 hover:border-indigo-300 transition-colors shrink-0"
            title={t("Scan Receipt", "رسید سکین کریں")}
          >
            <ScanLine className="h-4 w-4" />
            <span className="hidden sm:inline">{t('Scan', 'سکین')}</span>
          </button>
          
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-slate-200 bg-white px-1.5 sm:px-3 py-1.5 font-sans text-[10px] sm:text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors shrink-0"
          >
            <Languages className="h-4 w-4 text-orange-600" />
            <span className="hidden sm:inline">
              {settings.language === 'ur' ? 'اردو (Urdu)' :
               settings.language === 'ar' ? 'العربية' :
               settings.language === 'es' ? 'Español' :
               settings.language === 'zh' ? '中文' : 'English'}
            </span>
            <span className="inline sm:hidden">
              {settings.language === 'ur' ? 'اردو' :
               settings.language === 'ar' ? 'العربية' :
               settings.language === 'es' ? 'ES' :
               settings.language === 'zh' ? '中文' : 'EN'}
            </span>
          </button>
          
          {/* Search Dropdown Trigger */}
          <div className="relative hidden md:block z-[60]">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 sm:p-2 text-slate-500 hover:bg-white hover:text-orange-600 hover:border-orange-200 transition-all cursor-pointer shadow-xs w-48 xl:w-64"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs font-semibold">{t("Search global...", "تلاش کریں...")}</span>
              <kbd className="ml-auto hidden rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-bold text-slate-400 sm:inline-block">Ctrl K</kbd>
            </button>

            {isSearchOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 lg:w-96 rounded-2xl bg-white p-3 shadow-2xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder={t("Type to search...", "تلاش کے لیے ٹائپ کریں...")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-[88px] text-sm font-semibold text-slate-800 focus:border-orange-500 focus:bg-white focus:outline-hidden"
                  />
                  {globalSearch.trim().length > 2 && (
                    <button 
                      onClick={handleAskAI}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      Ask AI
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {searchResults ? (
                    <div className="space-y-3">
                      {searchResults.customers.length > 0 && (
                        <div>
                          <div className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('Customers', 'گاہک')}</div>
                          {searchResults.customers.map(c => (
                            <button key={c.id} onClick={() => handleSearchSelect('customers')} className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-50 transition-colors cursor-pointer">
                              <span className="text-sm font-bold text-slate-700">{c.name}</span>
                              <span className="text-xs font-semibold text-slate-500">{c.contact}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.products.length > 0 && (
                        <div>
                          <div className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('Products', 'پروڈکٹس')}</div>
                          {searchResults.products.map(p => (
                            <button key={p.id} onClick={() => handleSearchSelect('inventory')} className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-50 transition-colors cursor-pointer">
                              <span className="text-sm font-bold text-slate-700">{t(p.name, p.urduName)}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.currentStock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {p.currentStock} {p.unit}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.staff.length > 0 && (
                        <div>
                          <div className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('Staff', 'عملہ')}</div>
                          {searchResults.staff.map(s => (
                            <button key={s.id} onClick={() => handleSearchSelect('staff')} className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-50 transition-colors cursor-pointer">
                              <span className="text-sm font-bold text-slate-700">{t(s.name, s.urduName)}</span>
                              <span className="text-xs font-semibold text-slate-500">{t(s.role, s.role)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.customers.length === 0 && searchResults.products.length === 0 && searchResults.staff.length === 0 && (
                        <div className="py-8 text-center text-sm font-semibold text-slate-400">
                          {t("No results found.", "کوئی نتیجہ نہیں ملا۔")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm font-semibold text-slate-400">
                      {t("Type at least 2 characters...", "تلاش کے لیے کم از کم 2 حروف ٹائپ کریں۔")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Setup Wizard Dropdown */}
          <div className="relative z-[60] shrink-0">
            <button
              onClick={() => setIsSetupOpen(!isSetupOpen)}
              className="rounded-lg border border-slate-200 bg-white p-1.5 sm:p-2 text-slate-500 hover:bg-slate-50 hover:text-orange-600 transition-colors cursor-pointer shadow-xs flex items-center justify-center"
              title={t('Setup Wizards', 'سیٹ اپ وزرڈز')}
            >
              <Sliders className="h-4 w-4" />
            </button>

            {isSetupOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('Quick Setup', 'سیٹ اپ')}
                </div>
                
                <button
                  onClick={() => { onViewChange('setup_nozzles'); setIsSetupOpen(false); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  <Fuel className="h-4 w-4" />
                  <span>{t('Nozzles Setup', 'نوزلز سیٹ اپ')}</span>
                </button>
                <button
                  onClick={() => { onViewChange('setup_tanks'); setIsSetupOpen(false); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  <Database className="h-4 w-4" />
                  <span>{t('Tanks Setup', 'ٹینکس سیٹ اپ')}</span>
                </button>
                <button
                  onClick={() => { onViewChange('setup_rates'); setIsSetupOpen(false); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>{t('Rates Change', 'ریٹس تبدیل کریں')}</span>
                </button>
                <button
                  onClick={() => { onViewChange('setup_accounts'); setIsSetupOpen(false); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  <Building className="h-4 w-4" />
                  <span>{t('Chart of Accounts', 'اکاؤنٹس چارٹ')}</span>
                </button>
                <button
                  onClick={() => { onViewChange('setup_profile'); setIsSetupOpen(false); setMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>{t('Station Profile', 'اسٹیشن پروفائل')}</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Theme Selector Dropdown */}
          <div className="relative z-[60] shrink-0">
            <button
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              className="rounded-lg border border-slate-200 bg-white p-1.5 sm:p-2 text-slate-500 hover:bg-slate-50 hover:text-orange-600 transition-colors cursor-pointer shadow-xs flex items-center justify-center"
              title={t('Switch Theme', 'تھیم تبدیل کریں')}
            >
              {settings.theme === 'light' ? <Sun className="h-4 w-4" /> : 
               settings.theme === 'dark' ? <Moon className="h-4 w-4" /> : 
               <LayoutDashboard className="h-4 w-4" />}
            </button>

            {isThemeOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white p-2 shadow-2xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('Select Theme', 'تھیم منتخب کریں')}
                </div>
                {availableThemes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                      settings.theme === theme.id ? 'bg-orange-50 text-orange-600' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <theme.icon className="h-4 w-4" />
                    <span>{t(theme.label, theme.urdu)}</span>
                    {settings.theme === theme.id && <CheckCircle2 className="h-4 w-4 ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative z-[60] shrink-0">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 sm:p-2 text-slate-500 hover:bg-slate-50 hover:text-orange-600 transition-colors cursor-pointer shadow-xs"
              title={t('Notifications', 'اطلاعات')}
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 lg:w-96 rounded-2xl bg-white shadow-2xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-100">
                  <span className="font-sans text-sm font-black text-slate-900">{t('Notifications', 'اطلاعات')}</span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {notifications.length} {t('New', 'نئی')}
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {notifications.length > 0 ? (
                    <div className="space-y-1">
                      {notifications.map(notif => (
                        <div key={notif.id} className="flex gap-3 rounded-xl p-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${notif.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                            <notif.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{notif.title}</div>
                            <div className="text-xs font-semibold text-slate-500 mt-0.5 leading-snug">{notif.message}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {t('Just now', 'ابھی ابھی')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-3">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{t("All caught up!", "سب کچھ ٹھیک ہے!")}</h4>
                      <p className="text-xs font-semibold text-slate-500 mt-1">{t("You don't have any pending alerts or notifications.", "آپ کے پاس کوئی زیر التواء انتباہات یا اطلاعات نہیں ہیں۔")}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 sm:p-2 text-slate-500 hover:bg-slate-50 hover:text-orange-600 transition-colors cursor-pointer shadow-xs shrink-0"
            title={t('Help Guide', 'یوزر گائیڈ')}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          
          {user ? (
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 font-mono font-bold text-xs font-medium">
                {user.role?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-sans text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]" title={user.email}>
                  {user.email.split('@')[0]}
                </span>
                <span className="font-mono text-[9px] text-orange-600 font-bold leading-none mt-1">
                  {user.role?.toUpperCase()}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title={t("Log Out", "لاگ آؤٹ")}
                  className="ml-2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 md:flex">
              <UserCircle className="h-8 w-8 text-slate-400" />
              <div className="flex flex-col text-left">
                <span className="font-sans text-xs font-bold text-slate-800 leading-none">
                  {t('Owner / Admin', 'مالک / ایڈمن')}
                </span>
                <span className="font-mono text-[10px] text-slate-400 leading-none mt-0.5">
                  {settings.ownerContact}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`fixed bottom-0 top-[65px] left-0 z-40 hidden border-r border-border glass py-4 lg:block animate-fade-in shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 ${
          isSidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full justify-between overflow-x-hidden">
          
          {/* TOGGLE BUTTON */}
          <button 
            onClick={() => onToggleSidebar && onToggleSidebar(!isSidebarCollapsed)}
            className="absolute -right-3 top-6 bg-white border border-slate-200 text-slate-400 hover:text-orange-600 rounded-full p-1 z-50 shadow-sm cursor-pointer"
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isSidebarCollapsed ? '-rotate-90' : 'rotate-90'}`} />
          </button>
          
          {/* PRIMARY SEGMENTED SWITCH IN SIDEBAR */}
          <div className="px-3 mb-4 shrink-0 select-none">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handlePerformSwitch('st_default')}
                className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 px-1 text-center font-sans text-[11px] font-bold transition-all cursor-pointer ${
                  activeStationId === 'st_default'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={isSidebarCollapsed ? t('Fuel Station', 'فیول') : undefined}
              >
                <Fuel className="h-3.5 w-3.5 shrink-0" />
                {!isSidebarCollapsed && <span>{t('Fuel Station', 'فیول')}</span>}
              </button>
              <button
                type="button"
                onClick={() => handlePerformSwitch('st_lube')}
                className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 px-1 text-center font-sans text-[11px] font-bold transition-all cursor-pointer ${
                  activeStationId === 'st_lube'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={isSidebarCollapsed ? t('Lube Biz', 'لیوب') : undefined}
              >
                <Wrench className="h-3.5 w-3.5 shrink-0" />
                {!isSidebarCollapsed && <span>{t('Lube Biz', 'لیوب')}</span>}
              </button>
            </div>
          </div>

          <nav className="space-y-1 px-3 flex-1 overflow-y-auto">
            {['main', 'operations', 'analytics', 'setup', 'system'].map(sectionKey => {
              if (sectionKey === 'setup') {
                if (isLube) return null;
                return (
                  <div key="desktop_section_setup" className="space-y-1">
                    {!isSidebarCollapsed && (
                      <div className="px-3 py-2 mt-4 flex items-center">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="px-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          {t('SETUP', 'سیٹ اپ')}
                        </span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                      </div>
                    )}
                    
                    {/* DYNAMIC CONFIGURATION ACCORDION */}
                    <button
                      onClick={() => {
                        const newExpanded = !isConfigExpanded;
                        setIsConfigExpanded(newExpanded);
                        if (isSidebarCollapsed && onToggleSidebar) onToggleSidebar(false);
                        if (newExpanded && firstIncompleteStep && !setupComplete) {
                          onViewChange(firstIncompleteStep.viewId);
                        } else if (newExpanded && setupComplete) {
                          onViewChange('setup_tanks');
                        }
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg py-2.5 font-sans text-sm font-medium transition-all cursor-pointer ${
                        isSidebarCollapsed ? 'px-2 justify-center' : 'px-3'
                      } ${
                        activeView.startsWith('setup_') || activeView === 'configuration'
                          ? isLube
                            ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600 shadow-xs'
                            : 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-600 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                      }`}
                      title={isSidebarCollapsed ? t('Configuration', 'کنفیگریشن') : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Settings className={`h-5 w-5 shrink-0 ${activeView.startsWith('setup_') || activeView === 'configuration' ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                        {!isSidebarCollapsed && (
                          <div className="flex-1 text-left flex items-center justify-between pr-1">
                            <span>{t('Configuration', 'کنفیگریشن')}</span>
                            {!setupComplete && (
                              <span className="ml-2 inline-flex items-center justify-center bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                {progressPercent}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!isSidebarCollapsed && <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isConfigExpanded ? 'rotate-180' : ''} ${activeView.startsWith('setup_') || activeView === 'configuration' ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />}
                    </button>
                    
                    {isConfigExpanded && !isSidebarCollapsed && (
                      <div className="pl-9 pr-2 space-y-1 mt-1 mb-2 animate-in slide-in-from-top-2 duration-200">
                        {steps.map(step => (
                          <ConfigSidebarItem
                            key={step.id}
                            step={step}
                            isActive={activeView === step.viewId}
                            onClick={onViewChange}
                          />
                        ))}
                        <div className="mt-2 mb-1 px-2 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-around shadow-sm">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            {t('Tanks', 'ٹینک')}: <span className="text-slate-800 font-bold ml-1">{tanks.length}</span>
                          </div>
                          <div className="w-px h-3 bg-slate-200"></div>
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            {t('Nozzles', 'نوزلز')}: <span className="text-slate-800 font-bold ml-1">{nozzles.length}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              const sectionItems = menuItems.filter(item => item.section === sectionKey);
              if (sectionItems.length === 0) return null;

              return (
                <div key={`desktop_section_${sectionKey}`} className="space-y-1">
                  {!isSidebarCollapsed && (
                    <div className="px-3 py-2 mt-4 flex items-center">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <span className="px-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        {t(sectionKey.toUpperCase(), sectionKey === 'main' ? 'مین' : sectionKey === 'operations' ? 'آپریشنز' : sectionKey === 'analytics' ? 'رپورٹس' : 'سسٹم')}
                      </span>
                      <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                  )}
                  {sectionItems.map((item) => {
                    const Icon = item.icon;
                    
                    if (item.children) {
                      const isChildActive = item.children.some(child => activeView === child.id);
                      const expanded = expandedMenus[item.id] !== undefined ? expandedMenus[item.id] : isChildActive;
                      
                      return (
                        <div key={item.id} className="space-y-1">
                          <button
                            onClick={() => {
                              setExpandedMenus(prev => ({ ...prev, [item.id]: !expanded }));
                              if (isSidebarCollapsed && onToggleSidebar) onToggleSidebar(false);
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-lg py-2.5 font-sans text-sm font-medium transition-all cursor-pointer ${
                              isSidebarCollapsed ? 'px-2 justify-center' : 'px-3'
                            } ${
                              isChildActive
                                ? isLube
                                  ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600 shadow-xs'
                                  : 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-600 shadow-xs'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                            }`}
                            title={isSidebarCollapsed ? t(item.label, item.urdu) : undefined}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`h-5 w-5 shrink-0 ${isChildActive ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                              {!isSidebarCollapsed && <span className="flex-1 text-left whitespace-nowrap">{t(item.label, item.urdu)}</span>}
                            </div>
                            {!isSidebarCollapsed && <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''} ${isChildActive ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />}
                          </button>
                          
                          {expanded && (
                            <div className="pl-9 pr-2 space-y-1 mt-1 mb-2 animate-in slide-in-from-top-2 duration-200">
                              {item.children.filter(child => isLube ? child.showInLube : true).map(child => {
                                const ChildIcon = child.icon;
                                const isChildItemActive = activeView === child.id;
                                return (
                                  <button
                                    key={child.id}
                                    onClick={() => handleItemClick(child.id)}
                                    className={`flex w-full items-center gap-3 rounded-lg py-2 font-sans text-xs font-semibold transition-all cursor-pointer ${
                                      isSidebarCollapsed ? 'px-2 justify-center' : 'px-3'
                                    } ${
                                      isChildItemActive
                                        ? isLube
                                          ? 'bg-blue-50 text-blue-700 shadow-xs border-l-2 border-blue-600'
                                          : 'bg-orange-50 text-orange-700 shadow-xs border-l-2 border-orange-600'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-l-2 border-transparent'
                                    }`}
                                    title={isSidebarCollapsed ? t(child.label, child.urdu) : undefined}
                                  >
                                    <ChildIcon className={`h-4 w-4 shrink-0 ${isChildItemActive ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                                    {!isSidebarCollapsed && <span className="whitespace-nowrap">{t(child.label, child.urdu)}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isActive = activeView === item.id || (item.id === 'configuration' && (activeView === 'settings' || activeView.startsWith('setup_')));
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`flex w-full items-center gap-3 rounded-lg py-2.5 font-sans text-sm font-medium transition-all cursor-pointer ${
                          isSidebarCollapsed ? 'px-2 justify-center' : 'px-3'
                        } ${
                          isActive
                            ? isLube
                              ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600 shadow-xs'
                              : 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-600 shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                        }`}
                        title={isSidebarCollapsed ? t(item.label, item.urdu) : undefined}
                      >
                        <Icon className={`h-5 w-5 shrink-0 ${isActive ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                        {!isSidebarCollapsed && <span className="whitespace-nowrap">{t(item.label, item.urdu)}</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
          
          {onLogout && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 font-sans text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span>{t("Secure Sign Out", "لاگ آؤٹ اور لاگ آف کریں")}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE POPUP DRAWER */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-45 bg-slate-900/40 lg:hidden"
          />

          {/* Drawer Container */}
          <div className="fixed bottom-0 top-[65px] left-0 z-50 w-64 border-r border-slate-200 bg-white py-4 shadow-xl flex flex-col justify-between lg:hidden overflow-hidden">
            
            {/* MOBILE SEGMENTED SWITCH */}
            <div className="px-3 mb-4 shrink-0 select-none">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handlePerformSwitch('st_default')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-1 text-center font-sans text-xs font-bold transition-all cursor-pointer ${
                    activeStationId === 'st_default'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Fuel className="h-3.5 w-3.5 shrink-0" />
                  <span>{t('Fuel Station', 'فیول')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePerformSwitch('st_lube')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-1 text-center font-sans text-xs font-bold transition-all cursor-pointer ${
                    activeStationId === 'st_lube'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wrench className="h-3.5 w-3.5 shrink-0" />
                  <span>{t('Lube Biz', 'لیوب')}</span>
                </button>
              </div>
            </div>

            <nav className="space-y-1 px-3 flex-1 overflow-y-auto">
              {['main', 'operations', 'analytics', 'setup', 'system'].map(sectionKey => {
                if (sectionKey === 'setup') {
                  if (isLube) return null;
                  return (
                    <div key="mobile_section_setup" className="space-y-1">
                      <div className="px-3 py-2 mt-4 flex items-center">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="px-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          {t('SETUP', 'سیٹ اپ')}
                        </span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                      </div>
                      
                      {/* DYNAMIC CONFIGURATION ACCORDION MOBILE */}
                      <button
                        onClick={() => {
                          const newExpanded = !isConfigExpanded;
                          setIsConfigExpanded(newExpanded);
                          if (newExpanded && firstIncompleteStep && !setupComplete) {
                            onViewChange(firstIncompleteStep.viewId);
                            setMobileMenuOpen(false);
                          } else if (newExpanded && setupComplete) {
                            onViewChange('setup_tanks');
                            setMobileMenuOpen(false);
                          }
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 font-sans text-sm font-medium transition-all cursor-pointer ${
                          activeView.startsWith('setup_') || activeView === 'configuration'
                            ? isLube
                              ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600'
                              : 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-600'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Settings className={`h-5 w-5 ${activeView.startsWith('setup_') || activeView === 'configuration' ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                          <div className="flex-1 text-left flex items-center justify-between pr-1">
                            <span>{t('Configuration', 'کنفیگریشن')}</span>
                            {!setupComplete && (
                              <span className="ml-2 inline-flex items-center justify-center bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                {progressPercent}%
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isConfigExpanded ? 'rotate-180' : ''} ${activeView.startsWith('setup_') || activeView === 'configuration' ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                      </button>
                      
                      {isConfigExpanded && (
                        <div className="pl-9 pr-2 space-y-1 mt-1 mb-2 animate-in slide-in-from-top-2 duration-200">
                          {steps.map(step => (
                            <ConfigSidebarItem
                              key={step.id}
                              step={step}
                              isActive={activeView === step.viewId}
                              onClick={(viewId) => {
                                onViewChange(viewId);
                                setMobileMenuOpen(false);
                              }}
                            />
                          ))}
                          <div className="mt-2 mb-1 px-2 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-around shadow-sm">
                            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                              {t('Tanks', 'ٹینک')}: <span className="text-slate-800 font-bold ml-1">{tanks.length}</span>
                            </div>
                            <div className="w-px h-3 bg-slate-200"></div>
                            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                              {t('Nozzles', 'نوزلز')}: <span className="text-slate-800 font-bold ml-1">{nozzles.length}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                const sectionItems = menuItems.filter(item => item.section === sectionKey);
                if (sectionItems.length === 0) return null;

                return (
                  <div key={`mobile_section_${sectionKey}`} className="space-y-1">
                    <div className="px-3 py-2 mt-4 flex items-center">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <span className="px-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        {t(sectionKey.toUpperCase(), sectionKey === 'main' ? 'مین' : sectionKey === 'operations' ? 'آپریشنز' : sectionKey === 'analytics' ? 'رپورٹس' : 'سسٹم')}
                      </span>
                      <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    {sectionItems.map((item) => {
                      const Icon = item.icon;
                      
                      if (item.children) {
                        const isChildActive = item.children.some(child => activeView === child.id);
                        const expanded = expandedMenus[item.id] !== undefined ? expandedMenus[item.id] : isChildActive;
                        
                        return (
                          <div key={item.id} className="space-y-1">
                            <button
                              onClick={() => setExpandedMenus(prev => ({ ...prev, [item.id]: !expanded }))}
                              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 font-sans text-sm font-medium transition-all cursor-pointer ${
                                isChildActive
                                  ? isLube
                                    ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600'
                                    : 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-600'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={`h-5 w-5 ${isChildActive ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                                <span className="flex-1 text-left">{t(item.label, item.urdu)}</span>
                              </div>
                              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''} ${isChildActive ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                            </button>
                            
                            {expanded && (
                              <div className="pl-9 pr-2 space-y-1 mt-1 mb-2 animate-in slide-in-from-top-2 duration-200">
                                {item.children.filter(child => isLube ? child.showInLube : true).map(child => {
                                  const ChildIcon = child.icon;
                                  const isChildItemActive = activeView === child.id;
                                  return (
                                    <button
                                      key={child.id}
                                      onClick={() => handleItemClick(child.id)}
                                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 font-sans text-xs font-semibold transition-all cursor-pointer ${
                                        isChildItemActive
                                          ? isLube
                                            ? 'bg-blue-50 text-blue-700 font-bold'
                                            : 'bg-orange-50 text-orange-700 font-bold'
                                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                      }`}
                                    >
                                      <ChildIcon className={`h-4 w-4 ${isChildItemActive ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                                      <span className="flex-1 text-left">{t(child.label, child.urdu)}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      const isActive = activeView === item.id || (item.id === 'configuration' && (activeView === 'settings' || activeView.startsWith('setup_')));
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm font-medium transition-all cursor-pointer ${
                            isActive
                              ? isLube
                                ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600'
                                : 'bg-orange-50 text-orange-600 font-bold border-l-4 border-orange-600'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isActive ? (isLube ? 'text-blue-600' : 'text-orange-600') : 'text-slate-400'}`} />
                          <span className="flex-1 text-left">{t(item.label, item.urdu)}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
            {onLogout && (
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="h-5 w-5 text-red-500" />
                  <span>{t("Sign Out", "لاگ آؤٹ")}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border glass py-1 shadow-lg lg:hidden">
        <div className="flex justify-around items-center">
          {menuItems.slice(0, 4).concat(menuItems.slice(-1)).map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                  isActive ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                <span className="text-[10px] sm:text-xs mt-1 leading-none">{t(item.label.split(' ')[0], item.urdu.split(' ')[0])}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* REGISTER STATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-sans text-lg font-bold text-slate-950">
                {t('Register Independent ERP Station', 'نیا آزادانہ فیول اسٹیشن درج کریں')}
              </h2>
              <button
                onClick={handleCloseAddModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Station Name (English) *', 'اسٹیشن کا نام (انگریزی) *')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Star Petroleum GT Road"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Station Name (Urdu)', 'اسٹیشن کا نام (اردو)')}
                </label>
                <input
                  type="text"
                  placeholder="مثال: اسٹار پٹرولیم جی ٹی روڈ"
                  value={formUrduName}
                  onChange={(e) => setFormUrduName(e.target.value)}
                  dir="rtl"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Address (Karachi, Multan, DHA, etc.)', 'اسٹیشن کا پتہ')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 104, Main GT Road, Lahore"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    {t('NTN Registration No.', 'این ٹی این نمبر')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NTN-4839210-9"
                    value={formNtn}
                    onChange={(e) => setFormNtn(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    {t('Owner Contact / Phone', 'رابطہ نمبر')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0300-1234567"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="rounded-lg px-4 py-2 font-sans text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('Cancel', 'منسوخ کریں')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-600 px-4 py-2 font-sans text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-xs cursor-pointer"
                >
                  {t('Create Isolated Station', 'نیا آزاد اسٹیشن بنائیں')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STATION MODAL */}
      {showEditModal && stationToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-sans text-lg font-bold text-slate-950">
                {t('Modify ERP Station Details', 'اسٹیشن کی معلومات تبدیل کریں')}
              </h2>
              <button
                onClick={handleCloseEditModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Station Name (English) *', 'اسٹیشن کا نام (انگریزی) *')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Star Petroleum GT Road"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Station Name (Urdu)', 'اسٹیشن کا نام (اردو)')}
                </label>
                <input
                  type="text"
                  placeholder="مثال: اسٹار پٹرولیم جی ٹی روڈ"
                  value={formUrduName}
                  onChange={(e) => setFormUrduName(e.target.value)}
                  dir="rtl"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  {t('Address', 'اسٹیشن کا پتہ')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 104, Main GT Road, Lahore"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    {t('NTN Registration No.', 'این ٹی این نمبر')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NTN-4839210-9"
                    value={formNtn}
                    onChange={(e) => setFormNtn(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                    {t('Owner Contact / Phone', 'رابطہ نمبر')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0300-1234567"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="rounded-lg px-4 py-2 font-sans text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {t('Cancel', 'منسوخ کریں')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-600 px-4 py-2 font-sans text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-xs cursor-pointer"
                >
                  {t('Save Changes', 'تبدیلی محفوظ کریں')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Search Result Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-indigo-600 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-100" />
                <h3 className="font-sans text-base font-bold text-white">Gemini AI Search Analysis</h3>
              </div>
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="rounded-lg p-1.5 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Query</p>
                <p className="text-sm font-semibold text-slate-800 bg-white p-3 rounded-lg border border-slate-200 mt-1">"{aiSearchQuery}"</p>
              </div>

              <div>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">AI Response</p>
                {isAiSearching ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Sparkles className="h-8 w-8 text-indigo-400 animate-spin" />
                    <p className="text-sm text-indigo-600 mt-3 font-semibold">Analyzing enterprise data...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap bg-white p-4 rounded-xl border border-indigo-100 shadow-xs">
                    {aiSearchResult}
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        settings={settings}
      />

      <AIDocumentScanner
        isOpen={isDocScannerOpen}
        onClose={() => setIsDocScannerOpen(false)}
        settings={settings}
      />
    </>
  );
}
