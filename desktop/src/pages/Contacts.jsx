import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import { Upload as UploadIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../services/api';

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openManualDialog, setOpenManualDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // CSV Import state
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  
  // Manual add state
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualCampaign, setManualCampaign] = useState('');

  useEffect(() => {
    loadCampaigns();
    loadContacts();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await api.get('/api/v1/campaigns');
      if (response.data && Array.isArray(response.data)) {
        setCampaigns(response.data);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setCampaigns([]);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      // Load all campaigns first
      const campaignsResponse = await api.get('/api/v1/campaigns');
      if (campaignsResponse.data && Array.isArray(campaignsResponse.data)) {
        // Load contacts for each campaign
        const allContacts = [];
        for (const campaign of campaignsResponse.data) {
          try {
            const contactsResponse = await api.get(`/api/v1/campaigns/${campaign.id}/contacts`);
            if (contactsResponse.data && Array.isArray(contactsResponse.data)) {
              contactsResponse.data.forEach(contact => {
                allContacts.push({
                  ...contact,
                  campaign_id: campaign.id,
                  campaign_name: campaign.name
                });
              });
            }
          } catch (err) {
            console.log(`Failed to load contacts for campaign ${campaign.id}`);
          }
        }
        setContacts(allContacts);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setCsvFile(file);
    
    // Read and preview CSV
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const preview = lines.slice(0, 6); // Show first 5 rows + header
      setCsvPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    if (!selectedCampaign) {
      setError('Please select a campaign');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await api.post(
        `/api/v1/campaigns/${selectedCampaign}/import-csv`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSuccess(`Successfully imported ${response.data.imported} contacts!`);
      loadContacts();
      
      // Reset
      setCsvFile(null);
      setCsvPreview([]);
      setSelectedCampaign('');
      
      setTimeout(() => {
        setOpenDialog(false);
        setSuccess('');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to import contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualContact = async () => {
    if (!manualName.trim() || !manualPhone.trim()) {
      setError('Name and phone are required');
      return;
    }

    if (!manualCampaign) {
      setError('Please select a campaign');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.post(`/api/v1/campaigns/${manualCampaign}/contacts`, [
        {
          name: manualName,
          phone: manualPhone,
          custom: {}
        }
      ]);

      setSuccess('Contact added successfully!');
      loadContacts();
      
      // Reset
      setManualName('');
      setManualPhone('');
      setManualCampaign('');
      
      setTimeout(() => {
        setOpenManualDialog(false);
        setSuccess('');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSampleCampaign = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/v1/campaigns', {
        name: 'Sample Campaign',
        template: 'Hi {{name}}, this is a test message!',
        settings: { messages_per_minute: 10 }
      });
      
      setCampaigns([...campaigns, response.data]);
      setSuccess('Sample campaign created! You can now import contacts.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create sample campaign');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Contacts
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setOpenManualDialog(true)}
            sx={{ mr: 1 }}
          >
            Add Contact
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Import CSV
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {campaigns.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You need to create a campaign first before importing contacts.
          <Button 
            size="small" 
            onClick={handleCreateSampleCampaign}
            sx={{ ml: 2 }}
            disabled={loading}
          >
            Create Sample Campaign
          </Button>
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Campaign</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography color="text.secondary" gutterBottom>
                      No contacts imported yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Import contacts from CSV or add them manually
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>{contact.campaign_name}</TableCell>
                  <TableCell>{contact.status}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* CSV Import Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Contacts from CSV</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 2 }}>
            CSV Format: name,phone,company (or any custom fields)
          </Alert>

          <FormControl fullWidth margin="normal">
            <InputLabel>Select Campaign</InputLabel>
            <Select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              label="Select Campaign"
            >
              {campaigns.map((campaign) => (
                <MenuItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 2, mb: 2 }}
          >
            {csvFile ? csvFile.name : 'Choose CSV File'}
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={handleFileSelect}
            />
          </Button>

          {csvPreview.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Preview (first 5 rows):
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                {csvPreview.map((line, idx) => (
                  <Typography key={idx} variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {line}
                  </Typography>
                ))}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleImportCSV} 
            variant="contained" 
            disabled={loading || !csvFile || !selectedCampaign}
          >
            {loading ? <CircularProgress size={24} /> : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Add Dialog */}
      <Dialog open={openManualDialog} onClose={() => setOpenManualDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Contact Manually</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel>Select Campaign</InputLabel>
            <Select
              value={manualCampaign}
              onChange={(e) => setManualCampaign(e.target.value)}
              label="Select Campaign"
            >
              {campaigns.map((campaign) => (
                <MenuItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Name"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Phone Number"
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value)}
            margin="normal"
            placeholder="+1234567890"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenManualDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddManualContact} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Contact'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Contacts;
