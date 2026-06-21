import React, { useState, useEffect } from 'react';
import { GlobalSettings, LoyaltyMember } from '../../../types';
import { db } from '../../../data/db';
import { Search, Users, Plus, XCircle, Award } from 'lucide-react';

interface MembersManagerProps {
  settings: GlobalSettings;
  stationId: string;
}

export default function MembersManager({ settings, stationId }: MembersManagerProps) {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<'bronze' | 'silver' | 'gold' | 'platinum'>('bronze');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');

  useEffect(() => {
    loadData();
  }, [stationId]);

  const loadData = () => {
    setMembers(db.getLoyaltyMembers(stationId));
  };

  const handleOpenModal = (member?: LoyaltyMember) => {
    if (member) {
      setEditingId(member.id);
      setName(member.name);
      setPhone(member.phone);
      setCardNumber(member.cardNumber || '');
      setEmail(member.email || '');
      setTier(member.tier);
      setStatus(member.status);
    } else {
      setEditingId(null);
      setName('');
      setPhone('');
      setCardNumber('');
      setEmail('');
      setTier('bronze');
      setStatus('active');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name || !phone) {
      alert("Name and Phone are required.");
      return;
    }

    const currentMembers = db.getLoyaltyMembers(stationId);
    let updatedMembers: LoyaltyMember[];
    const now = Date.now();

    if (editingId) {
      updatedMembers = currentMembers.map(m => 
        m.id === editingId 
        ? { 
            ...m, 
            name, phone, tier, status,
            cardNumber: cardNumber || undefined,
            email: email || undefined,
            updatedAt: now
          } 
        : m
      );
    } else {
      const newMember: LoyaltyMember = {
        id: `mem_${now}`,
        name,
        phone,
        cardNumber: cardNumber || undefined,
        email: email || undefined,
        tier,
        pointsBalance: 0,
        status,
        joinDate: new Date().toISOString(),
        createdAt: now,
        updatedAt: now
      };
      updatedMembers = [...currentMembers, newMember];
    }

    db.saveLoyaltyMembers(stationId, updatedMembers);
    loadData();
    setIsModalOpen(false);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery) ||
    (m.cardNumber && m.cardNumber.includes(searchQuery))
  ).sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());

  const getTierColor = (t: string) => {
    switch(t) {
      case 'platinum': return 'bg-slate-800 text-slate-100';
      case 'gold': return 'bg-amber-100 text-amber-800';
      case 'silver': return 'bg-slate-200 text-slate-700';
      default: return 'bg-orange-100 text-orange-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-between items-start items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search members, phone, or card..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          New Member
        </button>
      </div>

      <div className="premium-card border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Member Details</th>
                <th>Contact</th>
                <th>Card No.</th>
                <th>Tier</th>
                <th className="text-right">Points Balance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition">
                  <td>
                    <div className="font-bold text-slate-900">{member.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Joined {new Date(member.joinDate).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div className="text-slate-800 font-medium">{member.phone}</div>
                    {member.email && <div className="text-xs text-slate-500">{member.email}</div>}
                  </td>
                  <td className="font-mono text-slate-600">
                    {member.cardNumber || 'N/A'}
                  </td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getTierColor(member.tier)}`}>
                      {member.tier}
                    </span>
                  </td>
                  <td className="text-right font-mono">
                    {member.pointsBalance.toLocaleString()}
                  </td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      member.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button 
                      onClick={() => handleOpenModal(member)}
                      className="text-rose-600 hover:text-rose-800 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No loyalty members found.
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black font-sans text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-rose-500" />
                {editingId ? 'Edit Member Profile' : 'Register New Member'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loyalty Card Number (Optional)</label>
                  <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono" placeholder="SCAN OR TYPE" />
                </div>

                <div className="border-t border-slate-100 pt-4 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Membership Tier</label>
                  <div className="flex gap-2">
                    {['bronze', 'silver', 'gold', 'platinum'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTier(t as any)}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg border transition uppercase tracking-wider ${
                          tier === t 
                            ? 'bg-rose-50 border-rose-500 text-rose-800'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <div className="flex gap-2">
                    {['active', 'suspended'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s as any)}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg border transition uppercase tracking-wider ${
                          status === s 
                            ? (s === 'active' ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-rose-100 border-rose-500 text-rose-800')
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition">Cancel</button>
              <button onClick={handleSave} className="bg-rose-600 text-white px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-[40px] rounded-lg text-sm font-bold hover:bg-rose-700 transition shadow-md shadow-rose-500/20">
                Save Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
