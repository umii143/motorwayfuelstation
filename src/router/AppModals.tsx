import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';
import { PoweredByUmarAli } from '../components/shared/PoweredByUmarAli';
import { Toaster } from 'react-hot-toast';

const SmartSuggestions = React.lazy(() => import('../components/shared/SmartSuggestions').then(m => ({ default: m.SmartSuggestions })));
const AIAssistant = React.lazy(() => import('../components/features/AIAssistant/AIAssistant'));

export const AppModals = ({ 
  toast, 
  confirmDialog, 
  settings, 
  shifts, 
  products, 
  customers, 
  tanks, 
  nozzles, 
  staff 
}: any) => {
  return (
    <>
      {/* Premium Global Toast Popup Container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 w-[calc(100%-2rem)] sm:w-full sm:max-w-sm z-55 pointer-events-none">
        <AnimatePresence>
          {toast?.visible && (
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`pointer-events-auto relative w-full overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
                toast.type === 'success' 
                  ? 'border-emerald-500/30 bg-[var(--bg-card)]/90 shadow-emerald-500/10'
                  : toast.type === 'error'
                    ? 'border-rose-500/30 bg-[var(--bg-card)]/90 shadow-rose-500/10'
                    : 'border-[var(--border-main)]/60 bg-[var(--bg-card)]/90 shadow-slate-950/10'
              }`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                toast.type === 'success' 
                  ? 'bg-emerald-500'
                  : toast.type === 'error'
                    ? 'bg-rose-500'
                    : 'bg-[var(--primary-accent)]'
              }`} />

              <div className="flex items-start gap-3 mt-1">
                <div className="mt-0.5 shrink-0">
                  {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {toast.type === 'error' && <XCircle className="h-5 w-5 text-rose-500" />}
                  {toast.type === 'info' && <Info className="h-5 w-5 text-[var(--primary-accent)]" />}
                </div>
                <div className="flex-1">
                  <p className="font-sans text-xs font-bold text-[var(--text-main)] leading-relaxed">
                    {toast.message}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border-main)]/40 pt-2 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    <span>
                      {toast.type === 'error' 
                        ? (settings?.language === 'ur' ? 'انتباہ / خرابی' : 'Error / Alert') 
                        : (settings?.language === 'ur' ? 'کامیابی سے مکمل ہوا' : 'Successfully processed')}
                    </span>
                    <PoweredByUmarAli variant="compact" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium Global Confirmation / Alert Modal */}
      <AnimatePresence>
        {confirmDialog?.visible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={confirmDialog.isAlert ? undefined : confirmDialog.onCancel}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)]/95 backdrop-blur-md p-6 shadow-2xl z-10"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                confirmDialog.isAlert ? 'bg-[var(--primary-accent)]' : 'bg-rose-500'
              }`} />

              <div className="flex items-start gap-4 mt-2">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  confirmDialog.isAlert 
                    ? 'bg-[var(--primary-accent)]/10 text-[var(--primary-accent)]' 
                    : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {confirmDialog.isAlert ? <Info className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-sans text-sm font-black text-[var(--text-main)] uppercase tracking-wider">
                    {confirmDialog.title}
                  </h3>
                  <p className="mt-2 font-sans text-xs font-semibold text-[var(--text-muted)] leading-relaxed">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-[var(--border-main)]/60 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="font-mono text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center justify-center w-full sm:w-auto mb-2 sm:mb-0">
                  <PoweredByUmarAli variant="compact" />
                </div>
                
                <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                  {!confirmDialog.isAlert && (
                    <button
                      type="button"
                      onClick={confirmDialog.onCancel}
                      className="flex-1 sm:flex-none text-center rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] px-4 py-2 font-sans text-xs font-bold text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                      {confirmDialog.cancelText || (settings?.language === 'ur' ? 'منسوخ کریں' : 'Cancel')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={confirmDialog.onConfirm}
                    className={`flex-1 sm:flex-none text-center rounded-lg px-5 py-2 font-sans text-xs font-bold text-white transition-colors cursor-pointer shadow-md ${
                      confirmDialog.isAlert
                        ? 'bg-[var(--primary-accent)] hover:bg-[var(--primary-hover)] shadow-[var(--primary-accent)]/10'
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10'
                    }`}
                  >
                    {confirmDialog.confirmText || (confirmDialog.isAlert ? (settings?.language === 'ur' ? 'ٹھیک ہے' : 'OK') : (settings?.language === 'ur' ? 'تصدیق کریں' : 'Confirm'))}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <React.Suspense fallback={null}>
        <SmartSuggestions />
      </React.Suspense>

      <React.Suspense fallback={null}>
        <AIAssistant
          settings={settings}
          shifts={shifts}
          products={products}
          customers={customers}
          tanks={tanks}
          nozzles={nozzles}
          staff={staff}
        />
      </React.Suspense>

      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-main)',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif'
          },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
        }} 
      />
    </>
  );
};
