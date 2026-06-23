import React, { useState } from 'react';
import { Product, Tank, RateHistoryEntry, GlobalSettings } from '../../../types';
import AdvancedPriceManagement from './AdvancedPriceManagement';
import RateWizard from '../Settings/RateWizard';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface PriceManagementProps {
  products: Product[];
  tanks: Tank[];
  rateHistory: RateHistoryEntry[];
  language: string;
  settings: GlobalSettings;
   
  onUpdateProductRate: (productId: string, newRate: number, reason?: string, changedBy?: string, dateStr?: string, orgId?: string, stationId?: string, checkPerm?: unknown, attachments?: unknown[]) => void;
  onLogAudit: (category: string, action: string, details: string) => void;
  onUpdateProducts?: (products: Product[]) => void;
}

export default function PriceManagement(props: PriceManagementProps) {
  const [isUpdateDrawerOpen, setIsUpdateDrawerOpen] = useState(false);

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full">
      {/* Advanced Dashboard View */}
      <AdvancedPriceManagement 
        products={props.products} 
        rateHistory={props.rateHistory} 
        settings={props.settings}
        onOpenUpdateDrawer={() => setIsUpdateDrawerOpen(true)}
      />

      {/* Overlay Drawer for RateWizard */}
      <AnimatePresence>
        {isUpdateDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setIsUpdateDrawerOpen(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-4xl bg-slate-50 dark:bg-[#0B1120] z-[101] shadow-2xl overflow-y-auto border-l border-slate-200 dark:border-slate-800"
            >
              <div className="sticky top-0 z-10 flex justify-between items-center p-6 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Update Prices & Rates</h2>
                <button 
                  onClick={() => setIsUpdateDrawerOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <RateWizard
                  products={props.products}
                  tanks={props.tanks}
                  rateHistory={props.rateHistory}
                  language={props.language}
                  settings={props.settings}
                  onUpdateProductRate={props.onUpdateProductRate}
                  onLogAudit={props.onLogAudit}
                  onUpdateProducts={props.onUpdateProducts}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
