import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Droplets, Thermometer, Calculator, CheckCircle2,
  AlertTriangle, Info, ChevronDown, ChevronUp, FileDown
} from 'lucide-react';
import { GlobalSettings, Tank } from '../../../types';
import { fetchWithAuth } from '../../../lib/api';
import { formatCurrency } from '../../../lib/currency';

interface DipCalculatorProps {
  settings: GlobalSettings;
  tanks: Tank[];
}

interface DipResult {
  rawLiters: number;
  correctedLiters: number;
  temperatureCelsius: number;
  vcf: number;
  dipCm: number;
}

export default function DipCalculator({ settings, tanks }: DipCalculatorProps) {
  const [selectedTankId, setSelectedTankId] = useState(tanks[0]?.id || '');
  const [dipCm, setDipCm] = useState('');
  const [temperatureCelsius, setTemperatureCelsius] = useState('30');
  const [result, setResult] = useState<DipResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dipLog, setDipLog] = useState<Array<{
    tankName: string; dipCm: number; liters: number; temp: number; time: string
  }>>([]);
  const [showChart, setShowChart] = useState(false);

  const selectedTank = tanks.find(t => t.id === selectedTankId);
  const isUrdu = settings.language === 'ur';

  const calculate = async () => {
    if (!selectedTank || !dipCm) {
      setError(isUrdu ? 'ٹینک اور دپ ریڈنگ درج کریں' : 'Select a tank and enter dip reading');
      return;
    }

    if (!selectedTank.dipChart || selectedTank.dipChart.length < 2) {
      setError(isUrdu ? 'اس ٹینک کا دپ چارٹ دستیاب نہیں۔ سیٹنگز میں ٹینک کا دپ چارٹ شامل کریں۔' :
        'This tank has no dip chart configured. Add dip chart data in Settings > Tanks.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetchWithAuth('/api/dip-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dipCm: parseFloat(dipCm),
          dipChart: selectedTank.dipChart,
          temperatureCelsius: parseFloat(temperatureCelsius) || 30
        })
      });

      const data = await response.json();
      setResult(data);

      // Add to log
      setDipLog(prev => [{
        tankName: selectedTank.name,
        dipCm: parseFloat(dipCm),
        liters: data.correctedLiters,
        temp: data.temperatureCelsius,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)]);

    } catch {
      // Fallback: Calculate locally using interpolation
      const chart = [...selectedTank.dipChart].sort((a, b) => a.cm - b.cm);
      const cm = parseFloat(dipCm);
      const temp = parseFloat(temperatureCelsius) || 30;

      let lower = chart[0], upper = chart[chart.length - 1];
      for (let i = 0; i < chart.length - 1; i++) {
        if (cm >= chart[i].cm && cm <= chart[i + 1].cm) {
          lower = chart[i]; upper = chart[i + 1]; break;
        }
      }
      const ratio = upper.cm === lower.cm ? 0 : (cm - lower.cm) / (upper.cm - lower.cm);
      const liters = lower.liters + ratio * (upper.liters - lower.liters);
      const vcf = 1 - 0.00065 * (temp - 15);

      const localResult: DipResult = {
        rawLiters: Math.round(liters * 10) / 10,
        correctedLiters: Math.round(liters * vcf * 10) / 10,
        temperatureCelsius: temp,
        vcf: Math.round(vcf * 10000) / 10000,
        dipCm: cm
      };
      setResult(localResult);
      setDipLog(prev => [{
        tankName: selectedTank.name,
        dipCm: cm,
        liters: localResult.correctedLiters,
        temp,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)]);
    } finally {
      setLoading(false);
    }
  };

  const variance = result && selectedTank
    ? result.correctedLiters - selectedTank.currentStock
    : null;

  const variancePercent = variance && selectedTank?.currentStock
    ? (Math.abs(variance) / selectedTank.currentStock) * 100
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-main)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30">
            <Droplets className="h-7 w-7" />
          </div>
          <div>
            <span className="font-mono text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">
              UNIQUE FEATURE
            </span>
            <h1 className="font-sans text-2xl font-bold text-[var(--text-main)] tracking-tight">
              {isUrdu ? 'دپ چارٹ کیلکولیٹر' : 'Dip Chart Calculator'}
            </h1>
            <p className="font-sans text-sm text-[var(--text-muted)] mt-0.5">
              {isUrdu
                ? 'ATC درجہ حرارت اصلاح کے ساتھ ٹینک میں ایندھن کا درست حجم معلوم کریں'
                : 'Measure exact fuel volume with Automatic Temperature Correction (ATC) — ASTM standard'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-200">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <span className="font-sans text-xs font-bold text-blue-700">ASTM D1250 Standard</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calculator Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] shadow-sm p-6 space-y-4">
            <h3 className="font-sans text-sm font-bold text-[var(--text-main)] uppercase tracking-wide border-b border-[var(--border-main)] pb-3">
              {isUrdu ? 'ریڈنگ درج کریں' : 'Enter Dip Reading'}
            </h3>

            {/* Tank Selection */}
            <div>
              <label className="font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
                {isUrdu ? 'ٹینک منتخب کریں' : 'Select Tank'}
              </label>
              <select
                value={selectedTankId}
                onChange={e => { setSelectedTankId(e.target.value); setResult(null); }}
                className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-hover)] px-3 py-2.5 font-sans text-sm text-[var(--text-main)] focus:border-blue-500 focus:outline-none"
              >
                {tanks.length === 0 && <option value="">No tanks configured</option>}
                {tanks.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {selectedTank && (
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  System stock: <strong className="text-[var(--text-main)]">{selectedTank.currentStock.toLocaleString()} L</strong>
                  {' '}/ Capacity: {selectedTank.capacity.toLocaleString()} L
                </p>
              )}
            </div>

            {/* Dip Reading */}
            <div>
              <label className="font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">
                {isUrdu ? 'دپ ریڈنگ (سینٹی میٹر)' : 'Dip Reading (cm)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={dipCm}
                  onChange={e => setDipCm(e.target.value)}
                  placeholder="e.g., 185"
                  min="0"
                  step="0.1"
                  className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-hover)] px-3 py-2.5 pr-12 font-sans text-sm text-[var(--text-main)] focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-[var(--text-muted)]">cm</span>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="font-sans text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide block mb-1.5 flex items-center gap-1.5">
                <Thermometer className="h-3 w-3" />
                {isUrdu ? 'درجہ حرارت (°C)' : 'Temperature (°C)'}
              </label>
              <input
                type="number"
                value={temperatureCelsius}
                onChange={e => setTemperatureCelsius(e.target.value)}
                min="-10"
                max="60"
                step="0.5"
                className="w-full rounded-xl border border-[var(--border-main)] bg-[var(--bg-hover)] px-3 py-2.5 font-sans text-sm text-[var(--text-main)] focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Reference temp: 15°C. Current Pakistan avg: ~30-40°C in summer.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="font-sans text-xs text-rose-700">{error}</p>
              </div>
            )}

            <button
              onClick={calculate}
              disabled={loading || !selectedTankId || !dipCm}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 font-sans text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Calculator className="h-4 w-4" />
              {loading ? (isUrdu ? 'حساب لگایا جا رہا ہے...' : 'Calculating...') : (isUrdu ? 'حجم معلوم کریں' : 'Calculate Volume')}
            </button>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="font-sans text-xs text-blue-800 space-y-1">
              <p className="font-bold">What is ATC?</p>
              <p>Automatic Temperature Correction adjusts fuel volume to 15°C reference. At higher temperatures, fuel expands — meaning you could have <em>fewer</em> actual liters than the dip suggests.</p>
              <p className="font-bold mt-1">VCF Formula: 1 - 0.00065 × (T - 15)</p>
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              {/* Main Result */}
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-blue-100 mb-3">
                  ATC CORRECTED VOLUME RESULT
                </p>
                <div className="flex items-end gap-3">
                  <span className="font-mono text-5xl font-black tracking-tight">
                    {result.correctedLiters.toLocaleString()}
                  </span>
                  <span className="font-sans text-xl font-bold text-blue-200 mb-1">Liters</span>
                </div>
                <p className="text-blue-100 text-sm mt-2">
                  Dip: {result.dipCm} cm @ {result.temperatureCelsius}°C → VCF: {result.vcf}
                </p>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-main)] p-4">
                  <p className="font-mono text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Raw Volume</p>
                  <p className="font-mono text-2xl font-black text-[var(--text-main)]">{result.rawLiters.toLocaleString()} L</p>
                  <p className="font-sans text-xs text-[var(--text-muted)] mt-1">Before temp correction</p>
                </div>
                <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-main)] p-4">
                  <p className="font-mono text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Temp Adjustment</p>
                  <p className={`font-mono text-2xl font-black ${result.rawLiters - result.correctedLiters >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {result.rawLiters - result.correctedLiters >= 0 ? '-' : '+'}{Math.abs(result.rawLiters - result.correctedLiters).toFixed(1)} L
                  </p>
                  <p className="font-sans text-xs text-[var(--text-muted)] mt-1">Due to temperature</p>
                </div>
              </div>

              {/* Variance vs System Stock */}
              {selectedTank && variance !== null && (
                <div className={`rounded-xl p-4 border ${Math.abs(variancePercent) < 1
                  ? 'bg-emerald-50 border-emerald-200'
                  : Math.abs(variancePercent) < 3
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-rose-50 border-rose-200'
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {Math.abs(variancePercent) < 1 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    <h4 className={`font-sans text-sm font-bold ${Math.abs(variancePercent) < 1 ? 'text-emerald-800' : 'text-amber-800'}`}>
                      Variance vs System Stock
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-mono text-lg font-black text-[var(--text-main)]">{selectedTank.currentStock.toLocaleString()}</p>
                      <p className="font-sans text-[10px] text-[var(--text-muted)]">System Stock</p>
                    </div>
                    <div>
                      <p className="font-mono text-lg font-black text-blue-600">{result.correctedLiters.toLocaleString()}</p>
                      <p className="font-sans text-[10px] text-[var(--text-muted)]">Physical Dip</p>
                    </div>
                    <div>
                      <p className={`font-mono text-lg font-black ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {variance >= 0 ? '+' : ''}{variance.toFixed(1)} L
                      </p>
                      <p className="font-sans text-[10px] text-[var(--text-muted)]">Variance</p>
                    </div>
                  </div>
                  {Math.abs(variancePercent) >= 1 && (
                    <p className="font-sans text-xs mt-3 text-amber-700">
                      ⚠️ Variance of {variancePercent.toFixed(1)}% detected. Consider investigating for evaporation loss, meter drift, or short delivery.
                    </p>
                  )}
                </div>
              )}

              {/* Tank Dip Chart Toggle */}
              {selectedTank?.dipChart && selectedTank.dipChart.length > 0 && (
                <button
                  onClick={() => setShowChart(!showChart)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span className="font-sans text-sm font-bold text-[var(--text-main)]">View Dip Chart Table ({selectedTank.dipChart.length} entries)</span>
                  {showChart ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}

              {showChart && selectedTank?.dipChart && (
                <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[var(--bg-hover)]">
                        <tr>
                          <th className="px-4 py-2 text-left font-bold text-[var(--text-muted)] uppercase tracking-wider">Depth (cm)</th>
                          <th className="px-4 py-2 text-right font-bold text-[var(--text-muted)] uppercase tracking-wider">Volume (L)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTank.dipChart.sort((a, b) => a.cm - b.cm).map((entry, i) => (
                          <tr key={i} className={`border-t border-[var(--border-main)] ${Math.abs(entry.cm - parseFloat(dipCm)) < 2 ? 'bg-blue-50' : ''}`}>
                            <td className="px-4 py-1.5 font-mono text-[var(--text-main)]">{entry.cm}</td>
                            <td className="px-4 py-1.5 font-mono text-right text-[var(--text-main)]">{entry.liters}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-hover)] text-center p-8">
              <Droplets className="h-12 w-12 text-blue-200 mb-4" />
              <h3 className="font-sans text-base font-bold text-[var(--text-main)]">
                {isUrdu ? 'دپ ریڈنگ درج کریں' : 'Enter a Dip Reading'}
              </h3>
              <p className="font-sans text-sm text-[var(--text-muted)] mt-2 max-w-xs">
                Select your tank, enter the measured dip in centimeters, and get the ATC-corrected fuel volume instantly.
              </p>
            </div>
          )}

          {/* Dip Reading Log */}
          {dipLog.length > 0 && (
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border-main)] flex items-center justify-between">
                <h3 className="font-sans text-sm font-bold text-[var(--text-main)]">Session Dip Log</h3>
                <span className="font-mono text-xs text-[var(--text-muted)]">{dipLog.length} readings</span>
              </div>
              <div className="divide-y divide-[var(--border-main)]">
                {dipLog.map((entry, i) => (
                  <div key={i} className="px-5 py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-sans text-xs font-bold text-[var(--text-main)]">{entry.tankName}</span>
                      <span className="font-mono text-xs text-[var(--text-muted)] ml-2">{entry.dipCm} cm @ {entry.temp}°C</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-blue-600">{entry.liters.toLocaleString()} L</span>
                      <span className="font-mono text-[9px] text-[var(--text-muted)] ml-2">{entry.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
