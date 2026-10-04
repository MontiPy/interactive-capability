import { describe, it, expect } from 'vitest';
import { initialState, appReducer } from '../context/appReducer';
import {
  SESSION_KEY,
  buildPrimaryQuery,
  buildShareURL,
  loadSession,
  parseURLState,
  sanitizeSession,
  saveSession,
} from './persistence';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => Array.from(data.keys())[i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

describe('session persistence', () => {
  it('round-trips state through storage', () => {
    let state = appReducer(initialState, { type: 'ADD_NEW_SCENARIO' });
    state = appReducer(state, { type: 'SET_MEAN', payload: 1.25 });
    const storage = memoryStorage();
    saveSession(state, storage);
    const loaded = loadSession(storage)!;
    expect(loaded.mean).toBe(1.25);
    expect(loaded.scenarios).toHaveLength(1);
    expect(loaded.scenarios![0].name).toBe('Scenario 1');
  });

  it('survives corrupt storage', () => {
    const storage = memoryStorage();
    storage.setItem(SESSION_KEY, '{not json');
    expect(loadSession(storage)).toBeNull();
  });

  it('drops invalid fields individually', () => {
    const result = sanitizeSession({
      mean: 'abc',
      std: -1,
      lsl: 5,
      usl: 1, // inverted pair is rejected together
      activeTab: 'nope',
      scenarios: [
        { id: 'a', name: 'ok', mean: 0, std: 1, lsl: -3, usl: 3, color: '#ff0000', visible: true },
        { id: 'b', name: 'bad color', mean: 0, std: 1, lsl: -3, usl: 3, color: 'red;}', visible: true },
        { id: 'c', name: 'bad std', mean: 0, std: 0, lsl: -3, usl: 3, color: '#00ff00' },
      ],
    })!;
    expect(result.mean).toBeUndefined();
    expect(result.std).toBeUndefined();
    expect(result.lsl).toBeUndefined();
    expect(result.activeTab).toBeUndefined();
    expect(result.scenarios!.map((s) => s.id)).toEqual(['a']);
  });
});

describe('URL state', () => {
  it('parses primary parameters and ignores junk', () => {
    const state = parseURLState('?mean=1.5&std=0.2&lsl=0&usl=3&target=abc')!;
    expect(state).toMatchObject({ mean: 1.5, std: 0.2, lsl: 0, usl: 3 });
    expect(state.target).toBeUndefined();
  });

  it('returns null when nothing useful is present', () => {
    expect(parseURLState('')).toBeNull();
    expect(parseURLState('?mean=&foo=1')).toBeNull();
  });

  it('round-trips scenarios (including non-ASCII names) through a share link', () => {
    let state = appReducer(initialState, { type: 'ADD_NEW_SCENARIO' });
    const id = state.scenarios[0].id;
    state = appReducer(state, {
      type: 'UPDATE_SCENARIO',
      payload: { id, updates: { name: 'Línea 2 — σ↓', mean: 0.123456789, visible: false } },
    });
    const url = buildShareURL(state, 'https://example.com/app/');
    const parsed = parseURLState(new URL(url).search)!;
    expect(parsed.scenarios).toHaveLength(1);
    expect(parsed.scenarios![0]).toMatchObject({
      name: 'Línea 2 — σ↓',
      mean: 0.123457,
      visible: false,
    });
  });

  it('ignores a malformed scenario payload', () => {
    const state = parseURLState('?mean=1&sc=%%%notbase64')!;
    expect(state.mean).toBe(1);
    expect(state.scenarios).toBeUndefined();
  });

  it('builds a compact primary query', () => {
    expect(buildPrimaryQuery({ mean: 0.1 + 0.2, std: 1, lsl: -3, usl: 3, target: undefined })).toBe(
      'mean=0.3&std=1&lsl=-3&usl=3'
    );
  });
});
