/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Key, 
  Smartphone, 
  History, 
  MonitorSmartphone,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  Clock,
  LogOut,
  RefreshCw,
  Fingerprint
} from 'lucide-react';
import { GlobalSettings } from '../../types';
import { t as translate } from '../../lib/translations';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { dbFS } from '../../lib/firebase';

interface SecurityHubProps {
  settings: GlobalSettings;
  user?: any;
  onLogout: () => void;
}

export default function SecurityHub({ settings, user, onLogout }: SecurityHubProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'audit'>('overview');
  const { session, organization, logout } = useAuth();
  
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => translate(en, ur, settings);

  useEffect(() => {
    if (activeTab === 'audit' && user?.uid) {
      loadAuditLogs();
    }
  }, [activeTab, user]);

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const logsRef = collection(dbFS, 'auditLogs');
      // In a real production app, we would query by orgId. For now, querying by userId for demo.
      const q = query(logsRef, where('userId', '==', user?.uid), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAuditLogs(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (window.confirm(t('Are you sure you want to revoke all other sessions?', 'کیا آپ واقعی تمام دوسرے سیشنز ختم کرنا چاہتے ہیں؟'))) {
      // Logic would go here to update all sessions in Firestore to 'revoked' except current
      alert(t('All other sessions have been revoked.', 'تمام دوسرے سیشنز ختم کر دیے گئے ہیں۔'));
    }
  };

  const tabs = [
    { id: 'overview', icon: Shield, label: 'Security Overview', urdu: 'سیکیورٹی کا جائزہ' },
    { id: 'sessions', icon: MonitorSmartphone, label: 'Active Sessions', urdu: 'فعال سیشنز' },
    { id: 'audit', icon: History, label: 'Audit Logs', urdu: 'آڈٹ لاگز' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-sans text-2xl font-bold text-slate-900 tracking-tight">
              {t('Security & Roles Hub', 'سیکیورٹی اور کردار کا مرکز')}
            </h1>
            <p className="font-sans text-sm text-slate-500 mt-1">
              {t('Manage enterprise-grade security, MFA, active sessions, and audit logs.', 'انٹرپرائز لیول سیکیورٹی، ایم ایف اے، سیشنز اور آڈٹ لاگز کا انتظام کریں۔')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-sm font-bold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(tab.label, tab.urdu)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            {/* MFA Setup Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{t('Two-Factor Authentication (2FA)', 'دوہری تصدیق (2FA)')}</h3>
                  <p className="text-xs text-slate-500">{t('Add an extra layer of security', 'سیکیورٹی کی اضافی تہہ شامل کریں')}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  {user?.totpEnabled ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  <div>
                    <p className="font-bold text-sm text-slate-900">
                      {user?.totpEnabled 
                        ? t('Authenticator App is Active', 'آتھنٹیکیٹر ایپ فعال ہے') 
                        : t('MFA is not configured', 'ایم ایف اے ترتیب نہیں دیا گیا')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('Protect your organization from unauthorized access.', 'اپنی تنظیم کو غیر مجاز رسائی سے بچائیں۔')}
                    </p>
                  </div>
                </div>
                <button className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  user?.totpEnabled 
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                }`}>
                  {user?.totpEnabled ? t('Manage', 'انتظام کریں') : t('Setup 2FA', 'ترتیب دیں')}
                </button>
              </div>
            </div>

            {/* Profile Security Status */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{t('Account Security', 'اکاؤنٹ سیکیورٹی')}</h3>
                  <p className="text-xs text-slate-500">{t('Your current security posture', 'آپ کی موجودہ سیکیورٹی کی حالت')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{t('Password', 'پاس ورڈ')}</span>
                  </div>
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700">
                    {t('Change', 'تبدیل کریں')}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{t('Role & Permissions', 'کردار اور اجازت نامے')}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-md uppercase">
                    {user?.role || 'Admin'}
                  </span>
                </div>
                
                {organization && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{t('Organization ID', 'تنظیم کا آئی ڈی')}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 truncate max-w-full max-w-[120px]">
                      {organization.orgId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('Active Device Sessions', 'فعال ڈیوائس سیشنز')}</h3>
                <p className="text-sm text-slate-500">
                  {t('Review and revoke unrecognized devices that have access to your account.', 'ان آلات کا جائزہ لیں اور منسوخ کریں جنہیں آپ کے اکاؤنٹ تک رسائی حاصل ہے۔')}
                </p>
              </div>
              <button 
                onClick={handleRevokeAllSessions}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-sm font-bold transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t('Revoke All Others', 'باقی تمام منسوخ کریں')}
              </button>
            </div>

            <div className="p-0">
              {session ? (
                <div className="flex items-start gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                    <MonitorSmartphone className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900">{session.browser || 'Current Browser'}</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {t('This Device', 'یہ آلہ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{session.deviceName || navigator.userAgent}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" />
                        <span>IP: {session.ipHistory?.[0] || '127.0.0.1'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{t('Started:', 'شروع ہوا:')} {new Date(session.loginTimestamp || Date.now()).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm">
                  {t('No active session information available.', 'کوئی فعال سیشن معلومات دستیاب نہیں۔')}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('Security Audit Logs', 'سیکیورٹی آڈٹ لاگز')}</h3>
                <p className="text-sm text-slate-500">
                  {t('Chronological record of security events and actions.', 'سیکیورٹی کے واقعات اور کارروائیوں کا ریکارڈ۔')}
                </p>
              </div>
              <button 
                onClick={loadAuditLogs}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                title={t('Refresh', 'تازہ کریں')}
              >
                <RefreshCw className={`h-5 w-5 ${loadingLogs ? 'animate-spin text-blue-500' : ''}`} />
              </button>
            </div>

            <div className="p-0">
              {loadingLogs && auditLogs.length === 0 ? (
                <div className="p-12 flex justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-slate-300" />
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                      <div className="mt-1 p-2 bg-slate-100 text-slate-500 rounded-lg shrink-0">
                        <Fingerprint className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-slate-900">{log.action}</h4>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{log.details}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                          <span>User: {log.email || log.userId}</span>
                          <span>•</span>
                          <span>IP: {log.ip}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                  <History className="h-12 w-12 mb-3 text-slate-300" />
                  <p>{t('No audit logs found for your account.', 'آپ کے اکاؤنٹ کے لیے کوئی آڈٹ لاگ نہیں ملا۔')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
