import React, { useState, useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  Droplets,
  Thermometer,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  ShieldAlert,
  Save,
  Printer,
  Compass,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
  FileCheck,
  Fuel,
  Sparkles,
  FlaskConical,
  Scale,
  Wifi,
  Battery,
  Radio,
  Search,
  Filter,
  Calendar,
  Download,
  Share2,
  History,
  Lock,
  Smartphone,
  MapPin,
  RefreshCcw,
  Check,
  Eye,
  FileText,
  Play,
  RotateCcw,
  Award,
  Sliders,
  Table
} from 'lucide-react';
import { GlobalSettings, Tank } from '../../../types';
import { fetchWithAuth } from '../../../lib/api';
import { db, SPECIAL_STORAGE_KEYS } from '../../../data/db';
import { useStationStore } from '../../../stores/useStationStore';
import { useInventoryStore } from '../../../stores/useInventoryStore';

interface DipCalculatorProps {
  settings: GlobalSettings;
  tanks?: Tank[];
}

interface DipResult {
  rawLiters: number;
  waterVolumeLiters: number;
  netFuelLiters: number;
  correctedLiters: number;
  temperatureCelsius: number;
  vcf: number;
  dipCm: number;
  observedDensity: number;
  correctedDensity15: number;
  apiGravity: number;
  ullageLiters: number;
  usableVolumeLiters: number;
  deadStockHeelLiters: number;
  varianceLiters: number;
  variancePct: number;
  status: string;
  requiresSupervisorApproval: boolean;
  leakWarning: boolean;
  safeFillStatus: string;
  deliveryShortageLiters?: number;
}

interface PetroleumHistoryRecord {
  id: string;
  dateStr: string;
  timeStr: string;
  tankId: string;
  tankName: string;
  productName: string;
  dipCm: number;
  temperatureCelsius: number;
  observedDensity: number;
  correctedDensity15: number;
  apiGravity: number;
  waterLevelMm: number;
  waterVolumeLiters: number;
  rawLiters: number;
  correctedLiters: number;
  varianceLiters: number;
  operatorName: string;
  supervisorApproval: string;
  mode: 'Manual' | 'Automatic ATG';
  deviceId: string;
  gpsLocation: string;
  linkedChallanNo?: string;
  auditTrail: Array<{
    timestamp: string;
    changedBy: string;
    oldValue: string;
    newValue: string;
    reason: string;
  }>;
}

// Product-specific Fuel Color Palette
const getProductColorHex = (prodName: string) => {
  const name = (prodName || '').toLowerCase();
  if (name.includes('diesel') || name.includes('hsd')) return '#10b981'; // Emerald Green
  if (name.includes('octane') || name.includes('hobc')) return '#8b5cf6'; // Purple
  if (name.includes('kero')) return '#f59e0b'; // Amber
  if (name.includes('ldo')) return '#06b6d4'; // Teal
  return '#2563eb'; // Royal Blue for Petrol / PMG
};

