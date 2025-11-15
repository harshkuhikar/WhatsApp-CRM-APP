import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Activation() {
  const [hwid, setHwid] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { activateLicense } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadHWID();
  }, []);

  const loadHWID = async () => {
    const id = await window.electron.getHWID();
    setHwid(id);
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await activateLicense(licenseKey);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" align="center" gutterBottom>
            Activate License
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Enter your license key to activate MyWASender
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your Device ID (HWID):
            </Typography>
            <TextField
              fullWidth
              value={hwid}
              InputProps={{ readOnly: true }}
              size="small"
              sx={{ fontFamily: 'monospace' }}
            />
            <Typography variant="caption" color="text.secondary">
              Share this ID with your license provider
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleActivate}>
            <TextField
              fullWidth
              label="License Key"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="Enter your license key or JWT token"
              margin="normal"
              required
              multiline
              rows={3}
            />
            
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Activating...' : 'Activate License'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Don't have a license? Contact your administrator or purchase one.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Activation;
