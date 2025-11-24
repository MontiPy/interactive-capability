import { Preset } from '../types';

export const presets: Preset[] = [
  {
    name: 'Six Sigma',
    description: 'Centered process with 6σ capability (Cp = 2.0)',
    state: {
      mean: 0,
      std: 0.5,
      lsl: -3,
      usl: 3,
    },
  },
  {
    name: 'Tight Tolerance',
    description: 'Narrow specification limits (Cp = 0.67)',
    state: {
      mean: 0,
      std: 1.5,
      lsl: -2,
      usl: 2,
    },
  },
  {
    name: 'Off-Center',
    description: 'Process shifted off target (Cpk < Cp)',
    state: {
      mean: 1.5,
      std: 1,
      lsl: -3,
      usl: 3,
    },
  },
  {
    name: 'Minimum Capability',
    description: 'Barely capable process (Cpk ≈ 1.0)',
    state: {
      mean: 0,
      std: 1,
      lsl: -3,
      usl: 3,
    },
  },
  {
    name: 'Wide Tolerance',
    description: 'Very capable process with wide limits (Cp > 2)',
    state: {
      mean: 0,
      std: 0.4,
      lsl: -5,
      usl: 5,
    },
  },
];

/**
 * Load state from URL parameters
 */
export function loadFromURL(): Partial<any> | null {
  const params = new URLSearchParams(window.location.search);

  const mean = params.get('mean');
  const std = params.get('std');
  const lsl = params.get('lsl');
  const usl = params.get('usl');

  if (!mean && !std && !lsl && !usl) return null;

  const state: any = {};

  if (mean) state.mean = parseFloat(mean);
  if (std) state.std = parseFloat(std);
  if (lsl) state.lsl = parseFloat(lsl);
  if (usl) state.usl = parseFloat(usl);

  return state;
}

/**
 * Save current state to URL
 */
export function saveToURL(mean: number, std: number, lsl: number, usl: number): void {
  const params = new URLSearchParams();
  params.set('mean', mean.toString());
  params.set('std', std.toString());
  params.set('lsl', lsl.toString());
  params.set('usl', usl.toString());

  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', newURL);
}
