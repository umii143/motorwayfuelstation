import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  Languages
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
  currentLanguage: 'en' | 'ur';
}

export default function OnboardingWizard({ onComplete, onCancel, currentLanguage }: OnboardingWizardProps) {
  const { showToast } = useStation();
  const [lang, setLang] = useState<'en' | 'ur'>(currentLanguage);
  const [step, setStep] = useState<number>(1);

  // Translates title helper
  const t = (en: string, ur: string) => (lang === 'ur' ? ur : en);

  // --- STEP 2: Station Info State ---
  const [stationName, setStationName] = useState('FuelPro Station');
  const [stationUrduName, setStationUrduName] = useState('فیول پرو اسٹیشن');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerPin, setOwnerPin] = useState('1234');
  const [staffPin, setStaffPin] = useState('1111');

  // --- STEP 3: Tanks State ---
  const [tankCount, setTankCount] = useState<number>(2);
  const [tankInputs, setTankInputs] = useState<Array<{ name: string; fuelType: 'petrol' | 'diesel' | 'cng'; capacity: number; openingStock: number }>>([
    { name: 'Petrol Tank A', fuelType: 'petrol', capacity: 25000, openingStock: 12000 },
    { name: 'Diesel Tank B', fuelType: 'diesel', capacity: 25000, openingStock: 10000 }
  ]);

  // Adjust inputs if tankCount changes
  const handleTankCountChange = (count: number) => {
    setTankCount(count);
    const updated = [...tankInputs];
    if (count > updated.length) {
      for (let i = updated.length; i < count; i++) {
        const types: Array<'petrol' | 'diesel' | 'cng'> = ['petrol', 'diesel', 'cng'];
        const type = types[i % 3];
        updated.push({
          name: `${type.toUpperCase()} Tank ${i + 1}`,
          fuelType: type,
          capacity: 25000,
          openingStock: 12000
        });
      }
    } else {
      updated.splice(count);
    }
    setTankInputs(updated);
  };

  const handleUpdateTankInput = (index: number, key: string, value: any) => {
    const updated = [...tankInputs];
    updated[index] = { ...updated[index], [key]: value };
    setTankInputs(updated);
  };

  // --- STEP 4: Nozzles State ---
  const [nozzleCount, setNozzleCount] = useState<number>(3);
  const [nozzleInputs, setNozzleInputs] = useState<Array<{ name: string; fuelType: 'petrol' | 'diesel' | 'cng'; startReading: number }>>([
    { name: 'Pump 1A', fuelType: 'petrol', startReading: 125000 },
    { name: 'Pump 1B', fuelType: 'petrol', startReading: 132000 },
    { name: 'Pump 2A', fuelType: 'diesel', startReading: 85000 }
  ]);

  const handleNozzleCountChange = (count: number) => {
    setNozzleCount(count);
    const updated = [...nozzleInputs];
    if (count > updated.length) {
      for (let i = updated.length; i < count; i++) {
        const type = i % 2 === 0 ? 'petrol' : 'diesel';
        updated.push({
          name: `Pump ${Math.floor(i / 2) + 1}${String.fromCharCode(65 + (i % 2))}`,
          fuelType: type as 'petrol' | 'diesel',
          startReading: 100000
        });
      }
    } else {
      updated.splice(count);
    }
    setNozzleInputs(updated);
  };

  const handleUpdateNozzleInput = (index: number, key: string, value: any) => {
    const updated = [...nozzleInputs];
    updated[index] = { ...updated[index], [key]: value };
    setNozzleInputs(updated);
  };

  // --- STEP 5: Rates State ---
  const [petrolRate, setPetrolRate] = useState<number>(290.50);
  const [dieselRate, setDieselRate] = useState<number>(275.00);
  const [cngRate, setCngRate] = useState<number>(210.00);

  // --- STEP 6: Staff State ---
  const [staffName, setStaffName] = useState('');
  const [staffUrduName, setStaffUrduName] = useState('');
  const [staffRole, setStaffRole] = useState<'salesman' | 'manager' | 'cashier'>('salesman');
  const [staffSalary, setStaffSalary] = useState<number>(25000);

  // Navigation commands
  const handleNext = () => {
    if (step === 2) {
      if (!ownerName || !city || !phone || !ownerPin) {
        showToast(t('Please fill all basic info fields to continue!', 'براہ کرم آگے بڑھنے کے لیے تمام بنیادی معلومات پر کریں۔'), 'error');
        return;
      }
      if (!/^\d{4,6}$/.test(ownerPin)) {
        showToast(t('Owner Login PIN must be a 4 to 6 digit numeric code!', 'مالک کا لاگ ان پن 4 سے 6 ہندسوں کا طبعی نمبر ہونا چاہئے!'), 'error');
        return;
      }
    }
    if (step === 6) {
      if (!staffName || !staffPin) {
        showToast(t('Please fill staff name and PIN code to continue!', 'براہ کرم آگے بڑھنے کے لیے اسٹاف کا نام اور پن لکھیں!'), 'error');
        return;
      }
      if (!/^\d{4,6}$/.test(staffPin)) {
        showToast(t('Staff Login PIN must be a 4 to 6 digit numeric code!', 'اسٹاف کا لاگ ان پن 4 سے 6 ہندسوں کا طبعی نمبر ہونا چاہئے!'), 'error');
        return;
      }
      if (staffPin === ownerPin) {
        showToast(t('Staff PIN must be unique and cannot match the Owner PIN!', 'اسٹاف اور مالک کا پن الگ الگ اور منفرد ہونا چاہیے!'), 'error');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSaveAll = () => {
    // 1. Create default products
    const defaultProducts: Product[] = [
      {
        id: 'petrol',
        name: 'Petrol',
        urduName: 'پٹرول',
        rate: petrolRate,
        unit: 'Liters',
        type: 'fuel',
        currentStock: tankInputs
          .filter(t => t.fuelType === 'petrol')
          .reduce((sum, t) => sum + t.openingStock, 0),
        minStock: 2500,
        capacity: tankInputs
          .filter(t => t.fuelType === 'petrol')
          .reduce((sum, t) => sum + t.capacity, 0)
      },
      {
        id: 'diesel',
        name: 'Diesel',
        urduName: 'ڈیزل',
        rate: dieselRate,
        unit: 'Liters',
        type: 'fuel',
        currentStock: tankInputs
          .filter(t => t.fuelType === 'diesel')
          .reduce((sum, t) => sum + t.openingStock, 0),
        minStock: 2500,
        capacity: tankInputs
          .filter(t => t.fuelType === 'diesel')
          .reduce((sum, t) => sum + t.capacity, 0)
      },
      {
        id: 'cng',
        name: 'CNG',
        urduName: 'سی این جی',
        rate: cngRate,
        unit: 'KG',
        type: 'fuel',
        currentStock: tankInputs
          .filter(t => t.fuelType === 'cng')
          .reduce((sum, t) => sum + t.openingStock, 0) || 1200,
        minStock: 500,
        capacity: tankInputs
          .filter(t => t.fuelType === 'cng')
          .reduce((sum, t) => sum + t.capacity, 0) || 5000
      }
    ];

    // 2. Map Tanks
    const convertedTanks: Tank[] = tankInputs.map((tk, idx) => ({
      id: `tank_${Date.now()}_${idx}`,
      name: tk.name,
      productId: tk.fuelType, // Maps to petrol, diesel, or cng product ids
      capacity: tk.capacity,
      safeLevel: Math.round(tk.capacity * 0.12), // Preset to ~12% safe
      criticalLevel: Math.round(tk.capacity * 0.05), // Preset to ~5% critical alert line
      currentStock: tk.openingStock,
      openingStock: tk.openingStock,
      physicalLabel: `T-${idx + 1}`,
      dipChart: [
        { cm: 10, liters: Math.round(tk.capacity * 0.02) },
        { cm: 100, liters: Math.round(tk.capacity * 0.3) },
        { cm: 250, liters: tk.capacity }
      ]
    }));

    // 3. Map Nozzles
    const convertedNozzles: Nozzle[] = nozzleInputs.map((nz, idx) => {
      // Find suitable tank matching fuel type
      const suitableTank = convertedTanks.find(t => t.productId === nz.fuelType);
      return {
        id: `nz_${Date.now()}_${idx}`,
        pumpId: `pump_${Math.floor(idx / 2) + 1}`,
        name: nz.name,
        productId: nz.fuelType,
        tankId: suitableTank?.id,
        startReading: nz.startReading,
        currentReading: nz.startReading
      };
    });

    // 4. Map Staff - Create Owner & First Staff Account
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

    const firstStaff: Staff = {
      id: `st_crew_${Date.now()}`,
      name: staffName,
      urduName: staffUrduName || staffName,
      role: staffRole,
      salary: staffSalary,
      advances: 0,
      active: true,
      pin: staffPin
    };

    // 5. Main settings payload
    const updatedSettings: GlobalSettings = {
      stationName,
      stationUrduName,
      address: `${city}, Pakistan`,
      ntn: `NTN-GST-${Math.floor(1000000 + Math.random() * 9000000)}`,
      ownerContact: phone,
      theme: 'light',
      language: lang,
      setupCompleted: true,
      setupVersion: 1
    };

    onComplete({
      settings: updatedSettings,
      tanks: convertedTanks,
      nozzles: convertedNozzles,
      products: defaultProducts,
      staff: [ownerStaff, firstStaff]
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
      >
        
        {/* TOP STATUS BAR: LANG TOGGLE + PROGRESS */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative">
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-colors"
            >
              {t('Skip for Now', 'ابھی چھوڑ دیں')}
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 font-sans font-extrabold text-white text-sm">
              FP
            </div>
            <div>
              <span className="font-sans font-bold text-xs text-slate-800 leading-none block">
                {t('FuelPro Station Onboarding', 'فیول پرو اسٹیشن آن بورڈنگ')}
              </span>
              <span className="font-mono text-[10px] text-slate-400 mt-1 block">
                {t('V4.0 Initial Provisioning Wizard', 'V4.0 ابتدائی کنفیگریشن وزرڈ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pr-24 sm:pr-0">
            <button
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Languages className="h-3.5 w-3.5 text-orange-600" />
              <span>{lang === 'en' ? 'اردو (Urdu)' : 'English'}</span>
            </button>
            <span className="text-[10px] bg-slate-200/60 text-slate-700 font-sans font-bold px-2 py-0.5 rounded-full select-none">
              {t(`Step ${step} of 7`, `مرحلہ ${step} سے 7`)}
            </span>
          </div>
        </div>

        {/* STEPPER ROADMAP */}
        <div className="flex items-center justify-between bg-white px-8 py-3 border-b border-slate-100">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => {
            const isActive = step === num;
            const isCompleted = step > num;
            return (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center font-sans text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-orange-600 text-white ring-4 ring-orange-500/10'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? '✓' : num}
                  </div>
                </div>
                {num < 7 && (
                  <div
                    className={`flex-1 h-[2px] mx-2 transition-all ${
                      step > num ? 'bg-emerald-500' : 'bg-slate-100'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* COMPONENT BODY */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[60vh] space-y-6">

          {/* STEP 1: WELCOME SCREEN */}
          {step === 1 && (
            <div className="text-center space-y-5 py-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Fuel className="h-9 w-9 stroke-[1.5]" />
              </div>
              <div className="space-y-2">
                <h2 className="font-sans text-xl font-black text-slate-800 tracking-tight">
                  {t("Welcome to FuelPro Station Accounting Ledger!", "فیول پرو پٹرولیم اکاؤنٹنگ لیجر میں خوش آمدید!")}
                </h2>
                <p className="font-sans text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {t(
                    "Let's set up your fuel station parameters securely from scratch. This wizard helps configure physical tanks, nozzle calibrations, default pricing scales, and initial salesman records. Ready in 2 minutes!",
                    "آئیں آپ کے فیول اسٹیشن کو شروع سے کنفیگر کریں۔ یہ گائیڈ ٹینک، نوزلز، گاہکوں کے ریٹس اور سیلزمین کی معلومات محفوظ کرے گا۔"
                  )}
                </p>
              </div>
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-850 text-white text-xs font-bold font-sans rounded-xl shadow-md space-x-2 inline-flex items-center cursor-pointer transition-all hover:scale-105"
              >
                <span>{t('Get Started', 'شروع کریں')}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 2: STATION INFORMATION */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building className="h-4.5 w-4.5 text-orange-600" />
                <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {t('Step 2: Petrol Station Identity Profile', 'مرحلہ 2: فلنگ اسٹیشن پروفائل معلومات')}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-650 font-bold mb-1">{t('Station Registered Name (EN):', 'اسٹیشن کا نام')}</label>
                  <input
                    type="text"
                    required
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-650 font-bold mb-1">{t('Station Urdu Name (UR):', 'اسٹیشن کا اردو نام')}</label>
                  <input
                    type="text"
                    required
                    value={stationUrduName}
                    onChange={(e) => setStationUrduName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-650 font-bold mb-1">{t('Station Owner / Admin Name:', 'مالک یا مینیجر کا نام')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Umar Ali"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-650 font-bold mb-1">{t('Physical City / district Location:', 'شہر یا بستی کا نام')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Karachi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className="block text-slate-650 font-bold mb-1">{t('Primary Contact / Cell No:', 'رابطہ نمبر یا موبائل نمبر')}</label>
                    <input
                      type="text"
                      placeholder="e.g. 03168432329"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-650 font-bold mb-1">
                      {t('Owner Secure Login PIN (4 - 6 Digits):', 'مالک کا لاگ ان پن کوڈ (4 سے 6 ہندسے):')}
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      pattern="\d*"
                      placeholder="e.g. 1234"
                      value={ownerPin}
                      onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-mono text-center tracking-widest text-sm font-bold bg-amber-50/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {t('Used to authenticate the Owner account. Keep this PIN safe.', 'یہ پن کوڈ مالک کا اکاؤنٹ کھولنے کے لیے استعمال ہو گا۔ اسے محفوظ رکھیں۔')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIGURE TANKS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Database className="h-4.5 w-4.5 text-orange-600" />
                <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {t('Step 3: Storage Tank Parameters', 'مرحلہ 3: پٹرول ڈیزل زیرِ زمین ٹینکس')}
                </h3>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div>
                  <label className="block text-slate-650 font-bold mb-1">
                    {t('How many underground storage tanks are present?', 'اسٹیشن میں کل کتنے انڈر گراؤنڈ ٹینکس ہیں؟')}
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleTankCountChange(num)}
                        className={`flex-1 py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                          tankCount === num
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/60 max-h-[440px] overflow-y-auto space-y-4">
                  {tankInputs.map((tk, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-sans font-extrabold text-xs text-orange-600 flex items-center gap-1.5">
                          <span className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-[10px]">
                            {t(`Tank #${idx + 1}`, `ٹینک #${idx + 1}`)}
                          </span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {t('Physical Storage Tank', 'زیر زمین اسٹوریج ٹینک')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Tank Name Column */}
                        <div className="space-y-1">
                          <label className="block text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                            {t('Tank Label/Name:', 'ٹینک کا نام/لیبل:')}
                          </label>
                          <input
                            type="text"
                            value={tk.name}
                            onChange={(e) => handleUpdateTankInput(idx, 'name', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-orange-500 font-sans"
                            placeholder={t('e.g. Tank 1 Petrol', 'مثال کے طور پر ٹینک 1 پٹرول')}
                          />
                        </div>

                        {/* Tank Fuel Type Column */}
                        <div className="space-y-1">
                          <label className="block text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                            {t('Fuel Content Type:', 'ایندھن کی قسم:')}
                          </label>
                          <select
                            value={tk.fuelType}
                            onChange={(e) => handleUpdateTankInput(idx, 'fuelType', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-orange-500 bg-white"
                          >
                            <option value="petrol">Petrol (پٹرول)</option>
                            <option value="diesel">Diesel (ڈیزل)</option>
                            <option value="cng">CNG (گیس)</option>
                          </select>
                        </div>

                        {/* Capacity Column */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="block text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                              {t('Max Capacity (Litres):', 'کل گنجائش (لیٹر میں):')}
                            </label>
                            <span className="text-[9px] text-slate-400 font-medium">Ltrs</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              value={tk.capacity}
                              onChange={(e) => handleUpdateTankInput(idx, 'capacity', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg p-2 pr-12 text-xs font-mono outline-none focus:border-orange-500"
                              placeholder="25000"
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 select-none">
                              {t('Liters', 'لیٹر')}
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal">
                            {t('Total physical capacity of the underground storage tank.', 'اس انڈرگراؤنڈ ٹینک کی کل محفوظ رکھنے کی گنجائش۔')}
                          </p>
                        </div>

                        {/* Opening Stock Column */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="block text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                              {t('Opening stock (Liters):', 'موجودہ اسٹاک (لیٹر متبادل):')}
                            </label>
                            <span className="text-[9px] text-orange-600 font-bold">{t('Current', 'موجودہ')}</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              value={tk.openingStock}
                              onChange={(e) => handleUpdateTankInput(idx, 'openingStock', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg p-2 pr-12 text-xs font-mono outline-none focus:border-orange-500"
                              placeholder="12000"
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 select-none font-sans">
                              {t('Liters', 'لیٹر')}
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal">
                            {t('The volume of fuel physically present inside this tank right now.', 'اس وقت ٹینک کے اندر موجود ایندھن کا طبعی اسٹاک۔')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIGURE NOZZLES */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Zap className="h-4.5 w-4.5 text-orange-600" />
                <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {t('Step 4: Dispenser Pump Machine Nozzles', 'مرحلہ 4: پٹریولیئم نوزلز پوزیشنز')}
                </h3>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div>
                  <label className="block text-slate-650 font-bold mb-1">
                    {t('How many pump nozzles are deployed?', 'اسٹیشن میں کل کتنی نوزلز موجود ہیں؟')}
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 6, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleNozzleCountChange(num)}
                        className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                          nozzleCount === num
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/60 max-h-[440px] overflow-y-auto space-y-4">
                  {nozzleInputs.map((nz, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-sans font-extrabold text-xs text-orange-600 flex items-center gap-1.5">
                          <span className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-[10px]">
                            {t(`Nozzle #${idx + 1}`, `ٹینک نوزل #${idx + 1}`)}
                          </span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {t('Dispenser Machine Nozzle', 'فیول ڈسپنسر مشین نوزل')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Nozzle Label/Name */}
                        <div className="space-y-1">
                          <label className="block text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                            {t('Nozzle/Pump Label:', 'نوزل یا پمپ کا نام:')}
                          </label>
                          <input
                            type="text"
                            value={nz.name}
                            onChange={(e) => handleUpdateNozzleInput(idx, 'name', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-orange-500 font-sans"
                            placeholder={t('e.g. Pump 1A', 'مثال کے طور پر پمپ 1A')}
                          />
                        </div>

                        {/* Fuel content type */}
                        <div className="space-y-1">
                          <label className="block text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                            {t('Assigned Fuel:', 'منسلک ایندھن:')}
                          </label>
                          <select
                            value={nz.fuelType}
                            onChange={(e) => handleUpdateNozzleInput(idx, 'fuelType', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-orange-500 bg-white"
                          >
                            <option value="petrol">Petrol (پٹرول)</option>
                            <option value="diesel">Diesel (ڈیزل)</option>
                            <option value="cng">CNG (سی این جی)</option>
                          </select>
                        </div>

                        {/* Opening meter reading */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="block text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                              {t('Opening Meter Reading:', 'میٹر کی ریڈنگ (شروع):')}
                            </label>
                            <span className="text-[9px] text-slate-400 font-medium">LTR/KG</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              value={nz.startReading}
                              onChange={(e) => handleUpdateNozzleInput(idx, 'startReading', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg p-2 pr-12 text-xs font-mono outline-none focus:border-orange-500"
                              placeholder="125000"
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 select-none">
                              {t('Start', 'شروع')}
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-normal">
                            {t('The ongoing counter index shown on this physical dispenser pump flowmeter.', 'پمپ نوزل فلو میٹر پر دکھائی دینے والی طبعی ریڈنگ انڈیکس۔')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PREVAILING FUEL TARIFFS */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <TrendingUp className="h-4.5 w-4.5 text-orange-600" />
                <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {t("Step 5: Configure Prevailing Tariff Rates", "مرحلہ 5: آج کے پٹرولیم نرخ (Rates) درج کریں")}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-2 text-center">
                  <span className="block font-bold text-slate-600">⛽ {t('Super Petrol', 'سپر پٹرول')}</span>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={petrolRate}
                      onChange={(e) => setPetrolRate(Number(e.target.value))}
                      className="w-full pl-9 pr-2 py-2 text-center bg-white border border-slate-200 rounded-lg font-mono font-black"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">/ Litre</span>
                </div>

                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-2 text-center">
                  <span className="block font-bold text-slate-600">🔵 {t('High Speed Diesel', 'ڈیزل')}</span>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={dieselRate}
                      onChange={(e) => setDieselRate(Number(e.target.value))}
                      className="w-full pl-9 pr-2 py-2 text-center bg-white border border-slate-200 rounded-lg font-mono font-black"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">/ Litre</span>
                </div>

                <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-2 text-center">
                  <span className="block font-bold text-slate-600">💨 {t('CNG Gas', 'سی این جی')}</span>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={cngRate}
                      onChange={(e) => setCngRate(Number(e.target.value))}
                      className="w-full pl-9 pr-2 py-2 text-center bg-white border border-slate-200 rounded-lg font-mono font-black"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">/ KG</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REGISTER FIRST OPERATIONS STAFF */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Users2 className="h-4.5 w-4.5 text-orange-600" />
                <h3 className="font-sans text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {t('Step 6: Register First Staff Member', 'مرحلہ 6: عملہ اور سیلز مینیجرز کی رجسٹریشن')}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-650 font-bold mb-1">
                    {t('Staff Account Name (English):', 'اسٹاف کا نام انگریزی میں')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abdul Rehman"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-sans text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-650 font-bold mb-1">
                    {t('Staff Account Name (Urdu):', 'اسٹاف کا نام اردو میں')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. عبد الرحمٰن"
                    value={staffUrduName}
                    onChange={(e) => setStaffUrduName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-orange-500 font-sans text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-655 font-bold mb-1">
                    {t('Assigned Duty Role:', 'ڈیوٹی کا عہدہ')}
                  </label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-sans text-slate-800 outline-none focus:border-orange-500"
                  >
                    <option value="salesman">{t('Nozzle Salesman / Operator', 'سیلزمین / نوزل آپریٹر')}</option>
                    <option value="cashier">{t('Cashier / Accountant', 'کیشیئر / کیش گننے والا')}</option>
                    <option value="manager">{t('Duty Station Manager', 'ڈیوٹی مینیجر')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-655 font-bold mb-1">
                    {t('Monthly Base Salary (Rs.):', 'ماہانہ بنیادی تنخواہ')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rs.</span>
                    <input
                      type="number"
                      value={staffSalary}
                      onChange={(e) => setStaffSalary(Number(e.target.value))}
                      className="w-full pl-9 pr-2.5 py-2.5 border border-slate-200 rounded-lg font-mono outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 bg-orange-50/50 p-4 rounded-xl border border-orange-100 space-y-2 mt-2 text-left">
                  <div className="flex items-center gap-1.5 text-orange-700 font-bold">
                    <Building className="h-4 w-4 shrink-0" />
                    <span>{t('Set Staff Access PIN', 'اسٹاف کا سیکیورٹی لاگ ان پن کوڈ')}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {t('This PIN code allows this employee to log into their specific role workspace from the login panel. It must be 4 to 6 numbers and unique from the Owner PIN.', 'یہ پن کوڈ لاک اسکرین پر منتخب ملازم کا مخصوص سیشن کھولنے کے لیے استعمال ہو گا۔ یہ مالک کے پن کوڈ سے مختلف ہونا چاہیے کیونکہ سیکورٹی لیولز الگ ہیں۔')}
                  </p>
                  <div className="pt-1">
                    <label className="block text-slate-750 font-bold mb-1 text-[10px] uppercase tracking-wider">
                      {t('Staff Access PIN (4-6 digits):', 'اسٹاف کا سیکیورٹی پن (4-6 ہندسے):')}
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      pattern="\d*"
                      value={staffPin}
                      onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 1111"
                      className="w-32 border border-slate-200 rounded-lg p-2.5 text-center text-md font-sans font-black tracking-widest outline-none focus:border-orange-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: READY TO LAUNCH! */}
          {step === 7 && (
            <div className="text-center space-y-5 py-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle className="h-10 w-10 animate-scale-in" />
              </div>
              <div className="space-y-2">
                <h2 className="font-sans text-xl font-black text-slate-800 tracking-tight">
                  {t('Your FuelPro workspace is fully provisioned!', 'آپ کا فلنگ اسٹیشن آٹو کنفیگر ہو چکا ہے!')}
                </h2>
                <p className="font-sans text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {t(
                    'All tanks are online, nozzles calibrated, security alarm lines tuned, and first salesman is on standby. You can now records shifts immediately!',
                    'تمام ٹینکس اور نوزلز کیلیبریشن پروسیس کامیابی سے مکمل ہو گیا ہے۔ اب آپ باقاعدہ شفٹ وزرڈ شروع کر سکتے ہیں۔'
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/55 p-4 max-w-xs mx-auto text-left space-y-1.5 text-[11px] text-slate-600 leading-normal">
                <div className="flex justify-between font-sans">
                  <span>🏢 {t('Station Name:', 'فلنگ اسٹیشن کا نام:')}</span>
                  <span className="font-bold text-slate-800">{stationName}</span>
                </div>
                <div className="flex justify-between font-sans">
                  <span>🛢️ {t('Calibrated Tanks:', 'کامیاب ٹینکس:')}</span>
                  <span className="font-bold text-slate-800 font-mono">{tankInputs.length} Calibrated</span>
                </div>
                <div className="flex justify-between font-sans">
                  <span>⛽ {t('Active Nozzles:', 'ایکٹو نوزل پوزیشنز:')}</span>
                  <span className="font-bold text-slate-800 font-mono">{nozzleInputs.length} Online</span>
                </div>
                <div className="flex justify-between font-sans">
                  <span>👷 {t('Duty Supervisor:', 'نگران مینیجر:')}</span>
                  <span className="font-bold text-slate-800">{staffName}</span>
                </div>
              </div>

              <button
                onClick={handleSaveAll}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-850 text-white text-xs font-bold font-sans rounded-xl shadow-lg inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>{t('Go to Dashboard', 'ڈیش بورڈ پر جائیں')}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>

        {/* BOTTOM NAV BAR */}
        {step > 1 && step < 7 && (
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center select-none">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-bold font-sans flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('Back', 'پیچھے')}</span>
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-850 text-white text-xs font-bold font-sans rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <span>{t('Next →', 'اگلا مرحلہ')}</span>
            </button>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
}
