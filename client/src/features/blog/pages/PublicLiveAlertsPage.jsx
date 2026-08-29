import { useEffect, useState, Fragment, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableRow, Paper, Chip, Box, Alert, CircularProgress,
  IconButton, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Collapse,
  Pagination, Link as MuiLink, Dialog, DialogContent, DialogTitle, DialogActions,
  Divider
} from '@mui/material';
import {
  NotificationsActive as NotificationIcon,
  KeyboardArrowDown as ExpandMoreIcon, KeyboardArrowUp as ExpandLessIcon,
  PictureAsPdf as PdfIcon, Language as WebIcon,
  AssignmentTurnedIn as ApplyIcon, CalendarToday as CalendarIcon,
  LocationOn as LocationIcon, Work as WorkIcon,
  FilterList as FilterIcon, RestartAlt as ResetIcon,
  Close as CloseIcon, Search as SearchIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { request } from '../../../shared/lib/api';
import TelegramRedirectModal from '../../../components/TelegramRedirectModal';
import { resolveOfficialGovtPortal } from '../../../shared/lib/govtPortalMap';

const keyKeywords = [
  'Application Begin',
  'Last Date for Apply Online',
  'Last Date to Apply',
  'Last Date',
  'Pay Exam Fee Last Date',
  'Pay Exam Fee',
  'Complete Form Last Date',
  'Complete Form',
  'UP TGT Exam Date',
  'Exam Date',
  'Exam City Available',
  'Exam City',
  'Admit Card Available',
  'Admit Card',
  'Answer Key Available',
  'Answer Key',
  'Result Available',
  'General / OBC / EWS',
  'General / OBC / EWS /',
  'General/OBC/EWS',
  'General/OBC/EWS/',
  'General / OBC',
  'General/OBC',
  'General / EWS',
  'General/EWS',
  'General',
  'OBC',
  'EWS',
  'SC / ST',
  'SC/ST',
  'SC',
  'ST',
  'General / OBC / EWS / SC / ST',
  'General/OBC/EWS/SC/ST',
  'Female',
  'Single Female',
  'All Category Female',
  'All Category Female /',
  'All Category Female/',
  'Pay the Exam Fee Through',
  'Pay the Exam Fee',
  'Minimum Age',
  'Maximum Age',
  'Age Relaxation Extra as per'
];

function isRowMatch(cell1, cell2, alertTitle = '') {
  const c1 = cell1.toLowerCase().trim();
  const c2 = cell2.toLowerCase().trim();
  if (!c1 && !c2) return false;

  const exactMatches = keyKeywords.map(k => k.toLowerCase());
  if (exactMatches.includes(c1) || exactMatches.includes(c2)) return true;

  const partialMatches = ['date', 'fee', 'age', 'vacancy', 'post', 'eligibility', 'qualification', 'exam'];
  const cellMatch = partialMatches.some(p => c1.includes(p) || c2.includes(p));
  if (cellMatch) return true;

  if (alertTitle) {
    const titleWords = alertTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const hasWordMatch = titleWords.some(w => c1.includes(w) || c2.includes(w));
    if (hasWordMatch) return true;
  }

  return false;
}

function sanitizeClientUrl(url, alertTitle = '', alertBoard = '') {
  if (!url || typeof url !== 'string') {
    return resolveOfficialGovtPortal(alertTitle, alertBoard, '');
  }
  const lower = url.toLowerCase();
  if (
    lower.includes('sarkariresult') ||
    lower.includes('sarkariresults') ||
    lower.includes('freejobalert') ||
    lower.includes('sarkari-result') ||
    lower.includes('/job-alerts') ||
    lower.includes('digitalhomeblog.in')
  ) {
    return resolveOfficialGovtPortal(alertTitle, alertBoard, url);
  }
  return url;
}

function getDynamicActions(alert) {
  if (!alert) return [];
  const alertTitle = alert.title || '';
  const alertBoard = alert.boardName || '';

  const parsedLinks = [];
  if (alert.detailsText) {
    const lines = alert.detailsText.split('\n');
    for (const line of lines) {
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2) {
          const name = parts[0];
          const restText = parts.slice(1).join(' | ');
          
          // Loop through all (Link: ...) occurrences in restText to catch Hindi, English, Server 1, Server 2 links!
          const linkRegex = /([^|()]+)?\s*\((?:Link|link):\s*([^)]+)\)/gi;
          let match;
          while ((match = linkRegex.exec(restText)) !== null) {
            const subLabel = (match[1] || '').trim();
            const rawUrl = (match[2] || '').trim();
            const urlMatches = rawUrl.match(/(?:https?:\/\/|\/)[^\s,]+/gi);
            if (urlMatches && urlMatches.length > 0) {
              const fullLabel = subLabel && subLabel.toLowerCase() !== 'link' 
                ? `${name} (${subLabel})` 
                : name;
              parsedLinks.push({ name: fullLabel, url: sanitizeClientUrl(urlMatches[0], alertTitle, alertBoard) });
            }
          }
        }
      }
    }
  }

  function findParsedLink(keywords) {
    const found = parsedLinks.find(link => 
      keywords.some(kw => link.name.toLowerCase().includes(kw.toLowerCase()))
    );
    return found ? sanitizeClientUrl(found.url, alertTitle, alertBoard) : null;
  }

  const actions = [];

  // 1. PDF Link
  const pdfUrl = sanitizeClientUrl(alert.officialPdfUrl || findParsedLink(['notification', 'pdf', 'advertisement', 'notice']), alertTitle, alertBoard);
  actions.push({
    label: 'Download Notification PDF',
    url: pdfUrl,
    icon: <PdfIcon />,
    color: '#DC2626',
    hoverBg: '#FEF2F2',
    borderColor: '#FCA5A5'
  });

  // 2. Apply URL
  const applyUrl = sanitizeClientUrl(alert.officialApplyUrl || findParsedLink(['apply online', 'online form', 'apply', 'admit card', 'hall ticket', 'result', 'score card', 'answer key', 'key']), alertTitle, alertBoard);
  actions.push({
    label: 'Apply Online Now',
    url: applyUrl,
    icon: <ApplyIcon />,
    color: '#16A34A',
    hoverBg: '#ECFDF5',
    borderColor: '#A7F3D0'
  });

  // 3. Official Web URL
  const webUrl = sanitizeClientUrl(alert.officialUrl || findParsedLink(['official website', 'homepage', 'website']), alertTitle, alertBoard);
  actions.push({
    label: 'Official Board Website',
    url: webUrl,
    icon: <WebIcon />,
    color: '#2563EB',
    hoverBg: '#EFF6FF',
    borderColor: '#93C5FD'
  });

  // 4. Any other links parsed from detailsText
  parsedLinks.forEach(link => {
    const label = link.name.trim();
    const isMain = ['notification', 'pdf', 'advertisement', 'notice', 'apply online', 'online form', 'apply', 'admit card', 'hall ticket', 'result', 'score card', 'answer key', 'key', 'official website', 'homepage', 'website']
      .some(kw => label.toLowerCase().includes(kw));
    if (!isMain && link.url) {
      actions.push({
        label: label,
        url: sanitizeClientUrl(link.url),
        icon: <WebIcon />,
        color: '#4B5563',
        hoverBg: '#F3F4F6',
        borderColor: '#D1D5DB'
      });
    }
  });

  return actions;
}

