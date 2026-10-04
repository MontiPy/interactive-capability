import { describe, it, expect } from 'vitest';
import { computeHybridViewport, computeFitToMeanViewport, computeMultiDistributionViewport } from './viewport';

function approx(a: number, b: number, tol: number = 1e-3): boolean {
  return Math.abs(a - b) <= tol;
}

describe('Viewport Utilities', () => {
  describe('computeHybridViewport', () => {
    it('should use mean±6σ for symmetric case when LSL/USL are within range', () => {
      const result = computeHybridViewport(0, 1, -3, 3);
      expect(approx(result.displayMin, -6)).toBe(true);
      expect(approx(result.displayMax, 6)).toBe(true);
    });

    it('should expand to padded LSL when LSL is outside mean-6σ (negative LSL)', () => {
      const result = computeHybridViewport(0, 1, -10, 3);
      // mean - 6σ = 0 - 6 = -6
      // padding = 10% of tolerance (13) = 1.3 → padded LSL = -11.3
      // displayMin should be min(-6, -11.3) = -11.3
      expect(approx(result.displayMin, -11.3)).toBe(true);
    });

    it('should expand to padded USL when USL is outside mean+6σ (positive USL)', () => {
      const result = computeHybridViewport(0, 1, -3, 10);
      // mean + 6σ = 0 + 6 = 6
      // padding = 10% of tolerance (13) = 1.3 → padded USL = 11.3
      // displayMax should be max(6, 11.3) = 11.3
      expect(approx(result.displayMax, 11.3)).toBe(true);
    });

    it('should pad a positive LSL outward', () => {
      const result = computeHybridViewport(10, 1, 5, 15);
      // mean - 6σ = 10 - 6 = 4
      // padded LSL = 5 - 0.1 * 10 = 4
      // displayMin should be min(4, 4) = 4
      expect(approx(result.displayMin, 4)).toBe(true);
    });

    it('should pad a negative USL outward', () => {
      const result = computeHybridViewport(-10, 1, -15, -5);
      // mean + 6σ = -10 + 6 = -4
      // padded USL = -5 + 0.1 * 10 = -4
      // displayMax should be max(-4, -4) = -4
      expect(approx(result.displayMax, -4)).toBe(true);
    });

    it('should handle asymmetric distribution centered at zero', () => {
      const result = computeHybridViewport(0, 2, -15, 10);
      // mean - 6σ = 0 - 12 = -12
      // mean + 6σ = 0 + 12 = 12
      // padding = 10% of 25 = 2.5 → padded limits -17.5 / 12.5
      // displayMin should be min(-12, -17.5) = -17.5
      // displayMax should be max(12, 12.5) = 12.5
      expect(approx(result.displayMin, -17.5)).toBe(true);
      expect(approx(result.displayMax, 12.5)).toBe(true);
    });

    it('should handle large standard deviation', () => {
      const result = computeHybridViewport(0, 5, -10, 10);
      // mean - 6σ = 0 - 30 = -30
      // mean + 6σ = 0 + 30 = 30
      // padded limits = ∓10 ∓ 2 = -12 / 12
      // displayMin should be min(-30, -12) = -30
      // displayMax should be max(30, 12) = 30
      expect(approx(result.displayMin, -30)).toBe(true);
      expect(approx(result.displayMax, 30)).toBe(true);
    });

    it('should handle small standard deviation', () => {
      const result = computeHybridViewport(0, 0.1, -2, 2);
      // mean - 6σ = 0 - 0.6 = -0.6
      // mean + 6σ = 0 + 0.6 = 0.6
      // padding = 10% of 4 = 0.4 → padded limits -2.4 / 2.4
      // displayMin should be min(-0.6, -2.4) = -2.4
      // displayMax should be max(0.6, 2.4) = 2.4
      expect(approx(result.displayMin, -2.4)).toBe(true);
      expect(approx(result.displayMax, 2.4)).toBe(true);
    });

    it('should handle LSL and USL at zero boundary', () => {
      const result = computeHybridViewport(5, 1, 0, 10);
      // mean - 6σ = 5 - 6 = -1
      // mean + 6σ = 5 + 6 = 11
      // padding = 10% of 10 = 1 → padded limits -1 / 11
      // displayMin should be min(-1, -1) = -1
      // displayMax should be max(11, 11) = 11
      expect(approx(result.displayMin, -1)).toBe(true);
      expect(approx(result.displayMax, 11)).toBe(true);
    });

    it('should keep offset processes in a proportionate window', () => {
      // A shaft diameter: μ = 250.02, σ = 0.004, tolerance 249.98–250.06
      const result = computeHybridViewport(250.02, 0.004, 249.98, 250.06);
      expect(approx(result.displayMin, 249.972, 1e-6)).toBe(true);
      expect(approx(result.displayMax, 250.068, 1e-6)).toBe(true);
    });
  });

  describe('computeFitToMeanViewport', () => {
    it('should compute viewport as mean ± Nσ', () => {
      const result = computeFitToMeanViewport(0, 1, 4);
      expect(approx(result.displayMin, -4)).toBe(true);
      expect(approx(result.displayMax, 4)).toBe(true);
    });

    it('should handle different multipliers', () => {
      const result = computeFitToMeanViewport(10, 2, 3);
      // 10 - 3*2 = 4, 10 + 3*2 = 16
      expect(approx(result.displayMin, 4)).toBe(true);
      expect(approx(result.displayMax, 16)).toBe(true);
    });

    it('should handle small multipliers', () => {
      const result = computeFitToMeanViewport(0, 1, 1);
      expect(approx(result.displayMin, -1)).toBe(true);
      expect(approx(result.displayMax, 1)).toBe(true);
    });

    it('should handle large multipliers', () => {
      const result = computeFitToMeanViewport(0, 1, 10);
      expect(approx(result.displayMin, -10)).toBe(true);
      expect(approx(result.displayMax, 10)).toBe(true);
    });

    it('should work with negative mean', () => {
      const result = computeFitToMeanViewport(-5, 2, 3);
      // -5 - 3*2 = -11, -5 + 3*2 = 1
      expect(approx(result.displayMin, -11)).toBe(true);
      expect(approx(result.displayMax, 1)).toBe(true);
    });
  });

  describe('computeMultiDistributionViewport', () => {
    it('should handle single visible scenario', () => {
      const scenarios = [
        { mean: 0, std: 1, lsl: -3, usl: 3, visible: true },
      ];
      const result = computeMultiDistributionViewport(scenarios);
      // Should match single scenario hybrid viewport: mean±6σ = -6 to 6
      expect(approx(result.displayMin, -6)).toBe(true);
      expect(approx(result.displayMax, 6)).toBe(true);
    });

    it('should handle multiple scenarios with overlapping ranges', () => {
      const scenarios = [
        { mean: 0, std: 1, lsl: -3, usl: 3, visible: true },
        { mean: 1, std: 1, lsl: -2, usl: 4, visible: true },
      ];
      const result = computeMultiDistributionViewport(scenarios);
      // Scenario 1: -6 to 6
      // Scenario 2: mean±6σ = 1-6=-5 to 1+6=7
      // Global: min(-6, -5) to max(6, 7)
      expect(approx(result.displayMin, -6)).toBe(true);
      expect(approx(result.displayMax, 7)).toBe(true);
    });

    it('should handle multiple scenarios with distant ranges', () => {
      const scenarios = [
        { mean: 0, std: 1, lsl: -3, usl: 3, visible: true },
        { mean: 20, std: 2, lsl: 15, usl: 25, visible: true },
      ];
      const result = computeMultiDistributionViewport(scenarios);
      // Scenario 1: -6 to 6
      // Scenario 2: 20±12 = 8 to 32
      // Global: min(-6, 8) to max(6, 32)
      expect(approx(result.displayMin, -6)).toBe(true);
      expect(approx(result.displayMax, 32)).toBe(true);
    });

    it('should ignore hidden scenarios', () => {
      const scenarios = [
        { mean: 0, std: 1, lsl: -3, usl: 3, visible: true },
        { mean: 100, std: 10, lsl: 50, usl: 150, visible: false }, // Should be ignored
      ];
      const result = computeMultiDistributionViewport(scenarios);
      // Should only consider first scenario
      expect(approx(result.displayMin, -6)).toBe(true);
      expect(approx(result.displayMax, 6)).toBe(true);
    });

    it('should return fallback when all scenarios hidden', () => {
      const scenarios = [
        { mean: 0, std: 1, lsl: -3, usl: 3, visible: false },
        { mean: 20, std: 2, lsl: 15, usl: 25, visible: false },
      ];
      const result = computeMultiDistributionViewport(scenarios);
      // Should return fallback
      expect(result.displayMin).toBe(-6);
      expect(result.displayMax).toBe(6);
    });

    it('should return fallback when no scenarios provided', () => {
      const scenarios: any[] = [];
      const result = computeMultiDistributionViewport(scenarios);
      expect(result.displayMin).toBe(-6);
      expect(result.displayMax).toBe(6);
    });

    it('should handle mixed positive/negative distributions', () => {
      const scenarios = [
        { mean: -10, std: 1, lsl: -15, usl: -5, visible: true },
        { mean: 10, std: 1, lsl: 5, usl: 15, visible: true },
      ];
      const result = computeMultiDistributionViewport(scenarios);
      // Scenario 1: -10±6 = -16 to -4, padded LSL/USL: -16, -4
      // Scenario 2: 10±6 = 4 to 16, padded LSL/USL: 4, 16
      // Global: -16 to 16
      expect(approx(result.displayMin, -16)).toBe(true);
      expect(approx(result.displayMax, 16)).toBe(true);
    });

    it('should handle scenarios with wide spec limits', () => {
      const scenarios = [
        { mean: 0, std: 1, lsl: -20, usl: 20, visible: true },
        { mean: 5, std: 1, lsl: -15, usl: 25, visible: true },
      ];
      const result = computeMultiDistributionViewport(scenarios);
      // Scenario 1: -6 to 6, but padded LSL/USL: -24 to 24
      // Scenario 2: -1 to 11, but padded LSL/USL: -19 to 29
      // Global should use the wider spec limits
      expect(approx(result.displayMin, -24)).toBe(true);
      expect(approx(result.displayMax, 29)).toBe(true);
    });

    it('should handle scenarios with varying std deviations', () => {
      const scenarios = [
        { mean: 0, std: 0.5, lsl: -2, usl: 2, visible: true },
        { mean: 0, std: 2, lsl: -5, usl: 5, visible: true },
      ];
      const result = computeMultiDistributionViewport(scenarios);
      // Scenario 1: 0±3 = -3 to 3, but padded limits wider
      // Scenario 2: 0±12 = -12 to 12
      // Global should use scenario 2's wider range
      expect(approx(result.displayMin, -12)).toBe(true);
      expect(approx(result.displayMax, 12)).toBe(true);
    });
  });
});
