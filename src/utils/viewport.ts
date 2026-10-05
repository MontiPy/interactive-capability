/**
 * Viewport calculation utilities for hybrid auto-range
 */

export interface ViewportBounds {
  displayMin: number;
  displayMax: number;
}

/** Fraction of the tolerance width added outside each spec limit */
export const SPEC_PADDING_FRACTION = 0.1;

/**
 * Padding applied outside the spec limits: 10% of the tolerance width.
 * (Padding by 10% of each limit's absolute value breaks for offset processes:
 * at μ = 250 it would add ±25 around a 0.08-wide tolerance.)
 */
function specPadding(std: number, lsl: number, usl: number): number {
  if (isFinite(lsl) && isFinite(usl) && usl > lsl) return SPEC_PADDING_FRACTION * (usl - lsl);
  return SPEC_PADDING_FRACTION * 6 * std;
}

/**
 * Compute hybrid auto-viewport: wider of mean±6σ or the spec limits padded by
 * 10% of the tolerance width
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

  const padding = specPadding(std, lsl, usl);

  if (isFinite(lsl)) {
    specMin = lsl - padding;
  }

  if (isFinite(usl)) {
    specMax = usl + padding;
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

/**
 * Compute viewport for multiple distributions in comparison mode
 * Takes the widest range across all visible scenarios
 */
export function computeMultiDistributionViewport(
  scenarios: Array<{ mean: number; std: number; lsl: number; usl: number; visible: boolean }>
): ViewportBounds {
  const visibleScenarios = scenarios.filter(s => s.visible);

  // Fallback if no scenarios visible
  if (visibleScenarios.length === 0) {
    return { displayMin: -6, displayMax: 6 };
  }

  let globalMin = Infinity;
  let globalMax = -Infinity;

  // Calculate viewport for each scenario using hybrid algorithm
  visibleScenarios.forEach(scenario => {
    const viewport = computeHybridViewport(
      scenario.mean,
      scenario.std,
      scenario.lsl,
      scenario.usl
    );
    globalMin = Math.min(globalMin, viewport.displayMin);
    globalMax = Math.max(globalMax, viewport.displayMax);
  });

  // Safety checks
  if (!isFinite(globalMin) || !isFinite(globalMax) || globalMin >= globalMax) {
    return { displayMin: -6, displayMax: 6 };
  }

  return { displayMin: globalMin, displayMax: globalMax };
}
