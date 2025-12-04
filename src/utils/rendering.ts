import { normalPdf } from './stats';
import { HistogramData, Scenario } from '../types';

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
}

/**
 * Auto-calculate tick step based on range
 */
export function autoTickStep(min: number, max: number): number {
  const targetTicks = 8;
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
 * Format tick label based on format option
 */
export function formatTickLabel(value: number, format: 'auto' | '1' | '2' | 'int'): string {
  if (format === 'int') return String(Math.round(value));
  if (format === '1') return value.toFixed(1);
  if (format === '2') return value.toFixed(2);
  return value.toFixed(2).replace(/\.00$/, '');
}

/**
 * Main rendering function for the capability chart
 */
export function renderPlot(
  canvas: HTMLCanvasElement,
  options: RenderOptions
): void {
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
  } = options;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const range = Math.max(0.1, displayMax - displayMin);
  const samples = Math.min(1600, Math.max(200, Math.round(range * 80)));
  const xToPx = (x: number) => ((x - displayMin) / range) * w;

  // Calculate max PDF for scaling
  let maxPdf = 0;
  const allScenarios = [{ mean, std, visible: true }, ...scenarios.filter((s) => s.visible)];

  allScenarios.forEach((scenario) => {
    for (let i = 0; i <= samples; i++) {
      const x = displayMin + (i / samples) * range;
      maxPdf = Math.max(maxPdf, normalPdf(x, scenario.mean, scenario.std));
    }
  });

  // If histogram exists, consider its max for scaling
  if (histogramData) {
    const maxHistogramHeight = Math.max(...histogramData.bins.map((b) => b.count));
    const histogramPdfEquivalent = maxHistogramHeight / histogramData.sampleSize;
    maxPdf = Math.max(maxPdf, histogramPdfEquivalent * 1.5);
  }

  const baselineY = h - 30;

  // Draw baseline axis
  ctx.strokeStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(0, baselineY);
  ctx.lineTo(w, baselineY);
  ctx.stroke();

  // Draw ticks and grid
  const tickValues = generateTicks(displayMin, displayMax, tickStep);
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  tickValues.forEach((t) => {
    const px = xToPx(t);

    if (showGrid) {
      ctx.strokeStyle = '#eee';
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, baselineY);
      ctx.stroke();
    }

    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(px, baselineY);
    ctx.lineTo(px, baselineY + 6);
    ctx.stroke();

    const label = formatTickLabel(t, tickFormat);
    ctx.fillStyle = '#333';
    ctx.fillText(label, px, baselineY + 8);
  });

  // Draw histogram if present
  if (histogramData) {
    ctx.fillStyle = 'rgba(150, 150, 150, 0.3)';
    histogramData.bins.forEach((bin) => {
      if (bin.start >= displayMin && bin.end <= displayMax) {
        const x1 = xToPx(bin.start);
        const x2 = xToPx(bin.end);
        const barHeight = (bin.count / histogramData.sampleSize / maxPdf) * (h - 80);
        ctx.fillRect(x1, baselineY - barHeight, x2 - x1, barHeight);
      }
    });
  }

  // Helper: Draw normal curve
  const drawCurve = (scenarioMean: number, scenarioStd: number, color: string, lineWidth: number = 2) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    for (let i = 0; i <= samples; i++) {
      const x = displayMin + (i / samples) * range;
      const px = xToPx(x);
      const py = baselineY - (normalPdf(x, scenarioMean, scenarioStd) / maxPdf) * (h - 80);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.stroke();
  };

  // Helper: Shade region
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
      if (pattern) ctx.fillStyle = pattern;
    } else {
      ctx.fillStyle = color;
    }

    ctx.beginPath();

    let started = false;
    for (let i = 0; i <= samples; i++) {
      const x = displayMin + (i / samples) * range;
      if (x < start || x > end) continue;

      const px = xToPx(x);
      const py = baselineY - (normalPdf(x, mean, std) / maxPdf) * (h - 80);

      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.lineTo(xToPx(end), baselineY);
    ctx.lineTo(xToPx(start), baselineY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Shade spec regions (for primary distribution) - only in single distribution mode
  if (showShading) {
    // Out-of-spec regions with subtle stripes
    shadeRegion(displayMin, lsl, 'rgba(214,39,40,0.06)', true);
    shadeRegion(usl, displayMax, 'rgba(214,39,40,0.06)', true);
    // In-spec region with light green/blue
    shadeRegion(lsl, usl, 'rgba(76,175,80,0.08)', false);
  }

  // Draw primary distribution curve (only in single distribution mode)
  if (showPrimary) {
    drawCurve(mean, std, '#1f77b4', 2);
  }

  // Draw scenario curves
  scenarios.filter((s) => s.visible).forEach((scenario) => {
    drawCurve(scenario.mean, scenario.std, scenario.color, 1.5);
  });

  // Draw mean line and sigma label (primary only)
  if (showPrimary && mean >= displayMin && mean <= displayMax) {
    const pxMean = xToPx(mean);
    ctx.strokeStyle = '#2ca02c';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(pxMean, 0);
    ctx.lineTo(pxMean, baselineY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2ca02c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`μ=${mean.toFixed(2)}`, pxMean, baselineY - (h - 80) - 6);

    ctx.fillStyle = '#333';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`σ=${std.toFixed(2)}`, w - 10, 8);
  }

  // Draw primary LSL/USL lines with z-scores and percentages (only in single distribution mode)
  if (showPrimary) {
    ctx.strokeStyle = '#d62728';
    ctx.setLineDash([4, 4]);

    // Calculate z-scores and percentages
    const zLSL = (lsl - mean) / std;
    const zUSL = (usl - mean) / std;

    // Import phi function for percentage calculations
    const phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));
    const erf = (x: number) => {
      const sign = x >= 0 ? 1 : -1;
      x = Math.abs(x);
      const a1 = 0.254829592;
      const a2 = -0.284496736;
      const a3 = 1.421413741;
      const a4 = -1.453152027;
      const a5 = 1.061405429;
      const p = 0.3275911;
      const t = 1 / (1 + p * x);
      const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
      return sign * y;
    };

    const pctBelowLSL = phi(zLSL) * 100;
    const pctAboveUSL = (1 - phi(zUSL)) * 100;

    // Draw LSL
    if (lsl >= displayMin && lsl <= displayMax) {
      const px = xToPx(lsl);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, baselineY);
      ctx.stroke();

      ctx.fillStyle = '#d62728';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`LSL: ${lsl.toFixed(2)}`, px, baselineY - (h - 80) - 24);

      ctx.font = '10px Arial';
      ctx.fillText(`z = ${zLSL.toFixed(2)}`, px, baselineY - (h - 80) - 12);
      ctx.fillText(`${pctBelowLSL.toFixed(2)}% below`, px, baselineY - (h - 80) - 2);
    }

    // Draw USL
    if (usl >= displayMin && usl <= displayMax) {
      const px = xToPx(usl);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, baselineY);
      ctx.stroke();

      ctx.fillStyle = '#d62728';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`USL: ${usl.toFixed(2)}`, px, baselineY - (h - 80) - 24);

      ctx.font = '10px Arial';
      ctx.fillText(`z = ${zUSL.toFixed(2)}`, px, baselineY - (h - 80) - 12);
      ctx.fillText(`${pctAboveUSL.toFixed(2)}% above`, px, baselineY - (h - 80) - 2);
    }

    ctx.setLineDash([]);
  }

  // Draw scenario-specific LSL/USL lines (in comparison mode)
  if (!showPrimary && scenarios.length > 0) {
    scenarios.filter((s) => s.visible).forEach((scenario) => {
      // Draw LSL for this scenario
      if (scenario.lsl >= displayMin && scenario.lsl <= displayMax) {
        const px = xToPx(scenario.lsl);
        ctx.strokeStyle = scenario.color;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, baselineY);
        ctx.stroke();

        // Small label at top
        ctx.fillStyle = scenario.color;
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`LSL`, px, 2);
      }

      // Draw USL for this scenario
      if (scenario.usl >= displayMin && scenario.usl <= displayMax) {
        const px = xToPx(scenario.usl);
        ctx.strokeStyle = scenario.color;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, baselineY);
        ctx.stroke();

        // Small label at top
        ctx.fillStyle = scenario.color;
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`USL`, px, 2);
      }
    });

    ctx.setLineDash([]);
    ctx.lineWidth = 1;
  }

  // Draw top axis sigma markers (only for primary distribution)
  if (showPrimary) {
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const topY = 18;

    for (let n = 1; n <= 6; n++) {
      [-1, 1].forEach((sign) => {
        const x = mean + sign * n * std;
        if (x < displayMin || x > displayMax) return;

        const px = xToPx(x);
        ctx.strokeStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(px, topY);
        ctx.lineTo(px, topY + 6);
        ctx.stroke();

        const label = (sign > 0 ? '+' : '-') + n + 'σ';
        ctx.fillStyle = '#222';
        ctx.fillText(label, px, topY - 2);
      });
    }
  }

  // Draw legend for multiple scenarios (top-right with backdrop)
  const visibleScenarios = scenarios.filter((s) => s.visible);
  if (visibleScenarios.length > 0 || (showPrimary && visibleScenarios.length === 0)) {
    ctx.save();

    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Calculate legend dimensions
    const primaryItem = showPrimary ? [{ name: 'Primary', color: '#1f77b4' }] : [];
    const legendItems = [...primaryItem, ...visibleScenarios];
    const padding = 8;
    const lineHeight = 16;
    const swatchSize = 12;
    const swatchGap = 6;

    let maxWidth = 0;
    legendItems.forEach((item) => {
      const textWidth = ctx.measureText(item.name).width;
      maxWidth = Math.max(maxWidth, swatchSize + swatchGap + textWidth);
    });

    const legendWidth = maxWidth + padding * 2;
    const legendHeight = legendItems.length * lineHeight + padding * 2;
    const legendX = w - legendWidth - 10;
    const legendY = 30;

    // Draw backdrop with semi-transparent white
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    // Draw legend items
    legendItems.forEach((item, index) => {
      const itemY = legendY + padding + index * lineHeight;

      // Draw color swatch
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX + padding, itemY + 2, swatchSize, swatchSize);

      // Draw label
      ctx.fillStyle = '#333';
      ctx.fillText(item.name, legendX + padding + swatchSize + swatchGap, itemY);
    });

    ctx.restore();
  }

  // Draw hint text for zoom/pan (will add zoom/pan functionality later)
  ctx.font = '10px Arial';
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  // ctx.fillText('Scroll to zoom • Drag to pan', w - 10, 8);
}