function renderTextWithLinks(text) {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s"'\(\)<>]+|\/tools)/gi;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    let url = match[1];

    let cleanUrl = url;
    let trailingPart = '';
    while (cleanUrl.length > 0 && [',', '.', ';', ':', ')'].includes(cleanUrl[cleanUrl.length - 1])) {
      if (cleanUrl[cleanUrl.length - 1] === ')') {
        const openCount = (cleanUrl.match(/\(/g) || []).length;
        const closeCount = (cleanUrl.match(/\)/g) || []).length;
        if (closeCount > openCount) {
          trailingPart = ')' + trailingPart;
          cleanUrl = cleanUrl.slice(0, -1);
          continue;
        }
      } else {
        trailingPart = cleanUrl[cleanUrl.length - 1] + trailingPart;
        cleanUrl = cleanUrl.slice(0, -1);
      }
      break;
    }

    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    parts.push(
      <MuiLink
        key={cleanUrl + matchIndex}
        href={cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          fontWeight: 700,
          color: '#ffffff',
          bgcolor: '#4F46E5',
          textDecoration: 'none',
          px: 1.2,
          py: 0.4,
          borderRadius: '4px',
          fontSize: '0.72rem',
          '&:hover': { bgcolor: '#312E81', textDecoration: 'none' },
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.3,
          mx: 0.5,
          transition: 'background-color 0.2s',
          boxShadow: '0 2px 4px rgba(79, 70, 229, 0.15)',
          verticalAlign: 'middle',
          whiteSpace: 'nowrap'
        }}
      >
        Click Here ↗
      </MuiLink>
    );

    if (trailingPart) {
      parts.push(trailingPart);
    }

    lastIndex = urlRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function parseDetails(text, alert) {
  if (!alert) return { postName: '', postDate: '', shortInfo: '', sections: [] };
  const parsed = {
    postName: alert.title || '',
    postDate: alert.postDate || (alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : ''),
    shortInfo: '',
    sections: []
  };

  const lowerText = (text || '').toLowerCase();
  if (
    !text || 
    text.length < 30 ||
    lowerText.includes('menu home latest job') || 
    lowerText.includes('powered by wordpress') || 
    lowerText.includes('username or email address') ||
    lowerText.includes('wp_attempt_focus') ||
    lowerText.includes('lost your password')
  ) {
    parsed.shortInfo = `Official notification details and key updates for ${alert.title}. Use the direct buttons below to access the official notification PDF, application portal, or board website.`;
    return parsed;
  }

  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .filter(l => !l.includes('adsbygoogle') && !l.includes('window.adsbygoogle'));

  let currentSection = null;

  function closeCurrentSection() {
    if (currentSection) {
      if (currentSection.type === 'keyvalue') {
        const finalItems = [];
        for (let i = 0; i < currentSection.items.length; i++) {
          const item = currentSection.items[i];
          if (i < currentSection.items.length - 1) {
            const nextItem = currentSection.items[i + 1];
            if (isRowMatch(item.key, item.value, alert.title) && isRowMatch(nextItem.key, nextItem.value, alert.title)) {
              finalItems.push(item);
            } else {
              const combinedKey = `${item.key} : ${item.value}`.trim().replace(/^[:\s\-]+|[:\s\-]+$/g, '');
              const combinedVal = `${nextItem.key} : ${nextItem.value}`.trim().replace(/^[:\s\-]+|[:\s\-]+$/g, '');
              finalItems.push({ key: combinedKey, value: combinedVal });
              i++; // Skip next element
            }
          } else {
            finalItems.push(item);
          }
        }
        currentSection.items = finalItems.filter(item => item.key !== '' || item.value !== '');
      }
      parsed.sections.push(currentSection);
      currentSection = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.toLowerCase().startsWith('short information') || line.toLowerCase().startsWith('short info')) {
      closeCurrentSection();
      let infoText = line;
      while (i + 1 < lines.length && 
             !lines[i + 1].includes('---') && 
             !lines[i + 1].toLowerCase().includes('important date') && 
             !lines[i + 1].toLowerCase().includes('application fee') && 
             !lines[i + 1].toLowerCase().includes('vacancy detail') && 
             !lines[i + 1].toLowerCase().includes('how to fill') && 
             !lines[i + 1].toLowerCase().includes('useful') && 
             !lines[i + 1].includes('|')) {
        i++;
        infoText += ' ' + lines[i];
      }
      parsed.shortInfo = infoText.replace(/^(short information|short info)[:\s\-\s]+/i, '').trim();
      continue;
    }

    const cleanLower = line.toLowerCase();
    if (line.includes('---') && line.replace(/[^a-zA-Z0-9]/g, '').length > 3) {
      closeCurrentSection();
      currentSection = {
        type: 'heading',
        title: line.replace(/[\-\s]+/g, ' ').trim()
      };
      closeCurrentSection();
      continue;
    }

    if (cleanLower.includes('important date') || 
        cleanLower.includes('application fee') || 
        cleanLower.includes('age limit') || 
        cleanLower.includes('vacancy detail') || 
        cleanLower.includes('how to fill') || 
        cleanLower.includes('useful important link') ||
        cleanLower.includes('important notice') ||
        cleanLower.includes('note') ||
        (cleanLower.includes('interested candidates') && cleanLower.includes('read the full'))) {
      closeCurrentSection();
      currentSection = {
        type: 'heading',
        title: line.trim()
      };
      closeCurrentSection();
      continue;
    }

    if (line.includes('|')) {
      if (!currentSection || currentSection.type !== 'table') {
        closeCurrentSection();
        currentSection = { type: 'table', rows: [] };
      }
      const cols = line.split('|').map(c => c.trim());
      currentSection.rows.push(cols);
      continue;
    }

    if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      if (key.length > 0) {
        if (!currentSection || currentSection.type !== 'keyvalue') {
          closeCurrentSection();
          currentSection = { type: 'keyvalue', items: [] };
        }
        currentSection.items.push({ key, value });
        continue;
      }
    }

    if (!currentSection || currentSection.type !== 'text') {
      closeCurrentSection();
      currentSection = { type: 'text', paragraphs: [] };
    }
    currentSection.paragraphs.push(line);
  }
  closeCurrentSection();

  return parsed;
}

