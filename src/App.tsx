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

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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
      <Layout controlsContent={controlsContent}>
        <Box sx={{ flex: '1 1 auto', minHeight: 0, mb: 2 }}>
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
    </>
  );
}
