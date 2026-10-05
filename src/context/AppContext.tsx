import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppAction } from '../types';
import {
  appReducer,
  createHistory,
  historyReducer,
  initialState,
  HistoryState,
} from './appReducer';
import { buildPrimaryQuery, loadSession, parseURLState, saveSession } from '../utils/persistence';

/**
 * Build the starting state: defaults, then the saved session, then anything in
 * the URL (a shared link wins over local history).
 */
function initHistory(): HistoryState {
  let state = initialState;
  const session = loadSession();
  if (session) state = appReducer(state, { type: 'LOAD_FROM_URL', payload: session });
  if (typeof window !== 'undefined') {
    const fromUrl = parseURLState(window.location.search);
    if (fromUrl) {
      // A shared link describes its own theoretical process: drop stale imported data
      state = appReducer(state, {
        type: 'LOAD_FROM_URL',
        payload: { ...fromUrl, histogramData: fromUrl.histogramData ?? null },
      });
    }
  }
  return createHistory(state);
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  canUndo: boolean;
  canRedo: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SAVE_DEBOUNCE_MS = 300;

export function AppProvider({ children }: { children: ReactNode }) {
  const [history, dispatch] = useReducer(
    (h: HistoryState, a: AppAction) => historyReducer(h, a),
    undefined,
    initHistory
  );
  const state = history.present;

  // Persist the session (debounced so slider drags don't thrash storage)
  useEffect(() => {
    if (state.draggingLimit) return;
    const handle = window.setTimeout(() => saveSession(state), SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [state]);

  // Mirror the primary distribution in the address bar without adding history entries
  const primaryQuery = buildPrimaryQuery(state);
  const isDragging = state.draggingLimit !== null;
  useEffect(() => {
    if (isDragging) return;
    const handle = window.setTimeout(() => {
      const query = primaryQuery;
      if (window.location.search !== `?${query}`) {
        window.history.replaceState(
          window.history.state,
          '',
          `${window.location.pathname}?${query}${window.location.hash}`
        );
      }
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [primaryQuery, isDragging]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
