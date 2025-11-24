import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppAction } from '../types';
import { loadFromURL, saveToURL } from '../utils/presets';
import { computeHybridViewport, computeFitToMeanViewport } from '../utils/viewport';

const initialState: AppState = {
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
};

// Helper to apply auto-range viewport when enabled
function applyAutoRangeIfEnabled(state: AppState): AppState {
  if (!state.display.autoRange) return state;

  let viewport;
  if (state.display.fitToMean) {
    // Fit to mean overrides hybrid auto-range
    viewport = computeFitToMeanViewport(state.mean, state.std, state.display.fitMultiplier);
  } else {
    viewport = computeHybridViewport(state.mean, state.std, state.lsl, state.usl);
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

function appReducer(state: AppState, action: AppAction): AppState {
  let nextState: AppState;

  switch (action.type) {
    case 'SET_MEAN':
      nextState = { ...state, mean: action.payload };
      return applyAutoRangeIfEnabled(nextState);

    case 'SET_STD':
      nextState = { ...state, std: action.payload };
      return applyAutoRangeIfEnabled(nextState);

    case 'SET_LSL':
      nextState = { ...state, lsl: action.payload };
      return applyAutoRangeIfEnabled(nextState);

    case 'SET_USL':
      nextState = { ...state, usl: action.payload };
      return applyAutoRangeIfEnabled(nextState);

    case 'SET_TARGET':
      return { ...state, target: action.payload };

    case 'UPDATE_DISPLAY':
      nextState = {
        ...state,
        display: { ...state.display, ...action.payload },
      };
      // If autoRange or fitToMean was toggled on, recompute viewport
      if (action.payload.autoRange || action.payload.fitToMean !== undefined) {
        return applyAutoRangeIfEnabled(nextState);
      }
      return nextState;

    case 'ADD_SCENARIO':
      const newScenario = {
        ...action.payload,
        id: `scenario-${Date.now()}-${Math.random()}`,
      };
      return {
        ...state,
        scenarios: [...state.scenarios, newScenario],
      };

    case 'UPDATE_SCENARIO':
      return {
        ...state,
        scenarios: state.scenarios.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
        ),
      };

    case 'DELETE_SCENARIO':
      return {
        ...state,
        scenarios: state.scenarios.filter((s) => s.id !== action.payload),
        activeScenarioId:
          state.activeScenarioId === action.payload ? null : state.activeScenarioId,
      };

    case 'TOGGLE_SCENARIO':
      return {
        ...state,
        scenarios: state.scenarios.map((s) =>
          s.id === action.payload ? { ...s, visible: !s.visible } : s
        ),
      };

    case 'SET_ACTIVE_SCENARIO':
      return { ...state, activeScenarioId: action.payload };

    case 'SET_FOCUSED_SCENARIO':
      return { ...state, focusedScenarioId: action.payload };

    case 'IMPORT_DATA':
      nextState = {
        ...state,
        histogramData: action.payload,
        mean: action.payload.mean,
        std: action.payload.std,
      };
      // Apply auto-range after data import
      return applyAutoRangeIfEnabled(nextState);

    case 'CLEAR_DATA':
      return { ...state, histogramData: null };

    case 'SET_DRAGGING_LIMIT':
      return { ...state, draggingLimit: action.payload };

    case 'RESET_DISPLAY':
      nextState = {
        ...state,
        display: { ...initialState.display, autoRange: true },
      };
      // Apply auto-range when resetting
      return applyAutoRangeIfEnabled(nextState);

    case 'LOAD_PRESET':
      nextState = {
        ...state,
        ...action.payload,
        display: {
          ...state.display,
          ...action.payload.display,
          autoRange: true, // Enable auto-range on preset load
        },
      };
      // Apply auto-range after preset load
      return applyAutoRangeIfEnabled(nextState);

    case 'LOAD_FROM_URL':
      nextState = {
        ...state,
        ...action.payload,
      };
      // Apply auto-range on initial load from URL
      return applyAutoRangeIfEnabled(nextState);

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load from URL on mount
  useEffect(() => {
    const urlState = loadFromURL();
    if (urlState) {
      dispatch({ type: 'LOAD_FROM_URL', payload: urlState });
    }
  }, []);

  // Save to URL when relevant state changes
  useEffect(() => {
    saveToURL(state.mean, state.std, state.lsl, state.usl);
  }, [state.mean, state.std, state.lsl, state.usl]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
