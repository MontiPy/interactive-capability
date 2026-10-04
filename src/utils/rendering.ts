import { normalPdf, phi } from './stats';
import { HistogramData, Scenario } from '../types';
import { ChartColors, getChartColors } from '../theme';
import { formatPercent } from './format';

export interface RenderOptions {
  mean: number;
  std: number;
  lsl: number;
  usl: number;
  displayMin: number;
  displayMax: number;
  tickStep: number;
  showGrid: boolean;
  tickFormat: 'auto' | '1' | '2' | 'int';
  scenarios?: Scenario[];
  histogramData?: HistogramData | null;
  showShading?: boolean;
  showPrimary?: boolean;
  /** Optional target value, drawn as a marker on the axis */
  target?: number;
  colors?: ChartColors;
  /** Canvas pixels per CSS pixel. Defaults to window.devicePixelRatio. */
  pixelRatio?: number;
}

/** Vertical layout shared by the renderer and pointer interaction */
export const CHART_BOTTOM_MARGIN = 30;
export const CHART_TOP_MARGIN = 50;

export function chartBaselineY(height: number): number {
  return height - CHART_BOTTOM_MARGIN;
}

/** Convert a horizontal pixel offset into a data value */
export function pxToValue(
  px: number,
  width: number,
  displayMin: number,
  displayMax: number,
): number {
  return displayMin + (px / Math.max(1, width)) * (displayMax - displayMin);
}

/** Convert a data value into a horizontal pixel offset */
export function valueToPx(
  value: number,
  width: number,
  displayMin: number,
  displayMax: number,
): number {
  return ((value - displayMin) / Math.max(1e-12, displayMax - displayMin)) * width;
}

/**
 * Auto-calculate tick step based on range
 */
export function autoTickStep(min: number, max: number, targetTicks: number = 8): number {
  const range = Math.max(1e-6, max - min);
  const raw = range / targetTicks;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const multiples = [1, 2, 5];
  let best = multiples[0] * pow;
  let smallestDiff = Infinity;

  multiples.forEach((m) => {
    const candidate = m * pow;
    const diff = Math.abs(raw - candidate);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      best = candidate;
    }
  });

  return best;
}

/**
 * Generate tick values
 */
export function generateTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = [];
  if (!(step > 0)) return ticks;

  const start = Math.ceil(min / step) * step;
  for (let i = 0; i < 500; i++) {
    const value = start + i * step;
    if (value > max + step * 0.5) break;
    ticks.push(value);
  }

  return ticks;
}

/**
 * Format tick label based on format option. "auto" picks enough decimals for
 * the tick step so small-scale data (e.g. step 0.005) doesn't collapse to "0.01".
 */
export function formatTickLabel(
  value: number,
  format: 'auto' | '1' | '2' | 'int',
  step?: number,
): string {
  if (format === 'int') return String(Math.round(value));
  if (format === '1') return value.toFixed(1);
  if (format === '2') return value.toFixed(2);
  const decimals =
    step && step > 0 ? Math.min(10, Math.max(0, -Math.floor(Math.log10(step) + 1e-9))) : 2;
  const fixed = value.toFixed(Math.max(decimals, 0));
  // Avoid "-0"
  return Number(fixed) === 0 ? fixed.replace(/^-/, '') : fixed;
}

/** Histogram bar height expressed as a probability density (comparable to the pdf) */
function binDensity(bin: { start: number; end: number; count: number }, n: number): number {
  const width = bin.end - bin.start;
  return width > 0 && n > 0 ? bin.count / (n * width) : 0;
}

/**
 * Main rendering function for the capability chart
 */
