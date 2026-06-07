import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Fuel,
  Building,
  Database,
  Zap,
  TrendingUp,
  Users2,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Languages,
  Plus,
  Minus,
  HelpCircle,
  AlertCircle,
  Factory,
  Gauge,
  ShieldCheck,
  Truck,
  X
} from 'lucide-react';
import { GlobalSettings, Tank, Nozzle, Product, Staff } from '../../types';
import { useStation } from '../../contexts/StationContext';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type FuelType = 'petrol' | 'diesel' | 'cng' | 'hobc';
type BusinessType = 'fuel_only' | 'fuel_cng' | 'cng_only';

interface TankInput {
  name: string;
  fuelType: FuelType;
  capacity: number;
  safeLevel: number;    // percentage 0–100
  criticalLevel: number; // percentage 0–100
}

interface PumpInput {
  name: string;
  nozzleCount: 2 | 4;
}

interface NozzleInput {
  name: string;
  tankIndex: number; // explicit tank index
  startReading: number;
}

interface StaffInput {
  name: string;
  urduName: string;
  role: 'salesman' | 'manager' | 'cashier';
  salary: number;
  pin: string;
}

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

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const FUEL_LABELS: Record<FuelType, { en: string; ur: string; color: string; emoji: string }> = {
  petrol: { en: 'Petrol (PMG)', ur: 'پٹرول (PMG)', color: 'text-red-600 bg-red-50 border-red-200', emoji: '🔴' },
  hobc:   { en: 'HOBC / Super (RON 95)', ur: 'سپر پٹرول (HOBC)', color: 'text-orange-600 bg-orange-50 border-orange-200', emoji: '🟠' },
  diesel: { en: 'HSD (Diesel)', ur: 'ڈیزل (HSD)', color: 'text-blue-600 bg-blue-50 border-blue-200', emoji: '🔵' },
  cng:    { en: 'CNG (Gas)', ur: 'سی این جی (گیس)', color: 'text-green-600 bg-green-50 border-green-200', emoji: '💚' },
};

