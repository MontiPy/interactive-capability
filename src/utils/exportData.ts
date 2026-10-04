import { AppState } from '../types';
import {
  computeAdvancedStats,
  computeStats,
  cpConfidenceInterval,
  cpkConfidenceInterval,
} from './stats';

type Cell = string | number | undefined | null;

/** Quote a CSV field when needed (RFC 4180) and neutralise spreadsheet formulas */
export function csvEscape(value: Cell): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let text = value;
  // Prevent CSV injection: a leading =, +, -, @ is executed as a formula by spreadsheets
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCSV(rows: Cell[][]): string {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
}

/**
 * Metrics CSV. In single mode this is a Metric/Value sheet for the primary
 * distribution; in comparison mode it is one row per scenario.
 */
export function buildMetricsCSV(state: AppState): string | null {
  if (state.activeTab === 'comparison' && state.scenarios.length > 0) {
    const header = [
      'Scenario',
      'Visible',
      'Mean',
      'Std Dev (within)',
      'Std Dev (overall)',
      'LSL',
      'USL',
      'Cp',
      'Cpk',
      'Pp',
      'Ppk',
      'PPM Below',
      'PPM Above',
      'PPM Total',
      '% Inside',
    ];
    const rows: Cell[][] = state.scenarios.map((s) => {
      const basic = computeStats(s.mean, s.std, s.lsl, s.usl);
      const adv = computeAdvancedStats(s.mean, s.std, s.lsl, s.usl, s.overallStd);
      return [
        s.name,
        s.visible ? 'yes' : 'no',
        s.mean,
        s.std,
        s.overallStd ?? s.std,
        s.lsl,
        s.usl,
        basic?.cp,
        basic?.cpk,
        adv?.pp,
        adv?.ppk,
        adv?.ppmBelow,
        adv?.ppmAbove,
        adv?.dpmo,
        basic?.pctInside,
      ];
    });
    return toCSV([header, ...rows]);
  }

  const { mean, std, lsl, usl, target, histogramData } = state;
  const overallStd = histogramData?.overallStd;
  const basic = computeStats(mean, std, lsl, usl);
  const adv = computeAdvancedStats(mean, std, lsl, usl, overallStd, target);
  if (!basic || !adv) return null;

  const n = histogramData?.sampleSize;
  const cpCI = n ? cpConfidenceInterval(basic.cp, n) : null;
  const cpkCI = n ? cpkConfidenceInterval(basic.cpk, n) : null;

  const rows: Cell[][] = [
    ['Metric', 'Value'],
    ['Mean (μ)', mean],
    ['Std Dev (σ within)', std],
    ...(overallStd !== undefined ? [['Std Dev (σ overall)', overallStd] as Cell[]] : []),
    ['LSL', lsl],
    ['USL', usl],
    ...(target !== undefined ? [['Target', target] as Cell[]] : []),
    ...(n ? [['Sample size', n] as Cell[]] : []),
    [],
    ['Cp', basic.cp],
    ...(cpCI
      ? ([
          ['Cp 95% CI lower', cpCI.lower],
          ['Cp 95% CI upper', cpCI.upper],
        ] as Cell[][])
      : []),
    ['Cpk', basic.cpk],
    ...(cpkCI
      ? ([
          ['Cpk 95% CI lower', cpkCI.lower],
          ['Cpk 95% CI upper', cpkCI.upper],
        ] as Cell[][])
      : []),
    ['CPU', adv.cpu],
    ['CPL', adv.cpl],
    ['% Outside Spec', basic.pctOutside],
    ['% Inside Spec', basic.pctInside],
    ['% Below LSL', basic.pctBelow],
    ['% Above USL', basic.pctAbove],
    [],
    ['Pp', adv.pp],
    ['Ppk', adv.ppk],
    ['PPM Below', adv.ppmBelow],
    ['PPM Above', adv.ppmAbove],
    ['DPMO', adv.dpmo],
    ['Z.bench', adv.zBench],
    ['Sigma Level', adv.sigmaLevel],
    ...(adv.cpm !== undefined ? [['Cpm', adv.cpm] as Cell[]] : []),
    ...(histogramData?.normality
      ? ([
          ['Anderson-Darling A²', histogramData.normality.aSquared],
          ['Anderson-Darling p', histogramData.normality.pValue],
        ] as Cell[][])
      : []),
  ];
  return toCSV(rows);
}

/** Full configuration + metrics for the primary distribution and every scenario */
export function buildConfigJSON(
  state: AppState,
  timestamp: string = new Date().toISOString(),
): string {
  const { mean, std, lsl, usl, target, histogramData, scenarios } = state;
  const overallStd = histogramData?.overallStd;
  return JSON.stringify(
    {
      timestamp,
      distribution: { mean, std, lsl, usl, target, overallStd },
      metrics: {
        basic: computeStats(mean, std, lsl, usl),
        advanced: computeAdvancedStats(mean, std, lsl, usl, overallStd, target),
      },
      importedData: histogramData
        ? {
            sampleSize: histogramData.sampleSize,
            withinStd: histogramData.withinStd,
            overallStd: histogramData.overallStd,
            min: histogramData.min,
            max: histogramData.max,
            normality: histogramData.normality,
          }
        : null,
      scenarios: scenarios.map((s) => ({
        name: s.name,
        mean: s.mean,
        std: s.std,
        overallStd: s.overallStd,
        sampleSize: s.sampleSize,
        lsl: s.lsl,
        usl: s.usl,
        color: s.color,
        visible: s.visible,
        metrics: {
          basic: computeStats(s.mean, s.std, s.lsl, s.usl),
          advanced: computeAdvancedStats(s.mean, s.std, s.lsl, s.usl, s.overallStd),
        },
      })),
    },
    null,
    2,
  );
}
