import { describe, it, expect } from 'vitest';
import { appReducer, initialState } from '../context/appReducer';
import { buildConfigJSON, buildMetricsCSV, csvEscape } from './exportData';

describe('csvEscape', () => {
  it('quotes fields with separators and quotes', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape(1.5)).toBe('1.5');
    expect(csvEscape(undefined)).toBe('');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(csvEscape('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
  });
});

describe('buildMetricsCSV', () => {
  it('produces a metric/value sheet in single mode', () => {
    const csv = buildMetricsCSV(initialState)!;
    expect(csv.split('\n')[0]).toBe('Metric,Value');
    expect(csv).toContain('Cpk,1');
    expect(csv).not.toContain('CI lower');
  });

  it('adds confidence intervals when data has been imported', () => {
    const state = appReducer(initialState, {
      type: 'IMPORT_DATA',
      payload: { bins: [{ start: -1, end: 1, count: 50 }], mean: 0, std: 1, overallStd: 1.1, sampleSize: 50 },
    });
    const csv = buildMetricsCSV(state)!;
    expect(csv).toContain('Cpk 95% CI lower');
    expect(csv).toContain('Std Dev (σ overall),1.1');
  });

  it('produces one row per scenario in comparison mode', () => {
    let state = appReducer(initialState, { type: 'ADD_NEW_SCENARIO' });
    const id = state.scenarios[0].id;
    state = appReducer(state, { type: 'UPDATE_SCENARIO', payload: { id, updates: { name: 'Line A, shift 2' } } });
    state = appReducer(state, { type: 'SET_ACTIVE_TAB', payload: 'comparison' });
    const lines = buildMetricsCSV(state)!.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1].startsWith('"Line A, shift 2",yes,0,1,1,-3,3,1,1')).toBe(true);
  });

  it('returns null for invalid primary inputs', () => {
    expect(buildMetricsCSV({ ...initialState, std: 0 })).toBeNull();
  });
});

describe('buildConfigJSON', () => {
  it('includes scenarios with metrics', () => {
    const state = appReducer(initialState, { type: 'ADD_NEW_SCENARIO' });
    const json = JSON.parse(buildConfigJSON(state, 'T'));
    expect(json.timestamp).toBe('T');
    expect(json.scenarios[0].metrics.basic.cp).toBeCloseTo(1);
    expect(json.importedData).toBeNull();
  });
});
