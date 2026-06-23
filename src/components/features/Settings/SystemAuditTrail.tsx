import React, { useState, useEffect } from 'react';
import { Search, Shield, Trash2, Clock } from 'lucide-react';
import { ResponsiveTable } from '../../shared/ResponsiveTable';
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
     
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <ResponsiveTable
        data={filteredLogs}
        columns={[
          {
            header: t('Timestamp', 'طبعی وقت'),
            accessor: (lg) => (
              <div className="flex items-center gap-1 font-mono text-slate-500">
                <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="whitespace-nowrap">{lg.timestamp}</span>
              </div>
            ),
            isSecondaryMobile: true
          },
          {
            header: t('Category', 'شعبہ'),
            accessor: (lg) => (
              <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight">
                {lg.category}
              </span>
            )
          },
          {
            header: t('Trigger Event', 'سرگرمی'),
            accessor: (lg) => (
              <span className="font-bold text-slate-800">{lg.action}</span>
            ),
            isPrimaryMobile: true
          },
          {
            header: t('Alteration Narrative Details', 'تفصیلات'),
            accessor: (lg) => (
              <span className="text-slate-600" title={lg.details}>{lg.details}</span>
            )
          },
          {
            header: t('Authorized Operator', 'تبدیلی کا مجاز شخص'),
            className: 'text-right',
            accessor: (lg) => (
              <span className="text-sm font-medium text-slate-800">{lg.user}</span>
            )
          }
        ]}
        keyExtractor={(_, idx) => idx.toString()}
        emptyMessage={t('No audit trail entries found matching filter terms.', 'فلٹر قوانین کے مطابق کوئی آڈٹ ہسٹری نہیں ملی۔')}
      />
    </div>
  );
}
