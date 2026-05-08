import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './app/App';
import { AuthProvider } from './features/auth/context/AuthContext';
import baseTheme from './theme';
import './assets/styles/global.css';

// Create light theme
const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'light',
    background: {
      default: '#F6F4F3',
      paper: '#FFFFFF',
    },
  },
});

// Create dark theme
const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'dark',
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#E5E7EB',
      secondary: '#9CA3AF',
    },
  },
});

// Check local storage for dark mode preference
const savedMode = localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
const selectedTheme = savedMode === 'dark' ? darkTheme : lightTheme;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={selectedTheme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
