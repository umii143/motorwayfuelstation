/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * NozzlePerformanceTab — Dedicated Nozzle Performance & Meter Readings Sub-Workspace
 *
 * Implements Enterprise Rule #137 & Rule #144
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Fuel, Activity } from 'lucide-react';

interface NozzlePerformanceTabProps {
  lang: 'en' | 'ur';
  onSelectRecord?: (record: Record<string, any>) => void;
}

export const NozzlePerformanceTab: React.FC<NozzlePerformanceTabProps> = ({
  lang,
  onSelectRecord,
}) => {
  const isEn = lang === 'en';

  const nozzleList = [
    { id: '01', name: 'Nozzle 01', status: 'IN_USE', product: 'Super Petrol', currentSale: '12.45 L', flowRate: '35 L/min', meterReading: '145,280.5 L', totalRevenue: 'Rs 3,548,200' },
    { id: '02', name: 'Nozzle 02', status: 'IN_USE', product: 'High Speed Diesel', currentSale: '18.22 L', flowRate: '40 L/min', meterReading: '98,420.0 L', totalRevenue: 'Rs 2,750,000' },
    { id: '03', name: 'Nozzle 03', status: 'IDLE', product: 'Super Petrol', currentSale: '0.00 L', flowRate: '0 L/min', meterReading: '65,100.0 L', totalRevenue: 'Rs 1,820,000' },
    { id: '04', name: 'Nozzle 04', status: 'IN_USE', product: 'Super Petrol', currentSale: '8.10 L', flowRate: '32 L/min', meterReading: '210,500.5 L', totalRevenue: 'Rs 5,140,000' },
    { id: '05', name: 'Nozzle 05', status: 'OFFLINE', product: 'High Speed Diesel', currentSale: '0.00 L', flowRate: '0 L/min', meterReading: '12,000.0 L', totalRevenue: 'Rs 320,000' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Fuel size={16} className="text-blue-600" />
            <span>Nozzle Performance & Mechanical Meter Readings</span>
          </h2>
          <p className="text-xs font-bold text-slate-400">Live electronic totalizer readings and dispensing flow rates</p>
        </div>
      </div>

      <EnterpriseRegisterTable
        columns={[
          { id: 'name', header: 'Nozzle Name', headerUr: 'نوزل نام', accessor: 'name', sortable: true },
          { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
          { id: 'status', header: 'Live Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          { id: 'flowRate', header: 'Flow Rate', headerUr: 'بہاؤ کی رفتار', accessor: 'flowRate' },
          { id: 'meterReading', header: 'Meter Reading (L)', headerUr: 'میٹر ریڈنگ', accessor: 'meterReading' },
          { id: 'totalRevenue', header: 'Total Revenue (₨)', headerUr: 'کل آمدن', accessor: 'totalRevenue' },
        ]}
        data={nozzleList}
        language={lang}
        onRowClick={(row) => onSelectRecord?.(row)}
      />
    </div>
  );
};
