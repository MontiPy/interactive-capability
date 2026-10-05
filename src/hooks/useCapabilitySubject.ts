import { useApp } from '../context/AppContext';
import { AppState } from '../types';

/**
 * The distribution whose metrics are currently being reported: the focused
 * scenario when one is set, otherwise the primary distribution.
 */
export interface CapabilitySubject {
  label: string;
  color?: string;
  isScenario: boolean;
  mean: number;
  std: number;
  lsl: number;
  usl: number;
  /** Overall σ for Pp/Ppk (only when derived from imported data) */
  overallStd?: number;
  /** Sample size (only when derived from imported data) */
  sampleSize?: number;
  target?: number;
}

export function getCapabilitySubject(state: AppState): CapabilitySubject {
  const focused = state.focusedScenarioId
    ? state.scenarios.find((s) => s.id === state.focusedScenarioId)
    : undefined;

  if (focused) {
    return {
      label: focused.name,
      color: focused.color,
      isScenario: true,
      mean: focused.mean,
      std: focused.std,
      lsl: focused.lsl,
      usl: focused.usl,
      overallStd: focused.overallStd,
      sampleSize: focused.sampleSize,
      target: state.target,
    };
  }

  return {
    label: 'Primary Distribution',
    isScenario: false,
    mean: state.mean,
    std: state.std,
    lsl: state.lsl,
    usl: state.usl,
    overallStd: state.histogramData?.overallStd,
    sampleSize: state.histogramData?.sampleSize,
    target: state.target,
  };
}

export function useCapabilitySubject(): CapabilitySubject {
  const { state } = useApp();
  return getCapabilitySubject(state);
}
