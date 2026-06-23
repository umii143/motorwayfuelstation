import React from 'react';
import { GlobalSettings } from '../../../types';
import { Database, ArrowRight, Save } from 'lucide-react';

interface DataMappingsProps {
  settings: GlobalSettings;
  stationId: string;
}

 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function DataMappings({ settings, stationId }: DataMappingsProps) {
  const mappings = [
    { local: 'Super (Tank 1)', external: 'MATERIAL_1001_SUPER', type: 'Product Code' },
    { local: 'Diesel (Tank 2)', external: 'MATERIAL_1002_AGO', type: 'Product Code' },
    { local: 'V-Power (Tank 3)', external: 'MATERIAL_1003_VPWR', type: 'Product Code' },
    { local: 'Station ID', external: 'PLANT_4099', type: 'Location Code' },
    { local: 'Shift Revenue', external: 'GL_ACCT_400010', type: 'GL Account' },
    { local: 'Card Payments', external: 'GL_ACCT_100020', type: 'GL Account' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="premium-card border overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-500" />
              Master Data Mappings
            </h3>
            <p className="text-xs text-slate-500 mt-1">Map local FuelPro entities to your ERP's master data identifiers.</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-12 gap-4 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
            <div className="col-span-4">Local Entity</div>
            <div className="col-span-2 text-center"></div>
            <div className="col-span-4">External Identifier (ERP)</div>
            <div className="col-span-2 text-right">Type</div>
          </div>

          <div className="space-y-4">
            {mappings.map((map, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 items-center group">
                <div className="col-span-4">
                  <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded text-sm text-slate-700 font-medium truncate">
                    {map.local}
                  </div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-rose-400 transition" />
                </div>
                <div className="col-span-4">
                  <input 
                    type="text" 
                    defaultValue={map.external}
                    className="w-full bg-white border border-slate-200 px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded text-sm font-mono text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {map.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
            <button className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-rose-700 transition">
              <Save className="h-4 w-4" /> Save Mappings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
