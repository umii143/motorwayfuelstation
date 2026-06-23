import { useMemo } from 'react';
import { getSetupSteps, StepStatus, SetupStep } from '../config/setupSteps';
import { isLubeBusinessStation } from '../lib/businessScope';
import { useStation } from '../contexts/StationContext';

export interface StepWithStatus extends SetupStep {
  status: StepStatus;
  isAccessible: boolean;
}

export interface SetupProgressResult {
  steps: StepWithStatus[];
  completedCount: number;
  totalCount: number;
  setupComplete: boolean;
  firstIncompleteStep: StepWithStatus | undefined;
  progressPercent: number;
}

export function useSetupProgress(): SetupProgressResult {
  const store = useStation();

  const stepsWithStatus = useMemo((): StepWithStatus[] => {
    const isLube = isLubeBusinessStation(store.activeStationId);
    const steps = getSetupSteps(isLube);
    
    // First pass: compute completion
    const completionMap: Record<string, boolean> = { /* empty */ };
    steps.forEach(step => {
      completionMap[step.id] = step.completionCheck(store);
    });

    // Second pass: compute status and accessibility
    return steps.map(step => {
      const isCompleted = completionMap[step.id];
      const dependenciesMet = step.dependsOn.every(dep => completionMap[dep]);
      
      let status: StepStatus;
      if (isCompleted) {
        status = 'completed';
      } else if (!dependenciesMet) {
        status = 'locked';
      } else {
        status = 'pending';
      }

      return {
        ...step,
        status,
        isAccessible: isCompleted || dependenciesMet,
      };
    });
  }, [store]);

  const totalCount = stepsWithStatus.length;
  const completedCount = stepsWithStatus.filter(s => s.status === 'completed').length;
  const setupComplete = completedCount === totalCount;
  
  // Find first incomplete accessible step (for smart navigation)
  const firstIncompleteStep = stepsWithStatus.find(
    s => s.status === 'pending' || s.status === 'locked'
  );

  return {
    steps: stepsWithStatus,
    completedCount,
    totalCount,
    setupComplete,
    firstIncompleteStep,
    progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}
