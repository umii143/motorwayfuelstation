import React from 'react';
import { GlobalSettings } from '../../../types';
import { Key, Eye, Copy, Plus, Save } from 'lucide-react';

interface CredentialsManagerProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function CredentialsManager({ settings, stationId }: CredentialsManagerProps) {
  const credentials = [
    { id: 'sap_prod', name: 'SAP Production API', key: 'pk_live_*************************', status: 'active' },
    { id: 'xero_app', name: 'Xero OAuth Client', key: 'clientId_**********************', status: 'active' },
    { id: 'custom_wh', name: 'Custom Webhook Secret', key: 'whsec_***********************', status: 'inactive' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-800">
        <strong>Security Notice:</strong> API keys provide full read/write access to your station's data. Never share them publicly. Key values are masked after creation for security.
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Key className="h-4 w-4 text-slate-500" />
            Active Credentials
          </h3>
          <button className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-800 transition">
            <Plus className="h-3 w-3" /> Generate New Key
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {credentials.map(cred => (
            <div key={cred.id} className="p-6 flex flex-row items-center justify-between gap-4 hover:bg-slate-50 transition">
              <div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  {cred.name}
                  <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full ${cred.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {cred.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 font-mono">
                    {cred.key}
                  </code>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition" title="Reveal">
                    <Eye className="h-3 w-3" />
                  </button>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition" title="Copy">
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded transition">
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Configuration Mock */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Outgoing Webhooks</h3>
          <p className="text-xs text-slate-500 mt-1">Configure endpoints to receive real-time events when data changes.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Endpoint URL</label>
              <input type="url" placeholder="https://api.yourcompany.com/webhooks/fuel" className="w-full px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Event Types</label>
              <select className="w-full px-3 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 bg-white">
                <option>All Events (Shifts, Drops, Loyalty)</option>
                <option>Shift Close Only</option>
                <option>Tanker Deliveries Only</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-rose-700 transition">
              <Save className="h-4 w-4" /> Save Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
