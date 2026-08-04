/**
 * @license SPDX-License-Identifier: Apache-2.0
 *
 * FuelPro Enterprise Business Operating System v4.0
 * DigitalWalletsTab — EasyPaisa, JazzCash, Raast Digital Wallets
 */

import React from 'react';
import { EnterpriseRegisterTable } from '../../EnterpriseRegisterTable';
import { Wallet, Plus } from 'lucide-react';

interface DigitalWalletsTabProps {
  lang: 'en' | 'ur';
  onOpenInspector: (record: Record<string, any>) => void;
}

export const DigitalWalletsTab: React.FC<DigitalWalletsTabProps> = ({
  lang,
  onOpenInspector,
}) => {
  const wallets = [
    { walletId: 'EP-0300-1122334', provider: 'EasyPaisa Corporate', currentBalance: 'Rs 850,250', todayCollections: 'Rs 120,000', settlementStatus: 'SETTLED_DAILY', status: 'ACTIVE' },
    { walletId: 'JC-0312-9988776', provider: 'JazzCash Merchant', currentBalance: 'Rs 640,000', todayCollections: 'Rs 95,000', settlementStatus: 'SETTLED_DAILY', status: 'ACTIVE' },
    { walletId: 'RAAST-FUELPRO-01', provider: 'Raast Instant QR', currentBalance: 'Rs 400,000', todayCollections: 'Rs 45,000', settlementStatus: 'REALTIME', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      <div className="flex justify-between items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Wallet size={18} className="text-purple-600" />
            <span>Digital Wallets & QR Payment Gateways</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            EasyPaisa, JazzCash, NayaPay, and Raast instant digital collections
          </p>
        </div>
        <button className="px-4 py-2 bg-[#0B5C3D] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
          <Plus size={15} />
          <span>+ Connect Wallet</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <EnterpriseRegisterTable
          columns={[
            { id: 'walletId', header: 'Wallet Account ID', headerUr: 'والیٹ ID', accessor: 'walletId', sortable: true },
            { id: 'provider', header: 'Digital Provider', headerUr: 'پرووائیڈر', accessor: 'provider' },
            { id: 'currentBalance', header: 'Current Balance (₨)', headerUr: 'موجودہ بیلنس', accessor: 'currentBalance' },
            { id: 'todayCollections', header: 'Today Collections', headerUr: 'آج کی وصولی', accessor: 'todayCollections' },
            { id: 'settlementStatus', header: 'Bank Settlement', headerUr: 'بینک منتقلی', accessor: 'settlementStatus' },
            { id: 'status', header: 'Status', headerUr: 'اسٹیٹس', accessor: 'status' },
          ]}
          data={wallets}
          language={lang}
          onRowClick={(row: Record<string, any>) => onOpenInspector(row)}
        />
      </div>
    </div>
  );
};
