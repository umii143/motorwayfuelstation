import React, { useState } from 'react';
import { WelcomeStep } from './Onboarding/WelcomeStep';
import { ProductsStep } from './Onboarding/ProductsStep';
import { TanksStep } from './Onboarding/TanksStep';
import { NozzlesStep } from './Onboarding/NozzlesStep';
import { RatesStep } from './Onboarding/RatesStep';
import { CompleteStep } from './Onboarding/CompleteStep';
import { GlobalSettings, Tank, Nozzle, Product, Pump, Staff } from '../../types';
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

export default function OnboardingWizard({ onComplete, onCancel, currentLanguage }: OnboardingWizardProps) {
  const { settings } = useStation(); // to get the existing settings to mutate
  const [step, setStep] = useState(0);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);

  const nextStep = () => setStep(prev => prev + 1);

  const handleFinish = () => {
    // The App.tsx `onComplete` expects these fields.
    onComplete({ 
      settings: { ...settings, setupCompleted: true },
      products, 
      tanks, 
      nozzles, 
      staff: [] // skipped in simplified flow
    });
    nextStep(); // Move to completion celebration screen
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 overflow-y-auto">
      {step === 0 && <WelcomeStep onContinue={nextStep} onCancel={onCancel} language={currentLanguage} />}
      {step === 1 && (
        <ProductsStep
          products={products}
          onUpdate={setProducts}
          onContinue={nextStep}
          language={currentLanguage}
        />
      )}
      {step === 2 && (
        <TanksStep
          tanks={tanks}
          products={products}
          onUpdate={setTanks}
          onContinue={nextStep}
          language={currentLanguage}
        />
      )}
      {step === 3 && (
        <NozzlesStep
          nozzles={nozzles}
          pumps={pumps}
          tanks={tanks}
          products={products}
          onUpdate={(nzls, pmps) => { setNozzles(nzls); setPumps(pmps); }}
          onContinue={nextStep}
          language={currentLanguage}
        />
      )}
      {step === 4 && (
        <RatesStep
          products={products}
          onUpdate={setProducts}
          onContinue={handleFinish}
          language={currentLanguage}
        />
      )}
      {step === 5 && (
        <CompleteStep 
          onFinish={() => {
            // App state will automatically remove wizard
          }} 
          language={currentLanguage} 
        />
      )}
    </div>
  );
}
