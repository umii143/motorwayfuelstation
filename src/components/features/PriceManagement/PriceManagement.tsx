import React, { useState } from 'react';
import { useInventoryStore } from '../../../stores/useInventoryStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import RateWizard from '../Settings/RateWizard';
import { Product, Tank, RateHistoryEntry, GlobalSettings } from '../../../types';
import ExecutiveRevaluationIntelligence from '../Dashboard/ExecutiveRevaluationIntelligence';

interface PriceManagementProps {
  products: Product[];
  tanks: Tank[];
  rateHistory: RateHistoryEntry[];
  language: string;
  settings: GlobalSettings;
  onUpdateProductRate: (productId: string, newRate: number, reason?: string, changedBy?: string, dateStr?: string, orgId?: string, stationId?: string, checkPerm?: any, attachments?: any[]) => void;
  onLogAudit: (category: string, action: string, details: string) => void;
  onUpdateProducts?: (products: Product[]) => void;
}

export default function PriceManagement(props: PriceManagementProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'ledger' | 'update'>('update');
  const { rateHistory, products } = props;

  const totalGain = rateHistory.reduce((sum, rh) => {
    const impact = rh.inventoryImpact ?? rh.impactAmount ?? 0;
    return impact > 0 ? sum + impact : sum;
  }, 0);
  
  const totalLoss = rateHistory.reduce((sum, rh) => {
    const impact = rh.inventoryImpact ?? rh.impactAmount ?? 0;
    return impact < 0 ? sum + Math.abs(impact) : sum;
  }, 0);
  
  const netImpact = totalGain - totalLoss;

  const chartData = [...rateHistory].reverse().map(rh => ({
    date: rh.effectiveDate || rh.date,
    product: rh.productName || products.find(p => p.id === rh.productId)?.name || 'Unknown',
    price: rh.newPrice || rh.newRate,
    impact: rh.inventoryImpact || rh.impactAmount || 0
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enterprise Fuel Price Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage fuel price changes, track revaluation history, and audit inventory gains/losses.</p>
        </div>
        <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('update')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'update' ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Update Rates
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'ledger' ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Revaluation Ledger
          </button>
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'timeline' ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Price Timeline
          </button>
        </div>
      </div>

      {activeTab === 'update' && (
        <RateWizard
          products={props.products}
          tanks={props.tanks}
          rateHistory={props.rateHistory}
          language={props.language}
          settings={props.settings}
          onUpdateProductRate={props.onUpdateProductRate}
          onLogAudit={props.onLogAudit}
          onUpdateProducts={props.onUpdateProducts}
        />
      )}

      {activeTab !== 'update' && (
        <ExecutiveRevaluationIntelligence 
          rateHistory={rateHistory} 
          settings={props.settings} 
          language={props.language} 
        />
      )}

      {activeTab === 'timeline' && (
        <div className="premium-card dark:bg-gray-800 p-6 border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Price Change Timeline</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" yAxisId="left" tickFormatter={(v) => `Rs ${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', color: '#f9fafb', borderRadius: '8px', border: 'none' }}
                  itemStyle={{ color: '#f9fafb' }}
                />
                <Line 
                  yAxisId="left" 
                  type="stepAfter" 
                  dataKey="price" 
                  name="Price"
                  stroke="#f97316" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="premium-card dark:bg-gray-800 border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Price Changes & Revaluation Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Date & Time</th>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Rate Change</th>
                  <th className="px-6 py-3 font-medium">Stock at Change</th>
                  <th className="px-6 py-3 font-medium">Revaluation Impact</th>
                  <th className="px-6 py-3 font-medium">Changed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rateHistory.map(entry => {
                  const impact = entry.inventoryImpact ?? entry.impactAmount ?? 0;
                  const isPositive = impact >= 0;
                  const diff = entry.difference ?? entry.change ?? 0;
                  const isIncrease = diff >= 0;
                  
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{entry.effectiveDate || entry.date}</div>
                        <div className="text-xs text-gray-500">{entry.effectiveTime || ''}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {entry.productName || products.find(p => p.id === entry.productId)?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 line-through">Rs {entry.oldPrice ?? entry.oldRate}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-bold text-gray-900 dark:text-white">Rs {entry.newPrice ?? entry.newRate}</span>
                        </div>
                        <div className={`text-xs font-medium mt-1 ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncrease ? 'Increase' : 'Decrease'} of Rs {Math.abs(diff)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {(entry.stockAtTimeOfChange ?? entry.stockAtTime ?? 0).toLocaleString()} L
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${isPositive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {isPositive ? '+' : ''}
                          Rs {impact.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{entry.changedBy}</div>
                        {entry.approvalStatus && (
                           <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${entry.approvalStatus === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                             {entry.approvalStatus}
                           </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rateHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No price change history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
