import { useMemo, useCallback, memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { RadioButtonChecked as FocusedIcon } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { computeStats, computeAdvancedStats } from '../utils/stats';
import { CAPABILITY_THRESHOLDS } from '../constants';

export default memo(function ComparisonStatsTable() {
  const { state, dispatch } = useApp();

  // Memoize visible scenarios
  const visibleScenarios = useMemo(
    () => state.scenarios.filter((s) => s.visible),
    [state.scenarios]
  );

  // Memoize computed stats for all visible scenarios
  const scenarioStats = useMemo(() => {
    return visibleScenarios.map((scenario) => ({
      scenario,
      stats: computeStats(scenario.mean, scenario.std, scenario.lsl, scenario.usl),
      advStats: computeAdvancedStats(scenario.mean, scenario.std, scenario.lsl, scenario.usl),
    }));
  }, [visibleScenarios]);

  const handleFocusScenario = useCallback((scenarioId: string) => {
    dispatch({
      type: 'SET_FOCUSED_SCENARIO',
      payload: state.focusedScenarioId === scenarioId ? null : scenarioId,
    });
  }, [dispatch, state.focusedScenarioId]);

  if (visibleScenarios.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No visible scenarios to compare. Toggle scenario visibility to see comparison data.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, maxHeight: '300px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Scenario Comparison
      </Typography>
      <TableContainer sx={{ maxHeight: '250px', overflowY: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: 'background.paper' }}></TableCell>
              <TableCell sx={{ bgcolor: 'background.paper' }}>Scenario</TableCell>
              <TableCell sx={{ bgcolor: 'background.paper' }} align="right">μ</TableCell>
              <TableCell sx={{ bgcolor: 'background.paper' }} align="right">σ</TableCell>
              <TableCell sx={{ bgcolor: 'background.paper' }} align="right">LSL</TableCell>
              <TableCell sx={{ bgcolor: 'background.paper' }} align="right">USL</TableCell>
              <TableCell sx={{ bgcolor: 'background.paper' }} align="right">Cp</TableCell>
              <TableCell sx={{ bgcolor: 'background.paper' }} align="right">Cpk</TableCell>
              <TableCell sx={{ bgcolor: 'background.paper' }} align="right">Pp</TableCell>
              <TableCell sx={{ bgcolor: 'background.paper' }} align="right">Ppk</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scenarioStats.map(({ scenario, stats, advStats }) => {
              const isFocused = state.focusedScenarioId === scenario.id;

              if (!stats || !advStats) return null;

              const getCapabilityColor = (value: number) => 
                value >= CAPABILITY_THRESHOLDS.good ? 'success.main' 
                : value >= CAPABILITY_THRESHOLDS.acceptable ? 'warning.main' 
                : 'error.main';

              return (
                <TableRow
                  key={scenario.id}
                  sx={{
                    bgcolor: isFocused ? 'action.selected' : 'transparent',
                    borderLeft: `4px solid ${scenario.color}`,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleFocusScenario(scenario.id)}
                >
                  <TableCell padding="checkbox">
                    <Tooltip title={isFocused ? 'Focused (click to unfocus)' : 'Click to focus'}>
                      <IconButton size="small" color={isFocused ? 'primary' : 'default'}>
                        <FocusedIcon fontSize="small" sx={{ opacity: isFocused ? 1 : 0.3 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={isFocused ? 600 : 400}>
                      {scenario.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{scenario.mean.toFixed(2)}</TableCell>
                  <TableCell align="right">{scenario.std.toFixed(2)}</TableCell>
                  <TableCell align="right">{scenario.lsl.toFixed(2)}</TableCell>
                  <TableCell align="right">{scenario.usl.toFixed(2)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 600, color: getCapabilityColor(stats.cp) }}
                  >
                    {stats.cp.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 600, color: getCapabilityColor(stats.cpk) }}
                  >
                    {stats.cpk.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">{advStats.pp.toFixed(2)}</TableCell>
                  <TableCell align="right">{advStats.ppk.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Click a row to focus that scenario and view detailed metrics.
        </Typography>
      </Box>
    </Paper>
  );
});
