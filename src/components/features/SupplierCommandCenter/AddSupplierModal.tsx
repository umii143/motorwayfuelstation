import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Truck, Phone, MapPin, Mail, Hash, CreditCard } from 'lucide-react';
import { Supplier, GlobalSettings } from '../../../types';
import { t as translate } from '../../../lib/translations';
import { getCurrencySymbol } from '../../../lib/currency';

interface AddSupplierModalProps {
  settings: GlobalSettings;
  onClose: () => void;
  onAdd: (supplier: Supplier) => void;
}

export function AddSupplierModal({ settings, onClose, onAdd }: AddSupplierModalProps) {
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const t = (en: string, ur: string) => translate(en, ur, settings);

  const [name, setName] = useState('');
  const [urduName, setUrduName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [ntn, setNtn] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [supplierType, setSupplierType] = useState<'Fuel Supplier' | 'Lubricant Supplier' | 'CNG Supplier' | 'Service Provider' | 'Other'>('Fuel Supplier');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newSup: Supplier = {
      id: `s_${Date.now()}`,
      name,
      urduName: urduName || name,
      contact,
      email,
      address,
      ntn,
      accountNo: accountNo || 'N/A',
      creditLimit: Number(creditLimit) || 0,
      balance: Number(openingBalance) || 0,
      supplierType,
      status: 'Active',
      supplierSince: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    onAdd(newSup);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/30">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Add New Supplier</h2>
                <p className="text-xs text-slate-400">Register a new vendor in your directory</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <form id="add-supplier-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-2">Basic Information</h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Company Name <span className="text-rose-500">*</span></label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-hidden focus:border-blue-500 transition-colors" placeholder="e.g. Pakistan State Oil" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Company Name (Urdu)</label>
                    <input type="text" value={urduName} onChange={e => setUrduName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-hidden focus:border-blue-500 transition-colors font-urdu" dir="rtl" placeholder="پاکستان سٹیٹ آئل" />
                  </div>
                  <div>
                    { }
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Supplier Type</label>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <select value={supplierType} onChange={e => setSupplierType(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-hidden focus:border-blue-500 transition-colors">
                      <option value="Fuel Supplier">Fuel Supplier</option>
                      <option value="Lubricant Supplier">Lubricant Supplier</option>
                      <option value="CNG Supplier">CNG Supplier</option>
                      <option value="Service Provider">Service Provider</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-2">Contact Details</h3>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Phone / WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="tel" value={contact} onChange={e => setContact(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-hidden focus:border-blue-500 transition-colors" placeholder="0300-1234567" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-hidden focus:border-blue-500 transition-colors" placeholder="info@company.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Business Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-hidden focus:border-blue-500 transition-colors" placeholder="Head Office, Main City" />
                    </div>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-700 pb-2">Financial & Billing</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">NTN / Tax Number</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input type="text" value={ntn} onChange={e => setNtn(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-hidden focus:border-blue-500 transition-colors" placeholder="1234567-8" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Bank IBAN / Account</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input type="text" value={accountNo} onChange={e => setAccountNo(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-hidden focus:border-blue-500 transition-colors" placeholder="PK00 BANK..." />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Credit Limit ({getCurrencySymbol(settings)})</label>
                      <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-hidden focus:border-blue-500 transition-colors font-mono" placeholder="5000000" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Opening Balance ({getCurrencySymbol(settings)})</label>
                      <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-hidden focus:border-blue-500 transition-colors font-mono" placeholder="0" />
                    </div>
                  </div>
                </div>

              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" form="add-supplier-form" className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all">
              Save Supplier
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
