/**
 * Display formatting helpers shared by the chart, stats cards and exports.
 */

/**
 * Format a percentage with enough precision to stay meaningful for capable
 * processes, where tail percentages can be 0.0000034%.
 */
export function formatPercent(pct: number): string {
  if (!isFinite(pct)) return '—';
  if (pct === 0) return '0%';
  const abs = Math.abs(pct);
  if (abs >= 0.01) return `${pct.toFixed(2)}%`;
  if (abs >= 1e-6) return `${Number(pct.toPrecision(2))}%`;
  return '<0.000001%';
}

/** Parts per million, with sub-1 values shown to two significant digits */
export function formatPpm(ppm: number): string {
  if (!isFinite(ppm)) return '—';
  if (ppm >= 100) return Math.round(ppm).toLocaleString('en-US');
  if (ppm >= 1) return ppm.toFixed(1);
  if (ppm >= 0.001) return ppm.toPrecision(2);
  if (ppm === 0) return '0';
  return '<0.001';
}

/** Show a number in a text field without float noise (10.013309999999997 → "10.0133") */
export function formatInput(value: number): string {
  return isFinite(value) ? String(Number(value.toPrecision(6))) : '';
}

/**
 * Next text for a numeric input after its state value changed: keep what the
 * user typed if it already parses to that value, otherwise show the new value.
 */
export function syncInput(previous: string, value: number): string {
  return previous.trim() !== '' && Number(previous) === value ? previous : formatInput(value);
}

/** "0.82 – 1.21", or "−1.20 to −0.89" when a bound is negative (avoids "-1.20–-0.89") */
export function formatInterval(lower: number, upper: number, digits: number = 2): string {
  const sep = lower < 0 || upper < 0 ? ' to ' : '–';
  return `${lower.toFixed(digits)}${sep}${upper.toFixed(digits)}`;
}

/** Format an index (Cp, Cpk…) to a fixed number of decimals, or a dash */
export function formatIndex(value: number | undefined | null, digits: number = 3): string {
  return value === undefined || value === null || !isFinite(value) ? '—' : value.toFixed(digits);
}

/**
 * Pick a "nice" step (1, 2 or 5 × 10ⁿ) about one-hundredth of `range`, for
 * slider steps and snapping dragged spec limits.
 */
export function niceStep(range: number, divisions: number = 100): number {
  const raw = Math.max(Math.abs(range), 1e-9) / divisions;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / pow;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * pow;
}

/** Round `value` to the precision implied by `step` (avoids 0.30000000000000004) */
export function roundToStep(value: number, step: number): number {
  if (!(step > 0)) return value;
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  return Number((Math.round(value / step) * step).toFixed(Math.min(decimals, 12)));
}

export interface SliderRange {
  min: number;
  max: number;
  step: number;
}

function snapRange(lo: number, hi: number, divisions: number): SliderRange {
  const step = niceStep(hi - lo, divisions);
  return {
    min: roundToStep(Math.floor(lo / step) * step, step),
    max: roundToStep(Math.ceil(hi / step) * step, step),
    step,
  };
}

/**
 * Slider ranges scale with the process instead of fixed ±10 bounds, so data
 * measured in microns or kilograms is just as easy to explore. Each range is
 * anchored on quantities that don't change while that slider is dragged.
 */
export function meanSliderRange(mean: number, std: number, lsl: number, usl: number): SliderRange {
  const tolerance = usl > lsl ? usl - lsl : 6 * Math.max(std, 1e-9);
  const center = usl > lsl ? (lsl + usl) / 2 : mean;
  return snapRange(
    Math.min(center - 1.5 * tolerance, mean),
    Math.max(center + 1.5 * tolerance, mean),
    200
  );
}

export function stdSliderRange(std: number, lsl: number, usl: number): SliderRange {
  const tolerance = usl > lsl ? usl - lsl : 6 * Math.max(std, 1e-9);
  const max = Math.max(tolerance / 2, std);
  const step = niceStep(max, 300);
  return {
    min: Math.min(step, std),
    max: roundToStep(Math.ceil(max / step) * step, step),
    step,
  };
}

export function limitSliderRange(mean: number, std: number, lsl: number, usl: number): SliderRange {
  const spread = 8 * Math.max(std, 1e-9);
  return snapRange(Math.min(mean - spread, lsl, usl), Math.max(mean + spread, lsl, usl), 160);
}
