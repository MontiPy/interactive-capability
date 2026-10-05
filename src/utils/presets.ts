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
