/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * BowserDeliveriesTab — Bowser Deliveries & Transit Tracking
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Truck, Plus } from 'lucide-react';

interface BowserDeliveriesTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const BowserDeliveriesTab: React.FC<BowserDeliveriesTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const deliveries = [
    { bwId: 'BW-2025-0515-001', vehicleNo: 'LES-9021', supplier: 'PSO Depot Port Qasim', product: 'Super Petrol', liters: '16,000 L', driver: 'Rashid Khan (35202-998811-1)', departure: 'May 15, 05:00 AM', arrival: 'May 15, 09:24 AM', sealNo: 'SEAL-781923', status: 'ARRIVED' },
    { bwId: 'BW-2025-0515-002', vehicleNo: 'KBL-4410', supplier: 'Shell Machike Terminal', product: 'High Speed Diesel', liters: '12,000 L', driver: 'Imran Ali (35201-112233-5)', departure: 'May 15, 07:30 AM', arrival: 'ETA: 11:45 AM', sealNo: 'SEAL-889102', status: 'IN_TRANSIT' },
    { bwId: 'BW-2025-0515-003', vehicleNo: 'T-9812', supplier: 'Attock Rawalpindi Depot', product: 'Super Petrol', liters: '14,000 L', driver: 'Asif Mahmood (37405-667788-3)', departure: 'May 15, 08:10 AM', arrival: 'ETA: 01:30 PM', sealNo: 'SEAL-901122', status: 'DISPATCHED' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Truck size={18} className="text-blue-600" />
            <span>Bowser Deliveries & GPS Live Transit Tracker</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Realtime fuel tanker bowser tracking, driver security seals, and arrival schedules
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Dispatch Bowser</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'bwId', header: 'Bowser #', headerUr: 'باؤزر #', accessor: 'bwId', sortable: true },
            { id: 'vehicleNo', header: 'Vehicle No', headerUr: 'گاڑی #', accessor: 'vehicleNo' },
            { id: 'supplier', header: 'Terminal / Depot', headerUr: 'ڈیپو', accessor: 'supplier' },
            { id: 'product', header: 'Product', headerUr: 'پروڈکٹ', accessor: 'product' },
            { id: 'liters', header: 'Volume (L)', headerUr: 'حجم', accessor: 'liters' },
            { id: 'driver', header: 'Driver & CNIC', headerUr: 'ڈرائیور', accessor: 'driver' },
            { id: 'arrival', header: 'Arrival Time', headerUr: 'پہنچنے کا وقت', accessor: 'arrival' },
            { id: 'sealNo', header: 'Seal Tag #', headerUr: 'سیل نمبر', accessor: 'sealNo' },
            { id: 'status', header: 'Transit Status', headerUr: 'حالت', accessor: 'status' },
          ]}
          data={deliveries}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
