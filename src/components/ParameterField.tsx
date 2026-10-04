import { useEffect, useState } from 'react';
import { Box, Slider, TextField, Tooltip, Typography, IconButton } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import { SliderRange, formatInput, syncInput } from '../utils/format';

interface ParameterFieldProps {
  label: string;
  /** Short symbol shown inside the input (e.g. μ) */
  symbol?: string;
  help: string;
  value: number;
  range: SliderRange;
  inputAriaLabel: string;
  sliderAriaLabel: string;
  /** Return an error message, or null when the value is acceptable */
  validate: (value: number) => string | null;
  onChange: (value: number) => void;
  /** Adjust a slider value before committing (e.g. keep LSL below USL) */
  clampSlider?: (value: number) => number;
}

/**
 * One labelled parameter: slider + numeric field kept in sync. Typing commits
 * valid values immediately; invalid text shows an inline error and is reverted
 * on blur.
 */
export default function ParameterField({
  label,
  symbol,
  help,
  value,
  range,
  inputAriaLabel,
  sliderAriaLabel,
  validate,
  onChange,
  clampSlider,
}: ParameterFieldProps) {
  const [input, setInput] = useState(formatInput(value));
  const [error, setError] = useState('');

  useEffect(() => {
    setInput((prev) => syncInput(prev, value));
    setError('');
  }, [value]);

  const handleText = (text: string) => {
    setInput(text);
    if (!text.trim()) {
      setError('');
      return;
    }
    const num = Number(text);
    const message = Number.isFinite(num) ? validate(num) : 'Enter a number';
    setError(message ?? '');
    if (!message) onChange(num);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Tooltip title={help}>
          <IconButton size="small" sx={{ ml: 0.25, p: 0.25 }} aria-label={`Help for ${label}`}>
            <HelpIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Slider
          value={Math.min(range.max, Math.max(range.min, value))}
          onChange={(_, v) => {
            const next = clampSlider ? clampSlider(v as number) : (v as number);
            setError('');
            setInput(formatInput(next));
            onChange(next);
          }}
          min={range.min}
          max={range.max}
          step={range.step}
          size="small"
          sx={{ flex: 1, ml: 0.5 }}
          aria-label={sliderAriaLabel}
        />
        <TextField
          type="number"
          value={input}
          onChange={(e) => handleText(e.target.value)}
          onBlur={() => {
            if (!input.trim() || error) {
              setInput(formatInput(value));
              setError('');
            }
          }}
          inputProps={{ step: range.step, 'aria-label': inputAriaLabel }}
          InputProps={
            symbol
              ? {
                  startAdornment: (
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 0.75 }}>
                      {symbol}
                    </Typography>
                  ),
                }
              : undefined
          }
          error={!!error}
          sx={{ width: 132, flexShrink: 0 }}
        />
      </Box>
      {error && (
        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }} role="alert">
          {error}
        </Typography>
      )}
    </Box>
  );
}
