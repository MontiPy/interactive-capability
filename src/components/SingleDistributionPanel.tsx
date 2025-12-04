import { Grid, Stack, Button } from '@mui/material';
import DistributionControls from './DistributionControls';
import SpecLimitControls from './SpecLimitControls';
import DisplayControls from './DisplayControls';
import { useApp } from '../context/AppContext';

interface SingleDistributionPanelProps {
  onImportData: () => void;
  onAdvancedStats: () => void;
  onScenarioAdded?: () => void;
}

export default function SingleDistributionPanel({
  onImportData,
  onAdvancedStats,
  onScenarioAdded,
}: SingleDistributionPanelProps) {
  const { dispatch } = useApp();

  const handleAddToComparison = () => {
    dispatch({ type: 'ADD_CURRENT_AS_SCENARIO' });
    if (onScenarioAdded) {
      onScenarioAdded();
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Left sub-column */}
      <Grid item xs={12} md={6}>
        <Stack spacing={2}>
          <DistributionControls />
          <SpecLimitControls />
        </Stack>
      </Grid>

      {/* Right sub-column */}
      <Grid item xs={12} md={6}>
        <Stack spacing={2}>
          <DisplayControls />
        </Stack>
      </Grid>

      {/* Full width buttons at bottom */}
      <Grid item xs={12}>
        <Stack spacing={1}>
          <Button variant="outlined" fullWidth onClick={onImportData}>
            Import Data
          </Button>
          <Button variant="outlined" fullWidth onClick={onAdvancedStats}>
            View Advanced Stats
          </Button>
          <Button variant="contained" color="primary" fullWidth onClick={handleAddToComparison}>
            Add to Comparison
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
}
