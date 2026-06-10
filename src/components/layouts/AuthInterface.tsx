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

interface AuthInterfaceProps {
  settings: GlobalSettings;
  onLoginSuccess: (user: any, token: string) => void;
}

type AuthMode =
  | "login"
  | "signup"
  | "verify_email_pending"
  | "forgot_password"
  | "mfa_challenge"
  | "reset_password";

export default function AuthInterface({ settings, onLoginSuccess }: AuthInterfaceProps) {
  const { showAlert } = useStation();
  const {
    loginWithEmail,
    loginWithGoogle,
    signUpUser,
    verifyTOTPChallenge,
    sendPasswordReset,
    confirmPasswordReset,
    resendVerificationEmail,
    checkEmailVerified,
    pendingVerification
  } = useAuth();
  const isUrdu = settings.language === "ur";
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  const [authMode, setAuthMode] = useState<AuthMode>("login");

  // Core inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Token state
  const [tempToken, setTempToken] = useState("");
  const [resetToken, setResetToken] = useState("");

  // UX feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); // email displayed on verification screen
  const [verifiedEmail, setVerifiedEmail] = useState("");


  // Detect ?verified=1 redirect from Firebase verification link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("verified") === "1") {
      setSuccessMsg(t(
        "Email verified! Please sign in to activate your account.",
        "ای میل تصدیق ہو گئی! براہ کرم لاگ ان کریں۔"
      ));
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = urlParams.get("token");
    if (token) {
      setResetToken(token);
      setAuthMode("reset_password");
      setSuccessMsg(t(
        "Reset link recognized. Enter your new password below.",
        "لنک سے ریکوری ٹوکن موصول ہو گیا۔ نیا پاسورڈ درج کریں۔"
      ));
    }
  }, []);

  // If the context reports a pending verification (e.g., after page refresh), show that screen
  useEffect(() => {
    if (pendingVerification) {
      setAuthMode("verify_email_pending");
    }
  }, [pendingVerification]);

  const resetFeedback = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(t("Please fill in all credentials.", "براہ کرم تمام معلومات درج کریں۔"));
      return;
    }
    resetFeedback();
    setIsLoading(true);
    try {
      const data = await loginWithEmail(email, password);
      if (data?.emailNotVerified) {
        setVerifiedEmail(email);
        setAuthMode("verify_email_pending");
        setSuccessMsg(t(
          "A new verification email has been sent. Please check your inbox.",
          "نئی تصدیقی ای میل بھیج دی گئی۔ براہ کرم ان باکس چیک کریں۔"
        ));
      } else if (data?.mfaRequired) {
        setTempToken(data.tempMfaToken);
        setAuthMode("mfa_challenge");
      }
      // onAuthStateChanged handles the rest (profile load → onLoginSuccess)
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed.");
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
      return;
    }
    resetFeedback();
    setIsLoading(true);
    try {
      const data = await verifyTOTPChallenge(totpCode, tempToken);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || "TOTP Code authentication error.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNUP — Firebase Email Verification
  // ─────────────────────────────────────────────────────────────────────────
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg(t("Please enter a valid email and password.", "براہ کرم ای میل اور پاس ورڈ درج کریں۔"));
      return;
    }
    if (password.length < 6) {
      setErrorMsg(t("Password must be at least 6 characters.", "پاس ورڈ کم از کم 6 حروف کا ہونا ضروری ہے۔"));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(t("Passwords do not match.", "پاس ورڈ یکساں نہیں ہیں۔"));
      return;
    }
    resetFeedback();
    setIsLoading(true);
    try {
      const data = await signUpUser(email, password);
      if (data?.verificationEmailSent) {
        setVerifiedEmail(data.email);
        setAuthMode("verify_email_pending");
        setSuccessMsg(t(
          `Verification email sent to ${data.email}. Click the link in your inbox to activate your account.`,
          `تصدیقی ای میل ${data.email} پر بھیج دی گئی۔ اپنے ان باکس میں لنک پر کلک کریں۔`
        ));
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Sign up failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EMAIL VERIFICATION PENDING SCREEN — actions
  // ─────────────────────────────────────────────────────────────────────────
  const handleResendVerification = async () => {
    setIsLoading(true);
    resetFeedback();
    try {
      await resendVerificationEmail();
      setSuccessMsg(t(
        "Verification email resent. Check your Gmail inbox (and spam folder).",
        "تصدیقی ای میل دوبارہ بھیج دی گئی۔ ان باکس اور اسپام چیک کریں۔"
      ));
    } catch (err: any) {
      setErrorMsg(err.message || "Could not resend verification email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    resetFeedback();
    try {
      const verified = await checkEmailVerified();
      if (verified) {
        setSuccessMsg(t(
          "Email verified! Signing you in…",
          "ای میل تصدیق ہو گئی! لاگ ان ہو رہا ہے…"
        ));
        // onAuthStateChanged will fire automatically after the user signs back in.
        // Just show the login form so they can sign in with their credentials.
        setTimeout(() => {
          setAuthMode("login");
          setSuccessMsg(t(
            "✅ Email verified! Please sign in with your credentials.",
            "✅ ای میل تصدیق ہو گئی! اب لاگ ان کریں۔"
          ));
        }, 1500);
      } else {
        setErrorMsg(t(
          "Email not yet verified. Please click the link in your Gmail inbox first.",
          "ای میل ابھی تصدیق نہیں ہوئی۔ براہ کرم پہلے ان باکس میں لنک پر کلک کریں۔"
        ));
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Verification check failed.");
    } finally {
      setIsCheckingVerification(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD — Firebase native reset email
  // ─────────────────────────────────────────────────────────────────────────
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg(t("Enter your registered email address.", "براہ کرم ای میل درج کریں۔"));
      return;
    }
    resetFeedback();
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccessMsg(t(
        `Password reset email sent to ${email}. Click the link in your Gmail inbox to set a new password.`,
        `${email} پر پاسورڈ ری سیٹ ای میل بھیج دی گئی۔ ان باکس میں لنک پر کلک کریں۔`
      ));
    } catch (err: any) {
      setErrorMsg(err.message || "Forgot Password request failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RESET PASSWORD (from link ?token=...)
  // ─────────────────────────────────────────────────────────────────────────
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setErrorMsg(t("Password must be at least 6 characters.", "پاس ورڈ کم از کم 6 حروف کا ہونا ضروری ہے۔"));
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
      setSuccessMsg(t("Password updated successfully! Please sign in.", "پاس ورڈ کامیابی سے بدل گیا۔ لاگ ان کریں۔"));
      setAuthMode("login");
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err: any) {
      setErrorMsg(err.message || "Password reset failed.");
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
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in failed.");
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
          className="absolute top-[30%] -left-[10%] w-[60%] h-[60%] rounded-full bg-cyan-600 blur-[160px]"
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

        {/* ── A. LOGIN ── */}
        {authMode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("Admin Account Email", "ای میل ایڈریس")}
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

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t("Password", "پاس ورڈ")}
                </label>
                <button
                  type="button"
                  onClick={() => { resetFeedback(); setAuthMode("forgot_password"); }}
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
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
            >
              {isLoading
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <><span>{t("Sign In", "لاگ ان کریں")}</span><ArrowRight className="h-4 w-4" /></>
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

            <div className="mt-6 text-center">
              <p className="font-sans text-xs text-slate-400">
                {t("New station owner? ", "پہلی بار آئے ہیں؟ ")}
                <button
                  type="button"
                  onClick={() => { resetFeedback(); setEmail(""); setPassword(""); setConfirmPassword(""); setAuthMode("signup"); }}
                  className="font-bold text-orange-500 hover:underline"
                >
                  {t("Create Account", "اکاؤنٹ بنائیں")}
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ── B. SIGNUP ── */}
        {authMode === "signup" && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("Email Address", "ای میل ایڈریس")}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  placeholder="owner@yourstation.com"
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3.5 pl-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-all placeholder:text-slate-500"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("Password", "پاس ورڈ")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Min. 6 characters"
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3.5 pl-11 pr-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-all placeholder:text-slate-500"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("Confirm Password", "پاس ورڈ دوبارہ")}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  placeholder="••••••••••••"
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-3.5 pl-11 pr-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 focus:bg-white/10 transition-all placeholder:text-slate-500"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Info notice */}
            <div className="rounded-xl bg-blue-950/30 border border-blue-900/50 p-3.5 text-[11px] text-blue-300 font-sans leading-relaxed flex items-start gap-2.5">
              <MailCheck className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
              <span>
                {t(
                  "After signing up, a verification link will be sent to your Gmail. Click it to activate your account — no OTP needed.",
                  "اکاؤنٹ بنانے کے بعد آپ کی جی میل پر ایک تصدیقی لنک بھیجا جائے گا۔ اسے کلک کریں اور اکاؤنٹ فعال کریں۔"
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
            >
              {isLoading
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <><span>{t("Create Account & Send Verification", "اکاؤنٹ بنائیں")}</span><SendHorizontal className="h-4 w-4" /></>
              }
            </button>

            <button
              type="button"
              onClick={() => { resetFeedback(); setAuthMode("login"); }}
              className="w-full py-2 font-sans text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1 mt-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t("Back to Login", "لاگ ان پر واپس")}</span>
            </button>
          </form>
        )}

        {/* ── C. EMAIL VERIFICATION PENDING ── */}
        {authMode === "verify_email_pending" && (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-950/40 border border-orange-700/50 text-orange-400 mx-auto"
              >
                <MailCheck className="h-8 w-8" />
              </motion.div>
              <h3 className="font-sans text-base font-bold text-white">
                {t("Check Your Gmail Inbox", "اپنا جی میل ان باکس چیک کریں")}
              </h3>
              <p className="font-sans text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {t(
                  "We sent a verification link to your email address. Click the link to activate your FuelPro account.",
                  "آپ کی ای میل پر ایک تصدیقی لنک بھیجا گیا ہے۔ اپنا اکاؤنٹ فعال کرنے کے لیے لنک پر کلک کریں۔"
                )}
              </p>
              {verifiedEmail && (
                <div className="inline-flex items-center gap-2 bg-slate-800/60 rounded-xl px-4 py-2 border border-slate-700/50">
                  <Mail className="h-3.5 w-3.5 text-orange-400" />
                  <span className="font-mono text-xs text-orange-300 font-bold">{verifiedEmail}</span>
                </div>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-2.5">
              {[
                t("Open your Gmail inbox", "اپنا جی میل ان باکس کھولیں"),
                t('Find the email from "FuelPro ERP" or "noreply@…"', '"FuelPro ERP" کی ای میل تلاش کریں'),
                t("Click the verification link inside the email", "ای میل میں تصدیقی لنک پر کلک کریں"),
                t('Return here and click "I\'ve Verified My Email"', 'واپس آ کر نیچے بٹن دبائیں')
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-800/40 rounded-xl px-4 py-2.5 border border-slate-700/30">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                  <span className="font-sans text-[11px] text-slate-300">{step}</span>
                </div>
              ))}
            </div>

            {/* Primary CTA */}
            <button
              onClick={handleCheckVerification}
              disabled={isCheckingVerification}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
            >
              {isCheckingVerification
                ? <><RefreshCw className="h-4 w-4 animate-spin" /><span>{t("Checking…", "جانچ ہو رہی ہے…")}</span></>
                : <><CheckCircle className="h-4 w-4" /><span>{t("I've Verified My Email", "میں نے تصدیق کر لی")}</span></>
              }
            </button>

            {/* Resend */}
            <button
              onClick={handleResendVerification}
              disabled={isLoading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-sans text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {isLoading
                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                : <SendHorizontal className="h-3.5 w-3.5" />
              }
              <span>{t("Resend Verification Email", "تصدیقی ای میل دوبارہ بھیجیں")}</span>
            </button>

            <button
              type="button"
              onClick={() => { resetFeedback(); setAuthMode("login"); }}
              className="w-full py-2 font-sans text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{t("Back to Login", "لاگ ان پر واپس")}</span>
            </button>
          </div>
        )}

        {/* ── D. MFA CHALLENGE (existing TOTP users) ── */}
        {authMode === "mfa_challenge" && (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-950/40 text-orange-400 mb-2 border border-orange-900/50">
                <Fingerprint className="h-6 w-6" />
              </div>
              <h3 className="font-sans text-sm font-bold text-slate-200 uppercase tracking-wider">
                {t("Two-Factor Authentication", "دو مرحلہ تصدیق")}
              </h3>
              <p className="font-sans text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                {t("Enter the 6-digit code from your Authenticator app.", "مستند میکر ایپ سے 6 ہندسوں کا کوڈ درج کریں۔")}
              </p>
            </div>
            <div className="space-y-1.5">
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                placeholder="000000"
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-slate-800 rounded-xl border border-slate-700 p-3 text-center font-mono text-2xl text-white tracking-widest focus:outline-none focus:border-orange-500 font-extrabold"
              />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider">
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><span>{t("Verify", "تصدیق کریں")}</span><KeyRound className="h-4 w-4" /></>}
            </button>
            <button type="button" onClick={() => { resetFeedback(); setAuthMode("login"); }} className="w-full py-2 font-sans text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1">
              <ChevronLeft className="h-4 w-4" /><span>{t("Cancel", "منسوخ")}</span>
            </button>
          </form>
        )}

        {/* ── E. FORGOT PASSWORD ── */}
        {authMode === "forgot_password" && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="text-center space-y-1 mb-6">
              <h3 className="font-sans text-sm font-bold text-slate-200 uppercase tracking-wider">
                {t("Reset Password", "پاس ورڈ ری سیٹ کریں")}
              </h3>
              <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                {t(
                  "Enter your registered email. Firebase will send a secure password reset link to your Gmail.",
                  "اپنی رجسٹرڈ ای میل درج کریں۔ فائربیس آپ کی جی میل پر ری سیٹ لنک بھیجے گا۔"
                )}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Registered Email", "رجسٹرڈ ای میل")}</label>
              <div className="relative">
                <input type="email" value={email} placeholder="owner@fuelpro.com" onChange={e => setEmail(e.target.value)} className="w-full bg-slate-800 rounded-xl border border-slate-700 p-3.5 pl-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 transition-colors" />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider">
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><span>{t("Send Reset Link to Gmail", "ری سیٹ لنک بھیجیں")}</span><SendHorizontal className="h-4 w-4" /></>}
            </button>
            <button type="button" onClick={() => { resetFeedback(); setAuthMode("login"); }} className="w-full py-2 font-sans text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1 mt-2">
              <ChevronLeft className="h-4 w-4" /><span>{t("Back to Login", "لاگ ان پر واپس")}</span>
            </button>
          </form>
        )}

        {/* ── F. RESET PASSWORD (from link) ── */}
        {authMode === "reset_password" && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="text-center space-y-1 mb-6">
              <h3 className="font-sans text-sm font-bold text-slate-200 uppercase tracking-wider">
                {t("Set New Password", "نیا پاس ورڈ درج کریں")}
              </h3>
            </div>
            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">{t("New Password", "نیا پاس ورڈ")}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} placeholder="••••••••••••" onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 rounded-xl border border-slate-700 p-3.5 pl-11 pr-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 transition-colors" />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Confirm Password", "پاس ورڈ کی تصدیق")}</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} placeholder="••••••••••••" onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-800 rounded-xl border border-slate-700 p-3.5 pl-11 pr-11 font-mono text-xs text-white focus:outline-none focus:border-orange-500 transition-colors" />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full mt-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white font-sans text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider">
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><span>{t("Update Password", "پاس ورڈ اپ ڈیٹ کریں")}</span><CheckCircle className="h-4 w-4" /></>}
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
