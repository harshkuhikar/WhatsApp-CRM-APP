import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Send,
  CheckCircle,
  Error,
  Schedule,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function StatCard({ title, value, change, icon, color, trend }) {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {value}
            </Typography>
            {change && (
              <Chip
                icon={trend === 'up' ? <TrendingUp /> : <TrendingDown />}
                label={`${change}%`}
                size="small"
                color={trend === 'up' ? 'success' : 'error'}
                sx={{ height: 24 }}
              />
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.lighter`,
              color: `${color}.main`,
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function Analytics() {
  const [timeRange, setTimeRange] = useState('7days');
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalSent: 1247,
    delivered: 1189,
    failed: 58,
    pending: 156,
  });

  // Mock data for charts
  const messageData = [
    { name: 'Mon', sent: 120, delivered: 115, failed: 5 },
    { name: 'Tue', sent: 180, delivered: 172, failed: 8 },
    { name: 'Wed', sent: 150, delivered: 145, failed: 5 },
    { name: 'Thu', sent: 220, delivered: 210, failed: 10 },
    { name: 'Fri', sent: 280, delivered: 268, failed: 12 },
    { name: 'Sat', sent: 190, delivered: 182, failed: 8 },
    { name: 'Sun', sent: 107, delivered: 97, failed: 10 },
  ];

  const statusData = [
    { name: 'Delivered', value: stats.delivered },
    { name: 'Failed', value: stats.failed },
    { name: 'Pending', value: stats.pending },
  ];

  const campaignPerformance = [
    { name: 'Campaign 1', messages: 450, delivered: 430 },
    { name: 'Campaign 2', messages: 380, delivered: 365 },
    { name: 'Campaign 3', messages: 290, delivered: 280 },
    { name: 'Campaign 4', messages: 127, delivered: 114 },
  ];

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await api.get('/api/v1/campaigns');
      if (response.data) {
        setCampaigns(response.data);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    }
  };

  const deliveryRate = ((stats.delivered / stats.totalSent) * 100).toFixed(1);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Analytics & Reports
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="24hours">Last 24 Hours</MenuItem>
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sent"
            value={stats.totalSent.toLocaleString()}
            change={12.5}
            trend="up"
            icon={<Send />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Delivered"
            value={stats.delivered.toLocaleString()}
            change={8.2}
            trend="up"
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Failed"
            value={stats.failed}
            change={-3.1}
            trend="down"
            icon={<Error />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Schedule />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Message Trends */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Message Delivery Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={messageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="delivered" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="failed" stroke="#ff8042" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Message Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {deliveryRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Delivery Rate
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Campaign Performance */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Campaign Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="messages" fill="#8884d8" name="Total Messages" />
                <Bar dataKey="delivered" fill="#82ca9d" name="Delivered" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Campaigns */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Campaigns
            </Typography>
            <Box sx={{ mt: 2 }}>
              {campaigns.slice(0, 5).map((campaign) => (
                <Box
                  key={campaign.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    mb: 1,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1">{campaign.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={campaign.status}
                    color={
                      campaign.status === 'completed' ? 'success' :
                      campaign.status === 'running' ? 'primary' :
                      campaign.status === 'failed' ? 'error' : 'default'
                    }
                    size="small"
                  />
                </Box>
              ))}
              {campaigns.length === 0 && (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  No campaigns yet
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Analytics;
