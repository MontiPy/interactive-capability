import {
  Typography,
  Box,
  Grid,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Menu as MenuIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { useState, ReactNode } from 'react';
import TabNavigation from './TabNavigation';
import PresetsMenu from './PresetsMenu';
import { useApp } from '../context/AppContext';
import { useColorMode } from '../context/ColorModeContext';

interface LayoutProps {
  controlsContent: ReactNode;
  children: ReactNode;
  onNotify?: (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl';

export default function Layout({ controlsContent, children, onNotify }: LayoutProps) {
  const { state, dispatch, canUndo, canRedo } = useApp();
  const { mode, toggleColorMode } = useColorMode();
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const desktopControls = (
    <Grid
      item
      xs={12}
      md={4}
      lg={4.8}
      sx={{
        height: '100%',
        minHeight: 0,
        borderRight: 1,
        borderColor: 'divider',
        overflowY: 'auto',
        overflowX: 'hidden',
        p: 3,
        position: 'relative',
        bgcolor: 'background.default',
      }}
    >
      {controlsContent}
      <Tooltip title="Collapse panel for full-width chart">
        <IconButton
          sx={{
            position: 'absolute',
            top: 16,
            right: 12,
            zIndex: 1,
          }}
          size="small"
          onClick={() => setLeftPanelCollapsed(true)}
          aria-label="Collapse left panel"
        >
          <CollapseIcon />
        </IconButton>
      </Tooltip>
    </Grid>
  );

  const mobileDrawer = (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      PaperProps={{
        sx: { width: '85%', maxWidth: 400, p: 2 },
      }}
    >
      {controlsContent}
    </Drawer>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          px: { xs: 1.5, sm: 3 },
          py: 1,
          gap: 1,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: '1 1 auto' }}>
          {isMobile && (
            <IconButton
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open menu"
              edge="start"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h5"
            component="h1"
            fontWeight={700}
            noWrap
            sx={{ fontSize: { xs: '1rem', sm: '1.2rem' }, minWidth: 0 }}
          >
            {isMobile ? 'Cp/Cpk Playground' : 'Process Capability Playground'}
          </Typography>
          {!isMobile && <TabNavigation />}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.5 }, flexShrink: 0 }}>
          <Tooltip title={`Undo (${MOD}+Z)`}>
            <span>
              <IconButton
                onClick={() => dispatch({ type: 'UNDO' })}
                disabled={!canUndo}
                aria-label="Undo"
              >
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={`Redo (${MOD}+Shift+Z)`}>
            <span>
              <IconButton
                onClick={() => dispatch({ type: 'REDO' })}
                disabled={!canRedo}
                aria-label="Redo"
              >
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Reset everything to defaults">
            <IconButton
              onClick={() => {
                dispatch({ type: 'RESET_ALL' });
                onNotify?.(`Session reset. Press ${MOD}+Z to undo.`, 'info');
              }}
              aria-label="Reset session"
            >
              <ResetIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={toggleColorMode} aria-label="Toggle dark mode">
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          {state.activeTab === 'single' && !isMobile && <PresetsMenu />}
        </Box>
      </Box>

      {/* Mobile tab bar (the header has no room for tabs on small screens) */}
      {isMobile && (
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1,
          }}
        >
          <TabNavigation />
          {state.activeTab === 'single' && <PresetsMenu compact />}
        </Box>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: { xs: 'auto', md: 'hidden' }, minHeight: 0 }}>
        <Grid container sx={{ height: { xs: 'auto', md: '100%' }, minHeight: { md: 0 } }}>
          {/* Left Column (Desktop) */}
          {!isMobile && !leftPanelCollapsed && desktopControls}

          {/* Expand Button (Desktop) */}
          {!isMobile && leftPanelCollapsed && (
            <Box
              sx={{
                position: 'fixed',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1200,
              }}
            >
              <Tooltip title="Expand controls panel">
                <IconButton
                  sx={{
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    boxShadow: 3,
                    '&:hover': {
                      boxShadow: 6,
                      bgcolor: 'background.default',
                    },
                    borderRadius: '0 12px 12px 0',
                    p: 1,
                  }}
                  onClick={() => setLeftPanelCollapsed(false)}
                  aria-label="Expand left panel"
                >
                  <ExpandIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Mobile Drawer */}
          {isMobile && mobileDrawer}

          {/* Right Column - Chart & Stats */}
          <Grid
            item
            xs={12}
            md={leftPanelCollapsed ? 12 : 8}
            lg={leftPanelCollapsed ? 12 : 7.2}
            sx={{
              height: { xs: 'auto', md: '100%' },
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 1.5, md: 3 },
            }}
          >
            {children}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
