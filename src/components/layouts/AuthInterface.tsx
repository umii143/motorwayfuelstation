import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Shield, Lock, Mail, ArrowRight, RefreshCw, AlertTriangle,
  CheckCircle, ChevronLeft, MailCheck, Fuel, Database, Users, 
  UserSquare, Truck, BarChart3, ShieldCheck, MapPin, Phone, 
  Clock, User, LogIn, KeyRound
} from "lucide-react";
import { GlobalSettings } from "../../types";
import { useStation } from "../../contexts/StationContext";
import { NativeHaptics } from '../../services/hardware/Haptics';
import { updatePassword } from "firebase/auth";
import { auth } from "../../lib/firebase";

interface AuthInterfaceProps {
  settings: GlobalSettings;
  onLoginSuccess: (user: any, token: string) => void;
}

type AuthMode =
  | "email_otp_request"
  | "email_otp_verify"
  | "mfa_challenge";

export default function AuthInterface({ settings, onLoginSuccess }: AuthInterfaceProps) {
  const { showAlert } = useStation();
  const {
    loginWithGoogle,
    loginWithEmail,
    requestOTP,
    verifyOTP
  } = useAuth();
  const isUrdu = settings.language === "ur";
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  type AuthMode = "login" | "signup" | "signup_otp";
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  // Core inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Token state
  const [tempToken, setTempToken] = useState("");

  // UX feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); 

  useEffect(() => {
    // Clear URL params if any leftover from old flows
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("verified") || urlParams.get("token")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const resetFeedback = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(t("Please enter your email and password.", "براہ کرم اپنی ای میل اور پاس ورڈ درج کریں۔"));
      NativeHaptics.error();
      return;
    }
    resetFeedback();
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      NativeHaptics.success();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in.");
      NativeHaptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || password.length < 6) {
      setErrorMsg(t("Please enter a valid email and a password (min 6 chars).", "براہ کرم درست ای میل اور پاس ورڈ درج کریں (کم از کم 6 ہندسے)۔"));
      NativeHaptics.error();
      return;
    }
    resetFeedback();
    setIsLoading(true);
    try {
      await requestOTP(email);
      setAuthMode("signup_otp");
      setSuccessMsg(t(
        `A 6-digit OTP has been sent to ${email}.`,
        `آپ کی ای میل پر ایک 6 ہندسوں کا OTP بھیج دیا گیا ہے۔`
      ));
      NativeHaptics.success();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send OTP. Make sure email service is configured.");
      NativeHaptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignupOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg(t("Please enter the 6-digit OTP.", "براہ کرم 6 ہندسوں کا OTP درج کریں۔"));
      NativeHaptics.error();
      return;
    }
    resetFeedback();
    setIsLoading(true);
    try {
      const data = await verifyOTP(email, otpCode);
      if (password && auth.currentUser) {
         try {
           await updatePassword(auth.currentUser, password);
         } catch(e) {
           console.error("Failed to set password", e);
         }
      }
      NativeHaptics.success();
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid OTP or expired.");
      NativeHaptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirebaseGoogleLogin = async () => {
    resetFeedback();
    setIsLoading(true);
    try {
      const data = await loginWithGoogle();
      onLoginSuccess(data.user, data.token || "");
      NativeHaptics.success();
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in failed.");
      NativeHaptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { name: t('Sales Management', 'سیلز مینجمنٹ'), icon: Fuel },
    { name: t('Inventory Control', 'انوینٹری کنٹرول'), icon: Database },
    { name: t('Shift & Staff Management', 'شفٹ اور اسٹاف'), icon: Users },
    { name: t('Customer Accounts', 'کسٹمر اکاؤنٹس'), icon: UserSquare },
    { name: t('Supplier Accounts', 'سپلائر اکاؤنٹس'), icon: Truck },
    { name: t('Reports & Analytics', 'رپورٹس اور تجزیات'), icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white flex flex-col font-sans selection:bg-orange-500/30">
      
      {/* Language toggle or top right elements can go here if needed */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
        {/* You can add a language dropdown here in the future to match the mockup */}
      </div>

      <div className="flex-1 flex flex-col xl:flex-row overflow-x-hidden">
        
        {/* ── LEFT SIDE (Branding & Features) ── */}
        <div className="w-full xl:w-[55%] 2xl:w-[60%] p-6 lg:p-12 2xl:p-16 flex flex-col justify-between relative order-2 xl:order-1 border-t xl:border-t-0 xl:border-r border-white/5 bg-[#0a0e17]">
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/5 blur-[120px] rounded-full"></div>
          </div>

          <div className="relative z-10 flex flex-col gap-6 lg:gap-8 h-full">
             
             {/* Logo Section */}
             <div className="flex items-center gap-3">
                <Fuel className="h-10 w-10 text-orange-500" />
                <div>
                   <h1 className="text-3xl font-black tracking-tight uppercase flex items-center">
                     FUEL<span className="text-orange-500">PRO</span>
                   </h1>
                   <div className="h-[2px] w-8 bg-orange-500 mt-1 mb-1"></div>
                   <p className="text-[9px] tracking-[0.2em] text-slate-400 uppercase font-bold">
                     {t('Fuel Station Management System', 'فیول اسٹیشن مینجمنٹ سسٹم')}
                   </p>
                   <p className="text-[13px] font-bold text-orange-400/90 mt-1 font-urdu tracking-widest drop-shadow-md">
                     {t('Apka Apna Petrol Pump', 'آپ کا اپنا پیٹرول پمپ')}
                   </p>
                </div>
             </div>

             {/* Hero Typography */}
             <div className="max-w-xl mt-4 xl:mt-8">
                <h2 className="text-3xl lg:text-5xl font-bold leading-tight">
                   {t('Smarter Management.', 'بہتر مینجمنٹ۔')}<br/>
                   <span className="text-orange-500">{t('Stronger', 'مضبوط')}</span> {t('Performance.', 'کارکردگی۔')}
                </h2>
                <p className="mt-4 text-slate-400 text-sm lg:text-base leading-relaxed max-w-lg">
                   {t('Complete solution for fuel stations to manage sales, inventory, staff, shift, accounts and more — all in one place.', 'فیول اسٹیشنز کے لیے مکمل حل جس میں سیلز، انوینٹری، اسٹاف، شفٹ، اکاؤنٹس اور بہت کچھ شامل ہے — سب ایک ہی جگہ پر۔')}
                </p>
             </div>

             {/* Hero Image */}
             <div className="relative w-full max-w-2xl aspect-[16/7] lg:aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/10 border border-white/10 mt-4 group">
                <div className="absolute inset-0 bg-orange-500/10 mix-blend-overlay z-10"></div>
                <img 
                  src="/fuel-station-bg.jpg" 
                  alt="Fuel Station" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  onError={(e) => {
                    // Fallback gradient if image not found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-slate-800', 'to-slate-900');
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-transparent to-transparent z-10"></div>
             </div>

             {/* Features Grid */}
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mt-4">
                {features.map(f => (
                  <div key={f.name} className="flex flex-col items-center justify-center p-4 lg:p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all hover:-translate-y-1 gap-3 text-center group cursor-default">
                     <f.icon className="h-7 w-7 lg:h-8 lg:w-8 text-orange-500 group-hover:scale-110 transition-transform" />
                     <span className="text-xs text-slate-300 font-medium leading-tight">{f.name}</span>
                  </div>
                ))}
             </div>

             {/* Security Badge */}
             <div className="flex items-center gap-4 p-4 lg:p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 max-w-2xl mt-4 mb-4 xl:mb-0">
                <ShieldCheck className="h-8 w-8 text-orange-500 shrink-0" />
                <div>
                   <h4 className="text-sm font-bold text-orange-500">
                     {t('Your business. Your data. 100% Secure.', 'آپ کا کاروبار۔ آپ کا ڈیٹا۔ 100% محفوظ۔')}
                   </h4>
                   <p className="text-xs text-slate-400 mt-1">
                     {t('We use industry standard security to protect your valuable data.', 'ہم آپ کے قیمتی ڈیٹا کی حفاظت کے لیے انڈسٹری اسٹینڈرڈ سیکیورٹی استعمال کرتے ہیں۔')}
                   </p>
                </div>
             </div>

          </div>
        </div>

        {/* ── RIGHT SIDE (Login Form) ── */}
        <div className="w-full xl:w-[45%] 2xl:w-[40%] flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 order-1 xl:order-2 bg-[#111622] min-h-[100vh] xl:min-h-auto shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
           
           {/* Mobile Only Branding */}
           <div className="xl:hidden flex flex-col items-center mb-10 text-center">
              <h1 className="text-3xl font-black tracking-tight uppercase flex items-center">
                FUEL<span className="text-orange-500">PRO</span>
              </h1>
              <div className="h-[2px] w-8 bg-orange-500 mt-2 mb-2"></div>
              <p className="text-[9px] tracking-[0.2em] text-slate-400 uppercase font-bold">
                {t('Fuel Station Management System', 'فیول اسٹیشن مینجمنٹ سسٹم')}
              </p>
              <p className="text-[12px] font-bold text-orange-400/90 mt-1 font-urdu tracking-widest drop-shadow-md">
                {t('Apka Apna Petrol Pump', 'آپ کا اپنا پیٹرول پمپ')}
              </p>
           </div>

           <div className="w-full max-w-md bg-[#161c2d] rounded-[2rem] border border-white/5 p-8 shadow-2xl relative">
              
              {/* Circular Icon Top */}
              <div className="flex justify-center mb-8">
                 <div className="h-20 w-20 rounded-full border border-orange-500/30 flex items-center justify-center bg-[#1a2133] relative shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                   <Fuel className="h-8 w-8 text-orange-500" />
                   <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)] animate-pulse"></div>
                 </div>
              </div>

              {/* Titles */}
              <div className="text-center mb-8 relative">
                 <AnimatePresence mode="wait">
                    {authMode === "login" && (
                       <motion.div key="title-login" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>
                         <h3 className="text-2xl lg:text-3xl font-bold mb-2 text-white">
                           {t('Welcome', 'خوش آمدید')} <span className="text-orange-500">{t('Back!', 'واپس!')}</span>
                         </h3>
                         <p className="text-slate-400 text-sm">{t('Sign in to continue to FuelPro', 'فیول پرو میں جاری رکھنے کے لیے لاگ ان کریں')}</p>
                       </motion.div>
                    )}
                    {authMode === "signup" && (
                       <motion.div key="title-signup" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>
                         <h3 className="text-2xl lg:text-3xl font-bold mb-2 text-white">
                           {t('Create', 'اکاؤنٹ')} <span className="text-orange-500">{t('Account', 'بنائیں')}</span>
                         </h3>
                         <p className="text-slate-400 text-sm">{t('Sign up to get started with FuelPro', 'فیول پرو شروع کرنے کے لیے سائن اپ کریں')}</p>
                       </motion.div>
                    )}
                    {authMode === "signup_otp" && (
                       <motion.div key="title-otp" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>
                         <h3 className="text-2xl lg:text-3xl font-bold mb-2 text-white">
                           {t('Verify', 'ای میل')} <span className="text-orange-500">{t('Email', 'تصدیق')}</span>
                         </h3>
                         <p className="text-slate-400 text-sm">{t('Enter the 6-digit code sent to your email', 'ای میل پر بھیجا گیا 6 ہندسوں کا کوڈ درج کریں')}</p>
                       </motion.div>
                    )}
                 </AnimatePresence>
                 <div className="w-8 h-1 bg-orange-500 rounded-full mx-auto mt-4"></div>
              </div>

              {/* Form Areas */}
              <AnimatePresence mode="wait">
                {errorMsg && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs font-medium text-red-400 flex items-start gap-2.5"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs font-medium text-emerald-400 flex items-start gap-2.5"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── LOGIN FORM ── */}
              {authMode === "login" && (
                <motion.form 
                  key="form-login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin} 
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                      {t("Username / Email", "یوزر نیم / ای میل")}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        placeholder={t("Enter your username or email", "اپنا یوزر نیم یا ای میل درج کریں")}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-transparent border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-white/5 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-4">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                      {t("Password", "پاس ورڈ")}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        placeholder={t("Enter your password", "اپنا پاس ورڈ درج کریں")}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-transparent border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-white/5 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 ml-1">
                     <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="w-4 h-4 rounded border border-white/20 bg-transparent flex items-center justify-center group-hover:border-orange-500 transition-colors">
                           <div className="w-2.5 h-2.5 rounded-sm bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <span className="text-xs text-slate-400 select-none">{t("Remember Me", "مجھے یاد رکھیں")}</span>
                     </label>
                     <button type="button" className="text-xs text-orange-500 hover:text-orange-400 font-medium transition-colors">
                        {t("Forgot Password?", "پاس ورڈ بھول گئے؟")}
                     </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.5)] transition-all uppercase tracking-wider text-sm mt-6"
                  >
                    {isLoading
                      ? <RefreshCw className="h-5 w-5 animate-spin" />
                      : <><LogIn className="h-5 w-5" /> <span>{t("SIGN IN", "لاگ ان کریں")}</span></>
                    }
                  </button>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-slate-400">
                      {t("Don't have an account?", "اکاؤنٹ نہیں ہے؟")}{" "}
                      <button 
                        type="button" 
                        onClick={() => { resetFeedback(); setAuthMode("signup"); }}
                        className="text-orange-500 hover:text-orange-400 font-bold hover:underline transition-all"
                      >
                        {t("Sign Up", "سائن اپ کریں")}
                      </button>
                    </p>
                  </div>

                  <div className="relative my-6 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative px-4 text-xs text-slate-500 bg-[#161c2d]">
                      {t("or continue with", "یا اس کے ساتھ جاری رکھیں")}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <button
                        type="button"
                        onClick={handleFirebaseGoogleLogin}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl py-3 px-4 transition-all group disabled:opacity-50"
                     >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span className="font-sans text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                          Google
                        </span>
                     </button>
                     <button
                        type="button"
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl py-3 px-4 transition-all group disabled:opacity-50 opacity-50 cursor-not-allowed"
                        title="Coming Soon"
                     >
                        <svg className="h-4 w-4" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                           <path d="M10 0H0V10H10V0Z" fill="#F25022"/>
                           <path d="M21 0H11V10H21V0Z" fill="#7FBA00"/>
                           <path d="M10 11H0V21H10V11Z" fill="#00A4EF"/>
                           <path d="M21 11H11V21H21V11Z" fill="#FFB900"/>
                        </svg>
                        <span className="font-sans text-xs font-medium text-slate-300 transition-colors">
                          Microsoft
                        </span>
                     </button>
                  </div>
                </motion.form>
              )}

              {/* ── SIGNUP FORM ── */}
              {authMode === "signup" && (
                <motion.form 
                  key="form-signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignupRequest} 
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                      {t("Email Address", "ای میل ایڈریس")}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        placeholder={t("Enter your email", "اپنی ای میل درج کریں")}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-transparent border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-white/5 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-4">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                      {t("Password", "پاس ورڈ")}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        placeholder={t("Create a password", "پاس ورڈ بنائیں")}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-transparent border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 focus:bg-white/5 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.5)] transition-all uppercase tracking-wider text-sm mt-6"
                  >
                    {isLoading
                      ? <RefreshCw className="h-5 w-5 animate-spin" />
                      : <><MailCheck className="h-5 w-5" /> <span>{t("SEND OTP", "OTP بھیجیں")}</span></>
                    }
                  </button>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-slate-400">
                      {t("Already have an account?", "پہلے سے اکاؤنٹ ہے؟")}{" "}
                      <button 
                        type="button" 
                        onClick={() => { resetFeedback(); setAuthMode("login"); }}
                        className="text-orange-500 hover:text-orange-400 font-bold hover:underline transition-all"
                      >
                        {t("Sign In", "لاگ ان کریں")}
                      </button>
                    </p>
                  </div>
                </motion.form>
              )}

              {/* ── SIGNUP OTP VERIFY ── */}
              {authMode === "signup_otp" && (
                <motion.form 
                  key="form-signup-otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleVerifySignupOTP} 
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                     <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                        {t("One-Time Password", "ون ٹائم پاس ورڈ")}
                     </label>
                     <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <KeyRound className="h-5 w-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                        <input
                           type="text"
                           maxLength={6}
                           value={otpCode}
                           placeholder="• • • • • •"
                           onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                           className="w-full bg-transparent border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-center tracking-[1em] text-lg font-bold text-white focus:outline-none focus:border-orange-500 focus:bg-white/5 transition-all placeholder:text-slate-600"
                        />
                     </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.5)] transition-all uppercase tracking-wider text-sm mt-6"
                  >
                    {isLoading
                      ? <RefreshCw className="h-5 w-5 animate-spin" />
                      : <><CheckCircle className="h-5 w-5" /> <span>{t("VERIFY & REGISTER", "تصدیق کریں")}</span></>
                    }
                  </button>

                  <button
                    type="button"
                    onClick={() => { resetFeedback(); setAuthMode("signup"); setOtpCode(""); }}
                    className="w-full py-2 font-sans text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1 mt-2 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{t("Back to Email", "ای میل پر واپس")}</span>
                  </button>
                </motion.form>
              )}
              
              {/* Decorative Illustration Bottom */}
              <div className="mt-12 text-center border-t border-white/5 pt-8 relative">
                 {/* CSS Based Minimal outline representing a fuel station canopy */}
                 <div className="w-full flex justify-center mb-4 opacity-50 relative group">
                    <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">
                       <path d="M10 20 L50 5 L70 5 L110 20" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                       <path d="M25 15 V40 M95 15 V40" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round"/>
                       <path d="M0 40 H120" stroke="#f97316" strokeWidth="1" strokeLinecap="round" strokeDasharray="4 4"/>
                    </svg>
                 </div>
                 <p className="text-xs font-medium text-slate-400">
                    {t('Efficient Today. ', 'آج کی کارکردگی۔ ')}
                    <span className="text-orange-500">{t('Powerful Tomorrow.', 'کل کی طاقت۔')}</span>
                 </p>
              </div>

           </div>
        </div>

      </div>

      {/* ── BOTTOM FOOTER ── */}
      <div className="bg-[#0f1420] border-t border-white/5 py-4 px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
         
         {/* Location */}
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center shrink-0">
               <MapPin className="h-5 w-5 text-orange-500" />
            </div>
            <div>
               <p className="font-bold text-slate-200 text-sm">Motorway Petroleum</p>
               <p className="text-xs text-slate-500">Mardan, Khyber Pakhtunkhwa<br/>Pakistan</p>
            </div>
         </div>

         {/* Contacts */}
         <div className="flex flex-col md:flex-row gap-6 lg:gap-12">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-orange-500" />
               </div>
               <span className="text-sm text-slate-300 font-medium">03168432329</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-orange-500" />
               </div>
               <span className="text-sm text-slate-300 font-medium">info@motorwaypetroleum.com</span>
            </div>
         </div>

         {/* Support */}
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center shrink-0">
               <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-right">
               <p className="font-bold text-slate-200 text-sm">24/7 Support</p>
               <p className="text-xs text-slate-500">We are always here<br/>to help you!</p>
            </div>
         </div>

      </div>

      {/* Powered By Bottom Strip */}
      <div className="bg-[#0a0e17] py-3 flex flex-col items-center justify-center border-t border-white/5 relative z-10 gap-1.5">
         <p className="text-xs text-slate-500 font-medium">
            Powered by <span className="text-orange-500 font-bold">Umar Ali</span>
         </p>
         <div className="flex items-center gap-2 text-[10px] text-slate-600 uppercase tracking-widest font-semibold">
            <MapPin className="h-3 w-3 text-slate-500" />
            <span>Motorway Petroleum, Mardan</span>
            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
            <Phone className="h-3 w-3 text-slate-500" />
            <span>03168432329</span>
         </div>
      </div>
      
    </div>
  );
}
