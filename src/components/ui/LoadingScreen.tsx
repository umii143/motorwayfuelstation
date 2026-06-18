import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  // High-speed artificial progress to make the app feel lightning fast
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 10) {
          clearInterval(interval);
          return 10;
        }
        return p + 1;
      });
    }, 35); // Extremely fast completion
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[20000] min-h-screen w-full flex flex-col justify-center items-center overflow-hidden bg-[#050B14] font-sans">
      {/* Cinematic Background matching the Lock Screen */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-screen"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2000&auto=format&fit=crop)' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#02050A] via-[#050B14]/80 to-[#02050A]/90" />
      
      {/* Dot Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-8">
        
        {/* Animated Glowing Shield (Fast Pulse) */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(255,100,0,0.15),transparent_50%)] pointer-events-none mix-blend-screen" />
          
          {/* Extremely fast pulse to eliminate the "lazy" feeling */}
          <motion.div animate={{ scale: [1, 1.4], opacity: [0.8, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeOut" }} className="absolute w-24 h-24 border-2 border-orange-500/60 rounded-full" />
          <motion.div animate={{ scale: [1, 1.8], opacity: [0.4, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeOut", delay: 0.15 }} className="absolute w-24 h-24 border border-orange-500/30 rounded-full" />
          
          <div className="relative z-10 p-4 rounded-full border-2 border-orange-500 bg-[#050B14]/90 backdrop-blur-md shadow-[0_0_50px_rgba(255,100,0,0.6)] flex items-center justify-center">
            <Zap className="w-10 h-10 text-orange-500" strokeWidth={2} fill="currentColor" />
          </div>
        </div>

        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center justify-center gap-3 drop-shadow-2xl">
            FuelPro <span className="text-orange-500 font-light text-3xl opacity-50">|</span> <span className="font-[Noto_Nastaliq_Urdu] text-3xl font-normal leading-relaxed mt-1 drop-shadow-lg">فیول پرو</span>
          </h1>
          <p className="text-orange-400 font-[Noto_Nastaliq_Urdu] text-lg mt-1 drop-shadow-md">
            آپ کا اپنا فیول اسٹیشن
          </p>
        </motion.div>

        {/* High-Speed 0 to 10 Progress Line */}
        <div className="w-full mt-4">
          <div className="flex justify-between items-center mb-3">
             <span className="text-orange-500/80 text-[10px] font-black tracking-widest uppercase shadow-orange-500 drop-shadow-md">Initializing Core Systems</span>
             <span className="text-orange-400 text-xs font-black font-mono">{(progress * 10)}%</span>
          </div>
          
          {/* Fast Moving Progress Line */}
          <div className="relative h-1.5 w-full bg-[#0A1120] rounded-full overflow-hidden border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
             <motion.div 
               className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 via-amber-400 to-white rounded-full shadow-[0_0_15px_rgba(255,160,0,0.8)]"
               initial={{ width: '0%' }}
               animate={{ width: `${progress * 10}%` }}
               transition={{ type: "spring", stiffness: 300, damping: 25 }}
             />
          </div>

          {/* 0 to 10 Node Indicators */}
          <div className="flex justify-between items-center mt-4 px-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
              <div key={step} className="flex flex-col items-center">
                 <div className={`w-1.5 h-1.5 rounded-full transition-all duration-75 ${progress >= step ? 'bg-orange-400 shadow-[0_0_10px_rgba(255,160,0,1)] scale-[1.5]' : 'bg-slate-800'}`} />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 w-full flex flex-col items-center opacity-70">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-[1px] bg-orange-500" />
          <span className="text-[9px] font-bold text-orange-500 tracking-[0.25em] uppercase">Powered By</span>
          <div className="w-6 h-[1px] bg-orange-500" />
        </div>
        <h2 className="text-white font-black text-sm tracking-[0.3em] mb-1 uppercase drop-shadow-md">Umar Ali</h2>
        <p className="text-orange-500 text-[10px] font-bold tracking-[0.15em] uppercase drop-shadow-md">Motorway Petroleum</p>
      </div>
    </div>
  );
}
