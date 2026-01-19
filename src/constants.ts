/**
 * Shared constants for the application
 */

/**
 * Color palette for scenarios in comparison mode.
 * These colors are designed to be visually distinct and accessible.
 */
export const SCENARIO_COLORS = [
  '#ff7f0e', // orange
  '#2ca02c', // green
  '#d62728', // red
  '#9467bd', // purple
  '#8c564b', // brown
  '#e377c2', // pink
  '#7f7f7f', // gray
  '#bcbd22', // olive
  '#17becf', // cyan
] as const;

/**
 * Primary distribution color (blue)
 */
export const PRIMARY_DISTRIBUTION_COLOR = '#1f77b4';

/**
 * Default values for new distributions
 */
export const DEFAULT_DISTRIBUTION = {
  mean: 0,
  std: 1,
  lsl: -3,
  usl: 3,
} as const;

/**
 * Validation limits
 */
export const VALIDATION_LIMITS = {
  mean: { min: -100, max: 100 },
  std: { min: 0.001, max: 100 },
  lsl: { min: -1000, max: 1000 },
  usl: { min: -1000, max: 1000 },
} as const;

/**
 * Capability index thresholds for color coding
 */
export const CAPABILITY_THRESHOLDS = {
  good: 1.33,
  acceptable: 1.0,
} as const;

/**
 * Get the next color for a scenario based on index
 */
export function getNextScenarioColor(index: number): string {
  return SCENARIO_COLORS[index % SCENARIO_COLORS.length];
}
