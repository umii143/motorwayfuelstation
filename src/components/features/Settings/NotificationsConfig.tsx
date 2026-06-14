import React, { useState } from 'react';
import { Bell, Save, MessageSquare, Mail } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { GlobalSettings } from '../../../types';

export default function NotificationsConfig({ settings, onUpdateSettings, activeStationId }: { settings: GlobalSettings, onUpdateSettings: (s: GlobalSettings) => void, activeStationId: string }) {
  const { showToast } = useStation();

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [notif, setNotif] = useState({
    shiftClose: true,
    lowStock: true,
    largeTxn: false,
    dailyReport: true
  });

  const handleSave = () => {
    showToast(t('Notification preferences saved.', 'اطلاعات کی ترجیحات محفوظ ہو گئیں۔'), 'success');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="h-6 w-6 text-indigo-600" />
          {t('Notifications', 'اطلاعات')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Configure system alerts and daily email/WhatsApp summaries.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs max-w-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            <div>
              <h4 className="text-sm font-bold text-slate-800">Shift Close Alerts</h4>
              <p className="text-xs text-slate-500">Send WhatsApp summary when shift closes.</p>
            </div>
          </div>
          <input type="checkbox" checked={notif.shiftClose} onChange={(e) => setNotif({...notif, shiftClose: e.target.checked})} className="h-5 w-5 rounded border-slate-300 text-indigo-600" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-rose-500" />
            <div>
              <h4 className="text-sm font-bold text-slate-800">Low Stock Warnings</h4>
              <p className="text-xs text-slate-500">Alert when tank falls below reorder level.</p>
            </div>
          </div>
          <input type="checkbox" checked={notif.lowStock} onChange={(e) => setNotif({...notif, lowStock: e.target.checked})} className="h-5 w-5 rounded border-slate-300 text-indigo-600" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-blue-500" />
            <div>
              <h4 className="text-sm font-bold text-slate-800">Daily EOD Report</h4>
              <p className="text-xs text-slate-500">Email full End of Day report at midnight.</p>
            </div>
          </div>
          <input type="checkbox" checked={notif.dailyReport} onChange={(e) => setNotif({...notif, dailyReport: e.target.checked})} className="h-5 w-5 rounded border-slate-300 text-indigo-600" />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button onClick={handleSave} className="px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px].5 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2">
            <Save className="h-4 w-4" /> {t('Save Preferences', 'محفوظ کریں')}
          </button>
        </div>
      </div>
    </div>
  );
}
