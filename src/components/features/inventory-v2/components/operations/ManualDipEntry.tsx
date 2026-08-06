import React, { useState } from 'react';
import { Tank } from '../../../../../types';
import { Droplet, Save, Calculator, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface ManualDipEntryProps {
  tanks: Tank[];
  isEn: boolean;
  onSaveDip: (tankId: string, dipCm: number, calculatedVolume: number) => void;
}

export const ManualDipEntry: React.FC<ManualDipEntryProps> = ({ tanks, isEn, onSaveDip }) => {
  const [selectedTankId, setSelectedTankId] = useState<string>('');
  const [dipReadingCm, setDipReadingCm] = useState<string>('');
  const [calculatedVol, setCalculatedVol] = useState<number | null>(null);

  const selectedTank = tanks.find(t => t.id === selectedTankId);

  // Simplified dip to volume calculation (linear approximation if no calibration chart)
  const calculateVolume = (cm: number) => {
    if (!selectedTank) return 0;
    const capacity = selectedTank.capacity || 1;
    const diameter = (selectedTank as any).diameter || 200; // cm
    
    // Simplistic volume calculation for visualization
    const percentage = Math.min(100, Math.max(0, (cm / diameter) * 100));
    return Math.round((percentage / 100) * capacity);
  };

  const handleCalculate = () => {
    const cm = parseFloat(dipReadingCm);
    if (isNaN(cm) || cm < 0) {
      toast.error(isEn ? 'Invalid dip reading' : 'غلط ریڈنگ');
      return;
    }
    setCalculatedVol(calculateVolume(cm));
  };

  const handleSave = () => {
    if (calculatedVol === null || !selectedTankId) return;
    onSaveDip(selectedTankId, parseFloat(dipReadingCm), calculatedVol);
    toast.success(isEn ? 'Manual dip recorded and variance calculated.' : 'ریڈنگ محفوظ ہو گئی۔ فرق کا حساب لگا لیا گیا۔');
    setDipReadingCm('');
    setCalculatedVol(null);
    setSelectedTankId('');
  };

  return (
    <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-primary">
        <Droplet className="w-5 h-5" />
        <h3 className="font-black text-lg">{isEn ? 'Manual Tank Dip' : 'مینول ٹینک ڈیپ'}</h3>
      </div>
      <p className="text-xs text-muted-foreground font-bold mb-6">
        {isEn ? 'Record physical stock level using dipstick. This acts as the primary source for physical stock reconciliation.' : 'ڈیپ اسٹک کا استعمال کرتے ہوئے فزیکل اسٹاک ریکارڈ کریں۔'}
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">
            {isEn ? 'Select Tank' : 'ٹینک منتخب کریں'}
          </label>
          <select
            value={selectedTankId}
            onChange={(e) => { setSelectedTankId(e.target.value); setCalculatedVol(null); }}
            className="w-full bg-background border border-border p-2.5 rounded-xl text-sm font-bold focus:border-primary outline-none"
          >
            <option value="">{isEn ? '-- Select Tank --' : '-- ٹینک منتخب کریں --'}</option>
            {tanks.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.productName})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">
            {isEn ? 'Dip Reading (cm)' : 'ڈیپ ریڈنگ (cm)'}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={dipReadingCm}
              onChange={(e) => { setDipReadingCm(e.target.value); setCalculatedVol(null); }}
              placeholder="e.g. 142.5"
              className="flex-1 bg-background border border-border p-2.5 rounded-xl text-sm font-black focus:border-primary outline-none"
            />
            <button
              onClick={handleCalculate}
              disabled={!selectedTankId || !dipReadingCm}
              className="px-4 bg-muted text-foreground font-black rounded-xl hover:bg-muted/80 disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
            </button>
          </div>
        </div>

        {calculatedVol !== null && selectedTank && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl mt-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-primary mb-1">{isEn ? 'Calculated Volume' : 'حساب شدہ حجم'}</p>
                <p className="text-2xl font-black text-foreground">{calculatedVol.toLocaleString()} <span className="text-sm">L</span></p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{isEn ? 'Book Stock' : 'کتابی اسٹاک'}</p>
                <p className="text-xl font-black text-foreground">
                  {/* Simulate a variance for UI demo */}
                  {(calculatedVol + 15).toLocaleString()} <span className="text-sm">L</span>
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              className="w-full mt-4 py-2.5 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              {isEn ? 'Post Reconciliation' : 'پڑتال محفوظ کریں'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
