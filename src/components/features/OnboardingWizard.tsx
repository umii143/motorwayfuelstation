import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings2, Building2, Cylinder, Fuel, CheckCircle2, RefreshCw } from 'lucide-react';
import { GlobalSettings, Tank, Nozzle, Product, Staff } from '../../types';
import { useStation } from '../../contexts/StationContext';

interface OnboardingWizardProps {
  onComplete: (data: {
    settings: GlobalSettings;
    tanks: Tank[];
    nozzles: Nozzle[];
    products: Product[];
    staff: Staff[];
  }) => void;
  onCancel?: () => void;
  currentLanguage: 'en' | 'ur' | 'ar' | 'es' | 'zh';
}

const OMCS = ['PSO', 'Shell', 'Attock', 'Total', 'GO', 'Hascol', 'Independent'];

export default function OnboardingWizard({ onComplete, onCancel, currentLanguage }: OnboardingWizardProps) {
  const { settings } = useStation();
  const isUrdu = currentLanguage === 'ur';

  const [step, setStep] = useState(1);
  const [omc, setOmc] = useState('PSO');
  const [tanksCount, setTanksCount] = useState(3);
  const [dispensersCount, setDispensersCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleMagicSetup = async () => {
    setIsGenerating(true);
    
    // Simulate generation time for UX
    await new Promise(r => setTimeout(r, 2000));

    // Generate Products
    const products: Product[] = [
      { id: 'prod_pmo', name: 'Super Petrol', urduName: 'سپر پٹرول', type: 'fuel', rate: 260.96, unit: 'Liters', currentStock: 0, minStock: 0 },
      { id: 'prod_hsd', name: 'High Speed Diesel', urduName: 'ہائی اسپیڈ ڈیزل', type: 'fuel', rate: 266.07, unit: 'Liters', currentStock: 0, minStock: 0 }
    ];

    // Generate Tanks
    const tanks: Tank[] = [];
    for (let i = 1; i <= tanksCount; i++) {
      const isDiesel = i % 2 === 0;
      tanks.push({
        id: `tank_${i}`,
        name: `Tank ${i}`,
        productId: isDiesel ? 'prod_hsd' : 'prod_pmo',
        capacity: 50000,
        currentStock: 10000,
        openingStock: 10000,
        safeLevel: 15000,
        criticalLevel: 5000,
        dipChart: []
      });
    }

    // Generate Nozzles (2 per dispenser)
    const nozzles: Nozzle[] = [];
    for (let i = 1; i <= dispensersCount; i++) {
      const tankPmo = tanks.find(t => t.productId === 'prod_pmo')?.id || tanks[0]?.id;
      const tankHsd = tanks.find(t => t.productId === 'prod_hsd')?.id || tanks[0]?.id;

      nozzles.push({
        id: `nzl_${i}_1`,
        pumpId: `pump_${i}`,
        name: `Dispenser ${i} - P1`,
        tankId: tankPmo,
        productId: 'prod_pmo',
        currentReading: 0
      });
      nozzles.push({
        id: `nzl_${i}_2`,
        pumpId: `pump_${i}`,
        name: `Dispenser ${i} - P2`,
        tankId: tankHsd,
        productId: 'prod_hsd',
        currentReading: 0
      });
    }

    onComplete({
      settings: { 
        ...settings, 
        setupCompleted: true,
        stationName: `${omc} Filling Station`
      },
      products,
      tanks,
      nozzles,
      staff: []
    });
  };

  return (
    <div className="fixed inset-0 z-[9000] bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/10 blur-[100px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[var(--bg-card)]/90 backdrop-blur-xl border border-[var(--border-main)] rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10"
          >
            <div className="text-center mb-8">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 items-center justify-center mb-4">
                <Settings2 className="w-8 h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] mb-2 uppercase tracking-tight">
                {isUrdu ? '60-سیکنڈ سیٹ اپ' : '60-Second Setup'}
              </h1>
              <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
                {isUrdu ? 'ہم خود بخود آپ کا پورا سسٹم تیار کریں گے۔' : 'We will automatically generate your entire backend.'}
              </p>
            </div>

            <div className="space-y-6">
              {/* OMC Selection */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-3">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  {isUrdu ? 'تیل کی کمپنی (OMC)' : 'Select OMC'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {OMCS.map(o => (
                    <button
                      key={o}
                      onClick={() => setOmc(o)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                        omc === o 
                          ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                          : 'bg-[var(--bg-app)] border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Tanks */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-3">
                  <Cylinder className="w-4 h-4 text-orange-500" />
                  {isUrdu ? 'زیر زمین ٹینکس کی تعداد' : 'Number of Underground Tanks'}
                </label>
                <div className="flex items-center justify-between bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl p-2">
                  <button onClick={() => setTanksCount(Math.max(1, tanksCount - 1))} className="w-10 h-10 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] flex items-center justify-center font-black text-lg text-[var(--text-main)]">-</button>
                  <span className="text-2xl font-black text-[var(--text-main)] w-12 text-center">{tanksCount}</span>
                  <button onClick={() => setTanksCount(Math.min(12, tanksCount + 1))} className="w-10 h-10 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] flex items-center justify-center font-black text-lg text-[var(--text-main)]">+</button>
                </div>
              </div>

              {/* Number of Dispensers */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-3">
                  <Fuel className="w-4 h-4 text-orange-500" />
                  {isUrdu ? 'ڈسپنسرز/مشینوں کی تعداد' : 'Number of Dispensers'}
                </label>
                <div className="flex items-center justify-between bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl p-2">
                  <button onClick={() => setDispensersCount(Math.max(1, dispensersCount - 1))} className="w-10 h-10 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] flex items-center justify-center font-black text-lg text-[var(--text-main)]">-</button>
                  <span className="text-2xl font-black text-[var(--text-main)] w-12 text-center">{dispensersCount}</span>
                  <button onClick={() => setDispensersCount(Math.min(24, dispensersCount + 1))} className="w-10 h-10 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] flex items-center justify-center font-black text-lg text-[var(--text-main)]">+</button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="w-full sm:w-1/3 py-4 rounded-xl font-bold text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  {isUrdu ? 'چھوڑیں' : 'Skip'}
                </button>
              )}
              <button
                onClick={handleMagicSetup}
                disabled={isGenerating}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{isUrdu ? 'بنایا جا رہا ہے...' : 'Generating...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isUrdu ? 'مکمل کریں' : 'Build Station'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
