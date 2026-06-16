import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ShieldCheck, CheckCircle2, XCircle, Search, Clock, ExternalLink } from 'lucide-react';
import { dbFS } from '../../lib/firebase';
import { GlobalSettings } from '../../types';

interface LicenseManagerProps {
  settings: GlobalSettings;
}

export default function LicenseManager({ settings }: LicenseManagerProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(dbFS, 'subscriptionRequests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (req: any) => {
    if (!confirm('Approve this subscription and activate 30 days?')) return;
    
    try {
      // Set Request to Approved
      await updateDoc(doc(dbFS, 'subscriptionRequests', req.id), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      // Update Organization
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

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-row items-center justify-between premium-card p-6 border relative overflow-hidden bg-emerald-900 text-white border-emerald-800">
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 text-emerald-100 shadow-lg">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-sans text-2xl font-bold tracking-tight">Super Admin: License Manager</h1>
            <p className="font-sans text-sm text-emerald-200 mt-1">Review and approve manual payment receipts.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
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
      </div>
    </div>
  );
}
