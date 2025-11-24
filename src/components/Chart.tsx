import { useEffect, useRef, useState } from 'react';
import { Paper, Box, Alert } from '@mui/material';
import { useApp } from '../context/AppContext';
import { renderPlot, autoTickStep } from '../utils/rendering';

export default function Chart() {
  const { state, dispatch } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const renderRequestRef = useRef(false);

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

    const { mean, std, lsl, usl, display, scenarios, histogramData } = state;

    // Use viewport values from context (already computed by hybrid auto-viewport)
    const displayMin = display.displayMin;
    const displayMax = display.displayMax;

    const tickStep =
      display.tickStep && display.tickStep > 0
        ? display.tickStep
        : autoTickStep(displayMin, displayMax);

    // Clear canvas first to prevent multiple overlays
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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
      scenarios,
      histogramData,
    });
  }, [
    state.mean,
    state.std,
    state.lsl,
    state.usl,
    state.display,
    state.scenarios,
    state.histogramData,
    validationError,
  ]);

  // Resize canvas on window resize (fill available container height)
  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasRef.current || !containerRef.current) return;

      const dpr = window.devicePixelRatio || 1;
      const container = containerRef.current;
      const width = Math.max(320, container.clientWidth);
      const height = Math.max(300, container.clientHeight); // Use container height

      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
      canvasRef.current.width = Math.round(width * dpr);
      canvasRef.current.height = Math.round(height * dpr);

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // Request a re-render after resize
      renderRequestRef.current = true;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Handle render requests from resize
  useEffect(() => {
    if (renderRequestRef.current && canvasRef.current && !validationError) {
      renderRequestRef.current = false;

      const { mean, std, lsl, usl, display, scenarios, histogramData } = state;

      // Use viewport values from context (already computed by hybrid auto-viewport)
      const displayMin = display.displayMin;
      const displayMax = display.displayMax;

      const tickStep =
        display.tickStep && display.tickStep > 0
          ? display.tickStep
          : autoTickStep(displayMin, displayMax);

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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
        scenarios,
        histogramData,
      });
    }
  }, [state, validationError]);

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
