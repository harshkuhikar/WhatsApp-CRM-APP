import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Activation from './pages/Activation';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/CampaignsEnhanced';
import Contacts from './pages/Contacts';
import TemplatesEnhanced from './pages/TemplatesEnhanced';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { isAuthenticated, isActivated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isActivated) {
    return <Navigate to="/activation" />;
  }
  
  return children;
}

function App() {
  const { isAuthenticated, isActivated } = useAuth();
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Login />
        } />
        
        <Route path="/activation" element={
          !isAuthenticated ? <Navigate to="/login" /> :
          isActivated ? <Navigate to="/" /> :
          <Activation />
        } />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="templates" element={<TemplatesEnhanced />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
