import { describe, it, expect } from 'vitest';
import {
  validateNumber,
  validateMean,
  validateStd,
  validateSpecLimit,
  validateSpecLimitRelationship,
  validateDistribution,
  safeParseFloat,
  clamp,
  formatNumber,
  formatPercentage,
} from './validation';

describe('validateNumber', () => {
  it('returns invalid for null/undefined/empty', () => {
    expect(validateNumber(null, 'Test').isValid).toBe(false);
    expect(validateNumber(undefined, 'Test').isValid).toBe(false);
    expect(validateNumber('', 'Test').isValid).toBe(false);
  });

  it('returns invalid for NaN/Infinity', () => {
    expect(validateNumber(NaN, 'Test').isValid).toBe(false);
    expect(validateNumber(Infinity, 'Test').isValid).toBe(false);
    expect(validateNumber(-Infinity, 'Test').isValid).toBe(false);
  });

  it('returns valid for finite numbers', () => {
    expect(validateNumber(0, 'Test').isValid).toBe(true);
    expect(validateNumber(42, 'Test').isValid).toBe(true);
    expect(validateNumber(-3.14, 'Test').isValid).toBe(true);
  });
});

describe('validateMean', () => {
  it('returns valid for normal values', () => {
    expect(validateMean(0).isValid).toBe(true);
    expect(validateMean(5).isValid).toBe(true);
    expect(validateMean(-10).isValid).toBe(true);
  });

  it('returns invalid for out-of-range values', () => {
    expect(validateMean(-150).isValid).toBe(false);
    expect(validateMean(150).isValid).toBe(false);
  });
});

describe('validateStd', () => {
  it('returns valid for positive values', () => {
    expect(validateStd(1).isValid).toBe(true);
    expect(validateStd(0.5).isValid).toBe(true);
    expect(validateStd(10).isValid).toBe(true);
  });

  it('returns invalid for zero', () => {
    expect(validateStd(0).isValid).toBe(false);
  });

  it('returns invalid for negative values', () => {
    expect(validateStd(-1).isValid).toBe(false);
  });
});

describe('validateSpecLimit', () => {
  it('returns valid for normal LSL values', () => {
    expect(validateSpecLimit(-3, 'LSL').isValid).toBe(true);
    expect(validateSpecLimit(0, 'LSL').isValid).toBe(true);
  });

  it('returns valid for normal USL values', () => {
    expect(validateSpecLimit(3, 'USL').isValid).toBe(true);
    expect(validateSpecLimit(10, 'USL').isValid).toBe(true);
  });
});

describe('validateSpecLimitRelationship', () => {
  it('returns valid when LSL < USL', () => {
    expect(validateSpecLimitRelationship(-3, 3).isValid).toBe(true);
    expect(validateSpecLimitRelationship(0, 10).isValid).toBe(true);
  });

  it('returns invalid when LSL >= USL', () => {
    expect(validateSpecLimitRelationship(3, 3).isValid).toBe(false);
    expect(validateSpecLimitRelationship(5, 3).isValid).toBe(false);
  });
});

describe('validateDistribution', () => {
  it('returns valid for proper distribution parameters', () => {
    expect(validateDistribution(0, 1, -3, 3).isValid).toBe(true);
    expect(validateDistribution(5, 2, 0, 10).isValid).toBe(true);
  });

  it('returns invalid for improper parameters', () => {
    expect(validateDistribution(0, 0, -3, 3).isValid).toBe(false); // std = 0
    expect(validateDistribution(0, 1, 3, -3).isValid).toBe(false); // LSL > USL
  });
});

describe('safeParseFloat', () => {
  it('parses valid numbers', () => {
    expect(safeParseFloat('42')).toBe(42);
    expect(safeParseFloat('3.14')).toBe(3.14);
    expect(safeParseFloat('-5')).toBe(-5);
  });

  it('returns NaN for invalid inputs', () => {
    expect(safeParseFloat('')).toBeNaN();
    expect(safeParseFloat('   ')).toBeNaN();
    expect(safeParseFloat('abc')).toBeNaN();
  });
});

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('returns min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('returns max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('formatNumber', () => {
  it('formats finite numbers', () => {
    expect(formatNumber(3.14159, 2)).toBe('3.14');
    expect(formatNumber(42, 0)).toBe('42');
    expect(formatNumber(-5.5, 1)).toBe('-5.5');
  });

  it('returns dash for non-finite values', () => {
    expect(formatNumber(NaN)).toBe('—');
    expect(formatNumber(Infinity)).toBe('—');
  });
});

describe('formatPercentage', () => {
  it('formats percentages', () => {
    expect(formatPercentage(50, 1)).toBe('50.0%');
    expect(formatPercentage(3.14159, 2)).toBe('3.14%');
  });

  it('returns dash for non-finite values', () => {
    expect(formatPercentage(NaN)).toBe('—');
  });
});
