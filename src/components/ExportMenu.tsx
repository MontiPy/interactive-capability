import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import {
  Image as ImageIcon,
  TableChart as CsvIcon,
  Code as JsonIcon,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { exportAsPNG, autoTickStep, renderPlot } from '../utils/rendering';
import { computeStats, computeAdvancedStats } from '../utils/stats';
import { useState, useEffect } from 'react';

interface ExportMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export default function ExportMenu({ anchorEl, open, onClose }: ExportMenuProps) {
  const { state } = useApp();
  const [exportCanvas, setExportCanvas] = useState<HTMLCanvasElement | null>(null);

  // Create a hidden canvas for export
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 600;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    setExportCanvas(canvas);

    return () => {
      document.body.removeChild(canvas);
    };
  }, []);

  const handleExportPNG = () => {
    if (!exportCanvas) return;

    const { mean, std, lsl, usl, display, scenarios, histogramData } = state;

    let displayMin = display.displayMin;
    let displayMax = display.displayMax;

    if (display.fitToMean) {
      displayMin = mean - display.fitMultiplier * std;
      displayMax = mean + display.fitMultiplier * std;
    }

    const tickStep =
      display.tickStep && display.tickStep > 0
        ? display.tickStep
        : autoTickStep(displayMin, displayMax);

    // Render to hidden canvas
    const ctx = exportCanvas.getContext('2d');
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      exportCanvas.width = 1200 * dpr;
      exportCanvas.height = 600 * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      renderPlot(exportCanvas, {
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

      exportAsPNG(exportCanvas);
    }

    onClose();
  };

  const handleExportCSV = () => {
    const { mean, std, lsl, usl } = state;
    const basicStats = computeStats(mean, std, lsl, usl);
    const advancedStats = computeAdvancedStats(mean, std, lsl, usl, undefined, state.target);

    if (!basicStats || !advancedStats) return;

    const csv = [
      ['Metric', 'Value'],
      ['Mean (μ)', mean],
      ['Std Dev (σ)', std],
      ['LSL', lsl],
      ['USL', usl],
      [''],
      ['Cp', basicStats.cp],
      ['Cpk', basicStats.cpk],
      ['% Outside Spec', basicStats.pctOutside],
      ['% Inside Spec', basicStats.pctInside],
      ['% Below LSL', basicStats.pctBelow],
      ['% Above USL', basicStats.pctAbove],
      [''],
      ['Pp', advancedStats.pp],
      ['Ppk', advancedStats.ppk],
      ['DPMO', advancedStats.dpmo],
      ['Sigma Level', advancedStats.sigmaLevel],
      ...(advancedStats.cpm !== undefined ? [['Cpm', advancedStats.cpm]] : []),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'capability-metrics.csv';
    link.click();
    URL.revokeObjectURL(url);

    onClose();
  };

  const handleExportJSON = () => {
    const { mean, std, lsl, usl, scenarios } = state;
    const basicStats = computeStats(mean, std, lsl, usl);
    const advancedStats = computeAdvancedStats(mean, std, lsl, usl, undefined, state.target);

    const data = {
      timestamp: new Date().toISOString(),
      distribution: { mean, std, lsl, usl, target: state.target },
      metrics: {
        basic: basicStats,
        advanced: advancedStats,
      },
      scenarios: scenarios.map((s) => ({
        name: s.name,
        mean: s.mean,
        std: s.std,
        lsl: s.lsl,
        usl: s.usl,
        visible: s.visible,
        metrics: computeStats(s.mean, s.std, s.lsl, s.usl),
      })),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'capability-config.json';
    link.click();
    URL.revokeObjectURL(url);

    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
    >
      <MenuItem onClick={handleExportPNG}>
        <ListItemIcon>
          <ImageIcon />
        </ListItemIcon>
        <ListItemText
          primary="Export Chart as PNG"
          secondary="High-resolution chart image"
        />
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleExportCSV}>
        <ListItemIcon>
          <CsvIcon />
        </ListItemIcon>
        <ListItemText
          primary="Export Metrics as CSV"
          secondary="Spreadsheet-ready data"
        />
      </MenuItem>
      <MenuItem onClick={handleExportJSON}>
        <ListItemIcon>
          <JsonIcon />
        </ListItemIcon>
        <ListItemText
          primary="Export Config as JSON"
          secondary="Full configuration with metrics"
        />
      </MenuItem>
    </Menu>
  );
}
