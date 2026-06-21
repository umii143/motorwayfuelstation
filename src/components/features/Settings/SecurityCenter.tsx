import React, { useState } from 'react';
import { Shield, Key, Clock, Fingerprint, Lock, ShieldAlert, Save, Eye, EyeOff, X, Mail } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useStation } from '../../../contexts/StationContext';
import { GlobalSettings } from '../../../types';

interface SecurityCenterProps {
  settings: GlobalSettings;
  onUpdateSettings: (s: GlobalSettings) => void;
}

export default function SecurityCenter({ settings, onUpdateSettings }: SecurityCenterProps) {
  const { user, reauthenticateWithPassword } = useAuth();
  const { showToast } = useStation();

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // General Settings State
  const [requirePinForMeterReset, setRequirePinForMeterReset] = useState(settings.security?.requirePinForMeterReset ?? true);
  const [requirePinForFactoryReset, setRequirePinForFactoryReset] = useState(settings.security?.requirePinForFactoryReset ?? true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(settings.security?.sessionTimeoutMinutes?.toString() || '30');
  const [biometricEnabled, setBiometricEnabled] = useState(settings.security?.biometricEnabled ?? false);
  const [isEditing, setIsEditing] = useState(false);

  // PIN Management State
  const hasMasterPin = Boolean(settings.security?.masterPin);
  const [pinMode, setPinMode] = useState<'idle' | 'setup' | 'change' | 'forgot'>('idle');
  const [showPin, setShowPin] = useState(false);

  // Setup / Change PIN inputs
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Forgot PIN flow
  const [forgotMethod, setForgotMethod] = useState<'password' | 'email' | null>(null);
  const [accountPassword, setAccountPassword] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleGeneralSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: GlobalSettings = {
      ...settings,
      security: {
        ...settings.security,
        requirePinForMeterReset,
        requirePinForFactoryReset,
        sessionTimeoutMinutes: parseInt(sessionTimeoutMinutes) || 30,
        biometricEnabled
      }
    };
    onUpdateSettings(updatedSettings);
    setIsEditing(false);
    showToast(t('Security settings updated successfully', 'سیکیورٹی ترتیبات کامیابی سے اپ ڈیٹ ہو گئیں۔'), 'success');
  };

  const handlePinSave = () => {
    if (pinMode === 'change') {
      if (currentPin !== settings.security?.masterPin) {
        showToast(t('Current PIN is incorrect.', 'موجودہ پن غلط ہے۔'), 'error');
        return;
      }
    }

    if (!/^\d{6}$/.test(newPin)) {
      showToast(t('New PIN must be exactly 6 digits.', 'نیا پن 6 ہندسوں کا ہونا چاہیے۔'), 'error');
      return;
    }

    if (newPin !== confirmPin) {
      showToast(t('New PIN and Confirm PIN do not match.', 'نئے پن آپس میں نہیں مل رہے۔'), 'error');
      return;
    }

    const updatedSettings: GlobalSettings = {
      ...settings,
      security: {
        ...settings.security,
        masterPin: newPin
      }
    };
    onUpdateSettings(updatedSettings);
    showToast(t('Master PIN saved successfully.', 'ماسٹر پن محفوظ کر لیا گیا۔'), 'success');
    cancelPinMode();
  };

  const handleForgotPinVerify = async () => {
    setIsVerifying(true);
    try {
      if (forgotMethod === 'password') {
        await reauthenticateWithPassword(accountPassword);
      } else if (forgotMethod === 'email') {
        if (emailOtp !== '123456') { // Simulated OTP check
          throw new Error('Invalid OTP Code');
        }
      }
      
      // If verification succeeds, we move them to 'setup' mode to create a new PIN
      setPinMode('setup');
      setForgotMethod(null);
      showToast(t('Identity verified. Please set a new PIN.', 'شناخت کی تصدیق ہو گئی۔ نیا پن درج کریں۔'), 'success');
    } catch (err: any) {
      showToast(err.message || t('Verification failed', 'تصدیق ناکام'), 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendEmailOtp = () => {
    setIsSendingEmail(true);
    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSent(true);
      showToast(t('Recovery code sent to your email! (Hint: use 123456)', 'کوڈ آپ کی ای میل پر بھیج دیا گیا ہے!'), 'success');
    }, 1500);
  };

  const cancelPinMode = () => {
    setPinMode('idle');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setForgotMethod(null);
    setAccountPassword('');
    setEmailOtp('');
    setEmailSent(false);
  };

  const renderPinManagement = () => {
    if (pinMode === 'idle') {
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${hasMasterPin ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              <Key className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">
                {hasMasterPin ? t('Master PIN is Active', 'ماسٹر پن فعال ہے') : t('Master PIN is NOT Set', 'ماسٹر پن سیٹ نہیں ہے')}
              </p>
              <p className="text-xs text-slate-500">
                {hasMasterPin 
                  ? t('Your system is protected by a 6-digit Owner PIN.', 'آپ کا سسٹم 6 ہندسوں کے اونر پن سے محفوظ ہے۔')
                  : t('Set up a 6-digit PIN to protect critical operations.', 'اہم کارروائیوں کی حفاظت کے لیے 6 ہندسوں کا پن سیٹ کریں۔')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasMasterPin ? (
              <button
                type="button"
                onClick={() => setPinMode('change')}
                className="w-full sm:w-auto px-4 py-2 premium-card border text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                {t('Change PIN', 'پن تبدیل کریں')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPinMode('setup')}
                className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                {t('Setup Master PIN', 'ماسٹر پن سیٹ کریں')}
              </button>
            )}
          </div>
        </div>
      );
    }

    if (pinMode === 'forgot') {
      return (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-rose-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              {t('Reset Master PIN', 'ماسٹر پن ری سیٹ کریں')}
            </h4>
            <button onClick={cancelPinMode} className="text-rose-500 hover:text-rose-700"><X className="h-5 w-5" /></button>
          </div>
          <p className="text-xs text-rose-700">
            {t('To reset your PIN, please verify your identity using one of the methods below.', 'اپنا پن ری سیٹ کرنے کے لیے، درج ذیل میں سے کسی ایک طریقے کا استعمال کر کے اپنی شناخت کی تصدیق کریں۔')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setForgotMethod('password')}
              className={`p-3 text-sm font-bold border rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${forgotMethod === 'password' ? 'bg-white border-rose-500 shadow-sm text-rose-700' : 'bg-white/50 border-rose-200 text-rose-600 hover:bg-white'}`}
            >
              <Lock className="h-5 w-5" />
              {t('Account Password', 'اکاؤنٹ پاس ورڈ')}
            </button>
            <button
              type="button"
              onClick={() => setForgotMethod('email')}
              className={`p-3 text-sm font-bold border rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${forgotMethod === 'email' ? 'bg-white border-rose-500 shadow-sm text-rose-700' : 'bg-white/50 border-rose-200 text-rose-600 hover:bg-white'}`}
            >
              <Mail className="h-5 w-5" />
              {t('Email OTP Code', 'ای میل او ٹی پی')}
            </button>
          </div>

          {forgotMethod === 'password' && (
            <div className="space-y-3 pt-3">
              <div className="relative">
                <input 
                  type={showPin ? "text" : "password"}
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder={t('Enter your login password', 'اپنا لاگ ان پاس ورڈ درج کریں')}
                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-rose-200 rounded-lg text-sm text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-inner"
                />
                <button type="button" onClick={() => setShowPin(!showPin)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button 
                type="button" 
                onClick={handleForgotPinVerify}
                disabled={!accountPassword || isVerifying}
                className="w-full py-2.5 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {isVerifying ? t('Verifying...', 'تصدیق ہو رہی ہے...') : t('Verify Password', 'پاس ورڈ کی تصدیق کریں')}
              </button>
            </div>
          )}

          {forgotMethod === 'email' && (
            <div className="space-y-3 pt-3">
              {!emailSent ? (
                <button 
                  type="button" 
                  onClick={handleSendEmailOtp}
                  disabled={isSendingEmail}
                  className="w-full py-2.5 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors"
                >
                  {isSendingEmail ? t('Sending Email...', 'ای میل بھیجی جا رہی ہے...') : t('Send Recovery Email', 'ریکوری ای میل بھیجیں')}
                </button>
              ) : (
                <>
                  <input 
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3 py-2.5 bg-white border border-rose-200 rounded-lg text-sm text-slate-800 focus:border-rose-500 text-center font-mono tracking-widest shadow-inner"
                  />
                  <button 
                    type="button" 
                    onClick={handleForgotPinVerify}
                    disabled={emailOtp.length !== 6 || isVerifying}
                    className="w-full py-2.5 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors"
                  >
                    {isVerifying ? t('Verifying...', 'تصدیق ہو رہی ہے...') : t('Verify OTP', 'او ٹی پی کی تصدیق کریں')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Key className="h-5 w-5 text-indigo-500" />
            {pinMode === 'setup' ? t('Setup New Master PIN', 'نیا ماسٹر پن سیٹ کریں') : t('Change Master PIN', 'ماسٹر پن تبدیل کریں')}
          </h4>
          <button onClick={cancelPinMode} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          {pinMode === 'change' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">{t('Current PIN', 'موجودہ پن')}</label>
              <div className="relative">
                <input 
                  type={showPin ? "text" : "password"}
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="******"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-lg font-mono font-bold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner tracking-widest text-center"
                />
              </div>
              <div className="text-right pt-1">
                <button type="button" onClick={() => setPinMode('forgot')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                  {t('Forgot PIN?', 'پن بھول گئے؟')}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">{t('New PIN', 'نیا پن')}</label>
              <input 
                type={showPin ? "text" : "password"}
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="******"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-lg font-mono font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner tracking-widest text-center"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">{t('Confirm New PIN', 'نئے پن کی تصدیق کریں')}</label>
              <input 
                type={showPin ? "text" : "password"}
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="******"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-lg font-mono font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner tracking-widest text-center"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={() => setShowPin(!showPin)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPin ? t('Hide', 'چھپائیں') : t('Show', 'دکھائیں')}
            </button>
            <button 
              type="button"
              onClick={handlePinSave}
              disabled={newPin.length !== 6 || confirmPin.length !== 6 || (pinMode === 'change' && currentPin.length !== 6)}
              className="px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] bg-slate-900 text-white rounded-lg text-sm font-bold shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {t('Save Master PIN', 'ماسٹر پن محفوظ کریں')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('Security Center', 'سیکیورٹی سینٹر')}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('Manage enterprise security, Owner PIN, and session controls.', 'انٹرپرائز سیکیورٹی، اونر پن، اور سیشن کنٹرولز کا نظم کریں۔')}
          </p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-xs hover:bg-slate-800 transition-colors"
          >
            {t('Edit General Security', 'عام سیکیورٹی میں ترمیم کریں')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* PIN Management Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <Lock className="h-5 w-5 text-slate-400" />
              <h3 className="text-base font-bold text-slate-800">{t('Master PIN Control', 'ماسٹر پن کنٹرول')}</h3>
            </div>
            <div className="p-6">
              {renderPinManagement()}
            </div>
          </div>

          {/* General Security Settings Form */}
          <form onSubmit={handleGeneralSave}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2 bg-slate-50/50">
                <Shield className="h-5 w-5 text-slate-400" />
                <h3 className="text-base font-bold text-slate-800">{t('Enforcement & Policies', 'نفاذ اور پالیسیاں')}</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-4">{t('PIN Enforcement', 'پن کا نفاذ')}</h4>
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-start pt-0.5">
                        <input
                          type="checkbox"
                          checked={requirePinForMeterReset}
                          onChange={(e) => setRequirePinForMeterReset(e.target.checked)}
                          disabled={!isEditing}
                          className="peer sr-only"
                        />
                        <div className="h-5 w-5 rounded border border-slate-300 bg-white peer-checked:bg-slate-900 peer-checked:border-slate-900 flex items-center justify-center transition-all group-hover:border-slate-400">
                          <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-700 block">{t('Require PIN for Meter Resets', 'میٹر ری سیٹ کے لیے پن لازمی کریں')}</span>
                        <span className="text-xs text-slate-500 block mt-0.5">Prevents unauthorized modification of dispenser readings.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-start pt-0.5">
                        <input
                          type="checkbox"
                          checked={requirePinForFactoryReset}
                          onChange={(e) => setRequirePinForFactoryReset(e.target.checked)}
                          disabled={!isEditing}
                          className="peer sr-only"
                        />
                        <div className="h-5 w-5 rounded border border-slate-300 bg-white peer-checked:bg-slate-900 peer-checked:border-slate-900 flex items-center justify-center transition-all group-hover:border-slate-400">
                          <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-700 block">{t('Require PIN for Factory Reset', 'فیکٹری ری سیٹ کے لیے پن لازمی کریں')}</span>
                        <span className="text-xs text-slate-500 block mt-0.5">Absolute requirement to wipe system data.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-4">{t('Session & Biometrics', 'سیشن اور بائیو میٹرکس')}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Auto-Lock Timeout', 'آٹو لاک ٹائم آؤٹ')}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock className="h-4 w-4 text-slate-400" />
                        </div>
                        <select 
                          value={sessionTimeoutMinutes}
                          onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:border-slate-500 disabled:opacity-70"
                        >
                          <option value="5">5 {t('Minutes', 'منٹ')}</option>
                          <option value="15">15 {t('Minutes', 'منٹ')}</option>
                          <option value="30">30 {t('Minutes', 'منٹ')}</option>
                          <option value="60">1 {t('Hour', 'گھنٹہ')}</option>
                          <option value="0">{t('Never Lock', 'کبھی لاک نہ کریں')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={biometricEnabled}
                            onChange={(e) => setBiometricEnabled(e.target.checked)}
                            disabled={!isEditing}
                          />
                          <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Fingerprint className="h-5 w-5 text-slate-500" />
                          <span className="text-sm font-bold text-slate-700">{t('Biometric Ready', 'بائیو میٹرک فعال')}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    {t('Cancel', 'کینسل')}
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs"
                  >
                    <Save className="h-4 w-4" />
                    {t('Save Configuration', 'محفوظ کریں')}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Status / Log Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              {t('Recent Failed Logins', 'حالیہ ناکام لاگ انز')}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg border border-rose-100">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-sm font-bold text-rose-900">admin@fuelpro.local</p>
                  <p className="text-xs text-rose-700">Invalid Password</p>
                  <p className="text-[10px] text-rose-500 mt-1 font-mono">192.168.1.105 • 2 hrs ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                <div>
                  <p className="text-sm font-bold text-slate-700">manager@fuelpro.local</p>
                  <p className="text-xs text-slate-500">Invalid 2FA Token</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">119.160.102.4 • Yesterday</p>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
              {t('View All Logs', 'تمام لاگز دیکھیں')} &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
