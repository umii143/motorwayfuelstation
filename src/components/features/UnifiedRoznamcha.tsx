/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise Digital Roznamcha — single source of truth.
 *
 * Consumes the Business Event Engine (not independent calculation). Supports:
 *  - Chronological Business Timeline (grouped by business date)
 *  - Full filter set: Date, Shift, Salesman, Customer, Supplier, Tank,
 *    Nozzle, Product, Invoice, Expense, Payment Method, Bank, Digital
 *    Wallet, Event Type, Severity, Module
 *  - Click any event → opens its connected Business Graph context
 */

import React, { useState, useMemo, useRef } from 'react';
import { EventEngine, EVENT_LABELS } from '../../services/eventEngine';
import { BusinessEvent, BusinessEventType, EventSeverity } from '../../types';
import { db } from '../../data/db';
import { GlobalSettings } from '../../types';
import { Search, Calendar, Filter, X, ArrowUpRight, Activity, Clock, Network, ListTree } from 'lucide-react';
import EntityDetailDrawer from '../shared/EntityDetailDrawer';
import { EntityRef } from '../../types/search.types';

interface UnifiedRoznamchaProps {
  settings: GlobalSettings;
}

const EVENT_TYPES = Object.keys(EVENT_LABELS) as BusinessEventType[];
const SEVERITIES: EventSeverity[] = ['info', 'success', 'warning', 'critical'];

const SEVERITY_STYLE: Record<EventSeverity, string> = {
  info: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  critical: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
};

const ICON: Record<string, string> = {
  SHIFT_OPENED: '🟢', SHIFT_CLOSED: '🔴', SHIFT_FINALIZED: '🔴', SALE_CREATED: '⛽', SALE_VOIDED: '🚫',
  LUBE_SALE_CREATED: '🛢️', CUSTOMER_CREATED: '👤', CUSTOMER_UPDATED: '👤', SUPPLIER_PAYMENT: '🚚',
  PRICE_CHANGED: '💱', BANK_DEPOSIT: '🏦', DIGITAL_PAYMENT: '📱', EXPENSE_ADDED: '🧾', EXPENSE_APPROVED: '✅',
  TANK_DELIVERY: '🛢️', TANK_DIP: '📏', NOZZLE_READING: '⛽', METER_READING: '🔧', INVENTORY_ADJUSTMENT: '📦',
  STOCK_TRANSFER: '🔁', PRODUCT_CREATED: '➕', PRODUCT_UPDATED: '✏️', CREDIT_SALE: '📝', RECOVERY_RECEIVED: '💵',
  CASH_DEPOSIT: '💰', JOURNAL_ENTRY: '📓', LOGIN: '🔐', PERMISSION_CHANGED: '🔑', SETTINGS_CHANGED: '⚙️',
  BACKUP_CREATED: '💾', REPORT_EXPORTED: '📤', METER_RESET: '🛠️'
};

