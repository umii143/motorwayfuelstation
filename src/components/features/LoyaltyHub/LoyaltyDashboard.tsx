import React, { useState, useEffect } from 'react';
import { GlobalSettings, LoyaltyMember, RewardTransaction } from '../../../types';
import { db } from '../../../data/db';
import { Gift, Users, Coins, TrendingUp, Award } from 'lucide-react';

interface LoyaltyDashboardProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function LoyaltyDashboard({ settings, stationId }: LoyaltyDashboardProps) {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);

  useEffect(() => {
    setMembers(db.getLoyaltyMembers(stationId));
    setTransactions(db.getRewardTransactions(stationId));
  }, [stationId]);

  const activeMembers = members.filter(m => m.status === 'active');
  const totalPointsLiability = members.reduce((sum, m) => sum + m.pointsBalance, 0);

  // MTD Points Issued
  const currentMonthTxs = transactions.filter(t => {
    const dt = new Date(t.date);
    const now = new Date();
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  });
  const mtdPointsIssued = currentMonthTxs.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.points, 0);
  const mtdPointsRedeemed = currentMonthTxs.filter(t => t.type === 'redeem').reduce((sum, t) => sum + Math.abs(t.points), 0);

  const getTierColor = (t: string) => {
    switch(t) {
      case 'platinum': return 'bg-slate-800 text-slate-100';
      case 'gold': return 'bg-amber-100 text-amber-800';
      case 'silver': return 'bg-slate-200 text-slate-700';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  const topMembers = [...members].sort((a, b) => b.pointsBalance - a.pointsBalance).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-5 border relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Active Members</span>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">{activeMembers.length}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Enrolled customers</div>
          </div>
        </div>

        <div className="premium-card p-5 border relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Points Liability</span>
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Coins className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-amber-600">{totalPointsLiability.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Unredeemed points</div>
          </div>
        </div>

        <div className="premium-card p-5 border relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">MTD Points Issued</span>
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600">{mtdPointsIssued.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Points given this month</div>
          </div>
        </div>

        <div className="premium-card p-5 border relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase">MTD Points Redeemed</span>
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <Gift className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-600">{mtdPointsRedeemed.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Points spent this month</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Members */}
        <div className="premium-card border overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Top Members by Balance
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {topMembers.map(member => (
              <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{member.phone}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-slate-800">{member.pointsBalance.toLocaleString()} pts</div>
                  <div className="mt-1">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${getTierColor(member.tier)}`}>
                      {member.tier}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {topMembers.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No active loyalty members found.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="premium-card border overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Coins className="h-4 w-4 text-blue-500" />
              Recent Points Activity
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {transactions.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(tx => {
              const member = members.find(m => m.id === tx.memberId);
              const isPositive = tx.points >= 0;
              return (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{member?.name || 'Unknown Member'}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{tx.description}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositive ? '+' : ''}{tx.points}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(tx.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
            {transactions.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No recent points transactions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
