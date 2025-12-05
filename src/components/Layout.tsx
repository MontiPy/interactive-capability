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
} from '@mui/icons-material';
import { useState, ReactNode } from 'react';
import TabNavigation from './TabNavigation';
import PresetsMenu from './PresetsMenu';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  controlsContent: ReactNode;
  children: ReactNode;
}

export default function Layout({ controlsContent, children }: LayoutProps) {
  const { state } = useApp();
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
          px: 3,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open menu"
              edge="start"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h5" component="h1" fontWeight={700}>
            Process Capability Playground
          </Typography>
          {!isMobile && <TabNavigation />}
        </Box>
        {state.activeTab === 'single' && <PresetsMenu />}
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Grid container sx={{ height: '100%', minHeight: 0 }}>
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
              height: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 2, md: 3 },
            }}
          >
            {children}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
