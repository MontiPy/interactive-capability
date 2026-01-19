import { VALIDATION_LIMITS } from '../constants';

/**
 * Input validation utilities for distribution parameters
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a numeric input value
 */
export function validateNumber(value: unknown, fieldName: string): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));
  
  if (!isFinite(num)) {
    return { isValid: false, error: `${fieldName} must be a finite number` };
  }

  return { isValid: true };
}

/**
 * Validates mean (μ) parameter
 */
export function validateMean(value: number): ValidationResult {
  const baseValidation = validateNumber(value, 'Mean');
  if (!baseValidation.isValid) return baseValidation;

  if (value < VALIDATION_LIMITS.mean.min || value > VALIDATION_LIMITS.mean.max) {
    return {
      isValid: false,
      error: `Mean should be between ${VALIDATION_LIMITS.mean.min} and ${VALIDATION_LIMITS.mean.max}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates standard deviation (σ) parameter
 */
export function validateStd(value: number): ValidationResult {
  const baseValidation = validateNumber(value, 'Standard deviation');
  if (!baseValidation.isValid) return baseValidation;

  if (value <= 0) {
    return { isValid: false, error: 'Standard deviation must be greater than zero' };
  }

  if (value < VALIDATION_LIMITS.std.min) {
    return { isValid: false, error: `Standard deviation must be at least ${VALIDATION_LIMITS.std.min}` };
  }

  if (value > VALIDATION_LIMITS.std.max) {
    return { isValid: false, error: `Standard deviation should be at most ${VALIDATION_LIMITS.std.max}` };
  }

  return { isValid: true };
}

/**
 * Validates spec limit (LSL or USL)
 */
export function validateSpecLimit(value: number, limitName: 'LSL' | 'USL'): ValidationResult {
  const baseValidation = validateNumber(value, limitName);
  if (!baseValidation.isValid) return baseValidation;

  const limits = limitName === 'LSL' ? VALIDATION_LIMITS.lsl : VALIDATION_LIMITS.usl;
  
  if (value < limits.min || value > limits.max) {
    return {
      isValid: false,
      error: `${limitName} should be between ${limits.min} and ${limits.max}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates that LSL is less than USL
 */
export function validateSpecLimitRelationship(lsl: number, usl: number): ValidationResult {
  if (lsl >= usl) {
    return { isValid: false, error: 'LSL must be less than USL' };
  }

  return { isValid: true };
}

/**
 * Validates all distribution parameters together
 */
export function validateDistribution(
  mean: number,
  std: number,
  lsl: number,
  usl: number
): ValidationResult {
  const meanValidation = validateMean(mean);
  if (!meanValidation.isValid) return meanValidation;

  const stdValidation = validateStd(std);
  if (!stdValidation.isValid) return stdValidation;

  const lslValidation = validateSpecLimit(lsl, 'LSL');
  if (!lslValidation.isValid) return lslValidation;

  const uslValidation = validateSpecLimit(usl, 'USL');
  if (!uslValidation.isValid) return uslValidation;

  const relationshipValidation = validateSpecLimitRelationship(lsl, usl);
  if (!relationshipValidation.isValid) return relationshipValidation;

  return { isValid: true };
}

/**
 * Safely parses a string to number, returning NaN for invalid inputs
 */
export function safeParseFloat(value: string): number {
  if (!value || value.trim() === '') return NaN;
  
  const parsed = parseFloat(value);
  return parsed;
}

/**
 * Clamps a number to a range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Formats a number for display, handling edge cases
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return '—';
  return value.toFixed(decimals);
}

/**
 * Formats a percentage for display
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}
