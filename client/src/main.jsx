import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import App from './app/App';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ThemeModeProvider } from './features/theme/ThemeContext';
import './assets/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
