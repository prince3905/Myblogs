import { useEffect, useState, Fragment, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Box, Alert, CircularProgress,
  IconButton, Tooltip, Tab, Tabs, Link as MuiLink,
  TextField, Select, MenuItem, FormControl, InputLabel, Grid
} from '@mui/material';
import {
  Sync as SyncIcon, AutoAwesome as WriteIcon,
  Launch as LaunchIcon, NotificationsActive as NotificationIcon,
  CheckCircle as CheckCircleIcon, HourglassEmpty as HourglassIcon,
  KeyboardArrowDown as ExpandMoreIcon, KeyboardArrowUp as ExpandLessIcon,
  PictureAsPdf as PdfIcon, Language as WebIcon,
  AssignmentTurnedIn as ApplyIcon
} from '@mui/icons-material';
import { request } from '../../../shared/lib/api';
import { useToast } from '../../../components/Toast';

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
  'EWS /',
  'EWS/',
  'EWS',
  'SC / ST',
  'SC/ST',
  'SC',
  'ST',
  'PH / SC',
  'PH/SC',
  'PH',
  'All Category Female',
  'Minimum Age',
  'Maximum Age',
  'Age Relaxation',
  'Pay the Examination Fee',
  'Pay the Exam Fee'
];

keyKeywords.sort((a, b) => b.length - a.length);

