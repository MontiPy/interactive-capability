import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { parseNumericData, summarizeData } from '../utils/stats';
import { formatValue } from '../utils/rendering';
import { formatInput } from '../utils/format';

interface DataImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported?: (message: string) => void;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Example data: n=100 from N(10, 2) via Box–Muller */
function generateExampleData(): string {
  const values: string[] = [];
  for (let i = 0; i < 100; i++) {
    const u1 = Math.random() || Number.MIN_VALUE;
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    values.push((10 + 2 * z).toFixed(3));
  }
  return values.join(', ');
}

export default function DataImportDialog({ open, onClose, onImported }: DataImportDialogProps) {
  const { state, dispatch } = useApp();
  const asScenario = state.activeTab === 'comparison';
  const [text, setText] = useState('');
  const [scenarioName, setScenarioName] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lslInput, setLslInput] = useState('');
  const [uslInput, setUslInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start from the current spec limits each time the dialog opens
  useEffect(() => {
    if (open) {
      setLslInput(formatInput(state.lsl));
      setUslInput(formatInput(state.usl));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const lsl = Number(lslInput);
  const usl = Number(uslInput);
  const specsError =
    !lslInput.trim() || !uslInput.trim() || !Number.isFinite(lsl) || !Number.isFinite(usl)
      ? 'Enter both spec limits'
      : usl <= lsl
        ? 'USL must be greater than LSL'
        : null;

  const parsed = useMemo(() => (text.trim() ? parseNumericData(text) : null), [text]);
  const summary = useMemo(
    () => (parsed && parsed.values.length >= 2 ? summarizeData(parsed.values) : null),
    [parsed],
  );

  const parseError = (() => {
    if (!parsed) return null;
    if (parsed.values.length < 2) return 'Need at least 2 valid numeric values.';
    if (!summary) return 'All values are identical — there is no variation to analyse.';
    return null;
  })();

  const reset = () => {
    setText('');
    setScenarioName('');
    setFileError(null);
  };

  const handleClose = () => {
    setFileError(null);
    onClose();
  };

  const readFile = async (file: File) => {
    setFileError(null);
    if (file.size > MAX_FILE_BYTES) {
      setFileError('File is larger than 10 MB.');
      return;
    }
    try {
      setText(await file.text());
      if (asScenario && !scenarioName) setScenarioName(file.name.replace(/\.[^.]+$/, ''));
    } catch {
      setFileError('Failed to read file.');
    }
  };

  const handleImport = () => {
    if (!summary || specsError) return;
    if (asScenario) {
      const name = scenarioName.trim();
      dispatch({ type: 'IMPORT_DATA_AS_SCENARIO', payload: { name, data: summary, lsl, usl } });
      onImported?.(`Imported ${summary.sampleSize} values as a new scenario`);
    } else {
      dispatch({ type: 'IMPORT_DATA', payload: summary, specs: { lsl, usl } });
      onImported?.(`Imported ${summary.sampleSize} values`);
    }
    reset();
    onClose();
  };

  const handleClearData = () => {
    dispatch({ type: 'CLEAR_DATA' });
    reset();
    onClose();
  };

  const meanOutsideSpecs = !!summary && !specsError && (summary.mean < lsl || summary.mean > usl);
  const normality = summary?.normality;
  const nonNormal = normality !== undefined && normality.pValue < 0.05;
  const sigmaRatio =
    summary?.withinStd && summary.overallStd ? summary.overallStd / summary.withinStd : null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {asScenario ? 'Import Data as Scenario' : 'Import Measurement Data'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Paste values separated by commas, spaces, semicolons or new lines, or drop a CSV/TXT
            file below. Keep the values in production order — the within-σ estimate uses consecutive
            differences.
          </Typography>

          {asScenario && (
            <TextField
              label="Scenario name"
              placeholder={`Imported Scenario ${state.scenarios.length + 1}`}
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
          )}

          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void readFile(file);
            }}
            sx={{
              borderRadius: 2,
              outline: dragOver ? '2px dashed' : 'none',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            }}
          >
            <TextField
              multiline
              minRows={5}
              maxRows={10}
              fullWidth
              label="Measurements"
              placeholder={'1.5, 2.3, 1.8, 2.1, ...\nor one value per line'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              error={!!parseError}
              helperText={
                parseError ??
                (parsed && parsed.invalidCount > 0
                  ? `${parsed.invalidCount} non-numeric token(s) ignored (e.g. headers)`
                  : ' ')
              }
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".csv,.txt,.tsv,text/plain,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void readFile(file);
                e.target.value = '';
              }}
            />
            <Button size="small" onClick={() => setText(generateExampleData())}>
              Load example data
            </Button>
            {text && (
              <Button size="small" color="inherit" onClick={() => setText('')}>
                Clear text
              </Button>
            )}
          </Box>

          {fileError && <Alert severity="error">{fileError}</Alert>}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="LSL"
              type="number"
              value={lslInput}
              onChange={(e) => setLslInput(e.target.value)}
              error={!!specsError && specsError !== 'USL must be greater than LSL'}
              fullWidth
            />
            <TextField
              label="USL"
              type="number"
              value={uslInput}
              onChange={(e) => setUslInput(e.target.value)}
              error={!!specsError}
              helperText={specsError ?? ' '}
              fullWidth
            />
          </Box>

          {summary && (
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'success.main',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Preview
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
                  gap: 1,
                }}
              >
                <Typography variant="body2">
                  <strong>n:</strong> {summary.sampleSize}
                </Typography>
                <Typography variant="body2">
                  <strong>Mean:</strong> {formatValue(summary.mean)}
                </Typography>
                <Typography variant="body2">
                  <strong>Range:</strong> {formatValue(summary.min!)} – {formatValue(summary.max!)}
                </Typography>
                <Typography variant="body2">
                  <strong>σ overall:</strong> {formatValue(summary.overallStd!)}
                </Typography>
                <Typography variant="body2">
                  <strong>σ within:</strong>{' '}
                  {summary.withinStd ? formatValue(summary.withinStd) : '—'}
                </Typography>
                {normality && (
                  <Typography variant="body2">
                    <strong>Normality p:</strong>{' '}
                    {normality.pValue < 0.005 ? '<0.005' : normality.pValue.toFixed(3)}
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Cp/Cpk will use σ within (short-term); Pp/Ppk use σ overall (long-term).
              </Typography>
            </Box>
          )}

          {meanOutsideSpecs && (
            <Alert severity="warning">
              The data mean ({formatValue(summary!.mean)}) lies outside the spec limits. Check that
              LSL and USL are in the same units as the measurements.
            </Alert>
          )}
          {nonNormal && (
            <Alert severity="warning">
              The Anderson–Darling test suggests the data are not normally distributed (p ={' '}
              {normality!.pValue < 0.005 ? '<0.005' : normality!.pValue.toFixed(3)}). Normal-based
              capability indices and PPM estimates may be misleading.
            </Alert>
          )}
          {sigmaRatio !== null && sigmaRatio > 1.3 && (
            <Alert severity="info">
              Overall σ is {sigmaRatio.toFixed(1)}× the within σ. That usually indicates shifts or
              drift over time — or that the values are not in production order.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {!asScenario && state.histogramData && (
          <Button onClick={handleClearData} color="error" sx={{ mr: 'auto' }}>
            Remove imported data
          </Button>
        )}
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleImport} variant="contained" disabled={!summary || !!specsError}>
          {summary ? `Import ${summary.sampleSize} values` : 'Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
