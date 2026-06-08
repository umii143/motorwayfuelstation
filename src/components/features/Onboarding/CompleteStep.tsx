import React, { useEffect } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { t } from '../../../lib/translations';
import confetti from 'canvas-confetti';

interface Props {
  onFinish: () => void;
  language: string;
}

export function CompleteStep({ onFinish, language }: Props) {
  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f97316', '#10b981', '#3b82f6', '#8b5cf6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f97316', '#10b981', '#3b82f6', '#8b5cf6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4 animate-in fade-in zoom-in duration-700">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-center p-12 space-y-8">
        
        <div className="flex justify-center animate-bounce duration-1000">
          <div className="size-24 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="size-12 text-emerald-500" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            {t('Setup Complete!', 'سیٹ اپ مکمل ہو گیا!', language)}
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">
            {t('Your station is now fully configured and ready for operations.', 'آپ کا اسٹیشن اب مکمل طور پر ترتیب دے دیا گیا ہے اور کام کے لیے تیار ہے۔', language)}
          </p>
        </div>

        <div className="pt-8">
          <button
            onClick={onFinish}
            className="w-full md:w-auto md:px-16 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-lg transition-all shadow-xl hover:shadow-slate-900/30 active:scale-95 cursor-pointer flex items-center justify-center gap-3 mx-auto"
          >
            {t('Go to Dashboard', 'ڈیش بورڈ پر جائیں', language)}
            <ArrowRight className="size-6" />
          </button>
        </div>

      </div>
    </div>
  );
}
