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
  Button,
} from '@mui/material';
import { RadioButtonChecked as FocusedIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { computeStats, computeAdvancedStats } from '../utils/stats';
import { getCapabilityColor } from '../theme';
import { formatPpm } from '../utils/format';
import { formatValue } from '../utils/rendering';

interface ComparisonStatsTableProps {
  onOpenExportMenu?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ComparisonStatsTable({ onOpenExportMenu }: ComparisonStatsTableProps) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Scenario Comparison</Typography>
        {onOpenExportMenu && (
          <Button size="small" onClick={onOpenExportMenu} endIcon={<DownloadIcon />}>
            Export
          </Button>
        )}
      </Box>
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
              <TableCell sx={{ bgcolor: 'background.paper' }} align="right">PPM</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleScenarios.map((scenario) => {
              const stats = computeStats(scenario.mean, scenario.std, scenario.lsl, scenario.usl);
              const advStats = computeAdvancedStats(
                scenario.mean,
                scenario.std,
                scenario.lsl,
                scenario.usl,
                scenario.overallStd
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
                      <IconButton
                        size="small"
                        color={isFocused ? 'primary' : 'default'}
                        aria-label={isFocused ? `Unfocus ${scenario.name}` : `Focus ${scenario.name}`}
                      >
                        <FocusedIcon fontSize="small" sx={{ opacity: isFocused ? 1 : 0.3 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={isFocused ? 600 : 400}>
                      {scenario.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatValue(scenario.mean)}</TableCell>
                  <TableCell align="right">{formatValue(scenario.std)}</TableCell>
                  <TableCell align="right">{formatValue(scenario.lsl)}</TableCell>
                  <TableCell align="right">{formatValue(scenario.usl)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: getCapabilityColor(stats.cp),
                    }}
                  >
                    {stats.cp.toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: getCapabilityColor(stats.cpk),
                    }}
                  >
                    {stats.cpk.toFixed(2)}
                  </TableCell>
                  <TableCell align="right">{advStats.pp.toFixed(2)}</TableCell>
                  <TableCell align="right">{advStats.ppk.toFixed(2)}</TableCell>
                  <TableCell align="right">{formatPpm(advStats.dpmo)}</TableCell>
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
