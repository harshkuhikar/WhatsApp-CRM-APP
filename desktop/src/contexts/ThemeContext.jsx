import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('theme_mode');
    return saved || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme_mode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#25D366' : '#128C7E',
            light: '#4ADE80',
            dark: '#0D5D4F',
          },
          secondary: {
            main: mode === 'light' ? '#128C7E' : '#25D366',
          },
          background: {
            default: mode === 'light' ? '#F5F7FA' : '#0A1929',
            paper: mode === 'light' ? '#FFFFFF' : '#132F4C',
          },
          success: {
            main: '#10B981',
            light: '#34D399',
            dark: '#059669',
          },
          error: {
            main: '#EF4444',
            light: '#F87171',
            dark: '#DC2626',
          },
          warning: {
            main: '#F59E0B',
            light: '#FBBF24',
            dark: '#D97706',
          },
          info: {
            main: '#3B82F6',
            light: '#60A5FA',
            dark: '#2563EB',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
          },
          h2: {
            fontWeight: 700,
            fontSize: '2rem',
          },
          h3: {
            fontWeight: 600,
            fontSize: '1.75rem',
          },
          h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
          },
          h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
          },
          h6: {
            fontWeight: 600,
            fontSize: '1rem',
          },
          button: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 12,
        },
        shadows: [
          'none',
          mode === 'light'
            ? '0px 2px 4px rgba(0,0,0,0.05)'
            : '0px 2px 4px rgba(0,0,0,0.3)',
          mode === 'light'
            ? '0px 4px 8px rgba(0,0,0,0.08)'
            : '0px 4px 8px rgba(0,0,0,0.4)',
          mode === 'light'
            ? '0px 8px 16px rgba(0,0,0,0.1)'
            : '0px 8px 16px rgba(0,0,0,0.5)',
          mode === 'light'
            ? '0px 12px 24px rgba(0,0,0,0.12)'
            : '0px 12px 24px rgba(0,0,0,0.6)',
          ...Array(20).fill(
            mode === 'light'
              ? '0px 16px 32px rgba(0,0,0,0.15)'
              : '0px 16px 32px rgba(0,0,0,0.7)'
          ),
        ],
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: '0.95rem',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: mode === 'light' 
                    ? '0px 4px 12px rgba(0,0,0,0.1)' 
                    : '0px 4px 12px rgba(0,0,0,0.4)',
                },
              },
              contained: {
                '&:hover': {
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: mode === 'light'
                  ? '0px 4px 12px rgba(0,0,0,0.08)'
                  : '0px 4px 12px rgba(0,0,0,0.4)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: mode === 'light'
                    ? '0px 8px 24px rgba(0,0,0,0.12)'
                    : '0px 8px 24px rgba(0,0,0,0.5)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                backgroundImage: 'none',
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                fontWeight: 600,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  const value = {
    mode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
