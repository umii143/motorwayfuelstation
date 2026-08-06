import React from 'react';
import { Fuel, DollarSign, Clock, AlertTriangle, TrendingUp, ShieldCheck, Activity, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../../../lib/currency';

interface PricingHeaderKPIsProps {
  isUrdu: boolean;
  petrolPrice: number;
  dieselPrice: number;
  cngPrice?: number;
  avgMargin: number;
  changesToday: number;
  estimatedRevaluation: number;
  pendingApprovals?: number;
  nextUpdateDate: string;
  onSelectKPI?: (kpiId: string) => void;
}

export const PricingHeaderKPIs: React.FC<PricingHeaderKPIsProps> = ({
  isUrdu,
  petrolPrice,
  dieselPrice,
  avgMargin,
  changesToday,
  estimatedRevaluation,
  nextUpdateDate,
  onSelectKPI
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const handleCardClick = (id: string) => {
    if (onSelectKPI) onSelectKPI(id);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
      {/* 1. PRC-001: Current Petrol Rate */}
      <div 
        onClick={() => handleCardClick('PRC-001')}
        className="bg-card border border-border hover:border-primary/50 cursor-pointer transition-all rounded-xl p-3.5 shadow-sm text-foreground group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider group-hover:text-primary">
            [PRC-001] {t('Current Petrol Rate', 'موجودہ پیٹرول ریٹ')}
          </span>
          <Fuel className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="text-xl font-black font-mono">{formatCurrency(petrolPrice || 272.15)}</div>
        <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5 mt-1">
          ▲ OGRA Active
        </span>
      </div>

      {/* 2. PRC-002: Current Diesel Rate */}
      <div 
        onClick={() => handleCardClick('PRC-002')}
        className="bg-card border border-border hover:border-primary/50 cursor-pointer transition-all rounded-xl p-3.5 shadow-sm text-foreground group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider group-hover:text-primary">
            [PRC-002] {t('Current Diesel Rate', 'موجودہ ڈیزل ریٹ')}
          </span>
          <Fuel className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="text-xl font-black font-mono">{formatCurrency(dieselPrice || 294.80)}</div>
        <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5 mt-1">
          ▲ OGRA Active
        </span>
      </div>

      {/* 3. PRC-003: Current Dealer Margin */}
      <div 
        onClick={() => handleCardClick('PRC-003')}
        className="bg-card border border-border hover:border-primary/50 cursor-pointer transition-all rounded-xl p-3.5 shadow-sm text-foreground group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider group-hover:text-primary">
            [PRC-003] {t('Dealer Margin', 'ڈیلر مارجن')}
          </span>
          <DollarSign className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="text-xl font-black text-amber-600 font-mono">₨ 8.64 <span className="text-[10px]">/L</span></div>
        <span className="text-[10px] text-muted-foreground font-semibold">Fixed OMC Margin</span>
      </div>

      {/* 4. PRC-004: Current Landed Cost */}
      <div 
        onClick={() => handleCardClick('PRC-004')}
        className="bg-card border border-border hover:border-primary/50 cursor-pointer transition-all rounded-xl p-3.5 shadow-sm text-foreground group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider group-hover:text-primary">
            [PRC-004] {t('Landed Cost', 'لینڈڈ لاگت')}
          </span>
          <BarChart3 className="w-3.5 h-3.5 text-sky-500" />
        </div>
        <div className="text-xl font-black font-mono">₨ 263.51 <span className="text-[10px]">/L</span></div>
        <span className="text-[10px] text-sky-600 font-semibold">Base + Logistics</span>
      </div>

      {/* 5. PRC-005: Inventory Revaluation */}
      <div 
        onClick={() => handleCardClick('PRC-005')}
        className="bg-card border border-border hover:border-primary/50 cursor-pointer transition-all rounded-xl p-3.5 shadow-sm text-foreground group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider group-hover:text-primary">
            [PRC-005] {t('Revaluation Gain', 'اسٹاک ری ویلیوایشن')}
          </span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="text-lg font-black text-emerald-600 font-mono">+{formatCurrency(estimatedRevaluation || 145000)}</div>
        <span className="text-[10px] text-emerald-600 font-semibold">Register Active</span>
      </div>

      {/* 6. PRC-006: Today's Gross Profit */}
      <div 
        onClick={() => handleCardClick('PRC-006')}
        className="bg-card border border-border hover:border-primary/50 cursor-pointer transition-all rounded-xl p-3.5 shadow-sm text-foreground group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider group-hover:text-primary">
            [PRC-006] {t("Today's Gross Profit", 'آج کا مجموعی منافع')}
          </span>
          <Activity className="w-3.5 h-3.5 text-purple-500" />
        </div>
        <div className="text-lg font-black text-purple-600 font-mono">₨ 44,928</div>
        <span className="text-[10px] text-purple-600 font-semibold">Margin x Liters</span>
      </div>

      {/* 7. PRC-007: Upcoming Revision */}
      <div 
        onClick={() => handleCardClick('PRC-007')}
        className="bg-card border border-border hover:border-primary/50 cursor-pointer transition-all rounded-xl p-3.5 shadow-sm text-foreground group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider group-hover:text-primary">
            [PRC-007] {t('Upcoming Revision', 'اگلی تبدیلی')}
          </span>
          <Clock className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="text-sm font-black text-amber-600 font-mono mt-1">{nextUpdateDate || '15 Aug 2026'}</div>
        <span className="text-[10px] text-amber-600 font-semibold">Fortnightly OGRA</span>
      </div>

      {/* 8. PRC-008: Active Price Version */}
      <div 
        onClick={() => handleCardClick('PRC-008')}
        className="bg-card border border-border hover:border-primary/50 cursor-pointer transition-all rounded-xl p-3.5 shadow-sm text-foreground group"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider group-hover:text-primary">
            [PRC-008] {t('Price Version', 'قیمت ورژن')}
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="text-xl font-black text-primary font-mono">v21.0</div>
        <span className="text-[10px] text-primary font-semibold">Published & Locked</span>
      </div>
    </div>
  );
};
