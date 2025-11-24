import { useState } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { calculateDescriptiveStats, generateHistogram } from '../utils/stats';

interface DataImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function DataImportDialog({ open, onClose }: DataImportDialogProps) {
  const { dispatch } = useApp();
  const [tabValue, setTabValue] = useState(0);
  const [pastedData, setPastedData] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<{
    data: number[];
    n: number;
    mean: number;
    std: number;
    min: number;
    max: number;
    invalidCount: number;
  } | null>(null);

  const parseData = (text: string): number[] | null => {
    try {
      // Split by commas, newlines, spaces, or tabs
      const allValues = text.split(/[\s,\n\t]+/).map((v) => v.trim()).filter((v) => v.length > 0);

      const validValues: number[] = [];
      let invalidCount = 0;

      allValues.forEach((v) => {
        const num = parseFloat(v);
        if (!isNaN(num) && isFinite(num)) {
          validValues.push(num);
        } else {
          invalidCount++;
        }
      });

      if (validValues.length < 2) {
        setError('Need at least 2 valid data points');
        return null;
      }

      // Show preview
      const stats = calculateDescriptiveStats(validValues);
      if (stats) {
        setPreview({
          data: validValues,
          n: validValues.length,
          mean: stats.mean,
          std: stats.sampleStd,
          min: Math.min(...validValues),
          max: Math.max(...validValues),
          invalidCount,
        });
      }

      return validValues;
    } catch (e) {
      setError('Failed to parse data');
      return null;
    }
  };

  const handlePreview = () => {
    setError(null);
    setPreview(null);
    parseData(pastedData);
  };

  const loadExampleData = () => {
    // Generate example normal data: mean=10, std=2, n=100
    const exampleData: number[] = [];
    for (let i = 0; i < 100; i++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      exampleData.push(10 + 2 * z);
    }
    const formatted = exampleData.map((v) => v.toFixed(3)).join(', ');
    setPastedData(formatted);
    parseData(formatted);
  };

  const handleImportPasted = () => {
    setError(null);
    const data = parseData(pastedData);

    if (!data) return;

    const stats = calculateDescriptiveStats(data);
    if (!stats) {
      setError('Failed to calculate statistics');
      return;
    }

    const histogram = generateHistogram(data);

    dispatch({
      type: 'IMPORT_DATA',
      payload: {
        bins: histogram.bins,
        mean: stats.mean,
        std: stats.sampleStd,
        sampleSize: data.length,
      },
    });

    setPastedData('');
    onClose();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = parseData(text);

      if (!data) return;

      const stats = calculateDescriptiveStats(data);
      if (!stats) {
        setError('Failed to calculate statistics');
        return;
      }

      const histogram = generateHistogram(data);

      dispatch({
        type: 'IMPORT_DATA',
        payload: {
          bins: histogram.bins,
          mean: stats.mean,
          std: stats.sampleStd,
          sampleSize: data.length,
        },
      });

      onClose();
    } catch (e) {
      setError('Failed to read file');
    }
  };

  const handleClearData = () => {
    dispatch({ type: 'CLEAR_DATA' });
    setPastedData('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import Real Data</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Paste Data" />
            <Tab label="Upload File" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {tabValue === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Paste comma-separated or newline-separated measurement values:
              </Typography>
              <Button size="small" onClick={loadExampleData}>
                Load Example
              </Button>
            </Box>
            <TextField
              multiline
              rows={6}
              fullWidth
              placeholder="1.5, 2.3, 1.8, 2.1, ...&#10;or one value per line"
              value={pastedData}
              onChange={(e) => {
                setPastedData(e.target.value);
                setPreview(null);
              }}
            />
            {pastedData && !preview && (
              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{ mt: 1 }}
                onClick={handlePreview}
              >
                Preview
              </Button>
            )}
            {preview && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'success.light',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.main',
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Data Preview
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>n:</strong> {preview.n}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Mean:</strong> {preview.mean.toFixed(3)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Std Dev:</strong> {preview.std.toFixed(3)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Min:</strong> {preview.min.toFixed(3)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Max:</strong> {preview.max.toFixed(3)}
                  </Typography>
                  {preview.invalidCount > 0 && (
                    <Typography variant="body2" color="warning.main">
                      <strong>Ignored:</strong> {preview.invalidCount} invalid values
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a CSV or text file with measurement values (comma or newline separated):
            </Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadIcon />}
              fullWidth
            >
              Choose File
              <input
                type="file"
                hidden
                accept=".csv,.txt"
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClearData} color="error">
          Clear Histogram
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        {tabValue === 0 && preview && (
          <Button
            onClick={handleImportPasted}
            variant="contained"
          >
            Import {preview.n} data points
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
