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

export default function SpecLimitControls() {
  const { state, dispatch } = useApp();
  const [lslError, setLslError] = useState<string>('');
  const [uslError, setUslError] = useState<string>('');
  const [lslInput, setLslInput] = useState(state.lsl.toString());
  const [uslInput, setUslInput] = useState(state.usl.toString());

  useEffect(() => {
    setLslInput(state.lsl.toString());
  }, [state.lsl]);

  useEffect(() => {
    setUslInput(state.usl.toString());
  }, [state.usl]);

  const handleLslChange = (value: string) => {
    setLslInput(value);
    if (!value.trim()) {
      setLslError('');
      return;
    }
    const num = parseFloat(value);
    if (!isFinite(num)) {
      setLslError('LSL must be a finite number');
      return;
    }
    if (num >= state.usl) {
      setLslError('LSL must be less than USL');
      return;
    }
    setLslError('');
    dispatch({ type: 'SET_LSL', payload: num });
  };

  const handleUslChange = (value: string) => {
    setUslInput(value);
    if (!value.trim()) {
      setUslError('');
      return;
    }
    const num = parseFloat(value);
    if (!isFinite(num)) {
      setUslError('USL must be a finite number');
      return;
    }
    if (num <= state.lsl) {
      setUslError('USL must be greater than LSL');
      return;
    }
    setUslError('');
    dispatch({ type: 'SET_USL', payload: num });
  };

  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="speclimit-content"
        id="speclimit-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="h6">Spec Limits</Typography>
          <Tooltip title="Define the acceptable range for your process. Parts outside these limits are defects. You can also drag limits directly on the chart.">
            <IconButton size="small" sx={{ ml: 0.5 }} aria-label="Help for Spec Limits">
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
                LSL (Lower Spec Limit)
              </Typography>
              <Tooltip title="Minimum acceptable value. Parts below LSL are considered defects.">
                <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }} aria-label="Help for LSL">
                  <HelpIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Box>
                <TextField
                  type="number"
                  value={lslInput}
                  onChange={(e) => handleLslChange(e.target.value)}
                  onBlur={() => {
                    if (!lslInput.trim()) {
                      setLslInput(state.lsl.toString());
                      setLslError('');
                    }
                  }}
                  inputProps={{
                    step: 0.1,
                    'aria-label': 'Lower spec limit',
                  }}
                  size="small"
                  error={!!lslError}
                  sx={{ width: 100 }}
                />
                {lslError && (
                  <FormHelperText error sx={{ mx: 0, fontSize: '0.7rem' }}>
                    {lslError}
                  </FormHelperText>
                )}
                {!lslError && (
                  <FormHelperText sx={{ mx: 0, fontSize: '0.7rem' }}>
                    step: 0.1
                  </FormHelperText>
                )}
              </Box>
              <Slider
                value={state.lsl}
                onChange={(_, val) => {
                  setLslError('');
                  const numVal = val as number;
                  setLslInput(numVal.toString());
                  dispatch({ type: 'SET_LSL', payload: numVal });
                }}
                min={-10}
                max={10}
                step={0.1}
                sx={{ flex: 1, mt: 1.5 }}
                aria-label="Lower spec limit slider"
              />
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={500}>
                USL (Upper Spec Limit)
              </Typography>
              <Tooltip title="Maximum acceptable value. Parts above USL are considered defects.">
                <IconButton size="small" sx={{ ml: 0.5, p: 0.25 }} aria-label="Help for USL">
                  <HelpIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Box>
                <TextField
                  type="number"
                  value={uslInput}
                  onChange={(e) => handleUslChange(e.target.value)}
                  onBlur={() => {
                    if (!uslInput.trim()) {
                      setUslInput(state.usl.toString());
                      setUslError('');
                    }
                  }}
                  inputProps={{
                    step: 0.1,
                    'aria-label': 'Upper spec limit',
                  }}
                  size="small"
                  error={!!uslError}
                  sx={{ width: 100 }}
                />
                {uslError && (
                  <FormHelperText error sx={{ mx: 0, fontSize: '0.7rem' }}>
                    {uslError}
                  </FormHelperText>
                )}
                {!uslError && (
                  <FormHelperText sx={{ mx: 0, fontSize: '0.7rem' }}>
                    step: 0.1
                  </FormHelperText>
                )}
              </Box>
              <Slider
                value={state.usl}
                onChange={(_, val) => {
                  setUslError('');
                  const numVal = val as number;
                  setUslInput(numVal.toString());
                  dispatch({ type: 'SET_USL', payload: numVal });
                }}
                min={-10}
                max={10}
                step={0.1}
                sx={{ flex: 1, mt: 1.5 }}
                aria-label="Upper spec limit slider"
              />
            </Box>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
