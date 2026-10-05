import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import {
  Image as ImageIcon,
  TableChart as CsvIcon,
  Code as JsonIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { exportAsPNG, autoTickStep, renderPlot, downloadBlob } from '../utils/rendering';
import { buildConfigJSON, buildMetricsCSV } from '../utils/exportData';
import { buildShareURL } from '../utils/persistence';
import { getChartColors } from '../theme';

interface ExportMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onNotify?: (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;
}

const EXPORT_WIDTH = 1200;
const EXPORT_HEIGHT = 600;
const EXPORT_SCALE = 2;

export default function ExportMenu({ anchorEl, open, onClose, onNotify }: ExportMenuProps) {
  const { state } = useApp();
  const isComparison = state.activeTab === 'comparison';

  const handleExportPNG = () => {
    const { mean, std, lsl, usl, display, scenarios, histogramData, target } = state;
    const tickStep =
      display.tickStep && display.tickStep > 0
        ? display.tickStep
        : autoTickStep(display.displayMin, display.displayMax);

    // Off-screen canvas at a fixed 2× scale so exports are crisp on any screen
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_WIDTH * EXPORT_SCALE;
    canvas.height = EXPORT_HEIGHT * EXPORT_SCALE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(EXPORT_SCALE, 0, 0, EXPORT_SCALE, 0, 0);
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
      // Match what's on screen for the active tab
      scenarios: isComparison ? scenarios : [],
      histogramData,
      showShading: !isComparison,
      showPrimary: !isComparison,
      target,
      // Exports always use the light palette so they print and paste well
      colors: getChartColors('light'),
      pixelRatio: EXPORT_SCALE,
    });

    exportAsPNG(canvas, isComparison ? 'scenario-comparison.png' : 'capability-chart.png');
    onClose();
  };

  const handleExportCSV = () => {
    const csv = buildMetricsCSV(state);
    if (!csv) {
      onNotify?.('Nothing to export: fix the invalid inputs first', 'warning');
      onClose();
      return;
    }
    // BOM so Excel detects UTF-8 (μ, σ)
    downloadBlob(
      new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }),
      isComparison ? 'scenario-comparison.csv' : 'capability-metrics.csv',
    );
    onClose();
  };

  const handleExportJSON = () => {
    downloadBlob(
      new Blob([buildConfigJSON(state)], { type: 'application/json' }),
      'capability-config.json',
    );
    onClose();
  };

  const handleCopyLink = async () => {
    const url = buildShareURL(state, `${window.location.origin}${window.location.pathname}`);
    try {
      await navigator.clipboard.writeText(url);
      onNotify?.('Share link copied to clipboard', 'success');
    } catch {
      window.prompt('Copy this link:', url);
    }
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <MenuItem onClick={handleExportPNG}>
        <ListItemIcon>
          <ImageIcon />
        </ListItemIcon>
        <ListItemText primary="Export Chart as PNG" secondary="High-resolution chart image" />
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleExportCSV}>
        <ListItemIcon>
          <CsvIcon />
        </ListItemIcon>
        <ListItemText
          primary="Export Metrics as CSV"
          secondary={isComparison ? 'One row per scenario' : 'Spreadsheet-ready metrics'}
        />
      </MenuItem>
      <MenuItem onClick={handleExportJSON}>
        <ListItemIcon>
          <JsonIcon />
        </ListItemIcon>
        <ListItemText primary="Export Config as JSON" secondary="Full configuration with metrics" />
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleCopyLink}>
        <ListItemIcon>
          <LinkIcon />
        </ListItemIcon>
        <ListItemText primary="Copy Share Link" secondary="Includes all scenarios" />
      </MenuItem>
    </Menu>
  );
}
