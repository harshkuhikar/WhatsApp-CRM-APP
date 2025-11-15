import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/v1/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (!stats) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">Total Users</Typography>
            <Typography variant="h4">{stats.users?.total || 0}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">Active Licenses</Typography>
            <Typography variant="h4">{stats.licenses?.active || 0}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">Total Revenue</Typography>
            <Typography variant="h4">${stats.revenue?.total || 0}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3 }}>
            <Typography color="text.secondary">Monthly Revenue</Typography>
            <Typography variant="h4">${stats.revenue?.monthly || 0}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