export function renderPlot(canvas: HTMLCanvasElement, options: RenderOptions): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const {
    mean,
    std,
    lsl,
    usl,
    displayMin,
    displayMax,
    tickStep,
    showGrid,
    tickFormat,
    scenarios = [],
    histogramData = null,
    showShading = true,
    showPrimary = true,
    target,
    colors = getChartColors('light'),
    pixelRatio,
  } = options;

  const dpr = pixelRatio ?? (window.devicePixelRatio || 1);
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  // Clear canvas
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const range = Math.max(1e-9, displayMax - displayMin);
  const samples = 800;
  const xToPx = (x: number) => ((x - displayMin) / range) * w;
  const visibleScenarios = scenarios.filter((s) => s.visible);

  // Overall-σ curve is only meaningful when imported data has distinct σ estimates
  const overallStd = histogramData?.overallStd;
  const showOverall =
    showPrimary && !!overallStd && Math.abs(overallStd - std) / std > 0.01 && std > 0;

  // Calculate max PDF for scaling. The peak of a normal curve is at its mean,
  // so clamp the mean into the viewport rather than sampling.
  let maxPdf = 0;
  const curves: { mean: number; std: number }[] = [
    ...(showPrimary ? [{ mean, std }] : []),
    ...(showOverall ? [{ mean, std: overallStd! }] : []),
    ...visibleScenarios,
  ];
  curves.forEach((c) => {
    if (!(c.std > 0)) return;
    const peakX = Math.min(displayMax, Math.max(displayMin, c.mean));
    maxPdf = Math.max(maxPdf, normalPdf(peakX, c.mean, c.std));
  });

  const histogramVisible = showPrimary && histogramData && histogramData.bins.length > 0;
  if (histogramVisible) {
    histogramData.bins.forEach((bin) => {
      maxPdf = Math.max(maxPdf, binDensity(bin, histogramData.sampleSize));
    });
  }
  if (!(maxPdf > 0)) maxPdf = 1;

  const baselineY = chartBaselineY(h);
  const plotHeight = Math.max(10, h - (CHART_TOP_MARGIN + CHART_BOTTOM_MARGIN));
  const topLabelY = baselineY - plotHeight;
  const yForDensity = (d: number) => baselineY - (d / maxPdf) * plotHeight;

  // Draw baseline axis
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, baselineY);
  ctx.lineTo(w, baselineY);
  ctx.stroke();

  // Draw ticks and grid
  const tickValues = generateTicks(displayMin, displayMax, tickStep);
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  tickValues.forEach((t) => {
    const px = xToPx(t);

    if (showGrid) {
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, baselineY);
      ctx.stroke();
    }

    ctx.strokeStyle = colors.axis;
    ctx.beginPath();
    ctx.moveTo(px, baselineY);
    ctx.lineTo(px, baselineY + 6);
    ctx.stroke();

    ctx.fillStyle = colors.text;
    ctx.fillText(formatTickLabel(t, tickFormat, tickStep), px, baselineY + 8);
  });

  // Draw histogram (clipped to the viewport) as densities so it lines up with the pdf
  if (histogramVisible) {
    ctx.fillStyle = colors.histogram;
    histogramData.bins.forEach((bin) => {
      const start = Math.max(bin.start, displayMin);
      const end = Math.min(bin.end, displayMax);
      if (end <= start) return;
      const x1 = xToPx(start);
      const x2 = xToPx(end);
      const top = yForDensity(binDensity(bin, histogramData.sampleSize));
      ctx.fillRect(x1, top, Math.max(1, x2 - x1 - 1), baselineY - top);
    });
  }

  // Helper: Draw normal curve
  const drawCurve = (
    curveMean: number,
    curveStd: number,
    color: string,
    lineWidth: number = 2,
    dash: number[] = [],
  ) => {
    if (!(curveStd > 0)) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(dash);
    ctx.beginPath();

    for (let i = 0; i <= samples; i++) {
      const x = displayMin + (i / samples) * range;
      const px = xToPx(x);
      const py = yForDensity(normalPdf(x, curveMean, curveStd));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.stroke();
    ctx.restore();
  };

  // Helper: Shade region under the primary curve
  const shadeRegion = (xStart: number, xEnd: number, color: string, useStripes = false) => {
    const start = Math.max(displayMin, Math.min(displayMax, xStart));
    const end = Math.max(displayMin, Math.min(displayMax, xEnd));
    if (end <= start) return;

    ctx.save();

    // Create striped pattern for out-of-spec regions
    if (useStripes) {
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = 8;
      patternCanvas.height = 8;
      const pctx = patternCanvas.getContext('2d');
      if (pctx) {
        pctx.fillStyle = color;
        pctx.fillRect(0, 0, 8, 8);
        pctx.strokeStyle = 'rgba(214,39,40,0.3)';
        pctx.lineWidth = 2;
        pctx.beginPath();
        pctx.moveTo(0, 8);
        pctx.lineTo(8, 0);
        pctx.stroke();
      }
      const pattern = ctx.createPattern(patternCanvas, 'repeat');
      ctx.fillStyle = pattern ?? color;
    } else {
      ctx.fillStyle = color;
    }

    // Trace the curve from start to end, including the exact endpoints so the
    // shaded area meets the spec lines without a gap.
    ctx.beginPath();
    const steps = Math.max(2, Math.ceil(((end - start) / range) * samples));
    for (let i = 0; i <= steps; i++) {
      const x = start + (i / steps) * (end - start);
      const px = xToPx(x);
      const py = yForDensity(normalPdf(x, mean, std));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(xToPx(end), baselineY);
    ctx.lineTo(xToPx(start), baselineY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Shade spec regions (for primary distribution) - only in single distribution mode
  if (showShading && showPrimary) {
    shadeRegion(displayMin, lsl, 'rgba(214,39,40,0.08)', true);
    shadeRegion(usl, displayMax, 'rgba(214,39,40,0.08)', true);
    shadeRegion(lsl, usl, 'rgba(76,175,80,0.10)', false);
  }

  // Draw primary distribution curve (only in single distribution mode)
  if (showPrimary) {
    drawCurve(mean, std, colors.primaryCurve, 2);
    if (showOverall) drawCurve(mean, overallStd!, colors.primaryCurve, 1.5, [6, 4]);
  }

  // Draw scenario curves
  visibleScenarios.forEach((scenario) => {
    drawCurve(scenario.mean, scenario.std, scenario.color, 2);
  });

  // Draw mean line and sigma label (primary only)
  if (showPrimary && mean >= displayMin && mean <= displayMax) {
    const pxMean = xToPx(mean);
    ctx.save();
    ctx.strokeStyle = colors.meanLine;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(pxMean, topLabelY);
    ctx.lineTo(pxMean, baselineY);
    ctx.stroke();
    ctx.restore();

    ctx.font = '12px Arial';
    ctx.fillStyle = colors.meanLine;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`μ=${formatValue(mean)}`, pxMean, topLabelY - 6);
  }

  // Target marker (triangle on the axis)
  if (
    showPrimary &&
    target !== undefined &&
    isFinite(target) &&
    target >= displayMin &&
    target <= displayMax
  ) {
    const px = xToPx(target);
    ctx.fillStyle = colors.meanLine;
    ctx.beginPath();
    ctx.moveTo(px, baselineY - 1);
    ctx.lineTo(px - 6, baselineY - 11);
    ctx.lineTo(px + 6, baselineY - 11);
    ctx.closePath();
    ctx.fill();
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('T', px, baselineY - 12);
  }

  // Draw primary LSL/USL lines with z-scores and percentages (only in single distribution mode)
  if (showPrimary) {
    const zLSL = (lsl - mean) / std;
    const zUSL = (usl - mean) / std;
    const pctBelowLSL = phi(zLSL) * 100;
    const pctAboveUSL = phi(-zUSL) * 100;

    const drawLimit = (value: number, label: string, z: number, pctText: string) => {
      if (value < displayMin || value > displayMax) return;
      const px = xToPx(value);
      ctx.save();
      ctx.strokeStyle = colors.specLine;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, baselineY);
      ctx.stroke();
      ctx.restore();

      // Keep labels inside the canvas when a limit sits near an edge
      const align: CanvasTextAlign = px < 50 ? 'left' : px > w - 50 ? 'right' : 'center';
      const labelX = align === 'left' ? px + 4 : align === 'right' ? px - 4 : px;
      ctx.fillStyle = colors.specLine;
      ctx.textAlign = align;
      ctx.textBaseline = 'bottom';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`${label}: ${formatValue(value)}`, labelX, topLabelY - 24);
      ctx.font = '10px Arial';
      ctx.fillText(`z = ${z.toFixed(2)}`, labelX, topLabelY - 12);
      ctx.fillText(pctText, labelX, topLabelY - 2);
    };

    drawLimit(lsl, 'LSL', zLSL, `${formatPercent(pctBelowLSL)} below`);
    drawLimit(usl, 'USL', zUSL, `${formatPercent(pctAboveUSL)} above`);
  }

  // Draw scenario-specific LSL/USL lines (in comparison mode)
  if (!showPrimary && visibleScenarios.length > 0) {
    visibleScenarios.forEach((scenario, index) => {
      (
        [
          ['LSL', scenario.lsl],
          ['USL', scenario.usl],
        ] as const
      ).forEach(([label, value]) => {
        if (value < displayMin || value > displayMax) return;
        const px = xToPx(value);
        ctx.save();
        ctx.strokeStyle = scenario.color;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, baselineY);
        ctx.stroke();
        ctx.restore();

        // Stagger labels so coincident limits from different scenarios stay legible
        ctx.fillStyle = scenario.color;
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, px, 2 + (index % 3) * 10);
      });
    });
  }

  // Draw top axis sigma markers (only for primary distribution)
  if (showPrimary) {
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const topY = 18;
    // Thin out labels when σ is only a few pixels wide (e.g. on phones)
    const sigmaPx = (std / range) * w;
    const labelEvery = sigmaPx >= 26 ? 1 : sigmaPx >= 13 ? 3 : 6;

    for (let n = 1; n <= 6; n++) {
      [-1, 1].forEach((sign) => {
        const x = mean + sign * n * std;
        if (x < displayMin || x > displayMax) return;

        const px = xToPx(x);
        ctx.strokeStyle = colors.mutedText;
        ctx.beginPath();
        ctx.moveTo(px, topY);
        ctx.lineTo(px, topY + 6);
        ctx.stroke();

        if (n % labelEvery !== 0) return;
        ctx.fillStyle = colors.text;
        ctx.fillText((sign > 0 ? '+' : '-') + n + 'σ', px, topY - 2);
      });
    }
  }

  // Draw legend (top-right with backdrop)
  const legendItems: { name: string; color: string; dashed?: boolean }[] = [];
  if (showPrimary) {
    if (showOverall) {
      legendItems.push({ name: `Within σ=${formatValue(std)}`, color: colors.primaryCurve });
      legendItems.push({
        name: `Overall σ=${formatValue(overallStd!)}`,
        color: colors.primaryCurve,
        dashed: true,
      });
    } else {
      legendItems.push({ name: `Primary σ=${formatValue(std)}`, color: colors.primaryCurve });
    }
    if (histogramVisible) {
      legendItems.push({ name: `Data (n=${histogramData.sampleSize})`, color: colors.histogram });
    }
  }
  visibleScenarios.forEach((s) => legendItems.push({ name: s.name, color: s.color }));

  if (legendItems.length > 0) {
    ctx.save();
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const padding = 8;
    const lineHeight = 16;
    const swatchSize = 12;
    const swatchGap = 6;
    const maxLabelWidth = Math.max(80, w * 0.3);

    const labels = legendItems.map((item) => truncateText(ctx, item.name, maxLabelWidth));
    const maxWidth = Math.max(
      ...labels.map((label) => swatchSize + swatchGap + ctx.measureText(label).width),
    );

    const legendWidth = maxWidth + padding * 2;
    const legendHeight = legendItems.length * lineHeight + padding * 2;
    const legendX = w - legendWidth - 10;
    const legendY = 30;

    ctx.fillStyle = colors.legendBackground;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    ctx.strokeStyle = colors.legendBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    legendItems.forEach((item, index) => {
      const itemY = legendY + padding + index * lineHeight;
      const swatchX = legendX + padding;
      if (item.dashed) {
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(swatchX, itemY + 8);
        ctx.lineTo(swatchX + swatchSize, itemY + 8);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = item.color;
        ctx.fillRect(swatchX, itemY + 2, swatchSize, swatchSize);
      }
      ctx.fillStyle = colors.text;
      ctx.fillText(labels[index], swatchX + swatchSize + swatchGap, itemY);
    });

    ctx.restore();
  }
}

/** Format a data value with precision appropriate to its magnitude */
export function formatValue(value: number): string {
  if (!isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs !== 0 && abs < 0.01) return value.toPrecision(3);
  if (abs >= 1000) return value.toFixed(1);
  return value.toFixed(abs < 1 ? 3 : 2);
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

/**
 * Export canvas as PNG
 */
export function exportAsPNG(
  canvas: HTMLCanvasElement,
  filename: string = 'capability-chart.png',
): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(blob, filename);
  });
}

/** Trigger a browser download for a Blob */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next tick: some browsers cancel the download if revoked synchronously
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
