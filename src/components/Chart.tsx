import { useEffect, useMemo, useRef, useState } from 'react';
import { Paper, Box, Alert, Typography } from '@mui/material';
import { useApp } from '../context/AppContext';
import { useColorMode } from '../context/ColorModeContext';
import { getChartColors } from '../theme';
import { renderPlot, autoTickStep, pxToValue, valueToPx, formatValue } from '../utils/rendering';
import { phi } from '../utils/stats';
import { formatPercent, niceStep, roundToStep } from '../utils/format';

function validate(mean: number, std: number, lsl: number, usl: number): string | null {
  if (!isFinite(mean)) return 'Mean must be a number.';
  if (!(isFinite(std) && std > 0)) return 'Standard deviation must be a positive number.';
  if (!isFinite(lsl)) return 'LSL must be a number.';
  if (!isFinite(usl)) return 'USL must be a number.';
  if (!(usl > lsl)) return 'USL must be greater than LSL.';
  return null;
}

export default function Chart() {
  const { state, dispatch } = useApp();
  const { mode } = useColorMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hover, setHover] = useState<{ px: number; value: number } | null>(null);

  const colors = useMemo(() => getChartColors(mode), [mode]);
  const isComparison = state.activeTab === 'comparison';
  // Validation only applies to the primary distribution shown in single mode
  const validationError = isComparison
    ? null
    : validate(state.mean, state.std, state.lsl, state.usl);

  // Latest state for pointer handlers without re-binding listeners on every change
  const stateRef = useRef(state);
  stateRef.current = state;

  // Track container size (also catches panel collapse, which doesn't fire window resize)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const width = Math.max(320, container.clientWidth);
      const height = Math.max(300, container.clientHeight);
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    };

    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Render canvas
  const { mean, std, lsl, usl, display, scenarios, histogramData, target } = state;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || validationError || size.width === 0) return;

    const tickStep =
      display.tickStep && display.tickStep > 0
        ? display.tickStep
        : // About one tick per 90px keeps labels from colliding on narrow screens
          autoTickStep(
            display.displayMin,
            display.displayMax,
            Math.min(10, Math.max(3, Math.floor(size.width / 90))),
          );

    const frame = requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      // Assigning width resets all canvas state (needed for consistent Edge rendering)
      canvas.width = Math.round(size.width * dpr);
      canvas.height = Math.round(size.height * dpr);
      canvas.style.width = `${size.width}px`;
      canvas.style.height = `${size.height}px`;
      const ctx = canvas.getContext('2d');
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

      renderPlot(canvas, {
        mean,
        std,
        lsl,
        usl,
        displayMin: display.displayMin,
        displayMax: display.displayMax,
        tickStep,
        showGrid: display.showGrid,
        tickFormat: display.tickFormat,
        scenarios: isComparison ? scenarios : [],
        histogramData,
        showShading: !isComparison,
        showPrimary: !isComparison,
        target,
        colors,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [
    mean,
    std,
    lsl,
    usl,
    target,
    display,
    scenarios,
    histogramData,
    isComparison,
    validationError,
    size,
    colors,
  ]);

  // Pointer interaction: drag LSL/USL (single mode) and hover readout (both modes)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const localX = (e: PointerEvent) => e.clientX - canvas.getBoundingClientRect().left;

    const hitLimit = (e: PointerEvent): 'lsl' | 'usl' | null => {
      const s = stateRef.current;
      if (s.activeTab !== 'single') return null;
      const width = canvas.getBoundingClientRect().width;
      const x = localX(e);
      const tolerance = e.pointerType === 'touch' ? 22 : 10;
      const dL = Math.abs(x - valueToPx(s.lsl, width, s.display.displayMin, s.display.displayMax));
      const dU = Math.abs(x - valueToPx(s.usl, width, s.display.displayMin, s.display.displayMax));
      if (Math.min(dL, dU) > tolerance) return null;
      return dL <= dU ? 'lsl' : 'usl';
    };

    const handlePointerDown = (e: PointerEvent) => {
      const limit = hitLimit(e);
      if (!limit) return;
      canvas.setPointerCapture(e.pointerId);
      dispatch({ type: 'SET_DRAGGING_LIMIT', payload: limit });
      e.preventDefault();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const s = stateRef.current;
      const width = canvas.getBoundingClientRect().width;
      const x = localX(e);
      const { displayMin, displayMax } = s.display;
      const value = pxToValue(x, width, displayMin, displayMax);

      if (s.draggingLimit) {
        const step = niceStep(displayMax - displayMin);
        const snapped = roundToStep(value, step);
        if (s.draggingLimit === 'lsl') {
          dispatch({
            type: 'SET_LSL',
            payload: Math.min(snapped, roundToStep(s.usl - step, step)),
          });
        } else {
          dispatch({
            type: 'SET_USL',
            payload: Math.max(snapped, roundToStep(s.lsl + step, step)),
          });
        }
        canvas.style.cursor = 'ew-resize';
        setHover(null);
        return;
      }

      canvas.style.cursor = hitLimit(e) ? 'ew-resize' : 'crosshair';
      if (e.pointerType !== 'touch') setHover({ px: x, value });
    };

    const endDrag = (e: PointerEvent) => {
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (stateRef.current.draggingLimit) dispatch({ type: 'SET_DRAGGING_LIMIT', payload: null });
    };

    const handleLeave = () => setHover(null);

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', handleLeave);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', endDrag);
      canvas.removeEventListener('pointercancel', endDrag);
      canvas.removeEventListener('pointerleave', handleLeave);
    };
  }, [dispatch]);

  // Readout rows for the hover tooltip
  const readout = useMemo(() => {
    if (!hover || validationError) return null;
    const x = hover.value;
    const rows = isComparison
      ? state.scenarios
          .filter((s) => s.visible && s.std > 0)
          .map((s) => ({ name: s.name, color: s.color, z: (x - s.mean) / s.std }))
      : [{ name: 'Primary', color: colors.primaryCurve, z: (x - state.mean) / state.std }];
    return { x, rows };
  }, [hover, isComparison, state.scenarios, state.mean, state.std, colors, validationError]);

  const tooltipOnLeft = hover ? hover.px > size.width / 2 : false;

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {validationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validationError}
        </Alert>
      )}
      <Box
        ref={containerRef}
        sx={{ position: 'relative', width: '100%', flex: 1, minHeight: 0, overflow: 'hidden' }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={
            isComparison
              ? `Distribution chart comparing ${state.scenarios.filter((s) => s.visible).length} scenarios`
              : `Normal distribution chart: mean ${formatValue(state.mean)}, sigma ${formatValue(state.std)}, LSL ${formatValue(state.lsl)}, USL ${formatValue(state.usl)}. Drag the spec limit lines to adjust them.`
          }
          style={{
            borderRadius: 6,
            width: '100%',
            height: '100%',
            display: 'block',
            touchAction: 'pan-y',
          }}
        />
        {isComparison && !scenarios.some((sc) => sc.visible) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 3,
              pointerEvents: 'none',
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              {scenarios.length === 0 ? 'Nothing to compare yet' : 'All scenarios are hidden'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
              {scenarios.length === 0
                ? 'Add a scenario from the panel, or save the current process with “Save as Scenario” on the Single Distribution tab.'
                : 'Use the eye icon on a scenario card to show it on the chart.'}
            </Typography>
          </Box>
        )}
        {readout && hover && (
          <>
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 30,
                left: hover.px,
                width: '1px',
                bgcolor: colors.crosshair,
                pointerEvents: 'none',
              }}
            />
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                bottom: 40,
                ...(tooltipOnLeft ? { right: size.width - hover.px + 8 } : { left: hover.px + 8 }),
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                boxShadow: 2,
                px: 1,
                py: 0.5,
                pointerEvents: 'none',
                minWidth: 140,
                maxWidth: 260,
              }}
            >
              <Typography variant="caption" fontWeight={700} display="block">
                x = {formatValue(readout.x)}
              </Typography>
              {readout.rows.map((row) => (
                <Typography
                  key={row.name}
                  variant="caption"
                  display="block"
                  sx={{
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <Box component="span" sx={{ color: row.color, fontWeight: 700 }}>
                    ■
                  </Box>{' '}
                  {readout.rows.length > 1 ? `${row.name}: ` : ''}z={row.z.toFixed(2)} · ≤x{' '}
                  {formatPercent(phi(row.z) * 100)} · &gt;x {formatPercent(phi(-row.z) * 100)}
                </Typography>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}
