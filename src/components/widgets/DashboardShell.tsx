import React, { useEffect, useState } from 'react';
import { Fuel, Edit3, Save } from 'lucide-react';
import { useWidgetEngine } from '../../store/useWidgetEngine';
import { CORE_WIDGETS, DEFAULT_OWNER_LAYOUT } from './registry';
import { DashboardCanvas } from './DashboardCanvas';
import { WidgetStudioDrawer } from './WidgetStudioDrawer';
import { useStation } from '../../contexts/StationContext';

export function DashboardShell({ onStartShiftQuick, onNavigate }: { onStartShiftQuick?: () => void, onNavigate?: (path: string) => void }) {
  const { registerWidget, setActiveLayout, activeLayout, isEditMode, setEditMode } = useWidgetEngine();
  const { shifts } = useStation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const activeShift = shifts.find(s => s.status === 'active');

  useEffect(() => {
    // 1. Register Core Widgets
    CORE_WIDGETS.forEach(manifest => {
      registerWidget(manifest);
    });

    // 2. Load User Layout (Mock loading from DB)
    // In a real app, this would fetch from indexedDB/Firebase based on User ID/Role
    if (!activeLayout) {
      setActiveLayout(DEFAULT_OWNER_LAYOUT);
    }
  }, []);

  const toggleEditMode = () => {
    if (isEditMode) {
      setEditMode(false);
      setIsDrawerOpen(false);
      // Here you would also persist the layout to IndexedDB
    } else {
      setEditMode(true);
      setIsDrawerOpen(true);
    }
  };

  const themeWrap = "min-h-screen bg-[#020617] text-slate-100 font-sans overflow-x-hidden pb-32 relative transition-colors duration-500";

  return (
    <div className={themeWrap}>
      
      {/* DYNAMIC AMBIENT BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#F97316]/10 rounded-full blur-[160px] mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[140px] mix-blend-screen"></div>
      </div>

      <div className="px-6 py-6 relative z-10 max-w-[1600px] mx-auto space-y-6">
        
        {/* HEADER COMMAND CENTER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_30px_rgba(249,115,22,0.3)]">
              <Fuel className="w-7 h-7 text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-tight">Command Center</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {activeLayout?.name || 'Loading Profile...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!activeShift && (
              <button onClick={onStartShiftQuick} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold border border-orange-500 hover:border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all">
                Start Shift
              </button>
            )}
            <button onClick={() => onNavigate?.('shift_logs')} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 transition-colors">
              Shift Logs
            </button>
            <button 
              onClick={toggleEditMode}
              className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                isEditMode 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isEditMode ? (
                <>
                  <Save className="w-4 h-4" /> Save Layout
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" /> Customize Dashboard
                </>
              )}
            </button>
          </div>
        </header>

        {/* WIDGET ENGINE CANVAS */}
        <DashboardCanvas />

      </div>

      {/* WIDGET STUDIO DRAWER */}
      <WidgetStudioDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />

    </div>
  );
}
