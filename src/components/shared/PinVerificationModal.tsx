import React, { useState, useEffect } from 'react';
import { Lock, X, ShieldCheck, Delete } from 'lucide-react';
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
  const [successAnim, setSuccessAnim] = useState(false);
  const verifyPin = useAuthStore(state => state.verifyPin);

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setError(false);
      setSuccessAnim(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || successAnim) return;
      if (e.key === 'Backspace') {
        setPin(p => p.slice(0, -1));
        setError(false);
      } else if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 4) {
          setPin(p => p + e.key);
          setError(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, successAnim]);

  useEffect(() => {
    if (pin.length === 4) {
      // Auto submit
      if (verifyPin(pin)) {
        setError(false);
        setSuccessAnim(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
        }, 500);
      }
    }
  }, [pin, verifyPin, onSuccess, onClose]);

  const handlePadClick = (num: string) => {
    if (successAnim) return;
    if (num === 'del') {
      setPin(p => p.slice(0, -1));
      setError(false);
    } else if (pin.length < 4) {
      setPin(p => p + num);
      setError(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
        
        <motion.div 
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ 
            scale: 1, 
            y: 0, 
            opacity: 1,
            x: error ? [-10, 10, -10, 10, 0] : 0
          }}
          transition={{ 
            type: "spring", 
            duration: error ? 0.4 : 0.6,
            bounce: 0.4
          }}
          className="relative bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-[2.5rem] p-8 w-full max-w-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden"
        >
          {/* Background glow */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-3xl opacity-20 pointer-events-none transition-colors duration-500 ${successAnim ? 'bg-emerald-500' : error ? 'bg-rose-500' : 'bg-indigo-500'}`} />

          <button
            onClick={onClose}
            className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center relative z-10">
            <motion.div 
              animate={{ 
                scale: successAnim ? [1, 1.2, 1] : 1,
                rotateY: successAnim ? 360 : 0 
              }}
              transition={{ duration: 0.6 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-colors duration-500 ${
                successAnim 
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                  : error 
                    ? 'bg-gradient-to-br from-rose-400 to-rose-600'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}
            >
              {successAnim ? (
                <ShieldCheck className="w-8 h-8 text-white drop-shadow-md" />
              ) : (
                <Lock className="w-8 h-8 text-white drop-shadow-md" />
              )}
            </motion.div>
            
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
              {successAnim ? 'Authorized' : 'Security Check'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-[240px] mx-auto leading-relaxed">
              {actionDescription}
            </p>

            {/* PIN Dots */}
            <div className="flex gap-4 mb-10">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: pin.length > i ? [1, 1.2, 1] : 1,
                    y: pin.length > i ? [0, -5, 0] : 0
                  }}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    pin.length > i 
                      ? successAnim 
                        ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                        : error
                          ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                          : 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]'
                      : 'bg-slate-200 dark:bg-slate-700 shadow-inner'
                  }`}
                />
              ))}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full px-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <motion.button
                  key={num}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePadClick(num.toString())}
                  className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 flex items-center justify-center text-2xl font-medium text-slate-700 dark:text-slate-200 mx-auto transition-colors shadow-sm"
                >
                  {num}
                </motion.button>
              ))}
              <div />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePadClick('0')}
                className="w-16 h-16 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 flex items-center justify-center text-2xl font-medium text-slate-700 dark:text-slate-200 mx-auto transition-colors shadow-sm"
              >
                0
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePadClick('del')}
                className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mx-auto transition-colors"
              >
                <Delete className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
