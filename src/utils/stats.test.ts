import { describe, it, expect } from 'vitest';
import {
  erf,
  phi,
  computeStats,
  computeAdvancedStats,
  calculateDescriptiveStats,
  generateHistogram,
} from './stats';

function approx(a: number, b: number, tol: number = 1e-3): boolean {
  return Math.abs(a - b) <= tol;
}

describe('Statistical Functions', () => {
  describe('erf and phi', () => {
    it('should calculate erf correctly', () => {
      expect(approx(erf(0), 0, 1e-6)).toBe(true);
      expect(approx(erf(1), 0.8427, 1e-3)).toBe(true);
      expect(approx(erf(-1), -0.8427, 1e-3)).toBe(true);
    });

    it('should calculate phi (CDF) correctly', () => {
      expect(approx(phi(0), 0.5, 1e-6)).toBe(true);
      expect(approx(phi(1), 0.8413, 1e-3)).toBe(true);
      expect(approx(phi(-1), 0.1587, 1e-3)).toBe(true);
    });
  });

  describe('computeStats', () => {
    it('should compute Cp and Cpk for symmetric case', () => {
      const stats = computeStats(0, 1, -3.0, 3.0);
      expect(stats).not.toBeNull();
      expect(approx(stats!.cp, 1.0, 1e-6)).toBe(true);
      expect(approx(stats!.cpk, 1.0, 1e-6)).toBe(true);
      expect(approx(stats!.pctOutside, 0.26998, 0.05)).toBe(true);
      expect(approx(stats!.pctInside, 99.73, 0.05)).toBe(true);
      expect(approx(stats!.pctAbove, 0.13499, 0.01)).toBe(true);
      expect(approx(stats!.pctBelow, 0.13499, 0.01)).toBe(true);
    });

    it('should compute higher Cp for tighter standard deviation', () => {
      const stats = computeStats(10, 0.5, 8, 12);
      expect(stats).not.toBeNull();
      expect(stats!.cp).toBeGreaterThan(1);
      expect(stats!.cpk).toBeGreaterThan(1);
    });

    it('should return null for invalid std (zero)', () => {
      const stats = computeStats(0, 0, -1, 1);
      expect(stats).toBeNull();
    });

    it('should return null for inverted limits (USL < LSL)', () => {
      const stats = computeStats(0, 1, 2, -2);
      expect(stats).toBeNull();
    });

    it('should compute high pctOutside when limits are far from mean', () => {
      const stats = computeStats(0, 1, 2, 3);
      expect(stats).not.toBeNull();
      expect(approx(stats!.pctOutside, 97.86, 0.5)).toBe(true);
    });
  });

  describe('computeAdvancedStats', () => {
    it('should compute Pp, Ppk, DPMO, and sigma level', () => {
      const stats = computeAdvancedStats(0, 1, -3.0, 3.0);
      expect(stats).not.toBeNull();
      expect(approx(stats!.pp, 1.0, 1e-3)).toBe(true);
      expect(approx(stats!.ppk, 1.0, 1e-3)).toBe(true);
      expect(stats!.dpmo).toBeGreaterThan(0);
      expect(stats!.dpmo).toBeLessThan(100000);
      expect(stats!.sigmaLevel).toBeGreaterThan(2);
    });

    it('should compute Cpm when target is provided', () => {
      const stats = computeAdvancedStats(0, 1, -3.0, 3.0, undefined, 0);
      expect(stats).not.toBeNull();
      expect(stats!.cpm).toBeDefined();
      expect(approx(stats!.cpm!, 1.0, 1e-3)).toBe(true);
    });

    it('should not compute Cpm when target is not provided', () => {
      const stats = computeAdvancedStats(0, 1, -3.0, 3.0);
      expect(stats).not.toBeNull();
      expect(stats!.cpm).toBeUndefined();
    });
  });

  describe('calculateDescriptiveStats', () => {
    it('should calculate mean and std correctly', () => {
      const data = [1, 2, 3, 4, 5];
      const stats = calculateDescriptiveStats(data);
      expect(stats).not.toBeNull();
      expect(stats!.mean).toBe(3);
      expect(approx(stats!.std, 1.4142, 1e-3)).toBe(true);
    });

    it('should handle single data point', () => {
      const stats = calculateDescriptiveStats([5]);
      expect(stats).not.toBeNull();
      expect(stats!.mean).toBe(5);
      expect(stats!.std).toBe(0);
    });

    it('should return null for empty array', () => {
      const stats = calculateDescriptiveStats([]);
      expect(stats).toBeNull();
    });
  });

  describe('generateHistogram', () => {
    it('should generate histogram bins', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const histogram = generateHistogram(data, 5);
      expect(histogram.bins).toHaveLength(5);
      expect(histogram.min).toBe(1);
      expect(histogram.max).toBe(10);

      const totalCount = histogram.bins.reduce((sum, bin) => sum + bin.count, 0);
      expect(totalCount).toBe(data.length);
    });

    it('should handle empty data', () => {
      const histogram = generateHistogram([], 10);
      expect(histogram.bins).toHaveLength(0);
      expect(histogram.min).toBe(0);
      expect(histogram.max).toBe(0);
    });
  });
});
