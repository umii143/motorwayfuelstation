import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Phone, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';
import { useWhatsAppShare } from '../../hooks/useWhatsAppShare';
import { WhatsAppContactPicker, WhatsAppContact } from './WhatsAppContactPicker';
import { WhatsAppTemplateType, getWhatsAppTemplate } from '../../utils/whatsappTemplates';
import { normalizePakistanPhoneNumber, formatPhoneForDisplay } from '../../utils/whatsappShare';
import { pdf } from '@react-pdf/renderer';

interface WhatsAppShareModalProps {
  hook: ReturnType<typeof useWhatsAppShare>;
  customers?: any[];
  suppliers?: any[];
  staff?: any[];
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  hook,
  customers = [],
  suppliers = [],
  staff = []
}) => {
  const { shareState, closeShareModal, executeShare } = hook;
  
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [manualPhone, setManualPhone] = useState('');
  const [format, setFormat] = useState<'text' | 'pdf' | 'both'>('both');
  const [isBusiness, setIsBusiness] = useState(false);

  // Template comes from the share state's initial trigger
  const templateType = shareState.documentType;

  // Derive target phone
  const targetPhone = useMemo(() => {
    if (selectedContact) return selectedContact.phone;
    return manualPhone;
  }, [selectedContact, manualPhone]);

  // Preview Message
  const previewMessage = useMemo(() => {
    return getWhatsAppTemplate(templateType, {
      ...shareState.documentData,
      pdfUrl: format !== 'text' ? 'https://app.shiftwizard.com/files/temp_doc.pdf' : undefined
    });
  }, [templateType, shareState.documentData, format]);

  // Validation
  const isValidPhone = useMemo(() => {
    try {
      if (!targetPhone) return false;
      normalizePakistanPhoneNumber(targetPhone);
      return true;
    } catch (err) {
      return false;
    }
  }, [targetPhone]);

  const handleShare = async () => {
    if (!isValidPhone) return;

    let blobToShare = shareState.pdfBlob;

    if (format !== 'text' && shareState.pdfDocument && !blobToShare) {
      // Generate the blob on demand
      try {
        const asPdf = pdf(shareState.pdfDocument);
        blobToShare = await asPdf.toBlob();
        
        // Update the state with generated blob so the hook can use it
        shareState.pdfBlob = blobToShare;
        shareState.pdfFileName = shareState.pdfFileName || 'Document.pdf';
      } catch (err) {
        console.error("Failed to generate PDF blob", err);
      }
    }

    await executeShare(targetPhone, templateType, format, isBusiness);
  };

  if (!shareState.isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 10, opacity: 0 }}
          className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#25D366]/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#25D366] text-white rounded-full">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Share via WhatsApp</h2>
                <p className="text-xs text-slate-500 font-medium">Instantly send documents & reports</p>
              </div>
            </div>
            <button
              onClick={closeShareModal}
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Configuration */}
              <div className="space-y-6">
                
                {/* Contact Picker */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    Recipient
                  </h3>
                  <WhatsAppContactPicker
                    customers={customers}
                    suppliers={suppliers}
                    staff={staff}
                    selectedContact={selectedContact}
                    onSelect={(c) => { setSelectedContact(c); setManualPhone(''); }}
                    manualPhone={manualPhone}
                    onManualPhoneChange={(p) => { setManualPhone(p); setSelectedContact(null); }}
                  />
                  {targetPhone && !isValidPhone && (
                    <p className="text-xs text-red-500 mt-2 font-medium">Invalid Pakistan phone number format.</p>
                  )}
                  {isValidPhone && (
                    <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Validated: {formatPhoneForDisplay(targetPhone)}
                    </p>
                  )}
                </div>

                {/* Format Selection */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Share Format
                  </h3>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input 
                        type="radio" 
                        name="format" 
                        checked={format === 'text'} 
                        onChange={() => setFormat('text')}
                        className="accent-green-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium text-slate-700">Text Summary Only</span>
                    </label>
                    <label className={`flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${!(shareState.pdfBlob || shareState.pdfDocument) ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input 
                        type="radio" 
                        name="format" 
                        checked={format === 'both'} 
                        onChange={() => setFormat('both')}
                        className="accent-green-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium text-slate-700">Text + PDF Attachment</span>
                    </label>
                  </div>
                </div>

                {/* App Type Selection */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isBusiness} 
                      onChange={(e) => setIsBusiness(e.target.checked)}
                      className="accent-[#25D366] w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">Open in WhatsApp Business</span>
                  </label>
                </div>

              </div>

              {/* Right Column: Preview */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Live Preview</h3>
                <div className="bg-[#E5DDD5] rounded-xl p-4 h-full min-h-[300px] border border-slate-200 relative shadow-inner">
                  {/* Mock WhatsApp Message Bubble */}
                  <div className="bg-[#DCF8C6] rounded-lg p-3 text-sm text-slate-800 shadow-xs relative max-w-[90%] whitespace-pre-wrap font-sans leading-relaxed">
                    {previewMessage}
                    <div className="text-[10px] text-slate-500 text-right mt-1.5 font-medium">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-100 bg-slate-50 p-4 flex justify-end gap-3 rounded-b-xl">
            <button
              onClick={closeShareModal}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={!isValidPhone}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#25D366] rounded-lg hover:bg-[#1DA851] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Send via WhatsApp
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
