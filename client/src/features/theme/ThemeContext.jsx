import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import baseTheme from '../../theme';

const ThemeModeContext = createContext();

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true' ? 'dark' : 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', mode === 'dark');
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const toggleTheme = () => setMode(prev => prev === 'dark' ? 'light' : 'dark');

  const theme = useMemo(() => createTheme({
    ...baseTheme,
    palette: {
      ...baseTheme.palette,
      mode,
      ...(mode === 'dark' ? {
        background: {
          default: '#0a0a0a',
          paper: '#1a1a2e',
        },
        text: {
          primary: '#E5E7EB',
          secondary: '#9CA3AF',
        },
      } : {
        background: {
          default: '#F6F4F3',
          paper: '#FFFFFF',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
        },
      }),
    },
  }), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
