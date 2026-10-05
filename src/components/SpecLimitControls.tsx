import { Accordion, AccordionSummary, AccordionDetails, Typography, Stack } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { limitSliderRange, roundToStep } from '../utils/format';
import { formatValue } from '../utils/rendering';
import ParameterField from './ParameterField';

export default function SpecLimitControls() {
  const { state, dispatch } = useApp();
  const range = limitSliderRange(state.mean, state.std, state.lsl, state.usl);

  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="speclimit-content"
        id="speclimit-header"
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Specification Limits
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <ParameterField
            label="Lower spec limit"
            symbol="LSL"
            help="Minimum acceptable value; parts below it are defects. You can also drag the red line on the chart."
            value={state.lsl}
            range={range}
            inputAriaLabel="Lower spec limit"
            sliderAriaLabel="Lower spec limit slider"
            validate={(v) => (v < state.usl ? null : `Must be below USL (${formatValue(state.usl)})`)}
            onChange={(v) => dispatch({ type: 'SET_LSL', payload: v })}
            clampSlider={(v) => roundToStep(Math.min(v, state.usl - range.step), range.step)}
          />
          <ParameterField
            label="Upper spec limit"
            symbol="USL"
            help="Maximum acceptable value; parts above it are defects. You can also drag the red line on the chart."
            value={state.usl}
            range={range}
            inputAriaLabel="Upper spec limit"
            sliderAriaLabel="Upper spec limit slider"
            validate={(v) => (v > state.lsl ? null : `Must be above LSL (${formatValue(state.lsl)})`)}
            onChange={(v) => dispatch({ type: 'SET_USL', payload: v })}
            clampSlider={(v) => roundToStep(Math.max(v, state.lsl + range.step), range.step)}
          />
          <Typography variant="caption" color="text.secondary">
            Tolerance {formatValue(state.usl - state.lsl)} · midpoint{' '}
            {formatValue((state.lsl + state.usl) / 2)}
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
