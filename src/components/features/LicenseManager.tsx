import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ShieldCheck, CheckCircle2, XCircle, Search, Clock, ExternalLink, Users, Calendar, CreditCard, ChevronRight, Play, Square, Edit2, History, Trash2 } from 'lucide-react';
import { dbFS } from '../../lib/firebase';
import { GlobalSettings, Organization } from '../../types';

interface LicenseManagerProps {
  settings: GlobalSettings;
}

type ModalType = 'approve' | 'reject' | 'toggle' | 'addDays' | 'setExpiry' | 'changePlan' | 'delete' | null;

export default function LicenseManager({ settings }: LicenseManagerProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'clients'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Custom Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: ModalType;
    targetOrg?: Organization | null;
    targetReq?: any | null;
    title: string;
    description: string;
    inputPlaceholder?: string;
    inputType?: 'text' | 'number' | 'date' | 'select';
    selectOptions?: string[];
    confirmText: string;
    confirmColor?: string;
  }>({ isOpen: false, type: null, title: '', description: '', confirmText: '' });
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // Fetch Organizations — deduplicate by ownerId, keep newest entry per owner
    const qOrg = query(collection(dbFS, 'organizations'), orderBy('createdAt', 'desc'));
    const unsubscribeOrg = onSnapshot(qOrg, async (snapshot) => {
      const data = snapshot.docs.map(d => ({ orgId: d.id, ...d.data() } as Organization));

      // Deduplicate: for each unique ownerId, keep only the FIRST (newest) entry and delete the rest
      const seenOwners = new Map<string, string>(); // ownerId -> orgId (newest)
      const toDelete: string[] = [];

      for (const org of data) {
        const key = org.ownerId || org.orgId;
        if (seenOwners.has(key)) {
          // This is a duplicate — mark for deletion
          toDelete.push(org.orgId);
        } else {
          seenOwners.set(key, org.orgId);
        }
      }

      // Auto-delete duplicate orgs from Firestore
      for (const dupId of toDelete) {
        deleteDoc(doc(dbFS, 'organizations', dupId)).catch(console.error);
      }

      // Only show non-duplicate orgs
      const validOrgs = data.filter(org => !toDelete.includes(org.orgId));
      setOrganizations(validOrgs);
      setLoading(false);
    });

    // Fetch Requests — deduplicate by orgId, keep only newest per org
    const qReq = query(collection(dbFS, 'subscriptionRequests'), orderBy('createdAt', 'desc'));
    const unsubscribeReq = onSnapshot(qReq, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Deduplicate requests by orgId
      const seenReqOrgs = new Set<string>();
      const validReqs = data.filter(req => {
        const key = req.orgId || req.id;
        if (seenReqOrgs.has(key)) {
          deleteDoc(doc(dbFS, 'subscriptionRequests', req.id)).catch(console.error);
          return false;
        }
        seenReqOrgs.add(key);
        return true;
      });

      setRequests(validReqs);
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


  // ---------------------------------------------------------------------------
  // Action Triggers
  // ---------------------------------------------------------------------------
  const handleApprove = (req: any) => {
    setModalConfig({
      isOpen: true,
      type: 'approve',
      targetReq: req,
      title: 'Approve Subscription',
      description: 'Are you sure you want to approve this subscription and activate 30 days?',
      confirmText: 'Approve',
      confirmColor: 'bg-emerald-600 hover:bg-emerald-700'
    });
    setInputValue('');
  };

  const handleReject = (req: any) => {
    setModalConfig({
      isOpen: true,
      type: 'reject',
      targetReq: req,
      title: 'Reject Subscription',
      description: 'Reason for rejection? (Will be shown to user)',
      inputType: 'text',
      inputPlaceholder: 'e.g. Invalid receipt',
      confirmText: 'Reject',
      confirmColor: 'bg-rose-600 hover:bg-rose-700'
    });
    setInputValue('');
  };

  const handleToggleStatus = (org: Organization) => {
    const isDisabling = org.subscriptionStatus !== 'expired' && org.subscriptionStatus !== 'unpaid';
    setModalConfig({
      isOpen: true,
      type: 'toggle',
      targetOrg: org,
      title: isDisabling ? 'Disable Access' : 'Enable Access',
      description: `Are you sure you want to ${isDisabling ? 'DISABLE' : 'ENABLE'} access for this client?`,
      confirmText: isDisabling ? 'Disable Client' : 'Enable Client',
      confirmColor: isDisabling ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
    });
    setInputValue('');
  };

  const handleManualAddDays = (org: Organization) => {
    setModalConfig({
      isOpen: true,
      type: 'addDays',
      targetOrg: org,
      title: 'Add Free Days',
      description: 'Enter the number of days to add to their current expiry date:',
      inputType: 'number',
      inputPlaceholder: 'e.g. 15',
      confirmText: 'Add Days',
      confirmColor: 'bg-indigo-600 hover:bg-indigo-700'
    });
    setInputValue('');
  };

  const handleSetExactExpiry = (org: Organization) => {
    setModalConfig({
      isOpen: true,
      type: 'setExpiry',
      targetOrg: org,
      title: 'Set Exact Expiry',
      description: 'Select the exact expiry date:',
      inputType: 'date',
      confirmText: 'Update Expiry',
      confirmColor: 'bg-blue-600 hover:bg-blue-700'
    });
    setInputValue(org.expiryDate ? new Date(org.expiryDate).toISOString().split('T')[0] : '');
  };

  const handleChangePlan = (org: Organization) => {
    setModalConfig({
      isOpen: true,
      type: 'changePlan',
      targetOrg: org,
      title: 'Change Plan Tier',
      description: `Current plan is ${org.subscriptionTier}. Select a new plan:`,
      inputType: 'select',
      selectOptions: ['trial', 'basic', 'professional', 'enterprise'],
      confirmText: 'Update Plan',
      confirmColor: 'bg-purple-600 hover:bg-purple-700'
    });
    setInputValue(org.subscriptionTier || '');
  };

  const handleDeleteClient = (org: Organization) => {
    setModalConfig({
      isOpen: true,
      type: 'delete',
      targetOrg: org,
      title: 'Delete Client Data',
      description: `Are you absolutely sure you want to permanently delete ${org.name}? This cannot be undone.`,
      confirmText: 'Delete Forever',
      confirmColor: 'bg-red-600 hover:bg-red-700'
    });
    setInputValue('');
  };


  // ---------------------------------------------------------------------------
  // Modal Confirm Logic
  // ---------------------------------------------------------------------------
  const handleModalConfirm = async () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    const { type, targetReq, targetOrg } = modalConfig;

    try {
      if (type === 'approve' && targetReq) {
        await updateDoc(doc(dbFS, 'subscriptionRequests', targetReq.id), {
          status: 'approved',
          approvedAt: new Date().toISOString()
        });
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);
        await updateDoc(doc(dbFS, 'organizations', targetReq.orgId), {
          subscriptionStatus: 'active',
          subscriptionTier: targetReq.plan,
          expiryDate: newExpiry.toISOString()
        });
      } 
      else if (type === 'reject' && targetReq) {
        if (!inputValue.trim()) return;
        await updateDoc(doc(dbFS, 'subscriptionRequests', targetReq.id), {
          status: 'rejected',
          rejectReason: inputValue,
          rejectedAt: new Date().toISOString()
        });
        await updateDoc(doc(dbFS, 'organizations', targetReq.orgId), {
          subscriptionStatus: 'expired'
        });
      }
      else if (type === 'toggle' && targetOrg) {
        const isDisabling = targetOrg.subscriptionStatus !== 'expired' && targetOrg.subscriptionStatus !== 'unpaid';
        await updateDoc(doc(dbFS, 'organizations', targetOrg.orgId), {
          subscriptionStatus: isDisabling ? 'expired' : 'active'
        });
      }
      else if (type === 'addDays' && targetOrg) {
        const days = parseInt(inputValue, 10);
        if (isNaN(days) || days <= 0) return;
        const currentExpiry = new Date(targetOrg.expiryDate || targetOrg.trialEndDate || new Date());
        currentExpiry.setDate(currentExpiry.getDate() + days);
        await updateDoc(doc(dbFS, 'organizations', targetOrg.orgId), {
          expiryDate: currentExpiry.toISOString(),
          subscriptionStatus: 'active'
        });
      }
      else if (type === 'setExpiry' && targetOrg) {
        if (!inputValue) return;
        const newDate = new Date(inputValue);
        if (isNaN(newDate.getTime())) return;
        await updateDoc(doc(dbFS, 'organizations', targetOrg.orgId), {
          expiryDate: newDate.toISOString(),
          subscriptionStatus: newDate > new Date() ? 'active' : 'expired'
        });
      }
      else if (type === 'changePlan' && targetOrg) {
        if (!inputValue) return;
        await updateDoc(doc(dbFS, 'organizations', targetOrg.orgId), {
          subscriptionTier: inputValue.toLowerCase()
        });
      }
      else if (type === 'delete' && targetOrg) {
        await deleteDoc(doc(dbFS, 'organizations', targetOrg.orgId));
        setSelectedOrg(null);
      }
    } catch (e) {
      console.error(e);
      // Optional: Add a toast notification system here in the future
    }
  };


  // ---------------------------------------------------------------------------
  // Profile Logic
  // ---------------------------------------------------------------------------
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
    if (isNaN(start.getTime())) return 'Unknown';
    const diffDays = Math.ceil((new Date().getTime() - start.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${(diffDays / 365).toFixed(1)} years`;
  };

  const DUMMY_KEYWORDS = ['rahim abdur', 'daniyal khokhar', 'ahmad mujtaba', 'irfan khan'];
  const isDummy = (str?: string) => str ? DUMMY_KEYWORDS.some(k => str.toLowerCase().includes(k)) : false;

  const filteredOrganizations = organizations.filter(o => {
    if (isDummy(o.name)) return false;
    return o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           o.orgId.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col relative">
      {/* Custom Unified Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900">{modalConfig.title}</h3>
              <p className="text-slate-500 text-sm mt-2">{modalConfig.description}</p>
              
              {modalConfig.inputType && modalConfig.inputType !== 'select' && (
                <input
                  type={modalConfig.inputType}
                  placeholder={modalConfig.inputPlaceholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  autoFocus
                />
              )}
              
              {modalConfig.inputType === 'select' && (
                <select
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium capitalize"
                >
                  <option value="">Select an option</option>
                  {modalConfig.selectOptions?.map(opt => (
                    <option key={opt} value={opt} className="capitalize">{opt}</option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleModalConfirm}
                disabled={modalConfig.inputType && !inputValue}
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${modalConfig.confirmColor || 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
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

      <div className="flex items-center justify-between border-b border-slate-200 px-4">
        <div className="flex items-center gap-2">
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
        
        <button
          onClick={async () => {
            const DUMMY_KEYWORDS = ['rahim abdur', 'daniyal khokhar', 'ahmad mujtaba', 'irfan khan', 'test'];
            const isDummy = (str?: string) => str ? DUMMY_KEYWORDS.some(k => str.toLowerCase().includes(k)) : false;
            
            setOrganizations(prev => prev.filter(o => !isDummy(o.name)));
            setRequests(prev => prev.filter(r => !isDummy(r.userEmail)));
            
            let count = 0;
            for (const org of organizations) {
              if (isDummy(org.name)) {
                try {
                  await deleteDoc(doc(dbFS, 'organizations', org.orgId));
                  count++;
                } catch(e: any) {
                  console.error(e);
                  alert("Failed to delete from DB: " + e.message);
                }
              }
            }
            alert(`Filtered from UI! Successfully deleted ${count} entries from database.`);
          }}
          className="px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-lg flex items-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Force Clean Dummy Data
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

                      <button 
                        onClick={() => handleDeleteClient(selectedOrg)}
                        className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 flex items-center gap-3 transition-colors col-span-2"
                      >
                        <Trash2 className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-bold text-sm">Delete Client Data</p>
                          <p className="text-xs opacity-80">Permanently erase this organization</p>
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
