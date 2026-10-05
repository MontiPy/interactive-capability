import { describe, it, expect } from 'vitest';
import { AppAction, AppState } from '../types';
import {
  appReducer,
  createHistory,
  historyReducer,
  initialState,
  COALESCE_MS,
  HistoryState,
} from './appReducer';

function run(history: HistoryState, actions: AppAction[], start = 1_000, gap = 10_000): HistoryState {
  return actions.reduce((h, action, i) => historyReducer(h, action, start + i * gap), history);
}

const sampleData = {
  bins: [{ start: 0, end: 1, count: 10 }],
  mean: 10,
  std: 0.5,
  overallStd: 0.8,
  withinStd: 0.5,
  sampleSize: 10,
  min: 9,
  max: 11,
};

describe('appReducer', () => {
  it('assigns unique ids and non-duplicate colors to new scenarios', () => {
    let state = appReducer(initialState, { type: 'ADD_NEW_SCENARIO' });
    state = appReducer(state, { type: 'ADD_NEW_SCENARIO' });
    const [a, b] = state.scenarios;
    expect(a.id).not.toBe(b.id);
    expect(a.color).not.toBe(b.color);

    // Deleting the first frees its color for reuse
    state = appReducer(state, { type: 'DELETE_SCENARIO', payload: a.id });
    state = appReducer(state, { type: 'ADD_NEW_SCENARIO' });
    expect(state.scenarios.map((s) => s.color)).toContain(a.color);
  });

  it('clears focus when the focused scenario is deleted', () => {
    let state = appReducer(initialState, { type: 'ADD_NEW_SCENARIO' });
    const id = state.scenarios[0].id;
    state = appReducer(state, { type: 'SET_FOCUSED_SCENARIO', payload: id });
    state = appReducer(state, { type: 'DELETE_SCENARIO', payload: id });
    expect(state.focusedScenarioId).toBeNull();
  });

  it('moves scenarios and ignores moves past either end', () => {
    let state = appReducer(initialState, { type: 'ADD_NEW_SCENARIO' });
    state = appReducer(state, { type: 'ADD_NEW_SCENARIO' });
    const [first, second] = state.scenarios.map((s) => s.id);
    state = appReducer(state, { type: 'MOVE_SCENARIO', payload: { id: second, direction: -1 } });
    expect(state.scenarios.map((s) => s.id)).toEqual([second, first]);
    const unchanged = appReducer(state, { type: 'MOVE_SCENARIO', payload: { id: second, direction: -1 } });
    expect(unchanged).toBe(state);
  });

  it('carries overall σ and sample size into imported scenarios', () => {
    const state = appReducer(initialState, {
      type: 'IMPORT_DATA_AS_SCENARIO',
      payload: { name: '', data: sampleData },
    });
    expect(state.scenarios[0]).toMatchObject({
      name: 'Imported Scenario 1',
      std: 0.5,
      overallStd: 0.8,
      sampleSize: 10,
    });
  });

  it('keeps imported data in view when auto-ranging', () => {
    const state = appReducer(initialState, {
      type: 'IMPORT_DATA',
      payload: { ...sampleData, min: 2, max: 30 },
    });
    expect(state.display.displayMin).toBeLessThanOrEqual(2);
    expect(state.display.displayMax).toBeGreaterThanOrEqual(30);
  });

  it('holds the viewport during a limit drag and re-ranges afterwards', () => {
    let state = appReducer(initialState, { type: 'SET_DRAGGING_LIMIT', payload: 'usl' });
    const before = state.display.displayMax;
    state = appReducer(state, { type: 'SET_USL', payload: 9 });
    expect(state.display.displayMax).toBe(before);
    state = appReducer(state, { type: 'SET_DRAGGING_LIMIT', payload: null });
    expect(state.display.displayMax).toBeGreaterThan(9);
  });

  it('applies spec limits supplied with an import, ignoring an inverted pair', () => {
    const state = appReducer(initialState, { type: 'IMPORT_DATA', payload: sampleData, specs: { lsl: 8, usl: 12 } });
    expect(state).toMatchObject({ lsl: 8, usl: 12, mean: 10, std: 0.5 });
    const inverted = appReducer(initialState, { type: 'IMPORT_DATA', payload: sampleData, specs: { lsl: 12, usl: 8 } });
    expect(inverted).toMatchObject({ lsl: -3, usl: 3 });

    const scenario = appReducer(initialState, {
      type: 'IMPORT_DATA_AS_SCENARIO',
      payload: { name: 'A', data: sampleData, lsl: 9, usl: 11 },
    }).scenarios[0];
    expect(scenario).toMatchObject({ lsl: 9, usl: 11 });
  });

  it('drops imported data when a preset is loaded', () => {
    let state = appReducer(initialState, { type: 'IMPORT_DATA', payload: sampleData });
    state = appReducer(state, { type: 'LOAD_PRESET', payload: { mean: 0, std: 0.5, lsl: -3, usl: 3 } });
    expect(state.histogramData).toBeNull();
  });
});

