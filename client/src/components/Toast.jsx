import { createContext, useContext, useState, useCallback } from 'react';
import { Box, Paper } from '@mui/material';

const ToastContext = createContext();

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <Box sx={{ position: 'fixed', top: 20, right: { xs: 8, sm: 20 }, zIndex: 9999, maxWidth: { xs: '90vw', sm: 400 } }}>
        {toasts.map(toast => (
          <Paper
            key={toast.id}
            elevation={3}
            onClick={() => removeToast(toast.id)}
            sx={{
              p: '12px 24px',
              mb: 1,
              borderRadius: 1,
              color: '#fff',
              cursor: 'pointer',
              bgcolor: toast.type === 'error' ? '#f44336' : toast.type === 'success' ? '#4caf50' : '#2196f3',
              wordBreak: 'break-word',
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
            }}
          >
            {toast.message}
          </Paper>
        ))}
      </Box>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export default ToastProvider;