const TOTAL_STEPS = 9;

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function OnboardingWizard({ onComplete, onCancel, currentLanguage }: OnboardingWizardProps) {
  const { showToast } = useStation();
  const [lang, setLang] = useState<'en' | 'ur'>(currentLanguage === 'ur' ? 'ur' : 'en');
  const [step, setStep] = useState<number>(0); // 0 = splash screen
  const [errors, setErrors] = useState<Record<string, string>>({});

  const t = (en: string, ur: string) => lang === 'ur' ? ur : en;

  // ── STEP 1: Station Info ──────────────────────────────────
  const [businessType, setBusinessType] = useState<BusinessType>('fuel_only');
  const [stationName, setStationName] = useState('');
  const [stationUrduName, setStationUrduName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [ntn, setNtn] = useState('');
  const [ograNo, setOgraNo] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [ownerPin, setOwnerPin] = useState('');

  // ── STEP 2: Products ─────────────────────────────────────────
  const [selectedProducts, setSelectedProducts] = useState<FuelType[]>(['petrol', 'diesel']);

  // ── STEP 3: Tanks ──────────────────────────────────────────
  const [tankInputs, setTankInputs] = useState<TankInput[]>([
    { name: 'Tank 1 — Petrol', fuelType: 'petrol', capacity: 25000, safeLevel: 12, criticalLevel: 5 },
    { name: 'Tank 2 — Diesel', fuelType: 'diesel', capacity: 25000, safeLevel: 12, criticalLevel: 5 },
  ]);

  // ── STEP 6: Opening Stock (stored here temporarily during wizard) ──
  const [openingStocks, setOpeningStocks] = useState<Record<number, number>>({
    0: 12000,
    1: 10000,
  });

  // ── STEP 3: Pump Machines ──────────────────────────────────
  const [pumpInputs, setPumpInputs] = useState<PumpInput[]>([
    { name: 'Pump Machine 1', nozzleCount: 2 },
    { name: 'Pump Machine 2', nozzleCount: 2 },
  ]);

  // ── STEP 4: Nozzles ────────────────────────────────────────
  const [nozzleInputs, setNozzleInputs] = useState<NozzleInput[]>([
    { name: 'Pump 1A', tankIndex: 0, startReading: 125000 },
    { name: 'Pump 1B', tankIndex: 0, startReading: 132000 },
    { name: 'Pump 2A', tankIndex: 1, startReading: 85000 },
    { name: 'Pump 2B', tankIndex: 1, startReading: 91000 },
  ]);

  // ── STEP 5: Fuel Rates ─────────────────────────────────────
  const [rates, setRates] = useState<Record<FuelType, number>>({
    petrol: 290.50,
    hobc: 320.00,
    diesel: 275.00,
    cng: 210.00,
  });
  const [purchasePrices, setPurchasePrices] = useState<Record<FuelType, number>>({
    petrol: 285.00,
    hobc: 314.00,
    diesel: 270.00,
    cng: 200.00,
  });

  // ── STEP 6: Staff ──────────────────────────────────────────
  const [staffList, setStaffList] = useState<StaffInput[]>([
    { name: '', urduName: '', role: 'salesman', salary: 25000, pin: '' }
  ]);

  // ─────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────
  const clearError = (key: string) => setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  const addError = (key: string, msg: string) => setErrors(prev => ({ ...prev, [key]: msg }));

  const validateStep = (s: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (s === 1) { // Station Info
      if (!stationName.trim()) newErrors['stationName'] = t('Station name is required', 'اسٹیشن کا نام ضروری ہے');
      if (!ownerName.trim()) newErrors['ownerName'] = t('Owner name is required', 'مالک کا نام ضروری ہے');
      if (!city.trim()) newErrors['city'] = t('City is required', 'شہر کا نام ضروری ہے');
      if (!phone.trim()) newErrors['phone'] = t('Phone number is required', 'فون نمبر ضروری ہے');
      else if (!/^03\d{9}$/.test(phone.replace(/[\s-]/g, ''))) newErrors['phone'] = t('Enter a valid Pakistani mobile (03XXXXXXXXX)', 'درست پاکستانی نمبر درج کریں (03XXXXXXXXX)');
      if (!ownerPin.trim()) newErrors['ownerPin'] = t('Owner PIN is required', 'مالک کا پن ضروری ہے');
      else if (!/^\d{4,6}$/.test(ownerPin)) newErrors['ownerPin'] = t('PIN must be 4–6 digits', 'پن 4 سے 6 ہندسوں کا ہونا چاہیے');
    }

    if (s === 2) { // Products
      if (selectedProducts.length === 0) newErrors['products'] = t('Select at least one fuel product', 'کم از کم ایک ایندھن منتخب کریں');
    }

    if (s === 3) { // Tanks
      const names = new Set<string>();
      tankInputs.forEach((tk, i) => {
        if (!tk.name.trim()) newErrors[`tank_name_${i}`] = t('Tank name required', 'ٹینک کا نام ضروری ہے');
        if (names.has(tk.name.toLowerCase())) newErrors[`tank_name_${i}`] = t('Duplicate tank name', 'ٹینک کا نام دہرایا گیا');
        names.add(tk.name.toLowerCase());
        if (!tk.fuelType) newErrors[`tank_ft_${i}`] = t('Fuel type required', 'ایندھن کی قسم ضروری ہے');
        if (tk.capacity <= 0) newErrors[`tank_cap_${i}`] = t('Capacity must be greater than 0', 'گنجائش 0 سے زیادہ ہونی چاہیے');
        if (tk.safeLevel >= tk.capacity) newErrors[`tank_levels_${i}`] = t('Safe level must be less than capacity', 'محفوظ سطح گنجائش سے کم ہونی چاہیے');
        if (tk.criticalLevel >= tk.safeLevel) newErrors[`tank_levels_${i}`] = t('Critical level must be less than safe level', 'تنقیدی سطح محفوظ سطح سے کم ہونی چاہیے');
      });
    }

    if (s === 4) { // Pumps & Nozzles
      const names = new Set<string>();
      pumpInputs.forEach((pm, i) => {
        if (!pm.name.trim()) newErrors[`pump_name_${i}`] = t('Pump name required', 'پمپ کا نام ضروری ہے');
        if (names.has(pm.name.toLowerCase())) newErrors[`pump_name_${i}`] = t('Duplicate pump name', 'پمپ کا نام دہرایا گیا');
        names.add(pm.name.toLowerCase());
      });
      nozzleInputs.forEach((nz, i) => {
        if (!nz.name.trim()) newErrors[`nozzle_name_${i}`] = t('Nozzle name required', 'نوزل کا نام ضروری ہے');
        if (nz.tankIndex < 0 || nz.tankIndex >= tankInputs.length) newErrors[`nozzle_tank_${i}`] = t('Select a tank for this nozzle', 'اس نوزل کے لیے ٹینک منتخب کریں');
        if (nz.startReading < 0) newErrors[`nozzle_reading_${i}`] = t('Reading cannot be negative', 'ریڈنگ منفی نہیں ہو سکتی');
      });
    }

    if (s === 5) { // Rates
      selectedProducts.forEach(ft => {
        if (rates[ft] <= 0) newErrors[`rate_${ft}`] = t('Rate must be greater than 0', 'ریٹ صفر سے زیادہ ہونا چاہیے');
        if (purchasePrices[ft] < 0) newErrors[`pp_${ft}`] = t('Purchase price cannot be negative', 'خریداری قیمت منفی نہیں ہو سکتی');
      });
    }

    if (s === 6) { // Opening Stock
      tankInputs.forEach((tk, i) => {
        const stock = openingStocks[i] || 0;
        if (stock < 0) newErrors[`stock_${i}`] = t('Stock cannot be negative', 'اسٹاک منفی نہیں ہو سکتا');
        if (stock > tk.capacity) newErrors[`stock_${i}`] = t('Stock cannot exceed capacity', 'اسٹاک گنجائش سے زیادہ نہیں ہو سکتا');
      });
    }

    if (s === 7) { // Staff
      const allPins = [ownerPin];
      staffList.forEach((st, i) => {
        if (!st.name.trim()) newErrors[`staff_name_${i}`] = t('Staff name required', 'اسٹاف کا نام ضروری ہے');
        if (!st.pin.trim()) newErrors[`staff_pin_${i}`] = t('PIN required', 'پن ضروری ہے');
        else if (!/^\d{4,6}$/.test(st.pin)) newErrors[`staff_pin_${i}`] = t('PIN must be 4–6 digits', 'پن 4 سے 6 ہندسوں کا ہونا چاہیے');
        else if (allPins.includes(st.pin)) newErrors[`staff_pin_${i}`] = t('This PIN is already used', 'یہ پن پہلے سے استعمال ہو رہا ہے');
        else allPins.push(st.pin);
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────
  const activeFuelTypes: FuelType[] = selectedProducts;

  // Auto-sync nozzles when pump config changes
  const syncNozzlesFromPumps = useCallback((pumps: PumpInput[], tanks: TankInput[]) => {
    const newNozzles: NozzleInput[] = [];
    pumps.forEach((pump, pi) => {
      const sides = pump.nozzleCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B'];
      sides.forEach(side => {
        // Find best matching tank (first available)
        const defaultFuel: FuelType = tanks.length > 0 ? tanks[0].fuelType : 'petrol';
        const defaultTankIdx = 0;
        newNozzles.push({
          name: `P${pi + 1}${side}`,
          tankIndex: defaultTankIdx,
          startReading: 100000
        });
      });
    });
    setNozzleInputs(newNozzles);
  }, []);

  // ─────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 0) { setStep(1); return; }
    if (!validateStep(step)) {
      showToast(t('Please fix the highlighted errors to continue.', 'آگے بڑھنے کے لیے خطاؤں کو درست کریں۔'), 'error');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => Math.max(0, prev - 1));

  const handleJumpTo = (s: number) => {
    if (s < step) setStep(s); // can only jump backward to completed steps
  };

  // ─────────────────────────────────────────────────────────
  // TANK HANDLERS
  // ─────────────────────────────────────────────────────────
  const addTank = () => {
    if (tankInputs.length >= 12) return;
    setTankInputs(prev => [...prev, {
      name: `Tank ${prev.length + 1}`,
      fuelType: selectedProducts[0] || 'petrol',
      capacity: 25000,
      safeLevel: 12,
      criticalLevel: 5
    }]);
  };

  const removeTank = (idx: number) => {
    if (tankInputs.length <= 1) return;
    setTankInputs(prev => prev.filter((_, i) => i !== idx));
  };

  const updateTank = (idx: number, key: keyof TankInput, value: any) => {
    setTankInputs(prev => prev.map((t, i) => i === idx ? { ...t, [key]: value } : t));
    clearError(`tank_${key}_${idx}`);
  };

  // ─────────────────────────────────────────────────────────
  // PUMP HANDLERS
  // ─────────────────────────────────────────────────────────
  const addPump = () => {
    if (pumpInputs.length >= 12) return;
    const newPumps = [...pumpInputs, { name: `Pump Machine ${pumpInputs.length + 1}`, nozzleCount: 2 as 2 | 4 }];
    setPumpInputs(newPumps);
    syncNozzlesFromPumps(newPumps, tankInputs);
  };

  const removePump = (idx: number) => {
    if (pumpInputs.length <= 1) return;
    const newPumps = pumpInputs.filter((_, i) => i !== idx);
    setPumpInputs(newPumps);
    syncNozzlesFromPumps(newPumps, tankInputs);
  };

  const updatePump = (idx: number, key: keyof PumpInput, value: any) => {
    const newPumps = pumpInputs.map((p, i) => i === idx ? { ...p, [key]: value } : p);
    setPumpInputs(newPumps);
    if (key === 'nozzleCount') syncNozzlesFromPumps(newPumps, tankInputs);
    clearError(`pump_${key}_${idx}`);
  };

  // ─────────────────────────────────────────────────────────
  // NOZZLE HANDLERS
  // ─────────────────────────────────────────────────────────
  const updateNozzle = (idx: number, key: keyof NozzleInput, value: any) => {
    setNozzleInputs(prev => prev.map((n, i) => i === idx ? { ...n, [key]: value } : n));
    clearError(`nozzle_${key}_${idx}`);
  };

  // ─────────────────────────────────────────────────────────
  // STAFF HANDLERS
  // ─────────────────────────────────────────────────────────
  const addStaff = () => {
    if (staffList.length >= 10) return;
    setStaffList(prev => [...prev, { name: '', urduName: '', role: 'salesman', salary: 25000, pin: '' }]);
  };

  const removeStaff = (idx: number) => {
    if (staffList.length <= 1) return;
    setStaffList(prev => prev.filter((_, i) => i !== idx));
  };

  const updateStaff = (idx: number, key: keyof StaffInput, value: any) => {
    setStaffList(prev => prev.map((s, i) => i === idx ? { ...s, [key]: value } : s));
    clearError(`staff_${key}_${idx}`);
  };

  // ─────────────────────────────────────────────────────────
  // FINAL SAVE
  // ─────────────────────────────────────────────────────────
  const handleSaveAll = () => {
    // Build products ONLY for selected fuel types
    const defaultProducts: Product[] = activeFuelTypes.map(ft => {
      const tanksForType = tankInputs.filter(tk => tk.fuelType === ft);
      const totalStock = tanksForType.reduce((sum, tk, idx) => sum + (openingStocks[tankInputs.indexOf(tk)] || 0), 0);
      const totalCapacity = tanksForType.reduce((sum, tk) => sum + tk.capacity, 0);
      const fuelInfo = FUEL_LABELS[ft];
      return {
        id: ft,
        name: fuelInfo.en.split(' ')[0],
        urduName: fuelInfo.ur.split(' ')[0],
        rate: rates[ft],
        purchasePrice: purchasePrices[ft],
        unit: ft === 'cng' ? 'KG' : 'Liters',
        type: 'fuel' as const,
        currentStock: totalStock,
        minStock: ft === 'cng' ? 500 : 2500,
        capacity: totalCapacity
      };
    });

    // Build tanks
    const convertedTanks: Tank[] = tankInputs.map((tk, idx) => {
      const tkStock = openingStocks[idx] || 0;
      return {
      id: `tank_${Date.now()}_${idx}`,
      name: tk.name,
      productId: tk.fuelType,
      capacity: tk.capacity,
      safeLevel: tk.safeLevel,
      criticalLevel: tk.criticalLevel,
      currentStock: tkStock,
      openingStock: tkStock,
      physicalLabel: `T-${idx + 1}`,
      dipChart: [
        { cm: 10, liters: Math.round(tk.capacity * 0.02) },
        { cm: 50, liters: Math.round(tk.capacity * 0.10) },
        { cm: 100, liters: Math.round(tk.capacity * 0.30) },
        { cm: 150, liters: Math.round(tk.capacity * 0.55) },
        { cm: 200, liters: Math.round(tk.capacity * 0.80) },
        { cm: 250, liters: tk.capacity }
      ]
    };
  });

    // Build nozzles with EXPLICIT tank linkage (no heuristic)
    const nozzlesByPump: Record<string, number> = {};
    const convertedNozzles: Nozzle[] = nozzleInputs.map((nz, idx) => {
      // Determine pump ID from pump config
      let pumpId = 'pump_1';
      let totalSoFar = 0;
      for (let pi = 0; pi < pumpInputs.length; pi++) {
        totalSoFar += pumpInputs[pi].nozzleCount;
        if (idx < totalSoFar) {
          pumpId = `pump_${pi + 1}`;
          break;
        }
      }

      // Explicit tank linkage
      const linkedTank = convertedTanks[nz.tankIndex];
      return {
        id: `nz_${Date.now()}_${idx}`,
        pumpId,
        name: nz.name,
        productId: linkedTank?.productId || 'petrol',
        tankId: linkedTank?.id,
        startReading: nz.startReading,
        currentReading: nz.startReading
      };
    });

    // Build staff
    const ownerStaff: Staff = {
      id: `st_owner_${Date.now()}`,
      name: ownerName || 'Owner',
      urduName: ownerName || 'مالک',
      role: 'owner',
      salary: 0,
      advances: 0,
      active: true,
      pin: ownerPin
    };

    const convertedStaff: Staff[] = staffList.map((st, idx) => ({
      id: `st_crew_${Date.now()}_${idx}`,
      name: st.name,
      urduName: st.urduName || st.name,
      role: st.role,
      salary: st.salary,
      advances: 0,
      active: true,
      pin: st.pin
    }));

    // Build settings — NO fake NTN
    const updatedSettings: GlobalSettings = {
      stationName: stationName || 'FuelPro Station',
      stationUrduName: stationUrduName || 'فیول پرو اسٹیشن',
      address: `${city}, Pakistan`,
      ntn: ntn.trim() || '', // real NTN or blank — never auto-generated
      ownerContact: phone,
      theme: 'light',
      language: lang,
      setupCompleted: true,
      setupVersion: 2,
      // Extra fields stored in settings for display
      ograNo: ograNo.trim(),
      supplierName: supplierName.trim(),
    } as GlobalSettings;

    onComplete({
      settings: updatedSettings,
      tanks: convertedTanks,
      nozzles: convertedNozzles,
      products: defaultProducts,
      staff: [ownerStaff, ...convertedStaff]
    });
  };

  // ─────────────────────────────────────────────────────────
  // STEP LABELS
  // ─────────────────────────────────────────────────────────
  const stepLabels = [
    t('Station', 'اسٹیشن'),
    t('Products', 'مصنوعات'),
    t('Tanks', 'ٹینکس'),
    t('Pumps & Nozzles', 'پمپس و نوزلز'),
    t('Rates', 'ریٹس'),
    t('Stock', 'اسٹاک'),
    t('Staff', 'عملہ'),
    t('Review', 'جائزہ'),
    t('Done', 'مکمل'),
  ];

  // ─────────────────────────────────────────────────────────
  // ERROR HELPER
  // ─────────────────────────────────────────────────────────
  const Err = ({ id }: { id: string }) => errors[id] ? (
    <p className="flex items-center gap-1 text-[10px] text-red-500 font-sans font-bold mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {errors[id]}
    </p>
  ) : null;

  const inputCls = (errKey: string) =>
    `w-full border rounded-lg p-2.5 outline-none text-xs font-sans transition-colors ${
      errors[errKey]
        ? 'border-red-400 bg-red-50 focus:border-red-500'
        : 'border-slate-200 bg-white focus:border-orange-500'
    }`;

  // ─────────────────────────────────────────────────────────
  // FUEL TYPE CHIP
  // ─────────────────────────────────────────────────────────
  const FuelChip = ({ ft }: { ft: FuelType }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${FUEL_LABELS[ft].color}`}>
      {FUEL_LABELS[ft].emoji} {lang === 'ur' ? FUEL_LABELS[ft].ur : FUEL_LABELS[ft].en}
    </span>
  );

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <motion.div
        initial={{ y: 40, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative"
      >

        {/* ── TOP BAR ── */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-white text-sm">FP</div>
            <div>
              <span className="font-sans font-black text-white text-xs leading-none block">
                {t('FuelPro Station Setup', 'فیول پرو اسٹیشن سیٹ اپ')}
              </span>
              <span className="font-mono text-[10px] text-orange-100 block">
                {step === 0 ? t('Welcome', 'خوش آمدید') : t(`Step ${step} of ${TOTAL_STEPS}`, `مرحلہ ${step} از ${TOTAL_STEPS}`)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer font-bold"
            >
              <Languages className="h-3.5 w-3.5" />
              {lang === 'en' ? 'اردو' : 'EN'}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer font-bold"
              >
                <X className="h-3 w-3" />
                {t('Skip', 'چھوڑیں')}
              </button>
            )}
          </div>
        </div>

        {/* ── STEPPER (visible on steps 1–8) ── */}
        {step > 0 && step < 9 && (
          <div className="bg-white border-b border-slate-100 px-4 py-3">
            <div className="flex items-end justify-between">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((num) => {
                const isActive = step === num;
                const isCompleted = step > num;
                return (
                  <React.Fragment key={num}>
                    <button
                      onClick={() => handleJumpTo(num)}
                      disabled={num > step}
                      className="flex flex-col items-center gap-1 cursor-pointer disabled:cursor-default group"
                    >
                      <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center font-sans text-[10px] sm:text-xs font-bold transition-all ${
                        isActive ? 'bg-orange-600 text-white ring-4 ring-orange-500/15 scale-110'
                          : isCompleted ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isCompleted ? '✓' : num}
                      </div>
                      <span className={`hidden sm:block text-[9px] font-bold leading-none transition-colors ${
                        isActive ? 'text-orange-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {stepLabels[num - 1]}
                      </span>
                    </button>
                    {num < TOTAL_STEPS && (
                      <div className={`flex-1 h-[2px] mb-3.5 mx-1 transition-all rounded-full ${step > num ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP BODY ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* ╔══ SPLASH ══╗ */}
          {step === 0 && (
            <div className="text-center space-y-6 py-8">
              <div className="mx-auto w-20 h-20 rounded-[2rem] bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Fuel className="h-10 w-10 text-white stroke-[1.5]" />
              </div>
              <div className="space-y-3 max-w-md mx-auto">
                <h2 className="font-sans text-2xl font-black text-slate-900 tracking-tight">
                  {t('Welcome to FuelPro!', 'فیول پرو میں خوش آمدید!')}
                </h2>
                <p className="font-sans text-sm text-slate-500 leading-relaxed">
                  {t(
                    'The complete fuel station accounting ERP. This 8-step wizard configures your tanks, pump machines, nozzles, fuel rates, and staff accounts. Ready in under 5 minutes.',
                    'مکمل فیول اسٹیشن اکاؤنٹنگ سسٹم۔ یہ 8 مرحلہ وزرڈ آپ کے ٹینکس، پمپ مشینیں، نوزلز، ایندھن کے ریٹ اور عملے کے اکاؤنٹ ترتیب دے گا۔ 5 منٹ سے کم وقت میں۔'
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto text-xs">
                {[
                  { icon: Database, label: t('Tanks', 'ٹینکس') },
                  { icon: Gauge, label: t('Pumps & Nozzles', 'پمپس اور نوزلز') },
                  { icon: TrendingUp, label: t('Fuel Rates', 'ایندھن ریٹس') },
                  { icon: Users2, label: t('Staff Accounts', 'عملے کے کھاتے') },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Icon className="h-5 w-5 text-orange-600" />
                    <span className="font-sans font-bold text-slate-600 text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold font-sans rounded-xl shadow-lg shadow-orange-500/30 inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                {t('Begin Setup', 'سیٹ اپ شروع کریں')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ╔══ STEP 1: STATION INFO ══╗ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building className="h-5 w-5 text-orange-600" />
                <h3 className="font-sans text-sm font-black text-slate-900 uppercase tracking-wider">
                  {t('Station Identity & Owner Profile', 'اسٹیشن اور مالک کی معلومات')}
                </h3>
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                  {t('What type of fuel business is this?', 'یہ کس قسم کا فیول کاروبار ہے؟')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { val: 'fuel_only', label: t('Petrol/Diesel Station', 'پٹرول/ڈیزل اسٹیشن'), icon: '⛽' },
                    { val: 'fuel_cng', label: t('Petrol + CNG Combined', 'پٹرول + سی این جی'), icon: '⛽💚' },
                    { val: 'cng_only', label: t('CNG Only Station', 'صرف سی این جی اسٹیشن'), icon: '💚' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setBusinessType(opt.val as BusinessType)}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        businessType === opt.val
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-xl block mb-1">{opt.icon}</span>
                      <span className="font-sans font-bold text-xs block">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    {t('Station Name (English) *', 'اسٹیشن کا نام (انگریزی) *')}
                  </label>
                  <input type="text" placeholder={t('e.g. Al-Rehman Petroleum', 'مثلاً الرحمٰن پیٹرولیم')}
                    value={stationName} onChange={e => { setStationName(e.target.value); clearError('stationName'); }}
                    className={inputCls('stationName')} />
                  <Err id="stationName" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    {t('Station Name (Urdu)', 'اسٹیشن کا نام (اردو)')}
                  </label>
                  <input type="text" placeholder="مثلاً الرحمٰن پیٹرولیم"
                    value={stationUrduName} onChange={e => setStationUrduName(e.target.value)}
                    className={inputCls('')} />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    {t('Owner / Admin Full Name *', 'مالک / ایڈمن کا پورا نام *')}
                  </label>
                  <input type="text" placeholder="e.g. Umar Ali"
                    value={ownerName} onChange={e => { setOwnerName(e.target.value); clearError('ownerName'); }}
                    className={inputCls('ownerName')} />
                  <Err id="ownerName" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    {t('City / District *', 'شہر / ضلع *')}
                  </label>
                  <input type="text" placeholder={t('e.g. Karachi', 'مثلاً کراچی')}
                    value={city} onChange={e => { setCity(e.target.value); clearError('city'); }}
                    className={inputCls('city')} />
                  <Err id="city" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    {t('Mobile Number * (03XXXXXXXXX)', 'موبائل نمبر * (03XXXXXXXXX)')}
                  </label>
                  <input type="tel" placeholder="03168432329"
                    value={phone} onChange={e => { setPhone(e.target.value); clearError('phone'); }}
                    className={`${inputCls('phone')} font-mono`} />
                  <Err id="phone" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    {t('Owner Login PIN * (4–6 digits)', 'مالک کا لاگ ان پن * (4–6 ہندسے)')}
                  </label>
                  <input type="password" maxLength={6} placeholder="e.g. 1234"
                    value={ownerPin} onChange={e => { setOwnerPin(e.target.value.replace(/\D/g, '')); clearError('ownerPin'); }}
                    className={`${inputCls('ownerPin')} text-center tracking-widest font-mono font-black`} />
                  <Err id="ownerPin" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    {t('NTN / STRN Number (optional)', 'این ٹی این / ایس ٹی آر این نمبر (اختیاری)')}
                  </label>
                  <input type="text" placeholder="e.g. 1234567-8"
                    value={ntn} onChange={e => setNtn(e.target.value)}
                    className={inputCls('')} />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    {t('OGRA License / Dealer Code (optional)', 'او جی آر اے لائسنس / ڈیلر کوڈ (اختیاری)')}
                  </label>
                  <input type="text" placeholder="e.g. PSO-KHI-2024-001"
                    value={ograNo} onChange={e => setOgraNo(e.target.value)}
                    className={inputCls('')} />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    {t('Primary Fuel Supplier (optional)', 'بنیادی فیول سپلائر (اختیاری)')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['PSO', 'Shell', 'HASCOL', 'Other'].map(s => (
                      <button key={s} type="button" onClick={() => setSupplierName(s)}
                        className={`py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${supplierName === s ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-200 text-slate-600 hover:border-orange-400'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ╔══ STEP 2: PRODUCTS ══╗ */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Fuel className="h-5 w-5 text-orange-600" />
                <h3 className="font-sans text-sm font-black text-slate-900 uppercase tracking-wider">
                  {t('Select Fuel Products', 'ایندھن کی اقسام منتخب کریں')}
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                {t('Select all fuel types sold at this station. You can change this later.', 'اس اسٹیشن پر فروخت ہونے والے تمام ایندھن کی اقسام منتخب کریں۔')}
              </p>
              {errors['products'] && <p className="text-red-500 text-[11px] font-bold">⚠ {errors['products']}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.entries(FUEL_LABELS) as [FuelType, typeof FUEL_LABELS[FuelType]][]).map(([ft, info]) => {
                  const isSelected = selectedProducts.includes(ft);
                  return (
                    <button key={ft} type="button"
                      onClick={() => {
                        setSelectedProducts(prev =>
                          isSelected ? prev.filter(p => p !== ft) : [...prev, ft]
                        );
                        setErrors(prev => { const n = {...prev}; delete n['products']; return n; });
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        isSelected ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}>
                      <span className="text-2xl block mb-2">{info.emoji}</span>
                      <strong className={`block font-sans text-sm font-black ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}>
                        {lang === 'ur' ? info.ur : info.en}
                      </strong>
                      {isSelected && <CheckCircle className="absolute top-3 right-3 h-4 w-4 text-orange-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ╔══ STEP 3: TANKS ══╗ */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-orange-600" />
                  <h3 className="font-sans text-sm font-black text-slate-900 uppercase tracking-wider">
                    {t('Underground Storage Tanks', 'زیرِ زمین اسٹوریج ٹینکس')}
                  </h3>
                </div>
                <button onClick={addTank} disabled={tankInputs.length >= 12}
                  className="flex items-center gap-1 bg-orange-600 disabled:bg-slate-200 text-white disabled:text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:cursor-not-allowed transition-all hover:bg-orange-700">
                  <Plus className="h-3.5 w-3.5" />
                  {t('Add Tank', 'ٹینک شامل کریں')}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                {t(`${tankInputs.length} of 12 tanks configured`, `12 میں سے ${tankInputs.length} ٹینکس ترتیب دیے گئے`)}
              </p>

              <div className="space-y-4">
                {tankInputs.map((tk, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-orange-100">
                          {t(`Tank #${idx + 1}`, `ٹینک #${idx + 1}`)}
                        </span>
                        <FuelChip ft={tk.fuelType} />
                      </div>
                      {tankInputs.length > 1 && (
                        <button onClick={() => removeTank(idx)}
                          className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-lg hover:bg-red-50">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          {t('Tank Name / Label', 'ٹینک کا نام')}
                        </label>
                        <input type="text" value={tk.name}
                          onChange={e => updateTank(idx, 'name', e.target.value)}
                          placeholder={t('e.g. Tank A — Petrol', 'مثلاً ٹینک اے پٹرول')}
                          className={inputCls(`tank_name_${idx}`)} />
                        <Err id={`tank_name_${idx}`} />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          {t('Fuel Type', 'ایندھن کی قسم')}
                        </label>
                        <select value={tk.fuelType} onChange={e => updateTank(idx, 'fuelType', e.target.value)}
                          className={inputCls('')}>
                          {Object.entries(FUEL_LABELS).map(([ft, info]) => (
                            <option key={ft} value={ft}>{info.emoji} {lang === 'ur' ? info.ur : info.en}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          {t(`Max Capacity (${tk.fuelType === 'cng' ? 'KG' : 'Litres'}) *`, `کل گنجائش (${tk.fuelType === 'cng' ? 'کلوگرام' : 'لیٹر'}) *`)}
                        </label>
                        <input type="number" min="1000" value={tk.capacity}
                          onChange={e => updateTank(idx, 'capacity', Number(e.target.value))}
                          className={`${inputCls(`tank_cap_${idx}`)} font-mono`} />
                        <Err id={`tank_cap_${idx}`} />
                      </div>

                    </div>

                    {/* Safe/Critical Level Sliders */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50/60 rounded-xl p-3 border border-slate-100">
                      <div>
                        <label className="block text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">
                          ⚠️ {t(`Safe Level: ${tk.safeLevel}%`, `محفوظ سطح: ${tk.safeLevel}%`)}
                        </label>
                        <input type="range" min="5" max="30" step="1" value={tk.safeLevel}
                          onChange={e => updateTank(idx, 'safeLevel', Number(e.target.value))}
                          className="w-full accent-amber-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-red-600 uppercase tracking-wider mb-1">
                          🚨 {t(`Critical Level: ${tk.criticalLevel}%`, `تنقیدی سطح: ${tk.criticalLevel}%`)}
                        </label>
                        <input type="range" min="1" max="10" step="1" value={tk.criticalLevel}
                          onChange={e => updateTank(idx, 'criticalLevel', Number(e.target.value))}
                          className="w-full accent-red-500" />
                      </div>
                      <Err id={`tank_levels_${idx}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ╔══ STEP 4: PUMPS & NOZZLES ══╗ */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-orange-600" />
                  <h3 className="font-sans text-sm font-black text-slate-900 uppercase tracking-wider">
                    {t('Pumps & Nozzles', 'پمپس و نوزلز')}
                  </h3>
                </div>
                <button onClick={addPump} disabled={pumpInputs.length >= 12}
                  className="flex items-center gap-1 bg-orange-600 disabled:bg-slate-200 text-white disabled:text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:cursor-not-allowed transition-all hover:bg-orange-700">
                  <Plus className="h-3.5 w-3.5" />
                  {t('Add Pump', 'پمپ شامل کریں')}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-sans bg-blue-50 border border-blue-100 rounded-lg p-3">
                💡 {t('A "Pump Machine" is the physical dispenser unit. Each machine can have 2 or 4 nozzles.', 'پمپ مشین وہ فزیکل ڈسپنسر یونٹ ہے۔ ہر مشین میں 2 یا 4 نوزل ہو سکتی ہیں.')}
              </p>

              <div className="space-y-6">
                {pumpInputs.map((pm, pmIdx) => {
                  // Find nozzles for this pump
                  let cumulative = 0;
                  let startIndex = 0;
                  for (let i = 0; i < pmIdx; i++) {
                    startIndex += pumpInputs[i].nozzleCount;
                  }
                  
                  return (
                    <div key={pmIdx} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      {/* Pump Header */}
                      <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                            {t(`PUMP #${pmIdx + 1}`, `پمپ #${pmIdx + 1}`)}
                          </span>
                          <div>
                            <input type="text" value={pm.name}
                              onChange={e => updatePump(pmIdx, 'name', e.target.value)}
                              placeholder={t('Pump Name', 'پمپ کا نام')}
                              className={`bg-white border rounded px-2 py-1 text-sm font-bold w-40 focus:ring-2 focus:ring-blue-500 outline-none ${errors['pump_name_'+pmIdx] ? 'border-red-500' : 'border-slate-300'}`} />
                            {errors['pump_name_'+pmIdx] && <p className="text-red-500 text-[10px] mt-1">{errors['pump_name_'+pmIdx]}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
                            {[2, 4].map(n => (
                              <button key={n} type="button" onClick={() => updatePump(pmIdx, 'nozzleCount', n)}
                                className={`px-3 py-1 rounded text-xs font-bold transition-all ${pm.nozzleCount === n ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                                {n} {t('Nozzles', 'نوزلز')}
                              </button>
                            ))}
                          </div>
                          {pumpInputs.length > 1 && (
                            <button onClick={() => removePump(pmIdx)} className="text-red-400 hover:text-red-600 p-1">
                              <X className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nozzles Section */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: pm.nozzleCount }).map((_, nIdx) => {
                          const globalNzIdx = startIndex + nIdx;
                          const nz = nozzleInputs[globalNzIdx];
                          if (!nz) return null;
                          const linkedTank = tankInputs[nz.tankIndex];

                          return (
                            <div key={globalNzIdx} className={`p-3 rounded-xl border ${linkedTank ? FUEL_LABELS[linkedTank.fuelType].color : 'border-slate-200 bg-slate-50'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-white/50 border border-black/10">
                                    Side {['A','B','C','D'][nIdx]}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-black opacity-70 uppercase mb-1">{t('Nozzle Name', 'نوزل کا نام')}</label>
                                    <input type="text" value={nz.name} onChange={e => updateNozzle(globalNzIdx, 'name', e.target.value)}
                                      className="w-full bg-white/80 border-0 rounded p-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-black/20" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-black opacity-70 uppercase mb-1">{t('Tank Link', 'ٹینک لنک')}</label>
                                    <select value={nz.tankIndex} onChange={e => updateNozzle(globalNzIdx, 'tankIndex', Number(e.target.value))}
                                      className={`w-full bg-white/80 border-0 rounded p-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-black/20 ${errors['nozzle_tank_'+globalNzIdx] ? 'ring-2 ring-red-500' : ''}`}>
                                      <option value={-1}>— {t('Select', 'منتخب کریں')} —</option>
                                      {tankInputs.map((tk, ti) => (
                                        <option key={ti} value={ti}>{FUEL_LABELS[tk.fuelType].emoji} {tk.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-[10px] font-black opacity-70 uppercase mb-1 flex items-center justify-between">
                                    <span>{t('Opening Reading', 'ابتدائی ریڈنگ')}</span>
                                    {errors['nozzle_reading_'+globalNzIdx] && <span className="text-red-500">{errors['nozzle_reading_'+globalNzIdx]}</span>}
                                  </label>
                                  <input type="number" min="0" value={nz.startReading} onChange={e => updateNozzle(globalNzIdx, 'startReading', Number(e.target.value))}
                                    className="w-full bg-white/90 border border-black/5 rounded p-2 text-sm font-mono focus:ring-1 focus:ring-black/20 outline-none" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ╔══ STEP 5: FUEL RATES ══╗ */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <h3 className="font-sans text-sm font-black text-slate-900 uppercase tracking-wider">
                  {t('Prevailing Fuel Tariff Rates', 'رائج الوقت ایندھن کے نرخ')}
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                {t(`Showing rates only for fuel types with configured tanks: ${activeFuelTypes.map(ft => FUEL_LABELS[ft].emoji).join(' ')}`,
                  `صرف ان ایندھن کے ریٹس دکھائے جا رہے ہیں جن کے ٹینکس ترتیب دیے گئے: ${activeFuelTypes.map(ft => FUEL_LABELS[ft].emoji).join(' ')}`)}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeFuelTypes.map(ft => {
                  const info = FUEL_LABELS[ft];
                  const unit = ft === 'cng' ? 'KG' : 'Litre';
                  return (
                    <div key={ft} className={`rounded-2xl border p-4 space-y-3 ${info.color}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{info.emoji}</span>
                        <span className="font-sans font-black text-sm">{lang === 'ur' ? info.ur : info.en}</span>
                      </div>

                      <div className="space-y-2 bg-white/60 rounded-xl p-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                            {t(`Selling Rate (Rs. / ${unit})`, `فروخت ریٹ (Rs. / ${unit})`)}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-xs">Rs.</span>
                            <input type="number" step="0.01" min="0.01" value={rates[ft]}
                              onChange={e => { setRates(r => ({ ...r, [ft]: Number(e.target.value) })); clearError(`rate_${ft}`); }}
                              className={`${inputCls(`rate_${ft}`)} pl-9 font-mono font-black text-center`} />
                          </div>
                          <Err id={`rate_${ft}`} />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            {t(`Purchase Price (Rs. / ${unit}) — for margin tracking`, `خریداری قیمت — منافع ٹریکنگ کے لیے`)}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-xs">Rs.</span>
                            <input type="number" step="0.01" min="0" value={purchasePrices[ft]}
                              onChange={e => setPurchasePrices(p => ({ ...p, [ft]: Number(e.target.value) }))}
                              className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-orange-500 font-mono text-xs bg-white/80 text-center" />
                          </div>
                          <p className="text-[9px] text-slate-400 mt-1">
                            {t(`Margin: Rs. ${(rates[ft] - purchasePrices[ft]).toFixed(2)} / ${unit}`, `منافع: Rs. ${(rates[ft] - purchasePrices[ft]).toFixed(2)} / ${unit}`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ╔══ STEP 6: OPENING STOCK ══╗ */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Database className="h-5 w-5 text-orange-600" />
                <h3 className="font-sans text-sm font-black text-slate-900 uppercase tracking-wider">
                  {t('Opening Stock', 'ابتدائی اسٹاک')}
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                {t('Enter the current stock level for each tank.', 'ہر ٹینک کا موجودہ اسٹاک درج کریں۔')}
              </p>

              <div className="space-y-3">
                {tankInputs.map((tk, idx) => {
                  const stock = openingStocks[idx] || 0;
                  return (
                    <div key={idx} className={`p-4 rounded-xl border ${FUEL_LABELS[tk.fuelType].color}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-sans font-bold text-sm flex items-center gap-2">
                          {FUEL_LABELS[tk.fuelType].emoji} {tk.name}
                        </span>
                        <span className="text-[10px] font-black opacity-70 uppercase">
                          {t('Capacity: ', 'گنجائش: ')} {tk.capacity}
                        </span>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-black opacity-70 uppercase mb-1">
                          {t('Opening Stock *', 'ابتدائی اسٹاک *')}
                        </label>
                        <input type="number" min="0" max={tk.capacity} value={stock}
                          onChange={e => setOpeningStocks(prev => ({ ...prev, [idx]: Number(e.target.value) }))}
                          className={`w-full bg-white border rounded p-2 text-sm font-mono focus:ring-1 focus:ring-black/20 outline-none ${errors['stock_'+idx] ? 'border-red-500' : 'border-black/5'}`} />
                        {errors['stock_'+idx] && <p className="text-red-500 text-[10px] mt-1">{errors['stock_'+idx]}</p>}
                        {tk.capacity > 0 && (
                          <div className="mt-2 h-2 w-full bg-white/50 rounded-full overflow-hidden border border-black/5">
                            <div className="h-full bg-current rounded-full transition-all"
                              style={{ width: `${Math.min(100, (stock / tk.capacity) * 100)}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ╔══ STEP 7: STAFF ══╗ */}
          {step === 7 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-orange-600" />
                  <h3 className="font-sans text-sm font-black text-slate-900 uppercase tracking-wider">
                    {t('Operations Staff Accounts', 'آپریشنل عملے کے اکاؤنٹس')}
                  </h3>
                </div>
                <button onClick={addStaff} disabled={staffList.length >= 10}
                  className="flex items-center gap-1 bg-orange-600 disabled:bg-slate-200 text-white disabled:text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:cursor-not-allowed transition-all hover:bg-orange-700">
                  <Plus className="h-3.5 w-3.5" />
                  {t('Add Staff', 'عملہ شامل کریں')}
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-[10px] text-amber-700 font-bold">
                  🔐 {t(`Owner PIN already set: ${ownerPin.replace(/./g, '●')} — Staff PINs must be different`, `مالک کا پن پہلے سے مقرر: ${ownerPin.replace(/./g, '●')} — عملے کے پن مختلف ہونے چاہئیں`)}
                </p>
              </div>

              <div className="space-y-4">
                {staffList.map((st, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        {t(`Staff Member #${idx + 1}`, `اسٹاف ممبر #${idx + 1}`)}
                      </span>
                      {staffList.length > 1 && (
                        <button onClick={() => removeStaff(idx)}
                          className="text-slate-400 hover:text-red-500 cursor-pointer p-1 rounded-lg hover:bg-red-50 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          {t('Full Name (EN) *', 'پورا نام (انگریزی) *')}
                        </label>
                        <input type="text" placeholder="e.g. Abdul Rehman"
                          value={st.name} onChange={e => updateStaff(idx, 'name', e.target.value)}
                          className={inputCls(`staff_name_${idx}`)} />
                        <Err id={`staff_name_${idx}`} />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          {t('Full Name (Urdu)', 'پورا نام (اردو)')}
                        </label>
                        <input type="text" placeholder="مثلاً عبد الرحمٰن"
                          value={st.urduName} onChange={e => updateStaff(idx, 'urduName', e.target.value)}
                          className={inputCls('')} />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          {t('Job Role / Duty', 'ملازمت کا کردار')}
                        </label>
                        <select value={st.role} onChange={e => updateStaff(idx, 'role', e.target.value)}
                          className={inputCls('')}>
                          <option value="salesman">{t('Nozzle Operator / Salesman', 'نوزل آپریٹر / سیلزمین')}</option>
                          <option value="cashier">{t('Cashier / Accountant', 'کیشیئر / اکاؤنٹنٹ')}</option>
                          <option value="manager">{t('Duty Station Manager', 'ڈیوٹی اسٹیشن مینیجر')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          {t('Monthly Base Salary (Rs.)', 'ماہانہ بنیادی تنخواہ (Rs.)')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-xs">Rs.</span>
                          <input type="number" min="0" value={st.salary}
                            onChange={e => updateStaff(idx, 'salary', Number(e.target.value))}
                            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-orange-500 font-mono text-xs" />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                          {t('Login PIN * (4–6 digits, unique)', 'لاگ ان پن * (4–6 ہندسے، منفرد)')}
                        </label>
                        <input type="password" maxLength={6} placeholder="e.g. 2222"
                          value={st.pin} onChange={e => updateStaff(idx, 'pin', e.target.value.replace(/\D/g, ''))}
                          className={`${inputCls(`staff_pin_${idx}`)} text-center tracking-widest font-mono font-black w-36`} />
                        <Err id={`staff_pin_${idx}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ╔══ STEP 8: REVIEW & CONFIRM ══╗ */}
          {step === 8 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="h-5 w-5 text-orange-600" />
                <h3 className="font-sans text-sm font-black text-slate-900 uppercase tracking-wider">
                  {t('Review & Confirm Setup', 'جائزہ لیں اور تصدیق کریں')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">

                {/* ── Station Info ── */}
                <div className="rounded-xl border-2 border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Building className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    {t('Station Info', 'اسٹیشن معلومات')}
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: t('Name', 'نام'), value: stationName },
                      { label: t('Owner', 'مالک'), value: ownerName },
                      { label: t('City', 'شہر'), value: city },
                      { label: t('Phone', 'فون'), value: phone, mono: true },
                      ...(ntn ? [{ label: 'NTN', value: ntn, mono: true }] : []),
                      ...(ograNo ? [{ label: 'OGRA', value: ograNo, mono: true }] : []),
                      ...(supplierName ? [{ label: t('Supplier', 'سپلائر'), value: supplierName }] : []),
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-500 font-semibold shrink-0">{row.label}:</span>
                        <span className={`font-bold text-slate-900 text-right truncate ${row.mono ? 'font-mono' : ''}`}>{row.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Tanks ── */}
                <div className="rounded-xl border-2 border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Database className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    {t(`${tankInputs.length} Storage Tanks`, `${tankInputs.length} اسٹوریج ٹینکس`)}
                  </h4>
                  <div className="space-y-2.5">
                    {tankInputs.map((tk, i) => {
                      const stock = openingStocks[i] || 0;
                      const pct = tk.capacity > 0 ? Math.min(100, (stock / tk.capacity) * 100) : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1 font-bold text-slate-800">
                              <span>{FUEL_LABELS[tk.fuelType].emoji}</span>
                              <span>{tk.name}</span>
                            </span>
                            <span className="font-mono text-slate-600 font-semibold text-[10px]">
                              {stock.toLocaleString()} / {tk.capacity.toLocaleString()} L
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Pumps & Nozzles ── */}
                <div className="rounded-xl border-2 border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Gauge className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    {t(`${pumpInputs.length} Pumps · ${nozzleInputs.length} Nozzles`, `${pumpInputs.length} پمپس · ${nozzleInputs.length} نوزلز`)}
                  </h4>
                  <div className="space-y-2">
                    {pumpInputs.map((pm, i) => {
                      let start = 0;
                      for (let j = 0; j < i; j++) start += pumpInputs[j].nozzleCount;
                      const myNozzles = nozzleInputs.slice(start, start + pm.nozzleCount);
                      return (
                        <div key={i} className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-slate-800 text-xs">⚙️ {pm.name}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{pm.nozzleCount} {t('nozzles', 'نوزلز')}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {myNozzles.map((nz, ni) => (
                              <span key={ni} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${FUEL_LABELS[tankInputs[nz.tankIndex]?.fuelType || 'petrol'].color}`}>
                                {nz.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Fuel Rates ── */}
                <div className="rounded-xl border-2 border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    {t('Fuel Rates', 'ایندھن ریٹس')}
                  </h4>
                  <div className="space-y-2.5">
                    {activeFuelTypes.map(ft => {
                      const margin = rates[ft] - purchasePrices[ft];
                      return (
                        <div key={ft} className="flex items-center justify-between gap-2">
                          <FuelChip ft={ft} />
                          <div className="text-right">
                            <div className="font-mono font-black text-slate-900 text-xs">Rs. {rates[ft].toFixed(2)}</div>
                            <div className={`text-[10px] font-bold ${margin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {margin >= 0 ? '+' : ''}Rs. {margin.toFixed(2)} {t('margin', 'مارجن')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Staff Summary ── */}
                <div className="sm:col-span-2 rounded-xl border-2 border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                  <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Users2 className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                    {t(`${staffList.length + 1} Staff Accounts`, `${staffList.length + 1} اسٹاف اکاؤنٹس`)}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-orange-50 border-2 border-orange-200 text-orange-800 text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                      👑 {ownerName || t('Owner', 'مالک')}
                      <span className="text-[10px] opacity-70 font-medium ml-0.5">(Owner)</span>
                    </span>
                    {staffList.map((st, i) => (
                      <span key={i} className="bg-slate-100 border-2 border-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                        👤 {st.name || '—'}
                        <span className="text-[10px] opacity-60 font-medium ml-0.5">({st.role})</span>
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Confirm Banner */}
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800 font-semibold leading-snug">
                  {t(
                    'Everything looks correct? Click "Confirm & Launch" below to save all configuration and open your live dashboard.',
                    'سب کچھ درست لگتا ہے؟ نیچے "تصدیق کریں" پر کلک کریں تاکہ تمام ترتیبات محفوظ ہو جائیں اور آپ کا لائیو ڈیش بورڈ کھل جائے۔'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ╔══ STEP 9: LAUNCH ══╗ */}
          {step === 9 && (
            <div className="text-center space-y-6 py-6">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="mx-auto w-20 h-20 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle className="h-10 w-10 text-white" />
              </motion.div>
              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="font-sans text-2xl font-black text-slate-900 tracking-tight">
                  {t('FuelPro is Ready!', 'فیول پرو تیار ہے!')}
                </h2>
                <p className="font-sans text-sm text-slate-500 leading-relaxed">
                  {t(
                    'Your station is fully configured. All tanks are online, nozzles are calibrated, and your team accounts are ready. Start your first shift now!',
                    'آپ کا اسٹیشن مکمل طور پر ترتیب پا چکا ہے۔ تمام ٹینکس آن لائن ہیں، نوزلز کیلیبریٹ ہو چکی ہیں، اور آپ کی ٹیم کے اکاؤنٹس تیار ہیں۔ ابھی پہلی شفٹ شروع کریں!'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                {[
                  { val: tankInputs.length, label: t('Tanks', 'ٹینکس'), color: 'bg-blue-50 text-blue-700' },
                  { val: pumpInputs.length, label: t('Pumps', 'پمپس'), color: 'bg-orange-50 text-orange-700' },
                  { val: nozzleInputs.length, label: t('Nozzles', 'نوزلز'), color: 'bg-amber-50 text-amber-700' },
                  { val: staffList.length + 1, label: t('Accounts', 'اکاؤنٹس'), color: 'bg-emerald-50 text-emerald-700' },
                ].map(item => (
                  <div key={item.label} className={`rounded-xl p-3 ${item.color} font-sans text-center`}>
                    <div className="text-2xl font-black">{item.val}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider">{item.label}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveAll}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black font-sans rounded-xl shadow-lg shadow-emerald-500/30 inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                {t('🚀 Launch Station Dashboard', '🚀 اسٹیشن ڈیش بورڈ کھولیں')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── BOTTOM NAV ── */}
        {step > 0 && step < 9 && (
          <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex justify-between items-center">
            <button onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer min-h-[44px] min-w-[80px] transition-all">
              <ArrowLeft className="h-4 w-4" />
              {t('Back', 'پیچھے')}
            </button>

            <div className="flex items-center gap-2">
              {Object.keys(errors).length > 0 && (
                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {t('Fix errors first', 'پہلے غلطیاں ٹھیک کریں')}
                </span>
              )}
              <button onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl cursor-pointer min-h-[44px] shadow-sm transition-all active:scale-95">
                {step === 8 ? t('Confirm & Launch', 'تصدیق کریں') : t('Next →', 'اگلا')}
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
}

