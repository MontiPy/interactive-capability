import { Stack, Button, Typography, Box, Paper } from '@mui/material';
import { ArrowForward as ArrowForwardIcon, Add as AddIcon, BookmarkBorder as PresetIcon } from '@mui/icons-material';
import ScenarioManager from './ScenarioManager';
import PresetScenarioDialog from './PresetScenarioDialog';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

interface ComparisonPanelProps {
  onImportData: () => void;
}

export default function ComparisonPanel({ onImportData }: ComparisonPanelProps) {
  const { state, dispatch } = useApp();
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Scrollable scenario list */}
      <Box sx={{ flex: 1, overflowY: 'auto', pb: 2 }}>
        <ScenarioManager fullView />
      </Box>

      {/* Sticky action buttons at bottom */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          pt: 2,
          pb: 1,
          zIndex: 1,
        }}
      >
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
          <Button
            variant="outlined"
            fullWidth
            startIcon={<PresetIcon />}
            onClick={() => setPresetDialogOpen(true)}
          >
            Load Preset as Scenario
          </Button>
          <Button variant="outlined" fullWidth onClick={onImportData}>
            Import Data as Scenario
          </Button>
        </Stack>
      </Box>

      <PresetScenarioDialog
        open={presetDialogOpen}
        onClose={() => setPresetDialogOpen(false)}
      />
    </Box>
  );
}
