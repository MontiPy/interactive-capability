import { AppState, DisplaySettings, HistogramData, Scenario } from '../types';

/**
 * Session persistence (localStorage) and shareable URLs.
 *
 * Everything read back from storage or a URL is untrusted input, so each
 * field is validated individually and anything malformed is dropped.
 */

export const SESSION_KEY = 'capability-playground:session:v1';

type PersistedState = Partial<
  Pick<
    AppState,
    | 'mean'
    | 'std'
    | 'lsl'
    | 'usl'
    | 'target'
    | 'scenarios'
    | 'histogramData'
    | 'activeTab'
    | 'focusedScenarioId'
    | 'display'
  >
>;

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isPos = (v: unknown): v is number => isNum(v) && v > 0;

function sanitizeScenario(raw: unknown): Scenario | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (
    typeof s.id !== 'string' ||
    typeof s.name !== 'string' ||
    !isNum(s.mean) ||
    !isPos(s.std) ||
    !isNum(s.lsl) ||
    !isNum(s.usl) ||
    typeof s.color !== 'string' ||
    !/^#[0-9a-f]{3,8}$/i.test(s.color)
  ) {
    return null;
  }
  return {
    id: s.id,
    name: s.name.slice(0, 100),
    mean: s.mean,
    std: s.std,
    lsl: s.lsl,
    usl: s.usl,
    color: s.color,
    visible: s.visible !== false,
    ...(isPos(s.overallStd) ? { overallStd: s.overallStd } : {}),
    ...(isPos(s.sampleSize) ? { sampleSize: Math.round(s.sampleSize) } : {}),
  };
}

function sanitizeHistogram(raw: unknown): HistogramData | null {
  if (!raw || typeof raw !== 'object') return null;
  const h = raw as Record<string, unknown>;
  if (!Array.isArray(h.bins) || !isNum(h.mean) || !isPos(h.std) || !isPos(h.sampleSize)) {
    return null;
  }
  const bins = h.bins.filter(
    (b): b is { start: number; end: number; count: number } =>
      !!b && isNum(b.start) && isNum(b.end) && isNum(b.count),
  );
  if (bins.length === 0) return null;
  const normality = h.normality as Record<string, unknown> | undefined;
  return {
    bins,
    mean: h.mean,
    std: h.std,
    sampleSize: h.sampleSize,
    ...(isPos(h.overallStd) ? { overallStd: h.overallStd } : {}),
    ...(isPos(h.withinStd) ? { withinStd: h.withinStd } : {}),
    ...(isNum(h.min) ? { min: h.min } : {}),
    ...(isNum(h.max) ? { max: h.max } : {}),
    ...(normality && isNum(normality.aSquared) && isNum(normality.pValue)
      ? { normality: { aSquared: normality.aSquared, pValue: normality.pValue } }
      : {}),
  };
}

function sanitizeDisplay(raw: unknown): Partial<DisplaySettings> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const d = raw as Record<string, unknown>;
  const out: Partial<DisplaySettings> = {};
  if (typeof d.autoRange === 'boolean') out.autoRange = d.autoRange;
  if (typeof d.showGrid === 'boolean') out.showGrid = d.showGrid;
  if (typeof d.fitToMean === 'boolean') out.fitToMean = d.fitToMean;
  if (isPos(d.fitMultiplier)) out.fitMultiplier = d.fitMultiplier;
  if (d.tickStep === null || isPos(d.tickStep)) out.tickStep = d.tickStep as number | null;
  if (
    d.tickFormat === 'auto' ||
    d.tickFormat === '1' ||
    d.tickFormat === '2' ||
    d.tickFormat === 'int'
  ) {
    out.tickFormat = d.tickFormat;
  }
  if (isNum(d.displayMin) && isNum(d.displayMax) && d.displayMax > d.displayMin) {
    out.displayMin = d.displayMin;
    out.displayMax = d.displayMax;
  }
  return out;
}

/**
 * Validate an untrusted session object into a partial AppState.
 */
export function sanitizeSession(raw: unknown): PersistedState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const out: PersistedState = {};

  if (isNum(r.mean)) out.mean = r.mean;
  if (isPos(r.std)) out.std = r.std;
  if (isNum(r.lsl) && isNum(r.usl) && r.usl > r.lsl) {
    out.lsl = r.lsl;
    out.usl = r.usl;
  }
  if (isNum(r.target)) out.target = r.target;
  if (Array.isArray(r.scenarios)) {
    out.scenarios = r.scenarios
      .map(sanitizeScenario)
      .filter((s): s is Scenario => s !== null)
      .slice(0, 50);
  }
  if (r.histogramData !== undefined) out.histogramData = sanitizeHistogram(r.histogramData);
  if (r.activeTab === 'single' || r.activeTab === 'comparison') out.activeTab = r.activeTab;
  if (
    typeof r.focusedScenarioId === 'string' &&
    out.scenarios?.some((s) => s.id === r.focusedScenarioId)
  ) {
    out.focusedScenarioId = r.focusedScenarioId;
  }
  const display = sanitizeDisplay(r.display);
  if (display) out.display = display as DisplaySettings;

  return out;
}

