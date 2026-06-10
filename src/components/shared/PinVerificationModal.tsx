import React, { useState } from 'react';
import { Lock, X, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { motion, AnimatePresence } from 'motion/react';

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionDescription: string;
}

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionDescription
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const verifyPin = useAuthStore(state => state.verifyPin);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPin(pin)) {
      setError(false);
      setPin('');
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPin('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">Security Verification</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Enter Owner PIN to authorize: <br />
            <strong className="text-[var(--text-main)]">{actionDescription}</strong>
          </p>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-4">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/[^0-9]/g, ''));
                  setError(false);
                }}
                className={`w-full text-center tracking-[1em] font-mono text-2xl p-3 border rounded-xl bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 ${
                  error ? 'border-red-500 focus:ring-red-500/20' : 'border-[var(--border-main)] focus:ring-violet-500/20 focus:border-violet-500'
                }`}
                placeholder="••••"
                autoFocus
              />
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-1.5 mt-2 text-red-500 text-sm"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Incorrect PIN. Try again.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={pin.length < 4}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify & Proceed
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
