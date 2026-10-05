import { Box, Paper, Typography, Chip, Button, Tooltip } from '@mui/material';
import {
  Download as DownloadIcon,
  Insights as InsightsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { useCapabilitySubject } from '../hooks/useCapabilitySubject';
import {
  computeStats,
  computeAdvancedStats,
  cpConfidenceInterval,
  cpkConfidenceInterval,
} from '../utils/stats';
import { CAPABILITY_GOOD, getCapabilityColor, getCapabilityVerdict } from '../theme';
import { formatInterval, formatPercent, formatPpm } from '../utils/format';
import { formatValue } from '../utils/rendering';
import ComparisonStatsTable from './ComparisonStatsTable';

interface StatsDisplayProps {
  onOpenAdvanced: () => void;
  onOpenExportMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface StatCardProps {
  label: string;
  value: string;
  capabilityValue?: number;
  caption?: string;
  tooltip?: string;
}

function StatCard({ label, value, capabilityValue, caption, tooltip }: StatCardProps) {
  const color =
    capabilityValue !== undefined && isFinite(capabilityValue)
      ? getCapabilityColor(capabilityValue)
      : undefined;

  const card = (
    <Paper
      elevation={1}
      sx={{
        flex: '1 1 120px',
        minWidth: 110,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
      >
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color: color || 'text.primary' }}>
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {caption}
        </Typography>
      )}
    </Paper>
  );

  return tooltip ? (
    <Tooltip title={tooltip} arrow>
      {card}
    </Tooltip>
  ) : (
    card
  );
}

/** One-sentence, actionable reading of the current indices */
function buildInsight(cp: number, cpk: number, mean: number, lsl: number, usl: number): string {
  const midpoint = (lsl + usl) / 2;
  if (mean < lsl || mean > usl) {
    return `The mean lies outside the spec limits, so most output is out of spec. Re-centre the process near ${formatValue(midpoint)} first.`;
  }
  if (cpk >= CAPABILITY_GOOD) {
    return `Meets the ${CAPABILITY_GOOD} benchmark with ${(cpk - CAPABILITY_GOOD).toFixed(2)} of headroom.`;
  }
  if (cp >= CAPABILITY_GOOD) {
    return `Spread is fine but the process is off-centre: moving μ from ${formatValue(mean)} to ${formatValue(midpoint)} would raise Cpk to ${cp.toFixed(2)}.`;
  }
  const requiredStd = (usl - lsl) / (6 * CAPABILITY_GOOD);
  return `Variation is too large for the tolerance: even when centred, σ must be ≤ ${formatValue(requiredStd)} to reach Cpk ${CAPABILITY_GOOD}.`;
}

export default function StatsDisplay({ onOpenAdvanced, onOpenExportMenu }: StatsDisplayProps) {
  const { state, dispatch } = useApp();
  const subject = useCapabilitySubject();

  // In comparison mode with no focused scenario, show comparison table
  if (state.activeTab === 'comparison' && !subject.isScenario) {
    return <ComparisonStatsTable onOpenExportMenu={onOpenExportMenu} />;
  }

  const { mean, std, lsl, usl, overallStd, sampleSize, target } = subject;
  const stats = computeStats(mean, std, lsl, usl);
  const adv = computeAdvancedStats(mean, std, lsl, usl, overallStd, target);
  const hasData = sampleSize !== undefined && sampleSize >= 2;
  const cpCI = stats && hasData ? cpConfidenceInterval(stats.cp, sampleSize) : null;
  const cpkCI = stats && hasData ? cpkConfidenceInterval(stats.cpk, sampleSize) : null;
  const ciText = (ci: { lower: number; upper: number } | null) =>
    ci ? `95% CI ${formatInterval(ci.lower, ci.upper)}` : undefined;

  const verdict = stats ? getCapabilityVerdict(stats.cpk) : null;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6">Capability Metrics</Typography>
          {subject.isScenario && (
            <Chip
              label={subject.label}
              size="small"
              onDelete={() => dispatch({ type: 'SET_FOCUSED_SCENARIO', payload: null })}
              deleteIcon={
                <Tooltip
                  title={
                    state.activeTab === 'comparison' ? 'Back to comparison table' : 'Clear focus'
                  }
                >
                  <CloseIcon />
                </Tooltip>
              }
              sx={{
                bgcolor: subject.color || 'primary.main',
                color: '#fff',
                fontWeight: 600,
                maxWidth: 220,
                '& .MuiChip-deleteIcon': {
                  color: 'rgba(255,255,255,0.8)',
                  '&:hover': { color: '#fff' },
                },
              }}
            />
          )}
          {stats && verdict && (
            <Chip
              label={
                verdict === 'capable'
                  ? 'Capable'
                  : verdict === 'marginal'
                    ? 'Marginal'
                    : 'Not capable'
              }
              size="small"
              variant="outlined"
              sx={{
                borderColor: getCapabilityColor(stats.cpk),
                color: getCapabilityColor(stats.cpk),
                fontWeight: 600,
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={onOpenAdvanced} startIcon={<InsightsIcon />}>
            Details
          </Button>
          <Button size="small" onClick={onOpenExportMenu} endIcon={<DownloadIcon />}>
            Export
          </Button>
        </Box>
      </Box>

      {stats && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }} aria-live="polite">
          {buildInsight(stats.cp, stats.cpk, mean, lsl, usl)}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <StatCard
          label="Cp"
          value={stats ? stats.cp.toFixed(3) : '—'}
          capabilityValue={stats?.cp}
          caption={ciText(cpCI)}
          tooltip="Potential capability: tolerance width ÷ 6σ. Ignores centering."
        />
        <StatCard
          label="Cpk"
          value={stats ? stats.cpk.toFixed(3) : '—'}
          capabilityValue={stats?.cpk}
          caption={ciText(cpkCI)}
          tooltip="Actual capability: distance from the mean to the nearest limit ÷ 3σ."
        />
        {adv && overallStd !== undefined && (
          <>
            <StatCard
              label="Pp"
              value={adv.pp.toFixed(3)}
              capabilityValue={adv.pp}
              tooltip="Performance using the overall (long-term) σ of the imported data."
            />
            <StatCard
              label="Ppk"
              value={adv.ppk.toFixed(3)}
              capabilityValue={adv.ppk}
              tooltip="Ppk uses the overall σ. Ppk well below Cpk suggests drift or instability over time."
            />
          </>
        )}
        {adv?.cpm !== undefined && (
          <StatCard
            label="Cpm"
            value={adv.cpm.toFixed(3)}
            capabilityValue={adv.cpm}
            tooltip={`Taguchi index: penalises distance from the target (${formatValue(target!)})`}
          />
        )}
        <StatCard
          label="PPM Out"
          value={adv ? formatPpm(adv.dpmo) : '—'}
          caption={adv ? `↓ ${formatPpm(adv.ppmBelow)} · ↑ ${formatPpm(adv.ppmAbove)}` : undefined}
          tooltip="Expected defective parts per million (below LSL · above USL)."
        />
        <StatCard
          label="Yield"
          value={stats ? formatPercent(stats.pctInside) : '—'}
          caption={stats ? `${formatPercent(stats.pctOutside)} outside` : undefined}
          tooltip="Expected fraction of parts inside the spec limits."
        />
      </Box>
    </Box>
  );
}
