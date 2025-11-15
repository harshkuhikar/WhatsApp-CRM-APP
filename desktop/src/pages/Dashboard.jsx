import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
} from '@mui/material';
import {
  Campaign as CampaignIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function StatCard({ title, value, icon, color }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: 48 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { license, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    campaigns: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/api/v1/campaigns');
      if (response.data && Array.isArray(response.data)) {
        setStats(prev => ({
          ...prev,
          campaigns: response.data.length
        }));
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const getDaysUntilExpiry = () => {
    if (!license?.expires_at) return 0;
    const expiry = new Date(license.expires_at);
    const now = new Date();
    const diff = expiry - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiry();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Dashboard
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Box>

      {/* Welcome Message */}
      <Alert severity="success" sx={{ mb: 3 }}>
        Welcome back, {user?.email}! Your account is active and ready to use.
      </Alert>

      {/* License Information */}
      {license && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            License Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Plan
              </Typography>
              <Typography variant="h6" color="primary">
                {license.plan?.toUpperCase() || 'PREMIUM'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Expires
              </Typography>
              <Typography variant="h6">
                {new Date(license.expires_at).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Days Remaining
              </Typography>
              <Typography variant="h6" color={daysLeft < 30 ? 'error' : 'success.main'}>
                {daysLeft} days
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Max Devices
              </Typography>
              <Typography variant="h6">
                {license.max_devices || 1}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Campaigns"
            value={stats.campaigns}
            icon={<CampaignIcon fontSize="inherit" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Messages Sent"
            value={stats.sent}
            icon={<SendIcon fontSize="inherit" />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Delivered"
            value={stats.delivered}
            icon={<CheckIcon fontSize="inherit" />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={<ErrorIcon fontSize="inherit" />}
            color="error.main"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant="contained" 
              onClick={() => navigate('/campaigns')}
            >
              Create Campaign
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/contacts')}
            >
              Import Contacts
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/settings')}
            >
              View Settings
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Getting Started Guide */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Getting Started
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Follow these steps to start sending messages:
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Create a Campaign</strong> - Go to Campaigns and click "New Campaign"
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Import Contacts</strong> - Upload a CSV file or add contacts manually
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Configure WhatsApp</strong> - Set up your WhatsApp profile in Settings
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            <strong>Start Sending</strong> - Launch your campaign and monitor progress
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default Dashboard;
