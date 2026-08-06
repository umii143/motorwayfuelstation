import React from 'react';
import { Tank } from '../../../../../types';
import { Droplet, AlertTriangle } from 'lucide-react';

interface LiveTankVisualizerProps {
  tank: Tank;
  currentVolume: number;
  waterLevelCm?: number;
  temperature?: number;
  isEn?: boolean;
  onClick?: () => void;
}

export const LiveTankVisualizer: React.FC<LiveTankVisualizerProps> = ({ tank, currentVolume, waterLevelCm = 0, temperature = 25, isEn = true, onClick }) => {
  const capacity = tank.capacity || 1; // Prevent divide by zero
  const fillPercentage = Math.min(100, Math.max(0, (currentVolume / capacity) * 100));
  const waterPercentage = Math.min(100, Math.max(0, (waterLevelCm / ((tank as any).diameter || 200)) * 100)); // Assuming a generic 200cm height if no calibration

  const isLow = fillPercentage < 20;
  const isCritical = fillPercentage < 10;
  
  let fuelColor = "bg-amber-500/80"; // Default HSD color
  if (tank.productName?.toUpperCase().includes("HOBC")) fuelColor = "bg-rose-500/80";
  if (tank.productName?.toUpperCase().includes("PETROL") || tank.productName?.toUpperCase().includes("PMG")) fuelColor = "bg-green-500/80";

  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all relative overflow-hidden group cursor-pointer"
    >
      
      {/* Header */}
      <div className="w-full flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-black text-foreground">{tank.name}</h3>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{tank.productName || 'Unknown Product'}</span>
        </div>
        {isCritical && (
          <div className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 text-rose-600 rounded-lg animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase">Critical</span>
          </div>
        )}
      </div>

      {/* 3D Tank Visualization */}
      <div className="relative w-32 h-48 rounded-[2rem] border-4 border-muted/50 bg-background/50 overflow-hidden shadow-inner flex flex-col justify-end isolate">
        
        {/* Glass reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 z-20 rounded-[2rem] pointer-events-none"></div>
        <div className="absolute left-2 top-2 bottom-2 w-2 bg-white/20 rounded-full blur-[1px] z-20 pointer-events-none"></div>

        {/* Capacity Ticks */}
        <div className="absolute right-1 top-0 bottom-0 w-4 flex flex-col justify-between py-6 z-20 opacity-30">
          {[100, 75, 50, 25, 0].map(tick => (
            <div key={tick} className="w-full border-t-2 border-foreground relative">
              <span className="absolute -left-6 -top-2 text-[8px] font-black text-foreground">{tick}%</span>
            </div>
          ))}
        </div>

        {/* Fuel Liquid Level */}
        <div 
          className={`absolute bottom-0 left-0 right-0 ${fuelColor} transition-all duration-1000 ease-in-out z-10 flex flex-col items-center justify-start overflow-hidden`}
          style={{ height: `${fillPercentage}%` }}
        >
          {/* Waves animation (CSS only simulation with opacity gradients) */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/20 to-transparent"></div>
          
          <span className="mt-2 text-white font-black text-xs mix-blend-overlay drop-shadow-md">
            {Math.round(fillPercentage)}%
          </span>
        </div>

        {/* Water Level (Bottom) */}
        {waterLevelCm > 0 && (
          <div 
            className="absolute bottom-0 left-0 right-0 bg-blue-500/80 transition-all duration-1000 z-15 flex items-center justify-center border-t border-blue-400"
            style={{ height: `${waterPercentage}%` }}
          >
            <Droplet className="w-3 h-3 text-white/50" />
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="w-full mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="bg-muted/30 rounded-lg p-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{isEn ? 'Volume' : 'حجم'}</p>
          <p className="text-xs font-black text-foreground">{currentVolume.toLocaleString()} L</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{isEn ? 'Capacity' : 'گنجائش'}</p>
          <p className="text-xs font-black text-foreground">{capacity.toLocaleString()} L</p>
        </div>
        {temperature && (
          <div className="col-span-2 bg-muted/30 rounded-lg p-1.5 flex items-center justify-between px-3 gap-1 text-[10px] font-bold text-muted-foreground">
             <span>Temp: {temperature}°C</span>
             <span className="text-foreground">Safe Fill: 95%</span>
          </div>
        )}
      </div>

    </div>
  );
};
