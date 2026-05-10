import { Box, Typography, Paper } from '@mui/material';

export default function AdSlot({ format = 'sidebar', style }) {
  const sizes = {
    sidebar: { minHeight: 250, label: 'Sidebar Ad' },
    incontent: { minHeight: 120, label: 'In-Content Ad' },
    afterpost: { minHeight: 160, label: 'After Post Ad' },
  };

  const s = sizes[format] || sizes.sidebar;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: s.minHeight,
        textAlign: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      <Box sx={{ py: 3, px: 2 }}>
        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
          — {s.label} —
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
          Replace with AdSense code
        </Typography>
      </Box>
    </Paper>
  );
}
