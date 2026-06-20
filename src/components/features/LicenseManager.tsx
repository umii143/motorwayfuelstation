import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ShieldCheck, CheckCircle2, XCircle, Search, Clock, ExternalLink, Users, Calendar, CreditCard, ChevronRight, Phone, Play, Square, Edit2, History } from 'lucide-react';
import { dbFS } from '../../lib/firebase';
import { GlobalSettings, Organization } from '../../types';

interface LicenseManagerProps {
  settings: GlobalSettings;
}

export default function LicenseManager({ settings }: LicenseManagerProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'clients'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  useEffect(() => {
    // Fetch Requests
    const qReq = query(collection(dbFS, 'subscriptionRequests'), orderBy('createdAt', 'desc'));
    const unsubscribeReq = onSnapshot(qReq, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(data);
    });

    // Fetch Organizations
    const qOrg = query(collection(dbFS, 'organizations'), orderBy('createdAt', 'desc'));
    const unsubscribeOrg = onSnapshot(qOrg, (snapshot) => {
      const data = snapshot.docs.map(d => ({ orgId: d.id, ...d.data() } as Organization));
      setOrganizations(data);
      setLoading(false);
    });

    return () => {
      unsubscribeReq();
      unsubscribeOrg();
    };
  }, []);

  // Sync selected org if updated
  useEffect(() => {
    if (selectedOrg) {
      const updated = organizations.find(o => o.orgId === selectedOrg.orgId);
      if (updated) setSelectedOrg(updated);
    }
  }, [organizations]);

  const handleApprove = async (req: any) => {
    if (!confirm('Approve this subscription and activate 30 days?')) return;
    
    try {
      await updateDoc(doc(dbFS, 'subscriptionRequests', req.id), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      
      await updateDoc(doc(dbFS, 'organizations', req.orgId), {
        subscriptionStatus: 'active',
        subscriptionTier: req.plan,
        expiryDate: newExpiry.toISOString()
      });
      
      alert('Subscription Approved Successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to approve subscription');
    }
  };

  const handleReject = async (req: any) => {
    const reason = prompt('Reason for rejection? (Will be shown to user)');
    if (reason === null) return;

    try {
      await updateDoc(doc(dbFS, 'subscriptionRequests', req.id), {
        status: 'rejected',
        rejectReason: reason,
        rejectedAt: new Date().toISOString()
      });

      await updateDoc(doc(dbFS, 'organizations', req.orgId), {
        subscriptionStatus: 'expired'
      });
      
      alert('Subscription Rejected');
    } catch (e) {
      console.error(e);
    }
  };

  // Profile specific logic
  const orgRequests = useMemo(() => {
    if (!selectedOrg) return [];
    return requests.filter(r => r.orgId === selectedOrg.orgId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedOrg, requests]);

  const totalSpent = useMemo(() => {
    return orgRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [orgRequests]);

  const purchaseCount = useMemo(() => {
    return orgRequests.filter(r => r.status === 'approved').length;
  }, [orgRequests]);

  const calculateDaysRemaining = (org: Organization) => {
    if (!org.expiryDate && !org.trialEndDate) return 0;
    const end = new Date(org.expiryDate || org.trialEndDate);
    const diff = end.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const getTenure = (org: Organization) => {
    const start = new Date(org.createdAt);
    const diffDays = Math.ceil((new Date().getTime() - start.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${(diffDays / 365).toFixed(1)} years`;
  };

  const handleToggleStatus = async (org: Organization) => {
    const isDisabling = org.subscriptionStatus !== 'expired' && org.subscriptionStatus !== 'unpaid';
    if (!confirm(`Are you sure you want to ${isDisabling ? 'DISABLE' : 'ENABLE'} access for this client?`)) return;

    try {
      await updateDoc(doc(dbFS, 'organizations', org.orgId), {
        subscriptionStatus: isDisabling ? 'expired' : 'active'
      });
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  const handleManualAddDays = async (org: Organization) => {
    const daysStr = prompt('Enter number of days to add:');
    if (!daysStr) return;
    const days = parseInt(daysStr, 10);
    if (isNaN(days) || days <= 0) return;

    try {
      const currentExpiry = new Date(org.expiryDate || org.trialEndDate || new Date());
      currentExpiry.setDate(currentExpiry.getDate() + days);

      await updateDoc(doc(dbFS, 'organizations', org.orgId), {
        expiryDate: currentExpiry.toISOString(),
        subscriptionStatus: 'active'
      });
      alert(`Added ${days} days successfully.`);
    } catch(e) {
      console.error(e);
      alert('Failed to update days');
    }
  };

  const handleSetExactExpiry = async (org: Organization) => {
    const dateStr = prompt('Enter exact expiry date (YYYY-MM-DD):');
    if (!dateStr) return;
    const newDate = new Date(dateStr);
    if (isNaN(newDate.getTime())) {
      alert('Invalid date format');
      return;
    }

    try {
      await updateDoc(doc(dbFS, 'organizations', org.orgId), {
        expiryDate: newDate.toISOString(),
        subscriptionStatus: newDate > new Date() ? 'active' : 'expired'
      });
      alert('Expiry date updated.');
    } catch(e) {
      console.error(e);
      alert('Failed to update expiry date');
    }
  };

  const handleChangePlan = async (org: Organization) => {
    const newPlan = prompt(`Change plan for ${org.name}.\nCurrent: ${org.subscriptionTier}\n\nEnter new plan (basic, professional, enterprise):`);
    if (!newPlan) return;
    const validPlans = ['basic', 'professional', 'enterprise', 'trial'];
    if (!validPlans.includes(newPlan.toLowerCase())) {
      alert('Invalid plan type.');
      return;
    }

    try {
      await updateDoc(doc(dbFS, 'organizations', org.orgId), {
        subscriptionTier: newPlan.toLowerCase()
      });
      alert('Plan updated successfully.');
    } catch (e) {
      console.error(e);
      alert('Failed to change plan.');
    }
  };


  const filteredOrganizations = organizations.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.orgId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div className="flex flex-row items-center justify-between premium-card p-6 border relative overflow-hidden bg-emerald-900 text-white border-emerald-800 shrink-0">
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 text-emerald-100 shadow-lg">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-sans text-2xl font-bold tracking-tight">Super Admin: License Manager</h1>
            <p className="font-sans text-sm text-emerald-200 mt-1">Manage global subscriptions, renewals, and client access.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 px-4">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'requests' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Pending Requests</div>
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'clients' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2"><Users className="w-4 h-4" /> Client Directory</div>
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'requests' ? (
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-y-auto h-full absolute inset-0">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Plan & Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Receipt</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading requests...</td></tr>
                ) : requests.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">No subscription requests found.</td></tr>
                ) : requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString()}<br/>
                      <span className="text-xs">{new Date(req.createdAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{req.userEmail}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{req.orgId}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 capitalize">{req.plan}</div>
                      <div className="text-xs text-emerald-600 font-bold mt-0.5">Rs. {req.amount?.toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs capitalize">
                        {req.paymentMethod}
                      </div>
                    </td>
                    <td className="p-4">
                      {req.receiptUrl ? (
                        <a href={req.receiptUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs">
                          <ExternalLink className="h-4 w-4" /> View Receipt
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-xs">No Receipt</span>
                      )}
                    </td>
                    <td className="p-4">
                      {req.status === 'pending' && <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-md text-xs font-bold w-max"><Clock className="h-3 w-3" /> Pending</span>}
                      {req.status === 'approved' && <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold w-max"><CheckCircle2 className="h-3 w-3" /> Approved</span>}
                      {req.status === 'rejected' && <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs font-bold w-max"><XCircle className="h-3 w-3" /> Rejected</span>}
                    </td>
                    <td className="p-4">
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleApprove(req)} className="p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors" title="Approve">
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleReject(req)} className="p-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition-colors" title="Reject">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-full gap-4 absolute inset-0">
            {/* Client Directory List */}
            <div className={`bg-white rounded-[24px] border border-slate-200 shadow-sm flex flex-col transition-all duration-300 ${selectedOrg ? 'w-1/2' : 'w-full'}`}>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-[24px]">
                <div className="relative w-64 group">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search clients..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                      <th className="p-4">Client</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loading ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading clients...</td></tr>
                    ) : filteredOrganizations.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">No clients found.</td></tr>
                    ) : filteredOrganizations.map((org) => {
                      const days = calculateDaysRemaining(org);
                      const isExpired = days === 0 || org.subscriptionStatus === 'expired';
                      return (
                        <tr 
                          key={org.orgId} 
                          onClick={() => setSelectedOrg(org)}
                          className={`hover:bg-indigo-50/50 transition-colors cursor-pointer ${selectedOrg?.orgId === org.orgId ? 'bg-indigo-50 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}
                        >
                          <td className="p-4">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {org.name}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[150px]">{org.orgId}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900 capitalize">{org.subscriptionTier}</div>
                            <div className={`text-xs font-bold mt-0.5 ${isExpired ? 'text-red-500' : 'text-emerald-600'}`}>
                              {days} days left
                            </div>
                          </td>
                          <td className="p-4">
                            {isExpired ? (
                              <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-[10px] font-bold w-max uppercase tracking-wider">Expired</span>
                            ) : (
                              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-bold w-max uppercase tracking-wider">Active</span>
                            )}
                          </td>
                          <td className="p-4">
                            <ChevronRight className={`w-4 h-4 transition-colors ${selectedOrg?.orgId === org.orgId ? 'text-indigo-500' : 'text-slate-300'}`} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Client Profile Panel */}
            {selectedOrg && (
              <div className="w-1/2 bg-white rounded-[24px] border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-right-4">
                <div className="bg-slate-900 p-6 text-white shrink-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold">{selectedOrg.name}</h2>
                      <p className="text-slate-400 font-mono text-sm mt-1">{selectedOrg.orgId}</p>
                    </div>
                    <div className="bg-white/10 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 backdrop-blur-sm">
                      <Calendar className="w-4 h-4" />
                      Client for {getTenure(selectedOrg)}
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Purchases</p>
                      <p className="text-lg font-bold">{purchaseCount}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Spent</p>
                      <p className="text-lg font-bold text-emerald-400">Rs. {totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
                      <p className={`text-lg font-bold capitalize ${calculateDaysRemaining(selectedOrg) === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {calculateDaysRemaining(selectedOrg) > 0 ? 'Active' : 'Expired'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Subscription Advanced Controls */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" /> Subscription Overrides
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleToggleStatus(selectedOrg)}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                          selectedOrg.subscriptionStatus === 'expired' 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                          : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {selectedOrg.subscriptionStatus === 'expired' ? <Play className="w-5 h-5 fill-emerald-700" /> : <Square className="w-5 h-5 fill-rose-700" />}
                        <div className="text-left">
                          <p className="font-bold text-sm">{selectedOrg.subscriptionStatus === 'expired' ? 'Enable Access' : 'Revoke Access'}</p>
                          <p className="text-xs opacity-80">Instant toggle</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleManualAddDays(selectedOrg)}
                        className="p-3 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-3 transition-colors"
                      >
                        <Calendar className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-bold text-sm">Add Free Days</p>
                          <p className="text-xs opacity-80">Extend expiry</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleSetExactExpiry(selectedOrg)}
                        className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-3 transition-colors"
                      >
                        <Clock className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-bold text-sm">Set Exact Expiry</p>
                          <p className="text-xs opacity-80">Manual override</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleChangePlan(selectedOrg)}
                        className="p-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-3 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-bold text-sm">Change Plan Tier</p>
                          <p className="text-xs opacity-80">Current: {selectedOrg.subscriptionTier}</p>
                        </div>
                      </button>
                    </div>
                  </section>

                  {/* Client Info */}
                  <section>
                     <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" /> Client Contact Info
                    </h3>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-sm">
                       <div className="flex items-center justify-between">
                         <span className="text-slate-500 font-medium">Owner Email</span>
                         <span className="font-bold text-slate-900">{orgRequests.find(r => r.userEmail)?.userEmail || 'N/A'}</span>
                       </div>
                       <div className="flex items-center justify-between">
                         <span className="text-slate-500 font-medium">Phone Number</span>
                         <span className="font-bold text-slate-900">{selectedOrg.phone || 'Not Provided'}</span>
                       </div>
                    </div>
                  </section>

                  {/* Purchase History */}
                  <section>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-400" /> Purchase History
                    </h3>
                    {orgRequests.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">No purchase history found for this client.</p>
                    ) : (
                      <div className="space-y-3">
                        {orgRequests.map(req => (
                          <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : req.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-900">{req.plan} Subscription</p>
                                <p className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()} • {req.paymentMethod}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-900">Rs. {req.amount?.toLocaleString() || 0}</p>
                              <p className={`text-[10px] font-bold uppercase tracking-wider ${req.status === 'approved' ? 'text-emerald-600' : req.status === 'rejected' ? 'text-rose-600' : 'text-orange-600'}`}>
                                {req.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
