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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as DuplicateIcon,
  KeyboardArrowUp as MoveUpIcon,
  KeyboardArrowDown as MoveDownIcon,
  HelpOutline as HelpIcon,
  RadioButtonUnchecked as UnfocusedIcon,
  RadioButtonChecked as FocusedIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Calculate as CalculateIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import GoalSeekDialog from './GoalSeekDialog';
import { useApp } from '../context/AppContext';
import { useNotify } from '../context/NotifyContext';
import { computeStats } from '../utils/stats';
import { getCapabilityColor } from '../theme';
import { formatValue } from '../utils/rendering';

interface ScenarioManagerProps {
  fullView?: boolean;
}

export default function ScenarioManager({ fullView = false }: ScenarioManagerProps) {
  const { state, dispatch } = useApp();
  const notify = useNotify();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; id: string } | null>(null);
  const [editValues, setEditValues] = useState({
    name: '',
    mean: 0,
    std: 1,
    lsl: 0,
    usl: 0,
  });
  const [editInputs, setEditInputs] = useState({
    mean: '0',
    std: '1',
    lsl: '0',
    usl: '0',
  });
  const [goalSeekDialogOpen, setGoalSeekDialogOpen] = useState(false);
  const [goalSeekScenario, setGoalSeekScenario] = useState<(typeof state.scenarios)[0] | null>(
    null,
  );
  const [newScenario, setNewScenario] = useState({
    name: '',
    mean: state.mean,
    std: state.std,
    lsl: state.lsl,
    usl: state.usl,
  });

  const handleAddScenario = () => {
    dispatch({
      type: 'ADD_SCENARIO',
      payload: {
        ...newScenario,
        name: newScenario.name || `Scenario ${state.scenarios.length + 1}`,
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

  const handleDuplicateScenario = (scenario: (typeof state.scenarios)[0]) => {
    dispatch({
      type: 'ADD_SCENARIO',
      payload: {
        name: `${scenario.name} (Copy)`,
        mean: scenario.mean,
        std: scenario.std,
        lsl: scenario.lsl,
        usl: scenario.usl,
        overallStd: scenario.overallStd,
        sampleSize: scenario.sampleSize,
        visible: true,
      },
    });
  };

  const handleStartEdit = (scenario: (typeof state.scenarios)[0]) => {
    setEditingScenarioId(scenario.id);
    setEditValues({
      name: scenario.name,
      mean: scenario.mean,
      std: scenario.std,
      lsl: scenario.lsl,
      usl: scenario.usl,
    });
    setEditInputs({
      mean: scenario.mean.toString(),
      std: scenario.std.toString(),
      lsl: scenario.lsl.toString(),
      usl: scenario.usl.toString(),
    });
  };

  const handleSaveEdit = () => {
    if (editingScenarioId) {
      dispatch({
        type: 'UPDATE_SCENARIO',
        payload: {
          id: editingScenarioId,
          updates: editValues,
        },
      });
      setEditingScenarioId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingScenarioId(null);
  };

  const handleOpenGoalSeek = (scenario: (typeof state.scenarios)[0]) => {
    setGoalSeekScenario(scenario);
    setGoalSeekDialogOpen(true);
  };

  const handleApplyGoalSeek = (updates: Partial<(typeof state.scenarios)[0]>) => {
    if (goalSeekScenario) {
      dispatch({
        type: 'UPDATE_SCENARIO',
        payload: {
          id: goalSeekScenario.id,
          updates,
        },
      });
    }
  };

  const handleCloseGoalSeek = () => {
    setGoalSeekDialogOpen(false);
    setGoalSeekScenario(null);
  };

  const renderScenarioCard = (scenario: (typeof state.scenarios)[0], index: number) => {
    const stats = computeStats(scenario.mean, scenario.std, scenario.lsl, scenario.usl);
    const isEditing = fullView && editingScenarioId === scenario.id;
    const cardPadding = 1.5;
    const isFocused = state.focusedScenarioId === scenario.id;

    return (
      <Card
        key={scenario.id}
        variant="outlined"
        sx={{
          opacity: scenario.visible ? 1 : 0.55,
          borderLeft: `4px solid ${scenario.color}`,
          borderColor: isFocused ? 'primary.main' : undefined,
          borderLeftColor: scenario.color,
          boxShadow: isFocused ? (t) => `0 0 0 1px ${t.palette.primary.main}` : 'none',
          transition: 'opacity 0.2s, box-shadow 0.2s',
          '&:hover': { boxShadow: isFocused ? undefined : 'none' },
        }}
      >
        <CardContent sx={{ p: cardPadding, '&:last-child': { pb: cardPadding } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', mt: -0.5 }}>
              <Tooltip title="Move up" placement="left">
                <span>
                  <IconButton
                    size="small"
                    sx={{ p: 0.25 }}
                    disabled={index === 0}
                    onClick={() =>
                      dispatch({
                        type: 'MOVE_SCENARIO',
                        payload: { id: scenario.id, direction: -1 },
                      })
                    }
                    aria-label={`Move ${scenario.name} up`}
                  >
                    <MoveUpIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move down" placement="left">
                <span>
                  <IconButton
                    size="small"
                    sx={{ p: 0.25 }}
                    disabled={index === state.scenarios.length - 1}
                    onClick={() =>
                      dispatch({
                        type: 'MOVE_SCENARIO',
                        payload: { id: scenario.id, direction: 1 },
                      })
                    }
                    aria-label={`Move ${scenario.name} down`}
                  >
                    <MoveDownIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <Stack spacing={1.5}>
                  <TextField
                    label="Name"
                    value={editValues.name}
                    onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    size="small"
                    fullWidth
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="μ"
                      type="number"
                      value={editInputs.mean}
                      onChange={(e) => {
                        setEditInputs({ ...editInputs, mean: e.target.value });
                        const val = parseFloat(e.target.value);
                        if (isFinite(val)) {
                          setEditValues({ ...editValues, mean: val });
                        }
                      }}
                      onBlur={(e) => {
                        if (!e.target.value.trim()) {
                          const scenario = state.scenarios.find((s) => s.id === editingScenarioId);
                          if (scenario) {
                            setEditInputs({ ...editInputs, mean: scenario.mean.toString() });
                            setEditValues({ ...editValues, mean: scenario.mean });
                          }
                        }
                      }}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="σ"
                      type="number"
                      value={editInputs.std}
                      onChange={(e) => {
                        setEditInputs({ ...editInputs, std: e.target.value });
                        const val = parseFloat(e.target.value);
                        if (isFinite(val) && val > 0) {
                          setEditValues({ ...editValues, std: val });
                        }
                      }}
                      onBlur={(e) => {
                        if (!e.target.value.trim()) {
                          const scenario = state.scenarios.find((s) => s.id === editingScenarioId);
                          if (scenario) {
                            setEditInputs({ ...editInputs, std: scenario.std.toString() });
                            setEditValues({ ...editValues, std: scenario.std });
                          }
                        }
                      }}
                      inputProps={{ min: 0.01, step: 0.01 }}
                      size="small"
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="LSL"
                      type="number"
                      value={editInputs.lsl}
                      onChange={(e) => {
                        setEditInputs({ ...editInputs, lsl: e.target.value });
                        const val = parseFloat(e.target.value);
                        if (isFinite(val)) {
                          setEditValues({ ...editValues, lsl: val });
                        }
                      }}
                      onBlur={(e) => {
                        if (!e.target.value.trim()) {
                          const scenario = state.scenarios.find((s) => s.id === editingScenarioId);
                          if (scenario) {
                            setEditInputs({ ...editInputs, lsl: scenario.lsl.toString() });
                            setEditValues({ ...editValues, lsl: scenario.lsl });
                          }
                        }
                      }}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="USL"
                      type="number"
                      value={editInputs.usl}
                      onChange={(e) => {
                        setEditInputs({ ...editInputs, usl: e.target.value });
                        const val = parseFloat(e.target.value);
                        if (isFinite(val)) {
                          setEditValues({ ...editValues, usl: val });
                        }
                      }}
                      onBlur={(e) => {
                        if (!e.target.value.trim()) {
                          const scenario = state.scenarios.find((s) => s.id === editingScenarioId);
                          if (scenario) {
                            setEditInputs({ ...editInputs, usl: scenario.usl.toString() });
                            setEditValues({ ...editValues, usl: scenario.usl });
                          }
                        }
                      }}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Stack>
              ) : (
                <>
                  <Typography variant="body1" fontWeight={600} noWrap>
                    {scenario.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    μ {formatValue(scenario.mean)} · σ {formatValue(scenario.std)}
                    {scenario.sampleSize ? ` · n=${scenario.sampleSize}` : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Spec {formatValue(scenario.lsl)} – {formatValue(scenario.usl)}
                  </Typography>
                  {stats && (
                    <Box sx={{ mt: 0.75, display: 'flex', gap: 0.5 }}>
                      {(
                        [
                          ['Cp', stats.cp],
                          ['Cpk', stats.cpk],
                        ] as const
                      ).map(([label, v]) => (
                        <Chip
                          key={label}
                          label={`${label} ${v.toFixed(2)}`}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.72rem',
                            height: 20,
                            fontWeight: 600,
                            color: getCapabilityColor(v),
                            borderColor: getCapabilityColor(v),
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Box>
            <Stack direction="row" spacing={0} sx={{ mr: -0.5, mt: -0.5 }}>
              {isEditing ? (
                <>
                  <Tooltip title="Save">
                    <IconButton
                      size="small"
                      onClick={handleSaveEdit}
                      color="primary"
                      aria-label="Save edits"
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton size="small" onClick={handleCancelEdit} aria-label="Cancel editing">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  {fullView && (
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleStartEdit(scenario)}
                        aria-label="Edit scenario"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip
                    title={
                      state.focusedScenarioId === scenario.id
                        ? 'Focused (drives main metrics)'
                        : 'Focus this scenario'
                    }
                  >
                    <IconButton
                      size="small"
                      onClick={() =>
                        dispatch({
                          type: 'SET_FOCUSED_SCENARIO',
                          payload: state.focusedScenarioId === scenario.id ? null : scenario.id,
                        })
                      }
                      aria-label={
                        state.focusedScenarioId === scenario.id
                          ? 'Unfocus scenario'
                          : 'Focus scenario'
                      }
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
                      onClick={() => dispatch({ type: 'TOGGLE_SCENARIO', payload: scenario.id })}
                      aria-label={scenario.visible ? 'Hide scenario' : 'Show scenario'}
                    >
                      {scenario.visible ? (
                        <VisibilityIcon fontSize="small" />
                      ) : (
                        <VisibilityOffIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="More actions">
                    <IconButton
                      size="small"
                      onClick={(e) => setMenu({ anchor: e.currentTarget, id: scenario.id })}
                      aria-label={`More actions for ${scenario.name}`}
                      aria-haspopup="menu"
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const menuScenario = menu ? state.scenarios.find((s) => s.id === menu.id) : undefined;
  const actionsMenu = (
    <Menu
      anchorEl={menu?.anchor}
      open={!!menuScenario}
      onClose={() => setMenu(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      {menuScenario && [
        <MenuItem
          key="goal"
          onClick={() => {
            handleOpenGoalSeek(menuScenario);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <CalculateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Goal seek…" secondary="Find μ or σ for a target Cpk" />
        </MenuItem>,
        <MenuItem
          key="dup"
          onClick={() => {
            handleDuplicateScenario(menuScenario);
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Duplicate" />
        </MenuItem>,
        <Divider key="div" />,
        <MenuItem
          key="del"
          onClick={() => {
            dispatch({ type: 'DELETE_SCENARIO', payload: menuScenario.id });
            notify(`Deleted “${menuScenario.name}”`, 'info', { undoable: true });
            setMenu(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>,
      ]}
    </Menu>
  );

  const scenarioList = (
    <Stack spacing={1.25}>
      {actionsMenu}
      {state.scenarios.map(renderScenarioCard)}
      {!fullView && (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          fullWidth
          size="small"
        >
          Add from Single Distribution
        </Button>
      )}
    </Stack>
  );

  const emptyState = (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        No scenarios yet. Add one to compare multiple distributions.
      </Typography>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenDialog} fullWidth>
        Add Scenario
      </Button>
    </Box>
  );

  if (fullView) {
    return (
      <Box>
        {state.scenarios.length === 0 ? emptyState : scenarioList}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
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
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setNewScenario({ ...newScenario, mean: state.mean });
                    }
                  }}
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
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setNewScenario({ ...newScenario, std: state.std });
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
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setNewScenario({ ...newScenario, lsl: state.lsl });
                    }
                  }}
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
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setNewScenario({ ...newScenario, usl: state.usl });
                    }
                  }}
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

        {/* Goal Seek Dialog */}
        {goalSeekScenario && (
          <GoalSeekDialog
            open={goalSeekDialogOpen}
            scenario={goalSeekScenario}
            onClose={handleCloseGoalSeek}
            onApply={handleApplyGoalSeek}
          />
        )}
      </Box>
    );
  }

  // Default accordion mode
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
        {state.scenarios.length === 0 ? emptyState : scenarioList}
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
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setNewScenario({ ...newScenario, mean: state.mean });
                    }
                  }}
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
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setNewScenario({ ...newScenario, std: state.std });
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
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setNewScenario({ ...newScenario, lsl: state.lsl });
                    }
                  }}
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
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setNewScenario({ ...newScenario, usl: state.usl });
                    }
                  }}
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
