import {
  Typography,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
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
import { useNotify } from '../context/NotifyContext';

interface LayoutProps {
  controlsContent: ReactNode;
  children: ReactNode;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl';

/** Small capability-curve mark used as the app logo */
function LogoMark() {
  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      aria-hidden
      sx={{ width: 28, height: 28, flexShrink: 0, display: 'block' }}
    >
      <rect width="32" height="32" rx="7" fill="#007BFF" />
      <path
        d="M3 25 C10 25 11 7 16 7 S22 25 29 25"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M8 5v22M24 5v22" stroke="#FFC6CC" strokeWidth="1.5" strokeDasharray="2.5 2" />
    </Box>
  );
}

export default function Layout({ controlsContent, children }: LayoutProps) {
  const { state, dispatch, canUndo, canRedo } = useApp();
  const { mode, toggleColorMode } = useColorMode();
  const notify = useNotify();
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const panelTitle = state.activeTab === 'single' ? 'Process & Specs' : 'Scenarios';

  const headerActions = (
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
            notify('Session reset to defaults', 'info', { undoable: true });
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
      {state.activeTab === 'single' && !isMobile && (
        <>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1 }} />
          <PresetsMenu />
        </>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        height: { md: '100vh' },
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          position: { xs: 'sticky', md: 'static' },
          top: 0,
          zIndex: (t) => t.zIndex.appBar,
        }}
      >
        {/* Header */}
        <Box
          component="header"
          sx={{
            px: { xs: 1.5, sm: 3 },
            py: { xs: 0.5, md: 0 },
            gap: 1,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'background.paper',
            minHeight: 56,
          }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: '1 1 auto' }}
          >
            <LogoMark />
            <Typography
              variant="h5"
              component="h1"
              fontWeight={700}
              noWrap
              sx={{
                fontSize: { xs: '1rem', sm: '1.15rem' },
                minWidth: 0,
                mr: { xs: 0, lg: 2 },
                display: { md: isWide ? 'block' : 'none' },
              }}
            >
              {isWide ? 'Process Capability Playground' : isMobile ? 'Cp/Cpk Playground' : ''}
            </Typography>
            {!isMobile && <TabNavigation />}
          </Box>
          {headerActions}
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
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: { md: 'hidden' },
        }}
      >
        {/* Controls sidebar (desktop) */}
        {!isMobile && !leftPanelCollapsed && (
          <Box
            component="aside"
            aria-label={panelTitle}
            sx={{
              width: { md: 340, lg: 380 },
              flexShrink: 0,
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pl: 2.5,
                pr: 1,
                py: 1,
              }}
            >
              <Typography
                variant="overline"
                color="text.secondary"
                fontWeight={700}
                sx={{ letterSpacing: '0.08em' }}
              >
                {panelTitle}
              </Typography>
              <Tooltip title="Hide panel">
                <IconButton
                  size="small"
                  onClick={() => setLeftPanelCollapsed(true)}
                  aria-label="Collapse left panel"
                >
                  <CollapseIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                px: 2,
                pb: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {controlsContent}
            </Box>
          </Box>
        )}

        {/* Collapsed rail (desktop) */}
        {!isMobile && leftPanelCollapsed && (
          <Box
            sx={{
              width: 48,
              flexShrink: 0,
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              justifyContent: 'center',
              pt: 1,
            }}
          >
            <Tooltip title="Show panel" placement="right">
              <IconButton
                onClick={() => setLeftPanelCollapsed(false)}
                aria-label="Expand left panel"
              >
                <ExpandIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Chart & Stats */}
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 1.5, md: 3 },
          }}
        >
          {children}
        </Box>

        {/* Controls inline below the chart on phones */}
        {isMobile && (
          <Box
            component="section"
            aria-label={panelTitle}
            sx={{ px: 1.5, pb: 3, display: 'flex', flexDirection: 'column' }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              fontWeight={700}
              sx={{ letterSpacing: '0.08em', mb: 0.5 }}
            >
              {panelTitle}
            </Typography>
            {controlsContent}
          </Box>
        )}
      </Box>
    </Box>
  );
}
