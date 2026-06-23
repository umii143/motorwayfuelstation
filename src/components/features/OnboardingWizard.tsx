import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Cylinder, Fuel, CheckCircle2, RefreshCw, ChevronLeft, 
  Plus, Trash2, Users, User, Hash, Store, Droplets, ArrowRight 
} from 'lucide-react';
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

export default function OnboardingWizard({ onComplete, onCancel, currentLanguage }: OnboardingWizardProps) {
  const { settings } = useStation();
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isUrdu = currentLanguage === 'ur';

  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // STEP 1: Basic Info
  const [stationName, setStationName] = useState('');
  const [businessType, setBusinessType] = useState<'fuel' | 'lube'>('fuel');

  interface WizardTank {
    name: string;
    fuelType: string;
    capacity: number;
    currentStock: number;
  }
  const [tanks, setTanks] = useState<WizardTank[]>([]);

  interface WizardNozzle {
    name: string;
    pumpId: string;
    tankId: string; // index
    openingReading: number;
  }
  const [nozzles, setNozzles] = useState<WizardNozzle[]>([]);
  
  const [newTank, setNewTank] = useState({ name: '', fuelType: 'Petrol', capacity: 20000, currentStock: 0 });
  const [newNozzle, setNewNozzle] = useState({ name: '', pumpId: '1', openingReading: 0, tankId: '' });

  // STEP 3: Rates & Staff
  const [petrolRate, setPetrolRate] = useState(260.96);
  const [dieselRate, setDieselRate] = useState(266.07);
  
  interface WizardStaff {
    name: string;
    phone: string;
    pin: string;
  }
  const [staff, setStaff] = useState<WizardStaff[]>([]);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', pin: '' });

  // STEP 4: Owner Profile
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPin, setOwnerPin] = useState('');

  // Helpers
  const canProceedToStep2 = stationName.trim().length > 0;
  const canProceedToStep3 = tanks.length > 0;
  const canFinish = petrolRate > 0 && dieselRate > 0 && ownerName.trim().length > 0 && ownerPin.trim().length >= 4;

  const handleAddTank = () => {
    if (!newTank.name.trim()) return;
    setTanks([...tanks, { ...newTank }]);
    setNewTank({ name: '', fuelType: 'Petrol', capacity: 20000, currentStock: 0 });
  };

  const handleAddNozzle = () => {
    if (!newNozzle.name.trim() || !newNozzle.tankId) return;
    // Auto-detect fuelType from tank
    const selectedTank = tanks.find((_, i) => i.toString() === newNozzle.tankId);
    if (!selectedTank) return;

    setNozzles([...nozzles, { 
      name: newNozzle.name, 
      pumpId: newNozzle.pumpId,
      tankId: newNozzle.tankId,
      openingReading: newNozzle.openingReading
    }]);
    
    setNewNozzle({ ...newNozzle, name: '', openingReading: 0 });
  };

  const handleAddStaff = () => {
    if (!newStaff.name.trim() || !newStaff.pin.trim()) return;
    setStaff([...staff, { ...newStaff }]);
    setNewStaff({ name: '', phone: '', pin: '' });
  };

  const handleGoLive = async () => {
    if (!canFinish) return;
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));

    // Compile Products
    const products: Product[] = [
      { id: 'prod_pmo', name: 'Super Petrol', urduName: 'سپر پٹرول', type: 'fuel', rate: petrolRate, unit: 'Liters', currentStock: 0, minStock: 0 },
      { id: 'prod_hsd', name: 'High Speed Diesel', urduName: 'ہائی اسپیڈ ڈیزل', type: 'fuel', rate: dieselRate, unit: 'Liters', currentStock: 0, minStock: 0 }
    ];

    // Compile Tanks
    const compiledTanks: Tank[] = tanks.map((t, index) => ({
      id: `tank_${index + 1}`,
      name: t.name,
      productId: t.fuelType === 'Petrol' ? 'prod_pmo' : 'prod_hsd',
      capacity: t.capacity,
      currentStock: t.currentStock,
      openingStock: t.currentStock,
      safeLevel: t.capacity * 0.2, // 20%
      criticalLevel: t.capacity * 0.1, // 10%
      dipChart: []
    }));

    // Compile Nozzles
    const compiledNozzles: Nozzle[] = nozzles.map((n, index) => {
      const selectedTank = tanks[parseInt(n.tankId)];
      return {
        id: `nzl_${index + 1}`,
        pumpId: `pump_${n.pumpId}`,
        name: n.name,
        tankId: `tank_${parseInt(n.tankId) + 1}`,
        productId: selectedTank?.fuelType === 'Petrol' ? 'prod_pmo' : 'prod_hsd',
        currentReading: n.openingReading
      };
    });

    // Compile Staff (Owner + Cashiers)
    const compiledStaff: Staff[] = [
      { id: 'staff_owner', name: ownerName, urduName: ownerName, phone: ownerPhone, role: 'manager', pin: ownerPin, active: true, salary: 0, advances: 0 },
      ...staff.map((s, idx) => ({
        id: `staff_c_${idx + 1}`,
        name: s.name,
        urduName: s.name,
        phone: s.phone,
        role: 'cashier' as const,
        pin: s.pin,
        active: true,
        salary: 0,
        advances: 0
      }))
    ];

    onComplete({
      settings: { 
        ...settings, 
        setupCompleted: true,
        stationName: stationName
      },
      products,
      tanks: compiledTanks,
      nozzles: compiledNozzles,
      staff: compiledStaff
    });
  };

  const nextStep = () => setStep(s => Math.min(3, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const steps = [
    { title: 'Setup', num: 1 },
    { title: 'Hardware', num: 2 },
    { title: 'Prices & Finish', num: 3 }
  ];

  return (
    <div className="fixed inset-0 z-[9000] bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-2xl bg-[var(--bg-card)]/90 backdrop-blur-xl border border-[var(--border-main)] rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90dvh]">
        
        {/* Wizard Header / Stepper */}
        <div className="p-6 border-b border-[var(--border-main)] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-wider">
              Welcome to FuelPro
            </h2>
            {onCancel && (
              <button onClick={onCancel} className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                SKIP SETUP
              </button>
            )}
          </div>
          
          <div className="relative flex justify-between">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
            
            {steps.map((s) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors duration-300 ${
                    isCompleted ? 'bg-green-500 text-white' : 
                    isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${
                    isActive ? 'text-orange-500' : isCompleted ? 'text-green-500' : 'text-slate-500'
                  }`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1 pb-safe relative scrollbar-hide">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: QUICK SETUP */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-black text-[var(--text-main)] mb-2">Let's get your station ready in under 2 minutes.</h3>
                  <p className="text-[var(--text-muted)] text-sm font-semibold">Enter your basic station details to begin.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-2">
                      <Building2 className="w-4 h-4 text-orange-500" />
                      Station Name
                    </label>
                    <input 
                      type="text" 
                      value={stationName}
                      onChange={e => setStationName(e.target.value)}
                      placeholder="e.g. Al-Fatah Filling Station"
                      className="w-full bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-[var(--text-main)] focus:outline-none focus:border-orange-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-2">
                      <Store className="w-4 h-4 text-orange-500" />
                      Business Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setBusinessType('fuel')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                          businessType === 'fuel' 
                            ? 'bg-orange-500/10 border-orange-500 text-orange-500' 
                            : 'bg-[var(--bg-app)] border-[var(--border-main)] text-[var(--text-muted)] hover:border-slate-500'
                        }`}
                      >
                        <Fuel className="w-6 h-6" />
                        <span className="font-bold text-sm">Fuel Station</span>
                      </button>
                      <button
                        onClick={() => setBusinessType('lube')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                          businessType === 'lube' 
                            ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                            : 'bg-[var(--bg-app)] border-[var(--border-main)] text-[var(--text-muted)] hover:border-slate-500'
                        }`}
                      >
                        <Droplets className="w-6 h-6" />
                        <span className="font-bold text-sm">Fuel + Lubricants</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: TANKS & NOZZLES */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Tanks Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                      <Cylinder className="w-4 h-4 text-orange-500" />
                      Underground Tanks
                    </label>
                    <span className="text-xs font-bold text-slate-500">{tanks.length} Added</span>
                  </div>
                  
                  {/* Added Tanks List */}
                  {tanks.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {tanks.map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                          <div>
                            <p className="text-sm font-bold text-slate-200">{t.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{t.fuelType} • {t.capacity.toLocaleString()}L Capacity</p>
                          </div>
                          <button onClick={() => setTanks(tanks.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Tank Form */}
                  <div className="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        placeholder="Tank Name (e.g. PMG Tank)" 
                        value={newTank.name}
                        onChange={e => setNewTank({...newTank, name: e.target.value})}
                        className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none"
                      />
                      <select 
                        value={newTank.fuelType}
                        onChange={e => setNewTank({...newTank, fuelType: e.target.value})}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none"
                      >
                        <option>Petrol</option>
                        <option>Diesel</option>
                      </select>
                      <input 
                        type="number"
                        placeholder="Capacity (L)" 
                        value={newTank.capacity || ''}
                        onChange={e => setNewTank({...newTank, capacity: parseInt(e.target.value) || 0})}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none"
                      />
                      <input 
                        type="number"
                        placeholder="Current Stock (L)" 
                        value={newTank.currentStock || ''}
                        onChange={e => setNewTank({...newTank, currentStock: parseInt(e.target.value) || 0})}
                        className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <button 
                      onClick={handleAddTank}
                      disabled={!newTank.name.trim()}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Tank
                    </button>
                  </div>
                </div>

                {/* Nozzles Section */}
                {tanks.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-[var(--border-main)]">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                        <Fuel className="w-4 h-4 text-orange-500" />
                        Nozzles & Dispensers
                      </label>
                      <span className="text-xs font-bold text-slate-500">{nozzles.length} Added</span>
                    </div>

                    {/* Added Nozzles List */}
                    {nozzles.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {nozzles.map((n: any, idx: any) => {
                          const tankName = tanks[parseInt(n.tankId)]?.name || 'Unknown';
                          return (
                            <div key={idx} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                              <div>
                                <p className="text-sm font-bold text-slate-200">{n.name}</p>
                                <p className="text-xs text-slate-400 font-medium">Pump {n.pumpId} • Connects to: {tankName}</p>
                              </div>
                              <button onClick={() => setNozzles(nozzles.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add Nozzle Form */}
                    <div className="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          placeholder="Nozzle Name (e.g. N1 P1)" 
                          value={newNozzle.name}
                          onChange={e => setNewNozzle({...newNozzle, name: e.target.value})}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none"
                        />
                        <select 
                          value={newNozzle.tankId}
                          onChange={e => setNewNozzle({...newNozzle, tankId: e.target.value})}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none"
                        >
                          <option value="" disabled>Select Tank</option>
                          {tanks.map((t, i) => (
                            <option key={i} value={i.toString()}>{t.name} ({t.fuelType})</option>
                          ))}
                        </select>
                        <input 
                          type="number"
                          placeholder="Pump No. (e.g. 1)" 
                          value={newNozzle.pumpId || ''}
                          onChange={e => setNewNozzle({...newNozzle, pumpId: e.target.value})}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none"
                        />
                        <input 
                          type="number"
                          placeholder="Opening Reading" 
                          value={newNozzle.openingReading || ''}
                          onChange={e => setNewNozzle({...newNozzle, openingReading: parseFloat(e.target.value) || 0})}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <button 
                        onClick={handleAddNozzle}
                        disabled={!newNozzle.name.trim() || !newNozzle.tankId}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Nozzle
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: RATES, STAFF & PROFILE */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 pb-10"
              >
                {/* Rates */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-2">
                    <Hash className="w-4 h-4 text-orange-500" />
                    Current Fuel Rates (Rs.)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl p-4">
                      <span className="text-xs font-bold text-slate-500 uppercase">Super Petrol</span>
                      <input 
                        type="number" 
                        value={petrolRate || ''}
                        onChange={e => setPetrolRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent text-2xl font-black text-[var(--text-main)] mt-2 focus:outline-none"
                      />
                    </div>
                    <div className="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl p-4">
                      <span className="text-xs font-bold text-slate-500 uppercase">High Speed Diesel</span>
                      <input 
                        type="number" 
                        value={dieselRate || ''}
                        onChange={e => setDieselRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent text-2xl font-black text-[var(--text-main)] mt-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Staff */}
                <div className="space-y-4 pt-4 border-t border-[var(--border-main)]">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                      <Users className="w-4 h-4 text-orange-500" />
                      Register Staff (Optional)
                    </label>
                    <span className="text-xs font-bold text-slate-500">{staff.length} Added</span>
                  </div>

                  {/* Added Staff */}
                  {staff.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {staff.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                          <div>
                            <p className="text-sm font-bold text-slate-200">{s.name}</p>
                            <p className="text-xs text-slate-400 font-medium">PIN: {s.pin} • {s.phone || 'No Phone'}</p>
                          </div>
                          <button onClick={() => setStaff(staff.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Staff Form */}
                  <div className="bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        placeholder="Staff Name" 
                        value={newStaff.name}
                        onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                        className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none"
                      />
                      <input 
                        type="text"
                        placeholder="Phone No." 
                        value={newStaff.phone}
                        onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none"
                      />
                      <input 
                        type="text"
                        placeholder="4-Digit PIN" 
                        maxLength={4}
                        value={newStaff.pin}
                        onChange={e => setNewStaff({...newStaff, pin: e.target.value.replace(/\D/g,'')})}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-orange-500 outline-none tracking-widest font-mono"
                      />
                    </div>
                    <button 
                      onClick={handleAddStaff}
                      disabled={!newStaff.name.trim() || newStaff.pin.length < 4}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Cashier
                    </button>
                  </div>
                </div>

                {/* Owner Profile */}
                <div className="space-y-4 pt-4 border-t border-[var(--border-main)]">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                      <User className="w-4 h-4 text-orange-500" />
                      Owner Profile (Admin)
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input 
                        type="text" 
                        value={ownerName}
                        onChange={e => setOwnerName(e.target.value)}
                        placeholder="Owner Name *"
                        className="w-full bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] focus:outline-none focus:border-orange-500 font-medium"
                      />
                    </div>
                    <div>
                      <input 
                        type="tel" 
                        value={ownerPhone}
                        onChange={e => setOwnerPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="w-full bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] focus:outline-none focus:border-orange-500 font-medium"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input 
                        type="text" 
                        maxLength={6}
                        value={ownerPin}
                        onChange={e => setOwnerPin(e.target.value.replace(/\D/g,''))}
                        placeholder="Admin PIN (4-6 Digits) *"
                        className="w-full bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm text-[var(--text-main)] focus:outline-none focus:border-orange-500 font-medium tracking-[0.2em]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Wizard Footer / Controls */}
        <div className="p-6 border-t border-[var(--border-main)] shrink-0 bg-[var(--bg-card)] rounded-b-3xl">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={prevStep}
                disabled={isGenerating}
                className="px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[var(--bg-app)] border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={nextStep}
                disabled={
                  (step === 1 && !canProceedToStep2) || 
                  (step === 2 && !canProceedToStep3)
                }
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleGoLive}
                disabled={!canFinish || isGenerating}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Launching...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>GO LIVE 🚀</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
