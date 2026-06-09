import React, { useState } from 'react';
import { Droplet, Thermometer, CheckCircle2, XCircle, Beaker } from 'lucide-react';
import { GlobalSettings } from '../../types';
import { t } from '../../lib/translations';

interface FuelQualityHubProps {
  settings: GlobalSettings;
}

export default function FuelQualityHub({ settings }: FuelQualityHubProps) {
  const [productType, setProductType] = useState<'PMG' | 'HSD'>('PMG');
  const [invoiceDensity, setInvoiceDensity] = useState<string>('');
  const [observedDensity, setObservedDensity] = useState<string>('');
  const [observedTemp, setObservedTemp] = useState<string>('');

  const [result, setResult] = useState<{
    converted_density_15C: number;
    variance: number;
    quality_status: string;
  } | null>(null);

  const calculateQuality = () => {
    const invDensity = parseFloat(invoiceDensity);
    const obsDensity = parseFloat(observedDensity);
    const obsTemp = parseFloat(observedTemp);

    if (isNaN(invDensity) || isNaN(obsDensity) || isNaN(obsTemp)) {
      return;
    }

    const factor = productType === 'PMG' ? 0.00086 : 0.00075;
    const tempDiff = obsTemp - 15;
    const convertedDensity15C = obsDensity + (tempDiff * factor);
    const variance = Math.abs(convertedDensity15C - invDensity);
    
    let status = '';
    if (variance <= 0.0030) {
      status = 'Passed / Pure';
    } else {
      status = 'Failed / Adulteration Detected';
    }

    setResult({
      converted_density_15C: convertedDensity15C,
      variance,
      quality_status: status
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
          <Beaker className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-sans text-xl font-black text-slate-800">
            {t('Fuel Quality Verification', 'فیول کوالٹی چیک')}
          </h2>
          <p className="font-sans text-xs text-slate-500 font-medium">
            {t('Density & Adulteration check during decanting (Standard 15°C)', 'ڈیکینٹنگ کے دوران فیول کی کوالٹی چیک کریں')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block font-sans text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('Product Type', 'پروڈکٹ')}
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as 'PMG' | 'HSD')}
              className="w-full rounded-lg border border-slate-300 p-2.5 font-sans text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            >
              <option value="PMG">PMG (Petrol)</option>
              <option value="HSD">HSD (Diesel)</option>
            </select>
          </div>

          <div>
            <label className="block font-sans text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('Invoice Density @ 15°C', 'انوائس کی کثافت')}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.0001"
                value={invoiceDensity}
                onChange={(e) => setInvoiceDensity(e.target.value)}
                placeholder="e.g. 0.7300"
                className="w-full rounded-lg border border-slate-300 pl-10 p-2.5 font-sans text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <Droplet className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block font-sans text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('Observed Density (Hydrometer)', 'موجودہ کثافت')}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.0001"
                value={observedDensity}
                onChange={(e) => setObservedDensity(e.target.value)}
                placeholder="e.g. 0.7150"
                className="w-full rounded-lg border border-slate-300 pl-10 p-2.5 font-sans text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <Droplet className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block font-sans text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('Observed Temperature (°C)', 'موجودہ درجہ حرارت')}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={observedTemp}
                onChange={(e) => setObservedTemp(e.target.value)}
                placeholder="e.g. 32.0"
                className="w-full rounded-lg border border-slate-300 pl-10 p-2.5 font-sans text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
              <Thermometer className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            </div>
          </div>

          <button
            onClick={calculateQuality}
            disabled={!invoiceDensity || !observedDensity || !observedTemp}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-sans font-bold py-3 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('Verify Quality', 'کوالٹی چیک کریں')}
          </button>
        </div>

        <div>
          {result ? (
            <div className={`p-6 rounded-xl border ${result.quality_status.includes('Passed') ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center gap-3 mb-6">
                {result.quality_status.includes('Passed') ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-rose-600" />
                )}
                <h3 className={`font-sans text-xl font-black ${result.quality_status.includes('Passed') ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {result.quality_status}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                  <p className="font-sans text-xs font-bold text-slate-500 uppercase">Converted Density @ 15°C</p>
                  <p className="font-mono text-2xl font-black text-slate-800 mt-1">
                    {result.converted_density_15C.toFixed(4)}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                  <p className="font-sans text-xs font-bold text-slate-500 uppercase">Variance</p>
                  <p className="font-mono text-2xl font-black text-slate-800 mt-1">
                    {result.variance.toFixed(4)}
                  </p>
                  <p className="font-sans text-xs text-slate-500 mt-1">
                    Max Allowable Tolerance: 0.0030
                  </p>
                </div>
                
                <div className="bg-slate-900 rounded-lg p-4 shadow-inner mt-4 overflow-x-auto">
                  <pre className="font-mono text-xs text-emerald-400">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center">
              <Beaker className="h-12 w-12 text-slate-300 mb-4" />
              <p className="font-sans text-sm font-bold text-slate-500">
                {t('Enter values and click Verify to see results.', 'ویلیوز درج کریں اور چیک کے بٹن پر کلک کریں۔')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
