import { useEffect, useRef, useState } from 'react';
import { Paper, Box, Alert } from '@mui/material';
import { useApp } from '../context/AppContext';
import { renderPlot, autoTickStep } from '../utils/rendering';

export default function Chart() {
  const { state, dispatch } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  // Validation
  useEffect(() => {
    const { mean, std, lsl, usl } = state;

    if (!isFinite(mean)) {
      setValidationError('Mean must be a number.');
      return;
    }
    if (!(isFinite(std) && std > 0)) {
      setValidationError('Standard deviation must be a positive number.');
      return;
    }
    if (!isFinite(lsl)) {
      setValidationError('LSL must be a number.');
      return;
    }
    if (!isFinite(usl)) {
      setValidationError('USL must be a number.');
      return;
    }
    if (!(usl > lsl)) {
      setValidationError('USL must be greater than LSL.');
      return;
    }

    setValidationError(null);
  }, [state.mean, state.std, state.lsl, state.usl]);

  // Render canvas
  useEffect(() => {
    if (!canvasRef.current || validationError) return;

    const { mean, std, lsl, usl, display, scenarios, histogramData, activeTab } = state;

    // Use viewport values from context (already computed by hybrid auto-viewport)
    const displayMin = display.displayMin;
    const displayMax = display.displayMax;

    const tickStep =
      display.tickStep && display.tickStep > 0
        ? display.tickStep
        : autoTickStep(displayMin, displayMax);

    // Filter scenarios based on active tab
    const displayScenarios = activeTab === 'single' ? [] : scenarios;
    const isComparisonMode = activeTab === 'comparison';

    // Use requestAnimationFrame for proper timing (Edge compatibility)
    requestAnimationFrame(() => {
      if (!canvasRef.current) return;

      // Force complete canvas reset for Edge compatibility
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Nuclear option: reset canvas width to clear all internal state
        const currentWidth = canvasRef.current.width;
        const currentHeight = canvasRef.current.height;
        canvasRef.current.width = currentWidth;
        canvasRef.current.height = currentHeight;

        // Re-apply device pixel ratio transform
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      renderPlot(canvasRef.current, {
        mean,
        std,
        lsl,
        usl,
        displayMin,
        displayMax,
        tickStep,
        showGrid: display.showGrid,
        tickFormat: display.tickFormat,
        scenarios: displayScenarios,
        histogramData,
        showShading: !isComparisonMode,
        showPrimary: !isComparisonMode,
      });
    });
  }, [
    state.mean,
    state.std,
    state.lsl,
    state.usl,
    state.display,
    state.scenarios,
    state.histogramData,
    state.activeTab,
    validationError,
    canvasDimensions,
  ]);

  // Resize canvas on window resize and track canvas dimensions (fill available container height)
  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasRef.current || !containerRef.current) return;

      const dpr = window.devicePixelRatio || 1;
      const container = containerRef.current;
      const width = Math.max(320, container.clientWidth);
      const height = Math.max(300, container.clientHeight);

      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
      canvasRef.current.width = Math.round(width * dpr);
      canvasRef.current.height = Math.round(height * dpr);

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Update dimensions to trigger re-render
      setCanvasDimensions({ width, height });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Handle draggable LSL/USL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || validationError) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!state.draggingLimit) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      // Use viewport values from context
      const displayMin = state.display.displayMin;
      const displayMax = state.display.displayMax;

      const range = displayMax - displayMin;
      const value = displayMin + (x / width) * range;

      if (state.draggingLimit === 'lsl') {
        dispatch({ type: 'SET_LSL', payload: Math.round(value * 10) / 10 });
      } else if (state.draggingLimit === 'usl') {
        dispatch({ type: 'SET_USL', payload: Math.round(value * 10) / 10 });
      }
    };

    const handleMouseUp = () => {
      dispatch({ type: 'SET_DRAGGING_LIMIT', payload: null });
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      // Use viewport values from context
      const displayMin = state.display.displayMin;
      const displayMax = state.display.displayMax;

      const range = displayMax - displayMin;
      const xToPx = (val: number) => ((val - displayMin) / range) * width;

      const lslPx = xToPx(state.lsl);
      const uslPx = xToPx(state.usl);

      const tolerance = 10;

      if (Math.abs(x - lslPx) < tolerance) {
        dispatch({ type: 'SET_DRAGGING_LIMIT', payload: 'lsl' });
        e.preventDefault();
      } else if (Math.abs(x - uslPx) < tolerance) {
        dispatch({ type: 'SET_DRAGGING_LIMIT', payload: 'usl' });
        e.preventDefault();
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [state, dispatch, validationError]);

  // Cursor change on hover
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || validationError) return;

    const handleMouseMoveHover = (e: MouseEvent) => {
      if (state.draggingLimit) {
        canvas.style.cursor = 'ew-resize';
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      // Use viewport values from context
      const displayMin = state.display.displayMin;
      const displayMax = state.display.displayMax;

      const range = displayMax - displayMin;
      const xToPx = (val: number) => ((val - displayMin) / range) * width;

      const lslPx = xToPx(state.lsl);
      const uslPx = xToPx(state.usl);

      const tolerance = 10;

      if (Math.abs(x - lslPx) < tolerance || Math.abs(x - uslPx) < tolerance) {
        canvas.style.cursor = 'ew-resize';
      } else {
        canvas.style.cursor = 'default';
      }
    };

    canvas.addEventListener('mousemove', handleMouseMoveHover);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMoveHover);
    };
  }, [state, validationError]);

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {validationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validationError}
        </Alert>
      )}
      <Box ref={containerRef} sx={{ position: 'relative', width: '100%', flex: 1, minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #e1e1e1',
            borderRadius: 6,
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
      </Box>
    </Paper>
  );
}
