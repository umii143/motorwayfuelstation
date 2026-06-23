import React, { useState } from 'react';
import { User, Shield, Key, Mail, Phone, Calendar, Save, Edit3, Globe, Laptop, Lock, CheckCircle2, Zap, Fuel } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useStation } from '../../../contexts/StationContext';
import { GlobalSettings } from '../../../types';

export default function ProfileCenter({ settings }: { settings: GlobalSettings }) {
  const { user, session } = useAuth();
  const { showToast } = useStation();

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState(user?.email?.split('@')[0] || 'User');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    showToast(t('Profile updated successfully', 'پروفائل کامیابی سے اپ ڈیٹ ہو گئی'), 'success');
  };

  const handleChangePassword = () => {
    showToast(t('Password reset link sent to your email.', 'پاس ورڈ ری سیٹ لنک آپ کے ای میل پر بھیج دیا گیا ہے۔'), 'info');
  };

  if (!user) return null;

  return (
    <div className="space-y-5 pb-4">

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900">{t('Profile Center', 'پروفائل سینٹر')}</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {t('Manage your personal information and login credentials.', 'اپنی ذاتی معلومات اور لاگ ان کی تفصیلات کا نظم کریں۔')}
        </p>
      </div>

      {/* ── AVATAR + IDENTITY CARD ───────────────────────
          Mobile: full-width stacked
          Desktop: side-by-side with details           */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* Avatar card — stacks on top on mobile */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Gradient banner */}
            <div className="h-20 bg-gradient-to-r from-orange-500 to-amber-500" />
            {/* Avatar */}
            <div className="flex flex-col items-center px-5 pb-5 -mt-10">
              <div className="relative">
                <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center">
                  <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center">
                    <User className="h-9 w-9 text-slate-400" />
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-orange-600 shadow-sm transition-colors">
                  <Edit3 className="h-3 w-3" />
                </button>
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900 text-center">{fullName}</h3>
              <p className="text-xs text-slate-500 text-center truncate max-w-full px-2">{user.email}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-[11px] font-bold border border-orange-100">
                <Shield className="h-3 w-3" />
                <span className="uppercase tracking-wider">{user.role}</span>
              </div>
            </div>
          </div>

          {/* Session card — visible on mobile too but compact */}
          {session && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                {t('Current Session', 'موجودہ سیشن')}
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Laptop className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{session.deviceName}</p>
                    <p className="text-[11px] text-slate-400 break-all leading-tight mt-0.5">{session.browser}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Globe className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">{session.ipHistory[0]}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{t('Current IP Address', 'موجودہ IP')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column — forms */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── PERSONAL INFORMATION ──────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">{t('Personal Information', 'ذاتی معلومات')}</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {t('Edit', 'ترمیم')}
                </button>
              )}
            </div>

            <div className="p-5">
              <form onSubmit={handleSave}>
                {/* 1-col on mobile → 2-col on sm → stays 2-col (enough space) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      {t('Full Name', 'پورا نام')}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        disabled={!isEditing}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 disabled:opacity-60 disabled:bg-slate-100 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      {t('Email Address', 'ای میل')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed truncate"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      {t('Phone Number', 'فون نمبر')}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        disabled={!isEditing}
                        placeholder="+92 300 1234567"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 disabled:opacity-60 disabled:bg-slate-100 transition-all"
                      />
                    </div>
                  </div>

                  {/* Joined Date */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      {t('Joined Date', 'شمولیت')}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={new Date(user.createdAt).toLocaleDateString()}
                        disabled
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {t('Cancel', 'کینسل')}
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors shadow-sm cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      {t('Save', 'محفوظ کریں')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* ── AUTHENTICATION ────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <Key className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">{t('Authentication', 'آتھنٹیکیشن')}</h3>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Password row — stacks on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800">{t('Account Password', 'اکاؤنٹ کا پاس ورڈ')}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {t('Change your password regularly to keep your account secure.', 'اپنے اکاؤنٹ کو محفوظ رکھنے کے لیے پاس ورڈ تبدیل کریں۔')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleChangePassword}
                  className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer text-center"
                >
                  {t('Change Password', 'پاس ورڈ تبدیل کریں')}
                </button>
              </div>

              {/* 2FA row — stacks on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800">{t('Two-Factor Authentication', 'دوہری تصدیق')}</h4>
                      {user.totpEnabled && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          {t('Enabled', 'فعال')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {t('Add an extra layer of security to your account.', 'اپنے اکاؤنٹ میں سیکیورٹی کی اضافی تہہ شامل کریں۔')}
                    </p>
                  </div>
                </div>
                <button
                  className={`w-full sm:w-auto shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer text-center ${
                    user.totpEnabled
                      ? 'bg-white border border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent shadow-sm'
                  }`}
                >
                  {user.totpEnabled ? t('Disable 2FA', '2FA غیر فعال') : t('Enable 2FA', '2FA فعال کریں')}
                </button>
              </div>
            </div>
          </div>

          {/* ── ABOUT FUELPRO ─────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">{t('About FuelPro', 'فیول پرو کے بارے میں')}</h3>
            </div>
            <div className="p-5 space-y-4">
              {/* App identity */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm shrink-0">
                  <Fuel className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">FuelPro Enterprise</p>
                  <p className="text-xs text-slate-500">Version 3.0 · Gold Medal Edition</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Developer credit */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{t('Developed by', 'بنانے والا')}</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full">
                  <span className="text-xs font-extrabold text-orange-700 tracking-wide">UMAR ALI</span>
                  <Zap className="h-3 w-3 text-amber-500 fill-amber-400" />
                </div>
              </div>

              {/* WhatsApp contact */}
              <a
                href="https://wa.me/923168432329"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.058 5.348 5.4 0 12.008 0c3.2 0 6.21 1.244 8.475 3.512 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.346 12.003-11.95 12.003-2.002-.001-3.968-.5-5.713-1.448L0 24zm6.59-4.817c1.661.988 3.287 1.477 4.912 1.478 5.483 0 9.95-4.466 9.953-9.95 0-2.657-1.035-5.155-2.914-7.034C16.711 1.797 14.198.761 11.53.761c-5.485 0-9.952 4.467-9.955 9.953-.001 1.944.512 3.844 1.487 5.534l-.98 3.578 3.665-.961zm11.332-6.526c-.347-.174-2.054-1.014-2.372-1.129-.317-.116-.549-.174-.78.174-.23.348-.895 1.129-1.096 1.359-.202.232-.404.261-.751.087-.348-.174-1.468-.541-2.798-1.728-1.034-.922-1.731-2.06-1.933-2.408-.202-.348-.022-.536.152-.709.157-.156.347-.406.52-.609.174-.203.232-.348.348-.58.116-.232.058-.435-.028-.609-.087-.174-.78-1.884-1.069-2.58-.282-.677-.568-.584-.78-.595-.201-.01-.433-.012-.664-.012-.231 0-.606.087-.923.435-.317.348-1.211 1.188-1.211 2.9s1.24 3.362 1.413 3.593c.174.232 2.44 3.725 5.911 5.225.824.356 1.468.57 1.969.729.829.263 1.583.226 2.18.136.664-.1 2.053-.84 2.34-1.652.287-.812.287-1.507.202-1.651-.086-.144-.316-.231-.663-.405z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-800">Support &amp; Contact</p>
                  <p className="text-xs text-emerald-600 font-mono">0316-8432329</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  WhatsApp
                </span>
              </a>

              {/* Copyright */}
              <p className="text-[11px] text-slate-400 text-center font-mono">
                © 2026 {settings.stationName}. All rights reserved.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
