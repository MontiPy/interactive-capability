import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
  Tooltip,
  IconButton,
  Switch,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';

export default function DisplayControls() {
  const { state, dispatch } = useApp();
  const isTickStepAuto = state.display.tickStep === null || state.display.tickStep === 0;

  const handleManualRangeChange = (field: 'displayMin' | 'displayMax', value: string) => {
    const num = parseFloat(value);
    if (isFinite(num)) {
      dispatch({
        type: 'UPDATE_DISPLAY',
        payload: { [field]: num, autoRange: false }, // Disable auto when manually editing
      });
    }
  };

  const handleResetZoom = () => {
    dispatch({ type: 'RESET_DISPLAY' });
  };

  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="display-content"
        id="display-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="h6">Chart Display</Typography>
          <Tooltip title="Control the chart viewport, axis ticks, and display helpers.">
            <IconButton size="small" sx={{ ml: 0.5 }} aria-label="Help for Chart Display controls">
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2.5}>
          {/* A) Range Group */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Viewport Range
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.display.autoRange}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_DISPLAY',
                        payload: { autoRange: e.target.checked },
                      })
                    }
                    size="small"
                    aria-label="Auto range toggle"
                  />
                }
                label={<Typography variant="caption">Auto Range</Typography>}
                labelPlacement="start"
                sx={{ m: 0 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Min"
                type="number"
                value={state.display.displayMin.toFixed(2)}
                onChange={(e) => handleManualRangeChange('displayMin', e.target.value)}
                disabled={state.display.autoRange}
                inputProps={{
                  step: 0.5,
                  'aria-label': 'Viewport minimum',
                }}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Max"
                type="number"
                value={state.display.displayMax.toFixed(2)}
                onChange={(e) => handleManualRangeChange('displayMax', e.target.value)}
                disabled={state.display.autoRange}
                inputProps={{
                  step: 0.5,
                  'aria-label': 'Viewport maximum',
                }}
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
            {state.display.autoRange && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Auto uses max(μ±6σ, LSL−10% / USL+10%)
              </Typography>
            )}
          </Box>

          {/* B) Zoom Group */}
          <Box>
            <Button
              variant="outlined"
              startIcon={<ResetIcon />}
              onClick={handleResetZoom}
              fullWidth
              size="small"
              aria-label="Reset zoom and viewport"
            >
              Reset Zoom
            </Button>
          </Box>

          <Divider />

          {/* C) Axis/Ticks Group */}
          <Box>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Axis Ticks
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!isTickStepAuto}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_DISPLAY',
                      payload: { tickStep: e.target.checked ? 1 : null },
                    })
                  }
                  size="small"
                  aria-label="Manual tick step"
                />
              }
              label={<Typography variant="body2">Manual tick spacing</Typography>}
            />
            {!isTickStepAuto && (
              <TextField
                label="Tick Step"
                type="number"
                value={state.display.tickStep || ''}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_DISPLAY',
                    payload: { tickStep: parseFloat(e.target.value) || null },
                  })
                }
                placeholder="e.g., 0.5"
                inputProps={{ step: 0.1, min: 0.01, 'aria-label': 'Tick step value' }}
                size="small"
                fullWidth
                sx={{ mt: 1 }}
                helperText="Distance between axis tick marks"
              />
            )}
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={state.display.showGrid}
                onChange={(e) =>
                  dispatch({
                    type: 'UPDATE_DISPLAY',
                    payload: { showGrid: e.target.checked },
                  })
                }
                size="small"
                aria-label="Show grid"
              />
            }
            label={<Typography variant="body2">Show grid lines</Typography>}
          />

          <Divider />

          {/* D) Helpers Subsection */}
          <Box>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Display Helpers
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={state.display.fitToMean}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_DISPLAY',
                      payload: { fitToMean: e.target.checked },
                    })
                  }
                  size="small"
                  aria-label="Fit to mean"
                />
              }
              label={<Typography variant="body2">Fit to μ ± Nσ (overrides Auto Range)</Typography>}
            />
            {state.display.fitToMean && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, ml: 3 }}>
                <Typography variant="body2">N =</Typography>
                <TextField
                  type="number"
                  value={state.display.fitMultiplier}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_DISPLAY',
                      payload: { fitMultiplier: parseFloat(e.target.value) || 4 },
                    })
                  }
                  inputProps={{
                    step: 0.5,
                    min: 0.5,
                    max: 10,
                    'aria-label': 'Fit multiplier',
                  }}
                  size="small"
                  sx={{ width: 80 }}
                />
              </Box>
            )}
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
