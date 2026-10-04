import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Slider,
  TextField,
  Stack,
  Tooltip,
  IconButton,
  FormHelperText,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { formatInput, syncInput, meanSliderRange, stdSliderRange } from '../utils/format';

export default function DistributionControls() {
  const { state, dispatch } = useApp();
  const [meanError, setMeanError] = useState<string>('');
  const [stdError, setStdError] = useState<string>('');
  const [meanInput, setMeanInput] = useState(formatInput(state.mean));
  const [stdInput, setStdInput] = useState(formatInput(state.std));
  const meanRange = meanSliderRange(state.mean, state.std, state.lsl, state.usl);
  const stdRange = stdSliderRange(state.std, state.lsl, state.usl);

  useEffect(() => {
    setMeanInput((prev) => syncInput(prev, state.mean));
  }, [state.mean]);

  useEffect(() => {
    setStdInput((prev) => syncInput(prev, state.std));
  }, [state.std]);

  const handleMeanChange = (value: string) => {
    setMeanInput(value);
    if (!value.trim()) {
      setMeanError('');
      return;
    }
    const num = parseFloat(value);
    if (!isFinite(num)) {
      setMeanError('Mean must be a finite number');
      return;
    }
    setMeanError('');
    dispatch({ type: 'SET_MEAN', payload: num });
  };

  const handleStdChange = (value: string) => {
    setStdInput(value);
    if (!value.trim()) {
      setStdError('');
      return;
    }
    const num = parseFloat(value);
    if (!isFinite(num) || num < 0) {
      setStdError('Standard deviation must be a positive number');
      return;
    }
    if (num === 0) {
      setStdError('Standard deviation must be greater than zero');
      return;
    }
    setStdError('');
    dispatch({ type: 'SET_STD', payload: num });
  };

  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="distribution-content"
        id="distribution-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="h6">Distribution</Typography>
          <Tooltip title="Control the center (mean/μ) and spread (standard deviation/σ) of your process distribution. These define the shape of the normal curve.">
            <IconButton size="small" sx={{ ml: 0.5 }} aria-label="Help for Distribution controls">
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2.5}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={500}>
                Mean (μ)
              </Typography>
              <Tooltip title="The center point of the distribution. Shifting the mean moves the entire curve left or right.">
                <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }} aria-label="Help for Mean">
                  <HelpIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Slider
                value={state.mean}
                onChange={(_, val) => {
                  setMeanError('');
                  const numVal = val as number;
                  setMeanInput(formatInput(numVal));
                  dispatch({ type: 'SET_MEAN', payload: numVal });
                }}
                min={meanRange.min}
                max={meanRange.max}
                step={meanRange.step}
                sx={{ flex: 1, mt: 1.5 }}
                aria-label="Mean slider"
              />
              <Box>
                <TextField
                  type="number"
                  value={meanInput}
                  onChange={(e) => handleMeanChange(e.target.value)}
                  onBlur={() => {
                    if (!meanInput.trim()) {
                      setMeanInput(formatInput(state.mean));
                      setMeanError('');
                    }
                  }}
                  inputProps={{
                    step: meanRange.step,
                    'aria-label': 'Mean value',
                  }}
                  size="small"
                  error={!!meanError}
                  sx={{ width: 100 }}
                />
                {meanError && (
                  <FormHelperText error sx={{ mx: 0, fontSize: '0.7rem' }}>
                    {meanError}
                  </FormHelperText>
                )}
                {!meanError && (
                  <FormHelperText sx={{ mx: 0, fontSize: '0.7rem' }}>
                    step: {meanRange.step}
                  </FormHelperText>
                )}
              </Box>
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={500}>
                Std dev (σ)
              </Typography>
              <Tooltip title="The spread or variability of the distribution. Larger σ means wider spread and more variation.">
                <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }} aria-label="Help for Standard Deviation">
                  <HelpIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Slider
                value={state.std}
                onChange={(_, val) => {
                  setStdError('');
                  const numVal = val as number;
                  if (numVal > 0) {
                    setStdInput(formatInput(numVal));
                    dispatch({ type: 'SET_STD', payload: numVal });
                  }
                }}
                min={stdRange.min}
                max={stdRange.max}
                step={stdRange.step}
                sx={{ flex: 1, mt: 1.5 }}
                aria-label="Standard deviation slider"
              />
              <Box>
                <TextField
                  type="number"
                  value={stdInput}
                  onChange={(e) => handleStdChange(e.target.value)}
                  onBlur={() => {
                    if (!stdInput.trim()) {
                      setStdInput(formatInput(state.std));
                      setStdError('');
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent negative sign input
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  inputProps={{
                    step: stdRange.step,
                    min: 0,
                    'aria-label': 'Standard deviation value',
                  }}
                  size="small"
                  error={!!stdError}
                  sx={{ width: 100 }}
                />
                {stdError && (
                  <FormHelperText error sx={{ mx: 0, fontSize: '0.7rem' }}>
                    {stdError}
                  </FormHelperText>
                )}
                {!stdError && (
                  <FormHelperText sx={{ mx: 0, fontSize: '0.7rem' }}>
                    step: {stdRange.step}
                  </FormHelperText>
                )}
              </Box>
            </Box>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
