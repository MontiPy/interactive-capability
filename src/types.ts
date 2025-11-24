// Core statistical result types
export interface StatsResult {
  cp: number;
  cpk: number;
  pctOutside: number;
  pctInside: number;
  pctAbove: number;
  pctBelow: number;
}

export interface AdvancedStatsResult {
  pp: number;
  ppk: number;
  dpmo: number;
  sigmaLevel: number;
  cpm?: number;
}

// Distribution scenario for comparison mode
export interface Scenario {
  id: string;
  name: string;
  mean: number;
  std: number;
  lsl: number;
  usl: number;
  color: string;
  visible: boolean;
}

// Real data import
export interface HistogramData {
  bins: { start: number; end: number; count: number }[];
  mean: number;
  std: number;
  sampleSize: number;
}

// Display settings
export interface DisplaySettings {
  displayMin: number;
  displayMax: number;
  autoRange: boolean; // Enable hybrid auto-viewport
  tickStep: number | null;
  tickFormat: 'auto' | '1' | '2' | 'int';
  showGrid: boolean;
  fitToMean: boolean;
  fitMultiplier: number;
}

// Application state
export interface AppState {
  // Primary distribution
  mean: number;
  std: number;
  lsl: number;
  usl: number;
  target?: number; // For Cpm calculation

  // Display settings
  display: DisplaySettings;

  // Features
  scenarios: Scenario[];
  activeScenarioId: string | null;
  focusedScenarioId: string | null; // Scenario driving main metrics display
  histogramData: HistogramData | null;

  // UI state
  draggingLimit: 'lsl' | 'usl' | null;
}

export type AppAction =
  | { type: 'SET_MEAN'; payload: number }
  | { type: 'SET_STD'; payload: number }
  | { type: 'SET_LSL'; payload: number }
  | { type: 'SET_USL'; payload: number }
  | { type: 'SET_TARGET'; payload: number | undefined }
  | { type: 'UPDATE_DISPLAY'; payload: Partial<DisplaySettings> }
  | { type: 'ADD_SCENARIO'; payload: Omit<Scenario, 'id'> }
  | { type: 'UPDATE_SCENARIO'; payload: { id: string; updates: Partial<Scenario> } }
  | { type: 'DELETE_SCENARIO'; payload: string }
  | { type: 'TOGGLE_SCENARIO'; payload: string }
  | { type: 'SET_ACTIVE_SCENARIO'; payload: string | null }
  | { type: 'SET_FOCUSED_SCENARIO'; payload: string | null }
  | { type: 'IMPORT_DATA'; payload: HistogramData }
  | { type: 'CLEAR_DATA' }
  | { type: 'SET_DRAGGING_LIMIT'; payload: 'lsl' | 'usl' | null }
  | { type: 'RESET_DISPLAY' }
  | { type: 'LOAD_PRESET'; payload: Partial<AppState> }
  | { type: 'LOAD_FROM_URL'; payload: Partial<AppState> };

// Preset configuration
export interface Preset {
  name: string;
  description: string;
  state: Partial<AppState>;
}
