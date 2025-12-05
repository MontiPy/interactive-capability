/**
 * Goal Seek utilities for process capability optimization
 *
 * Provides analytical (closed-form) solutions for achieving target Cpk values
 * by adjusting either process mean or standard deviation.
 */

export interface GoalSeekResult {
  success: boolean | 'partial';
  mean?: number;
  std?: number;
  achievedCpk?: number;
  error?: string;
  warning?: string;
  fallback?: {
    mean?: number;
    std?: number;
    achievedCpk: number;
  };
}

/**
 * Calculate Cpk from process parameters
 *
 * @param mean - Process mean (μ)
 * @param std - Process standard deviation (σ)
 * @param lsl - Lower specification limit
 * @param usl - Upper specification limit
 * @returns Cpk value (min of cpu and cpl)
 */
function calculateCpk(
  mean: number,
  std: number,
  lsl: number,
  usl: number
): number {
  if (std <= 0 || usl <= lsl) return 0;

  const cpu = (usl - mean) / (3 * std);  // Upper capability
  const cpl = (mean - lsl) / (3 * std);  // Lower capability
  return Math.min(cpu, cpl);             // Actual capability (bottleneck)
}

/**
 * Solve for optimal process mean given target Cpk
 *
 * Approach:
 * - For target Cpk to be achieved: cpl ≥ Cpk AND cpu ≥ Cpk
 * - This gives: lsl + 3*Cpk*σ ≤ μ ≤ usl - 3*Cpk*σ
 * - Optimal mean is the closest feasible value to current mean
 *
 * @param targetCpk - Desired Cpk value
 * @param lsl - Lower specification limit
 * @param usl - Upper specification limit
 * @param std - Current process standard deviation (σ)
 * @param currentMean - Current process mean (optional, defaults to centered)
 * @returns Goal seek result with calculated mean or error
 *
 * @example
 * // Achieve Cpk=1.33 with σ=1, LSL=-3, USL=3, current μ=-2
 * const result = solveForMean(1.33, -3, 3, 1, -2);
 * // result.mean ≈ -2 (no change needed if already in feasible range)
 */
export function solveForMean(
  targetCpk: number,
  lsl: number,
  usl: number,
  std: number,
  currentMean?: number
): GoalSeekResult {
  // Input validation
  if (!isFinite(targetCpk) || targetCpk <= 0) {
    return {
      success: false,
      error: 'Target Cpk must be a positive number',
    };
  }

  if (!isFinite(std) || std <= 0) {
    return {
      success: false,
      error: 'Standard deviation must be positive',
    };
  }

  if (!isFinite(lsl) || !isFinite(usl) || usl <= lsl) {
    return {
      success: false,
      error: 'Invalid spec limits (USL must be greater than LSL)',
    };
  }

  // Calculate feasible mean range from both constraints
  const minMean = lsl + 3 * targetCpk * std;  // From cpl ≥ targetCpk
  const maxMean = usl - 3 * targetCpk * std;  // From cpu ≥ targetCpk

  // Check feasibility
  if (minMean > maxMean) {
    // Target is unachievable - provide fallback
    const centerMean = (lsl + usl) / 2;
    const maxAchievableCpk = calculateCpk(centerMean, std, lsl, usl);

    return {
      success: false,
      error: `Target Cpk ${targetCpk.toFixed(2)} is unachievable with current σ=${std.toFixed(3)}. Maximum possible: ${maxAchievableCpk.toFixed(3)}`,
      fallback: {
        mean: centerMean,
        achievedCpk: maxAchievableCpk,
      },
    };
  }

  // Choose mean closest to current mean within feasible range
  // This minimizes the change needed while achieving target Cpk
  let optimalMean: number;

  if (currentMean !== undefined) {
    // Clamp current mean to feasible range [minMean, maxMean]
    if (currentMean >= minMean && currentMean <= maxMean) {
      // Current mean already achieves target - no change needed
      optimalMean = currentMean;
    } else if (currentMean < minMean) {
      // Move to lower bound
      optimalMean = minMean;
    } else {
      // Move to upper bound
      optimalMean = maxMean;
    }
  } else {
    // Default to centered mean (most robust to drift)
    optimalMean = (minMean + maxMean) / 2;
  }

  const achievedCpk = calculateCpk(optimalMean, std, lsl, usl);

  // Verify solution (account for numerical precision)
  const cpkError = Math.abs(achievedCpk - targetCpk);

  if (cpkError > 0.01) {
    return {
      success: 'partial',
      mean: optimalMean,
      achievedCpk,
      warning: `Achieved Cpk ${achievedCpk.toFixed(3)} differs slightly from target ${targetCpk.toFixed(3)}`,
    };
  }

  return {
    success: true,
    mean: optimalMean,
    achievedCpk,
  };
}

