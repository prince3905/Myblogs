import { createTheme } from '@mui/material/styles';

const baseTheme = {
  palette: {
    primary: {
      main: '#6366f1', // Modern indigo
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899', // Vibrant pink
      light: '#f472b6',
      dark: '#db2777',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { 
      fontWeight: 800, 
      letterSpacing: '-0.03em',
      lineHeight: 1.2,
      fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
      mb: 2,
    },
    h2: { 
      fontWeight: 700, 
      letterSpacing: '-0.02em',
      lineHeight: 1.3,
      mb: 2,
    },
    h3: { 
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
      mb: 1.5,
    },
    h4: { 
      fontWeight: 600,
      lineHeight: 1.4,
      mb: 1.5,
    },
    h5: { 
      fontWeight: 600,
      lineHeight: 1.5,
      mb: 1,
    },
    h6: { 
      fontWeight: 600,
      lineHeight: 1.5,
      mb: 1,
    },
    body1: {
      fontSize: '1.125rem',
      lineHeight: 1.8,
      mb: 2,
    },
    body2: {
      fontSize: '0.95rem',
      lineHeight: 1.7,
      mb: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          borderRadius: 8,
          transition: 'all 0.3s ease',
          letterSpacing: '0.02em',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'rgba(0,0,0,0.08)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
            borderColor: 'primary.main',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
          fontSize: '0.85rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid',
          borderColor: 'rgba(0,0,0,0.06)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 20,
          paddingRight: 20,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        gutterBottom: {
          marginBottom: 16,
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
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
};

export default baseTheme;
