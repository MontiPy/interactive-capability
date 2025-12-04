import {
  Typography,
  Box,
  Fab,
  Grid,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import Chart from './components/Chart';
import StatsDisplay from './components/StatsDisplay';
import ExportMenu from './components/ExportMenu';
import DataImportDialog from './components/DataImportDialog';
import PresetsMenu from './components/PresetsMenu';
import AdvancedStatsDialog from './components/AdvancedStatsDialog';
import TabNavigation from './components/TabNavigation';
import SingleDistributionPanel from './components/SingleDistributionPanel';
import ComparisonPanel from './components/ComparisonPanel';
import { useState } from 'react';
import { useApp } from './context/AppContext';

export default function App() {
  const { state } = useApp();
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [dataImportOpen, setDataImportOpen] = useState(false);
  const [advancedStatsOpen, setAdvancedStatsOpen] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const controlsContent = state.activeTab === 'single' ? (
    <SingleDistributionPanel
      onImportData={() => {
        setDataImportOpen(true);
        if (isMobile) setMobileDrawerOpen(false);
      }}
      onAdvancedStats={() => {
        setAdvancedStatsOpen(true);
        if (isMobile) setMobileDrawerOpen(false);
      }}
      onScenarioAdded={() => {
        showSnackbar('Added to Scenario Comparison', 'success');
      }}
    />
  ) : (
    <ComparisonPanel
      onImportData={() => {
        setDataImportOpen(true);
        if (isMobile) setMobileDrawerOpen(false);
      }}
      onAdvancedStats={() => {
        setAdvancedStatsOpen(true);
        if (isMobile) setMobileDrawerOpen(false);
      }}
    />
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h5" component="h1" fontWeight={600}>
            Process Capability Playground
          </Typography>
          {!isMobile && <TabNavigation />}
        </Box>
        <PresetsMenu />
      </Box>

      {/* Main Content - 2 Column Layout */}
      <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Grid container sx={{ height: '100%', minHeight: 0 }}>
          {/* Left Column - Controls (40% width) - Desktop only */}
          {!isMobile && !leftPanelCollapsed && (
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
                p: 2,
                position: 'relative',
              }}
            >
              {controlsContent}
              <Tooltip title="Collapse panel for full-width chart">
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 4,
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
          )}

          {/* Expand Button */}
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
                    boxShadow: 2,
                    '&:hover': { boxShadow: 4 },
                    borderRadius: '0 8px 8px 0',
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
          {isMobile && (
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
          )}

          {/* Right Column - Chart & Stats (60% width or full width) */}
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
              p: 2,
            }}
          >
            <Box sx={{ flex: '1 1 auto', minHeight: 0, mb: 2 }}>
              <Chart />
            </Box>
            <Box sx={{ flex: '0 0 auto' }}>
              <StatsDisplay onOpenAdvanced={() => setAdvancedStatsOpen(true)} />
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Tooltip title="Export chart/metrics">
        <Fab
          color="primary"
          aria-label="export"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={(e) => setExportMenuAnchor(e.currentTarget)}
        >
          <DownloadIcon />
        </Fab>
      </Tooltip>

      <ExportMenu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      />

      <DataImportDialog
        open={dataImportOpen}
        onClose={() => setDataImportOpen(false)}
      />

      <AdvancedStatsDialog
        open={advancedStatsOpen}
        onClose={() => setAdvancedStatsOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
