import React, { Suspense } from 'react';
import { Settings, X, GripHorizontal } from 'lucide-react';
import { useWidgetEngine } from '../../stores/useWidgetEngine';
import { WidgetInstance, WidgetManifest } from '../../types/widget.types';

// Simple Error Boundary
class ErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
   
   
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentDidCatch(error: any, errorInfo: any) { console.error("Widget Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface WidgetWrapperProps {
  instance: WidgetInstance;
  manifest: WidgetManifest;
  children: React.ReactNode;
}

export function WidgetWrapper({ instance, manifest, children }: WidgetWrapperProps) {
  const { isEditMode, removeWidget } = useWidgetEngine();

  const liquidGlass = "relative overflow-hidden backdrop-blur-[30px] saturate-[150%] bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_80px_rgba(0,0,0,0.6)] rounded-[24px] transition-all duration-300";

  return (
    <div className={`w-full h-full ${liquidGlass} flex flex-col group`}>
      
      {/* Edit Mode Header Overlay */}
      {isEditMode && (
        <div className="absolute top-0 left-0 right-0 h-10 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-between px-3 border-b border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <div className="drag-handle cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-white">
              <GripHorizontal className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{manifest.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => removeWidget(instance.instanceId)}
              className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Widget Content */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        <ErrorBoundary fallback={
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-2">
              <X className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-xs font-bold text-slate-300">Widget Crashed</div>
            <div className="text-[10px] text-slate-500">Failed to render {manifest.name}</div>
          </div>
        }>
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            {children}
          </Suspense>
        </ErrorBoundary>
      </div>

    </div>
  );
}
