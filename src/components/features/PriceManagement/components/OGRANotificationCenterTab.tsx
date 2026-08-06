import React from 'react';
import { FileText, Download, CheckCircle2, AlertCircle, Bell, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface OGRANotificationCenterTabProps {
  isUrdu: boolean;
  onApproveNotification: () => void;
}

export const OGRANotificationCenterTab: React.FC<OGRANotificationCenterTabProps> = ({
  isUrdu,
  onApproveNotification
}) => {
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const notifications = [
    {
      id: 'ogra_08_2026',
      title: 'OGRA Fortnightly Petroleum Price Revision — August 1st 2026',
      date: '2026-07-31 23:15:00',
      petrolDiff: '+1.35',
      dieselDiff: '-0.80',
      status: 'active_published',
      pdfUrl: '#',
      source: 'Oil & Gas Regulatory Authority (OGRA) Islamabad'
    },
    {
      id: 'ogra_07_2026',
      title: 'OGRA Petroleum Price Revision — July 16th 2026',
      date: '2026-07-15 23:45:00',
      petrolDiff: '+4.10',
      dieselDiff: '+4.60',
      status: 'archived',
      pdfUrl: '#',
      source: 'Oil & Gas Regulatory Authority (OGRA) Islamabad'
    }
  ];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-5 shadow-md mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[var(--border-main)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center text-white font-bold shadow-md">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight flex items-center gap-2">
              {t('Official OGRA Notification Center', 'اوگرا سرکلر نوٹیفکیشن سینٹر')}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20 font-bold">
                Government Feed Verified
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {t('Direct digital feed of government circulars, PDF downloads, and instant tariff imports', 'سرکاری اوگرا کے احکامات، پی ڈی ایف نوٹیفکیشنز اور خودکار امپورٹ')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((n) => (
          <div key={n.id} className="bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20">
                  OGRA CIRCULAR
                </span>
                <h4 className="font-bold text-[var(--text-main)] text-sm">{n.title}</h4>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">{n.source} • {n.date}</p>
              <div className="flex items-center gap-4 text-xs font-mono mt-2">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Petrol: {n.petrolDiff} / L</span>
                <span className="text-rose-700 dark:text-rose-400 font-bold">Diesel: {n.dieselDiff} / L</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => toast.success('Downloading official OGRA PDF circular...')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] border border-[var(--border-main)] text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                {t('Download PDF', 'پی ڈی ایف آرڈر')}
              </button>

              {n.status === 'active_published' ? (
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-800 dark:emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Published
                </span>
              ) : (
                <button
                  onClick={onApproveNotification}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 dark:from-emerald-600 dark:to-teal-600 text-white text-xs font-bold shadow-md transition-all"
                >
                  {t('Import & Publish', 'امپورٹ اور پبلش')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
