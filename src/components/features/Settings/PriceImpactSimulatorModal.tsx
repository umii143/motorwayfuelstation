import React, { useState, useEffect } from 'react';
import { Product, RateChangeReason, Attachment, Tank } from '../../../types';
import { X, TrendingUp, TrendingDown, Upload, File as FileIcon, XCircle, AlertCircle, Info, Activity, CheckCircle } from 'lucide-react';
import { t } from '../../../lib/translations';
import { forecastImpactEngine, ForecastImpactResult } from '../../../services/priceManagement/forecastImpactEngine';
import { storage } from '../../../services/storage/localProvider';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { useShiftStore } from '../../../stores/useShiftStore';

interface PriceImpactSimulatorModalProps {
  isOpen: boolean;
  product: Product | null;
  newRate: number;
  language: string;
  onConfirm: (reason: RateChangeReason, attachments: Attachment[]) => void;
  onCancel: () => void;
}

const REASON_CODES: RateChangeReason[] = [
  'OGRA Revision',
  'PSO Revision',
  'Shell Revision',
  'GO Revision',
  'APL Revision',
  'Manual Correction',
  'Special Adjustment',
  'System Correction'
];

export default function PriceImpactSimulatorModal({
  isOpen,
  product,
  newRate,
  language,
  onConfirm,
  onCancel
}: PriceImpactSimulatorModalProps) {
  const [reason, setReason] = useState<RateChangeReason | ''>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [forecast, setForecast] = useState<ForecastImpactResult | null>(null);
  const [totalStock, setTotalStock] = useState(0);
  
  const tanks = useInventoryStore(state => state.tanks);
  const shifts = useShiftStore(state => state.shifts);

  useEffect(() => {
    if (isOpen && product) {
      // 1. Get Stock
      const relevantTanks = tanks.filter(t => t.productId === product.id);
      const stock = relevantTanks.reduce((sum, t) => sum + (t.currentStock || 0), 0) || product.currentStock || 0;
      setTotalStock(stock);

      // 2. Calculate average sales (mocking past 30 days for this demo, ideally would query shifts deeply)
      // Using a simple daily average of 5500, 5700, 6000 for demonstration or calculating from actual shifts
      // Let's do a basic estimation from total past shifts if available, otherwise fallback.
      let totalSold = 0;
      let daysWithSales = new Set<string>();
      
      shifts.forEach(s => {
        if (s.status === 'closed') {
          daysWithSales.add(s.date.split('T')[0]);
          s.segments?.forEach(seg => {
            if (seg.productId === product.id) totalSold += seg.litersSold;
          });
        }
      });
      
      const uniqueDays = daysWithSales.size || 1;
      const dailyAvg = totalSold / uniqueDays;
      
      // If we don't have enough data, use 5000 as baseline
      const baseDaily = dailyAvg > 0 ? dailyAvg : 5000;

      const rateDifference = newRate - (product.rate || 0);
      
      // Provide simulated recent averages based on the overall average for the Forecast Engine
      const result = forecastImpactEngine.calculateForecast(
        rateDifference,
        baseDaily * 1.1, // 7 Day 
        baseDaily * 1.05, // 14 Day
        baseDaily // 30 Day
      );
      
      setForecast(result);
      setReason('');
      setAttachments([]);
    }
  }, [isOpen, product, newRate, tanks, shifts]);

  if (!isOpen || !product) return null;

  const rateDiff = newRate - (product.rate || 0);
  const revaluationImpact = totalStock * rateDiff;
  const isGain = revaluationImpact >= 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // For MVP we just use the name extension as type
      let type: Attachment['type'] = 'circular';
      if (file.type.includes('pdf')) type = 'pdf';
      if (file.type.includes('image')) type = 'image';

      const attachment = await storage.uploadFile(file, 'Admin', type);
      setAttachments(prev => [...prev, attachment]);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason as RateChangeReason, attachments);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        <div className="bg-slate-800 p-6 flex justify-between items-center text-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="size-6 text-emerald-400" />
              {t('Price Impact Simulator', 'پرائس امپیکٹ سمیلیٹر', language)}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {t('Review financial impact before finalizing rates.', 'ریٹس فائنل کرنے سے پہلے مالی اثرات کا جائزہ لیں۔', language)}
            </p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X className="size-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* INSTANT REVALUATION IMPACT */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
              {t('Immediate Inventory Revaluation', 'فوری انوینٹری ریویلیویشن', language)}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-bold mb-1">Current Stock</p>
                <p className="text-lg font-black text-slate-800">{totalStock.toLocaleString()} L</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-bold mb-1">Price Diff</p>
                <p className={`text-lg font-black ${rateDiff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {rateDiff > 0 ? '+' : ''}{rateDiff.toFixed(2)}
                </p>
              </div>
              <div className={`col-span-2 p-4 rounded-xl border ${isGain ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-xs font-bold mb-1 ${isGain ? 'text-emerald-600' : 'text-red-600'}`}>
                  Expected Revaluation {isGain ? 'Gain' : 'Loss'}
                </p>
                <p className={`text-2xl font-black ${isGain ? 'text-emerald-700' : 'text-red-700'} flex items-center gap-2`}>
                  {isGain ? <TrendingUp className="size-6" /> : <TrendingDown className="size-6" />}
                  Rs {Math.abs(revaluationImpact).toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          {/* PROJECTED FORECAST */}
          {forecast && (
            <section>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="size-4" />
                {t('Projected 30-Day Margin Impact', 'متوقع 30 دن کا مارجن امپیکٹ', language)}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <p className="text-xs text-slate-500 font-bold mb-2">Conservative (30d Avg)</p>
                  <p className={`text-lg font-black ${forecast.conservative >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {forecast.conservative > 0 ? '+' : ''}{forecast.conservative.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 shadow-sm">
                  <p className="text-xs text-indigo-600 font-bold mb-2">Expected (14d Avg)</p>
                  <p className={`text-xl font-black ${forecast.expected >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {forecast.expected > 0 ? '+' : ''}{forecast.expected.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <p className="text-xs text-slate-500 font-bold mb-2">Aggressive (7d Avg)</p>
                  <p className={`text-lg font-black ${forecast.aggressive >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {forecast.aggressive > 0 ? '+' : ''}{forecast.aggressive.toLocaleString()}
                  </p>
                </div>
              </div>
            </section>
          )}

          <hr className="border-slate-100" />

          {/* COMPLIANCE & ARCHIVE */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {t('Compliance & Archiving', 'تعمیل اور آرکائیونگ', language)}
            </h3>
            
            {/* Reason Code */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {t('Reason Code (Mandatory)', 'وجہ کوڈ (لازمی)', language)} <span className="text-red-500">*</span>
              </label>
              <select 
                value={reason} 
                onChange={(e) => setReason(e.target.value as RateChangeReason)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-700"
              >
                <option value="" disabled>Select a valid reason...</option>
                {REASON_CODES.map(rc => (
                  <option key={rc} value={rc}>{rc}</option>
                ))}
              </select>
            </div>

            {/* Government Notification Archive */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {t('Government Notification / Circular', 'سرکاری نوٹیفکیشن / سرکلر', language)}
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center">
                <input 
                  type="file" 
                  id="circular-upload" 
                  className="hidden" 
                  accept=".pdf,image/*" 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label 
                  htmlFor="circular-upload" 
                  className={`cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg font-bold text-sm ${isUploading ? 'opacity-50' : 'hover:bg-slate-100'}`}
                >
                  <Upload className="size-4 text-slate-500" />
                  {isUploading ? 'Uploading...' : 'Attach PDF or Image'}
                </label>
                <p className="text-xs text-slate-400 mt-2">Optional for historical evidence.</p>
              </div>

              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileIcon className="size-5 text-indigo-500" />
                        <div>
                          <p className="text-sm font-bold text-slate-700">{att.fileName}</p>
                          <p className="text-xs text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button onClick={() => removeAttachment(att.id)} className="text-red-400 hover:text-red-600">
                        <XCircle className="size-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {t('Cancel', 'منسوخ کریں', language)}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason}
            className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="size-5" />
            {t('Apply Final Rate', 'فائنل ریٹ لاگو کریں', language)}
          </button>
        </div>

      </div>
    </div>
  );
}