describe('historyReducer (undo / redo)', () => {
  it('undoes and redoes discrete edits', () => {
    let h = run(createHistory(initialState), [
      { type: 'SET_MEAN', payload: 1 },
      { type: 'SET_STD', payload: 2 },
    ]);
    expect(h.present.mean).toBe(1);
    expect(h.present.std).toBe(2);

    h = historyReducer(h, { type: 'UNDO' });
    expect(h.present.std).toBe(1);
    h = historyReducer(h, { type: 'UNDO' });
    expect(h.present.mean).toBe(0);
    expect(historyReducer(h, { type: 'UNDO' })).toBe(h);

    h = historyReducer(h, { type: 'REDO' });
    expect(h.present.mean).toBe(1);
  });

  it('coalesces rapid edits of the same field into one step', () => {
    let h = createHistory(initialState);
    [0.1, 0.2, 0.3, 0.4].forEach((mean, i) => {
      h = historyReducer(h, { type: 'SET_MEAN', payload: mean }, 1000 + i * (COALESCE_MS / 4));
    });
    expect(h.past).toHaveLength(1);
    h = historyReducer(h, { type: 'UNDO' });
    expect(h.present.mean).toBe(0);
  });

  it('coalesces an entire spec-limit drag regardless of duration', () => {
    let h = run(createHistory(initialState), [
      { type: 'SET_DRAGGING_LIMIT', payload: 'lsl' },
      { type: 'SET_LSL', payload: -2.5 },
      { type: 'SET_LSL', payload: -2 },
      { type: 'SET_LSL', payload: -1.5 },
      { type: 'SET_DRAGGING_LIMIT', payload: null },
    ]);
    expect(h.present.lsl).toBe(-1.5);
    h = historyReducer(h, { type: 'UNDO' });
    expect(h.present.lsl).toBe(-3);
    expect(h.present.draggingLimit).toBeNull();
  });

  it('does not record view-only changes but keeps them across undo', () => {
    let h = run(createHistory(initialState), [
      { type: 'SET_MEAN', payload: 1 },
      { type: 'UPDATE_DISPLAY', payload: { showGrid: false } },
    ]);
    expect(h.past).toHaveLength(1);
    h = historyReducer(h, { type: 'UNDO' });
    expect(h.present.mean).toBe(0);
    expect(h.present.display.showGrid).toBe(false);
  });

  it('clears the redo stack after a new edit', () => {
    let h = run(createHistory(initialState), [{ type: 'SET_MEAN', payload: 1 }]);
    h = historyReducer(h, { type: 'UNDO' });
    expect(h.future).toHaveLength(1);
    h = historyReducer(h, { type: 'SET_STD', payload: 3 }, 99_999);
    expect(h.future).toHaveLength(0);
  });

  it('makes RESET_ALL undoable', () => {
    const edited: AppState = { ...initialState, mean: 5, lsl: 0, usl: 10 };
    let h = historyReducer(createHistory(edited), { type: 'RESET_ALL' });
    expect(h.present.mean).toBe(0);
    h = historyReducer(h, { type: 'UNDO' });
    expect(h.present.mean).toBe(5);
    expect(h.present.usl).toBe(10);
  });
});
