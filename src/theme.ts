import { createTheme, Theme } from '@mui/material/styles';

export type ColorMode = 'light' | 'dark';

// A more professional and modern color palette
const palette = {
  primary: { main: '#007BFF' }, // A clean, modern blue
  secondary: { main: '#6c757d' }, // A calm, neutral gray
  error: { main: '#DC3545' },
  warning: { main: '#FFC107' },
  info: { main: '#17A2B8' },
  success: { main: '#28A745' },
  background: { default: '#F8F9FA', paper: '#FFFFFF' },
  text: { primary: '#212529', secondary: '#495057' },
};

const darkPalette = {
  mode: 'dark' as const,
  primary: { main: '#4DA3FF' },
  secondary: { main: '#9AA4AE' },
  error: { main: '#F0616D' },
  warning: { main: '#FFC107' },
  info: { main: '#3BC3D9' },
  success: { main: '#4CC368' },
  background: { default: '#0F1216', paper: '#171B21' },
  text: { primary: '#E6E9EC', secondary: '#A9B1BA' },
};

export function createAppTheme(mode: ColorMode = 'light'): Theme {
  return createTheme({
    palette: mode === 'dark' ? darkPalette : { mode: 'light', ...palette },
    typography: {
      fontFamily:
        '"Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"',
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      h1: { fontSize: '2.2rem', fontWeight: 700 },
      h2: { fontSize: '1.9rem', fontWeight: 700 },
      h3: { fontSize: '1.6rem', fontWeight: 600 },
      h4: { fontSize: '1.4rem', fontWeight: 600 },
      h5: { fontSize: '1.2rem', fontWeight: 600 },
      h6: { fontSize: '1rem', fontWeight: 600 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
            transition: 'box-shadow 0.3s ease-in-out',
            '&:hover': {
              boxShadow: '0 12px 24px rgba(0,0,0,0.07)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 500,
            whiteSpace: 'nowrap',
          },
          sizeMedium: {
            padding: '7px 18px',
          },
          contained: {
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.2)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0, 123, 255, 0.25)',
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
          variant: 'outlined',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            height: 6,
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
              boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
            },
            '& .MuiSlider-track': {
              height: 6,
            },
            '& .MuiSlider-rail': {
              height: 6,
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            minHeight: 48,
          },
        },
      },
      MuiAccordion: {
        defaultProps: {
          disableGutters: true,
          elevation: 0,
        },
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 12,
            overflow: 'hidden',
            '&::before': { display: 'none' },
          }),
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: 52,
            paddingLeft: 16,
            paddingRight: 12,
          },
          content: {
            margin: '10px 0',
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            padding: '0 16px 16px',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.825rem',
            borderRadius: 8,
            padding: '6px 12px',
          },
        },
      },
    },
  });
}

export const theme = createAppTheme('light');

/** Capability thresholds used throughout the app */
export const CAPABILITY_GOOD = 1.33;
export const CAPABILITY_MARGINAL = 1.0;

// Amber dark enough to read as text on white (the MUI warning yellow is not)
const MARGINAL_TEXT = '#D18B00';

// Updated color utility for capability badges to use the new palette
export function getCapabilityColor(value: number): string {
  if (value >= CAPABILITY_GOOD) return palette.success.main; // good
  if (value >= CAPABILITY_MARGINAL) return MARGINAL_TEXT; // warn
  return palette.error.main; // bad
}

export function getCapabilityVerdict(value: number): 'capable' | 'marginal' | 'not capable' {
  if (value >= CAPABILITY_GOOD) return 'capable';
  if (value >= CAPABILITY_MARGINAL) return 'marginal';
  return 'not capable';
}

/** Colors for the canvas renderer, which can't read the MUI theme directly */
export interface ChartColors {
  background: string;
  text: string;
  mutedText: string;
  axis: string;
  grid: string;
  border: string;
  legendBackground: string;
  legendBorder: string;
  primaryCurve: string;
  meanLine: string;
  specLine: string;
  histogram: string;
  crosshair: string;
  labelBackdrop: string;
}

export function getChartColors(mode: ColorMode): ChartColors {
  if (mode === 'dark') {
    return {
      background: '#171B21',
      text: '#E6E9EC',
      mutedText: '#A9B1BA',
      axis: '#C9CED4',
      grid: '#262C34',
      border: '#2C333C',
      legendBackground: 'rgba(23, 27, 33, 0.9)',
      legendBorder: '#3A424C',
      primaryCurve: '#4DA3FF',
      meanLine: '#4CC368',
      specLine: '#F0616D',
      histogram: 'rgba(170, 180, 190, 0.35)',
      crosshair: 'rgba(230, 233, 236, 0.5)',
      labelBackdrop: 'rgba(23, 27, 33, 0.85)',
    };
  }
  return {
    background: '#FFFFFF',
    text: '#333333',
    mutedText: '#666666',
    axis: '#333333',
    grid: '#EEEEEE',
    border: '#E1E1E1',
    legendBackground: 'rgba(255, 255, 255, 0.9)',
    legendBorder: '#DDDDDD',
    primaryCurve: '#1f77b4',
    meanLine: '#2ca02c',
    specLine: '#d62728',
    histogram: 'rgba(150, 150, 150, 0.3)',
    crosshair: 'rgba(0, 0, 0, 0.35)',
    labelBackdrop: 'rgba(255, 255, 255, 0.85)',
  };
}
