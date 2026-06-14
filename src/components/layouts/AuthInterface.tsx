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
  KeyRound,
  CheckCircle,
  ChevronLeft,
  Eye,
  EyeOff,
  MailCheck,
  SendHorizontal
} from "lucide-react";
import { GlobalSettings } from "../../types";
import { useStation } from "../../contexts/StationContext";
import { PoweredByUmarAli } from "../shared/PoweredByUmarAli";
import { NativeHaptics } from '../../services/hardware/Haptics';

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
    verifyTOTPChallenge,
    requestOTP,
    verifyOTP
  } = useAuth();
  const isUrdu = settings.language === "ur";
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [authMode, setAuthMode] = useState<AuthMode>("email_otp_request");

  // Core inputs
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [totpCode, setTotpCode] = useState("");

  // Token state
  const [tempToken, setTempToken] = useState("");

  // UX feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); // email displayed on verification screen
  const [verifiedEmail, setVerifiedEmail] = useState("");


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

  // ─────────────────────────────────────────────────────────────────────────
  // EMAIL OTP FLOW
  // ─────────────────────────────────────────────────────────────────────────
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg(t("Please enter your email.", "براہ کرم اپنی ای میل درج کریں۔"));
      NativeHaptics.error();
      return;
    }
    resetFeedback();
    setIsLoading(true);
    try {
      await requestOTP(email);
      setAuthMode("email_otp_verify");
      setSuccessMsg(t(
        `A 6-digit OTP has been sent to ${email}.`,
        `آپ کی ای میل پر ایک 6 ہندسوں کا OTP بھیج دیا گیا ہے۔`
      ));
      NativeHaptics.success();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send OTP.");
      NativeHaptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg(t("Please enter the 6-digit OTP.", "براہ کرم 6 ہندسوں کا OTP درج کریں۔"));
      NativeHaptics.error();
      return;
    }
    resetFeedback();
    setIsLoading(true);
    try {
      // The verifyOTP function uses signInWithCustomToken internally
      // and onAuthStateChanged will handle the rest.
      await verifyOTP(email, otpCode);
      NativeHaptics.success();
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid OTP or expired.");
      NativeHaptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MFA (TOTP) — kept for existing users who have TOTP enabled
  // ─────────────────────────────────────────────────────────────────────────
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length < 6) {
      setErrorMsg(t("Enter 6-digit OTP code.", "براہ کرم 6 ہندسوں کا کوڈ درج کریں۔"));
      NativeHaptics.error();
      return;
    }
    resetFeedback();
    setIsLoading(true);
    try {
      const data = await verifyTOTPChallenge(totpCode, tempToken);
      onLoginSuccess(data.user, data.token);
      NativeHaptics.success();
    } catch (err: any) {
      setErrorMsg(err.message || "TOTP Code authentication error.");
      NativeHaptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // GOOGLE LOGIN
  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-10 px-4 relative overflow-hidden bg-slate-950">

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden bg-slate-950">
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/fuel-station-bg.jpg")' }}
        />
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[8px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <motion.div
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-orange-600 blur-[150px]"
        />
        <motion.div
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[30%] -left-[10%] w-[60%] h-[60%] rounded-full bg-amber-600 blur-[160px]"
        />
      </div>

      {/* CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-8 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.6)] relative z-10"
      >
        {/* BRAND */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/20 mb-3">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="font-sans text-2xl font-black tracking-tight text-white">FuelPro ERP</h1>
          <p className="font-sans text-xs text-slate-400 mt-1.5 uppercase font-semibold tracking-wider">
            {t("Unified Authentication Gateway", "تصدیق اور ریموٹ رسائی رجسٹریشن")}
          </p>
        </div>

        {/* FEEDBACK */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 rounded-2xl bg-red-900/40 border border-red-800 p-4 font-sans text-xs font-semibold text-red-200 flex items-start gap-2.5"
            >
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              key="success"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 rounded-2xl bg-emerald-950/40 border border-emerald-800 p-4 font-sans text-xs font-semibold text-emerald-200 flex items-start gap-2.5"
            >
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── A. EMAIL OTP REQUEST ── */}
        {authMode === "email_otp_request" && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("Email Address", "ای میل ایڈریس")}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  placeholder="owner@fuelpro.com"
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3.5 pl-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-all placeholder:text-slate-500"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
            >
              {isLoading
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <><span>{t("Continue with Email", "ای میل کے ساتھ جاری رکھیں")}</span><ArrowRight className="h-4 w-4" /></>
              }
            </button>

            {/* Google */}
            <div className="relative my-6 text-center">
              <hr className="border-white/10" />
              <span className="backdrop-blur-md px-3 absolute -top-2.5 left-1/3 text-[10px] uppercase font-bold text-slate-400 font-sans">
                {t("Or", "یا")}
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
                {t("Sign in with Google", "گوگل سے لاگ ان کریں")}
              </span>
            </button>
          </form>
        )}

        {/* ── B. EMAIL OTP VERIFY ── */}
        {authMode === "email_otp_verify" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950/40 text-emerald-400 mb-2 border border-emerald-900/50">
                <MailCheck className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-sm font-bold text-slate-200 uppercase tracking-wider">
                {t("Check Your Inbox", "اپنا ان باکس چیک کریں")}
              </h3>
              <p className="font-sans text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                {t(`Enter the 6-digit code sent to ${email}`, `${email} پر بھیجا گیا 6 ہندسوں کا کوڈ درج کریں`)}
              </p>
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                placeholder="000000"
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-slate-800 rounded-xl border border-slate-700 p-3 text-center font-mono text-2xl text-white tracking-widest focus:outline-none focus:border-orange-500 font-extrabold"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
            >
              {isLoading
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <><span>{t("Verify OTP", "او ٹی پی کی تصدیق کریں")}</span><CheckCircle className="h-4 w-4" /></>
              }
            </button>

            <button
              type="button"
              onClick={() => { resetFeedback(); setAuthMode("email_otp_request"); setOtpCode(""); }}
              className="w-full py-2 font-sans text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1 mt-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t("Change Email", "ای میل تبدیل کریں")}</span>
            </button>
          </form>
        )}


      </motion.div>

      {/* FOOTER */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 flex flex-col items-center justify-center z-10">
        <PoweredByUmarAli variant="full" showLogo={false} className="text-white/60 w-full" />
        <p className="font-sans text-[10px] text-slate-600 uppercase tracking-widest mt-2">
          FuelPro ERP · Secured by Firebase · AES-256 Encrypted at Rest
        </p>
      </motion.div>
    </div>
  );
}
