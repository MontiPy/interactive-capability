import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { presets } from '../utils/presets';
import { computeStats } from '../utils/stats';
import { useApp } from '../context/AppContext';

interface PresetScenarioDialogProps {
  open: boolean;
  onClose: () => void;
}

const SCENARIO_COLORS = [
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
];

export default function PresetScenarioDialog({ open, onClose }: PresetScenarioDialogProps) {
  const { state, dispatch } = useApp();

  const handleSelectPreset = (preset: typeof presets[0]) => {
    const colorIndex = state.scenarios.length % SCENARIO_COLORS.length;

    dispatch({
      type: 'ADD_SCENARIO',
      payload: {
        name: preset.name,
        mean: preset.state.mean || 0,
        std: preset.state.std || 1,
        lsl: preset.state.lsl || -3,
        usl: preset.state.usl || 3,
        color: SCENARIO_COLORS[colorIndex],
        visible: true,
      },
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Load Preset as Scenario</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a preset configuration to add as a new scenario:
        </Typography>
        <List disablePadding>
          {presets.map((preset) => {
            const stats = computeStats(
              preset.state.mean || 0,
              preset.state.std || 1,
              preset.state.lsl || -3,
              preset.state.usl || 3
            );

            return (
              <ListItemButton
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                sx={{
                  py: 1.5,
                  px: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight={600}>
                      {preset.name}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {preset.description}
                      </Typography>
                      {stats && (
                        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                          <Chip
                            label={`Cp: ${stats.cp.toFixed(2)}`}
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 18 }}
                          />
                          <Chip
                            label={`Cpk: ${stats.cpk.toFixed(2)}`}
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 18 }}
                          />
                          <Chip
                            label={`σ: ${preset.state.std}`}
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 18 }}
                          />
                        </Box>
                      )}
                    </>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
