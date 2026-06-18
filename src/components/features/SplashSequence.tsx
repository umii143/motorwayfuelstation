import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fuel, Droplets } from 'lucide-react';
import { SplashScreen } from '@capacitor/splash-screen';

interface SplashSequenceProps {
  onComplete: () => void;
}

export const SplashSequence: React.FC<SplashSequenceProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'logo' | 'loading' | 'done'>('logo');

  useEffect(() => {
    const hideNativeSplash = async () => {
      try {
        await SplashScreen.hide();
      } catch (err) {
        // Capacitor might not be available
      }
    };

    // Hide native splash almost immediately
    hideNativeSplash();

    // Faster sequence timing for snappier feel
    const t1 = setTimeout(() => {
      setStage('loading');
    }, 150);

    const t2 = setTimeout(() => {
      setStage('done');
    }, 700);

    const t3 = setTimeout(() => {
      onComplete();
    }, 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {stage !== 'done' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-[#0a0f1c] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Deep Ambient Background Glows */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
          </div>
          
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring', bounce: 0.5 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-500/40 blur-2xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-700" />
              <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 p-6 rounded-[2rem] shadow-[0_0_40px_rgba(249,115,22,0.4)] relative overflow-hidden border border-orange-300/30 backdrop-blur-xl">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/40 to-transparent opacity-60" />
                <Fuel className="w-16 h-16 text-white relative z-10 drop-shadow-md" />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: '-100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent -rotate-45"
                />
              </div>
            </div>
            
            <motion.h1 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-black text-white mt-8 tracking-tight drop-shadow-lg"
            >
              Fuel<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]">Pro</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400 mt-3 font-medium tracking-wide text-sm"
            >
              Smart Station Management
            </motion.p>
          </motion.div>

          <AnimatePresence>
            {stage === 'loading' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center w-64"
              >
                {/* 0 to 10 moving line animation */}
                <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden relative shadow-inner backdrop-blur-sm border border-white/5">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{
                      duration: 0.8,
                      ease: 'easeInOut',
                      repeat: Infinity,
                    }}
                    className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_15px_rgba(249,115,22,1)] rounded-full"
                  />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-4 h-4 border-[2px] border-orange-500/30 border-t-orange-400 rounded-full drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" />
                  </motion.div>
                  <p className="text-[11px] text-orange-400/90 font-medium tracking-[0.2em] uppercase glow-text">
                    Initializing System...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-8 text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]"
          >
            Powered by Umar Ali ✨
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
