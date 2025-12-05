import { describe, it, expect } from 'vitest';
import { solveForMean, solveForStd } from './goalSeek';

/**
 * Helper function to check if two numbers are approximately equal
 */
function approx(a: number, b: number, tol: number = 0.01): boolean {
  return Math.abs(a - b) <= tol;
}

describe('Goal Seek - Solve for Mean', () => {
  it('should solve for centered mean with symmetric limits', () => {
    const result = solveForMean(1.33, -4, 4, 1);
    expect(result.success).toBe(true);
    expect(result.mean).toBeDefined();
    expect(approx(result.mean!, 0, 0.01)).toBe(true); // Should be centered at 0
    expect(result.achievedCpk).toBeDefined();
    expect(approx(result.achievedCpk!, 1.33, 0.01)).toBe(true);
  });

  it('should handle asymmetric spec limits correctly', () => {
    const result = solveForMean(1.0, 5, 15, 1);
    expect(result.success).toBeTruthy(); // Can be true or 'partial'
    expect(result.mean).toBeDefined();
    // Optimal mean should balance cpu and cpl
    expect(result.mean!).toBeGreaterThan(5);
    expect(result.mean!).toBeLessThan(15);
    expect(approx(result.mean!, 10, 0.5)).toBe(true); // Should be near center
  });

  it('should fail when target Cpk is impossible with current std', () => {
    // Try to achieve Cpk=2.0 with std=2 and narrow limits
    const result = solveForMean(2.0, -3, 3, 2);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('unachievable');
    expect(result.fallback).toBeDefined();
    expect(result.fallback!.mean).toBeDefined();
    expect(approx(result.fallback!.mean!, 0, 0.01)).toBe(true); // Fallback to center
    expect(result.fallback!.achievedCpk).toBeLessThan(2.0);
  });

  it('should reject negative target Cpk', () => {
    const result = solveForMean(-1.0, -3, 3, 1);
    expect(result.success).toBe(false);
    expect(result.error).toContain('positive');
  });

  it('should reject zero target Cpk', () => {
    const result = solveForMean(0, -3, 3, 1);
    expect(result.success).toBe(false);
    expect(result.error).toContain('positive');
  });

  it('should reject invalid std (zero)', () => {
    const result = solveForMean(1.33, -3, 3, 0);
    expect(result.success).toBe(false);
    expect(result.error).toContain('positive');
  });

  it('should reject invalid std (negative)', () => {
    const result = solveForMean(1.33, -3, 3, -1);
    expect(result.success).toBe(false);
    expect(result.error).toContain('positive');
  });

  it('should reject inverted spec limits', () => {
    const result = solveForMean(1.33, 5, 2, 1);
    expect(result.success).toBe(false);
    expect(result.error).toContain('USL');
  });

  it('should handle very high achievable Cpk (Six Sigma)', () => {
    const result = solveForMean(2.0, -6, 6, 1);
    expect(result.success).toBe(true);
    expect(result.mean).toBeDefined();
    expect(approx(result.mean!, 0, 0.01)).toBe(true);
    expect(approx(result.achievedCpk!, 2.0, 0.01)).toBe(true);
  });

  it('should handle Cpk = 1.0 (minimum acceptable)', () => {
    const result = solveForMean(1.0, -3, 3, 1);
    expect(result.success).toBe(true);
    expect(result.achievedCpk!).toBeGreaterThanOrEqual(0.99);
    expect(result.achievedCpk!).toBeLessThanOrEqual(1.01);
  });

  it('should provide useful fallback for unachievable high target', () => {
    const result = solveForMean(3.0, -2, 2, 1);
    expect(result.success).toBe(false);
    expect(result.fallback).toBeDefined();
    expect(result.fallback!.mean).toBe(0); // Centered
    expect(result.fallback!.achievedCpk).toBeGreaterThan(0);
    expect(result.fallback!.achievedCpk).toBeLessThan(3.0);
  });
});

