import React, { useState } from 'react';
import { X, LayoutTemplate, Plus, Shield, Search } from 'lucide-react';
import { useWidgetEngine } from '../../stores/useWidgetEngine';

interface WidgetStudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WidgetStudioDrawer({ isOpen, onClose }: WidgetStudioDrawerProps) {
  const { manifests, addWidget } = useWidgetEngine();
  const [activeTab, setActiveTab] = useState<'available' | 'installed' | 'recommended' | 'favorites'>('available');
  const [searchQuery, setSearchQuery] = useState('');

  const liquidGlass = "relative overflow-hidden backdrop-blur-[30px] saturate-[150%] bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-l border-white/10 shadow-[inset_1px_0_0_rgba(255,255,255,0.1),-20px_0_80px_rgba(0,0,0,0.6)]";

  const allManifests = Object.values(manifests);
  
  // Filter based on search and tab (for now, just search)
  const filteredWidgets = allManifests.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddWidget = (manifestId: string) => {
    // Add to bottom of the grid
    addWidget(manifestId, 0, 999);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" onClick={onClose} />
      
      <div className={`fixed top-0 right-0 h-full w-[400px] max-w-full ${liquidGlass} z-[101] flex flex-col`}>
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-indigo-400" />
              Widget Studio
            </h2>
            <div className="text-xs font-medium text-slate-400 mt-1">Customize your operating system</div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="px-6 pt-4 border-b border-white/10 bg-white/[0.02]">
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-[-1px]">
            {['available', 'installed', 'recommended', 'favorites'].map((tab) => (
              <button
                key={tab}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-xs font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab 
                    ? 'border-indigo-500 text-indigo-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {filteredWidgets.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <LayoutTemplate className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <div className="text-sm font-bold">No widgets found</div>
            </div>
          ) : (
            filteredWidgets.map((manifest) => (
              <div key={manifest.id} className="p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{manifest.name}</h3>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">{manifest.category} • {manifest.size}</div>
                  </div>
                  <button 
                    onClick={() => handleAddWidget(manifest.id)}
                    className="p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-3">{manifest.description}</p>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-500/70" />
                  <span className="text-[10px] text-emerald-500/70 font-medium">
                    Available to: {manifest.permissions.visibleTo.join(', ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
