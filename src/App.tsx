import { Box } from '@mui/material';
import { useState } from 'react';
import Chart from './components/Chart';
import StatsDisplay from './components/StatsDisplay';
import ExportMenu from './components/ExportMenu';
import DataImportDialog from './components/DataImportDialog';
import AdvancedStatsDialog from './components/AdvancedStatsDialog';
import ComparisonPanel from './components/ComparisonPanel';
import SingleDistributionPanel from './components/SingleDistributionPanel';
import Layout from './components/Layout';
import { useApp } from './context/AppContext';
import { useNotify } from './context/NotifyContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  const { state } = useApp();
  const notify = useNotify();
  useKeyboardShortcuts();
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [dataImportOpen, setDataImportOpen] = useState(false);
  const [advancedStatsOpen, setAdvancedStatsOpen] = useState(false);

  const controlsContent =
    state.activeTab === 'single' ? (
      <SingleDistributionPanel
        onImportData={() => setDataImportOpen(true)}
        onScenarioAdded={() => notify('Saved as a scenario for comparison', 'success', { undoable: true })}
      />
    ) : (
      <ComparisonPanel onImportData={() => setDataImportOpen(true)} />
    );

  return (
    <>
      <Layout controlsContent={controlsContent}>
        <Box
          sx={{
            flex: { md: '1 1 auto' },
            height: { xs: 340, sm: 420, md: 'auto' },
            minHeight: { md: 0 },
            mb: 2,
          }}
        >
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
        onNotify={notify}
      />

      <DataImportDialog
        open={dataImportOpen}
        onClose={() => setDataImportOpen(false)}
        onImported={(message) => notify(message, 'success', { undoable: true })}
      />

      <AdvancedStatsDialog open={advancedStatsOpen} onClose={() => setAdvancedStatsOpen(false)} />
    </>
  );
}
