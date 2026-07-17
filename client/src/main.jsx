import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import CssBaseline from '@mui/material/CssBaseline';
import App from './app/App';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ThemeModeProvider } from './features/theme/ThemeContext';
import './assets/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <ThemeModeProvider>
          <CssBaseline />
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeModeProvider>
      </HelmetProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[Service Worker] Registered successfully:', reg.scope))
      .catch(err => console.error('[Service Worker] Registration failed:', err));
  });
}
