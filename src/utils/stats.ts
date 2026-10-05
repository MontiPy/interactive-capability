import { StatsResult, AdvancedStatsResult, HistogramData } from '../types';

/**
 * Complementary error function.
 *
 * Chebyshev approximation (Numerical Recipes `erfcc`) with fractional error
 * below 1.2e-7 everywhere. Unlike the Abramowitz & Stegun 7.1.26 formula, the
 * error is *relative*, so far-tail probabilities (e.g. 6σ ≈ 1e-9) stay accurate.
 */
export function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))
    );
  return x >= 0 ? r : 2 - r;
}

/**
 * Error function
 */
export function erf(x: number): number {
  return 1 - erfc(x);
}

/**
 * Standard normal cumulative distribution function.
 * Computed via erfc so that both tails keep full relative precision.
 */
export function phi(x: number): number {
  return 0.5 * erfc(-x / Math.SQRT2);
}

/**
 * Normal probability density function
 */
export function normalPdf(x: number, mean: number, std: number): number {
  const z = (x - mean) / std;
  return Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI));
}

/**
 * Inverse of the standard normal CDF (Acklam's algorithm, relative error < 1.2e-9).
 */
export function normalQuantile(p: number): number {
  if (!(p > 0)) return -Infinity;
  if (!(p < 1)) return Infinity;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

  const pLow = 0.02425;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  if (p <= 1 - pLow) {
    const q = p - 0.5;
    const r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }

  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(
    (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}

function inputsAreValid(mean: number, std: number, lsl: number, usl: number): boolean {
  return (
    isFinite(mean) && isFinite(std) && std > 0 && isFinite(lsl) && isFinite(usl) && usl > lsl
  );
}

/**
 * Compute basic capability indices (Cp, Cpk) and percentages
 */
export function computeStats(
  mean: number,
  std: number,
  lsl: number,
  usl: number
): StatsResult | null {
  if (!inputsAreValid(mean, std, lsl, usl)) return null;

  const cp = (usl - lsl) / (6 * std);
  const cpu = (usl - mean) / (3 * std);
  const cpl = (mean - lsl) / (3 * std);
  const cpk = Math.min(cpu, cpl);

  const zL = (lsl - mean) / std;
  const zU = (usl - mean) / std;
  const pctBelow = phi(zL) * 100;
  // Upper tail via symmetry avoids catastrophic cancellation in 1 - phi(zU)
  const pctAbove = phi(-zU) * 100;
  const pctOutside = pctBelow + pctAbove;
  const pctInside = 100 - pctOutside;

  return { cp, cpk, pctOutside, pctInside, pctAbove, pctBelow };
}

/**
 * Compute advanced capability metrics.
 *
 * @param std        Within (short-term) σ, used for DPMO / sigma level
 * @param overallStd Overall (long-term) σ used for Pp/Ppk. Defaults to `std`.
 * @param target     Optional target for the Taguchi Cpm index
 */
export function computeAdvancedStats(
  mean: number,
  std: number,
  lsl: number,
  usl: number,
  overallStd?: number,
  target?: number
): AdvancedStatsResult | null {
  if (!inputsAreValid(mean, std, lsl, usl)) return null;

  const sigmaOverall = overallStd && overallStd > 0 && isFinite(overallStd) ? overallStd : std;
  const pp = (usl - lsl) / (6 * sigmaOverall);
  const ppu = (usl - mean) / (3 * sigmaOverall);
  const ppl = (mean - lsl) / (3 * sigmaOverall);
  const ppk = Math.min(ppu, ppl);

  const cpu = (usl - mean) / (3 * std);
  const cpl = (mean - lsl) / (3 * std);

  // Expected defects (from the within-σ model)
  const zL = (lsl - mean) / std;
  const zU = (usl - mean) / std;
  const pBelow = phi(zL);
  const pAbove = phi(-zU);
  const pOut = pBelow + pAbove;
  const dpmo = pOut * 1_000_000;

  const sigmaLevel = calculateSigmaLevel(pOut, zL, zU);
  // Minitab-style Z.Bench: one-sided z with the same total tail probability
  const zBench = pOut > 0 ? -normalQuantile(Math.min(pOut, 1 - 1e-16)) : Math.min(-zL, zU);

  let cpm: number | undefined;
  if (target !== undefined && isFinite(target)) {
    const tau = Math.sqrt(std * std + (mean - target) * (mean - target));
    cpm = (usl - lsl) / (6 * tau);
  }

  return {
    pp,
    ppk,
    dpmo,
    sigmaLevel,
    cpm,
    cpu,
    cpl,
    ppmBelow: pBelow * 1_000_000,
    ppmAbove: pAbove * 1_000_000,
    zBench,
  };
}

/**
 * Equivalent centered sigma level: the z for which a centered process would
 * produce the same total out-of-spec probability (split equally across tails).
 */
function calculateSigmaLevel(pOut: number, zL: number, zU: number): number {
  if (pOut >= 1) return 0;
  if (pOut <= 0) return Math.min(Math.abs(zL), Math.abs(zU));
  return Math.max(0, -normalQuantile(pOut / 2));
}

/**
 * Calculate mean and standard deviation from array of numbers.
 * `std` is the population σ (n), `sampleStd` uses Bessel's correction (n-1).
 */
export function calculateDescriptiveStats(
  data: number[]
): { mean: number; std: number; sampleStd: number } | null {
  if (!data || data.length === 0) return null;

  const n = data.length;
  let sum = 0;
  for (const v of data) sum += v;
  const mean = sum / n;

  if (n === 1) {
    return { mean, std: 0, sampleStd: 0 };
  }

  let ss = 0;
  for (const v of data) ss += (v - mean) * (v - mean);

  return { mean, std: Math.sqrt(ss / n), sampleStd: Math.sqrt(ss / (n - 1)) };
}

/** d2 control-chart constant for moving ranges of span 2 */
export const D2_SPAN_2 = 1.128;

/**
 * Within-subgroup (short-term) σ estimated from the average moving range:
 * σ̂ = MR̄ / d2. Assumes the data are in production (time) order.
 * Returns null when fewer than two points are supplied.
 */
export function movingRangeSigma(data: number[]): number | null {
  if (!data || data.length < 2) return null;
  let total = 0;
  for (let i = 1; i < data.length; i++) total += Math.abs(data[i] - data[i - 1]);
  return total / (data.length - 1) / D2_SPAN_2;
}

/**
 * Chi-square quantile via the Wilson–Hilferty approximation.
 */
export function chiSquareQuantile(p: number, df: number): number {
  if (!(df > 0) || !(p > 0) || !(p < 1)) return NaN;
  const z = normalQuantile(p);
  const k = 2 / (9 * df);
  const base = 1 - k + z * Math.sqrt(k);
  return df * Math.max(0, base) ** 3;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  level: number;
}

/**
 * Two-sided confidence interval for Cp (chi-square method).
 */
export function cpConfidenceInterval(
  cp: number,
  n: number,
  level: number = 0.95
): ConfidenceInterval | null {
  if (!isFinite(cp) || !(n >= 2) || !(level > 0 && level < 1)) return null;
  const alpha = 1 - level;
  const df = n - 1;
  const lower = cp * Math.sqrt(chiSquareQuantile(alpha / 2, df) / df);
  const upper = cp * Math.sqrt(chiSquareQuantile(1 - alpha / 2, df) / df);
  return { lower, upper, level };
}

/**
 * Two-sided confidence interval for Cpk (Bissell's normal approximation).
 */
export function cpkConfidenceInterval(
  cpk: number,
  n: number,
  level: number = 0.95
): ConfidenceInterval | null {
  if (!isFinite(cpk) || !(n >= 2) || !(level > 0 && level < 1)) return null;
  const z = normalQuantile(1 - (1 - level) / 2);
  const se = Math.sqrt(1 / (9 * n) + (cpk * cpk) / (2 * (n - 1)));
  return { lower: cpk - z * se, upper: cpk + z * se, level };
}

export interface NormalityResult {
  /** Anderson–Darling statistic adjusted for small samples (A*²) */
  aSquared: number;
  pValue: number;
}

/**
 * Anderson–Darling test for normality (parameters estimated from the data).
 * p-values use the D'Agostino & Stephens (1986) approximation.
 * Requires at least 8 points; returns null otherwise or for constant data.
 */
export function andersonDarling(data: number[]): NormalityResult | null {
  if (!data || data.length < 8) return null;
  const stats = calculateDescriptiveStats(data);
  if (!stats || !(stats.sampleStd > 0)) return null;

  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  const tiny = 1e-300;

  let s = 0;
  for (let i = 0; i < n; i++) {
    const zi = (sorted[i] - stats.mean) / stats.sampleStd;
    const zj = (sorted[n - 1 - i] - stats.mean) / stats.sampleStd;
    const lower = Math.max(phi(zi), tiny);
    const upper = Math.max(phi(-zj), tiny);
    s += (2 * i + 1) * (Math.log(lower) + Math.log(upper));
  }
  const a2 = -n - s / n;
  const a = a2 * (1 + 0.75 / n + 2.25 / (n * n));

  let p: number;
  if (a >= 0.6) p = Math.exp(1.2937 - 5.709 * a + 0.0186 * a * a);
  else if (a >= 0.34) p = Math.exp(0.9177 - 4.279 * a - 1.38 * a * a);
  else if (a >= 0.2) p = 1 - Math.exp(-8.318 + 42.796 * a - 59.938 * a * a);
  else p = 1 - Math.exp(-13.436 + 101.14 * a - 223.73 * a * a);

  return { aSquared: a, pValue: Math.min(1, Math.max(0, p)) };
}

/**
 * Generate histogram from data. When `numBins` is omitted the square-root rule
 * (clamped to 5–40 bins) is used.
 */
export function generateHistogram(
  data: number[],
  numBins?: number
): {
  bins: { start: number; end: number; count: number; frequency: number }[];
  min: number;
  max: number;
} {
  if (!data || data.length === 0) {
    return { bins: [], min: 0, max: 0 };
  }

  // Loop instead of Math.min(...data): spreading large arrays overflows the stack
  let min = Infinity;
  let max = -Infinity;
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const binCount =
    numBins && numBins > 0
      ? Math.floor(numBins)
      : Math.min(40, Math.max(5, Math.ceil(Math.sqrt(data.length))));

  // Constant data: centre a single-width band of bins on the value
  let lo = min;
  let range = max - min;
  if (!(range > 0)) {
    const halfWidth = Math.abs(min) * 0.01 || 0.5;
    lo = min - halfWidth;
    range = 2 * halfWidth;
  }
  const binWidth = range / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    start: lo + i * binWidth,
    end: lo + (i + 1) * binWidth,
    count: 0,
    frequency: 0,
  }));

  for (const value of data) {
    const binIndex = Math.min(Math.max(Math.floor((value - lo) / binWidth), 0), binCount - 1);
    bins[binIndex].count++;
  }

  for (const bin of bins) {
    bin.frequency = bin.count / data.length;
  }

  return { bins, min, max };
}

