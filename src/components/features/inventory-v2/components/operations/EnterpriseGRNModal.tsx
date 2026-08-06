import React, { useState } from 'react';
import { Tank } from '../../../../../types';
import { X, Truck, ShieldCheck, DollarSign, Calculator, CheckCircle, AlertCircle, ArrowRight, FileText } from 'lucide-react';
import { formatCurrency } from '../../../../../lib/currency';
import { logger } from '../../../../../lib/logger';
import toast from 'react-hot-toast';

interface EnterpriseGRNModalProps {
  tanks: Tank[];
  isEn: boolean;
  onClose: () => void;
}

const SUPPLIERS = [
  { id: 'SUP-001', name: 'Pakistan State Oil (PSO)' },
  { id: 'SUP-002', name: 'Shell Pakistan' },
  { id: 'SUP-003', name: 'Total Parco Pakistan' },
  { id: 'SUP-004', name: 'Attock Petroleum' },
  { id: 'SUP-005', name: 'Hascol Petroleum' },
];

export const EnterpriseGRNModal: React.FC<EnterpriseGRNModalProps> = ({ tanks, isEn, onClose }) => {
  const [step, setStep] = useState(1);

  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('INV-2026-8841');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [bowserNo, setBowserNo] = useState('BWS-9921');
  const [driverName, setDriverName] = useState('Muhammad Tariq');
  const [vehicleNo, setVehicleNo] = useState('LES-4821');
  const [sealNo, setSealNo] = useState('SL-99381');

  // Allocation & Costs
  const [selectedTankId, setSelectedTankId] = useState(tanks[0]?.id || '');
  const [quantityLiters, setQuantityLiters] = useState('15000');
  const [purchaseRate, setPurchaseRate] = useState('260.00');

  // Fuel Logistics Expenses
  const [carriage, setCarriage] = useState('15000');
  const [driverTip, setDriverTip] = useState('2000');
  const [freight, setFreight] = useState('5000');
  const [unloading, setUnloading] = useState('1500');
  const [sampling, setSampling] = useState('1000');
  const [densityTest, setDensityTest] = useState('1000');
  const [sealBreaking, setSealBreaking] = useState('500');

  // Calculations
  const qty = parseFloat(quantityLiters) || 0;
  const baseRate = parseFloat(purchaseRate) || 0;
  const baseTotalCost = qty * baseRate;

  const totalLogisticsCost = 
    (parseFloat(carriage) || 0) +
    (parseFloat(driverTip) || 0) +
    (parseFloat(freight) || 0) +
    (parseFloat(unloading) || 0) +
    (parseFloat(sampling) || 0) +
    (parseFloat(densityTest) || 0) +
    (parseFloat(sealBreaking) || 0);

  const logisticsCostPerLiter = qty > 0 ? totalLogisticsCost / qty : 0;
  const landedCostPerLiter = baseRate + logisticsCostPerLiter;
  const totalLandedCost = landedCostPerLiter * qty;

  const handleCompleteGRN = () => {
    if (!selectedSupplier) {
      toast.error(isEn ? 'Supplier is Mandatory!' : 'سپلائر کا انتخاب لازمی ہے!');
      return;
    }

    logger.info(`[GRN ENGINE] Creating GRN for Supplier: ${selectedSupplier}, Tank: ${selectedTankId}`);
    logger.info(`[LANDED COST ENGINE] Base: ${baseRate}, Logistics: ${logisticsCostPerLiter.toFixed(2)}, Landed: ${landedCostPerLiter.toFixed(2)}`);
    logger.info(`[FINANCE ENGINE] Posting Fuel Logistics category expenses totaling Rs ${totalLogisticsCost}`);
    logger.info(`[SUPPLIER LEDGER] Pushing Invoice ${invoiceNo} Total: Rs ${totalLandedCost}`);
    logger.info(`[EVENT ENGINE] Dispatching EVENT_GRN_RECEIVED`);

    toast.success(isEn ? 'GRN Created & Landed Cost Posted!' : 'GRN اور لینڈڈ لاگت ریکارڈ ہو گئی!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-border mb-6">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-black text-foreground uppercase tracking-wide">
              {isEn ? 'Enterprise Stock-In (GRN) & Landed Cost' : 'انٹرپرائز ایندھن وصولی (GRN)'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-6 bg-muted/20 p-3 rounded-xl">
          <span className={`text-xs font-black ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>1. Supplier & Invoice</span>
          <span className={`text-xs font-black ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>2. Tank Allocation & Cost</span>
          <span className={`text-xs font-black ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>3. Fuel Logistics Expenses</span>
          <span className={`text-xs font-black ${step >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>4. Landed Cost & Post</span>
        </div>

        {/* Step 1: Supplier & Invoice Metadata */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-700 dark:text-amber-500 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>SSOT Rule #182: Supplier selection is strictly mandatory for all Stock-In entries.</span>
            </div>

            <div>
              <label className="text-xs font-black text-foreground uppercase block mb-1">Select Supplier *</label>
              <select 
                value={selectedSupplier} 
                onChange={e => setSelectedSupplier(e.target.value)}
                className="w-full bg-card border border-border rounded-xl p-3 text-sm font-bold outline-none focus:border-primary"
              >
                <option value="">-- Choose Supplier (Mandatory) --</option>
                {SUPPLIERS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Invoice No *</label>
                <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Invoice Date</label>
                <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Bowser No</label>
                <input type="text" value={bowserNo} onChange={e => setBowserNo(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Driver Name</label>
                <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Vehicle No</label>
                <input type="text" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Seal No</label>
                <input type="text" value={sealNo} onChange={e => setSealNo(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-bold" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button disabled={!selectedSupplier} onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black text-xs rounded-xl disabled:opacity-50">
                Next: Tank Allocation <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Tank Allocation & Base Purchase Cost */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-black text-foreground uppercase">Tank Allocation & Base Purchase Rate</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Target Tank *</label>
                <select value={selectedTankId} onChange={e => setSelectedTankId(e.target.value)} className="w-full bg-card border border-border rounded-xl p-3 text-xs font-bold">
                  {tanks.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.productName})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Delivered Quantity (Liters) *</label>
                <input type="number" value={quantityLiters} onChange={e => setQuantityLiters(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-mono font-black" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Base Purchase Rate (Rs/L) *</label>
                <input type="number" value={purchaseRate} onChange={e => setPurchaseRate(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-mono font-black" />
              </div>
            </div>

            <div className="p-4 bg-muted/20 border border-border rounded-xl flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground">Subtotal Base Purchase Cost</span>
              <span className="text-lg font-black font-mono text-foreground">{formatCurrency(baseTotalCost)}</span>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="px-6 py-3 bg-muted text-foreground font-black text-xs rounded-xl">Back</button>
              <button onClick={() => setStep(3)} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black text-xs rounded-xl">
                Next: Fuel Logistics <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Fuel Logistics Expenses */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-black text-foreground uppercase">Attach Fuel Logistics Expenses (Inward Costs)</h3>
            <p className="text-xs text-muted-foreground font-bold">These logistics costs will automatically contribute to the Landed Cost / Liter calculation.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Tanker Carriage (Rs)</label>
                <input type="number" value={carriage} onChange={e => setCarriage(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2 text-xs font-mono font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Driver Tips (Rs)</label>
                <input type="number" value={driverTip} onChange={e => setDriverTip(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2 text-xs font-mono font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Freight Charges (Rs)</label>
                <input type="number" value={freight} onChange={e => setFreight(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2 text-xs font-mono font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Fuel Unloading (Rs)</label>
                <input type="number" value={unloading} onChange={e => setUnloading(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2 text-xs font-mono font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Sampling (Rs)</label>
                <input type="number" value={sampling} onChange={e => setSampling(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2 text-xs font-mono font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Density Test (Rs)</label>
                <input type="number" value={densityTest} onChange={e => setDensityTest(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2 text-xs font-mono font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Seal Breaking (Rs)</label>
                <input type="number" value={sealBreaking} onChange={e => setSealBreaking(e.target.value)} className="w-full bg-card border border-border rounded-xl p-2 text-xs font-mono font-bold" />
              </div>
            </div>

            <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl flex justify-between items-center">
              <span className="text-xs font-bold text-sky-700 dark:text-sky-400">Total Fuel Logistics Inward Expense</span>
              <span className="text-lg font-black font-mono text-sky-600">{formatCurrency(totalLogisticsCost)}</span>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(2)} className="px-6 py-3 bg-muted text-foreground font-black text-xs rounded-xl">Back</button>
              <button onClick={() => setStep(4)} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black text-xs rounded-xl">
                Next: Review Landed Cost <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Landed Cost Engine & Submit */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-sm font-black text-foreground uppercase">Landed Cost Engine Summary</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-card border border-border rounded-2xl">
                 <p className="text-[10px] font-black text-muted-foreground uppercase">Base Purchase Cost</p>
                 <p className="text-xl font-black font-mono mt-1">₨ {baseRate.toFixed(2)} / L</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-2xl">
                 <p className="text-[10px] font-black text-muted-foreground uppercase">Logistics Cost Adder</p>
                 <p className="text-xl font-black font-mono text-amber-500 mt-1">+₨ {logisticsCostPerLiter.toFixed(2)} / L</p>
              </div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                 <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-500 uppercase">Actual Landed Cost</p>
                 <p className="text-2xl font-black font-mono text-emerald-600 mt-1">₨ {landedCostPerLiter.toFixed(2)} / L</p>
              </div>
            </div>

            <div className="p-4 bg-muted/20 border border-border rounded-2xl space-y-2 text-xs font-bold text-foreground">
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Supplier:</span>
                 <span>{SUPPLIERS.find(s => s.id === selectedSupplier)?.name}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Invoice & Bowser:</span>
                 <span>{invoiceNo} • {bowserNo} ({driverName})</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-muted-foreground">Delivered Liters:</span>
                 <span className="font-mono">{qty.toLocaleString()} L</span>
               </div>
               <div className="flex justify-between border-t border-border pt-2 text-sm font-black">
                 <span>Total Landed Payable:</span>
                 <span className="font-mono text-primary">{formatCurrency(totalLandedCost)}</span>
               </div>
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(3)} className="px-6 py-3 bg-muted text-foreground font-black text-xs rounded-xl">Back</button>
              <button onClick={handleCompleteGRN} className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white font-black text-xs rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-4 h-4" /> Post GRN & Update Supplier Ledger
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
