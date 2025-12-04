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

export default function ComparisonStatsTable() {
  const { state, dispatch } = useApp();

  const visibleScenarios = state.scenarios.filter((s) => s.visible);

  if (visibleScenarios.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No visible scenarios to compare. Toggle scenario visibility to see comparison data.
        </Typography>
      </Paper>
    );
  }

  const handleFocusScenario = (scenarioId: string) => {
    dispatch({
      type: 'SET_FOCUSED_SCENARIO',
      payload: state.focusedScenarioId === scenarioId ? null : scenarioId,
    });
  };

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
            {visibleScenarios.map((scenario) => {
              const stats = computeStats(scenario.mean, scenario.std, scenario.lsl, scenario.usl);
              const advStats = computeAdvancedStats(
                scenario.mean,
                scenario.std,
                scenario.lsl,
                scenario.usl
              );
              const isFocused = state.focusedScenarioId === scenario.id;

              if (!stats || !advStats) return null;

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
                    sx={{
                      fontWeight: 600,
                      color: stats.cp >= 1.33 ? 'success.main' : stats.cp >= 1.0 ? 'warning.main' : 'error.main',
                    }}
                  >
                    {stats.cp.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: stats.cpk >= 1.33 ? 'success.main' : stats.cpk >= 1.0 ? 'warning.main' : 'error.main',
                    }}
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
}
