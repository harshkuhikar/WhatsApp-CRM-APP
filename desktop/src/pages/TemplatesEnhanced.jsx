import { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, Grid, Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  IconButton, Chip, Tabs, Tab, InputAdornment, Menu, MenuItem, Tooltip,
  LinearProgress, Divider, List, ListItem, ListItemText, Badge, Switch,
  FormControlLabel, Select, FormControl, InputLabel, Stack
} from '@mui/material';
import {
  Add, Delete, Edit, ContentCopy, Star, StarBorder, Search, FilterList,
  History, Upload, Download, Image, AttachFile, Visibility, Code,
  TrendingUp, Close, Check, Warning
} from '@mui/icons-material';

function TemplatesEnhanced() {
  // State management
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [categories, setCategories] = useState(['Marketing', 'Sales', 'Support', 'Promotional', 'Transactional']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [openVersions, setOpenVersions] = useState(false);
  const [openAnalytics, setOpenAnalytics] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Marketing',
    message_body: '',
    tags: [],
    is_draft: false,
    is_favorite: false
  });
  
  const [tagInput, setTagInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [attachments, setAttachments] = useState([]);
  
  // Alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Analytics & metrics
  const [variables, setVariables] = useState([]);
  const [charCount, setCharCount] = useState(0);
  const [segmentCount, setSegmentCount] = useState(0);
  const [missingVars, setMissingVars] = useState([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery, showFavoritesOnly, sortBy]);

  useEffect(() => {
    analyzeMessage(formData.message_body);
  }, [formData.message_body]);

  const loadTemplates = () => {
    const saved = localStorage.getItem('templates_enhanced');
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      // Sample templates
      const samples = [
        {
          id: 1,
          name: 'Welcome Message',
          category: 'Marketing',
          message_body: 'Hi {name}! Welcome to {company}. We\'re excited to have you!',
          tags: ['welcome', 'onboarding'],
          is_draft: false,
          is_favorite: true,
          usage_count: 45,
          created_at: new Date().toISOString(),
          versions: []
        }
      ];
      setTemplates(samples);
      localStorage.setItem('templates_enhanced', JSON.stringify(samples));
    }
  };

  const saveTemplates = (newTemplates) => {
    localStorage.setItem('templates_enhanced', JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  };

  const filterTemplates = () => {
    let filtered = [...templates];
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.message_body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(t => t.is_favorite);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'usage': return (b.usage_count || 0) - (a.usage_count || 0);
        case 'recent': return new Date(b.created_at) - new Date(a.created_at);
        default: return 0;
      }
    });
    
    setFilteredTemplates(filtered);
  };

  const analyzeMessage = (message) => {
    // Extract variables
    const varPattern = /\{([^}]+)\}/g;
    const matches = [...message.matchAll(varPattern)];
    const extractedVars = [...new Set(matches.map(m => m[1]))];
    setVariables(extractedVars);
    
    // Character count
    setCharCount(message.length);
    
    // Segment calculation (WhatsApp: 160 chars per segment)
    const segments = message.length <= 160 ? 1 : Math.ceil(message.length / 153);
    setSegmentCount(segments);
  };

  const handleCreateOrUpdate = () => {
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }
    if (!formData.message_body.trim()) {
      setError('Message content is required');
      return;
    }

    const templateData = {
      ...formData,
      id: editingTemplate ? editingTemplate.id : Date.now(),
      variables,
      character_count: charCount,
      segment_count: segmentCount,
      image: imagePreview,
      attachments: attachments.map(f => f.name),
      usage_count: editingTemplate ? editingTemplate.usage_count : 0,
      created_at: editingTemplate ? editingTemplate.created_at : new Date().toISOString(),
      updated_at: editingTemplate ? new Date().toISOString() : null,
      versions: editingTemplate ? [...editingTemplate.versions, {
        version: editingTemplate.versions.length + 1,
        message_body: editingTemplate.message_body,
        updated_at: new Date().toISOString()
      }] : []
    };

    let updated;
    if (editingTemplate) {
      updated = templates.map(t => t.id === editingTemplate.id ? templateData : t);
      setSuccess('Template updated successfully!');
    } else {
      updated = [...templates, templateData];
      setSuccess('Template created successfully!');
    }

    saveTemplates(updated);
    resetForm();
    setTimeout(() => {
      setOpenDialog(false);
      setSuccess('');
    }, 2000);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      message_body: template.message_body,
      tags: template.tags || [],
      is_draft: template.is_draft || false,
      is_favorite: template.is_favorite || false
    });
    setImagePreview(template.image || '');
    setOpenDialog(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this template?')) {
      const updated = templates.filter(t => t.id !== id);
      saveTemplates(updated);
      setSuccess('Template deleted!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDuplicate = (template) => {
    const duplicate = {
      ...template,
      id: Date.now(),
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString(),
      usage_count: 0
    };
    saveTemplates([...templates, duplicate]);
    setSuccess('Template duplicated!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const toggleFavorite = (id) => {
    const updated = templates.map(t => 
      t.id === id ? { ...t, is_favorite: !t.is_favorite } : t
    );
    saveTemplates(updated);
  };

  const handleUseTemplate = (template) => {
    navigator.clipboard.writeText(template.message_body);
    setSuccess('Template copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Marketing',
      message_body: '',
      tags: [],
      is_draft: false,
      is_favorite: false
    });
    setEditingTemplate(null);
    setSelectedImage(null);
    setImagePreview('');
    setAttachments([]);
    setTagInput('');
    setError('');
  };

  const insertVariable = (varName) => {
    setFormData({
      ...formData,
      message_body: formData.message_body + `{${varName}}`
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleExport = (template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/\s+/g, '_')}.json`;
    link.click();
    setSuccess('Template exported!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        imported.id = Date.now();
        imported.created_at = new Date().toISOString();
        saveTemplates([...templates, imported]);
        setSuccess('Template imported!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Invalid template file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Message Templates</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" component="label" startIcon={<Upload />}>
            Import
            <input type="file" hidden accept=".json" onChange={handleImport} />
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}>
            New Template
          </Button>
        </Stack>
      </Box>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Filters & Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="recent">Recent</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="usage">Most Used</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                />
              }
              label="Favorites Only"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{templates.length}</Typography>
            <Typography variant="body2" color="text.secondary">Total Templates</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{templates.filter(t => t.is_favorite).length}</Typography>
            <Typography variant="body2" color="text.secondary">Favorites</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{categories.length}</Typography>
            <Typography variant="body2" color="text.secondary">Categories</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4">{templates.reduce((sum, t) => sum + (t.usage_count || 0), 0)}</Typography>
            <Typography variant="body2" color="text.secondary">Total Uses</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No templates found
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)} sx={{ mt: 2 }}>
            Create Your First Template
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>{template.name}</Typography>
                    <IconButton size="small" onClick={() => toggleFavorite(template.id)}>
                      {template.is_favorite ? <Star color="warning" /> : <StarBorder />}
                    </IconButton>
                  </Box>
                  
                  <Chip label={template.category} size="small" sx={{ mb: 1 }} />
                  {template.is_draft && <Chip label="Draft" size="small" color="warning" sx={{ ml: 1, mb: 1 }} />}
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      mb: 2
                    }}
                  >
                    {template.message_body}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {template.tags?.map(tag => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary' }}>
                    <span>📊 {template.usage_count || 0} uses</span>
                    <span>📝 {template.character_count || template.message_body.length} chars</span>
                    <span>📱 {template.segment_count || 1} segments</span>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <Tooltip title="Use Template">
                      <IconButton size="small" onClick={() => handleUseTemplate(template)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Preview">
                      <IconButton size="small" onClick={() => { setPreviewTemplate(template); setOpenPreview(true); }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Analytics">
                      <IconButton size="small" onClick={() => { setPreviewTemplate(template); setOpenAnalytics(true); }}>
                        <TrendingUp fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Tooltip title="Duplicate">
                      <IconButton size="small" onClick={() => handleDuplicate(template)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(template)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export">
                      <IconButton size="small" onClick={() => handleExport(template)}>
                        <Download fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(template.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); resetForm(); }} maxWidth="md" fullWidth>
        <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            fullWidth
            label="Template Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              label="Category"
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Message Content"
            value={formData.message_body}
            onChange={(e) => setFormData({ ...formData, message_body: e.target.value })}
            margin="normal"
            multiline
            rows={6}
            required
            helperText={`${charCount} characters • ${segmentCount} segment(s)`}
          />

          {/* Character & Segment Counter */}
          <Box sx={{ mt: 1, mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((charCount / 160) * 100, 100)} 
              color={charCount > 160 ? 'warning' : 'primary'}
            />
            <Typography variant="caption" color="text.secondary">
              {charCount <= 160 ? `${160 - charCount} characters remaining` : `Multi-segment message (${segmentCount} segments)`}
            </Typography>
          </Box>

          {/* Variables Detected */}
          {variables.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Variables Detected:</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {variables.map(v => (
                  <Chip key={v} label={`{${v}}`} size="small" color="primary" variant="outlined" />
                ))}
              </Box>
            </Alert>
          )}

          {/* Quick Variables */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Quick Variables:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['name', 'phone', 'email', 'company', 'date', 'time', 'custom1', 'custom2'].map(v => (
                <Chip
                  key={v}
                  label={`{${v}}`}
                  size="small"
                  onClick={() => insertVariable(v)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {/* Tags */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Add Tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={addTag}>
                      <Add />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {formData.tags.map(tag => (
                <Chip key={tag} label={tag} size="small" onDelete={() => removeTag(tag)} />
              ))}
            </Box>
          </Box>

          {/* Image Upload */}
          <Button variant="outlined" component="label" startIcon={<Image />} fullWidth sx={{ mb: 2 }}>
            {selectedImage ? selectedImage.name : 'Add Image (Optional)'}
            <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
          </Button>

          {imagePreview && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
              <Button size="small" onClick={() => { setSelectedImage(null); setImagePreview(''); }} sx={{ mt: 1 }}>
                Remove Image
              </Button>
            </Box>
          )}

          {/* Options */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={<Switch checked={formData.is_draft} onChange={(e) => setFormData({ ...formData, is_draft: e.target.checked })} />}
              label="Save as Draft"
            />
            <FormControlLabel
              control={<Switch checked={formData.is_favorite} onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })} />}
              label="Mark as Favorite"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenDialog(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleCreateOrUpdate} variant="contained">
            {editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent>
          {previewTemplate && (
            <Box>
              <Typography variant="h6" gutterBottom>{previewTemplate.name}</Typography>
              <Chip label={previewTemplate.category} size="small" sx={{ mb: 2 }} />
              
              <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {previewTemplate.message_body}
                </Typography>
              </Paper>

              <Typography variant="subtitle2" gutterBottom>Statistics:</Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Characters" secondary={previewTemplate.character_count || previewTemplate.message_body.length} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Segments" secondary={previewTemplate.segment_count || 1} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Variables" secondary={previewTemplate.variables?.length || 0} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Usage Count" secondary={previewTemplate.usage_count || 0} />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>Close</Button>
          <Button variant="contained" onClick={() => { handleUseTemplate(previewTemplate); setOpenPreview(false); }}>
            Use Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={openAnalytics} onClose={() => setOpenAnalytics(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Template Analytics</DialogTitle>
        <DialogContent>
          {previewTemplate && (
            <Box>
              <Typography variant="h6" gutterBottom>{previewTemplate.name}</Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{previewTemplate.usage_count || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Uses</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{previewTemplate.versions?.length || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Versions</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{previewTemplate.variables?.length || 0}</Typography>
                    <Typography variant="body2" color="text.secondary">Variables</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{previewTemplate.segment_count || 1}</Typography>
                    <Typography variant="body2" color="text.secondary">Segments</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Recent Activity:</Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(previewTemplate.created_at).toLocaleDateString()}
                </Typography>
                {previewTemplate.updated_at && (
                  <Typography variant="body2" color="text.secondary">
                    Last Updated: {new Date(previewTemplate.updated_at).toLocaleDateString()}
                  </Typography>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAnalytics(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TemplatesEnhanced;
