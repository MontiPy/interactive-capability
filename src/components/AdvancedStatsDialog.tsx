import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Paper,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { computeStats, computeAdvancedStats } from '../utils/stats';
import { getCapabilityColor } from '../theme';

interface AdvancedStatsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AdvancedStatsDialog({ open, onClose }: AdvancedStatsDialogProps) {
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const basicStats = computeStats(state.mean, state.std, state.lsl, state.usl);
  const advancedStats = computeAdvancedStats(
    state.mean,
    state.std,
    state.lsl,
    state.usl,
    undefined,
    state.target
  );

  const StatRow = ({ label, value, description, isCapability = false }: {
    label: string;
    value: string | number;
    description?: string;
    isCapability?: boolean;
  }) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value as string);
    const color = isCapability && !isNaN(numValue) ? getCapabilityColor(numValue) : undefined;

    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
        <Box>
          <Typography variant="body1" fontWeight={600}>
            {label}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: color || 'text.primary' }}
        >
          {value}
        </Typography>
      </Box>
    );
  };

  // Filter sections based on search
  const matchesSearch = (text: string) => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const sections = [
    { id: 'basic', title: 'Basic Capability Indices', keywords: 'cp cpk capability process' },
    { id: 'performance', title: 'Process Performance Indices', keywords: 'pp ppk performance' },
    { id: 'sixsigma', title: 'Six Sigma Metrics', keywords: 'dpmo sigma level defects' },
    { id: 'taguchi', title: 'Taguchi Index (Cpm)', keywords: 'cpm taguchi target' },
  ];

  const visibleSections = sections.filter(
    (s) => matchesSearch(s.title) || matchesSearch(s.keywords)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Advanced Statistical Metrics</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* <Box sx={{ mb: 2, mt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Filter metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
            {sections.map((s) => (
              <Chip
                key={s.id}
                label={s.title.split(' ')[0]}
                size="small"
                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </Box> */}
        {/* {visibleSections.some((s) => s.id === 'basic') && (
          <Accordion id="basic">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Basic Capability Indices</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {basicStats ? (
                <Box>
                  <StatRow
                    label="Cp (Process Capability)"
                    value={basicStats.cp.toFixed(3)}
                    description="Measures potential capability if centered. Higher is better."
                    isCapability
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 0, pb: 1, display: 'block' }}>
                    ✓ So what? If Cp {'<'} 1.0, specs are too tight for this process variation.
                  </Typography>
                  <Divider />
                  <StatRow
                    label="Cpk (Process Capability Index)"
                    value={basicStats.cpk.toFixed(3)}
                    description="Actual capability accounting for off-center processes."
                    isCapability
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 0, pb: 1, display: 'block' }}>
                    ✓ So what? Cpk {'<'} Cp means the process is off-center. Improve centering first.
                  </Typography>
                  <Divider />
                  <StatRow
                    label="% Outside Spec"
                    value={`${basicStats.pctOutside.toFixed(3)}%`}
                    description="Expected defect rate if process is stable."
                  />
                  <Divider />
                  <StatRow
                    label="% Inside Spec"
                    value={`${basicStats.pctInside.toFixed(3)}%`}
                    description="Expected conformance rate (yield)."
                  />
                </Box>
              ) : (
                <Typography color="error">Invalid inputs</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        )} */}

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Process Performance Indices</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {advancedStats ? (
              <Box>
                <StatRow
                  label="Pp (Process Performance)"
                  value={advancedStats.pp.toFixed(3)}
                  description="Similar to Cp but uses sample standard deviation"
                  isCapability
                />
                <Divider />
                <StatRow
                  label="Ppk (Process Performance Index)"
                  value={advancedStats.ppk.toFixed(3)}
                  description="Similar to Cpk but uses sample standard deviation"
                  isCapability
                />
              </Box>
            ) : (
              <Typography color="error">Invalid inputs</Typography>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Six Sigma Metrics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {advancedStats ? (
              <Box>
                <StatRow
                  label="DPMO"
                  value={advancedStats.dpmo.toFixed(0)}
                  description="Defects Per Million Opportunities"
                />
                <Divider />
                <StatRow
                  label="Sigma Level"
                  value={advancedStats.sigmaLevel.toFixed(2) + 'σ'}
                  description="Process capability in sigma units"
                />
              </Box>
            ) : (
              <Typography color="error">Invalid inputs</Typography>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Taguchi Index (Cpm)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Cpm accounts for deviation from target value. Specify a target to calculate:
            </Typography>
            <TextField
              label="Target Value (optional)"
              type="number"
              value={state.target ?? ''}
              onChange={(e) =>
                dispatch({
                  type: 'SET_TARGET',
                  payload: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              fullWidth
              sx={{ mb: 2 }}
            />
            {state.target !== undefined && advancedStats?.cpm !== undefined ? (
              <Paper elevation={0} sx={{ bgcolor: 'grey.100', p: 2 }}>
                <StatRow
                  label="Cpm"
                  value={advancedStats.cpm.toFixed(3)}
                  description="Considers both spread and centering on target"
                  isCapability
                />
              </Paper>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Enter a target value to calculate Cpm
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Capability Guidelines:
          </Typography>
          <Typography variant="caption" component="div">
            • <strong style={{ color: getCapabilityColor(1.33) }}>≥ 1.33:</strong> Good - Process is capable
          </Typography>
          <Typography variant="caption" component="div">
            • <strong style={{ color: getCapabilityColor(1.0) }}>1.0 - 1.33:</strong> Marginal - May need improvement
          </Typography>
          <Typography variant="caption" component="div">
            • <strong style={{ color: getCapabilityColor(0.9) }}>&lt; 1.0:</strong> Poor - Process not capable
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
