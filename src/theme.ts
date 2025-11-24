import { createTheme } from '@mui/material/styles';

// Using colors from the original CSS
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1f77b4', // Original blue from curve
    },
    secondary: {
      main: '#2ca02c', // Green from mean line
    },
    error: {
      main: '#d62728', // Red from LSL/USL
    },
    warning: {
      main: '#ff7f0e', // Orange for warnings
    },
    success: {
      main: '#2ca02c',
    },
    background: {
      default: '#fafafa',
      paper: '#fff',
    },
    text: {
      primary: '#111',
      secondary: '#666',
    },
  },
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 13,
    h1: { fontSize: '2rem', fontWeight: 600 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1.1rem', fontWeight: 600 },
    h6: { fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem' },
    button: { fontSize: '0.875rem', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-thumb': {
            width: 16,
            height: 16,
          },
        },
      },
    },
  },
});

// Color utility for capability badges
export function getCapabilityColor(value: number): string {
  if (value >= 1.33) return '#2ca02c'; // good
  if (value >= 1.0) return '#ff7f0e'; // warn
  return '#d62728'; // bad
}
