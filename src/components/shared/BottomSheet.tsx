import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { haptic } from '../../utils/haptics';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  snapPoints?: string[]; // e.g., ['50vh', '90vh']
  allowFullscreen?: boolean;
  desktopMode?: 'hidden' | 'modal';
  maxWidth?: string; // For desktop modal width, e.g. 'max-w-md'
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  snapPoints = ['90vh'],
  allowFullscreen = true,
  desktopMode = 'hidden',
  maxWidth = 'max-w-md'
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controls = useAnimation();
  const y = useRef(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(media.matches);
    const listener = () => setIsDesktop(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (isOpen) {
      haptic.light();
      controls.start('visible');
      document.body.style.overflow = 'hidden';
    } else {
      setIsFullscreen(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, controls]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldClose = info.velocity.y > 20 || (info.velocity.y >= 0 && info.point.y > window.innerHeight * 0.7);
    
    if (shouldClose) {
      onClose();
    }
  };

  const variants: any = {
    hidden: { y: '100%' },
    visible: { 
      y: 0, 
      height: isFullscreen ? '100dvh' : snapPoints[snapPoints.length - 1],
      transition: { type: 'spring', damping: 25, stiffness: 200 }
    }
  };

  if (isDesktop && desktopMode === 'hidden') return null;

  if (isDesktop && desktopMode === 'modal') {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full ${maxWidth} rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90dvh]`}
            >
              {title && (
                <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
                  <h2 className="font-sans text-lg font-bold text-slate-950">{title}</h2>
                  <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              <div className="p-6 overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants}
            className={`fixed bottom-0 left-0 right-0 z-[70] bg-[var(--bg-app)] lg:hidden flex flex-col ${isFullscreen ? 'rounded-none' : 'rounded-t-3xl shadow-2xl mt-10'}`}
            style={{ 
              maxHeight: isFullscreen ? '100dvh' : snapPoints[snapPoints.length - 1], 
              height: isFullscreen ? '100dvh' : snapPoints[snapPoints.length - 1] 
            }}
          >
            {/* Drag Handle */}
            {!isFullscreen && (
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing w-full touch-none">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className={`flex items-center justify-between px-5 pb-3 border-b border-[var(--border-main)] ${isFullscreen ? 'pt-safe-top mt-4' : ''}`}>
                <h3 className="font-bold text-lg text-[var(--text-main)]">{title}</h3>
                <div className="flex items-center gap-2">
                  {allowFullscreen && (
                    <button 
                      onClick={() => setIsFullscreen(!isFullscreen)} 
                      className="p-1.5 rounded-full hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  )}
                  <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors bg-[var(--bg-card)]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className={`overflow-y-auto p-5 pb-safe flex-1 ${!title && isFullscreen ? 'pt-safe-top mt-4' : ''}`}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
