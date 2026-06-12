import React, { useState } from 'react';
import { Droplet, Thermometer, CheckCircle2, XCircle, Beaker } from 'lucide-react';
import { GlobalSettings } from '../../types';
import { t } from '../../lib/translations';

interface FuelQualityHubProps {
  settings: GlobalSettings;
}

export default function FuelQualityHub({ settings }: FuelQualityHubProps) {
  const [activeTab, setActiveTab] = useState<'density' | 'volume'>('density');

  // Density Check State
  const [productType, setProductType] = useState<'PMG' | 'HSD'>('PMG');
  const [invoiceDensity, setInvoiceDensity] = useState<string>('');
  const [observedDensity, setObservedDensity] = useState<string>('');
  const [observedTemp, setObservedTemp] = useState<string>('');

  const [densityResult, setDensityResult] = useState<{
    converted_density_15C: number;
    variance: number;
    quality_status: string;
  } | null>(null);

  // Volume Check State
  const [volProductType, setVolProductType] = useState<'PMG' | 'HSD'>('PMG');
  const [invoiceLiters, setInvoiceLiters] = useState<string>('');
  const [invoiceTempC, setInvoiceTempC] = useState<string>('');
  const [actualTempC, setActualTempC] = useState<string>('');
  const [actualDipLiters, setActualDipLiters] = useState<string>('');

  const [volumeResult, setVolumeResult] = useState<{
    expected_liters: number;
    temperature_variation_liters: number;
    final_shortage_liters: number;
    status: string;
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

    setDensityResult({
      converted_density_15C: convertedDensity15C,
      variance,
      quality_status: status
    });
  };

  const calculateVolumeVariation = () => {
    const invLiters = parseFloat(invoiceLiters);
    const invTempC = parseFloat(invoiceTempC);
    const actTempC = parseFloat(actualTempC);
    const actDipLiters = parseFloat(actualDipLiters);

    if (isNaN(invLiters) || isNaN(invTempC) || isNaN(actTempC) || isNaN(actDipLiters)) {
      return;
    }

    const factor = volProductType === 'PMG' ? 0.00066 : 0.00055;
    
    // Convert C to F
    const invTempF = (invTempC * 1.8) + 32;
    const actTempF = (actTempC * 1.8) + 32;

    const tempDifference = actTempF - invTempF;
    const tempVariation = invLiters * factor * tempDifference;
    const expectedLiters = invLiters + tempVariation;
    const finalShortage = actDipLiters - expectedLiters;

    let status = 'Exact';
    if (finalShortage < -0.5) status = 'Shortage';
    else if (finalShortage > 0.5) status = 'Gain';

    setVolumeResult({
      expected_liters: expectedLiters,
      temperature_variation_liters: tempVariation,
      final_shortage_liters: finalShortage,
      status
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('density')}
          className={`flex-1 py-4 px-6 text-sm font-bold font-sans transition-colors ${
            activeTab === 'density' 
              ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          {t('Density & Quality Check', 'کثافت اور کوالٹی چیک')}
        </button>
        <button
          onClick={() => setActiveTab('volume')}
          className={`flex-1 py-4 px-6 text-sm font-bold font-sans transition-colors ${
            activeTab === 'volume' 
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          {t('Volume Variation Check', 'حجم کی تبدیلی چیک')}
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'density' ? (
          <>
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
          {densityResult ? (
            <div className={`p-6 rounded-xl border ${densityResult.quality_status.includes('Passed') ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center gap-3 mb-6">
                {densityResult.quality_status.includes('Passed') ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-rose-600" />
                )}
                <h3 className={`font-sans text-xl font-black ${densityResult.quality_status.includes('Passed') ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {densityResult.quality_status}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                  <p className="font-sans text-xs font-bold text-slate-500 uppercase">Converted Density @ 15°C</p>
                  <p className="font-mono text-2xl font-black text-slate-800 mt-1">
                    {densityResult.converted_density_15C.toFixed(4)}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                  <p className="font-sans text-xs font-bold text-slate-500 uppercase">Variance</p>
                  <p className="font-mono text-2xl font-black text-slate-800 mt-1">
                    {densityResult.variance.toFixed(4)}
                  </p>
                  <p className="font-sans text-xs text-slate-500 mt-1">
                    Max Allowable Tolerance: 0.0030
                  </p>
                </div>
                
                <div className="bg-slate-900 rounded-lg p-4 shadow-inner mt-4 overflow-x-auto">
                  <pre className="font-mono text-xs text-emerald-400">
                    {JSON.stringify(densityResult, null, 2)}
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
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Thermometer className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-sans text-xl font-black text-slate-800">
                  {t('Volume Variation Check', 'حجم کی تبدیلی چیک')}
                </h2>
                <p className="font-sans text-xs text-slate-500 font-medium">
                  {t('Calculate shortages or gains based on temperature differences.', 'درجہ حرارت کی وجہ سے ہونے والی تبدیلی چیک کریں')}
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
                    value={volProductType}
                    onChange={(e) => setVolProductType(e.target.value as 'PMG' | 'HSD')}
                    className="w-full rounded-lg border border-slate-300 p-2.5 font-sans text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="PMG">PMG (Petrol)</option>
                    <option value="HSD">HSD (Diesel)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-sans text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('Invoice Volume (Liters)', 'انوائس لیٹرز')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={invoiceLiters}
                      onChange={(e) => setInvoiceLiters(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full rounded-lg border border-slate-300 pl-10 p-2.5 font-sans text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <Droplet className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-sans text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('Invoice Temp (°C)', 'انوائس درجہ حرارت')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={invoiceTempC}
                        onChange={(e) => setInvoiceTempC(e.target.value)}
                        placeholder="e.g. 25.0"
                        className="w-full rounded-lg border border-slate-300 pl-8 p-2.5 font-sans text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      <Thermometer className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-sans text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('Actual Temp (°C)', 'موجودہ درجہ حرارت')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={actualTempC}
                        onChange={(e) => setActualTempC(e.target.value)}
                        placeholder="e.g. 30.0"
                        className="w-full rounded-lg border border-slate-300 pl-8 p-2.5 font-sans text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      <Thermometer className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-sans text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t('Actual Received (Dip Liters)', 'موجودہ ڈِپ لیٹرز')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={actualDipLiters}
                      onChange={(e) => setActualDipLiters(e.target.value)}
                      placeholder="e.g. 9950"
                      className="w-full rounded-lg border border-slate-300 pl-10 p-2.5 font-sans text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <Droplet className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                <button
                  onClick={calculateVolumeVariation}
                  disabled={!invoiceLiters || !invoiceTempC || !actualTempC || !actualDipLiters}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold py-3 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('Calculate Variation', 'تبدیلی چیک کریں')}
                </button>
              </div>

              <div>
                {volumeResult ? (
                  <div className={`p-6 rounded-xl border ${volumeResult.status === 'Gain' ? 'bg-emerald-50 border-emerald-200' : volumeResult.status === 'Shortage' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3 mb-6">
                      {volumeResult.status === 'Gain' ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                      ) : volumeResult.status === 'Shortage' ? (
                        <XCircle className="h-8 w-8 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="h-8 w-8 text-slate-600" />
                      )}
                      <h3 className={`font-sans text-xl font-black ${volumeResult.status === 'Gain' ? 'text-emerald-800' : volumeResult.status === 'Shortage' ? 'text-rose-800' : 'text-slate-800'}`}>
                        {volumeResult.status === 'Shortage' ? 'Shortage Detected' : volumeResult.status === 'Gain' ? 'Volume Gain Detected' : 'Exact Volume'}
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                        <p className="font-sans text-xs font-bold text-slate-500 uppercase">Expected Liters</p>
                        <p className="font-mono text-2xl font-black text-slate-800 mt-1">
                          {volumeResult.expected_liters.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                        <p className="font-sans text-xs font-bold text-slate-500 uppercase">Temperature Variation (Liters)</p>
                        <p className="font-mono text-2xl font-black text-slate-800 mt-1">
                          {volumeResult.temperature_variation_liters > 0 ? '+' : ''}{volumeResult.temperature_variation_liters.toFixed(2)}
                        </p>
                      </div>

                      <div className={`bg-white rounded-lg p-4 shadow-sm border ${volumeResult.status === 'Shortage' ? 'border-rose-300 bg-rose-50/50' : ''}`}>
                        <p className="font-sans text-xs font-bold text-slate-500 uppercase">Final {volumeResult.status}</p>
                        <p className={`font-mono text-2xl font-black mt-1 ${volumeResult.status === 'Gain' ? 'text-emerald-700' : volumeResult.status === 'Shortage' ? 'text-rose-700' : 'text-slate-800'}`}>
                          {volumeResult.final_shortage_liters > 0 ? '+' : ''}{volumeResult.final_shortage_liters.toFixed(2)} L
                        </p>
                      </div>
                      
                      <div className="bg-slate-900 rounded-lg p-4 shadow-inner mt-4 overflow-x-auto">
                        <pre className="font-mono text-xs text-indigo-400">
                          {JSON.stringify(volumeResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full bg-slate-50 border border-slate-200 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center">
                    <Thermometer className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="font-sans text-sm font-bold text-slate-500">
                      {t('Enter values and click Calculate to see volume variations.', 'ویلیوز درج کریں اور چیک کے بٹن پر کلک کریں۔')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
