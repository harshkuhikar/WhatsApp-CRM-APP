import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Settings() {
  const { license, validateLicense } = useAuth();
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    loadVersion();
  }, []);

  const loadVersion = async () => {
    const version = await window.electron.getAppVersion();
    setAppVersion(version);
  };

  const handleValidateLicense = async () => {
    try {
      const valid = await validateLicense();
      alert(valid ? 'License is valid' : 'License validation failed');
    } catch (error) {
      alert('License validation failed: ' + error.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          License Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Plan"
              value={license?.plan || 'N/A'}
              InputProps={{ readOnly: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Expires At"
              value={license?.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'N/A'}
              InputProps={{ readOnly: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={handleValidateLicense}
            >
              Validate License
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Application
        </Typography>
        <TextField
          fullWidth
          label="Version"
          value={appVersion}
          InputProps={{ readOnly: true }}
          size="small"
          sx={{ mb: 2 }}
        />
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          WhatsApp Settings
        </Typography>
        <Typography color="text.secondary">
          Configure WhatsApp profiles and sending preferences
        </Typography>
      </Paper>
    </Box>
  );
}

export default Settings;
