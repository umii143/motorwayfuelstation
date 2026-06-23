import React, { useState } from 'react';
import { Bell, Save, MessageSquare, Mail, AlertTriangle, TrendingDown, Zap, Phone } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { GlobalSettings } from '../../../types';

interface NotificationToggleProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

function NotificationToggle({ icon: Icon, iconColor, title, description, checked, onChange }: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
          checked ? 'bg-indigo-600' : 'bg-slate-200'
        }`}
        aria-checked={checked}
        role="switch"
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}

export default function NotificationsConfig({
  settings,
  onUpdateSettings,
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activeStationId,
}: {
  settings: GlobalSettings;
  onUpdateSettings: (s: GlobalSettings) => void;
  activeStationId: string;
}) {
  const { showToast } = useStation();
  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);
  

  const saved = (settings as any).notifications ?? { /* empty */ };

  const [notif, setNotif] = useState({
    shiftClose:      saved.shiftClose      ?? true,
    lowStock:        saved.lowStock        ?? true,
    largeTxn:        saved.largeTxn        ?? false,
    dailyReport:     saved.dailyReport     ?? true,
    creditOverdue:   saved.creditOverdue   ?? true,
    priceChange:     saved.priceChange     ?? false,
    whatsappEnabled: saved.whatsappEnabled ?? false,
    whatsappNumber:  saved.whatsappNumber  ?? (settings.ownerContact || ''),
   
  });

  const set = (key: keyof typeof notif, val: unknown) =>
    setNotif(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    onUpdateSettings({
      ...settings,
      notifications: { ...notif },
    } as GlobalSettings);
    showToast(t('Notification preferences saved.', 'اطلاعات کی ترجیحات محفوظ ہو گئیں۔'), 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="h-5 w-5 text-indigo-600" />
          {t('Notifications', 'اطلاعات')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('Configure in-app alerts and delivery channels for important events.', 'اہم واقعات کے لیے اپلیکیشن الرٹ اور ترسیل کے ذرائع مرتب کریں۔')}
        </p>
      </div>

      {/* Shift Alerts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            {t('Shift Alerts', 'شفٹ الرٹس')}
          </span>
        </div>
        <div className="px-5 divide-y divide-slate-100">
          <NotificationToggle
            icon={MessageSquare}
            iconColor="bg-emerald-50 text-emerald-600"
            title={t('Shift Close Summary', 'شفٹ بند خلاصہ')}
            description={t('Notify when a shift is closed with summary of sales.', 'شفٹ بند ہونے پر خلاصہ نوٹیفکیشن بھیجیں۔')}
            checked={notif.shiftClose}
            onChange={v => set('shiftClose', v)}
          />
        </div>
      </div>

      {/* Stock & Price Alerts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            {t('Stock & Price Alerts', 'اسٹاک اور قیمت الرٹس')}
          </span>
        </div>
        <div className="px-5 divide-y divide-slate-100">
          <NotificationToggle
            icon={TrendingDown}
            iconColor="bg-rose-50 text-rose-600"
            title={t('Low Stock Warnings', 'کم اسٹاک کی انتباہ')}
            description={t('Alert when fuel or product stock falls below the reorder level.', 'ایندھن یا پروڈکٹ کا اسٹاک دوبارہ آرڈر کی سطح سے نیچے آنے پر الرٹ کریں۔')}
            checked={notif.lowStock}
            onChange={v => set('lowStock', v)}
          />
          <NotificationToggle
            icon={Zap}
            iconColor="bg-amber-50 text-amber-600"
            title={t('Price Change Notifications', 'قیمت تبدیلی اطلاع')}
            description={t('Alert all staff whenever fuel prices are updated.', 'ایندھن کی قیمت تبدیل ہونے پر تمام اسٹاف کو مطلع کریں۔')}
            checked={notif.priceChange}
            onChange={v => set('priceChange', v)}
          />
        </div>
      </div>

      {/* Financial Alerts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            {t('Financial Alerts', 'مالیاتی الرٹس')}
          </span>
        </div>
        <div className="px-5 divide-y divide-slate-100">
          <NotificationToggle
            icon={AlertTriangle}
            iconColor="bg-orange-50 text-orange-600"
            title={t('Large Transaction Alert', 'بڑے لین دین کی اطلاع')}
            description={t('Flag unusually high single transactions for review.', 'غیر معمولی بڑے واحد لین دین کو جائزے کے لیے نشان زد کریں۔')}
            checked={notif.largeTxn}
            onChange={v => set('largeTxn', v)}
          />
          <NotificationToggle
            icon={Bell}
            iconColor="bg-blue-50 text-blue-600"
            title={t('Overdue Credit Warnings', 'زائد المیعاد ادھار انتباہ')}
            description={t('Remind when customer credit exceeds the agreed credit limit.', 'جب کسٹمر کا ادھار متفقہ حد سے تجاوز کرے تو یاددہانی کریں۔')}
            checked={notif.creditOverdue}
            onChange={v => set('creditOverdue', v)}
          />
          <NotificationToggle
            icon={Mail}
            iconColor="bg-indigo-50 text-indigo-600"
            title={t('Daily EOD Report', 'روزانہ اختتامی رپورٹ')}
            description={t('Automatically generate and send End of Day summary report.', 'روزانہ اختتامی خلاصہ رپورٹ خودکار تیار اور بھیجیں۔')}
            checked={notif.dailyReport}
            onChange={v => set('dailyReport', v)}
          />
        </div>
      </div>

      {/* WhatsApp Delivery */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            {t('Delivery Channel', 'ترسیل کا ذریعہ')}
          </span>
        </div>
        <div className="px-5 divide-y divide-slate-100">
          <NotificationToggle
            icon={Phone}
            iconColor="bg-emerald-50 text-emerald-600"
            title={t('WhatsApp Notifications', 'واٹس ایپ اطلاعات')}
            description={t('Send alert summaries via WhatsApp to the owner number below.', 'نیچے دیے گئے نمبر پر واٹس ایپ کے ذریعے الرٹ خلاصے بھیجیں۔')}
            checked={notif.whatsappEnabled}
            onChange={v => set('whatsappEnabled', v)}
          />
        </div>
        {notif.whatsappEnabled && (
          <div className="px-5 pb-5 pt-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t('WhatsApp Number (with country code)', 'واٹس ایپ نمبر (کنٹری کوڈ کے ساتھ)')}
            </label>
            <input
              type="tel"
              placeholder="+92 300 1234567"
              value={notif.whatsappNumber}
              onChange={e => set('whatsappNumber', e.target.value)}
              className="w-full max-w-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              {t('Requires WhatsApp Business API or bot integration', 'واٹس ایپ بزنس API یا بوٹ انضمام ضروری ہے')}
            </p>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {t('Save Preferences', 'ترجیحات محفوظ کریں')}
        </button>
      </div>
    </div>
  );
}