/**
 * Export canvas as PNG
 */
export function exportAsPNG(canvas: HTMLCanvasElement, filename: string = 'capability-chart.png'): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  });
}

/**
 * Export canvas as SVG (simplified version - generates SVG from chart data)
 */
export function exportAsSVG(
  options: RenderOptions,
  filename: string = 'capability-chart.svg'
): void {
  const { mean, std, lsl, usl, displayMin, displayMax } = options;

  const width = 800;
  const height = 400;
  const padding = 60;
  const range = displayMax - displayMin;
  const xScale = (x: number) => padding + ((x - displayMin) / range) * (width - 2 * padding);
  const yScale = (y: number) => height - padding - y * (height - 2 * padding);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;

  // Draw normal curve
  svg += `<path d="`;
  const samples = 200;
  let maxPdf = 0;
  for (let i = 0; i <= samples; i++) {
    const x = displayMin + (i / samples) * range;
    maxPdf = Math.max(maxPdf, normalPdf(x, mean, std));
  }

  for (let i = 0; i <= samples; i++) {
    const x = displayMin + (i / samples) * range;
    const y = normalPdf(x, mean, std) / maxPdf;
    const px = xScale(x);
    const py = yScale(y);
    svg += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
  }

  svg += `" stroke="#1f77b4" stroke-width="2" fill="none"/>`;

  // Draw LSL and USL
  [lsl, usl].forEach((limit) => {
    const px = xScale(limit);
    svg += `<line x1="${px}" y1="${padding}" x2="${px}" y2="${height - padding}" stroke="#d62728" stroke-width="2" stroke-dasharray="5,5"/>`;
    svg += `<text x="${px}" y="${padding - 10}" text-anchor="middle" font-size="12" fill="#d62728">${limit.toFixed(2)}</text>`;
  });

  svg += `</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
