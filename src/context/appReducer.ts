import { AppState, AppAction, Scenario } from '../types';
import {
  computeHybridViewport,
  computeFitToMeanViewport,
  computeMultiDistributionViewport,
} from '../utils/viewport';
import { nextScenarioColor } from '../utils/colors';

export const initialState: AppState = {
  mean: 0,
  std: 1,
  lsl: -3,
  usl: 3,
  target: undefined,
  display: {
    displayMin: -6,
    displayMax: 6,
    autoRange: true, // Enable hybrid auto-viewport by default
    tickStep: null,
    tickFormat: 'auto',
    showGrid: true,
    fitToMean: false,
    fitMultiplier: 4,
  },
  scenarios: [],
  activeScenarioId: null,
  focusedScenarioId: null,
  histogramData: null,
  draggingLimit: null,
  activeTab: 'single',
};

function newScenarioId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `scenario-${crypto.randomUUID()}`;
  }
  return `scenario-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Helper to apply auto-range viewport when enabled
export function applyAutoRangeIfEnabled(state: AppState): AppState {
  // Hold the viewport still while a spec limit is dragged so the line stays
  // under the pointer; it is recomputed when the drag ends.
  if (!state.display.autoRange || state.draggingLimit) return state;

  let viewport;
  if (state.activeTab === 'comparison') {
    // Use multi-distribution viewport for comparison mode
    viewport = computeMultiDistributionViewport(state.scenarios);
  } else if (state.display.fitToMean) {
    // Fit to mean overrides hybrid auto-range
    viewport = computeFitToMeanViewport(state.mean, state.std, state.display.fitMultiplier);
  } else {
    viewport = computeHybridViewport(state.mean, state.std, state.lsl, state.usl);
    // Keep imported data fully in view
    const { histogramData } = state;
    if (histogramData?.min !== undefined && histogramData.max !== undefined) {
      viewport = {
        displayMin: Math.min(viewport.displayMin, histogramData.min),
        displayMax: Math.max(viewport.displayMax, histogramData.max),
      };
    }
  }

  return {
    ...state,
    display: {
      ...state.display,
      displayMin: viewport.displayMin,
      displayMax: viewport.displayMax,
    },
  };
}

function withScenario(
  state: AppState,
  scenario: Omit<Scenario, 'id' | 'color'> & { color?: string },
): AppState {
  const created: Scenario = {
    ...scenario,
    id: newScenarioId(),
    color: scenario.color ?? nextScenarioColor(state.scenarios),
  };
  return { ...state, scenarios: [...state.scenarios, created] };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MEAN':
      return applyAutoRangeIfEnabled({ ...state, mean: action.payload });

    case 'SET_STD':
      return applyAutoRangeIfEnabled({ ...state, std: action.payload });

    case 'SET_LSL':
      return applyAutoRangeIfEnabled({ ...state, lsl: action.payload });

    case 'SET_USL':
      return applyAutoRangeIfEnabled({ ...state, usl: action.payload });

    case 'SET_TARGET':
      return { ...state, target: action.payload };

    case 'UPDATE_DISPLAY': {
      const nextState = {
        ...state,
        display: { ...state.display, ...action.payload },
      };
      // Recompute the viewport when an auto-range input changes
      if (
        action.payload.autoRange ||
        action.payload.fitToMean !== undefined ||
        action.payload.fitMultiplier !== undefined
      ) {
        return applyAutoRangeIfEnabled(nextState);
      }
      return nextState;
    }

    case 'ADD_SCENARIO':
      return applyAutoRangeIfEnabled(withScenario(state, action.payload));

    case 'UPDATE_SCENARIO':
      // Trigger viewport recalculation in comparison mode
      return applyAutoRangeIfEnabled({
        ...state,
        scenarios: state.scenarios.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } : s,
        ),
      });

    case 'DELETE_SCENARIO':
      return applyAutoRangeIfEnabled({
        ...state,
        scenarios: state.scenarios.filter((s) => s.id !== action.payload),
        activeScenarioId: state.activeScenarioId === action.payload ? null : state.activeScenarioId,
        focusedScenarioId:
          state.focusedScenarioId === action.payload ? null : state.focusedScenarioId,
      });

    case 'TOGGLE_SCENARIO':
      return applyAutoRangeIfEnabled({
        ...state,
        scenarios: state.scenarios.map((s) =>
          s.id === action.payload ? { ...s, visible: !s.visible } : s,
        ),
      });

    case 'MOVE_SCENARIO': {
      const index = state.scenarios.findIndex((s) => s.id === action.payload.id);
      const target = index + action.payload.direction;
      if (index < 0 || target < 0 || target >= state.scenarios.length) return state;
      const scenarios = [...state.scenarios];
      [scenarios[index], scenarios[target]] = [scenarios[target], scenarios[index]];
      return { ...state, scenarios };
    }

    case 'SET_ACTIVE_SCENARIO':
      return { ...state, activeScenarioId: action.payload };

    case 'SET_FOCUSED_SCENARIO':
      return { ...state, focusedScenarioId: action.payload };

    case 'IMPORT_DATA': {
      const specs =
        action.specs && action.specs.usl > action.specs.lsl
          ? { lsl: action.specs.lsl, usl: action.specs.usl }
          : {};
      // Apply auto-range after data import
      return applyAutoRangeIfEnabled({
        ...state,
        ...specs,
        histogramData: action.payload,
        mean: action.payload.mean,
        std: action.payload.std,
      });
    }

    case 'CLEAR_DATA':
      return applyAutoRangeIfEnabled({ ...state, histogramData: null });

    case 'SET_DRAGGING_LIMIT':
      if (state.draggingLimit === action.payload) return state;
      return applyAutoRangeIfEnabled({ ...state, draggingLimit: action.payload });

    case 'RESET_DISPLAY':
      return applyAutoRangeIfEnabled({
        ...state,
        display: { ...initialState.display, autoRange: true },
      });

    case 'LOAD_PRESET':
      return applyAutoRangeIfEnabled({
        ...state,
        ...action.payload,
        // Presets describe a theoretical process, so drop any imported data
        histogramData: null,
        display: {
          ...state.display,
          ...action.payload.display,
          autoRange: true,
        },
      });

    case 'LOAD_FROM_URL':
      return applyAutoRangeIfEnabled({
        ...state,
        ...action.payload,
        display: { ...state.display, ...action.payload.display },
      });

    case 'SET_ACTIVE_TAB':
      return applyAutoRangeIfEnabled({ ...state, activeTab: action.payload });

    case 'ADD_CURRENT_AS_SCENARIO': {
      const overallStd = state.histogramData?.overallStd;
      const next = withScenario(state, {
        name: action.payload || `Scenario ${state.scenarios.length + 1}`,
        mean: state.mean,
        std: state.std,
        lsl: state.lsl,
        usl: state.usl,
        visible: true,
        ...(state.histogramData ? { overallStd, sampleSize: state.histogramData.sampleSize } : {}),
      });
      return applyAutoRangeIfEnabled({ ...next, activeTab: 'comparison' });
    }

    case 'IMPORT_DATA_AS_SCENARIO': {
      const { data, name } = action.payload;
      const hasSpecs =
        action.payload.lsl !== undefined &&
        action.payload.usl !== undefined &&
        action.payload.usl > action.payload.lsl;
      return applyAutoRangeIfEnabled(
        withScenario(state, {
          name: name || `Imported Scenario ${state.scenarios.length + 1}`,
          mean: data.mean,
          std: data.std,
          overallStd: data.overallStd,
          sampleSize: data.sampleSize,
          // Fall back to the current primary limits
          lsl: hasSpecs ? action.payload.lsl! : state.lsl,
          usl: hasSpecs ? action.payload.usl! : state.usl,
          visible: true,
        }),
      );
    }

    case 'ADD_NEW_SCENARIO':
      return applyAutoRangeIfEnabled(
        withScenario(state, {
          name: `Scenario ${state.scenarios.length + 1}`,
          mean: 0,
          std: 1,
          lsl: -3,
          usl: 3,
          visible: true,
        }),
      );

    case 'RESET_ALL':
      return applyAutoRangeIfEnabled({
        ...initialState,
        display: { ...initialState.display },
      });

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Undo / redo                                                         */
/* ------------------------------------------------------------------ */

export interface HistoryState {
  past: AppState[];
  present: AppState;
  future: AppState[];
  /** Coalescing key + timestamp of the last recorded undoable action */
  lastKey: string | null;
  lastTime: number;
}

export const HISTORY_LIMIT = 100;
/** Consecutive edits of the same field within this window form one undo step */
export const COALESCE_MS = 800;

const UNDOABLE: ReadonlySet<AppAction['type']> = new Set<AppAction['type']>([
  'SET_MEAN',
  'SET_STD',
  'SET_LSL',
  'SET_USL',
  'SET_TARGET',
  'ADD_SCENARIO',
  'UPDATE_SCENARIO',
  'DELETE_SCENARIO',
  'TOGGLE_SCENARIO',
  'MOVE_SCENARIO',
  'IMPORT_DATA',
  'CLEAR_DATA',
  'LOAD_PRESET',
  'ADD_CURRENT_AS_SCENARIO',
  'IMPORT_DATA_AS_SCENARIO',
  'ADD_NEW_SCENARIO',
  'RESET_ALL',
]);

function coalesceKey(action: AppAction): string {
  if (action.type === 'UPDATE_SCENARIO' || action.type === 'MOVE_SCENARIO') {
    return `${action.type}:${action.payload.id}`;
  }
  return action.type;
}

export function createHistory(present: AppState): HistoryState {
  return { past: [], present, future: [], lastKey: null, lastTime: 0 };
}

/** Restore a snapshot while keeping the user's current view preferences */
function restore(snapshot: AppState, current: AppState): AppState {
  const focusedExists = snapshot.scenarios.some((s) => s.id === snapshot.focusedScenarioId);
  return applyAutoRangeIfEnabled({
    ...snapshot,
    display: { ...current.display },
    draggingLimit: null,
    focusedScenarioId: focusedExists ? snapshot.focusedScenarioId : null,
  });
}

export function historyReducer(
  history: HistoryState,
  action: AppAction,
  now: number = Date.now(),
): HistoryState {
  const { past, present, future } = history;

  if (action.type === 'UNDO') {
    if (past.length === 0) return history;
    const previous = past[past.length - 1];
    return {
      past: past.slice(0, -1),
      present: restore(previous, present),
      future: [present, ...future],
      lastKey: null,
      lastTime: 0,
    };
  }

  if (action.type === 'REDO') {
    if (future.length === 0) return history;
    const [next, ...rest] = future;
    return {
      past: [...past, present],
      present: restore(next, present),
      future: rest,
      lastKey: null,
      lastTime: 0,
    };
  }

  const nextPresent = appReducer(present, action);
  if (nextPresent === present) return history;

  if (!UNDOABLE.has(action.type)) {
    return { ...history, present: nextPresent };
  }

  const key = coalesceKey(action);
  const isDrag =
    present.draggingLimit !== null && (action.type === 'SET_LSL' || action.type === 'SET_USL');
  const coalesce = key === history.lastKey && (isDrag || now - history.lastTime < COALESCE_MS);

  return {
    past: coalesce ? past : [...past, present].slice(-HISTORY_LIMIT),
    present: nextPresent,
    future: [],
    lastKey: key,
    lastTime: now,
  };
}
