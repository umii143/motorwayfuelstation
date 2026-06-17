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

    // Sequence timing
    const t1 = setTimeout(() => {
      setStage('loading');
    }, 400);

    const t2 = setTimeout(() => {
      setStage('done');
    }, 1000);

    const t3 = setTimeout(() => {
      onComplete();
    }, 1200);

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
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Ambient Glow - Fixed for Android FPS */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/20 to-transparent rounded-full" />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/30 to-transparent rounded-full" />
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-3xl shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent rounded-full translate-x-1/2 -translate-y-1/2" />
                <Fuel className="w-16 h-16 text-white relative z-10" />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: '0%' }}
                  transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
                  className="absolute inset-0 bg-gradient-to-t from-yellow-400/40 to-transparent mix-blend-overlay"
                />
              </div>
            </div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black text-white mt-8 tracking-tight"
            >
              Fuel<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">Pro</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-orange-400 mt-2 font-bold tracking-wide text-sm"
            >
              Pakistan Ka Apna Fuel Station Manager
            </motion.p>
          </motion.div>

          <AnimatePresence>
            {stage === 'loading' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center"
              >
                <div className="flex gap-2 mb-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                      className="w-2 h-2 rounded-full bg-orange-500"
                    />
                  ))}
                </div>
                <p className="text-xs text-orange-500 font-mono tracking-widest uppercase">
                  Starting Engine...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest"
          >
            Powered by Umar Ali ⚡
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
