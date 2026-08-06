import React from 'react';
import { InventoryHubProps } from '../../InventoryHub';
import { Package, ExternalLink } from 'lucide-react';

export const LubeWarehouseTab: React.FC<InventoryHubProps> = (props) => {
  const isEn = props.settings.language === 'en';

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4 animate-in fade-in zoom-in-95">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <Package className="w-10 h-10 text-muted-foreground/50" />
      </div>
      
      <h3 className="text-2xl font-black text-foreground mb-2">
        {isEn ? 'Lube Warehouse Module Moved' : 'لبریکنٹس کا ماڈیول منتقل کر دیا گیا ہے'}
      </h3>
      
      <p className="text-sm font-bold text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
        {isEn 
          ? 'As part of our enterprise strategy, all lubricants and secondary products are now managed entirely through the dedicated "Motorway Oil - Lube ERP".' 
          : 'انٹرپرائز حکمت عملی کے تحت، اب تمام لبریکنٹس کا انتظام Motorway Oil - Lube ERP کے ذریعے کیا جائے گا۔'}
      </p>

      <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
        {isEn ? 'Open Motorway Oil ERP' : 'موٹروے آئل ERP کھولیں'}
        <ExternalLink className="w-4 h-4" />
      </button>

      <div className="mt-12 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl max-w-md w-full">
        <p className="text-xs font-black text-amber-700 dark:text-amber-500 mb-1">SSOT Rule Active</p>
        <p className="text-[10px] font-bold text-amber-700/70">
          This Fuel ERP module no longer stores or manages Lube SKUs, Barcodes, or Batches to prevent data duplication across businesses.
        </p>
      </div>
    </div>
  );
};
