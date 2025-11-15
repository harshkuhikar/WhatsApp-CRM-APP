import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  InputAdornment,
  Checkbox,
  Tooltip,
  Fade,
  Slide,
  Stack,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  PlayArrow,
  Pause,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  ContentCopy as DuplicateIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Label as LabelIcon,
  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';
import api from '../services/api';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const TAGS = ['Marketing', 'Sales', 'Support', 'Promotional', 'Transactional'];

function CampaignsEnhanced() {
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  
  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [template, setTemplate] = useState('');
  const [messagesPerMinute, setMessagesPerMinute] = useState(10);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [tags, setTags] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadCampaigns();
    loadTemplates();
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchQuery, filterStatus, showArchived]);

  const loadTemplates = () => {
    const saved = localStorage.getItem('message_templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    }
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      try {
        const response = await api.get('/api/v1/campaigns');
        if (response.data && Array.isArray(response.data)) {
          // Add local metadata
          const campaignsWithMeta = response.data.map(c => ({
            ...c,
            priority: c.settings?.priority || 'Medium',
            tags: c.settings?.tags || [],
            archived: c.settings?.archived || false,
          }));
          setCampaigns(campaignsWithMeta);
        }
      } catch (apiErr) {
        console.log('Campaigns endpoint not available yet');
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    let filtered = campaigns;

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.template?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    // Filter archived
    filtered = filtered.filter(c => showArchived ? c.archived : !c.archived);

    setFilteredCampaigns(filtered);
  };

  const handleTemplateSelect = (templateId) => {
    const selected = templates.find(t => t.id === parseInt(templateId));
    if (selected) {
      setTemplate(selected.content);
      setSelectedTemplate(templateId);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      setError('Campaign name is required');
      return;
    }
    if (!template.trim()) {
      setError('Message template is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      let scheduledAt = null;
      if (scheduleDate && scheduleTime) {
        scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      const response = await api.post('/api/v1/campaigns', {
        name: campaignName,
        template: template,
        scheduled_at: scheduledAt,
        settings: {
          messages_per_minute: messagesPerMinute,
          retry_failed: true,
          template_id: selectedTemplate || null,
          priority: priority,
          tags: tags,
          archived: false,
        }
      });

      setSuccess('Campaign created successfully!');
      loadCampaigns();
      
      // Reset form
      setCampaignName('');
      setTemplate('');
      setMessagesPerMinute(10);
      setSelectedTemplate('');
      setScheduleDate('');
      setScheduleTime('');
      setPriority('Medium');
      setTags([]);
      
      setTimeout(() => {
        setOpenDialog(false);
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateCampaign = async (campaign) => {
    try {
      setLoading(true);
      const response = await api.post('/api/v1/campaigns', {
        name: `${campaign.name} (Copy)`,
        template: campaign.template,
        scheduled_at: null,
        settings: campaign.settings
      });
      setSuccess('Campaign duplicated!');
      loadCampaigns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to duplicate campaign');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveCampaign = async (campaignId, archive = true) => {
    try {
      // Update locally (in real app, update via API)
      setCampaigns(campaigns.map(c => 
        c.id === campaignId ? { ...c, archived: archive } : c
      ));
      setSuccess(archive ? 'Campaign archived!' : 'Campaign unarchived!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to archive campaign');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedCampaigns.length} campaigns?`)) return;
    
    try {
      setLoading(true);
      for (const id of selectedCampaigns) {
        await api.delete(`/api/v1/campaigns/${id}`);
      }
      setSuccess(`${selectedCampaigns.length} campaigns deleted!`);
      setSelectedCampaigns([]);
      loadCampaigns();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete campaigns');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Name', 'Status', 'Created', 'Priority', 'Tags'],
      ...filteredCampaigns.map(c => [
        c.name,
        c.status,
        new Date(c.created_at).toLocaleDateString(),
        c.priority,
        c.tags.join(';')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaigns_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setSuccess('Campaigns exported!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCampaigns(filteredCampaigns.map(c => c.id));
    } else {
      setSelectedCampaigns([]);
    }
  };

  const handleSelectCampaign = (id) => {
    setSelectedCampaigns(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'info',
      Medium: 'default',
      High: 'warning',
      Urgent: 'error',
    };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      scheduled: 'info',
      running: 'primary',
      paused: 'warning',
      completed: 'success',
      failed: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Fade in timeout={500}>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">
            Campaigns
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExportCSV}
              disabled={filteredCampaigns.length === 0}
            >
              Export
            </Button>
            <IconButton onClick={loadCampaigns}>
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              New Campaign
            </Button>
          </Stack>
        </Box>

        {/* Alerts */}
        {error && (
          <Slide direction="down" in mountOnEnter unmountOnExit>
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          </Slide>
        )}

        {success && (
          <Slide direction="down" in mountOnEnter unmountOnExit>
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </Slide>
        )}

        {/* Search and Filter */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="running">Running</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            {selectedCampaigns.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
              >
                Delete ({selectedCampaigns.length})
              </Button>
            )}
          </Stack>
        </Paper>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                    indeterminate={selectedCampaigns.length > 0 && selectedCampaigns.length < filteredCampaigns.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>
                      {searchQuery || filterStatus !== 'all' 
                        ? 'No campaigns match your filters'
                        : 'No campaigns yet. Create your first campaign!'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <Fade in key={campaign.id} timeout={300}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedCampaigns.includes(campaign.id)}
                          onChange={() => handleSelectCampaign(campaign.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{campaign.name}</Typography>
                        {campaign.archived && (
                          <Chip label="Archived" size="small" sx={{ mt: 0.5 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={campaign.status}
                          color={getStatusColor(campaign.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={campaign.priority}
                          color={getPriorityColor(campaign.priority)}
                          size="small"
                          icon={<PriorityIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {campaign.tags?.slice(0, 2).map((tag, idx) => (
                            <Chip key={idx} label={tag} size="small" variant="outlined" />
                          ))}
                          {campaign.tags?.length > 2 && (
                            <Chip label={`+${campaign.tags.length - 2}`} size="small" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Duplicate">
                            <IconButton
                              size="small"
                              onClick={() => handleDuplicateCampaign(campaign)}
                            >
                              <DuplicateIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={campaign.archived ? "Unarchive" : "Archive"}>
                            <IconButton
                              size="small"
                              onClick={() => handleArchiveCampaign(campaign.id, !campaign.archived)}
                            >
                              {campaign.archived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                if (window.confirm(`Delete "${campaign.name}"?`)) {
                                  api.delete(`/api/v1/campaigns/${campaign.id}`).then(() => {
                                    setSuccess('Campaign deleted!');
                                    loadCampaigns();
                                    setTimeout(() => setSuccess(''), 3000);
                                  });
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </Fade>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create Dialog - Same as before but with priority and tags */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            
            <TextField
              fullWidth
              label="Campaign Name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              margin="normal"
              required
            />

            {templates.length > 0 && (
              <TextField
                fullWidth
                label="Use Saved Template (Optional)"
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                margin="normal"
                select
                SelectProps={{ native: true }}
              >
                <option value="">-- Write Custom Message --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </TextField>
            )}
            
            <TextField
              fullWidth
              label="Message Template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              margin="normal"
              multiline
              rows={4}
              required
            />

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priority}
                  label="Priority"
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {PRIORITIES.map(p => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Tags</InputLabel>
                <Select
                  multiple
                  value={tags}
                  label="Tags"
                  onChange={(e) => setTags(e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {TAGS.map(tag => (
                    <MenuItem key={tag} value={tag}>
                      <Checkbox checked={tags.indexOf(tag) > -1} />
                      {tag}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              fullWidth
              label="Messages Per Minute"
              type="number"
              value={messagesPerMinute}
              onChange={(e) => setMessagesPerMinute(parseInt(e.target.value) || 10)}
              margin="normal"
              inputProps={{ min: 1, max: 60 }}
            />

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Schedule Campaign (Optional)
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCampaign} 
              variant="contained" 
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Campaign'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
}

export default CampaignsEnhanced;
