import { useEffect, useState } from 'react';
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
  Chip,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { useCapabilitySubject } from '../hooks/useCapabilitySubject';
import {
  computeAdvancedStats,
  computeStats,
  cpConfidenceInterval,
  cpkConfidenceInterval,
} from '../utils/stats';
import { getCapabilityColor } from '../theme';
import { formatInterval, formatPercent, formatPpm } from '../utils/format';
import { formatValue } from '../utils/rendering';

interface AdvancedStatsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface StatRowProps {
  label: string;
  value: string;
  description?: string;
  capabilityValue?: number;
}

function StatRow({ label, value, description, capabilityValue }: StatRowProps) {
  const color =
    capabilityValue !== undefined && isFinite(capabilityValue)
      ? getCapabilityColor(capabilityValue)
      : undefined;

  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, gap: 2 }}
    >
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
        sx={{ color: color || 'text.primary', whiteSpace: 'nowrap' }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function Section({
  title,
  children,
  defaultExpanded = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
}

const ci = (interval: { lower: number; upper: number } | null) =>
  interval ? ` (95% CI ${formatInterval(interval.lower, interval.upper)})` : '';

export default function AdvancedStatsDialog({ open, onClose }: AdvancedStatsDialogProps) {
  const { state, dispatch } = useApp();
  const subject = useCapabilitySubject();
  const { mean, std, lsl, usl, overallStd, sampleSize, target } = subject;

  const [targetInput, setTargetInput] = useState(target?.toString() ?? '');
  useEffect(() => {
    setTargetInput(target?.toString() ?? '');
  }, [target]);

  const basic = computeStats(mean, std, lsl, usl);
  const adv = computeAdvancedStats(mean, std, lsl, usl, overallStd, target);
  const n = sampleSize && sampleSize >= 2 ? sampleSize : undefined;
  const histogram = subject.isScenario ? null : state.histogramData;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="span">
            Detailed Capability Analysis
          </Typography>
          <Chip
            size="small"
            label={subject.label}
            sx={subject.color ? { bgcolor: subject.color, color: '#fff' } : undefined}
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        {!basic || !adv ? (
          <Typography color="error">Invalid inputs — check σ &gt; 0 and USL &gt; LSL.</Typography>
        ) : (
          <>
            <Section title="Capability (within σ)">
              <StatRow
                label="Cp"
                value={basic.cp.toFixed(3)}
                capabilityValue={basic.cp}
                description={`Tolerance ÷ 6σ. If Cp < 1, the spec is narrower than the process spread.${n ? ci(cpConfidenceInterval(basic.cp, n)) : ''}`}
              />
              <Divider />
              <StatRow
                label="Cpk"
                value={basic.cpk.toFixed(3)}
                capabilityValue={basic.cpk}
                description={`min(CPU, CPL). Cpk < Cp means the process is off-centre.${n ? ci(cpkConfidenceInterval(basic.cpk, n)) : ''}`}
              />
              <Divider />
              <StatRow
                label="CPU"
                value={adv.cpu.toFixed(3)}
                capabilityValue={adv.cpu}
                description="Upper-side capability: (USL − μ) ÷ 3σ"
              />
              <Divider />
              <StatRow
                label="CPL"
                value={adv.cpl.toFixed(3)}
                capabilityValue={adv.cpl}
                description="Lower-side capability: (μ − LSL) ÷ 3σ"
              />
            </Section>

            <Section title="Performance (overall σ)">
              {overallStd === undefined && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  No imported data, so overall σ equals the model σ and Pp/Ppk match Cp/Cpk. Import
                  measurements to separate short-term from long-term variation.
                </Typography>
              )}
              <StatRow
                label="Pp"
                value={adv.pp.toFixed(3)}
                capabilityValue={adv.pp}
                description="Like Cp, but uses the overall (long-term) standard deviation"
              />
              <Divider />
              <StatRow
                label="Ppk"
                value={adv.ppk.toFixed(3)}
                capabilityValue={adv.ppk}
                description="Like Cpk, but uses the overall standard deviation. Ppk ≪ Cpk hints at instability."
              />
            </Section>

            <Section title="Expected Defects & Sigma Metrics">
              <StatRow
                label="PPM total"
                value={formatPpm(adv.dpmo)}
                description="Expected defective parts per million"
              />
              <Divider />
              <StatRow
                label="PPM below LSL"
                value={formatPpm(adv.ppmBelow)}
                description={`${formatPercent(basic.pctBelow)} of output`}
              />
              <Divider />
              <StatRow
                label="PPM above USL"
                value={formatPpm(adv.ppmAbove)}
                description={`${formatPercent(basic.pctAbove)} of output`}
              />
              <Divider />
              <StatRow
                label="Z.bench"
                value={adv.zBench.toFixed(2)}
                description="One-sided z with the same total defect rate (Minitab convention)"
              />
              <Divider />
              <StatRow
                label="Sigma level"
                value={`${adv.sigmaLevel.toFixed(2)}σ`}
                description="Equivalent centred process: distance to each limit, in σ, giving the same defect rate (no 1.5σ shift)"
              />
            </Section>

            <Section title="Taguchi Index (Cpm)" defaultExpanded={target !== undefined}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cpm penalises distance from a target value as well as spread. The target is also
                marked on the chart.
              </Typography>
              <TextField
                label="Target value (optional)"
                type="number"
                value={targetInput}
                onChange={(e) => {
                  setTargetInput(e.target.value);
                  const num = parseFloat(e.target.value);
                  if (!e.target.value.trim()) dispatch({ type: 'SET_TARGET', payload: undefined });
                  else if (isFinite(num)) dispatch({ type: 'SET_TARGET', payload: num });
                }}
                helperText={`Spec midpoint: ${formatValue((lsl + usl) / 2)}`}
                fullWidth
                sx={{ mb: 1 }}
              />
              {adv.cpm !== undefined && (
                <StatRow
                  label="Cpm"
                  value={adv.cpm.toFixed(3)}
                  capabilityValue={adv.cpm}
                  description="Considers both spread and centring on target"
                />
              )}
            </Section>

            {histogram && (
              <Section title="Imported Data">
                <StatRow label="Sample size" value={String(histogram.sampleSize)} />
                <Divider />
                <StatRow
                  label="σ within"
                  value={histogram.withinStd ? formatValue(histogram.withinStd) : '—'}
                  description="Average moving range ÷ 1.128 (assumes production order)"
                />
                <Divider />
                <StatRow
                  label="σ overall"
                  value={histogram.overallStd ? formatValue(histogram.overallStd) : '—'}
                  description="Sample standard deviation (n − 1)"
                />
                {histogram.normality && (
                  <>
                    <Divider />
                    <StatRow
                      label="Anderson–Darling"
                      value={`A² = ${histogram.normality.aSquared.toFixed(3)}`}
                      description={
                        histogram.normality.pValue < 0.05
                          ? `p ${histogram.normality.pValue < 0.005 ? '< 0.005' : `= ${histogram.normality.pValue.toFixed(3)}`} — data deviate from normality; treat PPM estimates with caution`
                          : `p = ${histogram.normality.pValue.toFixed(3)} — no evidence against normality`
                      }
                    />
                  </>
                )}
              </Section>
            )}
          </>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Capability Guidelines:
          </Typography>
          <Typography variant="caption" component="div">
            • <strong style={{ color: getCapabilityColor(1.33) }}>≥ 1.33:</strong> Good - Process is
            capable
          </Typography>
          <Typography variant="caption" component="div">
            • <strong style={{ color: getCapabilityColor(1.0) }}>1.0 - 1.33:</strong> Marginal - May
            need improvement
          </Typography>
          <Typography variant="caption" component="div">
            • <strong style={{ color: getCapabilityColor(0.9) }}>&lt; 1.0:</strong> Poor - Process
            not capable
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
