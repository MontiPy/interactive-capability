/** Categorical palette for comparison scenarios */
export const SCENARIO_COLORS = [
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
];

/**
 * Pick the first palette color not already used, so deleting and re-adding
 * scenarios doesn't produce duplicate colors while free ones remain.
 */
export function nextScenarioColor(scenarios: { color: string }[]): string {
  const used = new Set(scenarios.map((s) => s.color.toLowerCase()));
  const free = SCENARIO_COLORS.find((c) => !used.has(c.toLowerCase()));
  return free ?? SCENARIO_COLORS[scenarios.length % SCENARIO_COLORS.length];
}