/**
 * Parse free-form numeric input (comma, semicolon, whitespace or newline separated).
 * Tokens that are not strictly numeric (e.g. a CSV header) are counted as invalid.
 */
export function parseNumericData(text: string): { values: number[]; invalidCount: number } {
  const values: number[] = [];
  let invalidCount = 0;

  for (const token of text.split(/[\s,;]+/)) {
    const trimmed = token.trim().replace(/^["']|["']$/g, '');
    if (!trimmed) continue;
    const num = Number(trimmed);
    if (Number.isFinite(num)) values.push(num);
    else invalidCount++;
  }

  return { values, invalidCount };
}

/**
 * Summarise raw measurements into everything the app needs after an import:
 * histogram, overall and within σ, and a normality check.
 */
export function summarizeData(data: number[]): HistogramData | null {
  const desc = calculateDescriptiveStats(data);
  if (!desc || data.length < 2 || !(desc.sampleStd > 0)) return null;

  const histogram = generateHistogram(data);
  const within = movingRangeSigma(data);
  const normality = andersonDarling(data);

  return {
    bins: histogram.bins.map(({ start, end, count }) => ({ start, end, count })),
    mean: desc.mean,
    // σ used for Cp/Cpk: within-subgroup estimate, falling back to overall
    std: within && within > 0 ? within : desc.sampleStd,
    overallStd: desc.sampleStd,
    withinStd: within && within > 0 ? within : undefined,
    sampleSize: data.length,
    min: histogram.min,
    max: histogram.max,
    normality: normality ?? undefined,
  };
}
