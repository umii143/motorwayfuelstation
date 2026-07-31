import React, { useState, useMemo } from 'react';
import { Search, User, Briefcase, Truck } from 'lucide-react';
import { Customer, Supplier, Staff } from '../../types';

export type ContactType = 'customer' | 'supplier' | 'staff' | 'manual';

export interface WhatsAppContact {
 id: string;
 name: string;
 phone: string;
 type: ContactType;
}

interface WhatsAppContactPickerProps {
 customers: Customer[];
 suppliers: Supplier[];
 staff: Staff[];
 selectedContact: WhatsAppContact | null;
 onSelect: (contact: WhatsAppContact) => void;
 manualPhone: string;
 onManualPhoneChange: (phone: string) => void;
}

export const WhatsAppContactPicker: React.FC<WhatsAppContactPickerProps> = ({
 customers,
 suppliers,
 staff,
 selectedContact,
 onSelect,
 manualPhone,
 onManualPhoneChange
}) => {
 const [searchTerm, setSearchTerm] = useState('');
 const [activeTab, setActiveTab] = useState<ContactType>('customer');

 const getIcon = (type: ContactType) => {
 switch (type) {
 case 'customer': return <User className="w-4 h-4" />;
 case 'supplier': return <Truck className="w-4 h-4" />;
 case 'staff': return <Briefcase className="w-4 h-4" />;
 default: return <User className="w-4 h-4" />;
 }
 };

 const filteredContacts = useMemo(() => {
 let list: WhatsAppContact[] = [];
 
 if (activeTab === 'customer') {
 list = customers.filter(c => c.contact).map(c => ({ id: c.id, name: c.name, phone: c.contact!, type: 'customer' }));
 } else if (activeTab === 'supplier') {
 list = suppliers.filter(s => s.contact).map(s => ({ id: s.id, name: s.name, phone: s.contact!, type: 'supplier' }));
 } else if (activeTab === 'staff') {
 list = staff.filter(s => s.phone).map(s => ({ id: s.id, name: s.name, phone: s.phone!, type: 'staff' }));
 }

 if (searchTerm) {
 const lower = searchTerm.toLowerCase();
 list = list.filter(c => c.name.toLowerCase().includes(lower) || c.phone.includes(lower));
 }

 return list;
 }, [customers, suppliers, staff, activeTab, searchTerm]);

 return (
 <div className="space-y-4">
 {/* Tabs */}
 <div className="flex border-b border-border">
 <button
 type="button"
 onClick={() => setActiveTab('customer')}
 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors${
 activeTab === 'customer' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'
 }`}
 >
 Customers
 </button>
 <button
 type="button"
 onClick={() => setActiveTab('supplier')}
 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors${
 activeTab === 'supplier' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'
 }`}
 >
 Suppliers
 </button>
 <button
 type="button"
 onClick={() => setActiveTab('staff')}
 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors${
 activeTab === 'staff' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'
 }`}
 >
 Staff
 </button>
 <button
 type="button"
 onClick={() => setActiveTab('manual')}
 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors${
 activeTab === 'manual' ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'
 }`}
 >
 Manual
 </button>
 </div>

 {/* Content */}
 {activeTab !== 'manual' ? (
 <div className="space-y-3">
 <div className="relative">
 <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 placeholder={`Search ${activeTab}s...`}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:ring-1 focus:ring-green-500 outline-none"
 />
 </div>
 <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
 {filteredContacts.length === 0 ? (
 <div className="p-4 text-center text-muted-foreground text-sm">
 No contacts found with a registered phone number.
 </div>
 ) : (
 filteredContacts.map(contact => (
 <div
 key={contact.id}
 onClick={() => onSelect(contact)}
 className={`p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors${
 selectedContact?.id === contact.id ? 'bg-green-50 border-l-2 border-green-500' : ''
 }`}
 >
 <div className="flex items-center gap-3">
 <div className="p-1.5 bg-muted rounded-full text-muted-foreground">
 {getIcon(contact.type)}
 </div>
 <div>
 <div className="text-sm font-medium text-foreground">{contact.name}</div>
 <div className="text-xs text-muted-foreground">{contact.phone}</div>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 ) : (
 <div className="space-y-2">
 <label className="block text-sm font-medium text-foreground">Phone Number</label>
 <input
 type="text"
 placeholder="e.g. 03001234567 or 923001234567"
 value={manualPhone}
 onChange={(e) => onManualPhoneChange(e.target.value)}
 className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-1 focus:ring-green-500 outline-none"
 />
 <p className="text-xs text-muted-foreground">Enter a valid 11 or 12 digit Pakistan mobile number.</p>
 </div>
 )}
 </div>
 );
};
