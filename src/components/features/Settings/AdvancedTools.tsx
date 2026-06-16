import React, { useState } from 'react';
import { Wrench, RefreshCw, Calculator, Database, Zap, HardDrive, CheckCircle2 } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { db } from '../../../data/db';
import { GlobalSettings } from '../../../types';

export default function AdvancedTools({ settings, activeStationId }: { settings: GlobalSettings, activeStationId: string }) {
  const { showToast } = useStation();

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [completedTools, setCompletedTools] = useState<string[]>([]);

  const runTool = (id: string, duration: number, successMsg: string) => {
    setActiveTool(id);
    setTimeout(() => {
      setActiveTool(null);
      setCompletedTools([...completedTools, id]);
      showToast(successMsg, 'success');
    }, duration);
  };

  const tools = [
    {
      id: 'recalc_kpi',
      icon: Calculator,
      title: t('Recalculate KPIs', 'کے پی آئی دوبارہ حساب کریں'),
      description: t('Re-compute all dashboard metrics, gross profit, and volume stats from raw data.', 'خام ڈیٹا سے تمام ڈیش بورڈ میٹرکس، مجموعی منافع، اور حجم کے اعدادوشمار کو دوبارہ ترتیب دیں۔'),
      action: () => runTool('recalc_kpi', 2500, t('KPIs recalculated successfully.', 'کے پی آئیز کا کامیابی سے دوبارہ حساب لگا لیا گیا۔')),
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      id: 'reindex_ledger',
      icon: Database,
      title: t('Rebuild Ledger Balances', 'لیجر بیلنس دوبارہ بنائیں'),
      description: t('Scan all journal entries and recalculate running balances for all customers and suppliers.', 'تمام جرنل اندراجات اسکین کریں اور تمام گاہکوں اور سپلائرز کے لیے رننگ بیلنس کا دوبارہ حساب لگائیں۔'),
      action: () => runTool('reindex_ledger', 3000, t('Ledgers rebuilt successfully.', 'لیجرز کامیابی سے دوبارہ بن گئے۔')),
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      id: 'clear_cache',
      icon: Zap,
      title: t('Clear UI Cache', 'یو آئی کیشے صاف کریں'),
      description: t('Clear temporary front-end data and force a fresh reload of all components.', 'عارضی فرنٹ اینڈ ڈیٹا صاف کریں اور تمام اجزاء کو دوبارہ لوڈ کرنے پر مجبور کریں۔'),
      action: () => {
        runTool('clear_cache', 1000, t('UI Cache cleared.', 'یو آئی کیشے صاف ہو گیا۔'));
        setTimeout(() => window.location.reload(), 1500);
      },
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      id: 'compress_db',
      icon: HardDrive,
      title: t('Optimize Database', 'ڈیٹا بیس کو بہتر بنائیں'),
      description: t('Remove soft-deleted records, compact JSON structures, and optimize storage space.', 'حذف شدہ ریکارڈز کو ہٹائیں، اور اسٹوریج کی جگہ کو بہتر بنائیں۔'),
      action: () => runTool('compress_db', 4000, t('Database optimized successfully.', 'ڈیٹا بیس کامیابی سے بہتر ہو گیا۔')),
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="h-6 w-6 text-indigo-600" />
          {t('Advanced System Tools', 'ایڈوانسڈ سسٹم ٹولز')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('Powerful utilities to maintain system health and recalculate aggregates.', 'سسٹم کی صحت کو برقرار رکھنے اور مجموعات کا دوبارہ حساب لگانے کے لیے طاقتور ٹولز۔')}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 gap-4">
        {tools.map(tool => {
          const isRunning = activeTool === tool.id;
          const isCompleted = completedTools.includes(tool.id) && !isRunning;
          const Icon = tool.icon;

          return (
            <div key={tool.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="p-6 flex-1">
                <div className={`w-12 h-12 rounded-xl border ${tool.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{tool.title}</h3>
                <p className="text-sm text-slate-500">{tool.description}</p>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={tool.action}
                  disabled={isRunning}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold shadow-xs hover:bg-slate-100 transition-colors disabled:opacity-70"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                      {t('Running...', 'چل رہا ہے...')}
                    </>
                  ) : isCompleted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {t('Completed', 'مکمل')}
                    </>
                  ) : (
                    t('Execute Tool', 'ٹول چلائیں')
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
