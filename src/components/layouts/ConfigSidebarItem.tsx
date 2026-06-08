import React from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { StepWithStatus } from '../../hooks/useSetupProgress';

interface Props {
  step: StepWithStatus;
  isActive: boolean;
  onClick: (viewId: string) => void;
}

export function ConfigSidebarItem({ step, isActive, onClick }: Props) {
  const handleClick = () => {
    if (!step.isAccessible) return; // locked steps are unclickable
    onClick(step.viewId);
  };

  // Visual state mapping
  const stateStyles = {
    completed: {
      icon: 'check_circle',        // filled checkmark
      iconColor: 'text-green-400',
      textColor: 'text-[var(--text-main)]',
      bgColor: isActive ? 'bg-[var(--bg-hover)]' : '',
      cursor: 'cursor-pointer',
      opacity: 'opacity-100',
    },
    active: {
      icon: step.icon,
      iconColor: 'text-[var(--primary-accent)]',  // FuelPro orange
      textColor: 'text-[var(--primary-accent)] font-semibold',
      bgColor: 'bg-[var(--bg-hover)] border-l-2 border-[var(--primary-accent)]',
      cursor: 'cursor-pointer',
      opacity: 'opacity-100',
    },
    pending: {
      icon: step.icon,
      iconColor: 'text-[var(--text-muted)]',
      textColor: 'text-[var(--text-muted)]',
      bgColor: isActive ? 'bg-[var(--bg-hover)]' : '',
      cursor: 'cursor-pointer',
      opacity: 'opacity-100',
    },
    locked: {
      icon: 'lock',                 // padlock icon
      iconColor: 'text-[var(--border-main)]',
      textColor: 'text-[var(--border-main)]',
      bgColor: '',
      cursor: 'cursor-not-allowed',
      opacity: 'opacity-50',
    },
  };

  const styles = isActive 
    ? { ...stateStyles[step.status], bgColor: 'bg-[var(--bg-hover)] border-l-2 border-[var(--primary-accent)]' }
    : stateStyles[step.status];

  return (
    <button
      onClick={handleClick}
      disabled={!step.isAccessible}
      title={step.status === 'locked' ? `Complete Step ${step.stepNumber - 1} first` : step.label}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
        transition-all duration-150 text-left
        ${styles.bgColor} ${styles.cursor} ${styles.opacity}
        hover:bg-[var(--bg-hover)]
        ${!step.isAccessible ? 'pointer-events-none' : ''}
      `}
    >
      {/* Step number badge */}
      <span className={`
        flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold
        flex items-center justify-center
        ${step.status === 'completed' 
          ? 'bg-green-400/20 text-green-400' 
          : step.status === 'locked'
          ? 'bg-[var(--border-main)]/20 text-[var(--border-main)]'
          : 'bg-[var(--primary-accent)]/20 text-[var(--primary-accent)]'}
      `}>
        {step.status === 'completed' 
          ? '✓' 
          : step.stepNumber}
      </span>

      {/* Step label */}
      <span className={`flex-1 text-sm ${styles.textColor}`}>
        {step.label}
      </span>

      {/* Status indicator */}
      {step.status === 'locked' && (
        <Lock className="w-4 h-4 text-[var(--border-main)]" />
      )}
      {step.status === 'completed' && !isActive && (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      )}
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-accent)]"></span>
      )}
    </button>
  );
}
