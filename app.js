// Minimal app.js implementing Cp/Cpk and percent-in-spec calculations
// and drawing a Normal curve on a canvas with richer validation feedback.

document.addEventListener('DOMContentLoaded', () => {
  // Inputs
  const meanEl = document.getElementById('mean');
  const meanNumEl = document.getElementById('mean-num');
  const stdEl = document.getElementById('std');
  const stdNumEl = document.getElementById('std-num');
  const lslEl = document.getElementById('lsl');
  const lslSliderEl = document.getElementById('lsl-slider');
  const uslEl = document.getElementById('usl');
  const uslSliderEl = document.getElementById('usl-slider');

  const meanVal = document.getElementById('mean-val');
  const stdVal = document.getElementById('std-val');

  const cpEl = document.getElementById('cp');
  const cpkEl = document.getElementById('cpk');
  const pctOutEl = document.getElementById('pct-out');
  const pctInEl = document.getElementById('pct-in');
  const pctAboveEl = document.getElementById('pct-above');
  const pctBelowEl = document.getElementById('pct-below');
  const statOutputs = [cpEl, cpkEl, pctOutEl, pctInEl, pctAboveEl, pctBelowEl];

  const canvas = document.getElementById('plot');
  const ctx = canvas.getContext('2d');
  const canvasOverlay = document.getElementById('canvas-overlay');

  // Control elements
  const displayMinEl = document.getElementById('display-min');
  const displayMaxEl = document.getElementById('display-max');
  const tickStepEl = document.getElementById('tick-step');
  const tickFormatEl = document.getElementById('tick-format');
  const showGridEl = document.getElementById('show-grid');
  const fitToggleEl = document.getElementById('fit-toggle');
  const fitMultEl = document.getElementById('fit-mult');
  const resetBtn = document.getElementById('reset-display');
  const validationMsgEl = document.getElementById('validation-message');

  const statsModule = window.stats || null;
  const computeStats = typeof (statsModule && statsModule.computeStats) === 'function'
    ? statsModule.computeStats
    : localComputeStats;

  const PLACEHOLDER = '--';
  let lastValidState = null;

  const fieldControls = {
    mean: [meanEl, meanNumEl],
    std: [stdEl, stdNumEl],
    lsl: [lslEl, lslSliderEl],
    usl: [uslEl, uslSliderEl],
    spec: [lslEl, lslSliderEl, uslEl, uslSliderEl]
  };

  function localComputeStats(mean, std, lsl, usl) {
    const inputsAreValid = (
      Number.isFinite(mean) &&
      Number.isFinite(std) &&
      std > 0 &&
      Number.isFinite(lsl) &&
      Number.isFinite(usl) &&
      usl > lsl
    );
    if (!inputsAreValid) return null;
    const cp = (usl - lsl) / (6 * std);
    const cpu = (usl - mean) / (3 * std);
    const cpl = (mean - lsl) / (3 * std);
    const cpk = Math.min(cpu, cpl);

    function erf(x) {
      const sign = x >= 0 ? 1 : -1;
      const abs = Math.abs(x);
      const a1 = 0.254829592;
      const a2 = -0.284496736;
      const a3 = 1.421413741;
      const a4 = -1.453152027;
      const a5 = 1.061405429;
      const p = 0.3275911;
      const t = 1 / (1 + p * abs);
      const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-abs * abs);
      return sign * y;
    }
    const phi = x => 0.5 * (1 + erf(x / Math.SQRT2));

    const zL = (lsl - mean) / std;
    const zU = (usl - mean) / std;
    const pctBelow = phi(zL) * 100;
    const pctAbove = (1 - phi(zU)) * 100;
    const pctInside = (phi(zU) - phi(zL)) * 100;
    const pctOutside = 100 - pctInside;

    return { cp, cpk, pctOutside, pctAbove, pctBelow };
  }

  function normalPdf(x, mean, std) {
    const z = (x - mean) / std;
    return Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI));
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const wrap = canvas.parentElement;
    const styleW = Math.max(320, wrap.clientWidth);
    const styleH = 300;
    canvas.style.width = styleW + 'px';
    canvas.style.height = styleH + 'px';
    canvas.width = Math.round(styleW * dpr);
    canvas.height = Math.round(styleH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (lastValidState) {
      const s = lastValidState;
      renderPlot(s.mean, s.std, s.lsl, s.usl, s.displayMin, s.displayMax, s.tickStepVal, s.showGrid, s.tickFormat);
    }
  }

  window.addEventListener('resize', () => { resizeCanvas(); });
  resizeCanvas();

  function toggleOverlay(message) {
    if (message) {
      canvasOverlay.textContent = message;
      canvasOverlay.hidden = false;
      canvasOverlay.setAttribute('aria-hidden', 'false');
    } else {
      canvasOverlay.textContent = '';
      canvasOverlay.hidden = true;
      canvasOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  function setValidationMessage(text) {
    if (text) {
      validationMsgEl.textContent = text;
      validationMsgEl.hidden = false;
    } else {
      validationMsgEl.textContent = '';
      validationMsgEl.hidden = true;
    }
  }

  function setFieldValidity(field, isValid) {
    const nodes = fieldControls[field] || [];
    nodes.forEach(node => {
      if (isValid) {
        node.classList.remove('is-invalid');
        node.removeAttribute('aria-invalid');
      } else {
        node.classList.add('is-invalid');
        node.setAttribute('aria-invalid', 'true');
      }
    });
  }

  function clearValidationStates() {
    Object.keys(fieldControls).forEach(field => setFieldValidity(field, true));
  }

  function collectInputErrors(mean, std, lsl, usl) {
    const errors = [];
    if (!Number.isFinite(mean)) errors.push({ field: 'mean', message: 'Mean must be a number.' });
    if (!(Number.isFinite(std) && std > 0)) errors.push({ field: 'std', message: 'Std dev must be a positive number.' });
    if (!Number.isFinite(lsl)) errors.push({ field: 'lsl', message: 'LSL must be a number.' });
    if (!Number.isFinite(usl)) errors.push({ field: 'usl', message: 'USL must be a number.' });
    if (Number.isFinite(lsl) && Number.isFinite(usl) && !(usl > lsl)) {
      errors.push({ field: 'spec', message: 'USL must be greater than LSL.' });
    }
    return errors;
  }

  function applyCapabilityBadge(el, value) {
    el.classList.remove('stat-good', 'stat-warn', 'stat-bad');
    if (!Number.isFinite(value)) return;
    if (value >= 1.33) el.classList.add('stat-good');
    else if (value >= 1.0) el.classList.add('stat-warn');
    else el.classList.add('stat-bad');
  }

  function setStatsOutputs(stats) {
    statOutputs.forEach(el => {
      el.textContent = PLACEHOLDER;
      el.classList.remove('stat-good', 'stat-warn', 'stat-bad');
    });
    if (!stats) return;
    cpEl.textContent = stats.cp.toFixed(3);
    cpkEl.textContent = stats.cpk.toFixed(3);
    pctOutEl.textContent = stats.pctOutside.toFixed(2) + '%';
    pctInEl.textContent = stats.pctInside.toFixed(2) + '%';
    pctAboveEl.textContent = stats.pctAbove.toFixed(2) + '%';
    pctBelowEl.textContent = stats.pctBelow.toFixed(2) + '%';
    applyCapabilityBadge(cpEl, stats.cp);
    applyCapabilityBadge(cpkEl, stats.cpk);
  }

  function autoTickStep(min, max) {
    const targetTicks = 8;
    const range = Math.max(1e-6, max - min);
    const raw = range / targetTicks;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const multiples = [1, 2, 5];
    let best = multiples[0] * pow;
    let smallestDiff = Infinity;
    multiples.forEach(m => {
      const candidate = m * pow;
      const diff = Math.abs(raw - candidate);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        best = candidate;
      }
    });
    return best;
  }

  function generateTicks(min, max, step) {
    const ticks = [];
    if (!(step > 0)) return ticks;
    const start = Math.ceil(min / step) * step;
    for (let i = 0; i < 500; i++) {
      const value = start + i * step;
      if (value > max + step * 0.5) break;
      ticks.push(value);
    }
    return ticks;
  }

  function renderPlot(mean, std, lsl, usl, displayMin, displayMax, tickStepVal, showGrid, tickFormat) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const range = Math.max(0.1, displayMax - displayMin);
    const samples = Math.min(1600, Math.max(200, Math.round(range * 80)));
    const xToPx = x => ((x - displayMin) / range) * w;

    let maxPdf = 0;
    for (let i = 0; i <= samples; i++) {
      const x = displayMin + (i / samples) * range;
      maxPdf = Math.max(maxPdf, normalPdf(x, mean, std));
    }

    const baselineY = h - 30;
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(w, baselineY);
    ctx.stroke();

    const tickValues = generateTicks(displayMin, displayMax, tickStepVal);
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    tickValues.forEach(t => {
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
      let label;
      if (tickFormat === 'int') label = String(Math.round(t));
      else if (tickFormat === '1') label = Number(t).toFixed(1);
      else if (tickFormat === '2') label = Number(t).toFixed(2);
      else label = Number(t).toFixed(2).replace(/\.00$/, '');
      ctx.fillStyle = '#333';
      ctx.fillText(label, px, baselineY + 8);
    });

    ctx.strokeStyle = '#1f77b4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const x = displayMin + (i / samples) * range;
      const px = xToPx(x);
      const py = baselineY - (normalPdf(x, mean, std) / maxPdf) * (h - 80);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    function shadeRegion(xStart, xEnd, color) {
      const start = Math.max(displayMin, Math.min(displayMax, xStart));
      const end = Math.max(displayMin, Math.min(displayMax, xEnd));
      if (end <= start) return;
      ctx.fillStyle = color;
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
    }

    shadeRegion(displayMin, lsl, 'rgba(214,39,40,0.08)');
    shadeRegion(usl, displayMax, 'rgba(214,39,40,0.08)');
    shadeRegion(lsl, usl, 'rgba(31,119,180,0.12)');

    if (mean >= displayMin && mean <= displayMax) {
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
      ctx.fillText('\u03BC=' + mean.toFixed(2), pxMean, baselineY - (h - 80) - 6);
      ctx.fillStyle = '#333';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('\u03C3=' + std.toFixed(2), w - 10, 8);
    }

    ctx.strokeStyle = '#d62728';
    ctx.setLineDash([4, 4]);
    [lsl, usl].forEach(v => {
      if (v < displayMin || v > displayMax) return;
      const px = xToPx(v);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, baselineY);
      ctx.stroke();
      ctx.fillStyle = '#d62728';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(v.toFixed(2), px, baselineY - (h - 80) - 6);
      ctx.fillStyle = '#333';
    });
    ctx.setLineDash([]);

    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const topY = 18;
    for (let n = 1; n <= 6; n++) {
      [-1, 1].forEach(sign => {
        const x = mean + sign * n * std;
        if (x < displayMin || x > displayMax) return;
        const px = xToPx(x);
        ctx.strokeStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(px, topY);
        ctx.lineTo(px, topY + 6);
        ctx.stroke();
        const label = (sign > 0 ? '+' : '-') + n + '\u03C3';
        ctx.fillStyle = '#222';
        ctx.fillText(label, px, topY - 2);
      });
    }
  }

  function updateAll() {
    const mean = parseFloat(meanNumEl.value);
    const std = parseFloat(stdNumEl.value);
    const lsl = parseFloat(lslEl.value);
    const usl = parseFloat(uslEl.value);

    meanVal.textContent = Number.isFinite(mean) ? mean.toFixed(2) : PLACEHOLDER;
    stdVal.textContent = Number.isFinite(std) ? std.toFixed(2) : PLACEHOLDER;

    const errors = collectInputErrors(mean, std, lsl, usl);
    clearValidationStates();

    if (errors.length) {
      setStatsOutputs(null);
      const message = errors.map(err => err.message).join(' ');
      setValidationMessage(message);
      toggleOverlay(errors[0]?.message || 'Enter valid inputs to update the plot.');
      errors.forEach(err => setFieldValidity(err.field, false));
      return;
    }

    setValidationMessage('');
    toggleOverlay(null);

    const stats = computeStats(mean, std, lsl, usl);
    if (!stats) return;
    setStatsOutputs(stats);

    let displayMin = parseFloat(displayMinEl.value);
    let displayMax = parseFloat(displayMaxEl.value);
    const fit = fitToggleEl.checked;
    const fitN = parseFloat(fitMultEl.value) || 4;
    if (fit) {
      displayMin = mean - fitN * std;
      displayMax = mean + fitN * std;
      displayMinEl.value = displayMin.toFixed(2);
      displayMaxEl.value = displayMax.toFixed(2);
    }
    if (!Number.isFinite(displayMin) || !Number.isFinite(displayMax) || displayMin >= displayMax) {
      displayMin = mean - 6 * std;
      displayMax = mean + 6 * std;
    }

    const rawTickStep = parseFloat(tickStepEl.value);
    const tickStepVal = (rawTickStep > 0) ? rawTickStep : autoTickStep(displayMin, displayMax);
    const showGrid = !!showGridEl.checked;
    const tickFormat = tickFormatEl.value || 'auto';

    renderPlot(mean, std, lsl, usl, displayMin, displayMax, tickStepVal, showGrid, tickFormat);
    lastValidState = { mean, std, lsl, usl, displayMin, displayMax, tickStepVal, showGrid, tickFormat };
  }

  function bindPair(rangeEl, numEl, parser = parseFloat) {
    numEl.value = rangeEl.value;
    rangeEl.addEventListener('input', () => { numEl.value = rangeEl.value; updateAll(); });
    numEl.addEventListener('input', () => {
      const v = parser(numEl.value);
      if (!Number.isNaN(v)) rangeEl.value = v;
      updateAll();
    });
  }

  bindPair(meanEl, meanNumEl);
  bindPair(stdEl, stdNumEl);
  bindPair(lslSliderEl, lslEl);
  bindPair(uslSliderEl, uslEl);

  displayMinEl.addEventListener('input', () => { fitToggleEl.checked = false; updateAll(); });
  displayMaxEl.addEventListener('input', () => { fitToggleEl.checked = false; updateAll(); });

  [meanEl, meanNumEl, stdEl, stdNumEl].forEach(el => el.addEventListener('input', updateAll));
  [lslEl, lslSliderEl, uslEl, uslSliderEl].forEach(el => el.addEventListener('input', updateAll));
  [tickStepEl, fitMultEl].forEach(el => el.addEventListener('input', updateAll));
  [tickFormatEl, showGridEl, fitToggleEl].forEach(el => el.addEventListener('change', updateAll));

  resetBtn.addEventListener('click', () => {
    displayMinEl.value = -6;
    displayMaxEl.value = 6;
    tickStepEl.value = '';
    tickFormatEl.value = 'auto';
    showGridEl.checked = true;
    fitToggleEl.checked = false;
    fitMultEl.value = 4;
    meanEl.value = 0;
    meanNumEl.value = 0;
    stdEl.value = 1;
    stdNumEl.value = 1;
    lslEl.value = -3.0;
    lslSliderEl.value = -3.0;
    uslEl.value = 3.0;
    uslSliderEl.value = 3.0;
    updateAll();
  });

  updateAll();
});
