import React, { useState } from 'react';
import { Building, Save, Camera, MapPin, Phone, Mail } from 'lucide-react';
import { useStation } from '../../../contexts/StationContext';
import { db } from '../../../data/db';
import { GlobalSettings } from '../../../types';

export default function StationIdentity({ settings, onUpdateSettings, activeStationId }: { settings: GlobalSettings, onUpdateSettings: (s: GlobalSettings) => void, activeStationId: string }) {
  const { showToast } = useStation();

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [formData, setFormData] = useState({
    name: settings.stationName || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    ntn: settings.ntn || '',
    tagline: settings.tagline || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const newSettings = { ...settings, ...formData };
    onUpdateSettings(newSettings);
    showToast(t('Station identity updated successfully.', 'اسٹیشن کی شناخت کامیابی سے اپ ڈیٹ ہو گئی۔'), 'success');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building className="h-6 w-6 text-indigo-600" />
          {t('Station Identity', 'اسٹیشن کی شناخت')}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('Configure your business details, branding, and contact information for receipts.', 'رسیدوں کے لیے اپنے کاروباری تفصیلات، برانڈنگ، اور رابطے کی معلومات ترتیب دیں۔')}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Logo/Branding Section */}
            <div className="w-full md:w-1/3 space-y-4">
              <label className="text-sm font-bold text-slate-800">{t('Station Logo', 'اسٹیشن کا لوگو')}</label>
              <div className="aspect-square w-full max-w-full max-w-[200px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden group">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="h-8 w-8 mb-2 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-sm font-medium">{t('Upload Logo', 'لوگو اپ لوڈ کریں')}</span>
                  </>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-bold">{t('Change Logo', 'لوگو تبدیل کریں')}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Recommended size: 400x400px. Maximum 2MB. Format: PNG, JPG.
              </p>
            </div>

            {/* Details Form */}
            <div className="w-full md:w-2/3 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Station Name', 'اسٹیشن کا نام')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Tagline / Slogan', 'ٹیگ لائن / نعرہ')}</label>
                <input 
                  type="text" 
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="e.g. Quality Fuel, Premium Service"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Physical Address', 'مکمل پتہ')}</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Phone Number', 'فون نمبر')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('NTN / Tax Registration Number', 'این ٹی این / ٹیکس نمبر')}</label>
                <input 
                  type="text" 
                  name="ntn"
                  value={formData.ntn}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase"
                />
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-xs hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {t('Save Identity Settings', 'شناخت کی ترتیبات محفوظ کریں')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