function renderBlogContent(alert) {
  const parsed = parseDetails(alert.detailsText, alert);

  return (
    <Box sx={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.6 }}>
      {parsed.shortInfo && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#EFF6FF', borderRadius: 2, borderLeft: '4px solid #3B82F6' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E40AF', mb: 0.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 0.5 }}>
            Short Information
          </Typography>
          <Typography variant="body2" sx={{ color: '#1E3A8A', lineHeight: 1.5, fontSize: '0.85rem' }}>
            {parsed.shortInfo}
          </Typography>
        </Box>
      )}

      {parsed.sections.map((sect, idx) => {
        if (sect.type === 'heading') {
          const titleLower = sect.title.toLowerCase();
          const isWarning = titleLower.includes('notice') || 
                            titleLower.includes('note') || 
                            titleLower.includes('interested candidates');
          const isLink = titleLower.includes('link');
          const isDateFee = titleLower.includes('date') || titleLower.includes('fee') || titleLower.includes('age limit');

          let icon = '⚡';
          let bgColor = '#F3F4F6';
          let textColor = '#1F2937';
          let borderLeftColor = '#9CA3AF';

          if (isWarning) {
            icon = '⚠️';
            bgColor = '#FFFBEB';
            textColor = '#B45309';
            borderLeftColor = '#F59E0B';
          } else if (isLink) {
            icon = '🔗';
            bgColor = '#EFF6FF';
            textColor = '#1E40AF';
            borderLeftColor = '#3B82F6';
          } else if (isDateFee) {
            icon = '📅';
            bgColor = '#F0FDF4';
            textColor = '#15803D';
            borderLeftColor = '#22C55E';
          }

          return (
            <Box 
              key={idx} 
              sx={{ 
                p: 1.5, 
                bgcolor: bgColor, 
                borderLeft: `5px solid ${borderLeftColor}`, 
                borderRadius: '8px', 
                mt: 3, 
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 800, 
                  color: textColor, 
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                {icon} {sect.title}
              </Typography>
            </Box>
          );
        }

        if (sect.type === 'keyvalue') {
          return (
            <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 2.5 }}>
              {sect.items.map((it, itIdx) => (
                <Box 
                  key={itIdx} 
                  sx={{ 
                    p: 1.2, 
                    bgcolor: '#F9FAFB', 
                    borderRadius: 2, 
                    border: '1px solid #ECECEC',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.75rem' }}>{it.key}</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#1F2937', fontSize: '0.78rem', textAlign: 'right' }}>
                    {renderTextWithLinks(it.value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          );
        }

        if (sect.type === 'table') {
          return (
            <TableContainer key={idx} component={Paper} variant="outlined" sx={{ mb: 2.5, borderRadius: 2, overflowX: 'auto' }}>
              <Table size="small">
                <TableBody>
                  {sect.rows.map((row, rowIdx) => {
                    const isHeader = rowIdx === 0 && row.length > 1;
                    return (
                      <TableRow 
                        key={rowIdx} 
                        sx={{ 
                          bgcolor: isHeader ? '#F3F4F6' : (rowIdx % 2 === 0 ? 'white' : '#F9FAFB'),
                          '& td': { py: 1, px: { xs: 1, sm: 1.5 } } 
                        }}
                      >
                        {row.map((col, colIdx) => (
                          <TableCell 
                            key={colIdx} 
                            sx={{ 
                              fontWeight: isHeader ? 700 : 500,
                              fontSize: '0.78rem',
                              color: isHeader ? '#374151' : '#4B5563',
                              borderRight: '1px solid #E5E7EB',
                              '&:last-child': { borderRight: 'none' }
                            }}
                          >
                            {renderTextWithLinks(col)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          );
        }

        if (sect.type === 'text') {
          return (
            <Box key={idx} sx={{ mb: 2 }}>
              {sect.paragraphs.map((para, pIdx) => {
                return (
                  <Typography key={pIdx} variant="body2" sx={{ color: '#4B5563', mb: 0.8, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {renderTextWithLinks(para)}
                  </Typography>
                );
              })}
            </Box>
          );
        }

        return null;
      })}
    </Box>
  );
}

function renderAlertListItem(alert, setSelectedAlert, themeColor) {
  const isNew = new Date() - new Date(alert.createdAt) < 3 * 24 * 60 * 60 * 1000;
  const hasValidDate = alert.lastDate && alert.lastDate !== 'N/A' && alert.lastDate !== 'Check Detail Page';

  return (
    <Box
      key={alert._id}
      onClick={() => setSelectedAlert(alert)}
      sx={{
        p: 2,
        cursor: 'pointer',
        borderBottom: '1px solid #F1F5F9',
        borderLeft: `3.5px solid transparent`,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.8,
        '&:hover': {
          bgcolor: '#F8FAFC',
          borderLeftColor: themeColor,
          pl: 2.5,
          '& .alert-title': {
            color: themeColor
          }
        },
        '&:last-child': {
          borderBottom: 'none'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 850, 
            color: themeColor, 
            textTransform: 'uppercase', 
            fontSize: '0.62rem',
            letterSpacing: 0.8
          }}
        >
          {alert.boardName || 'Official Board'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {isNew && (
            <Chip 
              label="NEW" 
              size="small" 
              sx={{ 
                height: 16, 
                fontSize: '0.55rem', 
                fontWeight: 900, 
                bgcolor: '#EF4444', 
                color: 'white',
                borderRadius: '4px',
                '& .MuiChip-label': { px: 0.6 }
              }} 
            />
          )}
          {alert.state && alert.state !== 'Central/All India' && (
            <Chip 
              label={alert.state} 
              size="small" 
              sx={{ 
                height: 16, 
                fontSize: '0.55rem', 
                fontWeight: 700, 
                bgcolor: '#FEF3C7', 
                color: '#B45309',
                borderRadius: '4px',
                '& .MuiChip-label': { px: 0.6 }
              }} 
            />
          )}
        </Box>
      </Box>

      <Typography 
        className="alert-title"
        variant="body2" 
        sx={{ 
          fontWeight: 700, 
          color: '#1F2937', 
          lineHeight: 1.4,
          fontSize: '0.82rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          transition: 'color 0.2s ease'
        }}
      >
        {alert.title}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.8, pt: 0.5, borderTop: '1px dashed #F1F5F9' }}>
        <Typography variant="caption" sx={{ color: '#4B5563', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.4 }}>
          <CalendarIcon sx={{ fontSize: 13, color: themeColor }} />
          📅 Post: {alert.postDate && alert.postDate !== 'Latest Update' ? alert.postDate : new Date(alert.parsedPostDate || alert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </Typography>
        {hasValidDate ? (
          <Chip
            label={`⏳ Last Date: ${alert.lastDate}`}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.63rem',
              fontWeight: 800,
              bgcolor: '#FEE2E2',
              color: '#DC2626',
              borderRadius: '6px',
              border: '1px solid #FCA5A5',
              '& .MuiChip-label': { px: 0.8 }
            }}
          />
        ) : (
          <Chip
            label="✅ Active"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 800,
              bgcolor: '#DCFCE7',
              color: '#15803D',
              borderRadius: '4px',
              '& .MuiChip-label': { px: 0.6 }
            }}
          />
        )}
      </Box>
    </Box>
  );
}

const HOT_LINKS_CONFIG = [
  {
    displayName: "SSC CGL Form 2026",
    searchKeywords: ["ssc cgl", "cgl 2026", "cgl"],
    postCount: "12,256 Posts",
    type: "alert"
  },
  {
    displayName: "DSSSB Various Post Form",
    searchKeywords: ["dsssb"],
    postCount: "1979 Posts",
    type: "alert"
  },
  {
    displayName: "UPSSSC Lower PCS Form",
    searchKeywords: ["upsssc lower", "lower pcs"],
    postCount: "2516 Posts",
    type: "alert"
  },
  {
    displayName: "Allahabad High Court RO, ARO & CA Form",
    searchKeywords: ["allahabad high court", "ro, aro", "high court ro"],
    postCount: "RO/ARO/CA",
    type: "alert"
  },
  {
    displayName: "RRB Technician Form 2026",
    searchKeywords: ["rrb technician", "rrb tech", "technician 2026"],
    postCount: "6565 Posts",
    type: "alert"
  },
  {
    displayName: "UPSSSC Excise Constable Form",
    searchKeywords: ["excise constable", "upsssc excise"],
    postCount: "Excise Constable",
    type: "alert"
  },
  {
    displayName: "BPSC Teacher TRE 4.0 Form",
    searchKeywords: ["bpsc teacher", "tre 4.0", "bpsc tre"],
    postCount: "44,000+ Posts",
    type: "alert"
  }
];

const getCardStyles = (item, index) => {
  const isFeatured = index === 0;
  if (isFeatured) {
    return {
      borderColor: '#6366F1',
      textColor: '#312E81',
      bgColor: '#EEF2FF',
      bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
      hoverBg: '#E0E7FF',
      hoverBgGradient: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
      shadowColor: 'rgba(99, 102, 241, 0.12)'
    };
  }
  const isRed = index % 2 !== 0;
  if (isRed) {
    return {
      borderColor: '#F87171',
      textColor: '#991B1B',
      bgColor: '#FEF2F2',
      bgGradient: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
      hoverBg: '#FEE2E2',
      hoverBgGradient: 'linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)',
      shadowColor: 'rgba(239, 68, 68, 0.08)'
    };
  } else {
    return {
      borderColor: '#60A5FA',
      textColor: '#1E40AF',
      bgColor: '#EFF6FF',
      bgGradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      hoverBg: '#DBEAFE',
      hoverBgGradient: 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)',
      shadowColor: 'rgba(59, 130, 246, 0.08)'
    };
  }
};

export default function PublicLiveAlertsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const alertIdParam = searchParams.get('alert');
  const openedAlertIdRef = useRef(null);

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedAlert, setSelectedAlertState] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [errorLoadingDetails, setErrorLoadingDetails] = useState('');
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState('');

  const setSelectedAlert = async (alert) => {
    if (!alert) {
      setSelectedAlertState(null);
      openedAlertIdRef.current = null;
      if (searchParams && searchParams.has('alert')) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('alert');
        setSearchParams(newParams, { replace: true });
      }
      return;
    }
    
    setSelectedAlertState(alert);
    if (alert._id) {
      openedAlertIdRef.current = alert._id;
    }
    
    if (!alert.detailsText) {
      setDetailsLoading(true);
      setErrorLoadingDetails('');
      try {
        const res = await request(`/api/public/live-alerts/${alert._id}`);
        if (res.success && res.data) {
          setSelectedAlertState(res.data);
        } else {
          setErrorLoadingDetails(res.message || 'Failed to fetch details from server');
        }
      } catch (err) {
        setErrorLoadingDetails(err.message || 'Failed to connect to server');
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  const navigate = useNavigate();

  const hotLinks = useMemo(() => {
    return HOT_LINKS_CONFIG.map(config => {
      if (config.isStatic) {
        return { ...config, targetAlert: null };
      }
      const match = alerts.find(a => {
        const titleLower = a.title.toLowerCase();
        return config.searchKeywords.some(kw => titleLower.includes(kw));
      });
      return { ...config, targetAlert: match || null };
    });
  }, [alerts]);

  const handleHotLinkClick = (item) => {
    if (item.isStatic) {
      navigate(item.link);
    } else if (item.targetAlert) {
      setSelectedAlert(item.targetAlert);
    } else {
      setSearchQuery(item.searchKeywords[0]);
      setSelectedState('All States');
      setTimeout(() => {
        const element = document.getElementById('search-filter-section') || document.getElementById('alerts-lists-grid');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  function loadAlerts(query = '') {
    setLoading(true);
    setError('');
    const url = query.trim() 
      ? `/api/public/live-alerts?status=all&search=${encodeURIComponent(query.trim())}&limit=300`
      : '/api/public/live-alerts?status=all&limit=300';

    request(url)
      .then(res => {
        if (res.success) {
          setAlerts(res.data || []);
        } else {
          setError(res.message || 'Failed to fetch alerts');
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to connect to server');
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAlerts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!alertIdParam || openedAlertIdRef.current === alertIdParam) return;

    openedAlertIdRef.current = alertIdParam;

    request(`/api/public/live-alerts/${alertIdParam}`)
      .then(res => {
        if (res.success && res.data) {
          setSelectedAlertState(res.data);
        }
      })
      .catch(err => console.error('Failed to auto-load alert details:', err.message));
  }, [alertIdParam]);

  const uniqueStates = useMemo(() => {
    return ['All States', ...new Set(alerts.map(a => a.state || 'Central/All India'))].sort();
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const titleMatch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (alert.boardName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const stateMatch = selectedState === 'All States' || (alert.state || 'Central/All India') === selectedState;
      return titleMatch && stateMatch;
    });
  }, [alerts, searchQuery, selectedState]);

  const categoryData = useMemo(() => {
    const jobs = [];
    const admitCards = [];
    const results = [];
    const answerKeys = [];
    const syllabus = [];
    const admissions = [];

    filteredAlerts.forEach(alert => {
      const titleLower = (alert.title || '').toLowerCase();
      const catLower = (alert.category || '').toLowerCase();
      const combinedText = `${titleLower} ${catLower}`;

      if (combinedText.includes('key') || combinedText.includes('objection') || combinedText.includes('answer')) {
        answerKeys.push(alert);
      } else if (combinedText.includes('admit') || combinedText.includes('hall ticket') || combinedText.includes('call letter') || combinedText.includes('exam city')) {
        admitCards.push(alert);
      } else if (combinedText.includes('result') || combinedText.includes('score') || combinedText.includes('merit')) {
        results.push(alert);
      } else if (combinedText.includes('syllabus') || combinedText.includes('pattern')) {
        syllabus.push(alert);
      } else if (combinedText.includes('admission') || combinedText.includes('counselling')) {
        admissions.push(alert);
      } else {
        jobs.push(alert);
      }
    });

    const sortByDate = (a, b) => new Date(b.parsedPostDate || b.createdAt) - new Date(a.parsedPostDate || a.createdAt);
    jobs.sort(sortByDate);
    admitCards.sort(sortByDate);
    results.sort(sortByDate);
    answerKeys.sort(sortByDate);
    syllabus.sort(sortByDate);
    admissions.sort(sortByDate);

    return { jobs, admitCards, results, answerKeys, syllabus, admissions };
  }, [filteredAlerts]);

  return (
    <Layout>
      <Seo 
        title="Live Job Alerts & Vacancies | Digital Home" 
        description="Browse, filter, and search active job vacancies, admit cards, and results fetched dynamically from official government boards." 
      />

      <Box sx={{ pt: { xs: 1.5, md: 2 }, pb: { xs: 4, md: 6 } }}>
        
        {/* Page Title & Intro */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.5, fontSize: '0.65rem' }}>
            Real-Time Notifications Feed
          </Typography>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontWeight: 800, 
              mt: 0.5, 
              letterSpacing: '-0.02em', 
              color: '#111827', 
              fontSize: { xs: '1.3rem', md: '1.6rem' } 
            }}
          >
            Live Student Alerts & Jobs 🔔
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mt: 0.5, maxWidth: 600, mx: 'auto', fontSize: '0.82rem' }}
          >
            Instant job vacancies, results, and exam updates straight from official government servers. Fast and clean access for students.
          </Typography>
        </Box>

        {/* Beautiful Prominent Important Notice Section */}
        <Box 
          sx={{ 
            mb: 2.5, 
            p: 1.2, 
            bgcolor: '#FFFBEB', 
            borderRadius: '10px', 
            borderLeft: '4px solid #D97706',
            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.03)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.2,
            maxWidth: '960px',
            mx: 'auto'
          }}
        >
          <NotificationIcon sx={{ color: '#D97706', mt: 0.2, fontSize: '1.1rem' }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 850, color: '#78350F', fontSize: '0.76rem', mb: 0.1, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              IMPORTANT NOTICE FOR STUDENTS
            </Typography>
            <Typography variant="body2" sx={{ color: '#92400E', lineHeight: 1.4, fontSize: '0.73rem' }}>
              All job alerts, admit cards, and exam updates are fetched dynamically from official government servers. 
              Please download the <strong>Official PDF Notification</strong> and verify eligibility criteria, fees, and dates carefully before submitting your application.
            </Typography>
          </Box>
        </Box>

        {/* Sleek Centered & Proportionate Top Filter Bar */}
        <Paper 
          elevation={0} 
          id="search-filter-section"
          sx={{ 
            p: 1.5, 
            borderRadius: '30px', 
            border: '1px solid #ECECEC', 
            bgcolor: 'background.paper',
            boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
            mb: 5,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            alignItems: 'center',
            maxWidth: '960px',
            mx: 'auto'
          }}
        >
          <TextField
            fullWidth
            placeholder="Search by Keyword, Job Title, Board..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: '1.2rem' }} />
              )
            }}
            sx={{
              flex: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '30px',
                bgcolor: '#F9FAFB',
                pl: 2,
                '& fieldset': { borderColor: '#E5E7EB' },
                '&:hover fieldset': { borderColor: '#CBD5E1' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' }
              }
            }}
          />

          <FormControl sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }} size="small">
            <Select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              displayEmpty
              renderValue={(selected) => {
                if (selected === 'All States') {
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#9CA3AF', fontSize: '0.85rem' }}>
                      <LocationIcon sx={{ fontSize: 16 }} /> Filter by State
                    </Box>
                  );
                }
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, fontSize: '0.85rem', color: 'primary.main' }}>
                     <LocationIcon sx={{ fontSize: 16 }} /> {selected}
                  </Box>
                );
              }}
              sx={{ 
                borderRadius: '30px', 
                bgcolor: '#F9FAFB',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
              }}
            >
              <MenuItem value="All States">All States</MenuItem>
              {uniqueStates.filter(s => s !== 'All States').map(st => (
                <MenuItem key={st} value={st}>{st}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {(searchQuery || selectedState !== 'All States') && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setSearchQuery('');
                setSelectedState('All States');
              }}
              startIcon={<ResetIcon />}
              sx={{ 
                borderRadius: '30px', 
                fontWeight: 700, 
                textTransform: 'none', 
                py: 0.8, 
                px: 2.5, 
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Reset
            </Button>
          )}
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={44} /></Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
        ) : (
          <Box sx={{ width: '100%' }}>
            {/* Hot Links Grid */}
            <Box 
              sx={{ 
                mb: 4.5, 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: '16px', 
                border: '1px solid #ECECEC',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                maxWidth: '1200px',
                mx: 'auto'
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 850, 
                  letterSpacing: 1, 
                  textTransform: 'uppercase', 
                  color: '#EF4444', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 1,
                  mb: 2,
                  px: 0.5
                }}
              >
                <Box 
                  sx={{ 
                    width: 7, 
                    height: 7, 
                    borderRadius: '50%', 
                    bgcolor: '#EF4444',
                    animation: 'pulse 1.6s infinite ease-in-out',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(0.8)', opacity: 0.5 },
                      '50%': { transform: 'scale(1.4)', opacity: 1 },
                      '100%': { transform: 'scale(0.8)', opacity: 0.5 }
                    }
                  }} 
                />
                Hot Links / Active Updates
              </Typography>
              
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(4, 1fr)',
                  md: 'repeat(4, 1fr)'
                },
                gap: 2,
              }}>
                {hotLinks.map((item, idx) => {
                  const isFeatured = idx === 0;
                  const styles = getCardStyles(item, idx);
                  const isLive = !item.isStatic && item.targetAlert;
                  const isNew = isLive && (new Date() - new Date(item.targetAlert.createdAt) < 3 * 24 * 60 * 60 * 1000);
                  const accentColor = isFeatured ? '#4F46E5' : (idx % 2 !== 0 ? '#EF4444' : '#3B82F6');

                  return (
                    <Box
                      key={idx}
                      onClick={() => handleHotLinkClick(item)}
                      sx={{
                        gridColumn: isFeatured 
                          ? { xs: 'span 2', sm: 'span 2', md: 'span 2' } 
                          : 'span 1',
                        p: 2,
                        display: 'flex',
                        flexDirection: isFeatured ? 'row' : 'column',
                        justifyContent: isFeatured ? 'space-between' : 'center',
                        alignItems: 'center',
                        bgcolor: styles.bgColor,
                        background: styles.bgGradient || styles.bgColor,
                        border: isNew ? `1.5px solid ${accentColor}` : `1px solid ${styles.borderColor}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: isFeatured ? 'left' : 'center',
                        position: 'relative',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isNew 
                          ? `0 2px 8px ${isFeatured ? 'rgba(99, 102, 241, 0.15)' : (idx % 2 !== 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)')}`
                          : `0 4px 6px -1px ${styles.shadowColor || 'rgba(0,0,0,0.03)'}`,
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: `0 10px 15px -3px ${styles.shadowColor || 'rgba(0,0,0,0.06)'}`,
                          background: styles.hoverBgGradient || styles.hoverBg,
                          borderColor: accentColor,
                          '& .hot-link-title': {
                            color: accentColor
                          }
                        }
                      }}
                    >
                      {/* NEW Badge absolute in top-right */}
                      {isNew && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.3,
                            bgcolor: accentColor,
                            color: 'white',
                            px: 0.5,
                            py: 0.1,
                            borderRadius: '3px',
                            fontSize: '0.5rem',
                            fontWeight: 900,
                            boxShadow: `0 1px 4px ${isFeatured ? 'rgba(99, 102, 241, 0.3)' : (idx % 2 !== 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)')}`,
                            animation: 'pulse 1.5s infinite ease-in-out',
                            '@keyframes pulse': {
                              '0%': { transform: 'scale(1)', opacity: 0.9 },
                              '50%': { transform: 'scale(1.05)', opacity: 1 },
                              '100%': { transform: 'scale(1)', opacity: 0.9 }
                            }
                          }}
                        >
                          <Box sx={{ width: 3, height: 3, bgcolor: 'white', borderRadius: '50%' }} />
                          NEW 🔥
                        </Box>
                      )}

                      {isFeatured ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>🔥</Typography>
                            <Box>
                              <Typography
                                className="hot-link-title"
                                sx={{
                                  fontWeight: 900,
                                  fontSize: '0.88rem',
                                  color: styles.textColor,
                                  lineHeight: 1.3,
                                  mb: 0.3,
                                  transition: 'color 0.15s ease'
                                }}
                              >
                                {item.displayName}
                              </Typography>
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.62rem',
                                  color: '#4F46E5',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5
                                }}
                              >
                                {isLive ? `${item.targetAlert?.boardName || 'Active Notification'}` : "Featured Form"}
                              </Typography>
                              {isLive && (
                                <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, alignItems: 'center' }}>
                                  <Typography sx={{ color: '#9CA3AF', fontSize: '0.58rem' }}>
                                    {item.targetAlert?.createdAt ? new Date(item.targetAlert.createdAt).toLocaleDateString() : ''}
                                  </Typography>
                                  {item.targetAlert?.lastDate && item.targetAlert.lastDate !== 'N/A' && (
                                    <Typography sx={{ color: '#E11D48', fontSize: '0.58rem', fontWeight: 800 }}>
                                      Last Date: {item.targetAlert.lastDate}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                          
                          <Chip
                            label={item.postCount}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.68rem',
                              bgcolor: '#4F46E5',
                              color: 'white',
                              borderRadius: '6px',
                              px: 0.5
                            }}
                          />
                        </Box>
                      ) : isLive ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                          {/* Board Name */}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 850, 
                              color: styles.textColor, 
                              textTransform: 'uppercase', 
                              fontSize: '0.58rem',
                              letterSpacing: 0.3,
                              mb: 0.3,
                              pr: isNew ? 4 : 0,
                              transition: 'color 0.2s ease',
                              textAlign: 'left'
                            }}
                          >
                            {item.targetAlert?.boardName || 'Official Update'}
                          </Typography>

                          {/* Title */}
                          <Typography
                            className="hot-link-title"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              color: '#374151',
                              lineHeight: 1.25,
                              mb: 'auto',
                              transition: 'color 0.15s ease',
                              textAlign: 'left'
                            }}
                          >
                            {item.displayName}
                          </Typography>

                          {/* Date details */}
                          <Box sx={{ mt: 1.5 }}>
                            {item.targetAlert?.lastDate && item.targetAlert.lastDate !== 'N/A' && (
                              <Typography variant="caption" sx={{ color: '#E11D48', fontSize: '0.58rem', fontWeight: 800, display: 'block', mb: 0.2, textAlign: 'left' }}>
                                Last Date: {item.targetAlert.lastDate}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.58rem' }}>
                                {item.targetAlert?.createdAt ? new Date(item.targetAlert.createdAt).toLocaleDateString() : ''}
                              </Typography>
                              <Typography variant="caption" sx={{ color: styles.textColor, fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.2 }}>
                                Apply ↗
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                          <Typography
                            className="hot-link-title"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              color: styles.textColor,
                              lineHeight: 1.25,
                              mb: 0.3,
                              transition: 'color 0.15s ease'
                            }}
                          >
                            {item.displayName}
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.62rem',
                              color: '#6B7280',
                              textTransform: 'uppercase',
                              letterSpacing: 0.3
                            }}
                          >
                            {item.postCount || "Check Details"}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box
              id="alerts-lists-grid"
              sx={{
                display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 3.5,
              width: '100%',
              maxWidth: '1200px',
              mx: 'auto'
            }}
          >
            {/* Column 1: Latest Jobs */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: '16px',
                border: '1px solid #ECECEC',
                borderTop: '5px solid #16A34A',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
                height: { xs: '450px', sm: '520px', md: '580px' },
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
                }
              }}
            >
              <Box sx={{ p: 2, bgcolor: '#F0FDF4', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <WorkIcon sx={{ color: '#16A34A' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#14532D' }}>
                  Latest Jobs
                </Typography>
                <Chip 
                  label={categoryData.jobs.length} 
                  size="small" 
                  sx={{ ml: 'auto', fontWeight: 700, bgcolor: '#DCFCE7', color: '#16A34A', height: 20, fontSize: '0.7rem' }} 
                />
              </Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  flexGrow: 1,
                  overflowY: 'auto', 
                  '&::-webkit-scrollbar': { width: '5px' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '3px' },
                  '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }
                }}
              >
                {categoryData.jobs.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', p: 4, textAlign: 'center', fontStyle: 'italic' }}>
                    No matching jobs found
                  </Typography>
                ) : (
                  categoryData.jobs.map(alert => renderAlertListItem(alert, setSelectedAlert, '#16A34A'))
                )}
              </Box>
            </Paper>

            {/* Column 2: Admit Cards */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: '16px',
                border: '1px solid #ECECEC',
                borderTop: '5px solid #D97706',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
                height: { xs: '450px', sm: '520px', md: '580px' },
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
                }
              }}
            >
              <Box sx={{ p: 2, bgcolor: '#FFFBEB', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <NotificationIcon sx={{ color: '#D97706' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#78350F' }}>
                  Admit Cards
                </Typography>
                <Chip 
                  label={categoryData.admitCards.length} 
                  size="small" 
                  sx={{ ml: 'auto', fontWeight: 700, bgcolor: '#FEF3C7', color: '#B45309', height: 20, fontSize: '0.7rem' }} 
                />
              </Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  flexGrow: 1,
                  overflowY: 'auto', 
                  '&::-webkit-scrollbar': { width: '5px' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '3px' },
                  '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }
                }}
              >
                {categoryData.admitCards.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', p: 4, textAlign: 'center', fontStyle: 'italic' }}>
                    No matching admit cards found
                  </Typography>
                ) : (
                  categoryData.admitCards.map(alert => renderAlertListItem(alert, setSelectedAlert, '#D97706'))
                )}
              </Box>
            </Paper>

            {/* Column 3: Results */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: '16px',
                border: '1px solid #ECECEC',
                borderTop: '5px solid #7C3AED',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
                height: { xs: '450px', sm: '520px', md: '580px' },
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
                }
              }}
            >
              <Box sx={{ p: 2, bgcolor: '#F5F3FF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <ApplyIcon sx={{ color: '#7C3AED' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#4C1D95' }}>
                  Results
                </Typography>
                <Chip 
                  label={categoryData.results.length} 
                  size="small" 
                  sx={{ ml: 'auto', fontWeight: 700, bgcolor: '#EDE9FE', color: '#7C3AED', height: 20, fontSize: '0.7rem' }} 
                />
              </Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  flexGrow: 1,
                  overflowY: 'auto', 
                  '&::-webkit-scrollbar': { width: '5px' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '3px' },
                  '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }
                }}
              >
                {categoryData.results.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', p: 4, textAlign: 'center', fontStyle: 'italic' }}>
                    No matching results found
                  </Typography>
                ) : (
                  categoryData.results.map(alert => renderAlertListItem(alert, setSelectedAlert, '#7C3AED'))
                )}
              </Box>
            </Paper>

            {/* Column 4: Answer Keys */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: '16px',
                border: '1px solid #ECECEC',
                borderTop: '5px solid #EC4899',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
                height: { xs: '450px', sm: '520px', md: '580px' },
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
                }
              }}
            >
              <Box sx={{ p: 2, bgcolor: '#FDF2F8', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <ResetIcon sx={{ color: '#EC4899', transform: 'rotate(45deg)' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#9D174D' }}>
                  Answer Keys
                </Typography>
                <Chip 
                  label={categoryData.answerKeys.length} 
                  size="small" 
                  sx={{ ml: 'auto', fontWeight: 700, bgcolor: '#FCE7F3', color: '#EC4899', height: 20, fontSize: '0.7rem' }} 
                />
              </Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  flexGrow: 1,
                  overflowY: 'auto', 
                  '&::-webkit-scrollbar': { width: '5px' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '3px' },
                  '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }
                }}
              >
                {categoryData.answerKeys.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', p: 4, textAlign: 'center', fontStyle: 'italic' }}>
                    No matching answer keys found
                  </Typography>
                ) : (
                  categoryData.answerKeys.map(alert => renderAlertListItem(alert, setSelectedAlert, '#EC4899'))
                )}
              </Box>
            </Paper>

            {/* Column 5: Syllabus */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: '16px',
                border: '1px solid #ECECEC',
                borderTop: '5px solid #3B82F6',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
                height: { xs: '450px', sm: '520px', md: '580px' },
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
                }
              }}
            >
              <Box sx={{ p: 2, bgcolor: '#EFF6FF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <WebIcon sx={{ color: '#3B82F6' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E40AF' }}>
                  Syllabus
                </Typography>
                <Chip 
                  label={categoryData.syllabus.length} 
                  size="small" 
                  sx={{ ml: 'auto', fontWeight: 700, bgcolor: '#DBEAFE', color: '#3B82F6', height: 20, fontSize: '0.7rem' }} 
                />
              </Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  flexGrow: 1,
                  overflowY: 'auto', 
                  '&::-webkit-scrollbar': { width: '5px' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '3px' },
                  '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }
                }}
              >
                {categoryData.syllabus.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', p: 4, textAlign: 'center', fontStyle: 'italic' }}>
                    No matching syllabus found
                  </Typography>
                ) : (
                  categoryData.syllabus.map(alert => renderAlertListItem(alert, setSelectedAlert, '#3B82F6'))
                )}
              </Box>
            </Paper>

            {/* Column 6: Admissions */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: '16px',
                border: '1px solid #ECECEC',
                borderTop: '5px solid #0D9488',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
                height: { xs: '450px', sm: '520px', md: '580px' },
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
                }
              }}
            >
              <Box sx={{ p: 2, bgcolor: '#F0FDFA', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <CalendarIcon sx={{ color: '#0D9488' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#115E59' }}>
                  Admissions
                </Typography>
                <Chip 
                  label={categoryData.admissions.length} 
                  size="small" 
                  sx={{ ml: 'auto', fontWeight: 700, bgcolor: '#CCFBF1', color: '#0D9488', height: 20, fontSize: '0.7rem' }} 
                />
              </Box>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  flexGrow: 1,
                  overflowY: 'auto', 
                  '&::-webkit-scrollbar': { width: '5px' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '3px' },
                  '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }
                }}
              >
                {categoryData.admissions.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', p: 4, textAlign: 'center', fontStyle: 'italic' }}>
                    No matching admissions found
                  </Typography>
                ) : (
                  categoryData.admissions.map(alert => renderAlertListItem(alert, setSelectedAlert, '#0D9488'))
                )}
              </Box>
            </Paper>
          </Box>
          </Box>
        )}
      </Box>

      {/* Center Details Dialog Popup Modal */}
      {selectedAlert && (
        <Dialog
          open={Boolean(selectedAlert)}
          onClose={() => setSelectedAlert(null)}
          maxWidth="md"
          fullWidth
          scroll="paper"
          PaperProps={{
            sx: {
              borderRadius: { xs: '16px', sm: '24px' },
              p: { xs: 0, sm: 1.5 },
              bgcolor: '#FFFFFF',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              margin: { xs: 1.5, sm: 4 }
            }
          }}
        >
          <DialogTitle 
            sx={{ 
              m: 0, 
              p: { xs: 2, sm: 2.5 }, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid #F1F5F9'
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pr: 4 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={selectedAlert.boardName || 'Official Board'} 
                  size="small" 
                  sx={{ fontWeight: 800, fontSize: '0.68rem', bgcolor: '#EEF2FF', color: '#4F46E5', borderRadius: '8px' }} 
                />
                <Chip 
                  label={selectedAlert.state || 'All India'} 
                  size="small" 
                  sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: '#F3F4F6', color: '#374151', borderRadius: '8px' }} 
                />
              </Box>
              <Typography sx={{ fontWeight: 800, color: '#111827', mt: 1, lineHeight: 1.3, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                {selectedAlert.title}
              </Typography>
            </Box>
            <IconButton
              aria-label="close"
              onClick={() => setSelectedAlert(null)}
              sx={{
                color: '#9CA3AF',
                '&:hover': { color: '#111827', bgcolor: '#F3F4F6' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, bgcolor: '#F8FAFC' }}>
            {detailsLoading ? (
              <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <CircularProgress size={40} sx={{ color: '#4F46E5' }} />
                <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600 }}>
                  Fetching official notification details factsheet...
                </Typography>
              </Box>
            ) : errorLoadingDetails ? (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{errorLoadingDetails}</Alert>
            ) : (
              renderBlogContent(selectedAlert)
            )}
          </DialogContent>

          <DialogActions 
            sx={{ 
              p: { xs: 1.5, sm: 2.5 }, 
              borderTop: '1px solid #F1F5F9',
              display: { xs: 'grid', sm: 'flex' },
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'none' },
              gap: 1.2,
              alignItems: 'center',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {(() => {
              const actionLinks = getDynamicActions(selectedAlert);
              const pdfLink = actionLinks.find(l => l.label === 'Download Notification PDF')?.url;
              const applyLink = actionLinks.find(l => l.label === 'Apply Online Now')?.url;
              const officialWeb = actionLinks.find(l => l.label === 'Official Board Website')?.url;

              const activeButtonsCount = [pdfLink, applyLink, officialWeb].filter(Boolean).length + 1; // +1 for Close
              const closeSpansTwo = activeButtonsCount % 2 !== 0;

              return (
                <>
                  {pdfLink && (
                    <Button
                      variant="outlined"
                      onClick={(e) => {
                        e.preventDefault();
                        setPendingRedirectUrl(pdfLink);
                        setRedirectModalOpen(true);
                      }}
                      startIcon={<PdfIcon />}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2, 
                        fontWeight: 700, 
                        fontSize: '0.8rem',
                        color: '#DC2626',
                        borderColor: '#FCA5A5',
                        px: 2.5,
                        py: { xs: 1, sm: 1 },
                        width: { xs: '100%', sm: 'auto' },
                        '&:hover': { bgcolor: '#FEF2F2', borderColor: '#DC2626' }
                      }}
                    >
                      Official PDF
                    </Button>
                  )}

                  {applyLink && (
                    <Button
                      variant="contained"
                      onClick={(e) => {
                        e.preventDefault();
                        setPendingRedirectUrl(applyLink);
                        setRedirectModalOpen(true);
                      }}
                      startIcon={<ApplyIcon />}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2, 
                        fontWeight: 700, 
                        fontSize: '0.8rem',
                        bgcolor: '#16A34A',
                        px: 2.5,
                        py: { xs: 1, sm: 1 },
                        width: { xs: '100%', sm: 'auto' },
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#15803D', boxShadow: 'none' }
                      }}
                    >
                      Apply Online
                    </Button>
                  )}

                  {officialWeb && (
                    <Button
                      variant="outlined"
                      onClick={(e) => {
                        e.preventDefault();
                        setPendingRedirectUrl(officialWeb);
                        setRedirectModalOpen(true);
                      }}
                      startIcon={<WebIcon />}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2, 
                        fontWeight: 700, 
                        fontSize: '0.8rem',
                        color: '#2563EB',
                        borderColor: '#93C5FD',
                        px: 2.5,
                        py: { xs: 1, sm: 1 },
                        width: { xs: '100%', sm: 'auto' },
                        '&:hover': { bgcolor: '#EFF6FF', borderColor: '#2563EB' }
                      }}
                    >
                      Official Website
                    </Button>
                  )}

                  <Button 
                    onClick={() => setSelectedAlert(null)} 
                    variant="outlined" 
                    color="inherit"
                    sx={{ 
                      borderRadius: 2, 
                      textTransform: 'none', 
                      fontWeight: 600,
                      py: { xs: 1, sm: 1 },
                      width: { xs: '100%', sm: 'auto' },
                      ml: { sm: 'auto' },
                      gridColumn: closeSpansTwo ? { xs: 'span 2', sm: 'auto' } : 'auto'
                    }}
                  >
                    Close
                  </Button>
                </>
              );
            })()}
          </DialogActions>
        </Dialog>
      )}

      {/* Interstitial Redirect Modal for Telegram */}
      <TelegramRedirectModal 
        open={redirectModalOpen} 
        onClose={() => setRedirectModalOpen(false)} 
        targetUrl={pendingRedirectUrl} 
      />
    </Layout>
  );
}
