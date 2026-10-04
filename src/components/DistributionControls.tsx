import { Accordion, AccordionSummary, AccordionDetails, Typography, Stack } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { meanSliderRange, stdSliderRange } from '../utils/format';
import ParameterField from './ParameterField';

export default function DistributionControls() {
  const { state, dispatch } = useApp();
  const meanRange = meanSliderRange(state.mean, state.std, state.lsl, state.usl);
  const stdRange = stdSliderRange(state.std, state.lsl, state.usl);

  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="distribution-content"
        id="distribution-header"
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Process Distribution
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <ParameterField
            label="Mean"
            symbol="μ"
            help="The centre of the process. Shifting the mean moves the whole curve left or right and changes Cpk (not Cp)."
            value={state.mean}
            range={meanRange}
            inputAriaLabel="Mean value"
            sliderAriaLabel="Mean slider"
            validate={() => null}
            onChange={(v) => dispatch({ type: 'SET_MEAN', payload: v })}
          />
          <ParameterField
            label={state.histogramData ? 'Std deviation (within)' : 'Std deviation'}
            symbol="σ"
            help="The spread of the process. Smaller σ narrows the curve and raises both Cp and Cpk."
            value={state.std}
            range={stdRange}
            inputAriaLabel="Standard deviation value"
            sliderAriaLabel="Standard deviation slider"
            validate={(v) => (v > 0 ? null : 'σ must be greater than zero')}
            onChange={(v) => dispatch({ type: 'SET_STD', payload: v })}
            clampSlider={(v) => Math.max(v, stdRange.min)}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
