import React, { useState, useEffect } from 'react';
import { GlobalSettings, RewardTransaction, LoyaltyMember } from '../../../types';
import { db } from '../../../data/db';
import { Search, Coins, Plus, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PointsTransactionsProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function PointsTransactions({ settings, stationId }: PointsTransactionsProps) {
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [memberId, setMemberId] = useState('');
  const [type, setType] = useState<'earn' | 'redeem' | 'adjustment'>('earn');
  const [points, setPoints] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadData();
  }, [stationId]);

  const loadData = () => {
    setTransactions(db.getRewardTransactions(stationId));
    setMembers(db.getLoyaltyMembers(stationId));
  };

  const handleOpenModal = () => {
    setMemberId(members.length > 0 ? members[0].id : '');
    setType('earn');
    setPoints('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!memberId || !points || !description) {
      alert("Please fill in required fields (Member, Points, Description).");
      return;
    }

    const currentTxs = db.getRewardTransactions(stationId);
    let pts = parseInt(points, 10);
    
    // Redeem should be negative in logic
    if (type === 'redeem') {
      pts = -Math.abs(pts);
    } else {
      pts = Math.abs(pts);
    }

    const now = Date.now();
    const newTx: RewardTransaction = {
      id: `rtx_${now}`,
      memberId,
      type,
      points: pts,
      description,
      date: new Date().toISOString(),
      createdAt: now,
      updatedAt: now
    };

    db.saveRewardTransactions(stationId, [...currentTxs, newTx]);

    // Update member balance
    const currentMembers = db.getLoyaltyMembers(stationId);
    const updatedMembers = currentMembers.map(m => {
      if (m.id === memberId) {
        return { ...m, pointsBalance: m.pointsBalance + pts };
      }
      return m;
    });
    db.saveLoyaltyMembers(stationId, updatedMembers);

    loadData();
    setIsModalOpen(false);
  };

  const getMemberDetails = (id: string) => {
    const m = members.find(mem => mem.id === id);
    return m ? `${m.name} (${m.phone})` : 'Unknown Member';
  };

  const filteredTxs = transactions.filter(t => 
    getMemberDetails(t.memberId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-start items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          disabled={members.length === 0}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Log Points
        </button>
      </div>

      <div className="premium-card border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Activity Type</th>
                <th>Description</th>
                <th className="text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.map(tx => {
                const isPositive = tx.points >= 0;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                    <td className="text-slate-700">
                      {new Date(tx.date).toLocaleString()}
                    </td>
                    <td>
                      <div className="font-bold text-slate-900">{getMemberDetails(tx.memberId)}</div>
                    </td>
                    <td>
                      <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-max ${
                        tx.type === 'earn' ? 'bg-emerald-100 text-emerald-700' : 
                        tx.type === 'redeem' ? 'bg-rose-100 text-rose-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {tx.type === 'earn' ? <ArrowUpRight className="h-3 w-3" /> : 
                         tx.type === 'redeem' ? <ArrowDownRight className="h-3 w-3" /> : null}
                        {tx.type}
                      </span>
                    </td>
                    <td className="text-slate-600">
                      {tx.description}
                    </td>
                    <td className="text-right">
                      <span className={`font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? '+' : ''}{tx.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredTxs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No points transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="premium-modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black font-sans text-slate-800 flex items-center gap-2">
                <Coins className="h-5 w-5 text-rose-500" />
                Log Points Activity
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Member *</label>
                <select value={memberId} onChange={e => setMemberId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Activity Type</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white">
                    <option value="earn">Earn (Add Points)</option>
                    <option value="redeem">Redeem (Subtract Points)</option>
                    <option value="adjustment">Manual Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Points Amount *</label>
                  <input type="number" value={points} onChange={e => setPoints(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="e.g. 500" min="1" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Reason *</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="e.g. Purchased 50L Super" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition">Cancel</button>
              <button onClick={handleSave} className="bg-rose-600 text-white px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-rose-700 transition shadow-md shadow-rose-500/20">
                Process Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
