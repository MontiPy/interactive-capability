import { useMemo, memo } from 'react';
import { Box, Paper, Typography, Chip, Button } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { computeStats } from '../utils/stats';
import { getCapabilityColor } from '../theme';
import ComparisonStatsTable from './ComparisonStatsTable';

interface StatsDisplayProps {
  onOpenAdvanced?: () => void;
  onOpenExportMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// Memoized StatCard component for better performance
interface StatCardProps {
  label: string;
  value: string;
  isCapability?: boolean;
}

const StatCard = memo(function StatCard({ label, value, isCapability = false }: StatCardProps) {
  const numValue = parseFloat(value);
  const color = isCapability && !isNaN(numValue) ? getCapabilityColor(numValue) : undefined;

  return (
    <Paper
      elevation={1}
      sx={{
        flex: '1 1 150px',
        minWidth: 140,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ color: color || 'text.primary' }}
      >
        {value}
      </Typography>
    </Paper>
  );
});

export default function StatsDisplay({ onOpenExportMenu }: StatsDisplayProps) {
  const { state } = useApp();

  // Memoize stats calculation - must be called unconditionally before any returns
  const { stats, displayLabel, colorAccent } = useMemo(() => {
    if (state.focusedScenarioId) {
      // Show focused scenario metrics
      const focusedScenario = state.scenarios.find((s) => s.id === state.focusedScenarioId);
      if (focusedScenario) {
        return {
          stats: computeStats(
            focusedScenario.mean,
            focusedScenario.std,
            focusedScenario.lsl,
            focusedScenario.usl
          ),
          displayLabel: focusedScenario.name,
          colorAccent: focusedScenario.color,
        };
      }
    }
    // Show primary distribution metrics
    return {
      stats: computeStats(state.mean, state.std, state.lsl, state.usl),
      displayLabel: 'Primary Distribution',
      colorAccent: undefined,
    };
  }, [state.mean, state.std, state.lsl, state.usl, state.focusedScenarioId, state.scenarios]);

  // In comparison mode with no focused scenario, show comparison table
  if (state.activeTab === 'comparison' && !state.focusedScenarioId) {
    return <ComparisonStatsTable />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">Capability Metrics</Typography>
          {state.focusedScenarioId && (
            <Chip
              label={`Focused: ${displayLabel}`}
              size="small"
              sx={{
                bgcolor: colorAccent || 'primary.main',
                color: '#fff',
                fontWeight: 600,
              }}
            />
          )}
        </Box>
        <Button
          size="small"
          onClick={onOpenExportMenu}
          endIcon={<DownloadIcon />}
        >
          Export
        </Button>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <StatCard
          label="Cp"
          value={stats ? stats.cp.toFixed(3) : '—'}
          isCapability
        />
        <StatCard
          label="Cpk"
          value={stats ? stats.cpk.toFixed(3) : '—'}
          isCapability
        />
        <StatCard
          label="% Outside"
          value={stats ? `${stats.pctOutside.toFixed(2)}%` : '—'}
        />
        <StatCard
          label="% Inside"
          value={stats ? `${stats.pctInside.toFixed(2)}%` : '—'}
        />
        <StatCard
          label="% Above"
          value={stats ? `${stats.pctAbove.toFixed(2)}%` : '—'}
        />
        <StatCard
          label="% Below"
          value={stats ? `${stats.pctBelow.toFixed(2)}%` : '—'}
        />
      </Box>
    </Box>
  );
}
