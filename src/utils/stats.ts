import { StatsResult, AdvancedStatsResult } from '../types';

/**
 * Error function approximation using Abramowitz and Stegun formula
 */
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

/**
 * Standard normal cumulative distribution function
 */
export function phi(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/**
 * Normal probability density function
 */
export function normalPdf(x: number, mean: number, std: number): number {
  const z = (x - mean) / std;
  return Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI));
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
  const inputsAreValid =
    isFinite(mean) &&
    isFinite(std) &&
    std > 0 &&
    isFinite(lsl) &&
    isFinite(usl) &&
    usl > lsl;

  if (!inputsAreValid) return null;

  const cp = (usl - lsl) / (6 * std);
  const cpu = (usl - mean) / (3 * std);
  const cpl = (mean - lsl) / (3 * std);
  const cpk = Math.min(cpu, cpl);

  const zL = (lsl - mean) / std;
  const zU = (usl - mean) / std;
  const pctBelow = phi(zL) * 100;
  const pctAbove = (1 - phi(zU)) * 100;
  const pctInside = (phi(zU) - phi(zL)) * 100;
  const pctOutside = 100 - pctInside;

  return { cp, cpk, pctOutside, pctInside, pctAbove, pctBelow };
}

/**
 * Compute advanced capability metrics
 */
export function computeAdvancedStats(
  mean: number,
  std: number,
  lsl: number,
  usl: number,
  sampleStd?: number,
  target?: number
): AdvancedStatsResult | null {
  const inputsAreValid =
    isFinite(mean) &&
    isFinite(std) &&
    std > 0 &&
    isFinite(lsl) &&
    isFinite(usl) &&
    usl > lsl;

  if (!inputsAreValid) return null;

  // Pp and Ppk use sample standard deviation (if provided, otherwise use std)
  const sampleStdDev = sampleStd && sampleStd > 0 ? sampleStd : std;
  const pp = (usl - lsl) / (6 * sampleStdDev);
  const ppu = (usl - mean) / (3 * sampleStdDev);
  const ppl = (mean - lsl) / (3 * sampleStdDev);
  const ppk = Math.min(ppu, ppl);

  // DPMO (Defects Per Million Opportunities)
  const zL = (lsl - mean) / std;
  const zU = (usl - mean) / std;
  const pctOutside = ((phi(zL) + (1 - phi(zU))) * 100);
  const dpmo = (pctOutside / 100) * 1_000_000;

  // Sigma Level (approximation from DPMO)
  // Using inverse normal approximation
  const sigmaLevel = calculateSigmaLevel(dpmo);

  // Cpm (Taguchi index) - requires target value
  let cpm: number | undefined;
  if (target !== undefined && isFinite(target)) {
    const tau = Math.sqrt(std * std + (mean - target) * (mean - target));
    cpm = (usl - lsl) / (6 * tau);
  }

  return { pp, ppk, dpmo, sigmaLevel, cpm };
}

/**
 * Calculate sigma level from DPMO
 */
function calculateSigmaLevel(dpmo: number): number {
  if (dpmo <= 0) return 6;
  if (dpmo >= 1_000_000) return 0;

  // Approximate using the standard normal distribution
  // DPMO to probability
  const prob = dpmo / 1_000_000;

  // For two-tailed distribution, split the probability
  const oneTailProb = prob / 2;

  // Use inverse normal (approximation)
  // z = phi^-1(1 - oneTailProb)
  const z = inverseNormal(1 - oneTailProb);

  return Math.max(0, z);
}

/**
 * Inverse normal approximation (Beasley-Springer-Moro algorithm)
 */
function inverseNormal(p: number): number {
  const a0 = 2.50662823884;
  const a1 = -18.61500062529;
  const a2 = 41.39119773534;
  const a3 = -25.44106049637;
  const b0 = -8.47351093090;
  const b1 = 23.08336743743;
  const b2 = -21.06224101826;
  const b3 = 3.13082909833;
  const c0 = 0.3374754822726147;
  const c1 = 0.9761690190917186;
  const c2 = 0.1607979714918209;
  const c3 = 0.0276438810333863;
  const c4 = 0.0038405729373609;
  const c5 = 0.0003951896511919;
  const c6 = 0.0000321767881768;
  const c7 = 0.0000002888167364;
  const c8 = 0.0000003960315187;

  if (p <= 0 || p >= 1) return p <= 0 ? -Infinity : Infinity;

  const y = p - 0.5;

  if (Math.abs(y) < 0.42) {
    const r = y * y;
    return y * (((a3 * r + a2) * r + a1) * r + a0) /
           ((((b3 * r + b2) * r + b1) * r + b0) * r + 1);
  }

  let r = p;
  if (y > 0) r = 1 - p;
  r = Math.log(-Math.log(r));

  const x = c0 + r * (c1 + r * (c2 + r * (c3 + r * (c4 + r * (c5 + r * (c6 + r * (c7 + r * c8)))))));

  return y < 0 ? -x : x;
}

/**
 * Calculate mean and standard deviation from array of numbers
 */
export function calculateDescriptiveStats(data: number[]): { mean: number; std: number; sampleStd: number } | null {
  if (!data || data.length === 0) return null;

  const n = data.length;
  const mean = data.reduce((sum, val) => sum + val, 0) / n;

  if (n === 1) {
    return { mean, std: 0, sampleStd: 0 };
  }

  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  // Sample standard deviation (n-1)
  const sampleVariance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const sampleStd = Math.sqrt(sampleVariance);

  return { mean, std, sampleStd };
}

/**
 * Generate histogram from data
 */
export function generateHistogram(
  data: number[],
  numBins: number = 20
): { bins: { start: number; end: number; count: number; frequency: number }[]; min: number; max: number } {
  if (!data || data.length === 0) {
    return { bins: [], min: 0, max: 0 };
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const binWidth = range / numBins;

  const bins = Array.from({ length: numBins }, (_, i) => ({
    start: min + i * binWidth,
    end: min + (i + 1) * binWidth,
    count: 0,
    frequency: 0,
  }));

  // Count data points in each bin
  data.forEach((value) => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
    bins[binIndex].count++;
  });

  // Calculate frequencies
  bins.forEach((bin) => {
    bin.frequency = bin.count / data.length;
  });

  return { bins, min, max };
}
