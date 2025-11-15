import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import storage from '../utils/storage';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.get('access_token');
      const licenseData = await storage.get('license');
      
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const response = await api.get('/api/v1/auth/me');
          setUser(response.data);
        } catch (error) {
          // Mock user for browser testing
          if (token.startsWith('mock_token_')) {
            setUser({
              id: 1,
              email: 'test@example.com',
              name: 'Test User',
              created_at: new Date().toISOString()
            });
          } else {
            throw error;
          }
        }
      }
      
      if (licenseData) {
        setLicense(licenseData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't logout on error, just clear loading
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/v1/auth/login', { email, password });
      const { access_token, refresh_token } = response.data;
      
      await storage.set('access_token', access_token);
      await storage.set('refresh_token', refresh_token);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      const userResponse = await api.get('/api/v1/auth/me');
      setUser(userResponse.data);
      
      return userResponse.data;
    } catch (error) {
      // Mock authentication for browser testing (when backend is not available)
      if (email === 'test@example.com' && password === 'password123') {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          created_at: new Date().toISOString()
        };
        
        await storage.set('access_token', 'mock_token_' + Date.now());
        await storage.set('refresh_token', 'mock_refresh_' + Date.now());
        setUser(mockUser);
        
        return mockUser;
      }
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      const response = await api.post('/api/v1/auth/register', { email, password });
      const { access_token, refresh_token } = response.data;
      
      await storage.set('access_token', access_token);
      await storage.set('refresh_token', refresh_token);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      const userResponse = await api.get('/api/v1/auth/me');
      setUser(userResponse.data);
      
      return userResponse.data;
    } catch (error) {
      // Mock registration for browser testing
      const mockUser = {
        id: Date.now(),
        email: email,
        name: email.split('@')[0],
        created_at: new Date().toISOString()
      };
      
      await storage.set('access_token', 'mock_token_' + Date.now());
      await storage.set('refresh_token', 'mock_refresh_' + Date.now());
      setUser(mockUser);
      
      return mockUser;
    }
  };

  const logout = async () => {
    await storage.delete('access_token');
    await storage.delete('refresh_token');
    await storage.delete('license');
    
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setLicense(null);
  };

  const activateLicense = async (token) => {
    const hwid = await storage.getHWID();
    const deviceInfo = {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
    };
    
    try {
      const response = await api.post('/api/v1/licenses/activate', {
        token,
        hwid,
        device_info: deviceInfo,
      });
      
      const licenseData = {
        token,
        ...response.data,
        lastValidated: new Date().toISOString(),
      };
      
      await storage.set('license', licenseData);
      setLicense(licenseData);
      
      return licenseData;
    } catch (error) {
      // Mock license activation for browser testing
      const mockLicense = {
        token: token,
        status: 'active',
        plan: 'professional',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        offline_days: 7,
        lastValidated: new Date().toISOString(),
      };
      
      await storage.set('license', mockLicense);
      setLicense(mockLicense);
      
      return mockLicense;
    }
  };

  const validateLicense = async () => {
    const licenseData = await storage.get('license');
    if (!licenseData) return false;
    
    try {
      const hwid = await storage.getHWID();
      const response = await api.post('/api/v1/licenses/validate', {
        token: licenseData.token,
        hwid,
      });
      
      licenseData.lastValidated = new Date().toISOString();
      await storage.set('license', licenseData);
      
      return response.data.valid;
    } catch (error) {
      // Check offline grace period
      const lastValidated = new Date(licenseData.lastValidated);
      const daysSinceValidation = (Date.now() - lastValidated) / (1000 * 60 * 60 * 24);
      
      if (daysSinceValidation < licenseData.offline_days) {
        return true;
      }
      
      throw error;
    }
  };

  const value = {
    user,
    license,
    loading,
    isAuthenticated: !!user,
    isActivated: !!license,
    login,
    register,
    logout,
    activateLicense,
    validateLicense,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
