import React, { useState } from 'react';
import { User, Shield, Key, Mail, Phone, Calendar, BadgeCheck, Save, Edit3, Smartphone, Laptop, Globe } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">{t('Profile Center', 'پروفائل سینٹر')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('Manage your personal information and login credentials.', 'اپنی ذاتی معلومات اور لاگ ان کی تفصیلات کا نظم کریں۔')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-orange-500 to-amber-500"></div>
            
            <div className="relative mt-8">
              <div className="w-24 h-24 bg-white rounded-full mx-auto border-4 border-white shadow-md flex items-center justify-center relative">
                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <User className="h-10 w-10" />
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-orange-600 hover:border-orange-200 shadow-sm transition-colors">
                  <Edit3 className="h-3 w-3" />
                </button>
              </div>
              
              <h3 className="mt-4 text-lg font-bold text-slate-900">{fullName}</h3>
              <p className="text-sm text-slate-500">{user.email}</p>
              
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-100">
                <Shield className="h-3 w-3" />
                <span className="uppercase tracking-wider">{user.role}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('Current Session', 'موجودہ سیشن')}</h4>
            {session ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Laptop className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{session.deviceName}</p>
                    <p className="text-xs text-slate-500">{session.browser}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{session.ipHistory[0]}</p>
                    <p className="text-xs text-slate-500">Current IP Address</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No active session details available.</p>
            )}
          </div>
        </div>

        {/* Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">{t('Personal Information', 'ذاتی معلومات')}</h3>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider"
                >
                  {t('Edit', 'ترمیم')}
                </button>
              ) : null}
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Full Name', 'پورا نام')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-70 disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Email Address', 'ای میل ایڈریس')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="email" 
                        value={user.email}
                        disabled
                        className="w-full pl-10 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Phone Number', 'فون نمبر')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing}
                        placeholder="+92 300 1234567"
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-70 disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Joined Date', 'شمولیت کی تاریخ')}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        value={new Date(user.createdAt).toLocaleDateString()}
                        disabled
                        className="w-full pl-10 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      {t('Cancel', 'کینسل')}
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-xs"
                    >
                      <Save className="h-4 w-4" />
                      {t('Save Changes', 'محفوظ کریں')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Key className="h-5 w-5 text-slate-400" />
                {t('Authentication', 'آتھنٹیکیشن')}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex flex-row items-center justify-between gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{t('Account Password', 'اکاؤنٹ کا پاس ورڈ')}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{t('Change your password regularly to keep your account secure.', 'اپنے اکاؤنٹ کو محفوظ رکھنے کے لیے پاس ورڈ تبدیل کریں۔')}</p>
                </div>
                <button 
                  onClick={handleChangePassword}
                  className="px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all shrink-0"
                >
                  {t('Change Password', 'پاس ورڈ تبدیل کریں')}
                </button>
              </div>

              <div className="flex flex-row items-center justify-between gap-4 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800">{t('Two-Factor Authentication', 'دوہری تصدیق (2FA)')}</h4>
                    {user.totpEnabled && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <BadgeCheck className="h-3 w-3" />
                        ENABLED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{t('Add an extra layer of security to your account.', 'اپنے اکاؤنٹ میں سیکیورٹی کی اضافی تہہ شامل کریں۔')}</p>
                </div>
                <button 
                  className={`px-4 py-2 text-sm font-bold rounded-lg shadow-xs transition-all shrink-0 ${
                    user.totpEnabled 
                      ? 'bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent'
                  }`}
                >
                  {user.totpEnabled ? t('Disable 2FA', '2FA غیر فعال کریں') : t('Enable 2FA', '2FA فعال کریں')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