export function serializeSession(state: AppState): PersistedState {
  return {
    mean: state.mean,
    std: state.std,
    lsl: state.lsl,
    usl: state.usl,
    target: state.target,
    scenarios: state.scenarios,
    histogramData: state.histogramData,
    activeTab: state.activeTab,
    focusedScenarioId: state.focusedScenarioId,
    display: state.display,
  };
}

export function loadSession(
  storage: Storage | undefined = safeLocalStorage(),
): PersistedState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SESSION_KEY);
    return raw ? sanitizeSession(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveSession(
  state: AppState,
  storage: Storage | undefined = safeLocalStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(SESSION_KEY, JSON.stringify(serializeSession(state)));
  } catch {
    // Quota exceeded or storage disabled: persistence is best-effort
  }
}

export function clearSession(storage: Storage | undefined = safeLocalStorage()): void {
  try {
    storage?.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

/* ------------------------------------------------------------------ */
/* URL state                                                           */
/* ------------------------------------------------------------------ */

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Round to 6 significant digits to keep URLs short without visible loss */
const compact = (v: number) => Number(v.toPrecision(6));

/**
 * Parse state from a query string (`?mean=…&std=…&lsl=…&usl=…&target=…&sc=…`).
 * `sc` carries comparison scenarios as base64url-encoded JSON.
 */
export function parseURLState(search: string): PersistedState | null {
  const params = new URLSearchParams(search);
  const raw: Record<string, unknown> = {};
  const read = (key: string) => {
    const value = params.get(key);
    if (value === null || value.trim() === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  };

  raw.mean = read('mean');
  raw.std = read('std');
  raw.lsl = read('lsl');
  raw.usl = read('usl');
  raw.target = read('target');

  const sc = params.get('sc');
  if (sc) {
    try {
      const decoded = JSON.parse(fromBase64Url(sc));
      if (Array.isArray(decoded)) {
        raw.scenarios = decoded.map((s: Record<string, unknown>, i: number) => ({
          id: `shared-${i}`,
          name: s.n,
          mean: s.m,
          std: s.s,
          lsl: s.l,
          usl: s.u,
          color: s.c,
          visible: s.v !== 0,
          overallStd: s.o,
        }));
      }
    } catch {
      // Malformed share payload: ignore scenarios
    }
  }

  const state = sanitizeSession(raw);
  if (!state || Object.keys(state).length === 0) return null;

  // Spec limits must arrive together; sanitizeSession drops an inverted pair.
  // A lone limit is still applied so old links that set only one keep working.
  if (state.lsl === undefined && isNum(raw.lsl)) state.lsl = raw.lsl as number;
  if (state.usl === undefined && isNum(raw.usl)) state.usl = raw.usl as number;
  return state;
}

/** Primary-distribution query string kept in the address bar */
export function buildPrimaryQuery(
  state: Pick<AppState, 'mean' | 'std' | 'lsl' | 'usl' | 'target'>,
): string {
  const params = new URLSearchParams();
  params.set('mean', String(compact(state.mean)));
  params.set('std', String(compact(state.std)));
  params.set('lsl', String(compact(state.lsl)));
  params.set('usl', String(compact(state.usl)));
  if (state.target !== undefined && isNum(state.target)) {
    params.set('target', String(compact(state.target)));
  }
  return params.toString();
}

/**
 * Build a self-contained link that reproduces the primary distribution and
 * all comparison scenarios.
 */
export function buildShareURL(state: AppState, base: string): string {
  let query = buildPrimaryQuery(state);
  if (state.scenarios.length > 0) {
    const payload = state.scenarios.map((s) => ({
      n: s.name,
      m: compact(s.mean),
      s: compact(s.std),
      l: compact(s.lsl),
      u: compact(s.usl),
      c: s.color,
      ...(s.visible ? {} : { v: 0 }),
      ...(s.overallStd ? { o: compact(s.overallStd) } : {}),
    }));
    query += `&sc=${toBase64Url(JSON.stringify(payload))}`;
  }
  return `${base}?${query}`;
}
