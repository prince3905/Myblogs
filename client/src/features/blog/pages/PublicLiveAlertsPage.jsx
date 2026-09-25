import { useEffect, useState, Fragment, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableRow, Paper, Chip, Box, Alert, CircularProgress, LinearProgress,
  IconButton, TextField, Select, MenuItem, FormControl, InputLabel, Grid, Collapse,
  Pagination, Link as MuiLink, Dialog, DialogContent, DialogTitle,
  Divider
} from '@mui/material';
import {
  NotificationsActive as NotificationIcon,
  KeyboardArrowDown as ExpandMoreIcon, KeyboardArrowUp as ExpandLessIcon,
  PictureAsPdf as PdfIcon, Language as WebIcon,
  AssignmentTurnedIn as ApplyIcon, CalendarToday as CalendarIcon,
  LocationOn as LocationIcon, Work as WorkIcon,
  FilterList as FilterIcon, RestartAlt as ResetIcon,
  Close as CloseIcon, Search as SearchIcon,
  WhatsApp as WhatsAppIcon, Send as TelegramIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import AdSlot from '../../../components/AdSlot';
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

  const isResult = /result|score card|merit list/i.test(alert.category || alertTitle);
  const isAdmit = /admit card|hall ticket|call letter|exam city/i.test(alert.category || alertTitle);
  const isKey = /answer key|objection/i.test(alert.category || alertTitle);
  const isSyllabus = /syllabus|pattern|scheme/i.test(alert.category || alertTitle);

  let pdfLabel = 'Download Notification PDF';
  if (isResult) pdfLabel = 'Download Result / Cutoff PDF';
  else if (isAdmit) pdfLabel = 'Download Exam Notice / City PDF';
  else if (isSyllabus) pdfLabel = 'Download Syllabus PDF';

  let applyLabel = 'Apply Online Now';
  if (isResult) applyLabel = 'Check Result / Score Card';
  else if (isAdmit) applyLabel = 'Download Admit Card / City Slip';
  else if (isKey) applyLabel = 'Check Answer Key / Objections';
  else if (isSyllabus) applyLabel = 'Check Syllabus & Exam Pattern';

  // 1. PDF Link
  const pdfUrl = sanitizeClientUrl(alert.officialPdfUrl || findParsedLink(['result pdf', 'cutoff', 'notification', 'pdf', 'advertisement', 'notice']), alertTitle, alertBoard);
  actions.push({
    label: pdfLabel,
    url: pdfUrl,
    icon: <PdfIcon />,
    color: '#DC2626',
    hoverBg: '#FEF2F2',
    borderColor: '#FCA5A5'
  });

  // 2. Main Direct Action URL (Apply, Result, Admit Card, Answer Key)
  const applyUrl = sanitizeClientUrl(
    alert.officialApplyUrl || findParsedLink([
      'result', 'score card', 'merit list', 'admit card', 'hall ticket', 'exam city', 
      'apply online', 'online form', 'apply', 'answer key', 'key'
    ]), 
    alertTitle, 
    alertBoard
  );
  actions.push({
    label: applyLabel,
    url: applyUrl,
    icon: <ApplyIcon />,
    color: isResult ? '#059669' : (isAdmit ? '#4F46E5' : '#16A34A'),
    hoverBg: isResult ? '#ECFDF5' : (isAdmit ? '#EEF2FF' : '#ECFDF5'),
    borderColor: isResult ? '#A7F3D0' : (isAdmit ? '#C7D2FE' : '#A7F3D0')
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

function renderBlogContent(alert, onActionClick) {
  const parsed = parseDetails(alert.detailsText, alert);

  return (
    <Box sx={{ color: '#E2E8F0', fontSize: '0.9rem', lineHeight: 1.6 }}>
      {parsed.shortInfo && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(56, 189, 248, 0.12)', borderRadius: 2, borderLeft: '4px solid #38BDF8', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#38BDF8', mb: 0.5, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: 0.8 }}>
            Short Information
          </Typography>
          <Typography variant="body2" sx={{ color: '#F1F5F9', lineHeight: 1.6, fontSize: '0.88rem' }}>
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
          let bgColor = 'rgba(255, 255, 255, 0.05)';
          let textColor = '#F1F5F9';
          let borderLeftColor = '#64748B';

          if (isWarning) {
            icon = '⚠️';
            bgColor = 'rgba(245, 158, 11, 0.15)';
            textColor = '#FBBF24';
            borderLeftColor = '#F59E0B';
          } else if (isLink) {
            icon = '🔗';
            bgColor = 'rgba(56, 189, 248, 0.15)';
            textColor = '#38BDF8';
            borderLeftColor = '#38BDF8';
          } else if (isDateFee) {
            icon = '📅';
            bgColor = 'rgba(16, 185, 129, 0.15)';
            textColor = '#34D399';
            borderLeftColor = '#10B981';
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
                  fontWeight: 850, 
                  color: textColor, 
                  fontSize: '0.88rem',
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
                    p: 1.4, 
                    bgcolor: 'rgba(30, 41, 59, 0.65)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: '#94A3B8', fontSize: '0.78rem' }}>{it.key}</Typography>
                  <Typography sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.82rem', textAlign: 'right' }}>
                    {renderTextWithLinks(it.value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          );
        }

        if (sect.type === 'table') {
          return (
            <TableContainer 
              key={idx} 
              component={Paper} 
              variant="outlined" 
              sx={{ 
                mb: 2.5, 
                borderRadius: 2, 
                overflowX: 'auto', 
                bgcolor: 'rgba(15, 23, 42, 0.85)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <Table size="small">
                <TableBody>
                  {sect.rows.map((row, rowIdx) => {
                    const isHeader = rowIdx === 0 && row.length > 1;
                    return (
                      <TableRow 
                        key={rowIdx} 
                        sx={{ 
                          bgcolor: isHeader ? 'rgba(30, 41, 59, 0.95)' : (rowIdx % 2 === 0 ? 'rgba(15, 23, 42, 0.6)' : 'rgba(30, 41, 59, 0.35)'),
                          '& td': { py: 1.2, px: { xs: 1, sm: 1.5 } } 
                        }}
                      >
                        {row.map((col, colIdx) => (
                          <TableCell 
                            key={colIdx} 
                            sx={{ 
                              fontWeight: isHeader ? 800 : 500,
                              fontSize: '0.8rem',
                              color: isHeader ? '#38BDF8' : '#E2E8F0',
                              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
                  <Typography key={pIdx} variant="body2" sx={{ color: '#CBD5E1', mb: 1, fontSize: '0.88rem', lineHeight: 1.65 }}>
                    {renderTextWithLinks(para)}
                  </Typography>
                );
              })}
            </Box>
          );
        }

        return null;
      })}

      {/* Digital Home Student Tools & Fast Community Banner */}
      <Box sx={{ mt: 3, p: 2.5, bgcolor: 'rgba(15, 23, 42, 0.85)', borderRadius: 3, border: '1.5px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1.2, display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.9rem' }}>
          🛠️ Free Student Tools for Application Form:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <MuiLink
            href="/tools"
            target="_blank"
            sx={{
              fontWeight: 750,
              color: '#818CF8',
              bgcolor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              px: 1.5,
              py: 0.6,
              borderRadius: '6px',
              fontSize: '0.78rem',
              textDecoration: 'none',
              '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.25)', textDecoration: 'none' }
            }}
          >
            📸 Photo & Signature Resizer
          </MuiLink>
          <MuiLink
            href="/tools"
            target="_blank"
            sx={{
              fontWeight: 750,
              color: '#34D399',
              bgcolor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              px: 1.5,
              py: 0.6,
              borderRadius: '6px',
              fontSize: '0.78rem',
              textDecoration: 'none',
              '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.25)', textDecoration: 'none' }
            }}
          >
            📄 PDF & Image Compressor
          </MuiLink>
          <MuiLink
            href="/tools"
            target="_blank"
            sx={{
              fontWeight: 750,
              color: '#FBBF24',
              bgcolor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              px: 1.5,
              py: 0.6,
              borderRadius: '6px',
              fontSize: '0.78rem',
              textDecoration: 'none',
              '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.25)', textDecoration: 'none' }
            }}
          >
            🎂 Age Calculator & Eligibility
          </MuiLink>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, pt: 1.5, borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.75rem' }}>
            ⚡ Real-time updates delivered straight to your phone.
          </Typography>
          <MuiLink
            href="https://t.me/digitalhomeblog"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontWeight: 800,
              color: '#ffffff',
              bgcolor: '#0284C7',
              px: 1.8,
              py: 0.5,
              borderRadius: '6px',
              fontSize: '0.78rem',
              textDecoration: 'none',
              '&:hover': { bgcolor: '#0369A1', textDecoration: 'none' }
            }}
          >
            Join Telegram Alert ➔
          </MuiLink>
        </Box>
      </Box>

      {/* 🏛️ Direct Official Action Buttons Section inside Scrollable Content */}
      {(() => {
        const isOffline = isOfflineAlert(alert);
        const postalAddress = extractPostalAddress(alert);
        const actionLinks = getDynamicActions(alert);
        const pdfLink = actionLinks.find(l => l.label.includes('PDF'))?.url || alert.officialPdfUrl;
        const applyLink = actionLinks.find(l => l.label.includes('Apply') || l.label.includes('Check') || l.label.includes('Download'))?.url || alert.officialApplyUrl;
        const officialWeb = actionLinks.find(l => l.label.includes('Website'))?.url || alert.officialUrl;
        const applyLabel = actionLinks.find(l => l.label.includes('Apply') || l.label.includes('Check') || l.label.includes('Download'))?.label || 'Apply Online Now';
        const pdfLabel = actionLinks.find(l => l.label.includes('PDF'))?.label || 'Download Official Notification (PDF)';

        const handleAction = (url) => {
          if (!url) return;
          if (onActionClick) {
            onActionClick(url);
          } else {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        };

        const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/india/sarkari-jobs/${alert._id || ''}` : '';
        const shareText = `🏛️ *${alert.title || 'Sarkari Job Notification'}*\n🏢 बोर्ड: ${alert.boardName || 'Government Board'}\n📍 राज्य: ${alert.state || 'All India'}\n📅 अंतिम तिथि: ${alert.lastDate || 'जल्द देखें'}\n\n👉 100% आधिकारिक विवरण व आवेदन करें:\n${shareUrl}`;

        return (
          <Box sx={{
            mt: 3,
            p: { xs: 2, sm: 2.5 },
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            borderRadius: 3,
            border: '2px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #10B981 0%, #38BDF8 50%, #6366F1 100%)'
            }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 850, color: '#38BDF8', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
              ⚡ आधिकारिक आवेदन एवं महत्वपूर्ण लिंक्स (Important Official Links)
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2 }}>
              100% सत्यापित सरकारी पोर्टल लिंक्स • कोई बिचौलिया नहीं, सीधे ऑफिशियल वेबसाइट से आवेदन करें
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {isOffline ? (
                /* 📬 Offline Application Form & Dispatch Box */
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={(e) => { e.preventDefault(); handleAction(pdfLink || applyLink); }}
                    startIcon={<PdfIcon sx={{ fontSize: '1.3rem !important', color: '#FFFFFF !important' }} />}
                    sx={{
                      bgcolor: '#D97706',
                      color: '#FFFFFF',
                      fontWeight: 850,
                      fontSize: { xs: '0.95rem', sm: '1.02rem' },
                      py: 1.4,
                      px: 2.5,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      boxShadow: '0 4px 18px rgba(217, 119, 6, 0.45)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': { bgcolor: '#B45309', transform: 'translateY(-1px)' }
                    }}
                  >
                    📥 डाउनलोड ऑफलाइन आवेदन फॉर्म (Official PDF) ➔
                  </Button>

                  <Box sx={{
                    p: 2,
                    bgcolor: 'rgba(217, 119, 6, 0.1)',
                    border: '1.5px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.2
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography sx={{ fontWeight: 850, color: '#FBBF24', fontSize: '0.88rem' }}>
                        📮 फॉर्म भेजने का डाक पता (Postal Address):
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          if (navigator?.clipboard) {
                            navigator.clipboard.writeText(postalAddress);
                            alert('डाक पता कॉपी हो गया!');
                          }
                        }}
                        startIcon={<ContentCopyIcon sx={{ fontSize: '13px !important' }} />}
                        sx={{ color: '#FDE68A', borderColor: 'rgba(253, 230, 138, 0.4)', textTransform: 'none', fontSize: '0.72rem', fontWeight: 800, py: 0.3, px: 1.2, borderRadius: '6px' }}
                      >
                        📋 पता कॉपी करें
                      </Button>
                    </Box>

                    <Typography sx={{ color: '#FFFFFF', fontWeight: 750, fontSize: '0.84rem', whiteSpace: 'pre-line', bgcolor: 'rgba(0,0,0,0.35)', p: 1.5, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.08)', lineHeight: 1.5 }}>
                      {postalAddress}
                    </Typography>

                    <Typography sx={{ color: '#E2E8F0', fontSize: '0.75rem', lineHeight: 1.4 }}>
                      ✉️ <strong>लिफाफे पर लिखें:</strong> APPLICATION FOR THE POST OF &ldquo;{alert.title.split('Recruitment')[0].trim()}&rdquo; — CATEGORY: [आपकी श्रेणी]
                    </Typography>

                    <Box sx={{ pt: 1, borderTop: '1px dashed rgba(255,255,255,0.15)', fontSize: '0.74rem', color: '#CBD5E1', lineHeight: 1.5 }}>
                      📎 <strong>संलग्न दस्तावेज (Self-Attested Photocopies):</strong><br />
                      • 10वीं की अंकतालिका (जन्मतिथि प्रमाण हेतु)<br />
                      • आवश्यक शैक्षणिक व तकनीकी योग्यता प्रमाण पत्र<br />
                      • जाति प्रमाण पत्र एवं मूल निवास प्रमाण पत्र (यदि लागू हो)<br />
                      • आधार कार्ड या पहचान पत्र की स्व-हस्ताक्षरित प्रति<br />
                      • 2 पासपोर्ट साइज नवीनतम फोटो (पीछे नाम लिखकर)<br />
                      • स्वयं का पता लिखा लिफाफा (उचित डाक टिकट सहित)
                    </Box>

                    <Typography sx={{ color: '#FCA5A5', fontWeight: 750, fontSize: '0.72rem' }}>
                      ⚠️ <strong>महत्वपूर्ण निर्देश:</strong> आवेदन केवल स्पीड पोस्ट (Speed Post) या रजिस्टर्ड डाक से भेजें ताकि अंतिम तिथि से पहले विभाग को प्राप्त हो सके।
                    </Typography>
                  </Box>
                </Box>
              ) : (
                /* Standard Online Application Button */
                applyLink && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={(e) => { e.preventDefault(); handleAction(applyLink); }}
                    startIcon={<ApplyIcon sx={{ fontSize: '1.3rem !important' }} />}
                    sx={{
                      bgcolor: '#16A34A',
                      color: '#FFFFFF',
                      fontWeight: 850,
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      py: 1.4,
                      px: 2.5,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      boxShadow: '0 4px 18px rgba(22, 163, 74, 0.45)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': { bgcolor: '#15803D', transform: 'translateY(-1px)', boxShadow: '0 6px 22px rgba(22, 163, 74, 0.6)' }
                    }}
                  >
                    {applyLabel} ➔
                  </Button>
                )
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: pdfLink && officialWeb ? '1fr 1fr' : '1fr' }, gap: 1.2 }}>
                {pdfLink && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={(e) => { e.preventDefault(); handleAction(pdfLink); }}
                    startIcon={<PdfIcon />}
                    sx={{
                      color: '#F87171',
                      borderColor: 'rgba(239, 68, 68, 0.5)',
                      bgcolor: 'rgba(239, 68, 68, 0.12)',
                      fontWeight: 750,
                      fontSize: '0.85rem',
                      py: 1.1,
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.22)', borderColor: '#EF4444' }
                    }}
                  >
                    {pdfLabel}
                  </Button>
                )}

                {officialWeb && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={(e) => { e.preventDefault(); handleAction(officialWeb); }}
                    startIcon={<WebIcon />}
                    sx={{
                      color: '#38BDF8',
                      borderColor: 'rgba(56, 189, 248, 0.5)',
                      bgcolor: 'rgba(56, 189, 248, 0.12)',
                      fontWeight: 750,
                      fontSize: '0.85rem',
                      py: 1.1,
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.22)', borderColor: '#38BDF8' }
                    }}
                  >
                    Official Board Website 🌐
                  </Button>
                )}
              </Box>

              {/* Direct WhatsApp & Telegram Share inside Modal */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 0.5 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                  sx={{
                    color: '#86EFAC',
                    borderColor: 'rgba(37, 211, 102, 0.4)',
                    bgcolor: 'rgba(37, 211, 102, 0.08)',
                    fontWeight: 750,
                    fontSize: '0.8rem',
                    py: 0.9,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.18)', borderColor: '#25D366' }
                  }}
                >
                  WhatsApp
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<TelegramIcon sx={{ color: '#38BDF8' }} />}
                  sx={{
                    color: '#BAE6FD',
                    borderColor: 'rgba(56, 189, 248, 0.4)',
                    bgcolor: 'rgba(56, 189, 248, 0.08)',
                    fontWeight: 750,
                    fontSize: '0.8rem',
                    py: 0.9,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.18)', borderColor: '#38BDF8' }
                  }}
                >
                  Telegram
                </Button>
              </Box>
            </Box>
          </Box>
        );
      })()}
    </Box>
  );
}

function renderAlertListItem(alert, setSelectedAlert, themeColor) {
  const isNew = new Date() - new Date(alert.createdAt) < 3 * 24 * 60 * 60 * 1000;
  const hasValidDate = alert.lastDate && alert.lastDate !== 'N/A' && alert.lastDate !== 'Check Detail Page';
  const isOffline = isOfflineAlert(alert);

  return (
    <Box
      key={alert._id}
      onClick={() => setSelectedAlert(alert)}
      sx={{
        p: 2,
        cursor: 'pointer',
        borderBottom: '1px solid #F1F5F9',
        borderLeft: alert.isHighlight ? '3.5px solid #F59E0B' : '3.5px solid transparent',
        bgcolor: alert.isHighlight ? 'rgba(254, 243, 199, 0.25)' : 'transparent',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.8,
        '&:hover': {
          bgcolor: alert.isHighlight ? 'rgba(254, 243, 199, 0.45)' : '#F8FAFC',
          borderLeftColor: alert.isHighlight ? '#D97706' : themeColor,
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
          {alert.isHighlight && (
            <Chip 
              label="⚡ TOP" 
              size="small" 
              sx={{ 
                height: 16, 
                fontSize: '0.55rem', 
                fontWeight: 900, 
                bgcolor: '#F59E0B', 
                color: 'white',
                borderRadius: '4px',
                boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)',
                '& .MuiChip-label': { px: 0.6 }
              }} 
            />
          )}
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
          {isOffline && (
            <Chip 
              label="📬 OFFLINE" 
              size="small" 
              sx={{ 
                height: 16, 
                fontSize: '0.52rem', 
                fontWeight: 850, 
                bgcolor: '#FEF3C7', 
                color: '#B45309',
                border: '1px solid #FCD34D',
                borderRadius: '4px',
                '& .MuiChip-label': { px: 0.5 }
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
          📅 Post: {new Date(alert.parsedPostDate || alert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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

const QUICK_EXAM_FILTERS = [
  { label: '🌟 All Updates', query: '', color: '#4F46E5', icon: '⚡' },
  { label: '📬 ऑफलाइन फॉर्म (Offline)', query: 'offline', color: '#B45309', icon: '📬' },
  { label: '🚆 Railway / RRB', query: 'rrb', color: '#0284C7', icon: '🚆' },
  { label: '📋 SSC Exams', query: 'ssc', color: '#D97706', icon: '📋' },
  { label: '🏦 Bank / IBPS / SBI', query: 'bank', color: '#059669', icon: '🏦' },
  { label: '👮 Police & Defence / Army', query: 'police', color: '#DC2626', icon: '👮' },
  { label: '🏢 BPSC / State PSC', query: 'bpsc', color: '#7C3AED', icon: '🏢' },
  { label: '📑 UPSSSC / UKSSSC', query: 'upsssc', color: '#EA580C', icon: '📑' },
  { label: '🎓 10th & 12th Board Results', query: 'board', color: '#E11D48', icon: '🎓' },
  { label: '🔑 Answer Keys', query: 'answer key', color: '#0D9488', icon: '🔑' },
  { label: '📄 Syllabus & Pattern', query: 'syllabus', color: '#4338CA', icon: '📄' },
  { label: '🎓 Admissions & CUET', query: 'admission', color: '#9333EA', icon: '🎓' },
  { label: '🛠️ Free Student Tools', query: '__tools__', color: '#2563EB', icon: '🛠️' }
];

const CARD_PALETTES = [
  {
    borderColor: '#6366F1',
    textColor: '#312E81',
    bgColor: '#EEF2FF',
    bgGradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
    hoverBg: '#E0E7FF',
    hoverBgGradient: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
    shadowColor: 'rgba(99, 102, 241, 0.12)',
    accentColor: '#4F46E5'
  },
  {
    borderColor: '#10B981',
    textColor: '#065F46',
    bgColor: '#ECFDF5',
    bgGradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
    hoverBg: '#D1FAE5',
    hoverBgGradient: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
    shadowColor: 'rgba(16, 185, 129, 0.12)',
    accentColor: '#059669'
  },
  {
    borderColor: '#F43F5E',
    textColor: '#9F1239',
    bgColor: '#FFF1F2',
    bgGradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
    hoverBg: '#FFE4E6',
    hoverBgGradient: 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)',
    shadowColor: 'rgba(244, 63, 94, 0.12)',
    accentColor: '#E11D48'
  },
  {
    borderColor: '#0284C7',
    textColor: '#075985',
    bgColor: '#F0F9FF',
    bgGradient: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
    hoverBg: '#E0F2FE',
    hoverBgGradient: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
    shadowColor: 'rgba(2, 132, 199, 0.12)',
    accentColor: '#0284C7'
  },
  {
    borderColor: '#D97706',
    textColor: '#92400E',
    bgColor: '#FFFBEB',
    bgGradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    hoverBg: '#FEF3C7',
    hoverBgGradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    shadowColor: 'rgba(217, 119, 6, 0.12)',
    accentColor: '#D97706'
  },
  {
    borderColor: '#8B5CF6',
    textColor: '#5B21B6',
    bgColor: '#F5F3FF',
    bgGradient: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
    hoverBg: '#EDE9FE',
    hoverBgGradient: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
    shadowColor: 'rgba(139, 92, 246, 0.12)',
    accentColor: '#7C3AED'
  },
  {
    borderColor: '#0D9488',
    textColor: '#115E59',
    bgColor: '#F0FDFA',
    bgGradient: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)',
    hoverBg: '#CCFBF1',
    hoverBgGradient: 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)',
    shadowColor: 'rgba(13, 148, 136, 0.12)',
    accentColor: '#0D9488'
  },
  {
    borderColor: '#E11D48',
    textColor: '#881337',
    bgColor: '#FFF1F2',
    bgGradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
    hoverBg: '#FFE4E6',
    hoverBgGradient: 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)',
    shadowColor: 'rgba(225, 29, 72, 0.12)',
    accentColor: '#E11D48'
  }
];

function getCardStyles(item, idx = 0) {
  const alert = item?.targetAlert || item;
  const category = (alert?.category || '').toLowerCase();
  const title = (alert?.title || '').toLowerCase();

  if (category.includes('result') || title.includes('result') || title.includes('score card')) {
    return CARD_PALETTES[4] || CARD_PALETTES[0]; // Purple / Results
  }
  if (category.includes('admit') || title.includes('admit') || title.includes('hall ticket')) {
    return CARD_PALETTES[3] || CARD_PALETTES[0]; // Amber / Admit Card
  }
  if (category.includes('answer') || title.includes('answer key')) {
    return CARD_PALETTES[6] || CARD_PALETTES[0]; // Pink / Answer Key
  }
  if (category.includes('syllabus') || title.includes('syllabus')) {
    return CARD_PALETTES[0] || CARD_PALETTES[0]; // Indigo / Syllabus
  }
  if (category.includes('admission') || title.includes('admission')) {
    return CARD_PALETTES[5] || CARD_PALETTES[0]; // Teal / Admissions
  }

  return CARD_PALETTES[idx % CARD_PALETTES.length];
}

const STATE_ALIASES = {
  'up': ['uttar pradesh', 'up', 'upsssc', 'uppsc', 'uppbpb', 'lucknow', 'allahabad'],
  'uttar pradesh': ['uttar pradesh', 'up', 'upsssc', 'uppsc', 'uppbpb', 'lucknow', 'allahabad'],
  'bihar': ['bihar', 'bpsc', 'csbc', 'bpssc', 'bssc', 'bcece', 'patna'],
  'mp': ['madhya pradesh', 'mp', 'mppsc', 'mpesb', 'mp peb', 'mpvyapam', 'bhopal', 'indore'],
  'madhya pradesh': ['madhya pradesh', 'mp', 'mppsc', 'mpesb', 'mp peb', 'mpvyapam', 'bhopal', 'indore'],
  'delhi': ['delhi', 'dsssb', 'dhc', 'delhi high court'],
  'rajasthan': ['rajasthan', 'rpsc', 'rsmssb', 'rssb', 'jaipur'],
  'haryana': ['haryana', 'hssc', 'hpsc'],
  'punjab': ['punjab', 'ppsc', 'psssb'],
  'jharkhand': ['jharkhand', 'jpsc', 'jssc', 'ranchi'],
  'uttarakhand': ['uttarakhand', 'ukpsc', 'uksssc', 'dehradun'],
  'chhattisgarh': ['chhattisgarh', 'cgpsc', 'cgvyapam', 'raipur'],
  'gujarat': ['gujarat', 'gpsc', 'gsssb'],
  'maharashtra': ['maharashtra', 'mpsc', 'mumbai', 'pune'],
  'west bengal': ['west bengal', 'wbpsc', 'kolkata'],
  'odisha': ['odisha', 'opsc', 'osssc'],
  'andhra pradesh': ['andhra pradesh', 'appsc'],
  'telangana': ['telangana', 'tspsc', 'hyderabad'],
  'tamil nadu': ['tamil nadu', 'tnpsc', 'chennai'],
  'himachal pradesh': ['himachal pradesh', 'hp', 'hppsc', 'hpsssb', 'shimla'],
  'hp': ['himachal pradesh', 'hp', 'hppsc', 'hpsssb', 'shimla']
};

function isAlertMatchingState(alert, stateQuery) {
  if (!alert || !stateQuery || stateQuery === 'all' || stateQuery === 'All States') return true;
  const q = stateQuery.toLowerCase().trim();
  const aliases = STATE_ALIASES[q] || [q];

  const alertState = (alert.state || '').toLowerCase();
  const alertTitle = (alert.title || '').toLowerCase();
  const alertBoard = (alert.boardName || '').toLowerCase();

  return aliases.some(alias => 
    alertState.includes(alias) || 
    alertTitle.includes(alias) || 
    alertBoard.includes(alias)
  );
}

export function isOfflineAlert(alert) {
  if (!alert) return false;
  if (alert.isOffline) return true;
  const title = (alert.title || '').toLowerCase();
  const cat = (alert.category || '').toLowerCase();
  const details = (alert.detailsText || '').toLowerCase();

  // If title explicitly states online form or apply online, it is NOT offline
  if (title.includes('online form') || title.includes('apply online')) return false;

  return Boolean(
    title.includes('offline form') ||
    title.includes('offline vacancy') ||
    title.includes('offline recruitment') ||
    title.includes('apply offline') ||
    title.includes('डाक द्वारा') ||
    cat.includes('offline') ||
    details.includes('apply offline') ||
    details.includes('offline application form') ||
    details.includes('send application form to') ||
    (details.includes('by speed post') && !details.includes('online application'))
  );
}

export function extractPostalAddress(alert) {
  if (!alert) return '';
  if (alert.offlineAddress && alert.offlineAddress.trim()) return alert.offlineAddress.trim();

  // Try extracting address from detailsText
  if (alert.detailsText) {
    const addressMatch = alert.detailsText.match(/(?:send\s+application\s+(?:to|at)|address\s*:?|डाक\s*का\s*पता\s*:?)\s*([^\n\r]+(?:[\n\r]+[^\n\r]+){1,3})/i);
    if (addressMatch && addressMatch[1] && addressMatch[1].length > 15) {
      return addressMatch[1].trim();
    }
  }

  const board = alert.boardName || 'Official Recruitment Authority';
  const state = alert.state && alert.state !== 'Central/All India' ? alert.state : 'Headquarters';
  return `To,\nThe Office of ${board},\n${state}, India\n(Refer Official Notification for Pin Code & Room No.)`;
}

export default function PublicLiveAlertsPage() {
  const navigate = useNavigate();
  const { id: routeAlertId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const alertIdParam = routeAlertId || searchParams.get('alert');
  const openedAlertIdRef = useRef(null);
  const alertCacheRef = useRef(new Map());

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const urlSearchParam = searchParams.get('search') || searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(urlSearchParam);
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedAlert, setSelectedAlertState] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [errorLoadingDetails, setErrorLoadingDetails] = useState('');
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState('');

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q') || '';
    setSearchQuery(q);
  }, [searchParams]);

  const setSelectedAlert = async (alert) => {
    if (!alert) {
      setSelectedAlertState(null);
      openedAlertIdRef.current = null;
      if (routeAlertId) {
        navigate('/india/sarkari-jobs', { replace: true });
      } else if (searchParams && searchParams.has('alert')) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('alert');
        setSearchParams(newParams, { replace: true });
      } else if (window.history.pushState) {
        window.history.pushState(null, '', '/india/sarkari-jobs');
      }
      return;
    }

    const alertId = alert._id;

    // Check if alert details are already cached in memory
    if (alertId && alertCacheRef.current.has(alertId)) {
      const cached = alertCacheRef.current.get(alertId);
      setSelectedAlertState(cached);
      openedAlertIdRef.current = alertId;
      setDetailsLoading(false);
      setErrorLoadingDetails('');
      if (window.history.pushState && !routeAlertId) {
        window.history.pushState(null, '', `/india/sarkari-jobs/${alertId}`);
      }
      return;
    }

    // Set immediate alert state
    setSelectedAlertState(alert);
    if (alertId) {
      openedAlertIdRef.current = alertId;
      if (window.history.pushState && !routeAlertId) {
        window.history.pushState(null, '', `/india/sarkari-jobs/${alertId}`);
      }
    }

    if (alert.detailsText) {
      if (alertId) alertCacheRef.current.set(alertId, alert);
      setDetailsLoading(false);
      setErrorLoadingDetails('');
      return;
    }

    // Fetch full details without wiping out the modal contents
    setDetailsLoading(true);
    setErrorLoadingDetails('');
    try {
      const res = await request(`/api/public/live-alerts/${alertId}`);
      if (res.success && res.data) {
        const fullAlert = { ...alert, ...res.data };
        alertCacheRef.current.set(alertId, fullAlert);
        setSelectedAlertState(fullAlert);
      } else {
        setErrorLoadingDetails(res.message || 'Failed to fetch details from server');
      }
    } catch (err) {
      setErrorLoadingDetails(err.message || 'Failed to connect to server');
    } finally {
      setDetailsLoading(false);
    }
  };

  const hotLinks = useMemo(() => {
    if (!alerts || alerts.length === 0) return [];

    // Strictly sort by parsedPostDate descending (newest date first: 25, 24, 23, 22...)
    const sorted = [...alerts].sort((a, b) => {
      const dateA = new Date(a.parsedPostDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.parsedPostDate || b.createdAt || 0).getTime();
      if (dateA !== dateB) return dateB - dateA;
      if (a.isHighlight && !b.isHighlight) return -1;
      if (!a.isHighlight && b.isHighlight) return 1;
      return 0;
    });

    return sorted.slice(0, 8).map(alert => ({
      displayName: alert.title,
      boardName: alert.boardName || 'Official Board',
      type: 'alert',
      targetAlert: alert
    }));
  }, [alerts]);

  const handleHotLinkClick = (item) => {
    if (item.targetAlert) {
      setSelectedAlert(item.targetAlert);
    }
  };

  function loadAlerts(query = '') {
    setLoading(true);
    setError('');
    const qTrim = query.trim();
    let url = '/api/public/live-alerts?status=all&limit=120';
    if (qTrim.toLowerCase() === 'offline') {
      url = '/api/public/live-alerts?status=all&category=offline&limit=120';
    } else if (qTrim) {
      url = `/api/public/live-alerts?status=all&search=${encodeURIComponent(qTrim)}&limit=120`;
    }

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
    if (selectedState && selectedState !== 'All States') {
      request(`/api/public/live-alerts?state=${encodeURIComponent(selectedState)}&limit=100`)
        .then(res => {
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setAlerts(prev => {
              const existingIds = new Set(prev.map(a => a._id));
              const newItems = res.data.filter(a => !existingIds.has(a._id));
              return [...newItems, ...prev];
            });
          }
        })
        .catch(() => {});
    }
  }, [selectedState]);

  useEffect(() => {
    if (!alertIdParam || openedAlertIdRef.current === alertIdParam) return;

    openedAlertIdRef.current = alertIdParam;

    if (alertCacheRef.current.has(alertIdParam)) {
      setSelectedAlertState(alertCacheRef.current.get(alertIdParam));
      return;
    }

    request(`/api/public/live-alerts/${alertIdParam}`)
      .then(res => {
        if (res.success && res.data) {
          alertCacheRef.current.set(alertIdParam, res.data);
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
      const q = searchQuery.toLowerCase().trim();
      let queryMatch = !q;
      if (q === 'offline') {
        queryMatch = isOfflineAlert(alert);
      } else if (q) {
        queryMatch = alert.title.toLowerCase().includes(q) ||
                     (alert.boardName || '').toLowerCase().includes(q);
      }
      const stateMatch = isAlertMatchingState(alert, selectedState);
      return queryMatch && stateMatch;
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

    const sortByDate = (a, b) => {
      const timeA = new Date(a.parsedPostDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.parsedPostDate || b.createdAt || 0).getTime();
      if (timeA !== timeB) {
        return timeB - timeA; // Strict newest date first (25, 24, 23, 22...)
      }
      if (a.isHighlight && !b.isHighlight) return -1;
      if (!a.isHighlight && b.isHighlight) return 1;
      return 0;
    };
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
        title={selectedAlert ? `${selectedAlert.title} (${selectedAlert.boardName || 'Official Board'}) | Sarkari Result & Live Alerts` : "Sarkari Result 2026: Live Job Alerts, Admit Cards & Vacancies | Digital Home"} 
        description={selectedAlert ? `Official notification for ${selectedAlert.title} by ${selectedAlert.boardName || 'Official Board'}. Apply online, check eligibility, fee, syllabus, and last date: ${selectedAlert.lastDate || 'Active'}.` : "Browse, filter, and search active Indian Sarkari job vacancies, admit cards, and results fetched dynamically from official government boards."} 
        canonical={selectedAlert ? `https://www.digitalhomeblog.in/india/sarkari-jobs/${selectedAlert._id}` : "https://www.digitalhomeblog.in/india/sarkari-jobs"}
        noindex={Boolean(searchParams.get('search') && !selectedAlert)}
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

        {/* 1-Click Fast Exam & Board Filter Pills Hub (User Swipeable / Scrollable) */}
        <Box 
          sx={{ 
            mb: 3, 
            maxWidth: '1200px', 
            mx: 'auto',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            overflowX: 'auto',
            py: 1,
            px: 0.5,
            scrollSnapType: 'x proximity',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { height: '5px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '10px' },
            '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.02)' }
          }}
        >
          {QUICK_EXAM_FILTERS.map((f, i) => {
            const isSelected = f.query === '__tools__' ? false : (searchQuery.toLowerCase() === f.query.toLowerCase() || (!searchQuery && !f.query));
            return (
              <Chip
                key={i}
                label={`${f.icon} ${f.label}`}
                clickable
                onClick={() => {
                  if (f.query === '__tools__') {
                    navigate('/tools');
                    return;
                  }
                  setSearchQuery(f.query);
                  setSelectedState('All States');
                  setTimeout(() => {
                    const el = document.getElementById('alerts-lists-grid') || document.getElementById('search-filter-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                sx={{
                  scrollSnapAlign: 'start',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  py: 2.1,
                  px: 1.3,
                  borderRadius: '30px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  bgcolor: isSelected ? f.color : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  border: `1.5px solid ${isSelected ? f.color : '#E2E8F0'}`,
                  boxShadow: isSelected ? `0 4px 14px ${f.color}40` : '0 2px 4px rgba(0,0,0,0.02)',
                  '&:hover': {
                    bgcolor: isSelected ? f.color : `${f.color}15`,
                    color: isSelected ? '#FFFFFF' : f.color,
                    borderColor: f.color,
                    transform: 'translateY(-2px)'
                  }
                }}
              />
            );
          })}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: { xs: '650px', md: '800px' }, py: 8 }}><CircularProgress size={44} /></Box>
        ) : (
          <Box>
            {/* Direct Priority Search Results Grid (Displayed FIRST when user searches or filters) */}
            {Boolean(searchQuery.trim() || (selectedState && selectedState !== 'All States')) ? (
              <Box sx={{ mb: 4, width: '100%', maxWidth: '1200px', mx: 'auto' }}>
                {/* Search Results Banner Header */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    p: { xs: 1.5, md: 2 },
                    mb: 2.5,
                    bgcolor: '#EFF6FF',
                    border: '1.5px solid #BFDBFE',
                    borderRadius: '16px',
                    flexWrap: 'wrap',
                    gap: 1.5
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 850, color: '#1E40AF', fontSize: { xs: '0.95rem', md: '1.15rem' } }}>
                      🔍 खोज परिणाम (Search Results) {searchQuery ? `"${searchQuery}"` : ''} {selectedState !== 'All States' ? `• ${selectedState}` : ''}
                    </Typography>
                    <Chip 
                      label={`${filteredAlerts.length} ${filteredAlerts.length === 1 ? 'भर्ती' : 'भर्तियां'} मिलीं`} 
                      size="small" 
                      sx={{ bgcolor: '#2563EB', color: '#FFFFFF', fontWeight: 800, fontSize: '0.72rem' }} 
                    />
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedState('All States');
                    }}
                    startIcon={<ResetIcon />}
                    sx={{
                      borderRadius: '20px',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderColor: '#93C5FD',
                      color: '#1D4ED8',
                      bgcolor: '#FFFFFF',
                      fontSize: '0.75rem',
                      '&:hover': { bgcolor: '#DBEAFE', borderColor: '#2563EB' }
                    }}
                  >
                    Clear Search (सभी देखें)
                  </Button>
                </Box>

                {filteredAlerts.length === 0 ? (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: { xs: 4, md: 6 }, 
                      textAlign: 'center', 
                      borderRadius: '16px', 
                      border: '1px dashed #CBD5E1', 
                      bgcolor: 'background.paper',
                      my: 2
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#334155', mb: 1, fontSize: '1rem' }}>
                      "{searchQuery}" से मिलती-जुलती कोई सक्रिय भर्ती नहीं मिली
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3, fontSize: '0.82rem' }}>
                      कृपया अन्य कीवर्ड (जैसे SSC, Railway, Police, BPSC, UPSC, Defence) से खोजें अथवा रीसेट करें।
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => { setSearchQuery(''); setSelectedState('All States'); }}
                      sx={{ borderRadius: '24px', px: 3, py: 0.8, textTransform: 'none', fontWeight: 700, bgcolor: '#2563EB' }}
                    >
                      सभी सक्रिय भर्तियां देखें (Show All Vacancies)
                    </Button>
                  </Paper>
                ) : (
                  <Box 
                    sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, 
                      gap: 2 
                    }}
                  >
                    {filteredAlerts.map((alert, idx) => {
                      const hasLastDate = alert.lastDate && alert.lastDate !== 'N/A' && alert.lastDate !== 'Check Detail Page' && alert.lastDate !== 'अधिसूचना देखें';
                      let actionLabel = 'पूरी अधिसूचना देखें ↗';
                      let badgeColor = '#2563EB';
                      let badgeBg = '#EFF6FF';
                      if (alert.category === 'Result' || /result/i.test(alert.title)) {
                        actionLabel = 'रिजल्ट देखें ↗';
                        badgeColor = '#DC2626';
                        badgeBg = '#FEE2E2';
                      } else if (alert.category === 'Admit Card' || /admit/i.test(alert.title)) {
                        actionLabel = 'एडमिट कार्ड ↗';
                        badgeColor = '#D97706';
                        badgeBg = '#FEF3C7';
                      } else if (alert.category === 'Answer Key' || /answer key/i.test(alert.title)) {
                        actionLabel = 'उत्तर कुंजी ↗';
                        badgeColor = '#0D9488';
                        badgeBg = '#CCFBF1';
                      }

                      return (
                        <Paper
                          key={alert._id || idx}
                          elevation={0}
                          onClick={() => setSelectedAlert(alert)}
                          sx={{
                            p: 2,
                            borderRadius: '16px',
                            border: '1.5px solid #E2E8F0',
                            bgcolor: 'background.paper',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '145px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.12)',
                              borderColor: '#2563EB'
                            }
                          }}
                        >
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 850, color: '#2563EB', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.66rem' }}>
                                🏛️ {alert.boardName || 'Official Board'}
                              </Typography>
                              <Chip 
                                label={alert.category || 'Job'} 
                                size="small" 
                                sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800, bgcolor: badgeBg, color: badgeColor }} 
                              />
                            </Box>
                            <Typography 
                              sx={{ 
                                fontWeight: 750, 
                                fontSize: '0.86rem', 
                                color: '#0F172A', 
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {alert.title}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.8, pt: 1, borderTop: '1px dashed #E2E8F0' }}>
                            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.68rem' }}>
                              📅 {new Date(alert.parsedPostDate || alert.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </Typography>
                            {hasLastDate ? (
                              <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 800, fontSize: '0.66rem', bgcolor: '#FEE2E2', px: 0.8, py: 0.2, borderRadius: '4px' }}>
                                ⏳ {alert.lastDate}
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 800, fontSize: '0.70rem' }}>
                                {actionLabel}
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Box>
            ) : (
              /* Hot Links Grid (Only shown when not searching) */
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
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(4, 1fr)'
                  },
                  gap: { xs: 1.5, sm: 2 }
                }}>
                  {hotLinks.map((item, idx) => {
                    const styles = getCardStyles(item, idx);
                    const alert = item.targetAlert;
                    if (!alert) return null;
                    const isNew = idx < 4 || (new Date() - new Date(alert.createdAt || 0) < 3 * 24 * 60 * 60 * 1000);
                    const accentColor = styles.accentColor || '#4F46E5';
                    const board = alert.boardName || 'Govt Board';
                    const lastDate = alert.lastDate;
                    const hasLastDate = lastDate && lastDate !== 'N/A' && lastDate !== 'Check Detail Page' && lastDate !== 'अधिसूचना देखें' && lastDate !== 'Check Result List' && lastDate !== 'Download Score Card' && lastDate !== 'Check PDF List';

                    let actionText = 'Apply ↗';
                    if (alert.category === 'Result' || /result|score card/i.test(alert.title)) {
                      actionText = 'Result ↗';
                    } else if (alert.category === 'Admit Card' || /admit card|hall ticket/i.test(alert.title)) {
                      actionText = 'Admit Card ↗';
                    } else if (alert.category === 'Syllabus' || /syllabus/i.test(alert.title)) {
                      actionText = 'Syllabus ↗';
                    } else if (alert.category === 'Answer Key' || /answer key/i.test(alert.title)) {
                      actionText = 'Answer Key ↗';
                    }

                    return (
                      <Box
                        key={alert._id || idx}
                        onClick={() => handleHotLinkClick(item)}
                        sx={{
                          p: 1.6,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '128px',
                          height: '100%',
                          bgcolor: styles.bgColor,
                          background: styles.bgGradient || styles.bgColor,
                          border: isNew ? `1.5px solid ${accentColor}` : `1px solid ${styles.borderColor}`,
                          borderRadius: '14px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isNew 
                            ? `0 3px 10px ${accentColor}25`
                            : `0 2px 5px -1px ${styles.shadowColor || 'rgba(0,0,0,0.03)'}`,
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: `0 10px 20px -3px ${styles.shadowColor || 'rgba(0,0,0,0.12)'}`,
                            background: styles.hoverBgGradient || styles.hoverBg,
                            borderColor: accentColor,
                            '& .hot-link-title': {
                              color: accentColor
                            }
                          }
                        }}
                      >
                        {/* Top Row: Board Name + NEW Badge */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 850, 
                              color: styles.textColor, 
                              textTransform: 'uppercase', 
                              fontSize: '0.64rem',
                              letterSpacing: 0.4
                            }}
                          >
                            {board}
                          </Typography>
                          {isNew && (
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.3,
                                bgcolor: accentColor,
                                color: 'white',
                                px: 0.6,
                                py: 0.15,
                                borderRadius: '4px',
                                fontSize: '0.52rem',
                                fontWeight: 900,
                                boxShadow: `0 1px 4px ${accentColor}40`,
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
                        </Box>

                        {/* Middle Row: Title (Clamped to 2 lines) */}
                        <Typography
                          className="hot-link-title"
                          sx={{
                            fontWeight: 750,
                            fontSize: '0.80rem',
                            color: '#1E293B',
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            mb: 'auto',
                            transition: 'color 0.15s ease'
                          }}
                        >
                          {alert.title}
                        </Typography>

                        {/* Bottom Row: Post Date & Action / Last Date Badge */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 0.6, borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.64rem', fontWeight: 700 }}>
                            📅 {new Date(alert.parsedPostDate || alert.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </Typography>
                          {hasLastDate ? (
                            <Typography variant="caption" sx={{ color: '#DC2626', fontSize: '0.62rem', fontWeight: 800, bgcolor: '#FEE2E2', px: 0.6, py: 0.15, borderRadius: '4px' }}>
                              ⏳ {lastDate}
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: styles.textColor, fontSize: '0.62rem', fontWeight: 850, textTransform: 'uppercase', letterSpacing: 0.2 }}>
                              {actionText}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* In-Content High-Yield Ad Unit */}
            <AdSlot format="incontent" style={{ my: 3 }} />

            <Box
              id="alerts-lists-grid"
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: { xs: 2.5, md: 3 },
                width: '100%',
                maxWidth: '1360px',
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
                height: { xs: '520px', sm: '640px', md: '720px' },
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
                height: { xs: '520px', sm: '640px', md: '720px' },
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
                height: { xs: '520px', sm: '640px', md: '720px' },
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

            {/* High-Converting Responsive In-Feed Ad Banner Between Top 3 & Bottom 3 Grids */}
            <Box sx={{ gridColumn: '1 / -1', my: { xs: 1, md: 1.5 }, width: '100%' }}>
              <AdSlot format="incontent" style={{ my: 1.5 }} />
            </Box>

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
                height: { xs: '520px', sm: '640px', md: '720px' },
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
                height: { xs: '520px', sm: '640px', md: '720px' },
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
                height: { xs: '520px', sm: '640px', md: '720px' },
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

        {/* Bottom Pre-Footer Ad Unit */}
        <AdSlot format="afterpost" style={{ my: 4 }} />
      </Box>

      {/* Center Details Dialog Popup Modal */}
      <Dialog
        open={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: { xs: '16px', sm: '24px' },
            p: 0,
            bgcolor: '#070B18 !important',
            backgroundColor: '#070B18 !important',
            backgroundImage: 'linear-gradient(180deg, #0D1629 0%, #060A14 100%) !important',
            color: '#FFFFFF !important',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderTop: '6px solid #38BDF8',
            boxShadow: '0 35px 90px rgba(0, 0, 0, 0.95)',
            margin: { xs: '8px auto', sm: '20px auto' },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
            height: { xs: 'calc(100dvh - 16px)', sm: 'auto' },
            maxHeight: { xs: 'calc(100dvh - 16px)', sm: 'calc(100dvh - 40px)' },
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto !important',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            position: 'relative'
          }
        }}
      >
        {selectedAlert && (
          <>
            <DialogTitle 
              sx={{ 
                m: 0, 
                p: { xs: 1.5, sm: 2.2 }, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                bgcolor: '#0D1629 !important',
                backgroundColor: '#0D1629 !important',
                position: 'sticky',
                top: 0,
                zIndex: 30,
                flexShrink: 0
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pr: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip 
                    label={selectedAlert.boardName || 'Official Board'} 
                    size="small" 
                    sx={{ fontWeight: 800, fontSize: '0.68rem', bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px' }} 
                  />
                  <Chip 
                    label={selectedAlert.state || 'All India'} 
                    size="small" 
                    sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: 'rgba(255, 255, 255, 0.08)', color: '#E2E8F0', borderRadius: '8px' }} 
                  />
                </Box>
                <Typography sx={{ fontWeight: 850, color: '#FFFFFF', mt: 0.5, lineHeight: 1.35, fontSize: { xs: '0.98rem', sm: '1.25rem' } }}>
                  {selectedAlert.title}
                </Typography>
              </Box>
              <IconButton
                aria-label="close"
                onClick={() => setSelectedAlert(null)}
                sx={{
                  color: '#94A3B8',
                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  '&:hover': { color: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent
              id="public-live-alert-modal-content"
              sx={{
                p: { xs: 1.8, sm: 3 },
                bgcolor: '#080D1A !important',
                backgroundColor: '#080D1A !important',
                color: '#FFFFFF !important',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                flex: '1 0 auto',
                overflow: 'visible !important',
                overflowY: 'visible !important',
                overflowX: 'visible !important'
              }}
            >
              {detailsLoading && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress sx={{ bgcolor: 'rgba(56, 189, 248, 0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#38BDF8' }, borderRadius: 1 }} />
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5, textAlign: 'center', fontSize: '0.72rem' }}>
                    ⚡ Loading official circular details...
                  </Typography>
                </Box>
              )}
              {errorLoadingDetails && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24' }}>
                  {errorLoadingDetails} — You can still access official portal and PDF links below.
                </Alert>
              )}
              {renderBlogContent(selectedAlert, (url) => {
                setPendingRedirectUrl(url);
                setRedirectModalOpen(true);
              })}
              <Box sx={{ height: { xs: 20, sm: 30 } }} />
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Interstitial Redirect Modal for Telegram */}
      <TelegramRedirectModal 
        open={redirectModalOpen} 
        onClose={() => setRedirectModalOpen(false)} 
        targetUrl={pendingRedirectUrl} 
      />
    </Layout>
  );
}
