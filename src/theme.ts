import { createTheme } from '@mui/material/styles';

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

export const theme = createTheme({
  palette: palette,
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"',
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
          padding: '8px 20px',
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

// Updated color utility for capability badges to use the new palette
export function getCapabilityColor(value: number): string {
  if (value >= 1.33) return palette.success.main; // good
  if (value >= 1.0) return palette.warning.main; // warn
  return palette.error.main; // bad
}
