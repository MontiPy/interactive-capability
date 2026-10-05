import { describe, it, expect } from 'vitest';
import {
  erf,
  phi,
  computeStats,
  computeAdvancedStats,
  calculateDescriptiveStats,
  generateHistogram,
  erfc,
  normalQuantile,
  movingRangeSigma,
  chiSquareQuantile,
  cpConfidenceInterval,
  cpkConfidenceInterval,
  andersonDarling,
  parseNumericData,
  summarizeData,
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

const relClose = (a: number, b: number, rel: number) => Math.abs(a - b) <= Math.abs(b) * rel;

describe('tail accuracy', () => {
  it('erfc keeps relative precision far into the tail', () => {
    // Reference values from high-precision tables
    expect(relClose(erfc(3), 2.209049699858544e-5, 1e-6)).toBe(true);
    expect(relClose(erfc(5), 1.537459794428035e-12, 1e-6)).toBe(true);
    expect(erfc(-2)).toBeCloseTo(2 - erfc(2), 12);
  });

  it('phi is accurate at 6σ (where 1 - phi used to cancel)', () => {
    expect(relClose(phi(-6), 9.865876450377e-10, 1e-6)).toBe(true);
  });

  it('computes DPMO for a Six Sigma (Cp = 2) process', () => {
    const adv = computeAdvancedStats(0, 0.5, -3, 3)!;
    // 2 × Φ(−6) × 1e6 ≈ 0.001973 ppm
    expect(relClose(adv.dpmo, 0.0019731752, 1e-5)).toBe(true);
    expect(adv.dpmo).toBeGreaterThan(0);
  });

  it('pctAbove stays positive and accurate for very capable processes', () => {
    const stats = computeStats(0, 0.4, -5, 5)!; // 12.5σ to each limit
    expect(stats.pctAbove).toBeGreaterThan(0);
    expect(stats.pctAbove).toBeLessThan(1e-20);
  });
});

describe('normalQuantile', () => {
  it('inverts phi across the range', () => {
    for (const p of [1e-9, 1e-4, 0.01, 0.2, 0.5, 0.8, 0.99, 1 - 1e-6]) {
      expect(relClose(phi(normalQuantile(p)), p, 1e-6)).toBe(true);
    }
  });

  it('returns known values and handles bounds', () => {
    expect(normalQuantile(0.975)).toBeCloseTo(1.959964, 5);
    expect(normalQuantile(0.5)).toBeCloseTo(0, 10);
    expect(normalQuantile(0)).toBe(-Infinity);
    expect(normalQuantile(1)).toBe(Infinity);
  });
});

describe('sigma metrics', () => {
  it('reports a centred Cp = 1 process as 3σ with Z.bench ≈ 2.78', () => {
    const adv = computeAdvancedStats(0, 1, -3, 3)!;
    expect(adv.sigmaLevel).toBeCloseTo(3, 4);
    expect(adv.zBench).toBeCloseTo(2.782, 3);
    expect(adv.cpu).toBeCloseTo(1, 10);
    expect(adv.cpl).toBeCloseTo(1, 10);
    expect(adv.ppmBelow + adv.ppmAbove).toBeCloseTo(adv.dpmo, 6);
  });

  it('uses overall σ for Pp/Ppk when supplied', () => {
    const adv = computeAdvancedStats(0, 1, -3, 3, 1.5)!;
    expect(adv.pp).toBeCloseTo(6 / 9, 10);
    expect(adv.ppk).toBeCloseTo(2 / 3, 10);
  });
});

describe('movingRangeSigma', () => {
  it('divides the average moving range by d2 = 1.128', () => {
    // moving ranges: 2, 2, 2 → MR̄ = 2
    expect(movingRangeSigma([1, 3, 1, 3])).toBeCloseTo(2 / 1.128, 10);
  });

  it('returns null for fewer than two points', () => {
    expect(movingRangeSigma([5])).toBeNull();
    expect(movingRangeSigma([])).toBeNull();
  });
});

describe('confidence intervals', () => {
  it('approximates chi-square quantiles (Wilson–Hilferty)', () => {
    expect(chiSquareQuantile(0.025, 49)).toBeCloseTo(31.555, 1);
    expect(chiSquareQuantile(0.975, 49)).toBeCloseTo(70.222, 1);
  });

  it('computes the Cp interval with the chi-square method', () => {
    const ci = cpConfidenceInterval(1, 50)!;
    expect(ci.lower).toBeCloseTo(0.8025, 3);
    expect(ci.upper).toBeCloseTo(1.1971, 3);
  });

  it("computes the Cpk interval with Bissell's approximation", () => {
    const ci = cpkConfidenceInterval(1, 50)!;
    expect(ci.lower).toBeCloseTo(0.7815, 3);
    expect(ci.upper).toBeCloseTo(1.2185, 3);
  });

  it('narrows as the sample grows and rejects tiny samples', () => {
    const small = cpkConfidenceInterval(1.33, 30)!;
    const large = cpkConfidenceInterval(1.33, 300)!;
    expect(large.upper - large.lower).toBeLessThan(small.upper - small.lower);
    expect(cpConfidenceInterval(1, 1)).toBeNull();
  });
});

describe('andersonDarling', () => {
  const normalScores = (n: number) =>
    Array.from({ length: n }, (_, i) => normalQuantile((i + 0.5) / n));

  it('does not reject ideal normal data', () => {
    const result = andersonDarling(normalScores(60))!;
    expect(result.pValue).toBeGreaterThan(0.5);
  });

  it('rejects strongly skewed data', () => {
    const skewed = Array.from({ length: 60 }, (_, i) => Math.exp((i / 60) * 6));
    expect(andersonDarling(skewed)!.pValue).toBeLessThan(0.01);
  });

  it('requires at least 8 non-constant points', () => {
    expect(andersonDarling([1, 2, 3])).toBeNull();
    expect(andersonDarling(Array(20).fill(4))).toBeNull();
  });
});

describe('generateHistogram robustness', () => {
  it('handles constant data without NaN bins', () => {
    const h = generateHistogram([5, 5, 5, 5], 4);
    expect(h.bins.every((b) => isFinite(b.start) && isFinite(b.end))).toBe(true);
    expect(h.bins.reduce((sum, b) => sum + b.count, 0)).toBe(4);
  });

  it('chooses a bin count automatically', () => {
    const data = Array.from({ length: 100 }, (_, i) => i);
    expect(generateHistogram(data).bins).toHaveLength(10);
  });

  it('handles large arrays without overflowing the stack', () => {
    const data = Array.from({ length: 300_000 }, (_, i) => i % 997);
    const h = generateHistogram(data);
    expect(h.min).toBe(0);
    expect(h.max).toBe(996);
  });
});

describe('parseNumericData', () => {
  it('accepts mixed separators and counts non-numeric tokens', () => {
    const result = parseNumericData('value\n1.5, 2;3\t4 "5"\nabc 1e-3');
    expect(result.values).toEqual([1.5, 2, 3, 4, 5, 0.001]);
    expect(result.invalidCount).toBe(2);
  });

  it('rejects partially numeric tokens that parseFloat would accept', () => {
    expect(parseNumericData('12abc 7').values).toEqual([7]);
  });
});

describe('summarizeData', () => {
  it('separates within and overall σ', () => {
    // A trending series: small point-to-point changes, large overall spread
    const data = Array.from({ length: 40 }, (_, i) => i * 0.5 + (i % 2) * 0.1);
    const summary = summarizeData(data)!;
    expect(summary.sampleSize).toBe(40);
    expect(summary.overallStd!).toBeGreaterThan(summary.withinStd! * 5);
    expect(summary.std).toBe(summary.withinStd);
    expect(summary.min).toBe(0);
  });

  it('returns null for constant data', () => {
    expect(summarizeData([3, 3, 3])).toBeNull();
  });
});
