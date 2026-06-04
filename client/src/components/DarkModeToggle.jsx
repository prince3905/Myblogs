import { IconButton, Tooltip } from '@mui/material';
import LightMode from '@mui/icons-material/LightMode';
import DarkMode from '@mui/icons-material/DarkMode';
import { useThemeMode } from '../features/theme/ThemeContext';

export default function DarkModeToggle() {
  const { mode, toggleTheme } = useThemeMode();
  const dark = mode === 'dark';

  return (
    <Tooltip title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} arrow>
      <IconButton
        onClick={toggleTheme}
        size="small"
        aria-label="toggle dark mode"
        sx={{
          transition: 'all 0.3s ease',
          bgcolor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          '&:hover': {
            bgcolor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            transform: 'rotate(180deg)',
          }
        }}
      >
        {dark ? (
          <LightMode sx={{ color: '#FFD700' }} />
        ) : (
          <DarkMode sx={{ color: '#6366f1' }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
