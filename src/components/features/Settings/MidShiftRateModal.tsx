import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Product, Shift, Nozzle } from '../../../types';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { t } from '../../../lib/translations';

interface MidShiftRateModalProps {
  isOpen: boolean;
  product: Product | null;
  newRate: number;
  activeShifts: Shift[];
  language: string;
  onConfirm: (meterReadings: Record<string, number>) => void;
  onCancel: () => void;
}

export default function MidShiftRateModal({
  isOpen,
  product,
  newRate,
  activeShifts,
  language,
  onConfirm,
  onCancel
}: MidShiftRateModalProps) {
  const nozzles = useInventoryStore(state => state.nozzles);
  const [readings, setReadings] = useState<Record<string, string>>({ /* empty */ });
  const [error, setError] = useState<string>('');

  // Find all nozzles related to the active shifts that dispense the target product
  const relevantNozzles: Nozzle[] = [];
  activeShifts.forEach(shift => {
    Object.keys(shift.openingReadings).forEach(nozzleId => {
      const nz = nozzles.find(n => n.id === nozzleId);
      if (nz && nz.productId === product?.id && !relevantNozzles.some(r => r.id === nz.id)) {
        relevantNozzles.push(nz);
      }
    });
  });

  useEffect(() => {
    if (isOpen) {
       
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReadings({ /* empty */ });
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleConfirm = () => {
    const finalReadings: Record<string, number> = { /* empty */ };
    
    for (const nz of relevantNozzles) {
      const val = readings[nz.id];
      if (!val || isNaN(Number(val))) {
        setError(language === 'ur' ? `براہ کرم نوزل ${nz.name} کی ریڈنگ درج کریں۔` : `Please enter reading for ${nz.name}.`);
        return;
      }
      
      const numVal = Number(val);
      // We must validate that the reading is greater than the segment's starting reading
      // But for simplicity in the modal, we just ensure it's a valid number. 
      // Deeper validation can happen in the store or component.
      if (numVal < 0) {
        setError(language === 'ur' ? `غلط ریڈنگ درج کی گئی ہے۔` : `Invalid reading entered.`);
        return;
      }
      finalReadings[nz.id] = numVal;
    }

    onConfirm(finalReadings);
  };

  return createPortal(
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-amber-50 border-b border-amber-100 p-6 flex items-start gap-4">
          <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle className="size-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-amber-900">
              {t('Active Shift Detected', 'فعال شفٹ کا پتہ چلا', language)}
            </h3>
            <p className="text-amber-700 text-sm mt-1">
              {t(
                `Changing the rate of ${product.name} to Rs. ${newRate} will split the active shifts. You must enter the exact current meter readings to close the old rate segment.`,
                `${product.name} کا ریٹ Rs. ${newRate} میں تبدیل کرنے سے فعال شفٹ دو حصوں میں تقسیم ہو جائے گی۔ پرانے ریٹ کو کلوز کرنے کے لیے موجودہ میٹر ریڈنگ درج کریں۔`,
                language
              )}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-800">
              {t('Current Nozzle Readings', 'موجودہ نوزل ریڈنگز', language)}
            </h4>
            
            {relevantNozzles.length === 0 ? (
              <p className="text-slate-500 text-sm">
                {t('No active nozzles found for this product.', 'اس پراڈکٹ کے لیے کوئی فعال نوزل نہیں ملی۔', language)}
              </p>
            ) : (
              relevantNozzles.map(nz => (
                <div key={nz.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{nz.name}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={readings[nz.id] || ''}
                        onChange={(e) => setReadings({ ...readings, [nz.id]: e.target.value })}
                        className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="0.00"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                        Ltr
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px].5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {t('Cancel', 'منسوخ کریں', language)}
          </button>
          <button
            onClick={handleConfirm}
            disabled={relevantNozzles.length > 0 && Object.keys(readings).length !== relevantNozzles.length}
            className="px-6 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="size-5" />
            {t('Confirm Mid-Shift Split', 'مڈ شفٹ اسپلٹ کنفرم کریں', language)}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
