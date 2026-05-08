import { createTheme } from '@mui/material/styles';

const baseTheme = {
  palette: {
    primary: {
      main: '#4F46E5', // Deep indigo
      light: '#818CF8',
      dark: '#3730A3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#EC4899', // Vibrant pink
      light: '#F472B6',
      dark: '#BE185D',
    },
    background: {
      default: '#F6F4F3', // Warm off-white
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827', // Near black
      secondary: '#6B7280', // Medium gray
    },
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    divider: '#ECECEC',
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
      fontWeight: 700, 
      letterSpacing: '-0.03em',
      lineHeight: 1.05,
      fontSize: 'clamp(2.5rem, 5vw, 4rem)',
      mb: 2,
    },
    h2: { 
      fontWeight: 700, 
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      fontSize: 'clamp(2rem, 4vw, 3rem)',
      mb: 2,
    },
    h3: { 
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
      fontSize: 'clamp(1.5rem, 3vw, 2rem)',
      mb: 1.5,
    },
    h4: { 
      fontWeight: 600,
      lineHeight: 1.4,
      fontSize: '1.25rem',
      mb: 1.5,
    },
    h5: { 
      fontWeight: 600,
      lineHeight: 1.5,
      fontSize: '1.125rem',
      mb: 1,
    },
    h6: { 
      fontWeight: 600,
      lineHeight: 1.5,
      fontSize: '1rem',
      mb: 1,
    },
    body1: {
      fontSize: '1.125rem',
      lineHeight: 1.8,
      fontWeight: 400,
    },
    body2: {
      fontSize: '1rem',
      lineHeight: 1.7,
      fontWeight: 400,
    },
    caption: {
      fontSize: '0.85rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          borderRadius: 12,
          transition: 'all 0.3s ease',
          letterSpacing: '0.01em',
          fontSize: '0.95rem',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.15)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
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
          transition: 'all 0.4s ease',
          overflow: 'hidden',
          borderRadius: 28,
          border: '1px solid',
          borderColor: '#ECECEC',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.06)',
            borderColor: '#E5E7EB',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 9999,
          fontSize: '0.8rem',
          height: 28,
          paddingLeft: 4,
          paddingRight: 4,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 14,
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 24,
          paddingRight: 24,
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
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          '& fieldset': {
            borderColor: '#ECECEC',
          },
          '&:hover fieldset': {
            borderColor: '#D1D5DB',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.9rem',
        },
      },
    },
  },
};

export default baseTheme;
