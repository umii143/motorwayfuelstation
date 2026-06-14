import React from 'react';
import { useSetupProgress } from '../../../hooks/useSetupProgress';
import { ChevronRight, ChevronLeft, CheckCircle2, Info } from 'lucide-react';

interface SetupNavigationFooterProps {
  activeViewId: string;
  onNavigate: (viewId: string) => void;
}

export function SetupNavigationFooter({ activeViewId, onNavigate }: SetupNavigationFooterProps) {
  const { steps, setupComplete } = useSetupProgress();

  // Determine current index based on viewId
  const currentIndex = steps.findIndex(s => s.viewId === activeViewId);
  
  // If we are not on a setup view step (e.g. accounts, audit), don't render the footer
  // Or, we can just return null.
  if (currentIndex === -1) return null;

  const currentStep = steps[currentIndex];
  const nextStep = steps[currentIndex + 1];
  const prevStep = steps[currentIndex - 1];

  const isNextAccessible = nextStep?.isAccessible;
  const isCurrentCompleted = currentStep.status === 'completed';

  return (
    <div className="mt-8 flex flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
      <div>
        {prevStep ? (
          <button
            onClick={() => onNavigate(prevStep.viewId)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to {prevStep.label}
          </button>
        ) : (
          <div /> // Placeholder for flex spacing
        )}
      </div>

      <div className="flex items-center gap-4">
        {!isCurrentCompleted && !setupComplete && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-orange-600">
            <Info className="h-4 w-4" />
            Complete {currentStep.label} to unlock next step
          </span>
        )}
        
        {nextStep ? (
          <button
            onClick={() => onNavigate(nextStep.viewId)}
            disabled={!isNextAccessible}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all
              ${isNextAccessible 
                ? 'bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] text-white shadow-md' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
            `}
          >
            {nextStep.status === 'completed' ? `Review ${nextStep.label}` : `Next: ${nextStep.label}`}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          setupComplete && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold bg-green-600 hover:bg-green-700 text-white shadow-md transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              Finish Setup & Go to Dashboard
            </button>
          )
        )}
      </div>
    </div>
  );
}
