import { Stack, Button, Typography, Box } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  BookmarkBorder as PresetIcon,
  UploadFile as ImportIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
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

  const addBlank = () => dispatch({ type: 'ADD_NEW_SCENARIO' });

  const secondaryActions = (
    <Stack direction="row" spacing={1}>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<PresetIcon />}
        onClick={() => setPresetDialogOpen(true)}
      >
        Preset
      </Button>
      <Button variant="outlined" fullWidth startIcon={<ImportIcon />} onClick={onImportData}>
        Import Data
      </Button>
    </Stack>
  );

  const presetDialog = (
    <PresetScenarioDialog open={presetDialogOpen} onClose={() => setPresetDialogOpen(false)} />
  );

  if (state.scenarios.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          border: 1,
          borderStyle: 'dashed',
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <CompareIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          No scenarios yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Compare process variants side by side, such as before vs. after an improvement or one
          line against another.
        </Typography>
        <Stack spacing={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={addBlank}>
            Add Blank Scenario
          </Button>
          {secondaryActions}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'single' })}
            sx={{ mt: 1 }}
          >
            Back to Single Distribution
          </Button>
        </Stack>
        {presetDialog}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Box sx={{ flex: 1, pb: 2 }}>
        <ScenarioManager fullView />
      </Box>

      {/* Sticky action buttons at bottom */}
      <Box
        sx={{
          position: { md: 'sticky' },
          bottom: 0,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          pt: 1.5,
          pb: 0.5,
          zIndex: 1,
        }}
      >
        <Stack spacing={1}>
          <Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={addBlank}>
            Add Blank Scenario
          </Button>
          {secondaryActions}
        </Stack>
      </Box>

      {presetDialog}
    </Box>
  );
}
