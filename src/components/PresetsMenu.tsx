import { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  Box,
  Typography,
  Chip,
  Snackbar,
  Alert,
  ListItemIcon,
} from '@mui/material';
import {
  BookmarkBorder as BookmarkIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { presets } from '../utils/presets';
import { computeStats } from '../utils/stats';

export default function PresetsMenu() {
  const { state, dispatch } = useApp();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [loadedPresetName, setLoadedPresetName] = useState('');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectPreset = (preset: typeof presets[0]) => {
    dispatch({ type: 'LOAD_PRESET', payload: preset.state });
    setLoadedPresetName(preset.name);
    setToastOpen(true);
    handleClose();
  };

  // Check if current state matches a preset
  const isPresetActive = (preset: typeof presets[0]) => {
    return (
      preset.state.mean === state.mean &&
      preset.state.std === state.std &&
      preset.state.lsl === state.lsl &&
      preset.state.usl === state.usl
    );
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<BookmarkIcon />}
        onClick={handleClick}
        aria-label="Load preset configuration"
      >
        Load Preset
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 320 },
        }}
      >
        {presets.map((preset) => {
          const stats = computeStats(
            preset.state.mean || 0,
            preset.state.std || 1,
            preset.state.lsl || -3,
            preset.state.usl || 3
          );
          const isActive = isPresetActive(preset);

          return (
            <MenuItem
              key={preset.name}
              onClick={() => handleSelectPreset(preset)}
              sx={{
                py: 1.5,
                px: 2,
                bgcolor: isActive ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {isActive && (
                <ListItemIcon>
                  <CheckIcon color="primary" fontSize="small" />
                </ListItemIcon>
              )}
              <Box sx={{ ml: isActive ? 0 : 4 }}>
                <Typography variant="body1" fontWeight={600}>
                  {preset.name}
                </Typography>
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
              </Box>
            </MenuItem>
          );
        })}
      </Menu>

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Preset "{loadedPresetName}" loaded successfully
        </Alert>
      </Snackbar>
    </>
  );
}
