import React, { useState } from 'react';
import { MessageSquare, Phone, Mail, Send, CheckCircle, Users } from 'lucide-react';
import { CommunicationManager } from '../../../services/communication/communicationManager';
import { useStation } from '../../../contexts/StationContext';
import { AutomationEngine } from '../../../services/automationEngine';

export const CommunicationDashboard: React.FC = () => {
  const { customers, shifts, products } = useStation();
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const pendingCustomers = customers.filter(c => c.balance > 0);

  const handleSendEOD = async () => {
    setIsSending(true);
    setStatus(null);
    try {
      const summary = AutomationEngine.generateEodSummary(shifts, products, customers);
      // Fallback number for owner in MVP since there's no dynamic owner phone in store context right now
      const ownerPhone = '03001234567'; 
      
      const success = await CommunicationManager.sendMessage('whatsapp', {
        to: ownerPhone,
        message: summary
      });

      if (success) {
        setStatus('EOD Summary opened in WhatsApp!');
      } else {
        setStatus('Failed to open WhatsApp');
      }
    } catch (err) {
      console.error(err);
      setStatus('Error generating summary');
    } finally {
      setIsSending(false);
    }
  };

  const handleBulkReminders = async () => {
    setIsSending(true);
    setStatus(null);
    try {
      // Create payloads for the first 3 customers just to prevent browser popup blocking limits for MVP
      const payloads = pendingCustomers.slice(0, 3).map(c => ({
        to: c.contact || '00000000000',
        message: `Assalam-o-alaikum ${c.name}, this is a gentle reminder that your pending balance is PKR ${c.balance.toLocaleString()}. Kindly arrange for payment. \n\n⚡ Powered by Umar Ali ⚡`
      }));

      const count = await CommunicationManager.sendBulk('whatsapp', payloads);
      setStatus(`Sent ${count} reminders via WhatsApp`);
    } catch (err) {
      console.error(err);
      setStatus('Failed to send bulk reminders');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-violet-600" />
            Communication Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage outbound notifications, EOD summaries, and credit reminders.</p>
        </div>
      </div>

      {status && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* EOD Summary Card */}
        <div className="premium-card border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
            <Send className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Executive EOD Summary</h2>
          <p className="text-sm text-slate-500 mb-6">
            Generate and send today's net cash, expenses, and sales summary to the owner's WhatsApp automatically.
          </p>
          <button 
            onClick={handleSendEOD}
            disabled={isSending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" /> Send EOD via WhatsApp
          </button>
        </div>

        {/* Bulk Reminders Card */}
        <div className="premium-card border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Bulk Credit Reminders</h2>
          <p className="text-sm text-slate-500 mb-6">
            Send customized WhatsApp payment reminders to all active credit accounts with pending balances.
          </p>
          <div className="flex items-center justify-between mb-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-sm text-slate-600 font-medium">Pending Customers:</span>
            <span className="text-lg font-bold text-slate-800">{pendingCustomers.length}</span>
          </div>
          <button 
            onClick={handleBulkReminders}
            disabled={isSending || pendingCustomers.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" /> Send Reminders (WhatsApp)
          </button>
        </div>

      </div>
    </div>
  );
};

export default CommunicationDashboard;
