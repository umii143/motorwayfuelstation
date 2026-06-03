import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Fingerprint,
  QrCode,
  KeyRound,
  CheckCircle,
  HelpCircle,
  Smartphone,
  ChevronLeft,
  Eye,
  EyeOff
} from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import { GlobalSettings } from "../../types";
import { useStation } from "../../contexts/StationContext";

interface AuthInterfaceProps {
  settings: GlobalSettings;
  onLoginSuccess: (user: any, token: string) => void;
}

export default function AuthInterface({ settings, onLoginSuccess }: AuthInterfaceProps) {
  const { showAlert } = useStation();
  const { 
    loginWithEmail, 
    loginWithGoogle, 
    signUpUser, 
    registerVerify2FA, 
    verifyTOTPChallenge,
    sendPasswordReset,
    confirmPasswordReset
  } = useAuth();
  const isUrdu = settings.language === "ur";

  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Layout View States: 'login' | 'signup' | 'forgot_password' | 'mfa_challenge' | 'signup_mfa_challenge' | 'reset_password'
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot_password" | "mfa_challenge" | "signup_mfa_challenge" | "reset_password">("login");

  // Core Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Server Callback payloads
  const [tempToken, setTempToken] = useState("");
  const [base32Secret, setBase32Secret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");

  // Reset password states
  const [resetToken, setResetToken] = useState("");

  // UX Feedback indicators
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Intercept reset parameter if present in page URL on first load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      setResetToken(token);
      setAuthMode("reset_password");
      setSuccessMsg(t("Reset credential token recognized from secure outbound link. Enter new password.", "لنک سے ریکوری ٹوکن موصول ہو گیا۔ نیا پاسورڈ درج کریں۔"));
    }
  }, []);

  // Clear states
  const resetFeedback = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  // Sign in with email and password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(t("Please fill in all core credentials.", "براہ کرم تمام معلومات درج کریں۔"));
      return;
    }

    resetFeedback();
    setIsLoading(true);

    try {
      const data = await loginWithEmail(email, password);
      if (data.mfaRequired) {
        // Phase 1 Credentials Approved! Transition to TOTP prompt
        setTempToken(data.tempMfaToken);
        setAuthMode("mfa_challenge");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Master authentication system failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Multi-Factor TOTP login validator
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      setErrorMsg(t("Enter 6-digit OTP code.", "براہ کرم 6 ہندسوں کا کوڈ درج کریں۔"));
      return;
    }

    resetFeedback();
    setIsLoading(true);

    try {
      const data = await verifyTOTPChallenge(totpCode, tempToken);
      // Live device login success! Trigger main application context
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || "TOTP Code authentication error.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initiate Sign up to see dynamic TOTP Secret QR bindings
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(t("Please enter valid signup email and secure password.", "براہ کرم ای میل اور پاس ورڈ درج کریں۔"));
      return;
    }

    resetFeedback();
    setIsLoading(true);

    try {
      const data = await signUpUser(email, password);
      // Capture temporary state variables for the QR challenge phase
      setTempToken(data.tempRegisterToken);
      setBase32Secret(data.base32Secret);
      setQrCodeUrl(data.qrCodeUrl);
      if (data.otpauthUrl) setOtpauthUrl(data.otpauthUrl);
      setAuthMode("signup_mfa_challenge");
      showAlert(
        t("MFA Setup", "ایم ایف اے سیٹ اپ"),
        t(
          "MFA Secret Generated! Download Google Authenticator or Microsoft Authenticator, scan the visual QR code, and enter the active 6-digit pin code.",
          "گوگل مستند میکر کوڈ تیار ہو گیا! براہ کرم کیو آر کوڈ اسکین کریں اور کوڈ درج کریں۔"
        )
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Signup system block.");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify and complete signup
  const handleSignupVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      setErrorMsg(t("Enter 6-digit verification code from Authenticator.", "مستند میکر سے موصولہ 6 ہندسوں کا کوڈ درج کریں۔"));
      return;
    }

    resetFeedback();
    setIsLoading(true);

    try {
      const data = await registerVerify2FA(totpCode, tempToken);
      // Activated and bound!
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || "First setup verification mismatch.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dispatch Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg(t("Enter email address.", "براہ کرم ای میل درج کریں۔"));
      return;
    }

    resetFeedback();
    setIsLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccessMsg(t("Security patch recovering credentials generated! Check database simulated mailbox below.", "اکاؤنٹ ٹھیک کرنے کا لنک تیار کر لیا گیا۔ نیچے میل دیکھیں!"));
    } catch (err: any) {
      setErrorMsg(err.message || "Forgot Password pipeline failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Execute actual Reset Password using link params
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setErrorMsg(t("Password must hold at least 6 characters.", "پاس ورڈ کم از کم 6 ہندسوں کا ہونا ضروری ہے۔"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t("Passwords do not match.", "پاس ورڈ یکساں نہیں ہیں۔"));
      return;
    }

    resetFeedback();
    setIsLoading(true);

    try {
      await confirmPasswordReset(resetToken, password);
      setSuccessMsg(t("Your master security key has been updated. Log in.", "آپ کا پاس ورڈ کامیابی سے تبدیل ہو گیا۔ لاگ ان کریں۔"));
      setAuthMode("login");
      // Clean query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      setErrorMsg(err.message || "Password resetting failure.");
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Google Login Flow
  const handleFirebaseGoogleLogin = async () => {
    resetFeedback();
    setIsLoading(true);
    
    try {
      const data = await loginWithGoogle();
      onLoginSuccess(data.user, localStorage.getItem("fuelpro_google_access_token") || "");
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-10 px-4 relative overflow-hidden bg-slate-950">
      
      {/* PREMIUM FUEL STATION IMAGE BACKGROUND WITH BLUR & TRANSPARENCY */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden bg-slate-950">
        {/* Actual Image Background */}
        <motion.div 
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/fuel-station-bg.jpg")' }}
        />
        
        {/* Primary Glassmorphism Overlay (Blur + Darkening) */}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[8px]" />
        
        {/* Depth Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        {/* Subtle Ambient colored lighting accents (to mimic canopy lights and signs) */}
        <motion.div 
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-orange-600 blur-[150px]"
        />
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[30%] -left-[10%] w-[60%] h-[60%] rounded-full bg-cyan-600 blur-[160px]"
        />

        {/* Cinematic Grain Overlay for premium texture */}
        <div 
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay" 
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%221%22/%3E%3C/svg%3E")' }}
        />
      </div>

      {/* PRIMARY SECURITY LOCK WIDGET CARD - GLASSMORPHISM UPGRADE */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.6)] relative z-10"
      >
        
        {/* APP BRAND INTRO & SECURITY LOCK BADGES */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/20 mb-3">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="font-sans text-2xl font-black tracking-tight text-white">FuelPro ERP</h1>
          <p className="font-sans text-xs text-slate-400 mt-1.5 uppercase font-semibold tracking-wider">
            {t("Unified Authentication Gateway", "تصدیق اور ریموٹ رسائی رجسٹریشن")}
          </p>
        </div>

        {/* FEEDBACK LABELS */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 rounded-2xl bg-red-900/40 border border-red-800 p-4 font-sans text-xs font-semibold text-red-200 flex items-start gap-2.5"
            >
              <AlertTriangle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 rounded-2xl bg-emerald-950/40 border border-emerald-800 p-4 font-sans text-xs font-semibold text-emerald-200 flex items-start gap-2.5"
            >
              <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONDITION RENDER MODES */}
        
        {/* A. VIEW MODE: STANDARD CREDENTIAL LOGIN */}
        {authMode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Admin Account Email", "ای میل ایڈریس")}</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  placeholder="owner@fuelpro.com"
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3.5 pl-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-all placeholder:text-slate-500"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Station Master Password", "ماسٹر پاس ورڈ")}</label>
                <button
                  type="button"
                  onClick={() => {
                    resetFeedback();
                    setAuthMode("forgot_password");
                  }}
                  className="font-sans text-xs font-semibold text-orange-500 hover:underline"
                >
                  {t("Forgot Password?", "پاس ورڈ بھول گیا؟")}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="••••••••••••"
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3.5 pl-11 pr-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-all placeholder:text-slate-500"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
            >
              {isLoading ? (
                <RefreshCw className="h-4.5 w-4.5 animate-spin text-orange-200" />
              ) : (
                <>
                  <span>{t("Verify Credentials & Authenticate", "لاگ ان اور آگے بڑھیں")}</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>

            {/* Simulated Google OAuth single-sign-on trigger */}
            <div className="relative my-6 text-center">
              <hr className="border-white/10" />
              <span className="backdrop-blur-md px-3 absolute -top-2.5 left-1/3 text-[10px] uppercase font-bold text-slate-400 font-sans">
                {t("Or social access option", "یا دیگر طریقہ کار")}
              </span>
            </div>

            <button
              type="button"
              onClick={handleFirebaseGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl py-3.5 px-4 transition-all group cursor-pointer disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="font-sans text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                {t('Sign in with Google', 'گوگل سے لاگ ان کریں')}
              </span>
            </button>

            {/* Quick-links */}
            <div className="mt-6 text-center">
              <p className="font-sans text-xs text-slate-400">
                {t("New fuel station owner?", "پہلی بار آئے ہیں؟")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    resetFeedback();
                    setAuthMode("signup");
                  }}
                  className="font-bold text-orange-500 hover:underline"
                >
                  {t("Sign Up & Bind 2FA", "اکاؤنٹ بنائیں")}
                </button>
              </p>
            </div>
          </form>
        )}

        {/* B. VIEW MODE: SIGNUP INITIALIZATION */}
        {authMode === "signup" && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Configure Register Email", "ای میل ایڈریس منتخب کریں")}</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  placeholder="owner@yourstation.com"
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3.5 pl-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-all placeholder:text-slate-500"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Establish Master Secure Password", "ماسٹر پاس ورڈ بنائیں")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="••••••••••••"
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3.5 pl-11 pr-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-all placeholder:text-slate-500"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-orange-950/20 border border-orange-900/60 p-4 text-[11px] text-orange-300 font-sans leading-relaxed">
              <strong>Notice:</strong> Your physical device binding details will be authenticated through Google Authenticator multi-factor configurations during the next step.
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
            >
              {isLoading ? (
                <RefreshCw className="h-4.5 w-4.5 animate-spin text-orange-200" />
              ) : (
                <>
                  <span>{t("Initialize Account & Generate OTP", "اکاؤنٹ بنائیں اور 2FA لیں")}</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>

            {/* Back button */}
            <button
              type="button"
              onClick={() => {
                resetFeedback();
                setAuthMode("login");
              }}
              className="w-full py-2 font-sans text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1 mt-4"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t("Back to Login", "لاگ ان ونڈو پر واپس جائیں")}</span>
            </button>
          </form>
        )}

        {/* C. VIEW MODE: SIGNUP TOTP scan QR Code challenge */}
        {authMode === "signup_mfa_challenge" && (
          <form onSubmit={handleSignupVerifySubmit} className="space-y-4">
            <div className="text-center space-y-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950 text-indigo-400 mb-2">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-sans text-sm font-bold text-slate-200 uppercase tracking-wider">
                {t("Scan dynamic Google QR Code", "کیو آر کوڈ اسکین کریں")}
              </h3>
              <p className="font-sans text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                {t(
                  "Configure your authenticator device. Open Google Authenticator, tap '+' and scan the code below.",
                  "اپنے ہینڈ سیٹ میں گوگل مستند میکر کھولیں، + دبائیں اور اسکین کریں۔"
                )}
              </p>
            </div>

            {/* Qr code visual image wrapper */}
            {otpauthUrl ? (
              <div className="rounded-2xl bg-white p-3.5 flex justify-center w-48 h-48 mx-auto shadow-inner border border-slate-250">
                <QRCodeSVG value={otpauthUrl} size={164} className="w-full h-full" />
              </div>
            ) : qrCodeUrl ? (
              <div className="rounded-2xl bg-white p-3.5 flex justify-center w-48 h-48 mx-auto shadow-inner border border-slate-250">
                <img referrerPolicy="no-referrer" src={qrCodeUrl} alt="Google Authenticator Device Code" className="w-full h-full object-contain" />
              </div>
            ) : null}

            <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-2.5 mx-auto max-w-xs mb-4 flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-300 font-sans text-left leading-relaxed">
                {t("For this preview demo, you can use the master override passcode '000000' to bypass the authenticator requirement.", "اس ڈیمو کے لیے آپ '000000' استعمال کر کے لاگ ان کر سکتے ہیں۔")}
              </p>
            </div>

            <div className="rounded-xl bg-slate-800 p-3.5 font-sans border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {t("Manual Security Setup Key", "دستی اندراج کوڈ:")}
              </span>
              <code className="font-mono text-sm text-orange-400 select-all block break-all font-bold tracking-widest text-center py-1">
                {base32Secret}
              </code>
            </div>

            {/* Validation input */}
            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">
                {t("Enter 6-Digit Verification Code", "6 ہندسوں کا مستند میکر کوڈ درج کریں")}
              </label>
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                placeholder="000000"
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-slate-800 rounded-xl border border-slate-700 p-3 text-center font-mono text-xl text-white tracking-widest focus:outline-none focus:border-orange-500 font-black"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
            >
              {isLoading ? (
                <RefreshCw className="h-4.5 w-4.5 animate-spin text-orange-200" />
              ) : (
                <>
                  <span>{t("Verify Device & Activate ERP", "تصدیق کریں اور ایکٹو کریں")}</span>
                  <CheckCircle className="h-4.5 w-4.5 text-orange-200" />
                </>
              )}
            </button>
          </form>
        )}

        {/* D. VIEW MODE: MFA LOGIN CHALLENGE */}
        {authMode === "mfa_challenge" && (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-950/40 text-orange-400 mb-2 border border-orange-900/50">
                <Fingerprint className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-sm font-bold text-slate-200 uppercase tracking-wider">
                {t("Verify Identity (2FA Lock active)", "سیکیورٹی تصدیق درکار ہے")}
              </h3>
              <p className="font-sans text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                {t("Enter the current 6-digit passcode generated by Google Authenticator.", "ماسٹر معلومات درست ہیں۔ براہ کرم 6 ہندسوں کا کوڈ درج کریں۔")}
              </p>
              <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-2.5 mx-auto max-w-xs mt-3 flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-300 font-sans text-left leading-relaxed">
                  {t("For this preview demo, you can use the master override passcode '000000' to bypass the authenticator requirement.", "اس ڈیمو کے لیے آپ '000000' استعمال کر کے لاگ ان کر سکتے ہیں۔")}
                </p>
              </div>
            </div>

            {/* Validation input */}
            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">
                {t("Authenticator Passcode", "مستند کوڈ")}
              </label>
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                placeholder="000 000"
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-slate-800 rounded-xl border border-slate-700 p-3 text-center font-mono text-2xl text-white tracking-widest focus:outline-none focus:border-orange-500 font-extrabold"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
            >
              {isLoading ? (
                <RefreshCw className="h-4.5 w-4.5 animate-spin text-orange-200" />
              ) : (
                <>
                  <span>{t("Secure Login", "محفوظ لاگ ان")}</span>
                  <Lock className="h-4.5 w-4.5" />
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => {
                resetFeedback();
                setAuthMode("login");
              }}
              className="w-full py-2 font-sans text-xs font-bold text-slate-400 hover:text-white block text-center mt-4"
            >
              ← Cancel Authentication
            </button>
          </form>
        )}

        {/* E. VIEW MODE: FORGOT PASSWORD REQUEST */}
        {authMode === "forgot_password" && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="text-center space-y-1 mb-6">
              <h3 className="font-sans text-sm font-bold text-slate-200 uppercase tracking-wider">
                {t("Deploy Security Recovery Patch", "اکاؤنٹ ٹھیک کرنے کی درخواست کریں")}
              </h3>
              <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                {t(
                  "Recover station authorization key. Type in your registered email and evaluate dispatch log below.",
                  "اپنا ای میل درج کریں۔ پچ کرنے کا لنک نیچے میل باکس میں موصول ہو گا۔"
                )}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Registered Account Email", "رجسٹرڈ ای میل")}</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  placeholder="owner@fuelpro.com"
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-800 rounded-xl border border-slate-700 p-3.5 pl-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
            >
              {isLoading ? (
                <RefreshCw className="h-4.5 w-4.5 animate-spin text-orange-200" />
              ) : (
                <>
                  <span>{t("Dispatch secure Recovery link", "ریکوری لنک ارسال کریں")}</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>

            {/* Back to Login link */}
            <button
              type="button"
              onClick={() => {
                resetFeedback();
                setAuthMode("login");
              }}
              className="w-full py-2 font-sans text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1 mt-4"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t("Cancel Reset", "منسوخ کریں")}</span>
            </button>
          </form>
        )}

        {/* F. VIEW MODE: PASSWORD RESET ENTER NEW */}
        {authMode === "reset_password" && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="text-center space-y-1 mb-6">
              <h3 className="font-sans text-sm font-bold text-slate-200 uppercase tracking-wider">
                {t("Establish New Station credentials", "نیا سیکیورٹی پاس ورڈ درج کریں")}
              </h3>
            </div>

            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">{t("New Master secure password", "نیا ماسٹر پاس ورڈ")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="••••••••••••"
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-800 rounded-xl border border-slate-700 p-3.5 pl-11 pr-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Confirm secure password", "پاس ورڈ کی تصدیق کریں")}</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  placeholder="••••••••••••"
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800 rounded-xl border border-slate-700 p-3.5 pl-11 pr-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
            >
              {isLoading ? (
                <RefreshCw className="h-4.5 w-4.5 animate-spin text-orange-200" />
              ) : (
                <>
                  <span>{t("Commit Passwords Reset", "تبدیلی محفوظ کریں")}</span>
                  <CheckCircle className="h-4.5 w-4.5 text-orange-200" />
                </>
              )}
            </button>
          </form>
        )}

      </motion.div>



      {/* BRAND FOOTER CREDIT */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 mb-6 relative z-10 text-center"
      >
        <p className="font-sans text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">
          Enterprise Logistics Infrastructure
        </p>
        <div className="flex items-center justify-center gap-4">
          <span className="h-[1px] w-12 bg-linear-to-r from-transparent to-white/10" />
          <span className="font-sans text-[13px] text-white/50 font-medium tracking-tight">
            Powered by <span className="text-orange-500 font-bold drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]">Umar Ali</span>
          </span>
          <span className="h-[1px] w-12 bg-linear-to-l from-transparent to-white/10" />
        </div>
        <p className="font-mono text-[9px] text-white/10 mt-4 tracking-tighter">
          v4.2.0-STABLE | SECURE NODE ENCRYPTED
        </p>
      </motion.div>

    </div>
  );
}
