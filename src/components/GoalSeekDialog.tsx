import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Stack,
  Box,
  Typography,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import { Calculate as CalculateIcon } from '@mui/icons-material';
import { Scenario } from '../types';
import { solveForMean, solveForStd, GoalSeekResult } from '../utils/goalSeek';
import { computeStats } from '../utils/stats';
import { getCapabilityColor } from '../theme';

interface GoalSeekDialogProps {
  open: boolean;
  scenario: Scenario;
  onClose: () => void;
  onApply: (updates: Partial<Scenario>) => void;
}

type AdjustMode = 'mean' | 'std';

export default function GoalSeekDialog({
  open,
  scenario,
  onClose,
  onApply,
}: GoalSeekDialogProps) {
  const [targetCpk, setTargetCpk] = useState<string>('1.33');
  const [adjustMode, setAdjustMode] = useState<AdjustMode>('std');
  const [result, setResult] = useState<GoalSeekResult | null>(null);
  const [targetError, setTargetError] = useState<string>('');

  // Calculate current Cpk
  const currentStats = computeStats(scenario.mean, scenario.std, scenario.lsl, scenario.usl);
  const currentCpk = currentStats?.cpk ?? 0;

  // Run calculation when inputs change
  useEffect(() => {
    const target = parseFloat(targetCpk);

    // Validate target Cpk input
    if (!targetCpk || targetCpk.trim() === '') {
      setTargetError('');
      setResult(null);
      return;
    }

    if (isNaN(target) || target <= 0) {
      setTargetError('Target Cpk must be a positive number');
      setResult(null);
      return;
    }

    if (target > 3) {
      setTargetError('Target Cpk > 3.0 is unusually high. Are you sure?');
      // Continue with calculation despite warning
    } else {
      setTargetError('');
    }

    // Perform goal seek calculation
    let goalSeekResult: GoalSeekResult;

    if (adjustMode === 'mean') {
      goalSeekResult = solveForMean(target, scenario.lsl, scenario.usl, scenario.std, scenario.mean);
    } else {
      goalSeekResult = solveForStd(target, scenario.mean, scenario.lsl, scenario.usl);
    }

    setResult(goalSeekResult);
  }, [targetCpk, adjustMode, scenario]);

  const handleApply = () => {
    if (!result || !result.success) return;

    const updates: Partial<Scenario> = {};

    if (adjustMode === 'mean' && result.mean !== undefined) {
      updates.mean = result.mean;
    } else if (adjustMode === 'std' && result.std !== undefined) {
      updates.std = result.std;
    }

    onApply(updates);
    onClose();
  };

  const handleClose = () => {
    // Reset state
    setTargetCpk('1.33');
    setAdjustMode('std');
    setResult(null);
    setTargetError('');
    onClose();
  };

  const renderPreview = () => {
    if (!result) return null;

    if (!result.success) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Goal Not Achievable
          </Typography>
          <Typography variant="body2">{result.error}</Typography>
          {result.fallback && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="caption" display="block">
                Best achievable with {adjustMode === 'mean' ? 'centered mean' : 'minimum σ'}:
              </Typography>
              {result.fallback.mean !== undefined && (
                <Typography variant="body2">
                  μ = {result.fallback.mean.toFixed(3)}
                </Typography>
              )}
              {result.fallback.std !== undefined && (
                <Typography variant="body2">
                  σ = {result.fallback.std.toFixed(3)}
                </Typography>
              )}
              <Typography variant="body2" fontWeight={600}>
                Cpk = {result.fallback.achievedCpk.toFixed(3)}
              </Typography>
            </Box>
          )}
        </Alert>
      );
    }

    // Success case - show preview
    const previewMean = result.mean ?? scenario.mean;
    const previewStd = result.std ?? scenario.std;
    const previewCpk = result.achievedCpk ?? 0;

    return (
      <Box sx={{ mt: 2 }}>
        {result.warning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {result.warning}
          </Alert>
        )}

        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, borderColor: 'success.main', borderWidth: 2 }}
        >
          <Typography variant="subtitle2" fontWeight={700} color="success.main" gutterBottom>
            Proposed change
          </Typography>

          <Stack spacing={1}>
            {([
              ['Mean (μ)', scenario.mean, previewMean, adjustMode === 'mean'],
              ['Std Dev (σ)', scenario.std, previewStd, adjustMode === 'std'],
            ] as const).map(([label, before, after, changed]) => (
              <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2" fontWeight={changed ? 700 : 400}>
                  {changed ? (
                    <>
                      {before.toFixed(3)} → {after.toFixed(3)}{' '}
                      <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                        ({after - before >= 0 ? '+' : ''}
                        {(after - before).toFixed(3)})
                      </Box>
                    </>
                  ) : (
                    `${after.toFixed(3)} (unchanged)`
                  )}
                </Typography>
              </Box>
            ))}

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Typography variant="body2" fontWeight={600}>
                Achieved Cpk
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: getCapabilityColor(previewCpk) }}>
                {previewCpk.toFixed(3)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalculateIcon />
          Goal Seek: {scenario.name}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Current state */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              CURRENT VALUES
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">μ</Typography>
                <Typography variant="body1" fontWeight={600}>{scenario.mean.toFixed(3)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">σ</Typography>
                <Typography variant="body1" fontWeight={600}>{scenario.std.toFixed(3)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">LSL</Typography>
                <Typography variant="body1" fontWeight={600}>{scenario.lsl.toFixed(3)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">USL</Typography>
                <Typography variant="body1" fontWeight={600}>{scenario.usl.toFixed(3)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Cpk</Typography>
                <Typography
                  variant="body1"
                  fontWeight={700}
                  sx={{ color: getCapabilityColor(currentCpk) }}
                >
                  {currentCpk.toFixed(3)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Target Cpk input */}
          <TextField
            label="Target Cpk"
            type="number"
            value={targetCpk}
            onChange={(e) => setTargetCpk(e.target.value)}
            onBlur={() => {
              if (!targetCpk.trim()) {
                setTargetCpk('1.33');
                setTargetError('');
              }
            }}
            error={!!targetError}
            helperText={targetError || 'Enter desired capability index (e.g., 1.33 for good capability)'}
            inputProps={{
              min: 0.01,
              step: 0.01,
            }}
            fullWidth
          />

          {/* Adjustment mode selection */}
          <FormControl component="fieldset">
            <FormLabel component="legend">Adjust Parameter</FormLabel>
            <RadioGroup
              value={adjustMode}
              onChange={(e) => setAdjustMode(e.target.value as AdjustMode)}
            >
              <FormControlLabel
                value="mean"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Adjust Mean (μ)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Recenter the process while keeping variation constant
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="std"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Adjust Standard Deviation (σ)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reduce variation while keeping mean constant
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          {/* Preview/Results */}
          {renderPreview()}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={!result || !result.success}
          startIcon={<CalculateIcon />}
        >
          Apply Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
