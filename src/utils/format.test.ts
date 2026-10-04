import { describe, it, expect } from 'vitest';
import {
  formatPercent,
  formatPpm,
  limitSliderRange,
  meanSliderRange,
  niceStep,
  roundToStep,
  stdSliderRange,
} from './format';
import { formatTickLabel, pxToValue, valueToPx } from './rendering';

describe('formatting', () => {
  it('formats percentages adaptively', () => {
    expect(formatPercent(12.345)).toBe('12.35%');
    expect(formatPercent(0.0013499)).toBe('0.0013%');
    expect(formatPercent(1e-9)).toBe('<0.000001%');
    expect(formatPercent(0)).toBe('0%');
  });

  it('formats PPM adaptively', () => {
    expect(formatPpm(2699.8)).toBe('2,700');
    expect(formatPpm(3.4)).toBe('3.4');
    expect(formatPpm(0.00197)).toBe('0.0020');
    expect(formatPpm(1e-9)).toBe('<0.001');
  });

  it('picks nice steps and rounds cleanly', () => {
    expect(niceStep(12)).toBe(0.1);
    expect(niceStep(0.03)).toBeCloseTo(0.0002, 12);
    expect(niceStep(500)).toBe(5);
    expect(roundToStep(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(roundToStep(1.23456, 0.005)).toBe(1.235);
  });

  it('formats tick labels with precision matching the step', () => {
    expect(formatTickLabel(0.005, 'auto', 0.005)).toBe('0.005');
    expect(formatTickLabel(2, 'auto', 0.5)).toBe('2.0');
    expect(formatTickLabel(-0.0000001, 'auto', 1)).toBe('0');
    expect(formatTickLabel(250, 'auto', 50)).toBe('250');
  });

  it('converts between pixels and values', () => {
    expect(pxToValue(250, 500, -5, 5)).toBe(0);
    expect(valueToPx(pxToValue(123, 640, 2, 9), 640, 2, 9)).toBeCloseTo(123, 9);
  });
});

describe('slider ranges', () => {
  it('reproduces sensible defaults for the standard normal', () => {
    expect(meanSliderRange(0, 1, -3, 3)).toEqual({ min: -9, max: 9, step: 0.1 });
    expect(stdSliderRange(1, -3, 3).max).toBe(3);
    expect(limitSliderRange(0, 1, -3, 3)).toEqual({ min: -8, max: 8, step: 0.1 });
  });

  it('scales to real-world magnitudes', () => {
    const mean = meanSliderRange(250.02, 0.004, 249.98, 250.06);
    expect(mean.min).toBeLessThan(250.02);
    expect(mean.max).toBeGreaterThan(250.02);
    expect(mean.step).toBeLessThan(0.01);

    const std = stdSliderRange(0.004, 249.98, 250.06);
    expect(std.min).toBeLessThanOrEqual(0.004);
    expect(std.max).toBeGreaterThanOrEqual(0.04);
  });

  it('always contains the current value', () => {
    const r = meanSliderRange(100, 1, -3, 3);
    expect(r.max).toBeGreaterThanOrEqual(100);
  });
});
