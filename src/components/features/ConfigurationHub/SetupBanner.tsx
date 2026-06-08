import React from 'react';
import { useSetupProgress } from '../../../hooks/useSetupProgress';
import { CheckCircle2, ChevronRight, Settings } from 'lucide-react';

export function SetupBanner({ activeViewId }: { activeViewId: string }) {
  const { steps, progressPercent, setupComplete } = useSetupProgress();

  if (setupComplete) {
    return (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-sans text-sm font-bold text-green-900 uppercase tracking-wider">
            Configuration Complete
          </h3>
          <p className="mt-1 font-sans text-xs font-semibold text-green-700">
            All necessary station configuration steps have been completed. You can still modify these settings at any time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-sans text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-[var(--primary-accent)]" />
            Station Setup Progress
          </h3>
          <p className="font-sans text-xs font-semibold text-slate-500 mt-1">
            Please complete the setup steps in order to start using the system properly.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion</span>
            <span className="font-sans text-lg font-black text-[var(--primary-accent)]">{progressPercent}%</span>
          </div>
          <div className="h-10 w-10 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[var(--primary-accent)] transition-all duration-1000 ease-out"
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {steps.map((step, index) => {
          const isActive = step.viewId === activeViewId;
          return (
            <React.Fragment key={step.id}>
              <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap
                transition-colors
                ${step.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' : ''}
                ${isActive ? 'bg-[var(--primary-accent)] text-white border-[var(--primary-accent)] shadow-md' : ''}
                ${step.status === 'pending' && !isActive ? 'bg-slate-50 border-slate-200 text-slate-600' : ''}
                ${step.status === 'locked' ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-60' : ''}
              `}>
                {step.status === 'completed' && !isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-black/10 text-[10px]">
                    {step.stepNumber}
                  </span>
                )}
                {step.label}
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
