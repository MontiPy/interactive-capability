import { Box, Snackbar, Alert } from '@mui/material';
import Chart from './components/Chart';
import StatsDisplay from './components/StatsDisplay';
import ExportMenu from './components/ExportMenu';
import DataImportDialog from './components/DataImportDialog';
import AdvancedStatsDialog from './components/AdvancedStatsDialog';
import React, { Suspense, useState } from 'react';
import ComparisonPanel from './components/ComparisonPanel';
import Layout from './components/Layout'; // Import the new Layout component
import { useApp } from './context/AppContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const SingleDistributionPanel = React.lazy(() => import('./components/SingleDistributionPanel'));

export default function App() {
  const { state } = useApp();
  useKeyboardShortcuts();
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [dataImportOpen, setDataImportOpen] = useState(false);
  const [advancedStatsOpen, setAdvancedStatsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const controlsContent = state.activeTab === 'single' ? (
    <Suspense fallback={<div />}> 
      <SingleDistributionPanel
        onImportData={() => setDataImportOpen(true)}
        onAdvancedStats={() => setAdvancedStatsOpen(true)}
        onScenarioAdded={() => showSnackbar('Added to Scenario Comparison', 'success')}
      />
    </Suspense>
  ) : (
    <ComparisonPanel
      onImportData={() => setDataImportOpen(true)}
    />
  );

  return (
    <>
      <Layout controlsContent={controlsContent} onNotify={showSnackbar}>
        <Box sx={{ flex: '1 1 auto', minHeight: { xs: 360, md: 0 }, mb: 2 }}>
          <Chart />
        </Box>
        <Box sx={{ flex: '0 0 auto' }}>
          <StatsDisplay 
            onOpenAdvanced={() => setAdvancedStatsOpen(true)}
            onOpenExportMenu={(e) => setExportMenuAnchor(e.currentTarget)}
          />
        </Box>
      </Layout>

      <ExportMenu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
        onNotify={showSnackbar}
      />

      <DataImportDialog
        open={dataImportOpen}
        onClose={() => setDataImportOpen(false)}
        onImported={(message) => showSnackbar(message, 'success')}
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
    </>
  );
}
