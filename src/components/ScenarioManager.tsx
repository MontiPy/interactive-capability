import { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as DuplicateIcon,
  DragIndicator as DragIcon,
  HelpOutline as HelpIcon,
  RadioButtonUnchecked as UnfocusedIcon,
  RadioButtonChecked as FocusedIcon,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { computeStats } from '../utils/stats';

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

export default function ScenarioManager() {
  const { state, dispatch } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newScenario, setNewScenario] = useState({
    name: '',
    mean: state.mean,
    std: state.std,
    lsl: state.lsl,
    usl: state.usl,
  });

  const handleAddScenario = () => {
    const colorIndex = state.scenarios.length % SCENARIO_COLORS.length;
    dispatch({
      type: 'ADD_SCENARIO',
      payload: {
        ...newScenario,
        name: newScenario.name || `Scenario ${state.scenarios.length + 1}`,
        color: SCENARIO_COLORS[colorIndex],
        visible: true,
      },
    });

    setNewScenario({
      name: '',
      mean: state.mean,
      std: state.std,
      lsl: state.lsl,
      usl: state.usl,
    });
    setDialogOpen(false);
  };

  const handleOpenDialog = () => {
    setNewScenario({
      name: `Scenario ${state.scenarios.length + 1}`,
      mean: state.mean,
      std: state.std,
      lsl: state.lsl,
      usl: state.usl,
    });
    setDialogOpen(true);
  };

  const handleDuplicateScenario = (scenario: typeof state.scenarios[0]) => {
    const colorIndex = state.scenarios.length % SCENARIO_COLORS.length;
    dispatch({
      type: 'ADD_SCENARIO',
      payload: {
        name: `${scenario.name} (Copy)`,
        mean: scenario.mean,
        std: scenario.std,
        lsl: scenario.lsl,
        usl: scenario.usl,
        color: SCENARIO_COLORS[colorIndex],
        visible: true,
      },
    });
  };

  return (
    <Accordion defaultExpanded={state.scenarios.length > 0}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="scenarios-content"
        id="scenarios-header"
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="h6">Scenarios</Typography>
          <Tooltip title="Compare multiple process configurations side-by-side. Add different distributions to see 'before vs after' improvements.">
            <IconButton size="small" sx={{ ml: 0.5 }} aria-label="Help for Scenarios">
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {state.scenarios.length === 0 ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No scenarios yet. Add one to compare multiple distributions.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              fullWidth
            >
              Add Scenario
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {state.scenarios.map((scenario) => {
              const stats = computeStats(scenario.mean, scenario.std, scenario.lsl, scenario.usl);
              return (
                <Card
                  key={scenario.id}
                  variant="outlined"
                  sx={{
                    opacity: scenario.visible ? 1 : 0.5,
                    borderLeft: `4px solid ${scenario.color}`,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <DragIcon
                        sx={{
                          color: 'text.secondary',
                          fontSize: 18,
                          mt: 0.5,
                          cursor: 'move',
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={600} noWrap>
                          {scenario.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          μ={scenario.mean.toFixed(2)}, σ={scenario.std.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          LSL={scenario.lsl.toFixed(2)}, USL={scenario.usl.toFixed(2)}
                        </Typography>
                        {stats && (
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={`Cp: ${stats.cp.toFixed(2)}`}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 18, mr: 0.5 }}
                            />
                            <Chip
                              label={`Cpk: ${stats.cpk.toFixed(2)}`}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                          </Box>
                        )}
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title={state.focusedScenarioId === scenario.id ? 'Focused (drives main metrics)' : 'Focus this scenario'}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              dispatch({
                                type: 'SET_FOCUSED_SCENARIO',
                                payload: state.focusedScenarioId === scenario.id ? null : scenario.id,
                              })
                            }
                            aria-label={state.focusedScenarioId === scenario.id ? 'Unfocus scenario' : 'Focus scenario'}
                            color={state.focusedScenarioId === scenario.id ? 'primary' : 'default'}
                          >
                            {state.focusedScenarioId === scenario.id ? (
                              <FocusedIcon fontSize="small" />
                            ) : (
                              <UnfocusedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={scenario.visible ? 'Hide' : 'Show'}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              dispatch({ type: 'TOGGLE_SCENARIO', payload: scenario.id })
                            }
                            aria-label={scenario.visible ? 'Hide scenario' : 'Show scenario'}
                          >
                            {scenario.visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicate">
                          <IconButton
                            size="small"
                            onClick={() => handleDuplicateScenario(scenario)}
                            aria-label="Duplicate scenario"
                          >
                            <DuplicateIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() =>
                              dispatch({ type: 'DELETE_SCENARIO', payload: scenario.id })
                            }
                            aria-label="Delete scenario"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              fullWidth
              size="small"
            >
              Add Scenario
            </Button>
          </Stack>
        )}

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Comparison Scenario</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Scenario Name"
                value={newScenario.name}
                onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                fullWidth
                size="small"
                placeholder="e.g., After Improvement"
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Mean (μ)"
                  type="number"
                  value={newScenario.mean}
                  onChange={(e) =>
                    setNewScenario({ ...newScenario, mean: parseFloat(e.target.value) })
                  }
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Std Dev (σ)"
                  type="number"
                  value={newScenario.std}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setNewScenario({ ...newScenario, std: val });
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent negative sign input
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  inputProps={{
                    min: 0.01,
                    step: 0.01,
                  }}
                  fullWidth
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="LSL"
                  type="number"
                  value={newScenario.lsl}
                  onChange={(e) =>
                    setNewScenario({ ...newScenario, lsl: parseFloat(e.target.value) })
                  }
                  fullWidth
                  size="small"
                />
                <TextField
                  label="USL"
                  type="number"
                  value={newScenario.usl}
                  onChange={(e) =>
                    setNewScenario({ ...newScenario, usl: parseFloat(e.target.value) })
                  }
                  fullWidth
                  size="small"
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddScenario} variant="contained">
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </AccordionDetails>
    </Accordion>
  );
}
