/**
 * FuelPro — Supplier Intelligence Center
 * Live supplier performance scoring from batch + claim data
 * Powered by Umar Ali ⚡ | Motorway Petroleum, Mardan KPK
 */
import React, { useMemo, useState } from 'react';
import {
  Star, TrendingUp, TrendingDown, Award, AlertTriangle,
  Truck, BarChart2, Package, CheckCircle, XCircle,
  ChevronDown, ChevronUp, ShieldCheck, Zap, Crown
} from 'lucide-react';
import { StockBatch, Supplier, SupplierClaim } from '../../../types';
import { calculateSupplierScore } from '../../../services/fifoEngine';

interface SupplierScorecardProps {
  suppliers: Supplier[];
  batches: StockBatch[];
  supplierClaims: SupplierClaim[];
  language: string;
}

interface LiveSupplierMetrics {
  supplier: Supplier;
  deliveries: number;
  onTime: number;
  totalQtyShort: number;
  totalQtyDelivered: number;
  claimsRaised: number;
  claimsResolved: number;
  avgMargin: number;
  marginStdDeviation: number;
  qualityIssues: number;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: string;
  lastDelivery?: string;
  totalExposure: number;
  shortagePercent: number;
  claimRecoveryPct: number;
  avgResolutionDays: number;
}

