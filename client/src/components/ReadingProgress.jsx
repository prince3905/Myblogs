import { useState, useEffect } from 'react';
import { Box } from '@mui/material';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const prog = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(prog, 100));
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  if (progress === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        zIndex: 9999,
        bgcolor: 'rgba(0,0,0,0.05)',
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #6366f1 0%, #ec4899 100%)',
          transition: 'width 0.1s ease',
          borderRadius: '0 4px 4px 0',
          boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
        }}
      />
    </Box>
  );
}
