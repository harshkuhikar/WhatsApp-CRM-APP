import { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, TextField, Button, Avatar, Grid,
  Tabs, Tab, Alert, Divider, Switch, FormControlLabel, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
  ListItemText, ListItemIcon, Chip, Card, CardContent, LinearProgress,
  InputAdornment, Tooltip, Badge
} from '@mui/material';
import {
  Person, Email, Lock, Notifications, Security, Devices, Language,
  Palette, Storage, Download, Upload, Delete, Edit, Visibility,
  VisibilityOff, Check, Warning, Info, PhotoCamera, Key, History,
  Settings, VpnKey, Shield, AccountCircle, Save, Cancel
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import storage from '../utils/storage';

function Profile() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile Data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    company: '',
    bio: '',
    avatar: '',
    timezone: 'UTC',
    language: 'en'
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: 30,
    autoLogout: false
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    emailCampaigns: true,
    emailReports: true,
    emailUpdates: false,
    pushCampaigns: true,
    pushReports: false,
    smsAlerts: false
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: false,
    showPhone: false,
    dataCollection: true,
    analytics: true
  });

  // Sessions & Devices
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: 'Chrome on Windows',
      location: 'New York, USA',
      lastActive: new Date().toISOString(),
      current: true
    }
  ]);

  // Activity Log
  const [activities, setActivities] = useState([
    { id: 1, action: 'Login', timestamp: new Date().toISOString(), ip: '192.168.1.1' },
    { id: 2, action: 'Profile Updated', timestamp: new Date(Date.now() - 3600000).toISOString(), ip: '192.168.1.1' }
  ]);

  // Dialogs
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const saved = await storage.get('user_profile');
      if (saved) {
        setProfileData({ ...profileData, ...saved });
      }
      
      const savedSecurity = await storage.get('security_settings');
      if (savedSecurity) {
        setSecuritySettings(savedSecurity);
      }

      const savedNotifications = await storage.get('notification_preferences');
      if (savedNotifications) {
        setNotifications(savedNotifications);
      }

      const savedPrivacy = await storage.get('privacy_settings');
      if (savedPrivacy) {
        setPrivacy(savedPrivacy);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    setError('');
    try {
      await storage.set('user_profile', profileData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Mock password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Mock password reset email
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(`Password reset link sent to ${resetEmail}`);
      setOpenResetDialog(false);
      setResetEmail('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityUpdate = async () => {
    setLoading(true);
    try {
      await storage.set('security_settings', securitySettings);
      setSuccess('Security settings updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    try {
      await storage.set('notification_preferences', notifications);
      setSuccess('Notification preferences updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    setLoading(true);
    try {
      await storage.set('privacy_settings', privacy);
      setSuccess('Privacy settings updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileData({ ...profileData, avatar: e.target.result });
      setSuccess('Avatar updated!');
      setTimeout(() => setSuccess(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleExportData = async () => {
    try {
      const allData = {
        profile: profileData,
        security: securitySettings,
        notifications: notifications,
        privacy: privacy,
        campaigns: await storage.get('campaigns') || [],
        contacts: await storage.get('contacts') || [],
        templates: await storage.get('templates_enhanced') || []
      };

      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mywasender_data_${Date.now()}.json`;
      link.click();

      setSuccess('Data exported successfully!');
      setOpenExportDialog(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await storage.delete('access_token');
      await storage.delete('user_profile');
      await storage.delete('campaigns');
      await storage.delete('contacts');
      await storage.delete('templates_enhanced');
      
      setSuccess('Account deleted. Logging out...');
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (err) {
      setError('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = (sessionId) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    setSuccess('Session revoked successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const getStrengthColor = () => {
    if (passwordStrength < 40) return 'error';
    if (passwordStrength < 70) return 'warning';
    return 'success';
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>Profile & Settings</Typography>

        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Person />} label="Profile" />
            <Tab icon={<Lock />} label="Password" />
            <Tab icon={<Security />} label="Security" />
            <Tab icon={<Notifications />} label="Notifications" />
            <Tab icon={<Shield />} label="Privacy" />
            <Tab icon={<Devices />} label="Sessions" />
            <Tab icon={<History />} label="Activity" />
            <Tab icon={<Settings />} label="Advanced" />
          </Tabs>
        </Paper>

        {/* Profile Tab */}
        {activeTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton component="label" sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                      <PhotoCamera fontSize="small" />
                      <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                    </IconButton>
                  }
                >
                  <Avatar
                    src={profileData.avatar}
                    sx={{ width: 120, height: 120, border: '4px solid', borderColor: 'primary.main' }}
                  >
                    {profileData.name?.charAt(0) || user?.email?.charAt(0)}
                  </Avatar>
                </Badge>
                <Typography variant="h6" sx={{ mt: 2 }}>{profileData.name || 'User'}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profileData.email}
                  disabled
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company"
                  value={profileData.company}
                  onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Timezone"
                  value={profileData.timezone}
                  onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Dubai">Dubai</option>
                  <option value="Asia/Kolkata">India</option>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Language"
                  value={profileData.language}
                  onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ar">Arabic</option>
                  <option value="hi">Hindi</option>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" startIcon={<Cancel />} onClick={loadProfileData}>
                    Cancel
                  </Button>
                  <Button variant="contained" startIcon={<Save />} onClick={handleProfileUpdate} disabled={loading}>
                    Save Changes
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Password Tab */}
        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Change Password</Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type={showPasswords.current ? 'text' : 'password'}
                  label="Current Password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}>
                          {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type={showPasswords.new ? 'text' : 'password'}
                  label="New Password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                          {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                {passwordData.newPassword && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress variant="determinate" value={passwordStrength} color={getStrengthColor()} />
                    <Typography variant="caption" color="text.secondary">
                      Password Strength: {passwordStrength < 40 ? 'Weak' : passwordStrength < 70 ? 'Medium' : 'Strong'}
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type={showPasswords.confirm ? 'text' : 'password'}
                  label="Confirm New Password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                          {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" icon={<Info />}>
                  Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                  <Button variant="outlined" color="warning" onClick={() => setOpenResetDialog(true)}>
                    Forgot Password?
                  </Button>
                  <Button variant="contained" startIcon={<Lock />} onClick={handlePasswordChange} disabled={loading}>
                    Change Password
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Security Tab */}
        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Security Settings</Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <VpnKey color="primary" />
                        <Box>
                          <Typography variant="subtitle1">Two-Factor Authentication</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Add an extra layer of security to your account
                          </Typography>
                        </Box>
                      </Box>
                      <Switch
                        checked={securitySettings.twoFactorEnabled}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: e.target.checked })}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.emailNotifications}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, emailNotifications: e.target.checked })}
                    />
                  }
                  label="Email notifications for security events"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.loginAlerts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, loginAlerts: e.target.checked })}
                    />
                  }
                  label="Alert me of new login attempts"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.autoLogout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, autoLogout: e.target.checked })}
                    />
                  }
                  label="Auto logout after inactivity"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Session Timeout (minutes)"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                  helperText="Automatically log out after this period of inactivity"
                />
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" startIcon={<Save />} onClick={handleSecurityUpdate} disabled={loading}>
                  Save Security Settings
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Notifications Tab */}
        {activeTab === 3 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Notification Preferences</Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Email Notifications</Typography>
                <FormControlLabel
                  control={<Switch checked={notifications.emailCampaigns} onChange={(e) => setNotifications({ ...notifications, emailCampaigns: e.target.checked })} />}
                  label="Campaign updates and status changes"
                />
                <FormControlLabel
                  control={<Switch checked={notifications.emailReports} onChange={(e) => setNotifications({ ...notifications, emailReports: e.target.checked })} />}
                  label="Weekly reports and analytics"
                />
                <FormControlLabel
                  control={<Switch checked={notifications.emailUpdates} onChange={(e) => setNotifications({ ...notifications, emailUpdates: e.target.checked })} />}
                  label="Product updates and news"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Push Notifications</Typography>
                <FormControlLabel
                  control={<Switch checked={notifications.pushCampaigns} onChange={(e) => setNotifications({ ...notifications, pushCampaigns: e.target.checked })} />}
                  label="Campaign completion notifications"
                />
                <FormControlLabel
                  control={<Switch checked={notifications.pushReports} onChange={(e) => setNotifications({ ...notifications, pushReports: e.target.checked })} />}
                  label="Daily summary reports"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>SMS Alerts</Typography>
                <FormControlLabel
                  control={<Switch checked={notifications.smsAlerts} onChange={(e) => setNotifications({ ...notifications, smsAlerts: e.target.checked })} />}
                  label="Critical alerts via SMS"
                />
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" startIcon={<Save />} onClick={handleNotificationUpdate} disabled={loading}>
                  Save Notification Preferences
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Privacy Tab */}
        {activeTab === 4 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Privacy Settings</Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={privacy.profileVisible} onChange={(e) => setPrivacy({ ...privacy, profileVisible: e.target.checked })} />}
                  label="Make my profile visible to other users"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={privacy.showEmail} onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })} />}
                  label="Show my email address on profile"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={privacy.showPhone} onChange={(e) => setPrivacy({ ...privacy, showPhone: e.target.checked })} />}
                  label="Show my phone number on profile"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Data & Analytics</Typography>
                <FormControlLabel
                  control={<Switch checked={privacy.dataCollection} onChange={(e) => setPrivacy({ ...privacy, dataCollection: e.target.checked })} />}
                  label="Allow data collection for service improvement"
                />
                <FormControlLabel
                  control={<Switch checked={privacy.analytics} onChange={(e) => setPrivacy({ ...privacy, analytics: e.target.checked })} />}
                  label="Share anonymous usage analytics"
                />
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" startIcon={<Save />} onClick={handlePrivacyUpdate} disabled={loading}>
                  Save Privacy Settings
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Sessions Tab */}
        {activeTab === 5 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Active Sessions</Typography>
            <Divider sx={{ mb: 3 }} />

            <List>
              {sessions.map((session) => (
                <ListItem
                  key={session.id}
                  secondaryAction={
                    !session.current && (
                      <Button size="small" color="error" onClick={() => handleRevokeSession(session.id)}>
                        Revoke
                      </Button>
                    )
                  }
                >
                  <ListItemIcon>
                    <Devices color={session.current ? 'primary' : 'default'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {session.device}
                        {session.current && <Chip label="Current" size="small" color="primary" />}
                      </Box>
                    }
                    secondary={`${session.location} • Last active: ${new Date(session.lastActive).toLocaleString()}`}
                  />
                </ListItem>
              ))}
            </List>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                If you see any suspicious activity, revoke the session immediately and change your password.
              </Typography>
            </Alert>
          </Paper>
        )}

        {/* Activity Tab */}
        {activeTab === 6 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Activity Log</Typography>
            <Divider sx={{ mb: 3 }} />

            <List>
              {activities.map((activity) => (
                <ListItem key={activity.id}>
                  <ListItemIcon>
                    <History />
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.action}
                    secondary={`${new Date(activity.timestamp).toLocaleString()} • IP: ${activity.ip}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Advanced Tab */}
        {activeTab === 7 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Advanced Settings</Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Download color="primary" />
                      <Box>
                        <Typography variant="subtitle1">Export Your Data</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Download all your data in JSON format
                        </Typography>
                      </Box>
                    </Box>
                    <Button variant="outlined" startIcon={<Download />} onClick={() => setOpenExportDialog(true)}>
                      Export Data
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Warning color="error" />
                      <Box>
                        <Typography variant="subtitle1" color="error">Delete Account</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Permanently delete your account and all data
                        </Typography>
                      </Box>
                    </Box>
                    <Button variant="outlined" color="error" startIcon={<Delete />} onClick={() => setOpenDeleteDialog(true)}>
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Password Reset Dialog */}
        <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Alert>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="your@email.com"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenResetDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handlePasswordReset} disabled={loading}>
              Send Reset Link
            </Button>
          </DialogActions>
        </Dialog>

        {/* Export Data Dialog */}
        <Dialog open={openExportDialog} onClose={() => setOpenExportDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Export Your Data</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              This will download all your data including:
            </Alert>
            <List dense>
              <ListItem>
                <ListItemIcon><Check color="primary" /></ListItemIcon>
                <ListItemText primary="Profile information" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Check color="primary" /></ListItemIcon>
                <ListItemText primary="All campaigns" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Check color="primary" /></ListItemIcon>
                <ListItemText primary="All contacts" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Check color="primary" /></ListItemIcon>
                <ListItemText primary="All templates" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Check color="primary" /></ListItemIcon>
                <ListItemText primary="Settings and preferences" />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenExportDialog(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<Download />} onClick={handleExportData}>
              Export Now
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Warning: This action cannot be undone!</Typography>
              <Typography variant="body2">
                Deleting your account will permanently remove:
              </Typography>
            </Alert>
            <List dense>
              <ListItem>
                <ListItemIcon><Warning color="error" /></ListItemIcon>
                <ListItemText primary="Your profile and account data" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Warning color="error" /></ListItemIcon>
                <ListItemText primary="All campaigns and their history" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Warning color="error" /></ListItemIcon>
                <ListItemText primary="All contacts and groups" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Warning color="error" /></ListItemIcon>
                <ListItemText primary="All templates and settings" />
              </ListItem>
            </List>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Consider exporting your data before deleting your account.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button variant="contained" color="error" startIcon={<Delete />} onClick={handleDeleteAccount} disabled={loading}>
              Delete My Account
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default Profile;
