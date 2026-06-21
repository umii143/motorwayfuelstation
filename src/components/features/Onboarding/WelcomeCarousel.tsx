import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, TrendingUp, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PoweredByUmarAli } from '../../shared/PoweredByUmarAli';

interface WelcomeCarouselProps {
  language: 'en' | 'ur';
  onComplete: () => void;
}

export const WelcomeCarousel: React.FC<WelcomeCarouselProps> = ({ language, onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isUrdu = language === 'ur';

  const slides = [
    {
      icon: Clock,
      color: 'from-orange-500 to-amber-500',
      titleEn: 'Shift Management',
      titleUr: 'شفٹ مینجمنٹ',
      descEn: 'End shifts in 60 seconds. Zero calculation errors. Perfect cash reconciliation every time.',
      descUr: 'صرف 60 سیکنڈ میں شفٹ ختم کریں۔ حساب کی کوئی غلطی نہیں۔ ہر بار پرفیکٹ کیش ری کنسلیشن۔'
    },
    {
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      titleEn: 'OGRA Price Sync',
      titleUr: 'اوگرا پرائس سنک',
      descEn: '1-Tap automatic OGRA price updates. Never miss a price change margin again.',
      descUr: 'ایک کلک سے اوگرا کی نئی قیمتیں اپ ڈیٹ کریں۔ منافع کا کوئی موقع ضائع نہ کریں۔'
    },
    {
      icon: BarChart3,
      color: 'from-emerald-500 to-teal-500',
      titleEn: 'Profit Tracking',
      titleUr: 'پرافٹ ٹریکنگ',
      descEn: 'Track every drop, every rupee in real-time. Complete business visibility.',
      descUr: 'ہر قطرے اور ہر روپے کا ریئل ٹائم حساب رکھیں۔ آپ کے بزنس کا مکمل کنٹرول۔'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[9000] bg-slate-950 flex flex-col overflow-hidden">
      <div className="flex-1 relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-sm px-8 flex flex-col items-center text-center"
          >
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${slides[currentSlide].color} p-1 mb-10 shadow-2xl relative`}>
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full mix-blend-overlay" />
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center relative overflow-hidden">
                <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${slides[currentSlide].color}`} />
                {React.createElement(slides[currentSlide].icon, { className: "w-14 h-14 text-white" })}
              </div>
            </div>

            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
              {isUrdu ? slides[currentSlide].titleUr : slides[currentSlide].titleEn}
            </h2>
            <p className="text-slate-400 font-medium leading-relaxed text-sm">
              {isUrdu ? slides[currentSlide].descUr : slides[currentSlide].descEn}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-12 w-full max-w-xl mx-auto flex flex-col items-center">
        {/* Indicators */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-8 bg-orange-500' : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 uppercase tracking-widest text-sm transition-colors cursor-pointer"
        >
          {currentSlide === slides.length - 1 ? (
            <>
              <span>{isUrdu ? 'شروع کریں' : 'Get Started'}</span>
              <CheckCircle2 className="w-5 h-5" />
            </>
          ) : (
            <>
              <span>{isUrdu ? 'اگلا' : 'Next'}</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
        
        <div className="mt-6">
          <PoweredByUmarAli variant="compact" showLogo={false} className="text-slate-600" />
        </div>
      </div>
    </div>
  );
};
