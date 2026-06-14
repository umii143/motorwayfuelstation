import React, { useState, useEffect } from 'react';
import { Activity, Search, Shield, Trash2, Clock } from 'lucide-react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { t as translate } from '../../../lib/translations';
import { db } from '../../../data/db';
import { AuditTrailEntry } from '../../../types';
import { useStation } from '../../../contexts/StationContext';

interface SystemAuditTrailProps {
  language: string;
  stationId: string;
}

export default function SystemAuditTrail({ language, stationId }: SystemAuditTrailProps) {
  const { showConfirm, showToast } = useStation();
  const t = (en: string, ur: string) => translate(en, ur, language);

  const [logs, setLogs] = useState<AuditTrailEntry[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  // Read logs from the active station's isolated audit ledger
  useEffect(() => {
    setLogs(db.getSettingsAuditTrail(stationId));
  }, [stationId]);

  const handleClearLogs = () => {
    showConfirm(
      t('Confirm Clearing Audit Logs', 'آڈٹ لاگ صاف کرنے کی تصدیق کریں'),
      t('Are you sure you want to permanently clear the master configuration audit trail?', 'کیا آپ واقعی باقاعدہ دفتری آڈٹ لاگ تاریخ صاف کرنا چاہتے ہیں؟'),
      () => {
        db.clearSettingsAuditTrail(stationId);
        setLogs([]);
        showToast(t('Audit logs wiped.', 'آڈٹ رکارڈ صاف کر دیا گیا ہے۔'), 'success');
      }
    );
  };

  // Filter & Search
  const filteredLogs = logs.filter(lg => {
    const matchesSearch = lg.details.toLowerCase().includes(search.toLowerCase()) || 
                          lg.action.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory ? lg.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* HEADER COMPONENT */}
      <div className="flex flex-row items-center sm:justify-between border-b pb-3 gap-2">
        <h3 className="font-sans text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-orange-655 text-orange-600" />
          <span>{t('Central System Alteration Audit Trail Ledger', 'مرکزی دفتری سسٹم آڈٹ لاگ لیجر')}</span>
        </h3>
        {logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer select-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t('Clear Audit Ledger', 'آڈٹ ریکارڈ صاف کریں')}</span>
          </button>
        )}
      </div>

      {/* FILTER BUTTONS AND SEARCH BAR */}
      <div className="flex flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder={t('Search action narrative or parameter change...', 'آڈٹ رکارڈ تلاش کریں...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-sans outline-hidden focus:border-orange-500 bg-slate-50/50"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-sans text-slate-600 outline-hidden focus:border-orange-500"
        >
          <option value="">{t('-- All Action Categories --', '-- تمام شعبے --')}</option>
          <option value="System">{t('System & Resets', 'سسٹم اور ری سیٹ')}</option>
          <option value="Tariff">{t('Tariff Rate revisions', 'قیمتوں کی تبدیلیاں')}</option>
          <option value="Tank">{t('Storage Tanks configuration', 'ٹینک پیرامیٹرز')}</option>
          <option value="Nozzle">{t('Nozzle Hardware configurations', 'نوزل ترتیبات')}</option>
          <option value="Product">{t('Products Inventory SKU', 'مصنوعات کیٹلاگ')}</option>
          <option value="Bank">{t('Traditional Banks Accounts', 'بینک کھاتہ جات')}</option>
          <option value="DigitalWallet">{t('Digital Mobile wallets', 'موبائل مرچنٹس والٹ')}</option>
        </select>
      </div>

      {/* TIMELINE LIST */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* List Header */}
          <div className="flex items-center bg-slate-50 border-b border-slate-150 text-[10px] font-bold uppercase tracking-wider text-slate-400 py-2.5 px-3">
            <div className="w-[18%] text-left">{t('Timestamp', 'طبعی وقت')}</div>
            <div className="w-[15%] text-left">{t('Category', 'شعبہ')}</div>
            <div className="w-[20%] text-left">{t('Trigger Event', 'سرگرمی')}</div>
            <div className="w-[32%] text-left">{t('Alteration Narrative Details', 'تفصیلات')}</div>
            <div className="w-[15%] text-right">{t('Authorized Operator', 'تبدیلی کا مجاز شخص')}</div>
          </div>
          
          {/* List Body */}
          <div className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-sans text-xs">
                {t('No audit trail entries found matching filter terms.', 'فلٹر قوانین کے مطابق کوئی آڈٹ ہسٹری نہیں ملی۔')}
              </div>
            ) : (
              <List
                itemCount={filteredLogs.length}
                itemSize={44}
                width="100%"
                height={Math.min(filteredLogs.length * 44, 500)}
              >
                {({ index, style }: ListChildComponentProps) => {
                  const lg = filteredLogs[index];
                  return (
                    <div style={style} className="flex items-center hover:bg-slate-50/20 text-[11px] text-slate-700 border-b border-slate-100 px-3">
                      <div className="w-[18%] flex items-center gap-1 font-mono text-slate-500 whitespace-nowrap overflow-hidden">
                        <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{lg.timestamp}</span>
                      </div>
                      <div className="w-[15%]">
                        <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight">
                          {lg.category}
                        </span>
                      </div>
                      <div className="w-[20%] font-bold text-slate-800 truncate pr-2">{lg.action}</div>
                      <div className="w-[32%] text-slate-600 truncate pr-2" title={lg.details}>{lg.details}</div>
                      <div className="w-[15%] text-right text-sm font-medium text-slate-800 truncate">{lg.user}</div>
                    </div>
                  );
                }}
              </List>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
