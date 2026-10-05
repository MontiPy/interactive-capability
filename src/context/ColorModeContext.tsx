import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { ColorMode, createAppTheme } from '../theme';

const STORAGE_KEY = 'capability-playground:color-mode';

interface ColorModeContextType {
  mode: ColorMode;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

function readStoredMode(): ColorMode | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Provides the MUI theme and a light/dark toggle. Defaults to the OS
 * preference until the user picks a mode explicitly.
 */
export function ColorModeProvider({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [explicitMode, setExplicitMode] = useState<ColorMode | null>(readStoredMode);
  const mode: ColorMode = explicitMode ?? (prefersDark ? 'dark' : 'light');

  useEffect(() => {
    if (!explicitMode) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, explicitMode);
    } catch {
      // ignore
    }
  }, [explicitMode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const value = useMemo(
    () => ({
      mode,
      toggleColorMode: () => setExplicitMode(mode === 'dark' ? 'light' : 'dark'),
    }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useColorMode() {
  return useContext(ColorModeContext);
}
