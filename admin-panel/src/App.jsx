import { Routes, Route } from 'react-router-dom';
import { Box, Container, AppBar, Toolbar, Typography } from '@mui/material';
import Dashboard from './pages/Dashboard';
import Licenses from './pages/Licenses';
import Resellers from './pages/Resellers';
import Users from './pages/Users';

function App() {
  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            MyWASender Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/resellers" element={<Resellers />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
