import React, { useState } from 'react';
import { InventoryHubProps } from '../../InventoryHub';
import { LiveTankVisualizer } from './LiveTankVisualizer';
import { Settings2, Plus, AlertCircle, Droplet, ListFilter } from 'lucide-react';
import { Tank } from '../../../../../types';
import toast from 'react-hot-toast';
import { TankDetailsDrawer } from './TankDetailsDrawer';

export const TankFarmTab: React.FC<InventoryHubProps> = (props) => {
  const isEn = props.settings.language === 'en';
  const { tanks, stockTransactions, products } = props;
  
  const [filter, setFilter] = useState<'all' | 'low' | 'critical'>('all');
  const [selectedTank, setSelectedTank] = useState<Tank | null>(null);

  // Helper to calculate current stock for a tank
  // In a real production setup this comes directly from a unified state, 
  // but here we can calculate it from transactions if needed, or assume a fallback.
  // For v2 we will assume the Tank object itself has currentVolume or we look it up from products.
  
  const getTankStock = (tank: Tank): number => {
    // Basic fallback: find the product and use its current stock, distributed if multiple tanks share a product.
    // Ideally Tank has `currentStock` property.
    if ('currentStock' in tank && typeof tank.currentStock === 'number') {
      return tank.currentStock;
    }
    
    // Fallback: look at product stock
    const product = products.find(p => p.id === tank.productId);
    if (!product) return 0;
    
    // If multiple tanks share the same product, this calculation is naive (shows total product stock).
    // In Enterprise V2 we will ensure the Tank Store holds exact current dip volumes.
    return product.currentStock || 0;
  };

  const filteredTanks = tanks.filter(tank => {
    const vol = getTankStock(tank);
    const cap = tank.capacity || 1;
    const perc = (vol / cap) * 100;
    if (filter === 'critical') return perc <= 10;
    if (filter === 'low') return perc <= 20;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border">
        <div>
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Droplet className="w-5 h-5 text-primary" />
            {isEn ? 'Live Tank Farm' : 'لائیو ٹینک فارم'}
          </h3>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            {isEn ? 'Realtime monitoring of all underground and above-ground tanks.' : 'تمام زیر زمین اور بالائی ٹینکوں کی لائیو نگرانی۔'}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center p-1 bg-muted rounded-xl border border-border">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${filter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {isEn ? 'All Tanks' : 'تمام'}
            </button>
            <button 
              onClick={() => setFilter('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${filter === 'low' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-600/50 hover:text-amber-600'}`}
            >
              {isEn ? 'Low Stock' : 'کم اسٹاک'}
            </button>
            <button 
              onClick={() => setFilter('critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${filter === 'critical' ? 'bg-rose-500 text-white shadow-sm' : 'text-rose-600/50 hover:text-rose-600'}`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {isEn ? 'Critical' : 'انتہائی کم'}
            </button>
          </div>
          <button className="px-3 py-2 bg-primary text-primary-foreground text-xs font-black rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            <Plus className="w-4 h-4" />
            {isEn ? 'Add Tank' : 'ٹینک شامل کریں'}
          </button>
        </div>
      </div>

      {/* Grid of Tanks */}
      {tanks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border border-dashed">
          <Droplet className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-bold">{isEn ? 'No tanks configured for this station yet.' : 'ابھی تک کوئی ٹینک شامل نہیں کیا گیا۔'}</p>
        </div>
      ) : filteredTanks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border border-dashed">
          <ListFilter className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-bold">{isEn ? 'No tanks match the selected filter.' : 'فلٹر کے مطابق کوئی ٹینک نہیں ملا۔'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTanks.map(tank => (
            <LiveTankVisualizer
              key={tank.id}
              tank={tank}
              currentVolume={getTankStock(tank)}
              waterLevelCm={(tank as any).waterLevel || 0} // Optional mock values if not in type
              temperature={24.5} // Simulated temperature
              isEn={isEn}
              onClick={() => setSelectedTank(tank)}
            />
          ))}
        </div>
      )}

      {selectedTank && (
        <TankDetailsDrawer
          tank={selectedTank}
          currentStock={getTankStock(selectedTank)}
          isEn={isEn}
          onClose={() => setSelectedTank(null)}
        />
      )}

    </div>
  );
};
