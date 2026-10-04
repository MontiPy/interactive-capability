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
  Button,
  Tooltip,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { computeStats, computeAdvancedStats } from '../utils/stats';
import { getCapabilityColor } from '../theme';
import { formatPpm } from '../utils/format';
import { formatValue } from '../utils/rendering';

interface ComparisonStatsTableProps {
  onOpenExportMenu?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const headCellSx = { bgcolor: 'background.paper', fontWeight: 700, whiteSpace: 'nowrap' } as const;

export default function ComparisonStatsTable({ onOpenExportMenu }: ComparisonStatsTableProps) {
  const { state, dispatch } = useApp();
  const visibleScenarios = state.scenarios.filter((s) => s.visible);

  if (visibleScenarios.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {state.scenarios.length === 0
            ? 'Scenario metrics will appear here once you add a scenario.'
            : 'No visible scenarios. Show a scenario to compare its metrics.'}
        </Typography>
      </Paper>
    );
  }

  // Highlight the best Cpk so the comparison has an obvious answer
  const rows = visibleScenarios.map((scenario) => ({
    scenario,
    stats: computeStats(scenario.mean, scenario.std, scenario.lsl, scenario.usl),
    adv: computeAdvancedStats(
      scenario.mean,
      scenario.std,
      scenario.lsl,
      scenario.usl,
      scenario.overallStd
    ),
  }));
  const bestCpk = Math.max(...rows.map((r) => r.stats?.cpk ?? -Infinity));
  // Only call out a winner when it is unique
  const bestCount = rows.filter((r) => r.stats && Math.abs(r.stats.cpk - bestCpk) < 1e-9).length;

  return (
    <Paper
      elevation={1}
      sx={{ p: 2, maxHeight: { md: 'min(340px, 40vh)' }, display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h6">Scenario Comparison</Typography>
          <Typography variant="caption" color="text.secondary">
            Click a row to focus a scenario and see its detailed metrics.
          </Typography>
        </Box>
        {onOpenExportMenu && (
          <Button size="small" onClick={onOpenExportMenu} endIcon={<DownloadIcon />}>
            Export
          </Button>
        )}
      </Box>
      <TableContainer sx={{ overflow: 'auto', minHeight: 0 }}>
        <Table size="small" stickyHeader aria-label="Scenario comparison">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headCellSx, position: 'sticky', left: 0, zIndex: 3 }}>
                Scenario
              </TableCell>
              {['Cp', 'Cpk', 'Pp', 'Ppk', 'PPM', 'μ', 'σ', 'LSL', 'USL'].map((h) => (
                <TableCell key={h} sx={headCellSx} align="right">
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ scenario, stats, adv }) => {
              if (!stats || !adv) return null;
              const isBest = bestCount === 1 && rows.length > 1 && stats.cpk === bestCpk;
              const capCell = (v: number) => (
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: getCapabilityColor(v), whiteSpace: 'nowrap' }}
                >
                  {v.toFixed(2)}
                </TableCell>
              );
              return (
                <TableRow
                  key={scenario.id}
                  hover
                  tabIndex={0}
                  role="button"
                  aria-label={`Focus ${scenario.name}`}
                  onClick={() => dispatch({ type: 'SET_FOCUSED_SCENARIO', payload: scenario.id })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      dispatch({ type: 'SET_FOCUSED_SCENARIO', payload: scenario.id });
                    }
                  }}
                  sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      bgcolor: 'background.paper',
                      borderLeft: `4px solid ${scenario.color}`,
                      maxWidth: 180,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap title={scenario.name}>
                        {scenario.name}
                      </Typography>
                      {isBest && (
                        <Tooltip title="Highest Cpk">
                          <Box
                            component="span"
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              color: 'success.main',
                              border: 1,
                              borderColor: 'success.main',
                              borderRadius: 1,
                              px: 0.5,
                              flexShrink: 0,
                            }}
                          >
                            BEST
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  {capCell(stats.cp)}
                  {capCell(stats.cpk)}
                  <TableCell align="right">{adv.pp.toFixed(2)}</TableCell>
                  <TableCell align="right">{adv.ppk.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {formatPpm(adv.dpmo)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary' }}>
                    {formatValue(scenario.mean)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary' }}>
                    {formatValue(scenario.std)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary' }}>
                    {formatValue(scenario.lsl)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary' }}>
                    {formatValue(scenario.usl)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
