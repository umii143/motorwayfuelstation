import React, { useMemo } from 'react';
import { PhoneCall, AlertTriangle, TrendingUp, CalendarClock, Target, ArrowRight } from 'lucide-react';

export default function SmartDebtRecovery() {
  const recoveryQueue = useMemo(() => {
    return [
      { id: 'CUST-102', name: 'Zamani Transport', balance: 450000, daysOverdue: 15, riskLevel: 'high', phone: '0300-1234567' },
      { id: 'CUST-088', name: 'Pak Logistics', balance: 120000, daysOverdue: 7, riskLevel: 'medium', phone: '0333-9876543' },
      { id: 'CUST-145', name: 'Al-Madina Movers', balance: 850000, daysOverdue: 30, riskLevel: 'critical', phone: '0345-5555555' },
    ].sort((a, b) => b.balance - a.balance);
  }, []);

  const formatCurrency = (val: number) => 'Rs. ' + val.toLocaleString('en-PK');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-5 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500/20">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Total Unrecovered</h3>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">Rs. 1,420,000</p>
        </div>
        <div className="premium-card p-5 bg-rose-50 dark:bg-rose-900/10 border-rose-500/20">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Critical Risk</h3>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300">Rs. 850,000</p>
        </div>
        <div className="premium-card p-5 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/20">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Recovered Today</h3>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">Rs. 150,000</p>
        </div>
        <div className="premium-card p-5 bg-amber-50 dark:bg-amber-900/10 border-amber-500/20">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Avg. Collection Time</h3>
            <CalendarClock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300">12 Days</p>
        </div>
      </div>

      {/* QUEUE */}
      <div className="premium-card overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-indigo-500" /> Smart Recovery Queue
            </h3>
            <p className="text-xs text-gray-500 mt-1">AI-prioritized list of high-exposure clients</p>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {recoveryQueue.map((client) => (
            <div key={client.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  client.riskLevel === 'critical' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                  client.riskLevel === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">{client.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-mono text-gray-500">{client.id}</span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      client.daysOverdue >= 30 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {client.daysOverdue} Days Overdue
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:items-end gap-1">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(client.balance)}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Exposure</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg font-bold text-sm transition-colors">
                  <PhoneCall className="w-4 h-4" /> Call {client.phone}
                </button>
                <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
