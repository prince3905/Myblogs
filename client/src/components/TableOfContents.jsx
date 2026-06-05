import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function cleanHeading(text) {
  let t = text.trim();
  t = t.replace(/^[""']+|[""']+$/g, '');
  t = t.replace(/\s+/g, ' ');
  if (t.length > 60) t = t.slice(0, 57) + '...';
  return t;
}

export default function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!content) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const els = doc.querySelectorAll('h1, h2, h3');
    const items = Array.from(els).map((el, i) => {
      const text = cleanHeading(el.textContent || '');
      if (!text) return null;
      const level = parseInt(el.tagName[1]);
      return { text, level, id: `toc-heading-${i}` };
    }).filter(Boolean);
    setHeadings(items);

    // Set matching IDs on actual DOM headings so scrollIntoView works
    setTimeout(() => {
      const container = document.querySelector('.blog-content');
      if (!container) return;
      const headings = container.querySelectorAll('h1, h2, h3');
      headings.forEach((el, i) => el.id = `toc-heading-${i}`);
    }, 50);
  }, [content]);

  if (headings.length < 2) return null;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, md: 2.5 }, 
        mb: 4, 
        borderRadius: 3, 
        border: '1px solid', 
        borderColor: 'divider', 
        bgcolor: 'grey.50',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <Box 
        onClick={() => setExpanded(!expanded)}
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': {
            opacity: 0.8
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
          Table of Contents ({headings.length})
        </Typography>
        <ExpandMoreIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </Box>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box component="nav" sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
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
      </Collapse>
    </Paper>
  );
}
