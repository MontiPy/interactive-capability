import { Stack, Button, Typography, Box, Paper } from '@mui/material';
import { ArrowForward as ArrowForwardIcon, Add as AddIcon } from '@mui/icons-material';
import ScenarioManager from './ScenarioManager';
import { useApp } from '../context/AppContext';

interface ComparisonPanelProps {
  onImportData: () => void;
  onAdvancedStats: () => void;
}

export default function ComparisonPanel({ onImportData, onAdvancedStats }: ComparisonPanelProps) {
  const { state, dispatch } = useApp();

  const handleGoToSingleTab = () => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'single' });
  };

  const handleAddNewScenario = () => {
    dispatch({ type: 'ADD_NEW_SCENARIO' });
  };

  // Show empty state if no scenarios
  if (state.scenarios.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Paper elevation={0} sx={{ p: 4, bgcolor: 'action.hover' }}>
          <Typography variant="h6" gutterBottom>
            No scenarios yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create a new scenario to start comparing distributions.
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddNewScenario}
            >
              Add Blank Scenario
            </Button>
            <Typography variant="caption" color="text.secondary">
              or
            </Typography>
            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={handleGoToSingleTab}
            >
              Go to Single Distribution
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Scenario Manager - full view mode */}
      <ScenarioManager fullView />

      {/* Action buttons */}
      <Stack spacing={1}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<AddIcon />}
          onClick={handleAddNewScenario}
        >
          Add Blank Scenario
        </Button>
        <Button variant="outlined" fullWidth onClick={onImportData}>
          Import Data as Scenario
        </Button>
        <Button variant="outlined" fullWidth onClick={onAdvancedStats}>
          View Advanced Stats
        </Button>
      </Stack>
    </Stack>
  );
}