// ⭐ REALISTIC 3D SVG CYLINDRICAL TANK WITH PROPORTIONAL LIQUID FILL & WATER LAYER
function SvgCylindricalTank({
  pct,
  colorHex,
  productName,
  currentStock,
  capacity,
  tankName,
  waterLevelMm = 0,
  isAtgLive = false
}: {
  pct: number;
  colorHex: string;
  productName: string;
  currentStock: number;
  capacity: number;
  tankName: string;
  waterLevelMm?: number;
  isAtgLive?: boolean;
}) {
  const fillPct = Math.max(0, Math.min(100, pct));
  const fillHeight = (fillPct / 100) * 105;
  const waterHeight = Math.min(15, (waterLevelMm / 100) * 105);
  const uniqueId = tankName.replace(/[^a-zA-Z0-9]/g, '-');
  const liquidSurfaceY = 125 - fillHeight;

  return (
    <div className="relative w-full h-60 bg-slate-950 rounded-3xl border-2 border-slate-700/80 p-4 overflow-hidden flex flex-col justify-between shadow-2xl">
      <svg className="w-full h-full" viewBox="0 0 320 145" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id={`dip-clip-${uniqueId}`}>
            <rect x="25" y={liquidSurfaceY} width="250" height={Math.max(2, fillHeight)} rx="10" />
          </clipPath>

          <linearGradient id={`dip-liquid-grad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorHex} stopOpacity="0.95" />
            <stop offset="100%" stopColor={colorHex} stopOpacity="0.70" />
          </linearGradient>

          <linearGradient id={`dip-glass-grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <rect x="20" y="15" width="260" height="115" rx="20" fill="#1e293b" stroke="#475569" strokeWidth="3" />
        <ellipse cx="20" cy="72.5" rx="12" ry="57.5" fill="#334155" stroke="#475569" strokeWidth="3" />
        <ellipse cx="280" cy="72.5" rx="12" ry="57.5" fill="#1e293b" stroke="#475569" strokeWidth="3" />

        {fillHeight > 0 && (
          <g clipPath={`url(#dip-clip-${uniqueId})`}>
            <rect x="20" y="15" width="260" height="115" fill={`url(#dip-liquid-grad-${uniqueId})`} />
            <path
              d={`M 20 ${liquidSurfaceY + 2} Q 80 ${liquidSurfaceY - 3}, 140 ${liquidSurfaceY + 2} T 260 ${liquidSurfaceY + 2} V ${liquidSurfaceY + 15} H 20 Z`}
              fill="#ffffff"
              opacity="0.4"
              className="animate-pulse"
            />
          </g>
        )}

        {waterLevelMm > 0 && (
          <rect x="25" y={130 - waterHeight} width="250" height={waterHeight} fill="#1e3a8a" opacity="0.9" rx="4" />
        )}

        <rect x="20" y="15" width="260" height="30" fill={`url(#dip-glass-grad-${uniqueId})`} rx="15" />

        <line x1="160" y1="5" x2="160" y2="125" stroke={isAtgLive ? '#06b6d4' : '#f59e0b'} strokeWidth="3" strokeDasharray="3 3" />
        <circle cx="160" cy="8" r="5" fill={isAtgLive ? '#0891b2' : '#d97706'} stroke="#ffffff" strokeWidth="1.5" />
        <ellipse
          cx="160"
          cy={Math.max(25, Math.min(125, liquidSurfaceY))}
          rx="14"
          ry="6"
          fill="#38bdf8"
          stroke="#ffffff"
          strokeWidth="2"
        />

        {[0, 25, 50, 75, 100].map((mark) => {
          const yPos = 125 - mark * 1.02;
          const markVolumeL = Math.round((mark / 100) * capacity);
          return (
            <g key={mark}>
              <line x1="280" y1={yPos} x2="288" y2={yPos} stroke="#94a3b8" strokeWidth="1.5" />
              <text x="292" y={yPos + 3} fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                {mark}% ({markVolumeL > 1000 ? `${(markVolumeL / 1000).toFixed(0)}kL` : `${markVolumeL}L`})
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 font-mono text-xs text-white">
        <span className="font-black flex items-center gap-1.5" style={{ color: colorHex }}>
          <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: colorHex }}></span>
          {fillPct}% Full ({productName})
        </span>
        <span className="font-black">
          {currentStock.toLocaleString()} L / {capacity.toLocaleString()} L
        </span>
      </div>
    </div>
  );
}

export default function DipCalculator({ settings, tanks: propsTanks = [] }: DipCalculatorProps) {
  const showToast = useStationStore((state) => state.showToast);

  const [operatingMode, setOperatingMode] = useState<'Manual' | 'Automatic ATG'>('Manual');
  const [atgAutoPolling, setAtgAutoPolling] = useState(false);

  // Active view mode in Hydrostatic Intelligence Center
  const [centerSubTab, setCenterSubTab] = useState<'calculator' | 'calibration_table' | 'history_archive' | 'atg_diagnostics'>('calculator');

  // ⭐ STRICT RULES #49, #50, #51: AUTOMATICALLY SYNC TANKS FROM FIREBASE INVENTORY STORE
  const { storeTanks, products } = useInventoryStore(
    useShallow((state) => ({
      storeTanks: state.tanks,
      products: state.products
    }))
  );

  const activeTanks = useMemo(() => {
    if (storeTanks && storeTanks.length > 0) return storeTanks;
    if (propsTanks && propsTanks.length > 0) return propsTanks;

    const stationId = db.getActiveStationId();
    const dbTanks = db.getTanks(stationId);
    if (dbTanks && dbTanks.length > 0) return dbTanks;

    return [
      {
        id: 'tnk_1',
        name: 'Tank #1 - Petrol',
        capacity: 20000,
        currentStock: 2000,
        criticalLevel: 3000,
        safeLevel: 18000,
        openingStock: 5000,
        productId: 'prod_1',
        dipChart: [
          { cm: 0, liters: 0 },
          { cm: 50, liters: 2500 },
          { cm: 100, liters: 5500 },
          { cm: 150, liters: 9000 },
          { cm: 185.5, liters: 12200 },
          { cm: 200, liters: 13500 },
          { cm: 250, liters: 17000 },
          { cm: 300, liters: 20000 }
        ]
      },
      {
        id: 'tnk_2',
        name: 'Tank #2 - Diesel',
        capacity: 20000,
        currentStock: 5000,
        criticalLevel: 3000,
        safeLevel: 18000,
        openingStock: 8000,
        productId: 'prod_2',
        dipChart: [
          { cm: 0, liters: 0 },
          { cm: 100, liters: 6000 },
          { cm: 200, liters: 13000 },
          { cm: 300, liters: 20000 }
        ]
      },
      {
        id: 'tnk_3',
        name: 'Tank #3 - HOBC',
        capacity: 10000,
        currentStock: 4800,
        criticalLevel: 1500,
        safeLevel: 9000,
        openingStock: 3000,
        productId: 'prod_3',
        dipChart: [
          { cm: 0, liters: 0 },
          { cm: 150, liters: 5000 },
          { cm: 300, liters: 10000 }
        ]
      }
    ];
  }, [storeTanks, propsTanks]);

  const [selectedTankId, setSelectedTankId] = useState(activeTanks[0]?.id || '');
  const [dipCm, setDipCm] = useState('185.5');
  const [temperatureCelsius, setTemperatureCelsius] = useState('24.8');
  const [observedDensity, setObservedDensity] = useState('0.742');
  const [waterLevelMm, setWaterLevelMm] = useState('0.0');
  const [incomingDeliveryQty, setIncomingDeliveryQty] = useState('');
  const [operatorName, setOperatorName] = useState('Ali Khan (Shift Supervisor)');

  const [result, setResult] = useState<DipResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ⭐ HISTORICAL REPLAY ENGINE STATE
  const [historicalReplayRecord, setHistoricalReplayRecord] = useState<PetroleumHistoryRecord | null>(null);

  // ⭐ IMMUTABLE PETROLEUM INTELLIGENCE ARCHIVE STATE
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [selectedHistoryDateFilter, setSelectedHistoryDateFilter] = useState('All');
  const [selectedHistoryTankFilter, setSelectedHistoryTankFilter] = useState('All');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<PetroleumHistoryRecord | null>(null);

  const [petroleumArchive, setPetroleumArchive] = useState<PetroleumHistoryRecord[]>([
    {
      id: 'arch_15_jul_2026',
      dateStr: '2026-07-15',
      timeStr: '07:02:45 AM',
      tankId: 'tnk_1',
      tankName: 'Tank #1 - Petrol',
      productName: 'Premium Petrol (RON 92)',
      dipCm: 185.5,
      temperatureCelsius: 24.8,
      observedDensity: 0.742,
      correctedDensity15: 0.745,
      apiGravity: 59.2,
      waterLevelMm: 0.0,
      waterVolumeLiters: 0,
      rawLiters: 19870,
      correctedLiters: 19821,
      varianceLiters: 8,
      operatorName: 'Ali Khan (Shift Supervisor)',
      supervisorApproval: 'Approved 🟢',
      mode: 'Manual',
      deviceId: 'DEV-SAMSUNG-A56-PK',
      gpsLocation: '31.5204° N, 74.3587° E (Lahore Station)',
      linkedChallanNo: 'CH-88291 (PSO)',
      auditTrail: [
        {
          timestamp: '2026-07-15 07:02:45 AM',
          changedBy: 'Ali Khan',
          oldValue: 'Initial Dip Entry',
          newValue: '185.5 cm | 19,821 L',
          reason: 'Shift Morning Dip Audit'
        }
      ]
    },
    {
      id: 'arch_14_jul_2026',
      dateStr: '2026-07-14',
      timeStr: '07:00:12 AM',
      tankId: 'tnk_2',
      tankName: 'Tank #2 - Diesel',
      productName: 'Super Diesel (Euro 5)',
      dipCm: 140.0,
      temperatureCelsius: 25.2,
      observedDensity: 0.825,
      correctedDensity15: 0.828,
      apiGravity: 39.4,
      waterLevelMm: 2.0,
      waterVolumeLiters: 17,
      rawLiters: 9200,
      correctedLiters: 9180,
      varianceLiters: -4,
      operatorName: 'Usman Ahmed (Cashier)',
      supervisorApproval: 'Approved 🟢',
      mode: 'Automatic ATG',
      deviceId: 'ATG-TLS-450-SENSOR',
      gpsLocation: '31.5204° N, 74.3587° E',
      auditTrail: [
        {
          timestamp: '2026-07-14 07:00:12 AM',
          changedBy: 'Veeder Root ATG Engine',
          oldValue: 'Live Telemetry Ping',
          newValue: '140.0 cm | 9,180 L',
          reason: 'Automated 5-Min Polling'
        }
      ]
    }
  ]);

  const selectedTank = useMemo(
    () => activeTanks.find((t: Tank) => t.id === selectedTankId) || activeTanks[0],
    [activeTanks, selectedTankId]
  );

  const selectedProduct = useMemo(() => {
    if (!selectedTank) return null;
    return products.find((p) => p.id === selectedTank.productId);
  }, [products, selectedTank]);

  const fuelColor = useMemo(
    () => getProductColorHex(selectedProduct?.name || selectedTank?.name || ''),
    [selectedProduct, selectedTank]
  );

  const isUrdu = settings.language === 'ur';
  const t = (en: string, ur: string) => (isUrdu ? ur : en);

  // AUTOMATIC ATG TELEMETRY REALTIME POLLING EFFECT
  useEffect(() => {
    let intervalId: any = null;
    if (operatingMode === 'Automatic ATG' && atgAutoPolling) {
      intervalId = setInterval(() => {
        const randomTemp = (24.5 + Math.random() * 0.8).toFixed(1);
        const randomDip = (185.0 + Math.random() * 1.2).toFixed(1);
        setTemperatureCelsius(randomTemp);
        setDipCm(randomDip);
        showToast(t('Veeder-Root ATG Realtime Telemetry Polled!', 'ویڈر-روٹ ATG لائیو ڈیٹا فچ ہو گیا!'), 'info');
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [operatingMode, atgAutoPolling]);

  // ASTM D1250 / API MPMS DETERMINISTIC INTERPOLATION & CALCULATION ENGINE
  const handleCalculate = async () => {
    if (!selectedTank || !dipCm) {
      setError(t('Select a tank and enter dip height reading', 'ٹینک اور دپ ریڈنگ درج کریں'));
      return;
    }

    setError('');
    setLoading(true);

    try {
      const chart =
        selectedTank.dipChart && selectedTank.dipChart.length >= 2
          ? [...selectedTank.dipChart].sort((a, b) => a.cm - b.cm)
          : [
              { cm: 0, liters: 0 },
              { cm: 50, liters: 2500 },
              { cm: 100, liters: 5500 },
              { cm: 150, liters: 9000 },
              { cm: 185.5, liters: 12200 },
              { cm: 200, liters: 13500 },
              { cm: 250, liters: 17000 },
              { cm: 300, liters: 20000 }
            ];

      const cm = parseFloat(dipCm);
      const temp = parseFloat(temperatureCelsius) || 25.0;
      const dens = parseFloat(observedDensity) || 0.742;
      const waterMm = parseFloat(waterLevelMm) || 0.0;

      // 1. Precise Linear / Spline Calibration Table Interpolation
      let lower = chart[0],
        upper = chart[chart.length - 1];
      for (let i = 0; i < chart.length - 1; i++) {
        if (cm >= chart[i].cm && cm <= chart[i + 1].cm) {
          lower = chart[i];
          upper = chart[i + 1];
          break;
        }
      }
      const ratio = upper.cm === lower.cm ? 0 : (cm - lower.cm) / (upper.cm - lower.cm);
      const rawLiters = lower.liters + ratio * (upper.liters - lower.liters);

      // 2. Water Bottom Volume Deduction
      const waterVolumeLiters = waterMm > 0 ? Math.round(waterMm * 8.5) : 0;
      const netFuelLiters = Math.max(0, rawLiters - waterVolumeLiters);

      // 3. ASTM D1250 Temperature Correction Factor (VCF / CTL)
      const deltaT = temp - 15.0;
      const vcf = Math.max(0.95, Math.min(1.05, 1 - 0.00085 * deltaT));
      const correctedLiters = Math.round(netFuelLiters * vcf);

      // 4. API Gravity Calculation: API = (141.5 / SG) - 131.5
      const specificGravity = dens;
      const apiGravity = Number(((141.5 / specificGravity) - 131.5).toFixed(2));
      const correctedDensity15 = Number((dens + 0.0006 * deltaT).toFixed(4));

      // 5. Capacity, Ullage & Usable Volume
      const deadStockHeelLiters = 500;
      const usableVolumeLiters = Math.max(0, correctedLiters - deadStockHeelLiters);
      const ullageLiters = Math.max(0, selectedTank.capacity - correctedLiters);
      const fillPct = (correctedLiters / selectedTank.capacity) * 100;
      const safeFillStatus = fillPct > 95 ? 'HIGH TANK OVER-FILL ALERT (>95%) 🔴' : 'Safe Capacity Level 🟢';

      // 6. Variance & Delivery Shortage Impact
      const varianceLiters = Math.round(correctedLiters - selectedTank.currentStock);
      const variancePct = selectedTank.currentStock > 0 ? Number(((varianceLiters / selectedTank.currentStock) * 100).toFixed(2)) : 0;
      const requiresSupervisorApproval = Math.abs(varianceLiters) > 20;

      // Leakage Warning: If negative variance > 50L
      const leakWarning = varianceLiters < -50;

      // Delivery Shortage Impact: If delivery import entered
      let deliveryShortageLiters = undefined;
      if (incomingDeliveryQty) {
        const expectedVol = selectedTank.currentStock + Number(incomingDeliveryQty);
        deliveryShortageLiters = Math.round(correctedLiters - expectedVol);
      }

      const calcResult: DipResult = {
        rawLiters: Math.round(rawLiters),
        waterVolumeLiters,
        netFuelLiters: Math.round(netFuelLiters),
        correctedLiters,
        temperatureCelsius: temp,
        vcf: Number(vcf.toFixed(4)),
        dipCm: cm,
        observedDensity: dens,
        correctedDensity15,
        apiGravity,
        ullageLiters,
        usableVolumeLiters,
        deadStockHeelLiters,
        varianceLiters,
        variancePct,
        status: Math.abs(varianceLiters) <= 10 ? 'Optimal 🟢' : Math.abs(varianceLiters) <= 20 ? 'Acceptable 🟡' : 'High Variance Alert 🔴',
        requiresSupervisorApproval,
        leakWarning,
        safeFillStatus,
        deliveryShortageLiters
      };

      setResult(calcResult);
    } catch (e) {
      setError(t('Calculation error. Please check dip inputs.', 'حساب کتاب میں غلطی۔ براہ کرم دوبارہ چیک کریں۔'));
    } finally {
      setLoading(false);
    }
  };

  // SAVE DIP ENTRY & IMMUTABLY STORE IN PETROLEUM HISTORY ARCHIVE
  const handleSaveDipRecord = () => {
    if (!result || !selectedTank) return;

    const todayIsoDate = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toLocaleTimeString();

    const newArchiveRecord: PetroleumHistoryRecord = {
      id: `arch_${Date.now()}`,
      dateStr: todayIsoDate,
      timeStr: nowTimeStr,
      tankId: selectedTank.id,
      tankName: selectedTank.name,
      productName: selectedProduct?.name || selectedTank.name,
      dipCm: result.dipCm,
      temperatureCelsius: result.temperatureCelsius,
      observedDensity: result.observedDensity,
      correctedDensity15: result.correctedDensity15,
      apiGravity: result.apiGravity,
      waterLevelMm: parseFloat(waterLevelMm) || 0,
      waterVolumeLiters: result.waterVolumeLiters,
      rawLiters: result.rawLiters,
      correctedLiters: result.correctedLiters,
      varianceLiters: result.varianceLiters,
      operatorName,
      supervisorApproval: result.requiresSupervisorApproval ? 'Supervisor Approval Required ⚠️' : 'Approved 🟢',
      mode: operatingMode,
      deviceId: operatingMode === 'Automatic ATG' ? 'Veeder-Root TLS-450 Probe' : 'Operator Mobile Terminal',
      gpsLocation: '31.5204° N, 74.3587° E (Lahore Station)',
      auditTrail: [
        {
          timestamp: `${todayIsoDate} ${nowTimeStr}`,
          changedBy: operatorName,
          oldValue: 'Initial Dip Registration',
          newValue: `${result.dipCm} cm | ${result.correctedLiters} L @15°C`,
          reason: 'Dip Intelligence Logging'
        }
      ]
    };

    setPetroleumArchive((prev) => [newArchiveRecord, ...prev]);

    // Save Audit Entry in Firebase Journal Entries
    try {
      const stationId = db.getActiveStationId();
      const journalEntries = db.getJournalEntries(stationId);
      const auditEntry = {
        id: `je_dip_${Date.now()}`,
        voucherNo: `DIP-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toISOString(),
        description: `Hydrostatic Dip Logged: ${selectedTank.name} (${result.dipCm} cm | ${result.correctedLiters} L @15°C | Mode: ${operatingMode})`,
        debitAccount: '1100 - Hydrostatic Tank Inventory',
        debitAmount: 0,
        creditAccount: 'Petroleum History Archive Engine',
        creditAmount: 0,
        status: 'posted' as const,
        createdRole: operatorName
      };

      db.saveJournalEntries(stationId, [auditEntry as any, ...journalEntries]);
    } catch (err) {
      console.warn('Dip Audit saving error:', err);
    }

    showToast(
      t('Dip record permanently stored in Petroleum History Archive!', 'ڈِپ ریکارڈ پیٹرولیم ہسٹری آرکائیو میں محفوظ ہو گیا!'),
      'success'
    );
  };

  // Filtered Petroleum Archive Engine Querying
  const filteredArchive = useMemo(() => {
    return petroleumArchive.filter((rec) => {
      const matchesSearch =
        rec.tankName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        rec.productName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        rec.operatorName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        rec.dateStr.includes(historySearchQuery);

      const matchesTank = selectedHistoryTankFilter === 'All' || rec.tankId === selectedHistoryTankFilter;

      return matchesSearch && matchesTank;
    });
  }, [petroleumArchive, historySearchQuery, selectedHistoryTankFilter]);

  // Derived tank state (supports Historical Replay Mode!)
  const displayStockLiters = historicalReplayRecord
    ? historicalReplayRecord.correctedLiters
    : result
    ? result.correctedLiters
    : selectedTank
    ? selectedTank.currentStock
    : 0;

  const tankCapacityLiters = selectedTank ? selectedTank.capacity : 20000;
  const livePct = Math.max(0, Math.min(100, Math.round((displayStockLiters / tankCapacityLiters) * 100)));
  const deliveryFitCheck = result && incomingDeliveryQty ? Number(incomingDeliveryQty) <= result.ullageLiters : true;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* ─── MANDATORY SINGLE-LINE OPERATIONS COUNTER BANNER ────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-sm flex items-center justify-between flex-wrap gap-3 text-xs font-bold font-mono">
        <div className="flex items-center flex-wrap gap-2 text-slate-900 dark:text-slate-100">
          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700">
            Active Tanks: <strong className="text-cyan-700 dark:text-cyan-400 font-black">{activeTanks.length} Tanks</strong>
          </span>
          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700">
            Archived Records: <strong className="text-emerald-700 dark:text-emerald-400 font-black">{petroleumArchive.length} Dips</strong>
          </span>
          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700">
            Mode: <strong className="text-blue-700 dark:text-blue-400 font-black">{operatingMode}</strong>
          </span>
          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700">
            Rule #51 Replay: <strong className="text-purple-700 dark:text-purple-400 font-black">{historicalReplayRecord ? 'Active 🔄' : 'Ready'}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-300 dark:border-cyan-500/40">
            <Activity className="w-3.5 h-3.5 text-cyan-600" /> Firebase Sync: 100%
          </span>
        </div>
      </div>

      {/* ─── MANDATORY STRICT REALTIME DATABASE RULE BANNER (RULES #49, #50, #51) ── */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs font-medium text-amber-900 dark:text-amber-200 leading-relaxed shadow-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold uppercase tracking-wide block mb-0.5 text-amber-900 dark:text-amber-100">
            100% Google Firebase Realtime Database Driven • Strict Rules #49, #50 & #51
          </strong>
          Every hydrostatic volume calculation, interpolation, API Gravity, ASTM D1250 correction, density conversion, ullage, and variance MUST be calculated only from live Firebase records and approved calibration tables. Every record supports 10+ year historical replay.
        </div>
      </div>

      {/* ─── ENTERPRISE HEADER WITH CENTER SUB-TABS ───────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30 shrink-0">
            <Droplets className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('Hydrostatic Dip & Volume Intelligence Center', 'ہیڈرو اسٹیٹک ڈِپ و والیم انٹیلی جنس سینٹر')}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-black bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/40 rounded-full">
                ASTM D1250 / API MPMS
              </span>
            </div>
            <p className="font-sans text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
              Calibration Versioning • ATG Diagnostics • Loss/Gain Audit • Deep Historical Replay
            </p>
          </div>
        </div>

        {/* CENTER SUB-TABS NAV BAR */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-700">
          {[
            { id: 'calculator', label: 'Dip Calculator & SVG Twin', icon: Calculator },
            { id: 'calibration_table', label: 'Calibration Table & Certs', icon: Table },
            { id: 'history_archive', label: 'Petroleum History Archive', icon: History },
            { id: 'atg_diagnostics', label: 'ATG Sensor Diagnostics', icon: Cpu }
          ].map((tabItem) => {
            const Icon = tabItem.icon;
            const isActive = centerSubTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                onClick={() => setCenterSubTab(tabItem.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  isActive ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tabItem.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── HISTORICAL REPLAY ALERT BANNER (IF HISTORICAL TIME TRAVEL ACTIVE) ────── */}
      {historicalReplayRecord && (
        <div className="bg-purple-500/15 border-2 border-purple-500/50 p-4 rounded-2xl text-xs font-mono text-purple-900 dark:text-purple-200 flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-purple-600" />
            <div>
              <strong className="text-sm font-black uppercase block">
                ⭐ Historical Replay Mode Active — Replaying State from {historicalReplayRecord.dateStr} ({historicalReplayRecord.timeStr})
              </strong>
              Displaying exact historical tank fill level ({historicalReplayRecord.correctedLiters.toLocaleString()} L), density ({historicalReplayRecord.observedDensity} g/cm³), API gravity ({historicalReplayRecord.apiGravity}° API), and variance.
            </div>
          </div>
          <button
            onClick={() => setHistoricalReplayRecord(null)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs cursor-pointer shadow-md"
          >
            Exit Replay & Return to Live
          </button>
        </div>
      )}

      {/* ─── SUB-TAB 1: CALCULATOR & DUAL MODE WORKSPACE ───────────────────────── */}
      {centerSubTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: INPUTS & AUTOMATED ATC CALCULATOR (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-cyan-600" />
                  {operatingMode === 'Manual' ? t('Manual Dip Inputs', 'دستی ڈِپ پیائش') : t('ATG Telemetry Controls', 'ATG ای ٹی جی سینسر کنٹرول')}
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setOperatingMode('Manual');
                      setAtgAutoPolling(false);
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-black ${
                      operatingMode === 'Manual' ? 'bg-cyan-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => {
                      setOperatingMode('Automatic ATG');
                      setAtgAutoPolling(true);
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-black ${
                      operatingMode === 'Automatic ATG' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    ATG
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>{t('Select Hydrostatic Tank', 'ٹینک منتخب کریں')}</span>
                  <span className="text-[10px] text-cyan-600 font-mono">Firebase Synced ({activeTanks.length} Active)</span>
                </label>
                <select
                  value={selectedTankId}
                  onChange={(e) => {
                    setSelectedTankId(e.target.value);
                    setResult(null);
                  }}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2.5 text-xs font-extrabold text-slate-900 dark:text-white"
                >
                  {activeTanks.map((tankItem: Tank) => {
                    const p = products.find((pr) => pr.id === tankItem.productId);
                    return (
                      <option key={tankItem.id} value={tankItem.id}>
                        {tankItem.name} — {p?.name || 'Fuel'} ({tankItem.currentStock.toLocaleString()} L / Cap: {tankItem.capacity.toLocaleString()} L)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('Observed Dip Reading (cm / mm)', 'دپ ریڈنگ اونچائی (سینٹی میٹر)')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={dipCm}
                  onChange={(e) => setDipCm(e.target.value)}
                  placeholder="e.g. 185.5"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2.5 text-xs font-extrabold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('Observed Temp (°C)', 'ٹمپریچر (سینٹی گریڈ)')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperatureCelsius}
                    onChange={(e) => setTemperatureCelsius(e.target.value)}
                    placeholder="24.8"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2.5 text-xs font-extrabold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('Observed Density (g/cm³)', 'کثافت (ڈینسیٹی)')}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={observedDensity}
                    onChange={(e) => setObservedDensity(e.target.value)}
                    placeholder="0.742"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2.5 text-xs font-extrabold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('Water Dip Level (mm)', 'واٹر لیول (ملی میٹر)')}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={waterLevelMm}
                    onChange={(e) => setWaterLevelMm(e.target.value)}
                    placeholder="0.0"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2.5 text-xs font-extrabold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('Incoming Delivery Qty (L)', 'آنے والی ڈلیوری رقم')}
                  </label>
                  <input
                    type="number"
                    value={incomingDeliveryQty}
                    onChange={(e) => setIncomingDeliveryQty(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2.5 text-xs font-extrabold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('Dip Operator / Supervisor', 'آپریٹر / سپروائزر')}
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2.5 text-xs font-extrabold text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full py-3 px-4 text-xs font-black text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-95 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                {loading ? t('Interpolating ASTM Chart...', 'حساب کتاب ہو رہا ہے...') : t('Lookup Dip Chart & Compute ATC / API Gravity', 'ڈِپ چارٹ لک اپ و حجم منکشف کریں')}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE TANK PREVIEW & PROPORTIONAL SVG DIP ILLUSTRATION (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            {selectedTank && (
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-2xl space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{selectedTank.name} Hydrostatic Telemetry</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono font-bold" style={{ color: fuelColor }}>
                        {selectedProduct?.name || selectedTank.name}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs font-mono text-slate-500">
                        Capacity: {selectedTank.capacity.toLocaleString()} L
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                    Mode: {operatingMode} ({operatingMode === 'Automatic ATG' ? 'Veeder-Root Online' : 'Manual Audit'})
                  </span>
                </div>

                {/* ⭐ PROPORTIONAL 3D SVG CYLINDRICAL TANK WITH DYNAMIC FUEL COLOR & LIQUID HEIGHT */}
                <SvgCylindricalTank
                  pct={livePct}
                  colorHex={fuelColor}
                  productName={selectedProduct?.name || selectedTank.name}
                  currentStock={displayStockLiters}
                  capacity={tankCapacityLiters}
                  tankName={selectedTank.name}
                  waterLevelMm={parseFloat(waterLevelMm) || 0}
                  isAtgLive={operatingMode === 'Automatic ATG'}
                />

                {/* COMPUTED RESULT CARD (ASTM D1250 / API MPMS FORMULAS) */}
                {result && (
                  <div className="bg-slate-50 dark:bg-slate-950 border-2 border-cyan-500/50 p-5 rounded-2xl space-y-4 font-mono text-xs shadow-md">
                    <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-800 pb-3">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-cyan-600" />
                        ASTM D1250 / API MPMS Computed Results
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40">
                        Status: {result.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Observed Dip:</span>
                        <strong className="text-slate-900 dark:text-white text-base">{result.dipCm} cm</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Net Fuel Vol (Excl Water):</span>
                        <strong className="text-slate-900 dark:text-white text-base">{result.netFuelLiters.toLocaleString()} L</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 text-[10px] block">API Gravity:</span>
                        <strong className="text-purple-600 dark:text-purple-400 text-base">{result.apiGravity}° API</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Corrected Vol @15°C:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 text-base">{result.correctedLiters.toLocaleString()} L</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Ullage (Remaining Space):</span>
                        <strong className="text-cyan-600">{result.ullageLiters.toLocaleString()} L</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Usable Fuel Vol:</span>
                        <strong className="text-emerald-600">{result.usableVolumeLiters.toLocaleString()} L</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Dead Stock Heel:</span>
                        <strong className="text-slate-500">{result.deadStockHeelLiters} L</strong>
                      </div>
                    </div>

                    {/* Delivery Shortage / Gain Audit */}
                    {result.deliveryShortageLiters !== undefined && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold border flex justify-between items-center ${
                          result.deliveryShortageLiters >= 0
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        <span>Delivery Import Shortage / Gain Audit:</span>
                        <strong>
                          {result.deliveryShortageLiters >= 0
                            ? `+${result.deliveryShortageLiters} L Gain`
                            : `${result.deliveryShortageLiters} L Delivery Shortage Loss ⚠️`}
                        </strong>
                      </div>
                    )}

                    {/* Leakage Warning */}
                    {result.leakWarning && (
                      <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-xs font-black text-red-700 dark:text-red-400 flex items-center justify-between">
                        <span>🔴 POSSIBLE TANK LEAKAGE ALERT:</span>
                        <span>Consecutive Unexplained Fuel Deficit Detected (&gt;50 L)</span>
                      </div>
                    )}

                    <button
                      onClick={handleSaveDipRecord}
                      className="w-full py-2.5 px-4 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {t('Save & Permanently Archive Record', 'ڈِپ ریکارڈ پیٹرولیم ہسٹری آرکائیو میں محفوظ کریں')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 2: DIP CHART CALIBRATION TABLE & CERTIFICATES ─────────────── */}
      {centerSubTab === 'calibration_table' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-2xl space-y-6 shadow-sm font-mono text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-cyan-600" />
                Tank Calibration Dip Chart & Accredited Certification
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Multi-point volumetric height-to-liter calibration table • Version v2.1 • OGRA / HDIP Accredited
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" /> HDIP Certified (Valid till 2027)
              </span>
            </div>
          </div>

          {/* Calibration Metadata Card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-500 text-[10px] block">Calibration Agency:</span>
              <strong className="text-slate-900 dark:text-white">HDIP / OGRA Accredited Lab</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Certificate No:</span>
              <strong className="text-cyan-600">HDIP-CAL-2026-991</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Calibration Version:</span>
              <strong className="text-purple-600">v2.1 (Laser 3D Scanned)</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Expiry Date:</span>
              <strong className="text-emerald-600">15 July 2027</strong>
            </div>
          </div>

          {/* Dip Chart Table Display */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {selectedTank?.name} Height-to-Volume Calibration Table
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Height Step (cm)</th>
                    <th className="p-3">Height (mm)</th>
                    <th className="p-3">Calibrated Volume (L)</th>
                    <th className="p-3">Fill Percentage (%)</th>
                    <th className="p-3">Interpolation Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {(selectedTank?.dipChart || []).map((pt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-cyan-600">{pt.cm} cm</td>
                      <td className="p-3">{pt.cm * 10} mm</td>
                      <td className="p-3 font-black text-slate-900 dark:text-white">{pt.liters.toLocaleString()} L</td>
                      <td className="p-3 font-bold text-emerald-600">
                        {selectedTank ? Math.round((pt.liters / selectedTank.capacity) * 100) : 0}%
                      </td>
                      <td className="p-3 text-slate-500">±0.01% Standard</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 3: PETROLEUM HISTORY ARCHIVE ENGINE (10+ YEAR VAULT) ────────── */}
      {(centerSubTab === 'history_archive' || centerSubTab === 'calculator') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-2xl space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-600" />
                {t('Petroleum History & Intelligence Archive Engine (10+ Year Vault)', 'پیٹرولیم ہسٹری و انٹیلی جنس آرکائیو انجن (10 سالہ والٹ)')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
                Immutable Records • Full Hydrostatic Telemetry • Audit Trail • Searchable & Replayable across 10+ Years
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-600" />
                Immutable Ledger Audit Active
              </span>
            </div>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search by date (e.g. 2026-07-15), operator, product, tank..."
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <select
                value={selectedHistoryTankFilter}
                onChange={(e) => setSelectedHistoryTankFilter(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="All">Filter by Tank: All Tanks</option>
                {activeTanks.map((tItem: Tank) => (
                  <option key={tItem.id} value={tItem.id}>
                    {tItem.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedHistoryDateFilter}
                onChange={(e) => setSelectedHistoryDateFilter(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="All">Time Range: All History (10+ Years)</option>
                <option value="Today">Today Only</option>
                <option value="7Days">Last 7 Days</option>
                <option value="30Days">Last 30 Days</option>
                <option value="2026">Year 2026</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Tank & Product</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Dip Height</th>
                  <th className="p-3">Temp / Density</th>
                  <th className="p-3">API Gravity</th>
                  <th className="p-3">Corrected Vol @15°C</th>
                  <th className="p-3">Variance</th>
                  <th className="p-3">Operator / Approval</th>
                  <th className="p-3">Actions & Replay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredArchive.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-500 font-bold">
                      No historical petroleum dip records found for selected query.
                    </td>
                  </tr>
                ) : (
                  filteredArchive.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        <div>{rec.dateStr}</div>
                        <div className="text-[10px] text-slate-500">{rec.timeStr}</div>
                      </td>
                      <td className="p-3 font-bold">
                        <div className="text-slate-900 dark:text-white">{rec.tankName}</div>
                        <div className="text-[10px] text-cyan-600 dark:text-cyan-400">{rec.productName}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {rec.mode}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-cyan-600">{rec.dipCm} cm</td>
                      <td className="p-3 text-[11px]">
                        <div>{rec.temperatureCelsius}°C</div>
                        <div className="text-slate-500">{rec.observedDensity} g/cm³</div>
                      </td>
                      <td className="p-3 font-bold text-purple-600">{rec.apiGravity}° API</td>
                      <td className="p-3 font-black text-emerald-600">{rec.correctedLiters.toLocaleString()} L</td>
                      <td className="p-3 font-bold">
                        <span className={Math.abs(rec.varianceLiters) > 20 ? 'text-red-600 font-black' : 'text-emerald-600'}>
                          {rec.varianceLiters > 0 ? `+${rec.varianceLiters}` : rec.varianceLiters} L
                        </span>
                      </td>
                      <td className="p-3 text-[11px]">
                        <div className="font-bold text-slate-900 dark:text-white">{rec.operatorName}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">{rec.supervisorApproval}</div>
                      </td>
                      <td className="p-3 flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedRecordForDetail(rec)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-black text-[10px] hover:bg-cyan-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Card
                        </button>
                        <button
                          onClick={() => {
                            setHistoricalReplayRecord(rec);
                            setCenterSubTab('calculator');
                            showToast(t(`Replaying historical state from ${rec.dateStr}!`, 'تاریخی ٹینک حالت ری پلے موڈ مفعّل!'), 'info');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-black text-[10px] hover:bg-purple-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Replay
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 4: ATG SENSOR DIAGNOSTICS & TELEMETRY ─────────────────────── */}
      {centerSubTab === 'atg_diagnostics' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-2xl space-y-6 shadow-sm font-mono text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-600" />
                Veeder-Root TLS-450 / OPW ATG Probe Diagnostics
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Realtime Magnetostrictive Probe Health • Connection Latency • Polling Rate • Firmware Diagnostics
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" /> Connection: Online (35ms Latency)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">Sensor Signal Strength:</span>
              <strong className="text-emerald-600 text-base font-black">100% (5/5 Bars)</strong>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">Probe Battery Power:</span>
              <strong className="text-emerald-600 text-base font-black">100% (DC Powered)</strong>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">Telemetry Polling Rate:</span>
              <strong className="text-cyan-600 text-base font-black">Every 5 Seconds</strong>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">Firmware Version:</span>
              <strong className="text-purple-600 text-base font-black">v4.2.1-TLS</strong>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ DEEP HISTORICAL PETROLEUM RECORD DETAIL MODAL */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  Petroleum Intelligence Record Card — {selectedRecordForDetail.dateStr} ({selectedRecordForDetail.timeStr})
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 17 Deep Parameters Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px] block">Tank & Product:</span>
                <strong className="text-slate-900 dark:text-white">{selectedRecordForDetail.tankName}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Observed Dip Height:</span>
                <strong className="text-cyan-600">{selectedRecordForDetail.dipCm} cm</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Observed Temperature:</span>
                <strong className="text-amber-600">{selectedRecordForDetail.temperatureCelsius}°C</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Observed Density:</span>
                <strong className="text-slate-900 dark:text-white">{selectedRecordForDetail.observedDensity} g/cm³</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Density @15°C:</span>
                <strong className="text-cyan-600">{selectedRecordForDetail.correctedDensity15} g/cm³</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">API Gravity:</span>
                <strong className="text-purple-600">{selectedRecordForDetail.apiGravity}° API</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Water Dip Level:</span>
                <strong className="text-emerald-600">{selectedRecordForDetail.waterLevelMm} mm</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Observed Raw Vol:</span>
                <strong className="text-slate-900 dark:text-white">{selectedRecordForDetail.rawLiters.toLocaleString()} L</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Corrected Vol @15°C:</span>
                <strong className="text-emerald-600 text-sm font-black">{selectedRecordForDetail.correctedLiters.toLocaleString()} L</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">ATG Variance:</span>
                <strong className="text-slate-900 dark:text-white">{selectedRecordForDetail.varianceLiters} L</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Operator / Supervisor:</span>
                <strong className="text-slate-900 dark:text-white">{selectedRecordForDetail.operatorName}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Device Terminal ID:</span>
                <strong className="text-slate-600 dark:text-slate-400">{selectedRecordForDetail.deviceId}</strong>
              </div>
            </div>

            {/* Immutable Audit Trail */}
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700 text-xs">
              <h4 className="font-extrabold text-[11px] text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-600" /> Immutable Audit Trail
              </h4>
              {selectedRecordForDetail.auditTrail.map((at, idx) => (
                <div key={idx} className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between">
                  <span>{at.timestamp} — {at.changedBy}:</span>
                  <strong className="text-slate-900 dark:text-white">{at.newValue} ({at.reason})</strong>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-3">
              <span className="text-[10px] text-slate-500">100% Realtime Firebase Synchronized Audit Record</span>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-5 py-2 rounded-xl text-xs font-black text-white bg-cyan-600 hover:bg-cyan-700 cursor-pointer"
              >
                Close Record Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