/**
 * Solve for required standard deviation given target Cpk
 *
 * Approach:
 * - From cpu = Cpk: σ = (usl - μ) / (3 * Cpk)
 * - From cpl = Cpk: σ = (μ - lsl) / (3 * Cpk)
 * - Required σ is MAXIMUM of both (must satisfy tighter constraint)
 *
 * @param targetCpk - Desired Cpk value
 * @param mean - Current process mean (μ)
 * @param lsl - Lower specification limit
 * @param usl - Upper specification limit
 * @returns Goal seek result with calculated std or error
 *
 * @example
 * // Achieve Cpk=1.33 with μ=0, LSL=-3, USL=3
 * const result = solveForStd(1.33, 0, -3, 3);
 * // result.std ≈ 0.75, result.achievedCpk ≈ 1.33
 */
export function solveForStd(
  targetCpk: number,
  mean: number,
  lsl: number,
  usl: number
): GoalSeekResult {
  // Input validation
  if (!isFinite(targetCpk) || targetCpk <= 0) {
    return {
      success: false,
      error: 'Target Cpk must be a positive number',
    };
  }

  if (!isFinite(mean)) {
    return {
      success: false,
      error: 'Mean must be a valid number',
    };
  }

  if (!isFinite(lsl) || !isFinite(usl) || usl <= lsl) {
    return {
      success: false,
      error: 'Invalid spec limits (USL must be greater than LSL)',
    };
  }

  // Mean must be within spec limits for feasible solution
  if (mean <= lsl) {
    return {
      success: false,
      error: `Mean (${mean.toFixed(2)}) must be greater than LSL (${lsl.toFixed(2)}) for feasible solution`,
    };
  }

  if (mean >= usl) {
    return {
      success: false,
      error: `Mean (${mean.toFixed(2)}) must be less than USL (${usl.toFixed(2)}) for feasible solution`,
    };
  }

  // Calculate required std from both constraints
  const stdFromUpper = (usl - mean) / (3 * targetCpk);
  const stdFromLower = (mean - lsl) / (3 * targetCpk);

  // Take MINIMUM to satisfy BOTH constraints
  // (larger std would make Cpk < target on the closer limit)
  const requiredStd = Math.min(stdFromUpper, stdFromLower);

  // Sanity checks for practical bounds
  const MIN_PRACTICAL_STD = 0.0001;
  const MAX_PRACTICAL_STD = (usl - lsl) / 2;  // Beyond this is unreasonable

  if (requiredStd < MIN_PRACTICAL_STD) {
    return {
      success: false,
      error: `Required σ (${requiredStd.toFixed(6)}) is too small to be practical. Target Cpk may be too high.`,
    };
  }

  if (requiredStd > MAX_PRACTICAL_STD) {
    return {
      success: false,
      error: `Required σ (${requiredStd.toFixed(3)}) is excessively large. Target Cpk ${targetCpk.toFixed(2)} may be too low. Consider adjusting mean instead.`,
    };
  }

  const achievedCpk = calculateCpk(mean, requiredStd, lsl, usl);

  return {
    success: true,
    std: requiredStd,
    achievedCpk,
  };
}
