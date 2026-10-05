import { Stack, Button, Box } from '@mui/material';
import { UploadFile as ImportIcon, CompareArrows as CompareIcon } from '@mui/icons-material';
import DistributionControls from './DistributionControls';
import SpecLimitControls from './SpecLimitControls';
import DisplayControls from './DisplayControls';
import { useApp } from '../context/AppContext';

interface SingleDistributionPanelProps {
  onImportData: () => void;
  onScenarioAdded?: () => void;
}

export default function SingleDistributionPanel({
  onImportData,
  onScenarioAdded,
}: SingleDistributionPanelProps) {
  const { state, dispatch } = useApp();

  const handleAddToComparison = () => {
    dispatch({ type: 'ADD_CURRENT_AS_SCENARIO' });
    onScenarioAdded?.();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Stack spacing={1.5} sx={{ flex: 1 }}>
        <DistributionControls />
        <SpecLimitControls />
        <DisplayControls />
      </Stack>

      {/* Primary actions stay reachable however far the panel is scrolled */}
      <Box
        sx={{
          position: { md: 'sticky' },
          bottom: 0,
          mt: 2,
          pt: 1.5,
          pb: 0.5,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1,
        }}
      >
        <Stack spacing={1}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<CompareIcon />}
            onClick={handleAddToComparison}
          >
            Save as Scenario for Comparison
          </Button>
          <Button variant="outlined" fullWidth startIcon={<ImportIcon />} onClick={onImportData}>
            {state.histogramData ? 'Replace Imported Data' : 'Import Measurement Data'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
