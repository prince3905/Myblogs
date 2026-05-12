import { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';

function cleanHeading(text) {
  let t = text.trim();
  t = t.replace(/^[""']+|[""']+$/g, '');
  t = t.replace(/\s+/g, ' ');
  if (t.length > 60) t = t.slice(0, 57) + '...';
  return t;
}

export default function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    if (!content) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const els = doc.querySelectorAll('h1, h2, h3');
    const items = Array.from(els).map((el, i) => {
      const text = cleanHeading(el.textContent || '');
      if (!text) return null;
      const level = parseInt(el.tagName[1]);
      const id = `toc-heading-${i}`;
      el.id = id;
      return { text, level, id };
    }).filter(Boolean);
    setHeadings(items);
  }, [content]);

  if (headings.length < 2) return null;

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
        Table of Contents
      </Typography>
      <Box component="nav">
        {headings.map((h) => (
          <Box
            key={h.id}
            component="a"
            href={`#${h.id}`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(h.id);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            sx={{
              display: 'block',
              pl: (h.level - 1) * 2,
              py: 0.4,
              fontSize: '0.85rem',
              color: 'text.secondary',
              textDecoration: 'none',
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
            }}
          >
            {h.text}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
