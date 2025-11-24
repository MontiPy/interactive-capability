import { describe, it, expect } from 'vitest';
import { computeHybridViewport, computeFitToMeanViewport } from './viewport';

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
      // padLower(lsl=-10) = -10 * 1.1 = -11
      // displayMin should be min(-6, -11) = -11
      expect(approx(result.displayMin, -11)).toBe(true);
    });

    it('should expand to padded USL when USL is outside mean+6σ (positive USL)', () => {
      const result = computeHybridViewport(0, 1, -3, 10);
      // mean + 6σ = 0 + 6 = 6
      // padUpper(usl=10) = 10 * 1.1 = 11
      // displayMax should be max(6, 11) = 11
      expect(approx(result.displayMax, 11)).toBe(true);
    });

    it('should handle positive LSL correctly (inward padding)', () => {
      const result = computeHybridViewport(10, 1, 5, 15);
      // mean - 6σ = 10 - 6 = 4
      // padLower(lsl=5) = 5 * 0.9 = 4.5
      // displayMin should be min(4, 4.5) = 4
      expect(approx(result.displayMin, 4)).toBe(true);
    });

    it('should handle negative USL correctly (inward padding)', () => {
      const result = computeHybridViewport(-10, 1, -15, -5);
      // mean + 6σ = -10 + 6 = -4
      // padUpper(usl=-5) = -5 * 0.9 = -4.5
      // displayMax should be max(-4, -4.5) = -4
      expect(approx(result.displayMax, -4)).toBe(true);
    });

    it('should handle asymmetric distribution centered at zero', () => {
      const result = computeHybridViewport(0, 2, -15, 10);
      // mean - 6σ = 0 - 12 = -12
      // mean + 6σ = 0 + 12 = 12
      // padLower(lsl=-15) = -15 * 1.1 = -16.5
      // padUpper(usl=10) = 10 * 1.1 = 11
      // displayMin should be min(-12, -16.5) = -16.5
      // displayMax should be max(12, 11) = 12
      expect(approx(result.displayMin, -16.5)).toBe(true);
      expect(approx(result.displayMax, 12)).toBe(true);
    });

    it('should handle large standard deviation', () => {
      const result = computeHybridViewport(0, 5, -10, 10);
      // mean - 6σ = 0 - 30 = -30
      // mean + 6σ = 0 + 30 = 30
      // padLower(lsl=-10) = -10 * 1.1 = -11
      // padUpper(usl=10) = 10 * 1.1 = 11
      // displayMin should be min(-30, -11) = -30
      // displayMax should be max(30, 11) = 30
      expect(approx(result.displayMin, -30)).toBe(true);
      expect(approx(result.displayMax, 30)).toBe(true);
    });

    it('should handle small standard deviation', () => {
      const result = computeHybridViewport(0, 0.1, -2, 2);
      // mean - 6σ = 0 - 0.6 = -0.6
      // mean + 6σ = 0 + 0.6 = 0.6
      // padLower(lsl=-2) = -2 * 1.1 = -2.2
      // padUpper(usl=2) = 2 * 1.1 = 2.2
      // displayMin should be min(-0.6, -2.2) = -2.2
      // displayMax should be max(0.6, 2.2) = 2.2
      expect(approx(result.displayMin, -2.2)).toBe(true);
      expect(approx(result.displayMax, 2.2)).toBe(true);
    });

    it('should handle LSL and USL at zero boundary', () => {
      const result = computeHybridViewport(5, 1, 0, 10);
      // mean - 6σ = 5 - 6 = -1
      // mean + 6σ = 5 + 6 = 11
      // padLower(lsl=0) = 0 * 0.9 = 0 (zero edge case)
      // padUpper(usl=10) = 10 * 1.1 = 11
      // displayMin should be min(-1, 0) = -1
      // displayMax should be max(11, 11) = 11
      expect(approx(result.displayMin, -1)).toBe(true);
      expect(approx(result.displayMax, 11)).toBe(true);
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
});
