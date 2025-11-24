/**
 * Viewport calculation utilities for hybrid auto-range
 */

export interface ViewportBounds {
  displayMin: number;
  displayMax: number;
}

/**
 * Sign-aware padding for spec limits
 * Lower limit: expand outward by 10% (more negative if negative, less positive if positive)
 * Upper limit: expand outward by 10% (more positive if positive, less negative if negative)
 */
function padLower(lsl: number): number {
  return lsl < 0 ? lsl * 1.1 : lsl * 0.9;
}

function padUpper(usl: number): number {
  return usl < 0 ? usl * 0.9 : usl * 1.1;
}

/**
 * Compute hybrid auto-viewport: wider of mean±6σ or padded spec limits
 */
export function computeHybridViewport(
  mean: number,
  std: number,
  lsl: number,
  usl: number
): ViewportBounds {
  // Validate inputs
  if (!isFinite(mean) || !isFinite(std) || std <= 0) {
    return { displayMin: -6, displayMax: 6 }; // Safe fallback
  }

  // Mean-based bounds
  const meanMin = mean - 6 * std;
  const meanMax = mean + 6 * std;

  // Spec-based bounds (with fallback to mean if invalid)
  let specMin = meanMin;
  let specMax = meanMax;

  if (isFinite(lsl)) {
    specMin = padLower(lsl);
  }

  if (isFinite(usl)) {
    specMax = padUpper(usl);
  }

  // Take the wider range
  const displayMin = Math.min(meanMin, specMin);
  const displayMax = Math.max(meanMax, specMax);

  // Safety clamp to finite numbers
  if (!isFinite(displayMin) || !isFinite(displayMax) || displayMin >= displayMax) {
    return { displayMin: meanMin, displayMax: meanMax };
  }

  return { displayMin, displayMax };
}

/**
 * Compute fit-to-mean viewport (mean ± N*std)
 */
export function computeFitToMeanViewport(
  mean: number,
  std: number,
  multiplier: number
): ViewportBounds {
  if (!isFinite(mean) || !isFinite(std) || std <= 0 || !isFinite(multiplier) || multiplier <= 0) {
    return { displayMin: -6, displayMax: 6 };
  }

  const displayMin = mean - multiplier * std;
  const displayMax = mean + multiplier * std;

  if (!isFinite(displayMin) || !isFinite(displayMax) || displayMin >= displayMax) {
    return { displayMin: mean - 6, displayMax: mean + 6 };
  }

  return { displayMin, displayMax };
}