function parseKeyValueMashedString(line) {
  function splitValueByKeywords(key, value) {
    for (const kw of keyKeywords) {
      if (kw.toLowerCase() === key.toLowerCase()) continue;
      
      const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b(${escaped})\\b`, 'i');
      const match = value.match(regex);
      
      if (match) {
        const kwIdx = match.index;
        let valBefore = value.substring(0, kwIdx).trim();
        valBefore = valBefore.replace(/^[\s/\\\-:|]+|[\s/\\\-:|]+$/g, '').trim();

        let valAfter = value.substring(kwIdx + match[0].length).trim();
        valAfter = valAfter.replace(/^[\s/\\\-:|]+|[\s/\\\-:|]+$/g, '').trim();

        const subItems = splitValueByKeywords(kw, valAfter);
        return [
          { key: key, value: valBefore },
          ...subItems
        ];
      }
    }
    return [{ key: key, value: value }];
  }

  const parts = line.split(':');
  if (parts.length <= 1) return [{ key: '', value: line }];
  
  const result = [];
  let currentKey = parts[0].trim();

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    if (i === parts.length - 1) {
      result.push({ key: currentKey, value: part });
    } else {
      let foundKeyword = '';
      for (const kw of keyKeywords) {
        if (part.toLowerCase().endsWith(kw.toLowerCase())) {
          foundKeyword = kw;
          break;
        }
      }

      if (foundKeyword) {
        const value = part.substring(0, part.length - foundKeyword.length).trim();
        result.push({ key: currentKey, value: value });
        currentKey = foundKeyword;
      } else {
        const lastSpaceIdx = part.lastIndexOf(' ');
        if (lastSpaceIdx !== -1) {
          const value = part.substring(0, lastSpaceIdx).trim();
          const nextKey = part.substring(lastSpaceIdx).trim();
          result.push({ key: currentKey, value: value });
          currentKey = nextKey;
        } else {
          result.push({ key: currentKey, value: part });
          currentKey = '';
        }
      }
    }
  }

  const finalItems = [];
  result.forEach(item => {
    let cleanKey = item.key;
    cleanKey = cleanKey.replace(/Important Date\s*/gi, '');
    cleanKey = cleanKey.replace(/Application Fee\s*/gi, '');
    cleanKey = cleanKey.replace(/.*Age Limit as on\s*[\d/]*\s*/gi, '');
    
    for (const kw of keyKeywords) {
      if (cleanKey.toLowerCase().includes(kw.toLowerCase())) {
        cleanKey = kw;
        break;
      }
    }
    
    cleanKey = cleanKey.replace(/^[\s/\\\-:|]+|[\s/\\\-:|]+$/g, '').trim();

    const splitItems = splitValueByKeywords(cleanKey, item.value.trim());
    finalItems.push(...splitItems);
  });

  return finalItems.filter(item => item.key !== '' || item.value !== '');
}

export default function LiveAlertsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [draftingId, setDraftingId] = useState(null);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState(0); // 0 = All, 1 = Active, 2 = Drafted
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedState, setSelectedState] = useState('All States');
  const [sortOption, setSortOption] = useState('date-desc');
  const [expandedId, setExpandedId] = useState(null);

  function parseDetails(text, alert) {
    const parsed = {
      postName: alert.title,
      postDate: alert.postDate || new Date(alert.createdAt).toLocaleDateString(),
      shortInfo: '',
      sections: []
    };

    if (!text) return parsed;

    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .filter(l => !l.includes('adsbygoogle') && !l.includes('window.adsbygoogle'));

    let currentSection = null;

    function closeCurrentSection() {
      if (currentSection) {
        if (currentSection.type === 'links' && currentSection.links.length === 0) return;
        if (currentSection.type === 'table' && currentSection.rows.length === 0) return;
        
        parsed.sections.push(currentSection);
        currentSection = null;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();

      // 1. Parse Header Fields
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        const firstPartLower = parts[0].toLowerCase();
        if (firstPartLower.includes('name of post') || firstPartLower.includes('post date') || firstPartLower.includes('short information')) {
          if (firstPartLower.includes('name of post')) {
            parsed.postName = parts.slice(1).join(' | ').replace(/^[\s/\\\-:|]+|[\s/\\\-:|]+$/g, '').trim();
          } else if (firstPartLower.includes('post date')) {
            parsed.postDate = parts.slice(1).join(' | ').replace(/^[\s/\\\-:|]+|[\s/\\\-:|]+$/g, '').trim();
          } else if (firstPartLower.includes('short information')) {
            parsed.shortInfo = parts.slice(1).join(' | ').replace(/^[\s/\\\-:|]+|[\s/\\\-:|]+$/g, '').trim();
          }
          continue;
        }
      } else {
        if (lineLower.startsWith('name of post :') || lineLower.startsWith('post date :') || lineLower.startsWith('short information :')) {
          const colonIdx = line.indexOf(':');
          const val = line.substring(colonIdx + 1).replace(/^[\s/\\\-:|]+|[\s/\\\-:|]+$/g, '').trim();
          if (lineLower.startsWith('name of post')) {
            parsed.postName = val;
          } else if (lineLower.startsWith('post date')) {
            parsed.postDate = val;
          } else if (lineLower.startsWith('short information')) {
            parsed.shortInfo = val;
          }
          continue;
        }
      }

      // 2. Detect Headings
      const isHeading = line.length < 120 && !line.includes('|') && (
        lineLower.includes('vacancy details') ||
        lineLower.includes('how to fill') ||
        lineLower.includes('eligibility') ||
        lineLower.includes('subject wise') ||
        lineLower.includes('short details of') ||
        lineLower.includes('important links') ||
        lineLower.includes('exam center') ||
        lineLower.includes('age limit') ||
        lineLower.includes('selection process') ||
        lineLower.includes('important question') ||
        lineLower.includes('frequently asked questions')
      );

      if (isHeading) {
        closeCurrentSection();
        
        let type = 'paragraph';
        let title = line;

        if (lineLower.includes('how to fill')) {
          type = 'text_section';
          title = 'How to Apply';
        } else if (lineLower.includes('important links')) {
          type = 'links';
          title = 'Important Official Links';
        } else if (lineLower.includes('vacancy details') || lineLower.includes('subject wise')) {
          type = 'table';
          title = lineLower.includes('subject wise') ? 'Subject Wise Vacancy Details' : 'Vacancy Details';
        } else if (lineLower.includes('age limit')) {
          type = 'key_value_columns';
          title = 'Age Limit & Criteria';
        }

        currentSection = { type, title, text: '', rows: [], links: [], columns: [] };
        continue;
      }

      // 3. Process Table Rows
      if (line.includes('|')) {
        const isLinksLine = lineLower.includes('click here') || lineLower.includes('link:');
        const isLayoutLine = (lineLower.includes('application fee') || 
                              lineLower.includes('important date') || 
                              lineLower.includes('age limit') ||
                              lineLower.includes('general / obc') ||
                              lineLower.includes('sc / st') ||
                              lineLower.includes('application begin')) &&
                             !lineLower.includes('post name') &&
                             !lineLower.includes('eligibility') &&
                             !lineLower.includes('total post');

        if (isLinksLine) {
          if (!currentSection || currentSection.type !== 'links') {
            closeCurrentSection();
            currentSection = { type: 'links', title: 'Important Official Links', links: [] };
          }
          
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 2) {
            const name = parts[0];
            const restText = parts.slice(1).join(' | ');
            const linkRegex = /\((?:Link|link):\s*([^)]+)\)/gi;
            const match = linkRegex.exec(restText);
            let url = '';
            if (match) {
              const urlsStr = match[1];
              const urlMatches = urlsStr.match(/(?:https?:\/\/|\/)[^\s,]+/gi);
              if (urlMatches && urlMatches.length > 0) {
                url = urlMatches[0];
              }
            }
            const cleanActionText = restText.replace(/\((?:Link|link):\s*([^)]+)\)/gi, '').trim();
            currentSection.links.push({ name, actionText: cleanActionText || 'Click Here', url });
          }
        } else if (isLayoutLine) {
          if (!currentSection || currentSection.type !== 'key_value_columns') {
            closeCurrentSection();
            currentSection = { type: 'key_value_columns', title: 'Important Dates & Application Fees', columns: [] };
          }
          
          const cells = line.split('|').map(c => c.trim());
          cells.forEach((cell, idx) => {
            if (!currentSection.columns[idx]) currentSection.columns[idx] = [];
            if (cell) {
              const parsedItems = parseKeyValueMashedString(cell);
              currentSection.columns[idx].push(...parsedItems);
            }
          });
        } else {
          if (!currentSection || currentSection.type !== 'table') {
            closeCurrentSection();
            currentSection = { type: 'table', title: 'Vacancy Details', rows: [] };
          }

          const cells = line.split('|').map(c => {
            const text = c.trim();
            const links = [];
            const linkRegex = /\((?:Link|link):\s*(https?:\/\/[^\s)]+|\/tools)\)/gi;
            let match;
            while ((match = linkRegex.exec(text)) !== null) {
              links.push(match[1]);
            }
            const cleanText = text.replace(/\((?:Link|link):\s*(https?:\/\/[^\s)]+)\)/gi, '').trim();
            return { text: cleanText, links };
          });
          currentSection.rows.push(cells);
        }
      } else {
        if (lineLower.includes('minimum age') && lineLower.includes('maximum age')) {
          if (!currentSection || currentSection.type !== 'key_value_columns') {
            closeCurrentSection();
            currentSection = { type: 'key_value_columns', title: 'Age Limit Details', columns: [[]] };
          }
          const parsedItems = parseKeyValueMashedString(line);
          currentSection.columns[0].push(...parsedItems);
        } else if (currentSection && currentSection.type === 'text_section') {
          currentSection.text += (currentSection.text ? '\n' : '') + line;
        } else {
          if (!currentSection || currentSection.type !== 'paragraph') {
            closeCurrentSection();
            currentSection = { type: 'paragraph', text: '' };
          }
          currentSection.text += (currentSection.text ? '\n' : '') + line;
        }
      }
    }

    closeCurrentSection();
    return parsed;
  }

  function renderTextWithLinks(text) {
    if (!text) return '';
    const linkRegex = /\((?:Link|link):\s*(https?:\/\/[^\s)]+|\/tools)\)/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      const url = match[1];

      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      parts.push(
        <MuiLink
          key={url + matchIndex}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontWeight: 600,
            color: '#4F46E5',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.3,
            fontSize: 'inherit'
          }}
        >
          [Direct Link ↗]
        </MuiLink>
      );

      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  }

  function getDynamicActions(alert) {
    const parsedData = parseDetails(alert.detailsText, alert);
    const parsedLinks = [];
    if (parsedData && parsedData.sections) {
      const linksSection = parsedData.sections.find(s => s.type === 'links');
      if (linksSection && linksSection.links) {
        parsedLinks.push(...linksSection.links);
      }
    }

    function findParsedLink(keywords) {
      const found = parsedLinks.find(link => 
        keywords.some(kw => link.name.toLowerCase().includes(kw.toLowerCase()))
      );
      return found ? found.url : null;
    }

    const actions = [];

    // 1. PDF Notification URL
    const pdfUrl = alert.officialPdfUrl || findParsedLink(['notification', 'pdf', 'advertisement', 'notice']);
    actions.push({
      label: pdfUrl ? 'Official Notification PDF' : 'Notification PDF Not Found',
      url: pdfUrl,
      icon: <PdfIcon />,
      color: '#DC2626',
      hoverBg: '#FEF2F2',
      borderColor: '#FCA5A5'
    });

    // 2. Category-based main link (Admit Card / Result / Answer Key / Apply)
    const category = (alert.category || 'Latest Job').toLowerCase();
    
    if (category.includes('admit')) {
      const admitUrl = findParsedLink(['admit card', 'hall ticket', 'exam city', 'admitcard']);
      actions.push({
        label: admitUrl ? 'Official Download Admit Card' : 'Admit Card Link Not Found',
        url: admitUrl,
        icon: <ApplyIcon />,
        color: '#059669',
        hoverBg: '#ECFDF5',
        borderColor: '#A7F3D0'
      });
    } else if (category.includes('result')) {
      const resultUrl = findParsedLink(['result', 'score card', 'marks', 'scorecard', 'merit']);
      actions.push({
        label: resultUrl ? 'Official Download Result' : 'Result Link Not Found',
        url: resultUrl,
        icon: <ApplyIcon />,
        color: '#6D28D9',
        hoverBg: '#F5F3FF',
        borderColor: '#DDD6FE'
      });
    } else if (category.includes('answer key') || category.includes('answerkey') || category.includes('key')) {
      const akUrl = findParsedLink(['answer key', 'key', 'solutions', 'objection']);
      actions.push({
        label: akUrl ? 'Official Download Answer Key' : 'Answer Key Link Not Found',
        url: akUrl,
        icon: <ApplyIcon />,
        color: '#BE185D',
        hoverBg: '#FDF2F8',
        borderColor: '#FBCFE8'
      });
    } else {
      const applyUrl = alert.officialApplyUrl || findParsedLink(['apply online', 'online form', 'apply']);
      actions.push({
        label: applyUrl ? 'Official Apply Online Portal' : 'Apply Online Link Not Found',
        url: applyUrl,
        icon: <ApplyIcon />,
        color: '#059669',
        hoverBg: '#ECFDF5',
        borderColor: '#A7F3D0'
      });
    }

    // 3. Official Website Homepage URL
    const webUrl = alert.officialUrl || findParsedLink(['official website', 'homepage', 'website']);
    actions.push({
      label: webUrl ? 'Official Website Homepage' : 'Official Website Not Found',
      url: webUrl,
      icon: <WebIcon />,
      color: '#2563EB',
      hoverBg: '#EFF6FF',
      borderColor: '#93C5FD'
    });

    return actions;
  }

  function renderBlogContent(alert) {
    const parsedData = parseDetails(alert.detailsText, alert);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Blog Header Card */}
        <Paper elevation={0} sx={{ p: 3, bgcolor: '#EEF2FF', borderRadius: 3, border: '1px solid #C7D2FE', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
            <Chip 
              label={alert.category || 'Latest Job'} 
              size="small" 
              sx={{ 
                fontWeight: 700, 
                bgcolor: '#4F46E5', 
                color: 'white' 
              }} 
            />
            <Chip 
              label={alert.boardName || 'Official Board'} 
              size="small" 
              sx={{ 
                fontWeight: 700, 
                bgcolor: '#E0E7FF', 
                color: '#4338CA' 
              }} 
            />
            <Chip 
              label={alert.state || 'Central/All India'} 
              size="small" 
              sx={{ 
                fontWeight: 700, 
                bgcolor: '#F3F4F6', 
                color: '#374151' 
              }} 
            />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E1B4B', mb: 1, fontFamily: 'system-ui', lineHeight: 1.3 }}>
            {parsedData.postName || alert.title}
          </Typography>
          <Typography variant="caption" sx={{ color: '#4F46E5', fontWeight: 600 }}>
            Published/Updated: {parsedData.postDate || alert.postDate || 'Live Alert'}
          </Typography>
        </Paper>

        {/* Quick Summary Callout for Students */}
        <Box sx={{
          p: 2.5,
          bgcolor: '#FFFBEB',
          borderLeft: '5px solid #F59E0B',
          borderRadius: 2,
          mb: 3
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#B45309', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            💡 Quick Summary (स्टूडेंट्स के लिए आसान भाषा में)
          </Typography>
          <Typography variant="body2" sx={{ color: '#92400E', lineHeight: 1.6, fontWeight: 500 }}>
            <strong>{alert.boardName || 'Official Board'}</strong> ({alert.state || 'Central/All India'}) ne <strong>{parsedData.postName || alert.title}</strong> ke liye dynamic notification updates release kiye hain.
            {alert.category === 'Latest Job' && ` Is bharti ke liye online apply karne ki last date ${alert.lastDate || 'N/A'} hai.`}
            {alert.category === 'Admit Card' && ` Candidates apna Hall Ticket / Admit card download niche di gayi link se direct download kar sakte hain.`}
            {alert.category === 'Result' && ` Candidate apna exam scorecard / merit list niche diye gaye quick results link se check kar sakte hain.`}
            {alert.category === 'Answer Key' && ` Board ne official exam solutions / answer key release kar di hai, jo aap niche table se check kar sakte hain.`}
            {alert.category === 'Syllabus' && ` Exam syllabus aur pattern download karne ki link niche provide kar di gayi hai.`}
            {' '}Aap niche di gayi factsheet, eligibility details, age limit aur direct links ko dhyan se padhein aur officially click karke proceed karein. Best of luck!
          </Typography>
        </Box>

        {/* Short Information Callout */}
        {parsedData.shortInfo && (
          <Box sx={{ p: 2.5, bgcolor: '#EFF6FF', borderLeft: '5px solid #3B82F6', borderRadius: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E40AF', mb: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>
              ℹ️ Short Information
            </Typography>
            <Typography variant="body2" sx={{ color: '#1E3A8A', lineHeight: 1.6 }}>
              {parsedData.shortInfo}
            </Typography>
          </Box>
        )}

        {/* Render sections */}
        {parsedData.sections.length === 0 ? (
          <Typography sx={{ fontSize: '0.875rem', color: '#9CA3AF', fontStyle: 'italic', p: 2 }}>
            No detailed vacancy info scraped for this post yet.
          </Typography>
        ) : (
          parsedData.sections.map((section, sIdx) => {
            if (section.type === 'paragraph') {
              return (
                <Typography key={sIdx} variant="body2" sx={{ color: '#4B5563', lineHeight: 1.6, mb: 2 }}>
                  {renderTextWithLinks(section.text)}
                </Typography>
              );
            }

            if (section.type === 'text_section') {
              const sentences = section.text
                .split(/[.!?]\s+/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
              
              const isHowToApply = section.title.toLowerCase().includes('how to');

              return (
                <Box key={sIdx} sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', borderLeft: '4px solid #4F46E5', pl: 1.5, mb: 1.5 }}>
                    {isHowToApply ? '📝' : '📖'} {section.title}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'white', borderRadius: 2.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {sentences.map((sentence, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                          <Box sx={{ color: '#4F46E5', mt: 0.2, fontWeight: 700, fontSize: '0.9rem' }}>
                            {isHowToApply ? '✓' : '•'}
                          </Box>
                          <Typography variant="body2" sx={{ color: '#4B5563', lineHeight: 1.6 }}>
                            {renderTextWithLinks(sentence.endsWith('.') ? sentence : sentence + '.')}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              );
            }

            if (section.type === 'key_value_columns') {
              const cols = section.columns;
              return (
                <Grid container spacing={3} key={sIdx} sx={{ mb: 3 }}>
                  {cols.map((col, colIdx) => {
                    let colTitle = section.title || 'Information';
                    let icon = '📋';
                    if (cols.length > 1) {
                      if (colIdx === 0) { colTitle = 'Important Dates'; icon = '📅'; }
                      if (colIdx === 1) { colTitle = 'Application Fee'; icon = '💳'; }
                    } else {
                      if (colTitle.toLowerCase().includes('age limit')) { icon = '🔞'; }
                    }
                    
                    return (
                      <Grid item xs={12} md={cols.length > 1 ? 6 : 12} key={colIdx}>
                        <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden', height: '100%' }}>
                          <Box sx={{ py: 1.5, px: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                              {icon} {colTitle}
                            </Typography>
                          </Box>
                          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {col.map((item, itemIdx) => {
                              const isHighlight = item.key.toLowerCase().includes('last date') || item.key.toLowerCase().includes('exam date');
                              return (
                                <Box key={itemIdx} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', pb: 1, gap: 1 }}>
                                  <Typography variant="body2" sx={{ color: '#4B5563', fontWeight: 500 }}>
                                    {item.key}
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: 700, 
                                    color: isHighlight ? '#DC2626' : '#1E293B',
                                    textAlign: { sm: 'right' }
                                  }}>
                                    {renderTextWithLinks(item.value)}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              );
            }

            if (section.type === 'table') {
              return (
                <Box key={sIdx} sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', borderLeft: '4px solid #4F46E5', pl: 1.5, mb: 1.5 }}>
                    📊 {section.title}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                          {section.rows[0].map((cell, cIdx) => (
                            <TableCell key={cIdx} sx={{ fontWeight: 700, color: '#1F2937', py: 1.5, px: 2 }}>
                              {cell.text}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {section.rows.slice(1).map((row, rIdx) => (
                          <TableRow key={rIdx} sx={{ bgcolor: rIdx % 2 === 0 ? 'white' : '#F8FAFC', '&:hover': { bgcolor: '#F1F5F9' } }}>
                            {row.map((cell, cIdx) => (
                              <TableCell key={cIdx} sx={{ color: '#4B5563', py: 1.2, px: 2 }}>
                                {cell.links && cell.links.length > 0 ? (
                                  <MuiLink href={cell.links[0]} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600, color: '#4F46E5', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                    {cell.text} ↗
                                  </MuiLink>
                                ) : (
                                  cell.text
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            }

            if (section.type === 'links') {
              return (
                <Box key={sIdx} sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', borderLeft: '4px solid #4F46E5', pl: 1.5, mb: 1.5 }}>
                    🔗 {section.title}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#4F46E5' }}>
                          <TableCell sx={{ fontWeight: 700, color: 'white', py: 1.5, px: 2, width: '60%' }}>Link Name</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'white', py: 1.5, px: 2 }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {section.links.map((link, lIdx) => {
                          const isMain = link.name.toLowerCase().includes('apply online') || link.name.toLowerCase().includes('download notification');
                          return (
                            <TableRow key={lIdx} sx={{ bgcolor: lIdx % 2 === 0 ? 'white' : '#F8FAFC', '&:hover': { bgcolor: '#F1F5F9' } }}>
                              <TableCell sx={{ fontWeight: 600, color: '#374151', py: 1.2, px: 2 }}>
                                {link.name}
                              </TableCell>
                              <TableCell sx={{ py: 1, px: 2 }}>
                                {link.url ? (
                                  <Button
                                    variant={isMain ? "contained" : "outlined"}
                                    size="small"
                                    component={MuiLink}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      borderRadius: 1.5,
                                      fontSize: '0.75rem',
                                      ...(isMain && link.name.toLowerCase().includes('apply') ? {
                                        bgcolor: '#059669',
                                        '&:hover': { bgcolor: '#047857' }
                                      } : {}),
                                      ...(isMain && link.name.toLowerCase().includes('notification') ? {
                                        bgcolor: '#DC2626',
                                        '&:hover': { bgcolor: '#B91C1C' }
                                      } : {})
                                    }}
                                  >
                                    {link.actionText || 'Click Here'} ↗
                                  </Button>
                                ) : (
                                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                                    Link not available
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            }

            return null;
          })
        )}
      </Box>
    );
  }

  function loadAlerts() {
    setLoading(true);
    setError('');
    let statusQuery = '';
    if (filterTab === 1) statusQuery = '?status=active';
    if (filterTab === 2) statusQuery = '?status=drafted';

    request(`/api/admin/live-alerts${statusQuery}`)
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
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setSelectedState('All States');
    setSortOption('date-desc');
    loadAlerts();
  }, [filterTab]);

  async function handleSync() {
    setSyncing(true);
    addToast('Scraping fresh RSS feeds in background...', 'info');
    try {
      const res = await request('/api/admin/live-alerts/trigger', { method: 'POST' });
      if (res.success) {
        addToast(res.message || 'Alerts synced successfully!', 'success');
        loadAlerts();
      } else {
        addToast(res.message || 'Sync failed', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Sync connection failed', 'error');
    } finally {
      setSyncing(false);
    }
  }

  async function handleDraftPost(alert) {
    setDraftingId(alert._id);
    addToast(`Gemini is writing a 1,200-word post for "${alert.title}"...`, 'info');
    try {
      const res = await request(`/api/admin/live-alerts/${alert._id}/draft`, { method: 'POST' });
      if (res.success && res.postId) {
        addToast('AI Draft Created Successfully! Redirecting...', 'success');
        navigate(`/admin/posts/${res.postId}/edit`);
      } else {
        addToast(res.message || 'AI Generation failed', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to draft post', 'error');
    } finally {
      setDraftingId(null);
    }
  }

  const uniqueStates = ['All States', ...new Set(alerts.map(a => a.state || 'Central/All India'))].sort();
  const uniqueCategories = ['All Categories', ...new Set(alerts.map(a => a.category || 'Latest Job'))].sort();

  const filteredAlerts = alerts.filter(alert => {
    const titleMatch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (alert.boardName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = selectedCategory === 'All Categories' || alert.category === selectedCategory;
    const stateMatch = selectedState === 'All States' || (alert.state || 'Central/All India') === selectedState;
    return titleMatch && categoryMatch && stateMatch;
  });

  const sortedAlerts = useMemo(() => {
    const sorted = [...filteredAlerts];
    if (sortOption === 'date-desc') {
      sorted.sort((a, b) => new Date(b.parsedPostDate || b.createdAt) - new Date(a.parsedPostDate || a.createdAt));
    } else if (sortOption === 'date-asc') {
      sorted.sort((a, b) => new Date(a.parsedPostDate || a.createdAt) - new Date(b.parsedPostDate || b.createdAt));
    } else if (sortOption === 'board-asc') {
      sorted.sort((a, b) => (a.boardName || '').localeCompare(b.boardName || ''));
    } else if (sortOption === 'board-desc') {
      sorted.sort((a, b) => (b.boardName || '').localeCompare(a.boardName || ''));
    } else if (sortOption === 'deadline-asc') {
      const parseLastDate = (dStr) => {
        if (!dStr || dStr === 'N/A') return new Date(8640000000000000);
        const parts = dStr.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else if (parts[0].length === 4) {
            return new Date(dStr);
          }
        }
        const d = new Date(dStr);
        return isNaN(d.getTime()) ? new Date(8640000000000000) : d;
      };
      sorted.sort((a, b) => parseLastDate(a.lastDate) - parseLastDate(b.lastDate));
    }
    return sorted;
  }, [filteredAlerts, sortOption]);

  return (
    <>
      {/* Header bar */}
      <Box sx={{
        px: { xs: 2, md: 4 }, py: 2.5, bgcolor: 'white',
        borderBottom: '1px solid', borderColor: '#ECECEC',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Live Student Alerts</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3 }}>
              Monitor and auto-draft blog posts from live Sarkari job and exam notifications.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          onClick={handleSync}
          disabled={syncing || loading}
          startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
          sx={{ fontWeight: 600, borderRadius: 2, px: { xs: 2, md: 3 }, bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
        >
          {syncing ? 'Syncing...' : 'Sync Feeds'}
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white', px: { xs: 2, md: 4 } }}>
        <Tabs value={filterTab} onChange={(e, v) => setFilterTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}>
          <Tab label="All Alerts" />
          <Tab label="Active Only" />
          <Tab label="Drafted Only" />
        </Tabs>
      </Box>

      {/* Search and Filters Bar */}
      <Box sx={{
        px: { xs: 2, md: 4 }, py: 2, bgcolor: '#F9FAFB',
        borderBottom: '1px solid', borderColor: '#ECECEC',
        display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center'
      }}>
        <TextField
          placeholder="Search by title or board..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: 1, minWidth: 260,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              bgcolor: 'white'
            }
          }}
          InputProps={{
            startAdornment: (
              <span style={{ marginRight: 8, color: '#9CA3AF' }}>🔍</span>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="category-select-label">Category</InputLabel>
          <Select
            labelId="category-select-label"
            value={selectedCategory}
            label="Category"
            onChange={(e) => setSelectedCategory(e.target.value)}
            sx={{ borderRadius: 2.5, bgcolor: 'white' }}
          >
            {uniqueCategories.map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="state-select-label">State</InputLabel>
          <Select
            labelId="state-select-label"
            value={selectedState}
            label="State"
            onChange={(e) => setSelectedState(e.target.value)}
            sx={{ borderRadius: 2.5, bgcolor: 'white' }}
          >
            {uniqueStates.map(st => (
              <MenuItem key={st} value={st}>{st}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="sort-select-label">Sort By</InputLabel>
          <Select
            labelId="sort-select-label"
            value={sortOption}
            label="Sort By"
            onChange={(e) => setSortOption(e.target.value)}
            sx={{ borderRadius: 2.5, bgcolor: 'white' }}
          >
            <MenuItem value="date-desc">Newest First</MenuItem>
            <MenuItem value="date-asc">Oldest First</MenuItem>
            <MenuItem value="deadline-asc">Deadline (Soonest)</MenuItem>
            <MenuItem value="board-asc">Board Name (A-Z)</MenuItem>
            <MenuItem value="board-desc">Board Name (Z-A)</MenuItem>
          </Select>
        </FormControl>

        {(searchQuery || selectedCategory !== 'All Categories' || selectedState !== 'All States' || sortOption !== 'date-desc') && (
          <Button
            variant="text"
            size="small"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All Categories');
              setSelectedState('All States');
              setSortOption('date-desc');
            }}
            sx={{
              color: '#4F46E5', fontWeight: 600, textTransform: 'none',
              '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
            }}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 4 } }}>
        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { color: '#6B7280', fontWeight: 600, fontSize: '0.75rem', py: 1.5, px: 3, borderBottom: '1px solid #ECECEC' } }}>
                  <TableCell sx={{ width: '3%', px: 1 }}></TableCell>
                  <TableCell sx={{ width: '32%' }}>Job / Exam Vacancy Title</TableCell>
                  <TableCell sx={{ width: '10%' }}>Authority / Board</TableCell>
                  <TableCell sx={{ width: '10%' }}>State</TableCell>
                  <TableCell sx={{ width: '10%' }}>Category</TableCell>
                  <TableCell sx={{ width: '10%' }}>Last Date</TableCell>
                  <TableCell sx={{ width: '10%' }}>Status</TableCell>
                  <TableCell sx={{ width: '15%' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={40} sx={{ color: '#4F46E5', mb: 1 }} />
                      <Typography sx={{ color: '#6B7280', fontSize: '0.9rem' }}>Fetching live notifications...</Typography>
                    </TableCell>
                  </TableRow>
                ) : alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <NotificationIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1.5 }} />
                      <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>No alerts found</Typography>
                      <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 0.5 }}>
                        Click the 'Sync Feeds' button above to fetch recent alerts from Sarkari RSS feeds.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : sortedAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <NotificationIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1.5 }} />
                      <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>No matching alerts found</Typography>
                      <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 0.5 }}>
                        Try changing your search terms or filter settings.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAlerts.map((alert, i) => {
                    const isExpanded = expandedId === alert._id;
                    return (
                      <Fragment key={alert._id}>
                        <TableRow sx={{
                          '& td': { py: 1.8, px: 3, borderBottom: isExpanded ? 'none' : (i < sortedAlerts.length - 1 ? '1px solid #ECECEC' : 'none') },
                          '&:hover': { bgcolor: '#F9FAFB' },
                          bgcolor: isExpanded ? '#F8FAFC' : 'transparent',
                          transition: 'background 0.15s',
                        }}>
                          <TableCell sx={{ px: 1, py: 1.8, textAlign: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => setExpandedId(isExpanded ? null : alert._id)}
                              sx={{ color: '#6B7280' }}
                            >
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                                {alert.title}
                              </Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                                Sourced on {new Date(alert.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={alert.boardName || 'Govt Board'}
                              size="small"
                              sx={{
                                fontWeight: 700, fontSize: '0.65rem', height: 22,
                                bgcolor: '#EEF2FF', color: '#4F46E5', borderRadius: 1.5
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={alert.state || 'Central/All India'}
                              size="small"
                              sx={{
                                fontWeight: 700, fontSize: '0.65rem', height: 22,
                                bgcolor: alert.state === 'Central/All India' || !alert.state ? '#F3F4F6' : '#FEF3C7',
                                color: alert.state === 'Central/All India' || !alert.state ? '#374151' : '#B45309',
                                borderRadius: 1.5
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={alert.category || 'Latest Job'}
                              size="small"
                              sx={{
                                fontWeight: 700, fontSize: '0.65rem', height: 22,
                                borderRadius: 1.5,
                                bgcolor: 
                                  alert.category === 'Admit Card' ? '#ECFDF5' :
                                  alert.category === 'Result' ? '#F5F3FF' :
                                  alert.category === 'Answer Key' ? '#FDF2F8' :
                                  alert.category === 'Syllabus' ? '#FEF3C7' :
                                  alert.category === 'Latest Job' ? '#EFF6FF' : '#F3F4F6',
                                color: 
                                  alert.category === 'Admit Card' ? '#047857' :
                                  alert.category === 'Result' ? '#6D28D9' :
                                  alert.category === 'Answer Key' ? '#BE185D' :
                                  alert.category === 'Syllabus' ? '#B45309' :
                                  alert.category === 'Latest Job' ? '#1D4ED8' : '#4B5563',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: alert.lastDate?.includes('-') ? '#DC2626' : '#6B7280' }}>
                              {alert.lastDate}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={alert.status}
                              size="small"
                              icon={alert.status === 'drafted' ? <CheckCircleIcon style={{ fontSize: 14 }} /> : <HourglassIcon style={{ fontSize: 14 }} />}
                              sx={{
                                fontWeight: 600, fontSize: '0.7rem', height: 24, borderRadius: 1.5,
                                bgcolor: alert.status === 'drafted' ? '#D1FAE5' : '#FEF3C7',
                                color: alert.status === 'drafted' ? '#065F46' : '#92400E',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Tooltip title="View Official Source URL">
                                <IconButton
                                  component={MuiLink}
                                  href={alert.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="small"
                                  sx={{ color: '#6B7280', '&:hover': { color: '#111827', bgcolor: '#F3F4F6' } }}
                                >
                                  <LaunchIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>

                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleDraftPost(alert)}
                                disabled={draftingId !== null}
                                startIcon={draftingId === alert._id ? <CircularProgress size={12} color="inherit" /> : <WriteIcon />}
                                sx={{
                                  borderRadius: 1.5,
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  px: 1.5,
                                  color: alert.status === 'drafted' ? '#B45309' : '#4F46E5',
                                  borderColor: alert.status === 'drafted' ? '#F59E0B' : '#4F46E5',
                                  '&:hover': {
                                    bgcolor: alert.status === 'drafted' ? '#FFFBEB' : '#EEF2FF',
                                    borderColor: alert.status === 'drafted' ? '#D97706' : '#4F46E5'
                                  }
                                }}
                              >
                                {draftingId === alert._id ? 'Drafting...' : alert.status === 'drafted' ? 'Re-draft Post' : 'Draft Blog Post'}
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                            <TableCell colSpan={8} sx={{ p: 0, borderBottom: i < sortedAlerts.length - 1 ? '1px solid #ECECEC' : 'none' }}>
                              <Box sx={{ p: 3, display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                                {/* Left Content: Details Text Factsheet */}
                                <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 0 } }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    📖 Premium Job Blog Preview
                                  </Typography>
                                  <Paper variant="outlined" sx={{ p: 3, bgcolor: 'white', borderRadius: 2.5, maxHeight: 650, overflowY: 'auto' }}>
                                    {renderBlogContent(alert)}
                                  </Paper>
                                </Box>

                                {/* Right Content: Direct Official Actions */}
                                <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 0.5 }}>
                                    🔗 Official Direct Resources
                                  </Typography>

                                  {getDynamicActions(alert).map((act, actIdx) => (
                                    <Button
                                      key={actIdx}
                                      variant="outlined"
                                      component={MuiLink}
                                      href={act.url || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      disabled={!act.url}
                                      startIcon={act.icon}
                                      sx={{
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        fontWeight: 600,
                                        color: act.url ? act.color : '#9CA3AF',
                                        borderColor: act.url ? act.borderColor : '#E5E7EB',
                                        '&:hover': {
                                          bgcolor: act.url ? act.hoverBg : 'transparent',
                                          borderColor: act.url ? act.color : '#E5E7EB'
                                        }
                                      }}
                                    >
                                      {act.label}
                                    </Button>
                                  ))}


                                  <Box sx={{
                                    p: 2,
                                    borderRadius: 2.5,
                                    bgcolor: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5,
                                    mt: 1
                                  }}>
                                    <Typography variant="body2" sx={{ color: '#166534', fontWeight: 600, fontSize: '0.75rem' }}>
                                      💡 Ready to publish? Click below to generate a data-rich SEO Hinglish post with all these resources.
                                    </Typography>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={() => handleDraftPost(alert)}
                                      disabled={draftingId !== null}
                                      startIcon={draftingId === alert._id ? <CircularProgress size={12} color="inherit" /> : <WriteIcon />}
                                      sx={{
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '0.75rem',
                                        bgcolor: '#166534',
                                        '&:hover': { bgcolor: '#14532D' }
                                      }}
                                    >
                                      {draftingId === alert._id ? 'Drafting...' : alert.status === 'drafted' ? 'Re-draft Blog Post' : 'Draft Blog Post Now'}
                                    </Button>
                                  </Box>
                                </Box>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </>
  );
}
