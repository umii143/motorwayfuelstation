import React, { useMemo, useState, useEffect } from 'react';
import { useShiftStore } from '../../../stores/useShiftStore';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useCustomerStore } from '../../../stores/useCustomerStore';
import { useStationStore } from '../../../stores/useStationStore';
import { useStaffStore } from '../../../stores/useStaffStore';
import { forecastFuelDemand } from '../../../services/analytics/demandForecastEngine';
import { AlertTriangle, AlertOctagon, TrendingDown, BrainCircuit, Sparkles, Activity, CheckCircle2, Truck, MessageSquareWarning, Search } from 'lucide-react';
import RoleGuard from '../../ui/RoleGuard';
import { aiAssistantService } from '../../../services/aiAssistantService';

export const RiskCenter: React.FC = () => {
  const shifts = useShiftStore((state) => state.shifts);
  const products = useInventoryStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);
  const tanks = useInventoryStore((state) => state.tanks);
  const nozzles = useInventoryStore((state) => state.nozzles);
  const activeStationId = useStationStore((state) => state.activeStationId);
  const staff = useStaffStore((state) => state.staff);
  const settings = useStationStore((state) => state.settings);

  const isUrdu = settings?.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const forecasts = useMemo(() => forecastFuelDemand(shifts, tanks, nozzles, activeStationId), [shifts, tanks, nozzles, activeStationId]);

  const inventoryRisks = forecasts.filter(f => f.stockCoverageDays < 3);
  const financialRisks = customers.filter(c => (c.balance || 0) > (c.creditLimit || 50000) * 0.8); // High exposure is >80% of limit
  const operationalRisks = shifts.filter(s => s.cashVariance && Math.abs(s.cashVariance) > 5000);

  const [aiInsight, setAiInsight] = useState<string>(t('Initializing deep network scan...', 'گہرے نیٹ ورک اسکین کا آغاز کیا جا رہا ہے...'));
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);

  // Deterministic scanning animation
  useEffect(() => {
    let progress = 0;
    const step = 8; // completes in ~1.25s
    const interval = setInterval(() => {
      progress += step;
      if (progress >= 100) { progress = 100; clearInterval(interval); }
      setScanProgress(progress);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const analyzeRisks = async () => {
      setIsAnalyzing(true);
      try {
        const prompt = `Analyze the following station risks and provide ONE short, urgent, and strategic sentence of advice for the station owner.
        Inventory Risks: ${inventoryRisks.length} tanks critical.
        Financial Risks: ${financialRisks.length} high-exposure customers.
        Operational Risks: ${operationalRisks.length} shifts with massive variance.`;
        
        const response = await aiAssistantService.askQuestion(prompt, null, 'chat');
        setAiInsight(response.rawResponse.replace(/⚡ Powered by Umar Ali ⚡/g, '').trim());
      } catch (e) {
        setAiInsight(t('Immediate attention required on critical inventory and financial exposures. System recommends halting credit lines.', 'اہم اسٹاک اور مالیاتی بقایا جات پر فوری توجہ درکار ہے۔ سسٹم ادھار لائنوں کو معطل کرنے کی سفارش کرتا ہے۔'));
      } finally {
        setIsAnalyzing(false);
      }
    };
    
    if (inventoryRisks.length > 0 || financialRisks.length > 0 || operationalRisks.length > 0) {
      analyzeRisks();
    } else {
      setAiInsight(t('All systems stable. Predictor engine shows zero immediate enterprise vulnerabilities. Keep it up.', 'تمام سسٹمز مستحکم ہیں۔ پیش گوئی انجن کے مطابق کوئی فوری خطرہ نہیں ہے۔ اسے برقرار رکھیں۔'));
      setIsAnalyzing(false);
    }
  }, [inventoryRisks.length, financialRisks.length, operationalRisks.length]);

  const totalRisks = inventoryRisks.length + financialRisks.length + operationalRisks.length;
  const riskScore = Math.max(0, 100 - (totalRisks * 12)); // Arbitrary health score

  return (
    <RoleGuard allowedRoles={['Owner', 'Manager']} fallbackMessage={t('Risk Center is restricted to Owners and Managers.', 'رسک سینٹر تک رسائی صرف مالکان اور مینیجرز کے لیے مخصوص ہے۔')}>
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              {t('Risk Center', 'رسک سینٹر')}
              {totalRisks > 0 ? (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              ) : (
                <span className="flex h-3 w-3 relative">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              {t('Enterprise vulnerability and predictive anomaly detection', 'انٹرپرائز کی کمزوریوں اور پیش گوئی کی خرابیوں کا پتہ لگانا')}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="premium-card bg-white dark:bg-[#151521] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('Enterprise Health', 'انٹرپرائز ہیلتھ')}</p>
                <p className={`text-lg font-black ${riskScore < 50 ? 'text-red-600' : riskScore < 80 ? 'text-orange-500' : 'text-emerald-600'}`}>
                  {riskScore}/100
                </p>
              </div>
              <div className={`p-2 rounded-lg ${riskScore < 50 ? 'bg-red-50 dark:bg-red-500/10 text-red-600' : riskScore < 80 ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'}`}>
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Realtime Insight Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-1 shadow-xl relative overflow-hidden">
          <div className="bg-slate-900 rounded-xl p-6 relative z-10 h-full">
            <div className="absolute -right-4 -top-4 opacity-5">
              <BrainCircuit className="w-48 h-48" />
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-base font-bold text-indigo-400 tracking-wide uppercase">
                    {t('Sentinel AI Analysis', 'سینٹینل اے آئی تجزیہ')}
                  </h3>
                  {isAnalyzing && (
                    <span className="text-xs font-mono text-indigo-300/70 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {t('Processing', 'پروسیسنگ')} {Math.floor(scanProgress)}%
                    </span>
                  )}
                </div>
                <p className="text-slate-100 text-lg font-medium leading-relaxed max-w-4xl">
                  {aiInsight}
                </p>
              </div>
              {totalRisks > 0 && (
                <div className="hidden md:flex flex-col items-center justify-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <span className="text-3xl font-black text-red-400">{totalRisks}</span>
                  <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest">{t('Active Alerts', 'فعال الرٹس')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Inventory Risk Card */}
          <div className="bg-white dark:bg-[#151521] rounded-2xl shadow-md border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-[#151521] border-b border-orange-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">{t('Inventory Risks', 'اسٹاک کے خطرات')}</h3>
                  <p className="text-xs font-semibold text-slate-500">{inventoryRisks.length} {t('Critical Tanks', 'نازک ٹینک')}</p>
                </div>
              </div>
            </div>
            
            <div className="p-5 flex-1 space-y-6 bg-slate-50 dark:bg-white/5">
              {inventoryRisks.map(r => (
                <div key={r.tankId} className="premium-card bg-white dark:bg-[#1A1A24] p-4 border border-slate-200 dark:border-white/5 rounded-2xl relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-sm font-black text-slate-900 dark:text-white block">{r.tankName}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{r.productId}</span>
                    </div>
                    <span className="bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-xs font-black px-2 py-1 rounded-md border border-orange-200 dark:border-orange-500/30">
                      {r.stockCoverageDays} {t('Days Left', 'دن باقی')}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">{t('Volume', 'حجم')}</span>
                      <span className="text-slate-900 dark:text-white">{r.currentStock?.toLocaleString()} L</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500" 
                        style={{ width: `${Math.max(5, (r.currentStock / (Number(tanks.find(t => t.id === r.tankId)?.capacity) || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer">
                    <Truck className="h-4 w-4" />
                    {t('Auto-Draft Purchase Order', 'خودکار آرڈر بنائیں')}
                  </button>
                </div>
              ))}

              {inventoryRisks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-8">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{t('Stock Levels Optimal', 'اسٹاک بہترین ہے')}</p>
                    <p className="text-xs text-slate-500 font-medium">{t('Predictive engine shows no stockouts.', 'کوئی اسٹاک ختم ہونے کا خطرہ نہیں ہے۔')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Risk Card */}
          <div className="bg-white dark:bg-[#151521] rounded-2xl shadow-md border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-red-50 to-white dark:from-red-950/20 dark:to-[#151521] border-b border-red-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg text-red-600">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">{t('Financial Risks', 'مالیاتی خطرات')}</h3>
                  <p className="text-xs font-semibold text-slate-500">{financialRisks.length} {t('High Exposures', 'زیادہ ادھار')}</p>
                </div>
              </div>
            </div>
            
            <div className="p-5 flex-1 space-y-6 bg-slate-50 dark:bg-white/5">
              {financialRisks.map(c => {
                const limit = c.creditLimit || 50000;
                const balance = c.balance || 0;
                const utilization = Math.min(100, (balance / limit) * 100);
                
                return (
                  <div key={c.id} className="premium-card bg-white dark:bg-[#1A1A24] p-4 border border-slate-200 dark:border-white/5 rounded-2xl relative overflow-hidden hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-sm font-black text-slate-900 dark:text-white block truncate max-w-[150px]">{c.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('Corporate', 'کارپوریٹ')}</span>
                      </div>
                      <span className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-black px-2 py-1 rounded-md border border-red-200 dark:border-red-500/30">
                        {utilization.toFixed(0)}% {t('Limit', 'حد')}
                      </span>
                    </div>
                    
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">{t('Balance', 'بقایا')}</span>
                        <span className="text-red-600 dark:text-red-400">{balance.toLocaleString()} PKR</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${utilization >= 100 ? 'bg-red-600 animate-pulse' : 'bg-red-400'}`}
                          style={{ width: `${utilization}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                        <span>{t('Limit:', 'حد:')} {limit.toLocaleString()}</span>
                      </div>
                    </div>

                    <button className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 border border-red-200 dark:border-red-500/30 text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer">
                      <MessageSquareWarning className="h-4 w-4" />
                      {t('Send WhatsApp Alert', 'واٹس ایپ الرٹ بھیجیں')}
                    </button>
                  </div>
                );
              })}

              {financialRisks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-8">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{t('Credit Health Strong', 'ادھار کی صورتحال مضبوط ہے')}</p>
                    <p className="text-xs text-slate-500 font-medium">{t('No customers exceeding exposure limits.', 'کوئی گاہک ادھار کی حد سے تجاوز نہیں کر رہا۔')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Operational Risk Card */}
          <div className="bg-white dark:bg-[#151521] rounded-2xl shadow-md border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/20 dark:to-[#151521] border-b border-purple-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg text-purple-600">
                  <AlertOctagon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">{t('Operational Risks', 'آپریشنل خطرات')}</h3>
                  <p className="text-xs font-semibold text-slate-500">{operationalRisks.length} {t('Anomalies', 'غیر معمولی تبدیلیاں')}</p>
                </div>
              </div>
            </div>
            
            <div className="p-5 flex-1 space-y-6 bg-slate-50 dark:bg-white/5">
              {operationalRisks.map(s => (
                <div key={s.id} className="premium-card bg-white dark:bg-[#1A1A24] p-4 border border-slate-200 dark:border-white/5 rounded-2xl relative overflow-hidden hover:shadow-md transition-shadow">
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-sm font-black text-slate-900 dark:text-white block">{t('Shift #', 'شفٹ #')}{s.id.slice(0, 6)}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.date}</span>
                    </div>
                    <span className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs font-black px-2 py-1 rounded-md border border-purple-200 dark:border-purple-500/30">
                      {t('Unresolved', 'غیر حل شدہ')}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3 mb-4 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-500">{t('Operator', 'آپریٹر')}</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{staff?.find(st => st.id === s.staffId)?.name || s.staffId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">{t('Variance', 'فرق')}</span>
                      <span className="text-xs font-black text-purple-600">{s.cashVariance?.toLocaleString()} PKR</span>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100 border border-purple-200 dark:border-purple-500/30 text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer">
                    <Search className="h-4 w-4" />
                    {t('Request Immediate Audit', 'فوری آڈٹ کی درخواست کریں')}
                  </button>
                </div>
              ))}

              {operationalRisks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-8">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{t('Operations Secure', 'آپریشنز محفوظ ہیں')}</p>
                    <p className="text-xs text-slate-500 font-medium">{t('All recent shifts settled within variance limits.', 'حالیہ تمام شفٹوں کا تصفیہ فرق کی حد کے اندر ہوا ہے۔')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </RoleGuard>
  );
};

export default RiskCenter;
