import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Button, Snackbar } from '@mui/material';
import { useApp } from './AppContext';

export type Severity = 'success' | 'info' | 'warning' | 'error';

interface NotifyOptions {
  /** Show an "Undo" button that dispatches UNDO */
  undoable?: boolean;
}

type Notify = (message: string, severity?: Severity, options?: NotifyOptions) => void;

const NotifyContext = createContext<Notify>(() => {});

interface Toast {
  key: number;
  message: string;
  severity: Severity;
  undoable: boolean;
}

/**
 * App-wide toast notifications. Undoable actions get an inline Undo button so
 * destructive changes (delete, reset, preset load) are easy to reverse.
 */
export function NotifyProvider({ children }: { children: ReactNode }) {
  const { dispatch } = useApp();
  const [toast, setToast] = useState<Toast | null>(null);
  const [open, setOpen] = useState(false);

  const notify = useCallback<Notify>((message, severity = 'success', options) => {
    setToast({ key: Date.now(), message, severity, undoable: !!options?.undoable });
    setOpen(true);
  }, []);

  const handleClose = (_?: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const value = useMemo(() => notify, [notify]);

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.key}
        open={open}
        autoHideDuration={toast?.undoable ? 6000 : 3500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleClose}
          severity={toast?.severity ?? 'success'}
          variant="filled"
          sx={{ width: '100%', alignItems: 'center' }}
          action={
            toast?.undoable ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  dispatch({ type: 'UNDO' });
                  setOpen(false);
                }}
                sx={{ fontWeight: 700 }}
              >
                Undo
              </Button>
            ) : undefined
          }
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotify(): Notify {
  return useContext(NotifyContext);
}