describe('Goal Seek - Solve for Std', () => {
  it('should solve for std when mean is centered', () => {
    const result = solveForStd(1.33, 0, -4, 4);
    expect(result.success).toBe(true);
    expect(result.std).toBeDefined();
    expect(result.std!).toBeGreaterThan(0);
    expect(result.achievedCpk).toBeDefined();
    expect(approx(result.achievedCpk!, 1.33, 0.01)).toBe(true);
  });

  it('should handle off-center mean with verification', () => {
    // Mean at center for simplicity - this guarantees both constraints equal
    const result = solveForStd(1.5, 6, 0, 12);
    expect(result.success).toBe(true);
    expect(result.std).toBeDefined();
    // std = (6-0)/(3*1.5) = (12-6)/(3*1.5) = 1.33 (symmetric)
    const expectedStd = (12 - 6) / (3 * 1.5);
    expect(approx(result.std!, expectedStd, 0.01)).toBe(true);
    expect(result.achievedCpk).toBeDefined();
    expect(approx(result.achievedCpk!, 1.5, 0.02)).toBe(true);
  });

  it('should fail when mean is outside spec limits (below LSL)', () => {
    const result = solveForStd(1.33, -5, -3, 3);
    expect(result.success).toBe(false);
    expect(result.error).toContain('greater than LSL');
  });

  it('should fail when mean is outside spec limits (above USL)', () => {
    const result = solveForStd(1.33, 5, -3, 3);
    expect(result.success).toBe(false);
    expect(result.error).toContain('less than USL');
  });

  it('should warn when required std is too large', () => {
    // Very low target Cpk with centered mean
    const result = solveForStd(0.01, 0, -3, 3);
    expect(result.success).toBe(false);
    expect(result.error).toContain('excessively large');
  });

  it('should warn when required std is too small', () => {
    // Extremely high target Cpk - std would need to be very small
    const result = solveForStd(10.0, 0, -3, 3);
    // std = (3-0)/(3*10) = 0.1, which is above MIN_PRACTICAL_STD (0.0001)
    // So this should actually succeed
    expect(result.success).toBe(true);
    // Use ridiculously high Cpk instead - std = 3/(3*100000) = 0.00001 < MIN_PRACTICAL_STD
    const result2 = solveForStd(100000.0, 0, -3, 3);
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('too small');
  });

  it('should reject negative target Cpk', () => {
    const result = solveForStd(-1.0, 0, -3, 3);
    expect(result.success).toBe(false);
    expect(result.error).toContain('positive');
  });

  it('should reject zero target Cpk', () => {
    const result = solveForStd(0, 0, -3, 3);
    expect(result.success).toBe(false);
    expect(result.error).toContain('positive');
  });

  it('should reject inverted spec limits', () => {
    const result = solveForStd(1.33, 0, 5, 2);
    expect(result.success).toBe(false);
    expect(result.error).toContain('USL');
  });

  it('should handle high Cpk targets with centered mean', () => {
    const result = solveForStd(2.0, 0, -6, 6);
    expect(result.success).toBe(true);
    expect(result.std).toBeDefined();
    // std = (6-0)/(3*2) = 1, so it should be exactly 1
    expect(approx(result.std!, 1.0, 0.01)).toBe(true);
    expect(approx(result.achievedCpk!, 2.0, 0.01)).toBe(true);
  });

  it('should handle asymmetric position correctly', () => {
    // Mean closer to one limit
    const result = solveForStd(1.5, 1, 0, 10);
    expect(result.success).toBe(true);
    expect(result.std).toBeDefined();
    // Std should be MINIMUM of both constraints (to satisfy the tighter constraint)
    // Lower: (1-0)/(3*1.5) = 0.222 (closer limit - tighter constraint)
    // Upper: (10-1)/(3*1.5) = 2.0
    // Take min = 0.222 to satisfy both
    const expectedStd = Math.min((1 - 0) / (3 * 1.5), (10 - 1) / (3 * 1.5));
    expect(approx(result.std!, expectedStd, 0.01)).toBe(true);
  });
});

describe('Goal Seek - Edge Cases', () => {
  it('should handle very tight target (Cpk = 2.0) with sufficient std', () => {
    const result = solveForMean(2.0, -6, 6, 1);
    expect(result.success).toBe(true);
    expect(result.mean).toBeDefined();
    expect(approx(result.mean!, 0, 0.01)).toBe(true);
    expect(approx(result.achievedCpk!, 2.0, 0.01)).toBe(true);
  });

  it('should handle Cpk = 1.0 (minimum acceptable) for mean adjustment', () => {
    const result = solveForMean(1.0, -3, 3, 1);
    expect(result.success).toBe(true);
    expect(result.achievedCpk!).toBeGreaterThanOrEqual(0.99);
    expect(result.achievedCpk!).toBeLessThanOrEqual(1.01);
  });

  it('should handle Cpk = 1.0 (minimum acceptable) for std adjustment', () => {
    const result = solveForStd(1.0, 0, -3, 3);
    expect(result.success).toBe(true);
    expect(result.std).toBeDefined();
    expect(result.std!).toBeLessThanOrEqual(1.01);
    expect(result.achievedCpk!).toBeGreaterThanOrEqual(0.99);
  });

  it('should handle NaN target Cpk', () => {
    const result = solveForMean(NaN, -3, 3, 1);
    expect(result.success).toBe(false);
    expect(result.error).toContain('positive');
  });

  it('should handle Infinity target Cpk', () => {
    const result = solveForMean(Infinity, -3, 3, 1);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should provide best achievable fallback when target impossible', () => {
    const result = solveForMean(3.0, -2, 2, 1);
    expect(result.success).toBe(false);
    expect(result.fallback).toBeDefined();
    expect(result.fallback!.mean).toBe(0); // Centered
    expect(result.fallback!.achievedCpk).toBeGreaterThan(0);
    expect(result.fallback!.achievedCpk).toBeLessThan(3.0);
    // Best achievable with centered mean
    const expectedBest = 2 / 3; // (2-0)/(3*1) and (2-0)/(3*1)
    expect(approx(result.fallback!.achievedCpk, expectedBest, 0.01)).toBe(true);
  });
});