export default function UnifiedRoznamcha({ settings }: UnifiedRoznamchaProps) {
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const activeStationId = db.getActiveStationId();
  const allEvents = useMemo<BusinessEvent[]>(
    () => EventEngine.list(activeStationId).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [activeStationId]
  );

  // Lookup helper stores for filters
  const lookups = useMemo(() => {
    const customers = db.getCustomers(activeStationId);
    const suppliers = db.getSuppliers(activeStationId);
    const tanks = db.getTanks(activeStationId);
    const nozzles = db.getNozzles(activeStationId);
    const products = db.getProducts(activeStationId);
    const shifts = db.getShifts(activeStationId);
    const staff = db.getStaffList(activeStationId);
    const banks = db.getBankAccounts(activeStationId);
    const digital = db.getDigitalAccounts(activeStationId);
    return { customers, suppliers, tanks, nozzles, products, shifts, staff, banks, digital };
  }, [activeStationId]);

  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState<string>('all');
  const [severity, setSeverity] = useState<string>('all');
  const [module, setModule] = useState<string>('all');
  const [shiftId, setShiftId] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BusinessEvent | null>(null);
  const [entityRef, setEntityRef] = useState<EntityRef | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allEvents.filter(e => {
      if (eventType !== 'all' && e.eventType !== eventType) return false;
      if (severity !== 'all' && e.severity !== severity) return false;
      if (module !== 'all' && e.module !== module) return false;
      if (shiftId !== 'all' && (e.shiftId || 'none') !== shiftId) return false;
      if (startDate && e.businessDate < startDate) return false;
      if (endDate && e.businessDate > endDate) return false;
      if (e.timestamp < startDate && startDate) return false;
      if (e.timestamp > endDate + ' 23:59:59' && endDate) return false;
      if (entityFilter !== 'all') {
        const match = e.entity?.kind === entityFilter ||
          (e.relatedEntities || []).some(r => r.kind === entityFilter);
        if (!match) return false;
      }
      if (q) {
        const hay = `${e.summary} ${e.eventType} ${e.userName} ${e.referenceNumber || ''} ${e.module}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allEvents, eventType, severity, module, shiftId, entityFilter, startDate, endDate, search]);

  // Group by business date for timeline
  const groupedByDate = useMemo(() => {
    const map: Record<string, BusinessEvent[]> = {};
    filtered.forEach(e => {
      const d = e.businessDate || e.timestamp.slice(0, 10);
      (map[d] = map[d] || []).push(e);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const modules = useMemo(() => Array.from(new Set(allEvents.map(e => e.module))).sort(), [allEvents]);

  const openEvent = (e: BusinessEvent) => {
    setSelectedEvent(e);
    if (e.entity) setEntityRef({ kind: e.entity.kind as any, id: e.entity.id });
  };

  const entityLabel = (kind: string) =>
    ({ customer: t('Customer', 'گاہک'), supplier: t('Supplier', 'سپلائر'), shift: t('Shift', 'شفٹ'), product: t('Product', 'پراڈکٹ'), tank: t('Tank', 'ٹینک'), nozzle: t('Nozzle', 'نوزل'), invoice: t('Invoice', 'انوائس'), payment: t('Payment', 'ادائیگی'), expense: t('Expense', 'خرچ'), staff: t('Staff', 'اسٹاف'), batch: t('Batch', 'batches') } as any)[kind] || kind;

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151521] p-5 shadow-xs">
        <h3 className="font-sans text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600" />
          {t('Enterprise Digital Roznamcha (Business Event Platform)', 'انٹرپرائز ڈیجیٹل روزنامچہ (بزنس ایونٹ پلیٹ فارم)')}
        </h3>
        <p className="font-sans text-xs text-slate-500 mt-1">
          {t('Single source of truth for every operation. Every action emits a standardized business event linked to the Business Graph.', 'ہر آپریشن کا سنگل سورس آف ٹروتھ۔ ہر عمل ایک اسٹینڈرڈ ایونٹ جاری کرتا ہے جو بزنس گراف سے جڑا ہوتا ہے۔')}
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-[#151521] border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search events, users, references...', 'ایونٹس، صارفین، ریفرنس تلاش کریں...')}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(f => !f)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border ${showFilters ? 'border-orange-500 text-orange-600' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
              <Filter className="w-3.5 h-3.5" /> {t('Filters', 'فلٹرز')}
            </button>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
              <button onClick={() => setViewMode('timeline')} className={`px-3 py-2 text-xs font-bold flex items-center gap-1 ${viewMode === 'timeline' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}><Clock className="w-3.5 h-3.5" /> {t('Timeline', 'ٹائم لائن')}</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-xs font-bold flex items-center gap-1 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}><ListTree className="w-3.5 h-3.5" /> {t('List', 'لسٹ')}</button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
            <Sel label={t('Event Type', 'ایونٹ ٹائپ')} value={eventType} onChange={setEventType} options={[{ v: 'all', l: t('All', 'تمام') }, ...EVENT_TYPES.map(x => ({ v: x, l: EVENT_LABELS[x] }))]} />
            <Sel label={t('Severity', 'شدت')} value={severity} onChange={setSeverity} options={[{ v: 'all', l: t('All', 'تمام') }, ...SEVERITIES.map(x => ({ v: x, l: x }))]} />
            <Sel label={t('Module', 'ماڈیول')} value={module} onChange={setModule} options={[{ v: 'all', l: t('All', 'تمام') }, ...modules.map(x => ({ v: x, l: x }))]} />
            <Sel label={t('Shift', 'شفٹ')} value={shiftId} onChange={setShiftId} options={[{ v: 'all', l: t('All', 'تمام') }, ...lookups.shifts.map(s => ({ v: s.id, l: `#${s.id}` }))]} />
            <Sel label={t('Entity', 'اینٹیٹی')} value={entityFilter} onChange={setEntityFilter} options={[{ v: 'all', l: t('All', 'تمام') }, { v: 'customer', l: t('Customer', 'گاہک') }, { v: 'supplier', l: t('Supplier', 'سپلائر') }, { v: 'tank', l: t('Tank', 'ٹینک') }, { v: 'nozzle', l: t('Nozzle', 'نوزل') }, { v: 'product', l: t('Product', 'پراڈکٹ') }, { v: 'invoice', l: t('Invoice', 'انوائس') }, { v: 'shift', l: t('Shift', 'شفٹ') }]} />
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{t('From', 'سے')}</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151521] px-2 py-1.5 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{t('To', 'تک')}</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151521] px-2 py-1.5 text-xs" />
            </div>
            <div className="col-span-2 flex items-end">
              <button onClick={() => { setEventType('all'); setSeverity('all'); setModule('all'); setShiftId('all'); setEntityFilter('all'); setStartDate(''); setEndDate(''); setSearch(''); }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg">
                <X className="w-3.5 h-3.5" /> {t('Clear all', 'صاف کریں')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Count */}
      <div className="text-xs font-bold text-slate-400 px-1">
        {filtered.length} {t('events', 'ایونٹس')}
      </div>

      {/* Timeline / List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 font-sans text-sm gap-2">
          <Activity className="w-10 h-10 opacity-30" />
          {t('No business events recorded (yet). Operations will emit events automatically.', 'ابھی کوئی بزنس ایونٹ ریکارڈ نہیں ہوا۔ آپریشنز خودکار ایونٹ جاری کریں گے۔')}
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-6">
          {groupedByDate.map(([date, evs]) => (
            <div key={date} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151521] overflow-hidden shadow-xs">
              <div className="bg-slate-50 dark:bg-white/5 px-4 py-2 font-bold text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 border-b border-slate-100 dark:border-white/5">
                <Calendar className="w-4 h-4 text-orange-500" /> {date} <span className="text-slate-400 font-normal">({evs.length})</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {evs.map(e => <EventRow key={e.id} e={e} onClick={() => openEvent(e)} t={t} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151521] overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {filtered.map(e => <EventRow key={e.id} e={e} onClick={() => openEvent(e)} t={t} />)}
          </div>
        </div>
      )}

      {/* Event detail + graph drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className="relative w-full max-w-md h-screen flex flex-col bg-white dark:bg-[#151521] border-l border-slate-200 dark:border-white/10 shadow-2xl">
            <div className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-5 bg-slate-50 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ICON[selectedEvent.eventType] || '📌'}</span>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">{EVENT_LABELS[selectedEvent.eventType]}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{selectedEvent.timestamp}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-semibold">
              <div className={`rounded-lg px-3 py-2 ${SEVERITY_STYLE[selectedEvent.severity]}`}>
                <span className="font-bold">{selectedEvent.severity.toUpperCase()}</span> • {selectedEvent.module}
              </div>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{selectedEvent.summary}</p>
              <Detail label={t('User', 'صارف')} value={`${selectedEvent.userName} (${selectedEvent.userRole})`} />
              <Detail label={t('Shift', 'شفٹ')} value={selectedEvent.shiftId || '—'} />
              <Detail label={t('Reference', 'ریفرنس')} value={selectedEvent.referenceNumber || '—'} />
              <Detail label={t('Amount', 'رقم')} value={selectedEvent.amount !== undefined ? selectedEvent.amount.toLocaleString() : '—'} />
              {selectedEvent.entity && <Detail label={t('Primary Entity', 'اہم اینٹیٹی')} value={`${entityLabel(selectedEvent.entity.kind)}: ${selectedEvent.entity.label || selectedEvent.entity.id}`} />}
              {selectedEvent.relatedEntities && selectedEvent.relatedEntities.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{t('Related Entities', 'متعلقہ اینٹیٹیز')}</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedEvent.relatedEntities.map((r, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold">{entityLabel(r.kind)}</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedEvent.tags.map((tg, i) => <span key={i} className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-500/10 text-[10px] font-bold">#{tg}</span>)}
                </div>
              )}
              <button
                onClick={() => selectedEvent.entity && setEntityRef({ kind: selectedEvent.entity.kind as any, id: selectedEvent.entity.id })}
                disabled={!selectedEvent.entity}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold py-2.5 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Network className="w-4 h-4" /> {t('Open connected Business Graph', 'کنیکٹڈ بزنس گراف کھولیں')}
              </button>
            </div>
          </div>
        </div>
      )}

      {entityRef && (
        <EntityDetailDrawer
          entity={entityRef}
          onClose={() => setEntityRef(null)}
          onNavigateModule={() => setEntityRef(null)}
          onReanchor={(ref) => setEntityRef(ref)}
        />
      )}
    </div>
  );
}

function EventRow({ e, onClick, t }: { e: BusinessEvent; onClick: () => void; t: (en: string, ur: string) => string }) {
  return (
    <button onClick={onClick} className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-orange-50/10 dark:hover:bg-white/5 transition-colors">
      <span className="text-lg mt-0.5 shrink-0">{ICON[e.eventType] || '📌'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{e.summary}</span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${SEVERITY_STYLE[e.severity]}`}>{e.severity}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
          <span>{e.timestamp.slice(11)}</span>
          <span>•</span>
          <span className="font-semibold">{e.userName}</span>
          <span>•</span>
          <span className="capitalize">{e.module}</span>
          {e.shiftId && <><span>•</span><span>Shift #{e.shiftId}</span></>}
        </div>
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-1.5">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono font-bold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151521] px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}