function computeLiveSupplierMetrics(
  supplier: Supplier,
  batches: StockBatch[],
  claims: SupplierClaim[]
): LiveSupplierMetrics {
  const supplierBatches = batches.filter(b => b.supplierId === supplier.id);
  const supplierClaims = claims.filter(c => c.supplierId === supplier.id);

  const deliveries = supplierBatches.length;
  const totalQtyDelivered = supplierBatches.reduce((s, b) => s + b.qtyReceived, 0);
  const totalQtyShort = supplierBatches.reduce((s, b) => s + (b.qtyShort || 0), 0);

  // Timeliness: batches where delivery happened within 24hrs of expected (simplification: all counted)
  const onTime = supplierBatches.filter(b => !b.sealStatus || b.sealStatus === 'ok').length;

  // Claims
  const claimsRaised = supplierClaims.length;
  const claimsResolved = supplierClaims.filter(c =>
    c.status === 'recovered' || c.status === 'approved' || c.status === 'partial'
  ).length;

  // Margin analysis
  const margins = supplierBatches
    .map(b => b.expectedBatchMarginPerLiter ?? b.grossMarginPerLiter ?? 0)
    .filter(m => m > 0);
  const avgMargin = margins.length > 0 ? margins.reduce((s, m) => s + m, 0) / margins.length : 0;
  const variance = margins.length > 1
    ? margins.reduce((s, m) => s + Math.pow(m - avgMargin, 2), 0) / margins.length
    : 0;
  const marginStdDeviation = Math.sqrt(variance);

  // Quality issues: seal broken + adulteration + quarantined
  const qualityIssues = supplierBatches.filter(b =>
    b.sealStatus === 'broken' || b.sealStatus === 'missing' || b.qualityStatus === 'quarantined'
  ).length + supplierClaims.filter(c =>
    c.claimType === 'quality' || c.claimType === 'adulteration' || c.claimType === 'seal_broken'
  ).length;

  // Score
  const { score, grade, recommendation } = calculateSupplierScore({
    deliveries, onTime, totalQtyShort, totalQtyDelivered,
    claimsRaised, claimsResolved, avgMargin, marginStdDeviation, qualityIssues,
  });

  // Extras
  const lastDelivery = supplierBatches
    .map(b => b.deliveryDate || b.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  const totalExposure = supplierBatches.reduce((s, b) => s + (b.invoiceTotalAmount || 0), 0);
  const shortagePercent = totalQtyDelivered > 0 ? (totalQtyShort / totalQtyDelivered) * 100 : 0;

  const totalClaimAmount = supplierClaims.reduce((s, c) => s + c.claimAmount, 0);
  const totalRecovered = supplierClaims.reduce((s, c) => s + c.recoveredAmount, 0);
  const claimRecoveryPct = totalClaimAmount > 0 ? (totalRecovered / totalClaimAmount) * 100 : 100;

  // Avg resolution days
  const resolvedClaims = supplierClaims.filter(c => c.resolvedDate);
  const avgResolutionDays = resolvedClaims.length > 0
    ? resolvedClaims.reduce((s, c) => {
        const raised = new Date(c.raisedDate).getTime();
        const resolved = new Date(c.resolvedDate!).getTime();
        return s + (resolved - raised) / (1000 * 60 * 60 * 24);
      }, 0) / resolvedClaims.length
    : 0;

  return {
    supplier, deliveries, onTime, totalQtyShort, totalQtyDelivered,
    claimsRaised, claimsResolved, avgMargin, marginStdDeviation, qualityIssues,
    score, grade, recommendation, lastDelivery, totalExposure,
    shortagePercent, claimRecoveryPct, avgResolutionDays,
  };
}

const GRADE_CONFIG: Record<string, { bg: string; text: string; ring: string; label: string; icon: React.ElementType }> = {
  A: { bg: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-300', label: 'Excellent', icon: Crown },
  B: { bg: 'bg-blue-500',    text: 'text-white', ring: 'ring-blue-300',    label: 'Good',      icon: Star },
  C: { bg: 'bg-amber-500',   text: 'text-white', ring: 'ring-amber-300',   label: 'Average',   icon: BarChart2 },
  D: { bg: 'bg-orange-500',  text: 'text-white', ring: 'ring-orange-300',  label: 'Poor',      icon: AlertTriangle },
  F: { bg: 'bg-red-600',     text: 'text-white', ring: 'ring-red-300',     label: 'Critical',  icon: XCircle },
};

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG['C'];
  const GradeIcon = cfg.icon;
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative size-24 flex items-center justify-center">
      <svg className="size-24 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="38" stroke="#f1f5f9" strokeWidth="8" fill="none" />
        <circle
          cx="44" cy="44" r="38" fill="none" strokeWidth="8"
          stroke={grade === 'A' ? '#10b981' : grade === 'B' ? '#3b82f6' : grade === 'C' ? '#f59e0b' : grade === 'D' ? '#f97316' : '#dc2626'}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-800 leading-none">{score}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">/ 100</span>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-slate-500 font-medium">{label}</span>
        <span className="text-[11px] font-bold text-slate-700">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export default function SupplierScorecard({ suppliers, batches, supplierClaims, language }: SupplierScorecardProps) {
  const t = (en: string, ur: string) => language === 'ur' ? ur : en;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    return suppliers
      .map(s => computeLiveSupplierMetrics(s, batches, supplierClaims))
      .filter(m => m.deliveries > 0) // Only show suppliers with deliveries
      .sort((a, b) => b.score - a.score);
  }, [suppliers, batches, supplierClaims]);

  const topSupplier = metrics[0];
  const worstSupplier = metrics[metrics.length - 1];

  // Fleet-wide stats
  const totalExposure = metrics.reduce((s, m) => s + m.totalExposure, 0);
  const totalShortLiters = metrics.reduce((s, m) => s + m.totalQtyShort, 0);
  const openClaims = supplierClaims.filter(c => c.status === 'pending' || c.status === 'submitted').length;

  if (metrics.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
        <Award className="size-12 mx-auto text-slate-200 mb-3" />
        <p className="font-bold text-slate-400">{t('No supplier delivery data yet', 'سپلائر ڈیلیوری ڈیٹا موجود نہیں')}</p>
        <p className="text-xs text-slate-400 mt-1">{t('Add stock batches to see supplier scores.', 'اسکور دیکھنے کیلئے اسٹاک بیچ شامل کریں۔')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fleet Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('Rated Suppliers', 'رینک شدہ سپلائرز'), value: metrics.length, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: t('Total Exposure', 'کل خرید رقم'), value: `Rs.${(totalExposure / 1000000).toFixed(1)}M`, icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: t('Total Qty Short', 'کل کم وصول'), value: `${totalShortLiters.toLocaleString()}L`, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: t('Open Claims', 'کھلے کلیمز'), value: openClaims, icon: ShieldCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((s, i) => (
          <div key={i} className="premium-card border border-slate-200 p-4 flex items-center ga">
            <div className={`size-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`size-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{s.label}</p>
              <p className="text-lg font-black text-slate-800 leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top + Worst Supplier Banner */}
      {metrics.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Primary Recommendation */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="size-4 text-yellow-300" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-100">
                {t('Primary Supplier Recommendation', 'اہم سپلائر')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black">
                {topSupplier.grade}
              </div>
              <div>
                <p className="font-black text-lg leading-tight">{topSupplier.supplier.name}</p>
                <p className="text-emerald-200 text-xs font-semibold">{topSupplier.score}/100 · {GRADE_CONFIG[topSupplier.grade]?.label}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-emerald-100 leading-relaxed">{topSupplier.recommendation}</p>
          </div>
          {/* Warning supplier */}
          {worstSupplier.grade !== 'A' && worstSupplier.grade !== 'B' && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="size-4 text-red-500" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-red-600">
                  {t('Performance Warning', 'کارکردگی انتباہ')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`size-12 rounded-full flex items-center justify-center text-2xl font-black text-white ${GRADE_CONFIG[worstSupplier.grade]?.bg}`}>
                  {worstSupplier.grade}
                </div>
                <div>
                  <p className="font-black text-slate-800">{worstSupplier.supplier.name}</p>
                  <p className="text-slate-500 text-xs font-semibold">{worstSupplier.score}/100 · {GRADE_CONFIG[worstSupplier.grade]?.label}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-red-700 leading-relaxed">{worstSupplier.recommendation}</p>
            </div>
          )}
        </div>
      )}

      {/* Ranked Supplier Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Award className="size-4" />
          {t('Supplier Performance Rankings', 'سپلائر کارکردگی رینکنگ')}
        </h3>

        {metrics.map((m, rank) => {
          const cfg = GRADE_CONFIG[m.grade];
          const GradeIcon = cfg.icon;
          const isExpanded = expandedId === m.supplier.id;

          // Per-metric scores for breakdown bars
          const timelinessScore = m.deliveries > 0 ? (m.onTime / m.deliveries) * 100 : 0;
          const shortageScore = Math.max(0, 100 - m.shortagePercent * 100);
          const claimScore = m.claimsRaised === 0 ? 100 : (m.claimsResolved / m.claimsRaised) * 100;
          const marginScore = m.marginStdDeviation < 0.5 ? 100 : Math.max(0, 100 - m.marginStdDeviation * 20);
          const qualityScore = m.qualityIssues === 0 ? 100 : Math.max(0, 100 - m.qualityIssues * 20);

          return (
            <div key={m.supplier.id} className="premium-card border overflow-hidden hover:shadow-md transition-shadow">
              {/* Main row */}
              <div
                className="p-4 flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : m.supplier.id)}
              >
                {/* Rank badge */}
                <div className={`size-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  rank === 0 ? 'bg-yellow-400 text-yellow-900' : rank === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-700'
                }`}>
                  #{rank + 1}
                </div>

                {/* Score ring */}
                <ScoreRing score={m.score} grade={m.grade} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-800 text-base">{m.supplier.name}</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${cfg.bg} ${cfg.text}`}>
                      <GradeIcon className="size-3" />
                      {m.grade} — {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.recommendation}</p>

                  {/* Mini metric bars */}
                  <div className="hidden sm:grid grid-cols-1 sm:grid-cols-5 gap-2 mt-2">
                    <MetricBar label="Timeliness" value={timelinessScore} color="bg-blue-500" />
                    <MetricBar label="Shortage" value={shortageScore} color="bg-emerald-500" />
                    <MetricBar label="Claims" value={claimScore} color="bg-purple-500" />
                    <MetricBar label="Margin" value={marginScore} color="bg-orange-500" />
                    <MetricBar label="Quality" value={qualityScore} color="bg-teal-500" />
                  </div>
                </div>

                {/* Summary stats */}
                <div className="hidden xl:flex items-center gap-4 text-xs shrink-0">
                  <div className="text-center">
                    <p className="text-slate-400 font-semibold">Deliveries</p>
                    <p className="font-black text-slate-800 text-lg">{m.deliveries}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 font-semibold">Qty Short</p>
                    <p className={`font-black text-lg ${m.totalQtyShort > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {m.totalQtyShort > 0 ? `-${m.totalQtyShort.toLocaleString()}L` : '✅ None'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 font-semibold">Claims</p>
                    <p className={`font-black text-lg ${m.claimsRaised > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {m.claimsRaised}
                    </p>
                  </div>
                </div>

                {isExpanded ? <ChevronUp className="size-4 text-slate-400 shrink-0" /> : <ChevronDown className="size-4 text-slate-400 shrink-0" />}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Total Delivered', value: `${m.totalQtyDelivered.toLocaleString()}L`, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
                      { label: 'Qty Short', value: `${m.totalQtyShort.toLocaleString()}L`, color: m.totalQtyShort > 0 ? 'text-red-700' : 'text-emerald-700', bg: m.totalQtyShort > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100' },
                      { label: 'Shortage %', value: `${m.shortagePercent.toFixed(2)}%`, color: m.shortagePercent > 1 ? 'text-red-700' : 'text-emerald-700', bg: 'bg-white border-slate-200' },
                      { label: 'Claims Raised', value: m.claimsRaised, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
                      { label: 'Claims Resolved', value: m.claimsResolved, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
                      { label: 'Recovery Rate', value: `${m.claimRecoveryPct.toFixed(0)}%`, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
                      { label: 'Avg Margin/L', value: `Rs.${m.avgMargin.toFixed(2)}`, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
                      { label: 'Margin StdDev', value: m.marginStdDeviation.toFixed(3), color: m.marginStdDeviation > 1 ? 'text-red-700' : 'text-emerald-700', bg: 'bg-white border-slate-200' },
                      { label: 'Quality Issues', value: m.qualityIssues, color: m.qualityIssues > 0 ? 'text-red-700' : 'text-emerald-700', bg: m.qualityIssues > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100' },
                      { label: 'Total Exposure', value: `Rs.${(m.totalExposure / 1000).toFixed(0)}K`, color: 'text-slate-700', bg: 'bg-white border-slate-200' },
                      { label: 'Avg Resolution', value: m.avgResolutionDays > 0 ? `${m.avgResolutionDays.toFixed(0)} days` : 'N/A', color: 'text-slate-700', bg: 'bg-white border-slate-200' },
                      { label: 'Last Delivery', value: m.lastDelivery ? new Date(m.lastDelivery).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : 'N/A', color: 'text-slate-700', bg: 'bg-white border-slate-200' },
                    ].map((item, i) => (
                      <div key={i} className={`rounded-xl p-3 border ${item.bg} text-xs`}>
                        <p className="text-slate-400 font-semibold mb-0.5">{item.label}</p>
                        <p className={`font-black text-base ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Metric bars full */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Performance Breakdown (weighted)</p>
                    <MetricBar label={`Timeliness (25%) — ${timelinessScore.toFixed(0)}%`} value={timelinessScore} color="bg-blue-500" />
                    <MetricBar label={`Short-Qty Score (25%) — ${shortageScore.toFixed(0)}%`} value={shortageScore} color="bg-emerald-500" />
                    <MetricBar label={`Claim Resolution (20%) — ${claimScore.toFixed(0)}%`} value={claimScore} color="bg-purple-500" />
                    <MetricBar label={`Margin Consistency (20%) — ${marginScore.toFixed(0)}%`} value={marginScore} color="bg-orange-500" />
                    <MetricBar label={`Quality Assurance (10%) — ${qualityScore.toFixed(0)}%`} value={qualityScore} color="bg-teal-500" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
