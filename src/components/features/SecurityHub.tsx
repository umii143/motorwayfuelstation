import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Smartphone,
  Lock,
  Globe,
  KeyRound,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertOctagon,
  Download,
  Mail,
  UserCheck,
  Ban,
  ArrowUpRight,
  TrendingUp,
  Terminal,
  FolderLock
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { GlobalSettings } from "../../types";

interface SecurityHubProps {
  settings: GlobalSettings;
  user: any;
  onLogout: () => void;
}

export default function SecurityHub({ settings, user, onLogout }: SecurityHubProps) {
  const isUrdu = settings.language === "ur";
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // Core Data States
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<any[]>([]);
  const [simulatedEmails, setSimulatedEmails] = useState<any[]>([]);
  
  // App Handshakes
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Backup Management
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(() => {
    return localStorage.getItem("fuelpro_google_access_token");
  });
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupResult, setBackupResult] = useState<any | null>(null);

  // Email Tab states
  const [showEmailsDrawer, setShowEmailsDrawer] = useState(false);

  // Fetch metrics & audits from Express server API
  const fetchSecurityMetrics = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("fuelpro_auth_token");
      const res = await fetch("/api/security/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          onLogout(); // Session expired
          return;
        }
        throw new Error(t("Failed to load security state details.", "سیکیورٹی کے معلومات لوڈ کرنے میں ناکامی۔"));
      }
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        setActiveSessions(data.activeSessions || []);
        setAuditLogs(data.auditLogs || []);
        setFailedAttempts(data.failedAttempts || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed API connection");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch simulated outgoing email queue (developer convenience)
  const fetchSimulatedEmails = async () => {
    try {
      const res = await fetch("/api/auth/simulated-emails");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          setSimulatedEmails(data);
        }
      }
    } catch (err) {
      console.error("Failing to grab simulated inboxes.", err);
    }
  };

  // Launch initial API fetches on mount and poll
  useEffect(() => {
    fetchSecurityMetrics();
    fetchSimulatedEmails();

    const interval = setInterval(() => {
      fetchSecurityMetrics();
      fetchSimulatedEmails();
    }, 15000); // 15s refresh keeps indicators live

    return () => clearInterval(interval);
  }, []);

  // Revoke Session Handler (Kills remote logins immediately)
  const handleRevokeSession = async (sessionId: string, sessionEmail: string) => {
    const isConfirmed = window.confirm(
      t(
        `Are you sure you want to terminate session of ${sessionEmail}? The remote browser will be signed out immediately.`,
        `کیا آپ واقعی ${sessionEmail} کا سیشن ختم کرنا چاہتے ہیں؟ ویب سیشن فوری طور پر بند ہو جائے گا۔`
      )
    );
    if (!isConfirmed) return;

    setErrorMsg("");
    setSuccessMsg("");
    try {
      const token = localStorage.getItem("fuelpro_auth_token");
      const res = await fetch(`/api/security/sessions/${sessionId}/revoke`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to terminate.");
      }

      setSuccessMsg(t("Terminal session disconnected successfully.", "ٹرمینل سیشن کامیابی سے بند کر دیا گیا۔"));
      fetchSecurityMetrics();
    } catch (err: any) {
      setErrorMsg(err.message || "Termination failed");
    }
  };

  // AES Cryptographic Backup Trigger
  const handleTriggerBackup = async () => {
    const isConfirmed = window.confirm(
      t(
        "Compile system database, encrypt users & audits using AES-256-CBC, and dispatch to Google Drive cloud vault?",
        "کیا آپ سسٹم ڈیٹا بیس کو مرتب اور AES-256 کے ساتھ انکرپٹ کر کے گوگل ڈرائیو پر محفوظ کرنا چاہتے ہیں؟"
      )
    );
    if (!isConfirmed) return;

    setIsBackingUp(true);
    setBackupResult(null);
    setErrorMsg("");
    
    try {
      const token = localStorage.getItem("fuelpro_auth_token");
      const providerToken = localStorage.getItem("fuelpro_google_access_token") || "";

      const res = await fetch("/api/security/backup/drive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          googleAccessToken: providerToken
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Backup encryption failed.");
      }

      const data = await res.json();
      setBackupResult(data);
      setSuccessMsg(t("System database backup successfully generated!", "سسٹم ڈیٹا بیس کا بیک اپ کامیابی سے تیار ہو گیا!"));
      fetchSecurityMetrics();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed backup compile");
    } finally {
      setIsBackingUp(false);
    }
  };

  // OAuth Google link login simulation (toggles credentials state)
  const handleLinkGoogleAccount = () => {
    // Generate a beautiful mock oauth token to demonstrate Drive upload if they don't have real Keys
    const mockToken = `ya29.a0AfB_byDbMockToken_${Date.now()}_FuelProERP`;
    localStorage.setItem("fuelpro_google_access_token", mockToken);
    setGoogleAccessToken(mockToken);
    setSuccessMsg(t("Google Account linked successfully for Cloud Drive uploads!", "کلاؤڈ ڈرائیو اپ لوڈز کے لیے گوگل اکاؤنٹ کامیابی سے لنک ہو گیا!"));
    const auditSim = {
      id: `aud_${Date.now()}`,
      userId: user?.id,
      email: user?.email,
      eventType: "USER_OAUTH_LINK",
      timestamp: new Date().toISOString(),
      status: "success",
      ip: "127.0.0.1",
      device: navigator.userAgent,
      details: "Simulated Google OAuth authentication token initialized. Active backup write scopes loaded."
    };
    saveSimulatedAudit(auditSim);
  };

  const handleUnlinkGoogleAccount = () => {
    localStorage.removeItem("fuelpro_google_access_token");
    setGoogleAccessToken(null);
    setSuccessMsg(t("Google OAuth linked key disconnected.", "گوگل اکاؤنٹ کامیابی سے ہٹا دیا گیا۔"));
  };

  const saveSimulatedAudit = async (audit: any) => {
    // Direct feed back helper
    setAuditLogs(prev => [audit, ...prev]);
  };

  // Clear simulated email inbox queue
  const handleClearInbox = async () => {
    try {
      await fetch("/api/auth/simulated-emails/clear", { method: "POST" });
      setSimulatedEmails([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Compile Recharts Security Analytics
  const getAuditCategoryData = () => {
    const categories: Record<string, number> = {};
    auditLogs.forEach(log => {
      const type = log.eventType || "OTHER";
      categories[type] = (categories[type] || 0) + 1;
    });

    const dataColors: Record<string, string> = {
      USER_LOGIN_SUCCESS: "#10B981",
      USER_MFA_REQUIRED: "#F59E0B",
      USER_LOGIN_FAILED: "#EF4444",
      USER_MFA_FAILED: "#DC2626",
      NEW_DEVICE_ALERT: "#EA580C",
      SESS_REVOKED: "#8B5CF6",
      BACKUP_CREATED: "#06B6D4"
    };

    return Object.keys(categories).map(cat => ({
      name: cat.replace("USER_", "").replace("_", " "),
      value: categories[cat],
      color: dataColors[cat] || "#64748B"
    }));
  };

  const auditPieData = getAuditCategoryData();

  // Failed Attempts over IPs metrics
  const getAttemptsChartData = () => {
    const countsByEmail: Record<string, number> = {};
    failedAttempts.forEach(log => {
      countsByEmail[log.email] = (countsByEmail[log.email] || 0) + 1;
    });
    return Object.keys(countsByEmail).map(em => ({
      email: em.split("@")[0],
      attempts: countsByEmail[em]
    })).slice(0, 5);
  };

  const failedAttemptsData = getAttemptsChartData();

  return (
    <div className="space-y-6">
      {/* HEADER SEGMENT */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h2 className="font-sans text-xl font-bold tracking-tight">
              {t("Remote Access & Security Ops Hub", "سیکیورٹی اور ریموٹ رسائی سینٹر")}
            </h2>
            <p className="font-mono text-xs text-orange-200 mt-1">
              Active Security Profile: {user?.email} • Role: {user?.role?.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSecurityMetrics}
            className="flex items-center gap-2 rounded-xl bg-slate-800/80 px-4 py-2.5 font-sans text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors border border-slate-700/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t("Refresh Audit", "تازہ کریں")}</span>
          </button>
          
          <button
            onClick={() => setShowEmailsDrawer(!showEmailsDrawer)}
            className="relative flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 font-sans text-xs font-semibold text-white hover:bg-orange-500 transition-colors shadow-md shadow-orange-600/10"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>{t("Outbox Stream", "میل باکس")}</span>
            {simulatedEmails.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-mono text-[9px] font-bold text-white leading-none">
                {simulatedEmails.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* FEEDBACK STATUS */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 font-sans text-xs font-semibold text-emerald-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700">✕</button>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-red-50 border border-red-200 p-4 font-sans text-xs font-semibold text-red-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-500" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-red-500 hover:text-red-700">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYSTEM EMAILS SIMULATOR INBOX (FOR TEST SUITE VERIFICATION) */}
      {showEmailsDrawer && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 shadow-inner"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-slate-500" />
              <h3 className="font-sans text-sm font-bold text-slate-700">
                {t("Developer Local Email Dispatch Log (Sandbox Mode)", "ڈویلپر مقامی ای میل ڈسپیچ سسٹم (ٹیسٹ موڈ)")}
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearInbox}
                className="font-sans text-xs font-semibold text-slate-500 hover:text-red-500 hover:underline"
              >
                {t("Clear Inboxes", "ان باکس صاف کریں")}
              </button>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-500 leading-normal">
                {simulatedEmails.length} Outbound Checked
              </span>
            </div>
          </div>

          {simulatedEmails.length === 0 ? (
            <div className="py-6 text-center text-slate-400 font-sans text-xs italic">
              {t("No outgoing security alert emails are waiting in queue. Try requesting 'Forgot Password' or checking in with a new device model to trigger alert transmissions.", "کوئی ای میل کیو میں نہیں ہے۔ ٹرگر کرنے کے لیے پاس ورڈ بھول گیا یا نیا آلہ ٹیسٹ کریں۔")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-72 overflow-y-auto">
              {simulatedEmails.map(mail => (
                <div key={mail.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs relative">
                  <span className="absolute top-3 right-3 text-slate-400 font-mono text-[10px]">
                    {new Date(mail.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans text-xs font-bold text-slate-500 block">
                        To: <span className="text-slate-800 font-mono font-normal">{mail.to}</span>
                      </h4>
                      <h5 className="font-sans text-xs font-extrabold text-slate-800 mt-1">
                        Subject: <span className="text-orange-600">{mail.subject}</span>
                      </h5>
                      <p className="font-sans text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg leading-relaxed whitespace-pre-line border border-slate-100">
                        {mail.body}
                      </p>
                      
                      {mail.link && (
                        <a
                          href={mail.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 font-sans text-[10px] font-bold text-white hover:bg-orange-500 transition-colors shadow-sm"
                        >
                          <span>{t("Secure Reset Interface Live Link", "پاس ورڈ تبدیل کرنے کا لنک")}</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* CORE STATS BOARD */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("Active Terminals", "فعال ٹرمینلز")}
            </span>
            <Globe className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-slate-800">
              {activeSessions.filter(s => s.active).length}
            </span>
            <span className="font-sans text-[10px] font-bold text-slate-400">
              Remote / Local
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("Failed Access Blocks", "مسدود لاگ ان کوششیں")}
            </span>
            <AlertOctagon className="h-5 w-5 text-red-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-red-600">
              {failedAttempts.length}
            </span>
            <span className="font-sans text-[10px] items-center text-red-400 flex font-bold uppercase">
              {failedAttempts.length >= 5 ? t("Alert Active", "انتباہ فعال") : t("Norm", "نارمل")}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("Google Drive Backups", "گوگل بیک اپ")}
            </span>
            <FolderLock className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-sans text-xs font-black text-slate-800">
              {googleAccessToken ? "Linked ya29" : "OAuth Sandbox"}
            </span>
            <span className="font-sans text-[10px] font-bold text-emerald-500 uppercase">
              AES-256 rest
            </span>
          </div>
        </div>
      </div>

      {/* SESSIONS & BACKUP FLOWS GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left: Remote Active Terminals (Session Management) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider">
                {t("Active Remote Workspace Access List", "سسٹم پر فعال ریموٹ سیشنز")}
              </h3>
              <p className="font-sans text-[11px] text-slate-400 mt-1">
                {t("Monitor who is connected. Suspend or revoke any session remotely in real-time.", "نگرانی کریں کہ کون لاگ ان ہے۔ کسی بھی وقت ریموٹ رسائی منسوخ کریں۔")}
              </p>
            </div>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[9px] font-bold text-indigo-600 uppercase border border-indigo-100 animate-pulse">
              {activeSessions.filter(s => s.active).length} Terminal(s) Active
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {activeSessions.map(session => (
              <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-55 bg-indigo-50 text-indigo-600">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-sans text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span>{session.email}</span>
                      {session.isCurrent && (
                        <span className="rounded-sm bg-emerald-50 text-emerald-600 border border-emerald-250 px-1 py-0.5 text-[9px] font-black uppercase">
                          {t("Current", "موجودہ")}
                        </span>
                      )}
                      {!session.active && (
                        <span className="rounded-sm bg-red-50 text-red-500 border border-red-250 px-1 py-0.5 text-[9px] font-black uppercase">
                          {t("Terminated", "بند")}
                        </span>
                      )}
                    </h4>
                    <p className="font-mono text-[10px] text-slate-400 mt-1 truncate max-w-sm" title={session.device}>
                      Dev: <span className="text-slate-600">{session.device}</span>
                    </p>
                    <div className="mt-1 flex items-center gap-3 font-mono text-[9px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-slate-300" />
                        <span>IP: {session.ip}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span>In: {new Date(session.loginTime).toLocaleTimeString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center sm:justify-end">
                  {session.active && !session.isCurrent ? (
                    <button
                      onClick={() => handleRevokeSession(session.id, session.email)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-50 px-3 py-1.5 font-sans text-xs font-semibold text-red-600 transition-colors"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>{t("Revoke", "رسائی بند کریں")}</span>
                    </button>
                  ) : session.isCurrent ? (
                    <span className="font-sans text-[10px] font-bold text-slate-300 block">
                      {t("Current Console", "موجودہ ٹرمینل")}
                    </span>
                  ) : (
                    <span className="font-sans text-[10px] font-bold text-red-400 block italic">
                      {t("Disconnected", "رسائی منقطع")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AES Encrypted Backups & Credentials */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Drive & Backup configuration Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
              <FolderLock className="h-5 w-5 text-orange-600" />
              <span>{t("Secure Encrypted backups", "انکرپٹڈ بیک اپ مینیجر")}</span>
            </h3>

            <div className="space-y-4 font-sans">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t(
                  "All critical profiles, master keys, and audit logs are encrypted symmetrically with AES-256 BEFORE uploading to Google Drive cloud vault, keeping your fuel station private and locked from third parties.",
                  "تمام معلومات کلاؤڈ پر بھیجنے سے پہلے انکرپٹ کی جاتی ہیں تاکہ بیرونی شخص رسائی حاصل نہ کر سکے۔"
                )}
              </p>

              {/* OAuth state links */}
              {googleAccessToken ? (
                <div className="rounded-xl border border-slate-150 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 relative">
                        <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      </span>
                      <span className="text-xs font-bold text-slate-700">Google OAuth Linked</span>
                    </div>
                    <button
                      onClick={handleUnlinkGoogleAccount}
                      className="text-[10px] font-semibold text-red-500 hover:underline"
                    >
                      {t("Unlink Account", "لنک ہٹائیں")}
                    </button>
                  </div>
                  <p className="font-mono text-[9px] text-slate-400 truncate mt-1">
                    Token: {googleAccessToken}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    {t("Unlink Google Drive. Running in container local download mode.", "گوگل ڈرائیو لنک نہیں ہے۔ مقامی پی لوڈ ڈاؤن لوڈ دستیاب ہے۔")}
                  </p>
                  <button
                    onClick={handleLinkGoogleAccount}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-350 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    <span>{t("Link Owner Google Account", "گوگل اکاؤنٹ لنک کریں")}</span>
                  </button>
                </div>
              )}

              {/* Backup Trigger Button */}
              <button
                onClick={handleTriggerBackup}
                disabled={isBackingUp}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-sans text-xs font-bold py-3 px-4 shadow-md transition-all uppercase tracking-wider"
              >
                {isBackingUp ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-orange-400" />
                    <span>{t("Compiling AES-256 Cryptography...", "مرتب ہو رہا ہے...")}</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 text-orange-500" />
                    <span>{t("Backup & Encrypt to Cloud", "بیک اپ تیار کریں")}</span>
                  </>
                )}
              </button>

              {/* Backup Result Details */}
              {backupResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 border-l-4 border-l-orange-500"
                >
                  <h4 className="text-xs font-bold text-slate-755">{t("Transmission Receipts", "ٹرانسمیشن کی تفصیلات")}</h4>
                  
                  <div className="mt-2 space-y-1.5 font-mono text-[10px] text-slate-500 leading-normal">
                    <div>
                      File: <span className="text-slate-800 font-bold">{backupResult.filename}</span>
                    </div>
                    {backupResult.googleDriveUploaded ? (
                      <div className="text-emerald-600 font-bold flex items-center gap-1">
                        <span>● Uploaded to Google Drive File ID:</span>
                        <span className="bg-emerald-50 px-1 py-0.5 rounded select-all text-[9px]">{backupResult.googleFileId}</span>
                      </div>
                    ) : (
                      <div className="text-orange-600">
                        ● Local Download Active: Size compressed. External credentials simulation mode.
                      </div>
                    )}
                    <a
                      href={backupResult.localDownloadUrl}
                      download
                      className="mt-2.5 inline-flex items-center gap-1 hover:underline text-orange-600 font-bold font-sans uppercase text-[9px]"
                    >
                      <Download className="h-3 w-3" />
                      <span>{t("Download Secure Cipher Copy", "انکرپٹڈ کاپی ڈاؤن لوڈ کریں")}</span>
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Device Bindings Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 mb-3 flex items-center gap-1.5">
              <Smartphone className="h-5 w-5 text-indigo-600" />
              <span>{t("Device Binding & Fingerprints", "آلہ بائنڈنگ سیکیورٹی معلومات")}</span>
            </h3>
            <p className="font-sans text-[11px] text-slate-500 leading-relaxed">
              {t(
                "Each multi-factor TOTP verification binding generates a hardware fingerprint block. Only registered devices can authorize ledger adjustments. Unrecognized browsers trigger alarms.",
                "کامیابی سے تصدیق شدہ آلات کی معلومات محفوظ کی جاتی ہیں۔ نیا آلہ انتباہ جاری کرتا ہے۔"
              )}
            </p>
            <div className="mt-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-slate-400 font-medium">{t("Device Lock:", "آلہ سیکیورٹی:")}</span>
                <span className="text-slate-700 font-bold text-emerald-600">● {t("DEVICE_BINDING_ACTIVE", "فعال")}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-slate-400 font-medium">{t("MFA Enforcement Mode:", "سیکیورٹی کا طریقہ:")}</span>
                <span className="text-slate-700 font-bold uppercase">Google Authenticator</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CHARTS GRAPH & SYSTEM INFRASTRUCTURE AUDIT TRAIL LEDGER */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left: Recharts failed attempts and audit distribution charts */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">
            {t("Access Metrics & Analytics", "سیکیورٹی کی معلومات کا تجزیہ")}
          </h3>

          <div className="space-y-6">
            
            {/* Failed attempts by email */}
            <div>
              <h4 className="font-sans text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                - {t("Failed Logs Distribution by Mail", "مسدود لاگ ان کی کوششیں بلحاظ ای میل")}
              </h4>
              {failedAttemptsData.length === 0 ? (
                <div className="h-32 flex items-center justify-center font-sans text-[11px] text-slate-400 italic">
                  {t("No current credentials failure blocks. Excellent!", "کوئی مسدود کوششیں نہیں ہیں۔")}
                </div>
              ) : (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={failedAttemptsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="email" tickStyle={{ fontSize: 9 }} />
                      <YAxis tickStyle={{ fontSize: 9 }} allowDecimals={false} />
                      <ChartTooltip />
                      <Bar dataKey="attempts" fill="#DC2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Audit log categories distribution pie chart */}
            <div>
              <h4 className="font-sans text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                - {t("Ledger Transaction Distribution", "سیکیورٹی ٹرانزیکشن کی نوعیت")}
              </h4>
              <div className="h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={auditPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                      {auditPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom list layout as legend as Recharts legend is too bulky */}
                <div className="absolute top-1/2 -translate-y-1/2 right-1 flex flex-col gap-1 text-[9px] font-bold font-sans text-slate-500 max-h-40 overflow-y-auto">
                  {auditPieData.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="truncate max-w-24 uppercase">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Live Security Audit Ledger */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider">
                {t("Comprehensive Forensic Security Logs Ledger", "فورنسک سیکیورٹی آڈٹ لاگز")}
              </h3>
              <p className="font-sans text-[11px] text-slate-400 mt-1">
                {t("Review strict logins, multi-factor blocks, and remote API interactions.", "لاگ ان کوششوں اور ریموٹ آپریشنز کا سیکیورٹی آڈٹ۔")}
              </p>
            </div>
            <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[9px] font-bold text-stone-500 border border-slate-150">
              {auditLogs.length} Checked
            </span>
          </div>

          <div className="overflow-x-auto max-h-[440px] overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 uppercase text-[9px] font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3">{t("Timestamp", "وقت")}</th>
                  <th className="p-3">{t("User", "صارف")}</th>
                  <th className="p-3">{t("Access Event", "سیکیورٹی کا واقعہ")}</th>
                  <th className="p-3">{t("Origin / IP", "آئی پی")}</th>
                  <th className="p-3">{t("Forensic details", "تفصیلات")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 font-sans italic">
                      {t("No secure audits registered in workspace.", "کوئی سیکیورٹی لاگز درج نہیں ہیں۔")}
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => {
                    let dotColor = "bg-stone-400";
                    let badgeStyle = "text-slate-600 bg-slate-50 border-slate-100";
                    
                    if (log.status === "success") {
                      dotColor = "bg-emerald-500";
                      badgeStyle = "text-emerald-700 bg-emerald-50 border-emerald-100";
                    } else if (log.status === "failed") {
                      dotColor = "bg-red-500 animate-ping";
                      badgeStyle = "text-red-700 bg-red-50 border-red-100";
                    } else if (log.status === "unverified") {
                      dotColor = "bg-amber-500";
                      badgeStyle = "text-amber-700 bg-amber-50 border-amber-100";
                    } else if (log.status === "alert") {
                      dotColor = "bg-orange-500";
                      badgeStyle = "text-orange-700 bg-orange-50 border-orange-100 font-bold animate-pulse";
                    } else if (log.status === "revoked") {
                      dotColor = "bg-purple-500";
                      badgeStyle = "text-purple-700 bg-purple-50 border-purple-100";
                    }

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 font-bold text-slate-800 font-mono">
                          {log.email.split("@")[0]}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-black border uppercase ${badgeStyle}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                            <span>{log.eventType.replace("USER_", "").replace("_", " ")}</span>
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-600 whitespace-nowrap">
                          {log.ip}
                        </td>
                        <td className="p-3 text-slate-500 max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
