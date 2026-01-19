import { Box, Snackbar, Alert } from '@mui/material';
import Chart from './components/Chart';
import StatsDisplay from './components/StatsDisplay';
import ExportMenu from './components/ExportMenu';
import DataImportDialog from './components/DataImportDialog';
import AdvancedStatsDialog from './components/AdvancedStatsDialog';
import React, { Suspense, useState, useCallback, useMemo } from 'react';
import ComparisonPanel from './components/ComparisonPanel';
import Layout from './components/Layout';
import { useApp } from './context/AppContext';

const SingleDistributionPanel = React.lazy(() => import('./components/SingleDistributionPanel'));

export default function App() {
  const { state } = useApp();
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [dataImportOpen, setDataImportOpen] = useState(false);
  const [advancedStatsOpen, setAdvancedStatsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Memoized callbacks to prevent unnecessary re-renders
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const showSnackbar = useCallback((message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleOpenDataImport = useCallback(() => setDataImportOpen(true), []);
  const handleCloseDataImport = useCallback(() => setDataImportOpen(false), []);
  const handleOpenAdvancedStats = useCallback(() => setAdvancedStatsOpen(true), []);
  const handleCloseAdvancedStats = useCallback(() => setAdvancedStatsOpen(false), []);
  const handleCloseExportMenu = useCallback(() => setExportMenuAnchor(null), []);
  const handleOpenExportMenu = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setExportMenuAnchor(e.currentTarget);
  }, []);
  const handleScenarioAdded = useCallback(() => showSnackbar('Added to Scenario Comparison', 'success'), [showSnackbar]);

  // Memoize controls content to prevent unnecessary re-renders
  const controlsContent = useMemo(() => state.activeTab === 'single' ? (
    <Suspense fallback={<div />}> 
      <SingleDistributionPanel
        onImportData={handleOpenDataImport}
        onAdvancedStats={handleOpenAdvancedStats}
        onScenarioAdded={handleScenarioAdded}
      />
    </Suspense>
  ) : (
    <ComparisonPanel
      onImportData={handleOpenDataImport}
    />
  ), [state.activeTab, handleOpenDataImport, handleOpenAdvancedStats, handleScenarioAdded]);

  return (
    <>
      <Layout controlsContent={controlsContent}>
        <Box sx={{ flex: '1 1 auto', minHeight: 0, mb: 2 }}>
          <Chart />
        </Box>
        <Box sx={{ flex: '0 0 auto' }}>
          <StatsDisplay 
            onOpenAdvanced={handleOpenAdvancedStats}
            onOpenExportMenu={handleOpenExportMenu}
          />
        </Box>
      </Layout>

      <ExportMenu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleCloseExportMenu}
      />

      <DataImportDialog
        open={dataImportOpen}
        onClose={handleCloseDataImport}
      />

      <AdvancedStatsDialog
        open={advancedStatsOpen}
        onClose={handleCloseAdvancedStats}
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
    </>
  );
}
