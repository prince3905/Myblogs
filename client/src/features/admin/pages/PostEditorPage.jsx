import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Typography, TextField, Select, MenuItem, FormControl, InputLabel, Button, Grid, Alert, Box, Paper, Divider, FormControlLabel, Checkbox, CircularProgress, Chip, Collapse, IconButton, Tooltip, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ArrowBack, ExpandMore, ExpandLess, ContentCopy } from '@mui/icons-material';
import ImageUpload from '../../../components/ImageUpload';
import RichTextEditor from '../../../components/RichTextEditor';
import { useToast } from '../../../components/Toast';
import { request } from '../../../shared/lib/api';
import { calculateSeoScore } from '../../../shared/utils/seoAuditor';

const initialForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featuredImage: '',
  category: '',
  tags: '',
  status: 'draft',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  canonicalUrl: '',
  sponsored: false,
  affiliateDisclosure: false,
  rating: '',
  videoUrl: ''
};

export default function PostEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStep, setAiStep] = useState('');
  const [aiProgress, setAiProgress] = useState(0);
  const [aiModel, setAiModel] = useState('gemini-pro-latest');
  const [aiLength, setAiLength] = useState('long');
  const [aiTone, setAiTone] = useState('informative');
  const [aiLanguage, setAiLanguage] = useState('hinglish');
  const [aiCommand, setAiCommand] = useState('');
  const [seoDrawerOpen, setSeoDrawerOpen] = useState(false);
  const [kwData, setKwData] = useState(null);
  const [serpData, setSerpData] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [ytLoading, setYtLoading] = useState(false);
  const [imagePromptText, setImagePromptText] = useState('');

  // Canvas Maker State variables
  const [showCanvasMaker, setShowCanvasMaker] = useState(false);
  const [canvasEngTitle, setCanvasEngTitle] = useState('');
  const [canvasHindiTitle, setCanvasHindiTitle] = useState('');
  const [canvasTheme, setCanvasTheme] = useState('bank');
  const [isGeneratingCanvas, setIsGeneratingCanvas] = useState(false);

  const handleOpenCanvasMaker = () => {
    if (!form.title.trim()) {
      addToast('Pehle post ka title daalhein!', 'error');
      return;
    }
    const mainTitle = form.title.split(/[:|]/)[0].trim();
    setCanvasEngTitle(mainTitle);
    setCanvasHindiTitle('ऑनलाइन आवेदन शुरू - यहाँ से भरें');
    setCanvasTheme(form.category === 'Sarkari Jobs & Exams' ? 'bank' : 'violet');
    setShowCanvasMaker(true);
  };

  const canvasRef = useCallback((node) => {
    if (node !== null) {
      const ctx = node.getContext('2d');
      const width = node.width;
      const height = node.height;
      
      // Clear
      ctx.clearRect(0, 0, width, height);

      // Gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (canvasTheme === 'bank') {
        grad.addColorStop(0, '#1e3a8a');
        grad.addColorStop(1, '#0f172a');
      } else if (canvasTheme === 'police') {
        grad.addColorStop(0, '#991b1b');
        grad.addColorStop(1, '#450a0a');
      } else if (canvasTheme === 'defense') {
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(1, '#090514');
      } else if (canvasTheme === 'orange') {
        grad.addColorStop(0, '#c2410c');
        grad.addColorStop(1, '#1e293b');
      } else {
        grad.addColorStop(0, '#581c87');
        grad.addColorStop(1, '#0f051d');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Accent triangles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(width * 0.45, height);
      ctx.lineTo(0, height * 0.55);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(width, 0, width * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Brand Title text
      ctx.fillStyle = '#10b981';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('DIGITAL HOME BLOG', 60, 90);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '500 16px sans-serif';
      ctx.fillText('Official Job Alert Portal', 60, 120);

      // Text wrapping function helper
      const wrapText = (context, text, x, y, lineGap, maxW) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          let metrics = context.measureText(testLine);
          if (metrics.width > maxW && n > 0) {
            context.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineGap;
          } else {
            line = testLine;
          }
        }
        context.fillText(line, x, currentY);
        return currentY;
      };

      // Draw English Title
      ctx.fillStyle = '#facc15';
      ctx.font = '800 48px sans-serif';
      let textY = 240;
      textY = wrapText(ctx, canvasEngTitle.toUpperCase(), 60, textY, 60, width - 120);

      // Draw Hindi Subtitle
      textY += 60;
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 36px sans-serif';
      textY = wrapText(ctx, canvasHindiTitle, 60, textY, 48, width - 120);

      // Draw Badges
      textY += 90;
      
      const drawBadge = (label, x, y, color) => {
        ctx.font = '800 16px sans-serif';
        const textWidth = ctx.measureText(label).width;
        const paddingH = 18;
        const paddingV = 10;
        const badgeW = textWidth + paddingH * 2;
        const badgeH = 16 + paddingV * 2;

        ctx.fillStyle = color;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y - 18, badgeW, badgeH, 8);
        } else {
          ctx.rect(x, y - 18, badgeW, badgeH);
        }
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.fillText(label, x + paddingH, y + 8);
        return badgeW;
      };

      const w1 = drawBadge('Official Form', 60, textY, '#facc15');
      drawBadge('Time-Saving', 60 + w1 + 15, textY, '#10b981');
    }
  }, [canvasEngTitle, canvasHindiTitle, canvasTheme]);

  const seoAudit = useMemo(() => {
    return calculateSeoScore(form, kwData);
  }, [form.title, form.content, form.seoTitle, form.seoDescription, form.slug, form.tags, kwData]);
  const isEdit = Boolean(id);

  const handleCopyPrompt = useCallback(async () => {
    if (!form.title.trim()) {
      addToast('Pehle title daal!', 'error');
      return;
    }
    const longTails = (kwData?.filtered || [])
      .filter(k => k.type === 'long-tail' || k.type === 'question-based')
      .slice(0, 5).map(k => k.keyword).join(', ');
    const tags = form.tags || (kwData?.filtered || []).slice(0, 5).map(k => k.keyword).join(', ');
    const cat = form.category || kwData?.category || 'Tech & Tutorials';
    const prompt = `Act as an SEO Expert. Write an article on Title: '${form.title}'. Use Focus Keyword: '${form.title}'. Naturally integrate these Long-tail Keywords: ${longTails || '[NOT FOUND — run Keyword Research first]'}. Category: ${cat}. Generate 5 meta tags and a 150-character SEO description. Keep the tone human-written, engaging, and strict reporting style.`;
    try {
      await navigator.clipboard.writeText(prompt);
      addToast('ChatGPT prompt copied! 📋', 'success');
    } catch {
      addToast('Clipboard access nahi hua, manually copy kar', 'error');
    }
  }, [form.title, form.tags, form.category, kwData, addToast]);

  async function loadKeywordResearch(topic) {
    try {
      const res = await request('/api/admin/topics/explore?q=' + encodeURIComponent(topic));
      const kr = res?.success === true ? res.data?.keywordResearch : res?.keywordResearch;
      if (kr?.filtered?.length) setKwData(kr);
    } catch {}
  }

  useEffect(() => {
    const state = window.history.state?.usr;
    if (state?.preselectedTitle) {
      setForm(prev => {
        if (prev.title) return prev;
        return { ...prev, title: state.preselectedTitle, slug: makeSlug(state.preselectedTitle) };
      });
      loadKeywordResearch(state.preselectedTitle);
    }
    if (state?.serpData) {
      setSerpData(state.serpData);
    }
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    request(`/api/admin/posts/${id}`)
      .then((post) => setForm({
        ...post,
        tags: (post.tags || []).join(', '),
        seoKeywords: (post.seoKeywords || []).join(', ')
      }))
      .catch((err) => setError(err.message));
  }, [id, isEdit]);

  function makeSlug(str) {
    let slug = str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!slug || slug.length < 2) slug = 'post-' + Date.now().toString(36);
    return slug;
  }
  function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleAIWrite() {
    if (!form.title.trim()) {
      addToast('Pehle title to daal bhai!', 'error');
      return;
    }
    const finalTitle = form.title.replace(/\b\w/g, c => c.toUpperCase());
    updateField('title', finalTitle);
    setAiLoading(true);
    setAiProgress(5);
    setAiStep('🔍 Analyzing title & performing keyword research...');

    const steps = [
      { text: '🧠 Gemini is thinking & structuring outline...', progress: 20 },
      { text: '✍️ Writing content in conversational Hinglish (non-robotic)...', progress: 45 },
      { text: '🖼️ Fetching relevant featured stock image...', progress: 70 },
      { text: '🚀 Performing post-processing & checking SEO rules...', progress: 90 }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setAiStep(steps[currentStep].text);
        setAiProgress(steps[currentStep].progress);
        currentStep++;
      }
    }, 7000);

    try {
      let serpInject = '';
      if (serpData) {
        serpInject = `\n\n[SERP ANALYSIS — USE AS CONTENT BLUEPRINT]\nTarget word count: ${serpData.totalRecommendedWords} words\nRecommended LSI keywords: ${serpData.recommendedLSI.join(', ')}\nSuggested heading structure:\n${serpData.suggestedHeadings.map((h, i) => `${i + 1}. ${h}`).join('\n')}\nSERP features: Featured snippet: ${serpData.serpFeatures.featuredSnippet}, People Also Ask: ${serpData.serpFeatures.peopleAlsoAsk} questions`;
      }
      const finalCommand = aiCommand ? `${aiCommand}\n${serpInject}`.trim() : serpInject.trim();
      const data = await request('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ title: finalTitle, model: aiModel, length: aiLength, tone: aiTone, language: aiLanguage, command: finalCommand })
      });
      const generatedTitle = data.title || finalTitle;
      updateField('title', generatedTitle);
      const plainText = stripHtml(data.content || '');

      updateField('content', data.content || '');
      updateField('slug', data.slug || makeSlug(generatedTitle));
      updateField('excerpt', data.summary || plainText.slice(0, 250));
      updateField('seoTitle', data.seoTitle || generatedTitle.slice(0, 70));
      updateField('seoDescription', data.seoDescription || data.summary || plainText.slice(0, 155));
      updateField('category', data.category || 'Tech & Tutorials');
      if (data.keywords?.length) {
        const kw = data.keywords.join(', ');
        updateField('tags', kw);
        updateField('seoKeywords', kw);
        try {
          const res = await request('/api/admin/generate-thumbnail', {
            method: 'POST',
            body: JSON.stringify({ title: finalTitle })
          });
          if (res?.imageUrl) updateField('featuredImage', res.imageUrl);
        } catch {}
      }
      loadKeywordResearch(finalTitle);
      addToast('AI ne sab bhar diya! Keyword research bhi ho gaya! 🎉', 'success');
    } catch (err) {
      const msg = err?.message || 'Kuch gadbad hua';
      if (msg.includes('API_KEY not set')) addToast('API key set nahi hai .env me', 'error');
      else if (msg.includes('quota exceeded')) addToast('API quota khatam, billing check karo', 'error');
      else if (msg.includes('high demand')) addToast('AI model busy hai, thodi der me try kar', 'error');
      else if (msg.includes('timeout') || msg.includes('taking too long')) addToast('AI slow hai, dubara try kar', 'error');
      else addToast(msg.slice(0, 80), 'error');
    } finally {
      clearInterval(interval);
      setAiLoading(false);
      setAiStep('');
      setAiProgress(0);
    }
  }

  async function handleConvertYoutube() {
    if (!youtubeUrl.trim()) return;
    setYtLoading(true);
    setError('');
    
    // Simulate loading progress steps
    const interval = setInterval(() => {
      setAiProgress(prev => Math.min(prev + 5, 95));
    }, 1500);

    try {
      addToast('YouTube video transcribing starts...', 'info');
      const data = await request('/api/ai/convert-youtube', {
        method: 'POST',
        body: JSON.stringify({ videoUrl: youtubeUrl })
      });
      
      const generatedTitle = data.title || 'YouTube Video Post';
      const plainText = stripHtml(data.content || '');

      updateField('title', generatedTitle);
      updateField('content', data.content || '');
      updateField('slug', data.slug || makeSlug(generatedTitle));
      updateField('excerpt', data.summary || plainText.slice(0, 250));
      updateField('seoTitle', data.seoTitle || generatedTitle.slice(0, 70));
      updateField('seoDescription', data.seoDescription || data.summary || plainText.slice(0, 155));
      updateField('category', data.category || 'Technology');
      updateField('videoUrl', data.videoUrl || youtubeUrl);
      
      if (data.featuredImage) {
        updateField('featuredImage', data.featuredImage);
      }

      if (data.keywords?.length) {
        const kw = data.keywords.join(', ');
        updateField('tags', kw);
        updateField('seoKeywords', kw);
      }
      
      setYoutubeUrl('');
      addToast('YouTube video converted successfully to Hinglish Blog Post! 🎥🎉', 'success');
    } catch (err) {
      setError(err.message || 'YouTube conversion failed');
      addToast(err.message || 'YouTube conversion failed', 'error');
    } finally {
      clearInterval(interval);
      setYtLoading(false);
      setAiProgress(0);
    }
  }

  async function handleEditorIndexPing() {
    setYtLoading(true);
    try {
      const res = await request(`/api/admin/posts/${id}/index-ping`, { method: 'POST' });
      if (res.success) {
        addToast(res.message || 'Google Indexing request sent successfully!', 'success');
      } else {
        addToast(res.message || 'Google Indexing request failed.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to ping Google Indexing API', 'error');
    } finally {
      setYtLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const payload = {
      ...form,
      tags: form.tags,
      seoKeywords: form.seoKeywords,
      seoScore: seoAudit.score
    };

    try {
      if (isEdit) {
        await request(`/api/admin/posts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await request('/api/admin/posts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  }

  const getFixAction = (suggestion) => {
    const text = suggestion.toLowerCase();
    const kw = seoAudit.focusKeyword || '';
    if (!kw) return null;

    if (text.includes('title me apna focus keyword') || (text.includes('title') && text.includes('focus keyword'))) {
      return {
        label: 'Fix Title',
        handler: () => {
          const cap = kw.replace(/\b\w/g, l => l.toUpperCase());
          const currentTitle = form.title || '';
          if (currentTitle.toLowerCase().includes(kw.toLowerCase())) {
            addToast('Already fixed: Title already contains focus keyword!', 'error');
            return;
          }
          const newTitle = `${cap} - ${currentTitle}`;
          updateField('title', newTitle);
          addToast('Title optimized with focus keyword!', 'success');
        }
      };
    }
    if (text.includes('url slug') || (text.includes('slug') && text.includes('focus keyword'))) {
      return {
        label: 'Fix Slug',
        handler: () => {
          const slugKeyword = kw.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const newSlug = form.slug || '';
          if (newSlug.toLowerCase().includes(slugKeyword)) {
            addToast('Already fixed: URL Slug already optimized with focus keyword!', 'error');
            return;
          }
          updateField('slug', slugKeyword);
          addToast('URL Slug optimized with focus keyword!', 'success');
        }
      };
    }
    if (text.includes('pehli 2-3 lines') || text.includes('introduction') || text.includes('intro')) {
      return {
        label: 'Fix Intro',
        handler: () => {
          let content = form.content || '';
          const cap = kw.replace(/\b\w/g, l => l.toUpperCase());
          
          // Strip HTML to see if keyword is already present in the introduction text
          const cleanText = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
          const introPart = cleanText.slice(0, 400).toLowerCase();
          if (introPart.includes(kw.toLowerCase())) {
            addToast('Already fixed: Introduction already contains focus keyword!', 'error');
            return;
          }

          if (content.includes('<p>')) {
            content = content.replace('<p>', `<p>In this article, we look at <strong>${cap}</strong> and everything related to it. `);
          } else {
            content = `<p>In this article, we look at <strong>${cap}</strong> and everything related to it.</p>${content}`;
          }
          updateField('content', content);
          addToast('Focus keyword added to introduction!', 'success');
        }
      };
    }
    if (text.includes('h2 subheading') || text.includes('h2')) {
      return {
        label: 'Fix H2',
        handler: () => {
          let content = form.content || '';
          const cap = kw.replace(/\b\w/g, l => l.toUpperCase());
          
          // Check if any H2 already has the focus keyword
          const h2Matches = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
          const hasKeywordInH2 = h2Matches.some(h2 => h2.toLowerCase().replace(/<[^>]*>/g, '').includes(kw.toLowerCase()));
          if (hasKeywordInH2) {
            addToast('Already fixed: An H2 subheading already contains focus keyword!', 'error');
            return;
          }

          if (content.includes('<h2>')) {
            content = content.replace('<h2>', `<h2>${cap}: `);
          } else {
            const pIndex = content.indexOf('</p>');
            if (pIndex !== -1) {
              content = content.slice(0, pIndex + 4) + `\n<h2>Everything You Need to Know About ${cap}</h2>\n` + content.slice(pIndex + 4);
            } else {
              content = `<h2>Everything You Need to Know About ${cap}</h2>\n` + content;
            }
          }
          updateField('content', content);
          addToast('H2 Heading optimized with focus keyword!', 'success');
        }
      };
    }
    if (text.includes('keyword density') || text.includes('density') || (text.includes('body text') && text.includes('focus keyword')) || text.includes('body text me focus keyword ko naturally')) {
      return {
        label: 'Fix Density',
        handler: () => {
          if (seoAudit.checks.keywordDensityOk) {
            addToast('Already fixed: Keyword density is already optimal!', 'error');
            return;
          }

          let content = form.content || '';
          const cap = kw.replace(/\b\w/g, l => l.toUpperCase());
          
          // Clean content text to count words
          const cleanText = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
          const words = cleanText.split(/\s+/).filter(Boolean);
          const wCount = words.length;

          // How many times does focus keyword currently appear?
          const flexiblePattern = kw
            .split(/[\s\/-]+/)
            .filter(Boolean)
            .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('[\\s\\/-]+');
          const regex = new RegExp('\\b' + flexiblePattern + '\\b', 'gi');
          const matches = cleanText.match(regex);
          const currentCount = matches ? matches.length : 0;

          // Target count for ~0.9% density
          const targetCount = Math.max(3, Math.ceil(wCount * 0.009));
          const needed = targetCount - currentCount;

          if (needed <= 0) {
            addToast('Already fixed: Keyword density is already optimal!', 'error');
            return;
          }

          const parts = content.split('</p>');
          if (parts.length > 2) {
            let inserted = 0;
            let updated = '';
            for (let idx = 0; idx < parts.length - 1; idx++) {
              updated += parts[idx];
              // Only insert if we still need more and alternate paragraphs
              if (inserted < needed && idx % 2 === 0) {
                const injectText = ` (Learn more about <strong>${cap}</strong>)`;
                if (!parts[idx].includes(injectText)) {
                  updated += injectText;
                  inserted++;
                }
              }
              updated += '</p>';
            }
            updated += parts[parts.length - 1];
            content = updated;
            
            // If we still need more (e.g. not enough paragraphs), append at the end
            if (inserted < needed) {
              const remaining = needed - inserted;
              for (let r = 0; r < remaining; r++) {
                content += ` <p>Explore all the details and specs of <strong>${cap}</strong> inside this complete portal report.</p>`;
              }
            }
          } else {
            for (let r = 0; r < needed; r++) {
              content += ` <p>Read more facts and news regarding <strong>${cap}</strong> here.</p>`;
            }
          }

          updateField('content', content);
          addToast('Focus keyword naturally integrated to reach optimal density!', 'success');
        }
      };
    }
    if (text.includes('table') || text.includes('comparison-table') || text.includes('data-table')) {
      return {
        label: 'Insert Table',
        handler: () => {
          let content = form.content || '';
          const cap = kw.replace(/\b\w/g, l => l.toUpperCase());

          const hasTable = content.toLowerCase().includes('<table') || 
                            content.toLowerCase().includes('class="comparison-table"') || 
                            content.toLowerCase().includes('class="data-table"') || 
                            /\|[^\n]+\|\r?\n\s*\|[-:| ]+\|\r?\n\s*\|[^\n]+\|/.test(content);
          
          if (hasTable) {
            addToast('Already fixed: A data / specs table already exists in the content!', 'error');
            return;
          }

          // Styled HTML table compatible with ReactQuill and custom blot
          const tableHtml = `
<div class="ql-table-embed">
  <table class="comparison-table" style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #374151; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">
    <thead>
      <tr style="background-color: #F9FAFB; border-bottom: 2px solid #E5E7EB;">
        <th style="border: 1px solid #E5E7EB; padding: 12px 16px; text-align: left; font-weight: 600; color: #111827;">Key Parameter</th>
        <th style="border: 1px solid #E5E7EB; padding: 12px 16px; text-align: left; font-weight: 600; color: #111827;">Value & Details</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; font-weight: 600; color: #111827; background-color: #ffffff;">Primary Topic</td>
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; color: #374151; background-color: #ffffff;">${cap}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; font-weight: 600; color: #111827; background-color: #F9FAFB;">Category Classification</td>
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; color: #374151; background-color: #F9FAFB;">${form.category || 'Sarkari Jobs & Exams'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; font-weight: 600; color: #111827; background-color: #ffffff;">Information Authenticity</td>
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; color: #059669; font-weight: 700; background-color: #ffffff;">✓ 100% Genuine & Verified</td>
      </tr>
      <tr style="border-bottom: none;">
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; font-weight: 600; color: #111827; background-color: #F9FAFB;">Last Updated On</td>
        <td style="border: 1px solid #E5E7EB; padding: 12px 16px; color: #374151; background-color: #F9FAFB;">2026 Live Portal</td>
      </tr>
    </tbody>
  </table>
</div>
`;
          const lastPIndex = content.lastIndexOf('<p>');
          if (lastPIndex !== -1) {
            content = content.slice(0, lastPIndex) + tableHtml + content.slice(lastPIndex);
          } else {
            content += tableHtml;
          }
          updateField('content', content);
          addToast('SEO Spec Table inserted successfully!', 'success');
        }
      };
    }
    if (text.includes('meta description') || text.includes('seo description')) {
      return {
        label: 'Fix Meta',
        handler: () => {
          const cap = kw.replace(/\b\w/g, l => l.toUpperCase());
          let currentDesc = form.seoDescription || form.excerpt || '';
          
          if (currentDesc.toLowerCase().includes(kw.toLowerCase()) && currentDesc.length >= 100 && currentDesc.length <= 165) {
            addToast('Already fixed: SEO description already optimized!', 'error');
            return;
          }

          if (!currentDesc.toLowerCase().includes(kw.toLowerCase())) {
            currentDesc = `${cap}: ${currentDesc}`;
          }
          if (currentDesc.length < 110) {
            currentDesc = `${currentDesc} Get all the detailed updates and specifications about ${kw} on our official information blog.`;
          }
          if (currentDesc.length > 155) {
            currentDesc = currentDesc.slice(0, 152) + '...';
          }
          updateField('seoDescription', currentDesc);
          addToast('SEO Description optimized!', 'success');
        }
      };
    }
    return null;
  };

  return (
    <>
      <Box sx={{
        px: { xs: 2, md: 4 }, py: 2.5, bgcolor: 'white',
        borderBottom: '1px solid', borderColor: '#ECECEC',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button component={Link} to="/admin" sx={{ minWidth: 0, px: 1, color: '#6B7280', borderRadius: 2 }}>
            <ArrowBack />
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>{isEdit ? 'Edit Post' : 'New Post'}</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3 }}>{isEdit ? 'Update your article content and settings' : 'Create a new article for your blog'}</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 4 } }}>
        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

        {!isEdit && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 3,
              border: '1px dashed #10B981',
              bgcolor: '#F0FDF4',
            }}
          >
            <Typography variant="subtitle1" sx={{ color: '#065F46', fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              🎥 Convert YouTube Video to Hinglish Blog Post
            </Typography>
            <Typography variant="body2" sx={{ color: '#15803D', mb: 2 }}>
              Paste a YouTube video URL to automatically fetch its transcripts, generate a complete long-form SEO post, and set the default featured thumbnail.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={ytLoading}
                sx={{
                  bgcolor: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              <Button
                variant="contained"
                color="success"
                onClick={handleConvertYoutube}
                disabled={ytLoading || !youtubeUrl.trim()}
                sx={{
                  minWidth: 150,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' }
                }}
              >
                {ytLoading ? <CircularProgress size={20} color="inherit" /> : 'Convert to Blog'}
              </Button>
            </Box>
            {ytLoading && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress variant="determinate" value={aiProgress} color="success" sx={{ height: 6, borderRadius: 3 }} />
                <Typography variant="caption" sx={{ color: '#047857', mt: 0.5, display: 'block' }}>
                  Processing transcript & drafting Hinglish content... {aiProgress}%
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* Left Column - Main Content */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, mb: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3 }}>
                <TextField
                  fullWidth
                  label="Post Title"
                  value={form.title}
                  onChange={(e) => {
                    updateField('title', e.target.value);
                    if (!isEdit) updateField('slug', makeSlug(e.target.value));
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
                    updateField('title', val);
                    if (!isEdit) updateField('slug', makeSlug(val));
                  }}
                  required
                  InputProps={{ sx: { fontSize: '1.25rem', fontWeight: 500 } }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAIWrite}
                  disabled={aiLoading || !form.title.trim()}
                  sx={{ minWidth: 120, height: 56, flexShrink: 0, borderRadius: 2 }}
                >
                  {aiLoading ? <CircularProgress size={20} /> : '✨ AI Write'}
                </Button>
                <Tooltip title="Copy ChatGPT Master Context">
                  <Button
                    variant="outlined"
                    onClick={handleCopyPrompt}
                    disabled={!form.title.trim()}
                    sx={{ minWidth: 44, height: 56, flexShrink: 0, borderRadius: 2, px: 1 }}
                  >
                    <ContentCopy sx={{ fontSize: 18, mr: 0.5 }} /> ChatGPT
                  </Button>
                </Tooltip>
              </Box>

              {aiLoading && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534', mb: 0.5 }}>
                    ✨ AI Writer is working...
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#15803d', mb: 1.5 }}>
                    {aiStep}
                  </Typography>
                  <LinearProgress variant="determinate" value={aiProgress} color="success" sx={{ height: 6, borderRadius: 3 }} />
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Language</InputLabel>
                  <Select value={aiLanguage} label="Language" onChange={(e) => setAiLanguage(e.target.value)}>
                    <MenuItem value="hinglish">Hinglish 🔥</MenuItem>
                    <MenuItem value="hindi">Hindi</MenuItem>
                    <MenuItem value="english">English</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Tone</InputLabel>
                  <Select
                    value={aiTone}
                    label="Tone"
                    onChange={(e) => setAiTone(e.target.value)}
                  >
                    <MenuItem value="informative">Informative</MenuItem>
                    <MenuItem value="funny">Funny</MenuItem>
                    <MenuItem value="professional">Professional</MenuItem>
                    <MenuItem value="beginner">Beginner-friendly</MenuItem>
                    <MenuItem value="critical">Critical/Op-ed</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={aiModel}
                    label="Model"
                    onChange={(e) => setAiModel(e.target.value)}
                  >
                    <MenuItem disabled>— Gemini (Free, Working) —</MenuItem>
                    <MenuItem value="gemini-pro-latest">Gemini Pro (High Quality) 🌟</MenuItem>
                    <MenuItem value="gemini-flash-latest">Gemini Flash 🪐</MenuItem>
                    <MenuItem disabled>— Groq (Free, Working) —</MenuItem>
                    <MenuItem value="llama-3.3-70b-versatile">Groq Llama 3.3 70B ⚡</MenuItem>
                    <MenuItem value="llama-3.1-8b-instant">Groq Llama 3.1 8B ⚡</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Length</InputLabel>
                  <Select
                    value={aiLength}
                    label="Length"
                    onChange={(e) => setAiLength(e.target.value)}
                  >
                    <MenuItem value="short">Short</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="long">Long</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Custom prompt (optional)"
                value={aiCommand}
                onChange={(e) => setAiCommand(e.target.value)}
                placeholder="e.g., Focus on React hooks, include real-world examples..."
                sx={{ mb: 2 }}
              />

              {serpData && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f5f3ff', borderRadius: 2, border: '1px solid #ddd6fe' }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#6d28d9', mb: 0.5 }}>
                    ⚡ SERP Analysis: {serpData.totalRecommendedWords} words • {serpData.recommendedLSI.length} LSI keywords
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: '#7c3aed', mb: 0.5 }}>
                    Headings: {serpData.suggestedHeadings.join(' → ')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {serpData.recommendedLSI.slice(0, 5).map((lsi, i) => (
                      <Chip key={i} label={lsi} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#ede9fe', color: '#5b21b6' }} />
                    ))}
                  </Box>
                </Box>
              )}

              {kwData?.filtered?.length > 0 && (
                <Box sx={{ mb: 3, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', mb: 1 }}>
                    📊 Keyword Research: {kwData.filtered.length} keywords — Focus, Short-Tail, Long-Tail & LSI
                  </Typography>
                  {['short-tail', 'mid-tail', 'long-tail', 'lsi', 'question-based'].filter(t => kwData.filtered.some(k => k.type === t)).map(type => {
                    const typeColor = { 'short-tail': '#dc2626', 'mid-tail': '#ea580c', 'long-tail': '#2563eb', 'lsi': '#7c3aed', 'question-based': '#059669' }[type] || '#6b7280';
                    const typeLabel = { 'short-tail': '🔴 FOCUS / Short-Tail', 'mid-tail': '🟠 Mid-Tail', 'long-tail': '🔵 Long-Tail', 'lsi': '🟣 LSI', 'question-based': '🟢 Question' }[type] || type;
                    const items = kwData.filtered.filter(k => k.type === type);
                    return (
                      <Box key={type} sx={{ mb: 0.75 }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: typeColor, mb: 0.25 }}>
                          {typeLabel} ({items.length})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {items.slice(0, 3).map((kw, i) => (
                            <Chip key={i} label={kw.keyword} size="small" sx={{
                              height: 20, fontSize: '0.65rem', fontWeight: type === 'short-tail' ? 700 : 400,
                              bgcolor: type === 'short-tail' ? '#fee2e2' : type === 'long-tail' ? '#dbeafe' : type === 'lsi' ? '#f3e8ff' : type === 'question-based' ? '#d1fae5' : '#fef3c7',
                              color: typeColor,
                              border: type === 'short-tail' ? '1.5px solid #dc2626' : 'none',
                            }} />
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
              
              <TextField
                fullWidth
                label="Slug (auto-generated, editable)"
                value={form.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                placeholder="leave-empty-for-auto-generation"
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                Content
              </Typography>
              <RichTextEditor value={form.content} onChange={(val) => updateField('content', val)} />
            </Paper>

            {/* Excerpt */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                Excerpt
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="A short summary of your post..."
                value={form.excerpt}
                onChange={(e) => updateField('excerpt', e.target.value)}
                required
                inputProps={{ maxLength: 3000 }}
                helperText={`${form.excerpt ? form.excerpt.length : 0}/3000 characters. This will appear in post previews and SEO description if not specified.`}
              />
            </Paper>
          </Grid>

          {/* Right Column - Settings */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Post Settings
              </Typography>

              {/* Featured Image */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Featured Image
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={async () => {
                      if (!form.title?.trim()) {
                        addToast('Pehle Title likho tabhi AI Image banegi!', 'error');
                        return;
                      }
                      addToast('AI Image generate ho rahi hai (Cloudinary par save ho rahi hai)... 🚀', 'info');
                      try {
                        const res = await request('/api/admin/generate-thumbnail', {
                          method: 'POST',
                          body: JSON.stringify({ title: form.title })
                        });
                        if (res?.imageUrl) {
                          updateField('featuredImage', res.imageUrl);
                          addToast('AI Thumbnail ban gaya aur Cloudinary par save ho gaya! 🎉', 'success');
                        } else {
                          addToast('Image generate nahi ho paayi', 'error');
                        }
                      } catch (err) {
                        addToast(err?.message || 'Server error', 'error');
                      }
                    }}
                    sx={{ minWidth: 80, height: 28, fontSize: '0.75rem', borderRadius: 2 }}
                  >
                    ✨ Magic
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={async () => {
                      if (!form.title?.trim()) {
                        addToast('Pehle Title likho tabhi prompt generate hoga!', 'error');
                        return;
                      }
                      addToast('AI Image Prompt generate ho raha hai... 🔍', 'info');
                      try {
                        const res = await request('/api/admin/get-image-prompt', {
                          method: 'POST',
                          body: JSON.stringify({ title: form.title })
                        });
                        if (res?.prompt) {
                          setImagePromptText(res.prompt);
                          addToast('AI Image Prompt taiyar hai! Niche se copy karein. 📋', 'success');
                        } else {
                          addToast('Prompt generate nahi ho paaya', 'error');
                        }
                      } catch (err) {
                        addToast(err?.message || 'Server error', 'error');
                      }
                    }}
                    sx={{ minWidth: 80, height: 28, fontSize: '0.75rem', borderRadius: 2 }}
                  >
                    📋 Prompt
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={async () => {
                      if (!form.content?.trim()) {
                        addToast('Pehle content likhein tabhi images fix hongi!', 'error');
                        return;
                      }
                      addToast('Images SEO fix ho rahi hai... 🔍', 'info');
                      try {
                        const res = await request('/api/admin/fix-images-seo', {
                          method: 'POST',
                          body: JSON.stringify({ content: form.content, title: form.title })
                        });
                        if (res?.success) {
                          updateField('content', res.content);
                          if (res.fixedCount > 0) {
                            addToast(`Success! Total ${res.fixedCount} images ka alt text fix kiya! 🎉`, 'success');
                          } else {
                            addToast('Sari images already optimized hain! No changes needed. ✅', 'success');
                          }
                        } else {
                          addToast('Image SEO fix nahi ho paayi', 'error');
                        }
                      } catch (err) {
                        addToast(err?.message || 'Server error', 'error');
                      }
                    }}
                    sx={{ minWidth: 90, height: 28, fontSize: '0.75rem', borderRadius: 2 }}
                  >
                    🖼️ Image SEO
                  </Button>
                </Box>
                <ImageUpload value={form.featuredImage} onChange={(val) => updateField('featuredImage', val)} />
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={handleOpenCanvasMaker}
                  sx={{ mt: 1.5, mb: 1, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                >
                  🎨 Design Custom Canvas Banner
                </Button>
                {imagePromptText && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      label="AI Image Prompt (Write/Edit here)"
                      value={imagePromptText}
                      onChange={(e) => setImagePromptText(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => {
                              navigator.clipboard.writeText(imagePromptText);
                              addToast('Prompt copied to clipboard! 📋', 'success');
                            }}
                            size="small"
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        )
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      size="small"
                      onClick={async () => {
                        if (!imagePromptText.trim()) {
                          addToast('Pehle prompt likhein ya generate karein!', 'error');
                          return;
                        }
                        addToast('AI Image generate ho rahi hai custom prompt se... 🎨', 'info');
                        try {
                          const res = await request('/api/admin/generate-thumbnail-from-prompt', {
                            method: 'POST',
                            body: JSON.stringify({ prompt: imagePromptText })
                          });
                          if (res?.imageUrl) {
                            updateField('featuredImage', res.imageUrl);
                            addToast('AI Thumbnail custom prompt se ban gaya aur Cloudinary par save ho gaya! 🎉', 'success');
                          } else {
                            addToast('Image generate nahi ho paayi', 'error');
                          }
                        } catch (err) {
                          addToast(err?.message || 'Server error', 'error');
                        }
                      }}
                      sx={{ mt: 1, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                      🎨 Generate Image From Prompt
                    </Button>
                  </Box>
                )}
              </Box>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={form.category}
                  label="Category"
                  onChange={(e) => updateField('category', e.target.value)}
                  required
                >
                  <MenuItem value="Sarkari Jobs & Exams">Sarkari Jobs & Exams</MenuItem>
                  <MenuItem value="Health & Wellness">Health & Wellness</MenuItem>
                  <MenuItem value="Tech & Tutorials">Tech & Tutorials</MenuItem>
                  <MenuItem value="AI & Web Tools">AI & Web Tools</MenuItem>
                  <MenuItem value="News & Trends">News & Trends</MenuItem>
                  <MenuItem value="Finance & Business">Finance & Business</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  label="Status"
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={<Checkbox checked={form.sponsored} onChange={(e) => updateField('sponsored', e.target.checked)} />}
                label="Sponsored post"
                sx={{ mb: 1, color: 'text.secondary' }}
              />
              <FormControlLabel
                control={<Checkbox checked={form.affiliateDisclosure} onChange={(e) => updateField('affiliateDisclosure', e.target.checked)} />}
                label="Contains affiliate links"
                sx={{ mb: 2, color: 'text.secondary' }}
              />

              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={form.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                placeholder="react, javascript, tutorial"
                sx={{ mb: 3 }}
                helperText="Separate tags with commas"
              />

              <TextField
                fullWidth
                label="Video URL (YouTube)"
                value={form.videoUrl}
                onChange={(e) => updateField('videoUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                sx={{ mb: 3 }}
                helperText="Embed a YouTube video in the post"
              />

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                SEO Settings
              </Typography>

              <TextField
                fullWidth
                label="SEO Title"
                value={form.seoTitle}
                onChange={(e) => updateField('seoTitle', e.target.value)}
                placeholder="Leave empty to use post title"
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="SEO Description"
                value={form.seoDescription}
                onChange={(e) => updateField('seoDescription', e.target.value)}
                placeholder="Leave empty to use excerpt"
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="SEO Keywords"
                value={form.seoKeywords}
                onChange={(e) => updateField('seoKeywords', e.target.value)}
                placeholder="react, blog, seo"
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Canonical URL"
                value={form.canonicalUrl}
                onChange={(e) => updateField('canonicalUrl', e.target.value)}
                placeholder="https://example.com/blog/post-slug"
                sx={{ mb: 3 }}
              />

              <Divider sx={{ my: 3 }} />

              {/* SEO Traffic Insights Drawer */}
              <Box
                onClick={() => setSeoDrawerOpen(!seoDrawerOpen)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', mb: 1 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                  📈 SEO/GEO/AEO Auditor ({seoAudit.overallVisibilityIndex || 0}/100)
                </Typography>
                <IconButton size="small">{seoDrawerOpen ? <ExpandLess /> : <ExpandMore />}</IconButton>
              </Box>
              <Collapse in={seoDrawerOpen}>
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                  {/* Master Score: Search Visibility Index */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{
                      width: 56, height: 56, borderRadius: '50%',
                      border: '4px solid',
                      borderColor: (seoAudit.overallVisibilityIndex || 0) >= 80 ? '#10b981' : (seoAudit.overallVisibilityIndex || 0) >= 50 ? '#f59e0b' : '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '1.1rem', color: (seoAudit.overallVisibilityIndex || 0) >= 80 ? '#047857' : (seoAudit.overallVisibilityIndex || 0) >= 50 ? '#b45309' : '#b91c1c',
                      bgcolor: 'white', flexShrink: 0
                    }}>
                      {seoAudit.overallVisibilityIndex || 0}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>Search Visibility Index</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {(seoAudit.overallVisibilityIndex || 0) >= 80 ? '🔥 Expert search visibility ready!' : (seoAudit.overallVisibilityIndex || 0) >= 50 ? '⚠️ Good, but needs GEO/AEO optimization' : '❌ Needs significant audit fixes'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Sub-scores Grid */}
                  <Grid container spacing={1.5} sx={{ mb: 3 }}>
                    {[
                      { label: 'Google SEO', val: seoAudit.seoScore || 0, color: 'primary' },
                      { label: 'Generative AI (GEO)', val: seoAudit.geoScore || 0, color: 'secondary' },
                      { label: 'Voice & Answer (AEO)', val: seoAudit.aeoScore || 0, color: 'success' }
                    ].map((sub, i) => (
                      <Grid item xs={4} key={i}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', borderRadius: 2, bgcolor: '#ffffff' }}>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', mb: 0.5 }}>{sub.label}</Typography>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: `${sub.color}.main`, mb: 0.5 }}>{sub.val}/100</Typography>
                          <LinearProgress variant="determinate" value={sub.val} color={sub.color} sx={{ height: 4, borderRadius: 2 }} />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Rank Prediction Card */}
                  {seoAudit.focusKeyword && (
                    <Box sx={{ mb: 3, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1.5px dashed #bbf7d0' }}>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', mb: 0.5 }}>
                        🎯 Predicted Google Rank:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={seoAudit.rankPrediction.range}
                          size="small"
                          sx={{
                            fontWeight: 700, fontSize: '0.7rem',
                            bgcolor: seoAudit.rankPrediction.badgeColor,
                            color: 'white'
                          }}
                        />
                        <Chip
                          label={`KD: ${seoAudit.kd}%`}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: '#e2e8f0', color: '#475569' }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.65rem', color: '#15803d', fontStyle: 'italic' }}>
                        {seoAudit.rankPrediction.description}
                      </Typography>
                    </Box>
                  )}

                  {/* SEO Checklist */}
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', mb: 1, borderBottom: '1px solid #e2e8f0', pb: 0.5 }}>
                    🔍 Search Engine Optimization (SEO)
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0.75, mb: 3.5 }}>
                    {[
                      { label: 'Keyword in Title', ok: seoAudit.checks.keywordInTitle },
                      { label: 'Keyword in URL Slug', ok: seoAudit.checks.keywordInSlug },
                      { label: 'Keyword in First Paragraph', ok: seoAudit.checks.keywordInIntro },
                      { label: 'Keyword in H2 Heading', ok: seoAudit.checks.keywordInH2 },
                      { label: 'Optimal Keyword Density (0.7% - 2.2%)', ok: seoAudit.checks.keywordDensityOk, suffix: `(${seoAudit.density}%)` },
                      { label: 'Optimal Word Count (1,100+ words)', ok: seoAudit.checks.wordCountOk, suffix: `(${seoAudit.wordCount})` },
                      { label: 'Comparison/Data Table included', ok: seoAudit.checks.hasTable },
                      { label: 'SEO Description has Keyword & Length', ok: seoAudit.checks.metaOk }
                    ].map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                          width: 14, height: 14, borderRadius: '50%',
                          bgcolor: item.ok ? '#10b981' : '#cbd5e1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '0.55rem', fontWeight: 800, flexShrink: 0
                        }}>
                          {item.ok ? '✓' : ''}
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: item.ok ? '#1e293b' : '#64748b' }}>
                          {item.label} {item.suffix && <strong style={{ color: '#0284c7' }}>{item.suffix}</strong>}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* GEO Checklist */}
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', mb: 1, borderBottom: '1px solid #e2e8f0', pb: 0.5 }}>
                    🤖 Generative Engine Optimization (GEO)
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0.75, mb: 3.5 }}>
                    {[
                      { label: 'Citations & Expert Statements', ok: seoAudit.geoChecks?.hasCitations },
                      { label: 'Numerical Evidence & Statistics', ok: seoAudit.geoChecks?.hasStats },
                      { label: 'Structured Key Takeaways / Summaries', ok: seoAudit.geoChecks?.hasSummary },
                      { label: 'Clear Concepts Definition', ok: seoAudit.geoChecks?.hasDefinitions }
                    ].map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                          width: 14, height: 14, borderRadius: '50%',
                          bgcolor: item.ok ? '#8b5cf6' : '#cbd5e1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '0.55rem', fontWeight: 800, flexShrink: 0
                        }}>
                          {item.ok ? '✓' : ''}
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: item.ok ? '#1e293b' : '#64748b' }}>
                          {item.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* AEO Checklist */}
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', mb: 1, borderBottom: '1px solid #e2e8f0', pb: 0.5 }}>
                    🎙️ Answer Engine & Voice Optimization (AEO)
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0.75, mb: 3 }}>
                    {[
                      { label: 'Dedicated FAQ / Q&A Section', ok: seoAudit.aeoChecks?.hasFaq },
                      { label: 'Direct Concise Answer Snippets', ok: seoAudit.aeoChecks?.hasDirectAnswers },
                      { label: 'Voice-friendly Conversational Headers', ok: seoAudit.aeoChecks?.hasConversationalWords },
                      { label: 'Schema-rich Metadata Fields', ok: seoAudit.aeoChecks?.hasSchemaFields }
                    ].map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                          width: 14, height: 14, borderRadius: '50%',
                          bgcolor: item.ok ? '#22c55e' : '#cbd5e1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '0.55rem', fontWeight: 800, flexShrink: 0
                        }}>
                          {item.ok ? '✓' : ''}
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: item.ok ? '#1e293b' : '#64748b' }}>
                          {item.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Suggestions Checklist */}
                  {seoAudit.suggestions.length > 0 && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', mb: 0.75 }}>
                        ⚠️ Actions Required to Rank:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {seoAudit.suggestions.map((sug, idx) => {
                          const fixAction = getFixAction(sug);
                          return (
                            <Box key={idx} sx={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              bgcolor: '#fef2f2', p: 1, borderRadius: 2, borderLeft: '3px solid #ef4444',
                              gap: 1.5
                            }}>
                              <Typography sx={{ fontSize: '0.68rem', color: '#7f1d1d', flex: 1, fontWeight: 500 }}>
                                • {sug}
                              </Typography>
                              {fixAction && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={fixAction.handler}
                                  sx={{
                                    bgcolor: '#ef4444',
                                    color: 'white',
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    py: 0.4,
                                    px: 1.2,
                                    borderRadius: 1.5,
                                    minWidth: 'auto',
                                    flexShrink: 0,
                                    textTransform: 'none',
                                    '&:hover': { bgcolor: '#b91c1c' }
                                  }}
                                >
                                  {fixAction.label}
                                </Button>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </>
                  )}

                  {/* Low-Difficulty Long-Tails */}
                  <Divider sx={{ my: 1.5 }} />
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', mb: 0.75 }}>
                    🎯 Low-Difficulty Long-Tails (KD ≤ 25%)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                    {(kwData?.filtered || []).filter(k => (k.type === 'long-tail' || k.type === 'question-based') && k.kd <= 25).length > 0
                      ? (kwData.filtered).filter(k => (k.type === 'long-tail' || k.type === 'question-based') && k.kd <= 25).slice(0, 5).map((k, i) => (
                          <Chip key={i} label={`${k.keyword} (${k.kd}%)`} size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#d1fae5', color: '#166534' }} />
                        ))
                      : <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>No low-difficulty long-tails found.</Typography>
                    }
                  </Box>

                  {/* Scraped Competitors Benchmarks */}
                  {serpData?.competitors && serpData.competitors.length > 0 && (
                    <>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        🔥 Competitor Word Benchmarks
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
                        {serpData.competitors.map((comp, idx) => (
                          <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f1f5f9', p: 0.75, borderRadius: 1.5 }}>
                            <Typography sx={{ fontSize: '0.6rem', color: '#1e293b', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                              <a href={comp.link} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>
                                {comp.title}
                              </a>
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: '#475569', fontWeight: 700 }}>
                              {comp.wordCount} words
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}

                  {/* Character Count Target */}
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', mb: 0.75 }}>
                    📏 Target Content Length
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1, bgcolor: '#e2e8f0', borderRadius: 1, height: 8, overflow: 'hidden' }}>
                      <Box sx={{
                        width: serpData?.totalRecommendedWords
                          ? Math.min(100, (serpData.totalRecommendedWords / 2500) * 100) + '%'
                          : '50%',
                        height: '100%', bgcolor: '#2563eb', borderRadius: 1, transition: 'width 0.3s',
                      }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
                      {serpData?.totalRecommendedWords || 1200} — 2500 words
                    </Typography>
                  </Box>
                </Box>
              </Collapse>

              {isEdit && form.status === 'published' && (
                <Button
                  variant="outlined"
                  color="success"
                  fullWidth
                  size="large"
                  onClick={handleEditorIndexPing}
                  disabled={ytLoading}
                  sx={{
                    fontWeight: 700,
                    py: 1.5,
                    mb: 2,
                    fontSize: '1.1rem',
                    borderRadius: 2,
                    borderWidth: 2,
                    textTransform: 'none',
                    '&:hover': { borderWidth: 2 }
                  }}
                >
                  {ytLoading ? <CircularProgress size={20} color="inherit" /> : '⚡ Request Google Indexing'}
                </Button>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  fontWeight: 700,
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                }}
              >
                {isEdit ? 'Update Post' : 'Create Post'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </form>

      {/* Dynamic HTML Canvas Thumbnail Generator Dialog */}
      <Dialog 
        open={showCanvasMaker} 
        onClose={() => setShowCanvasMaker(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          🎨 Custom HTML Canvas Thumbnail Designer
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Controls Left */}
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="English Heading (ALL CAPS)"
                  value={canvasEngTitle}
                  onChange={(e) => setCanvasEngTitle(e.target.value)}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Hindi Subtitle"
                  value={canvasHindiTitle}
                  onChange={(e) => setCanvasHindiTitle(e.target.value)}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Theme Background</InputLabel>
                  <Select
                    value={canvasTheme}
                    label="Theme Background"
                    onChange={(e) => setCanvasTheme(e.target.value)}
                  >
                    <MenuItem value="bank">Bank Blue (Gradient)</MenuItem>
                    <MenuItem value="police">Police Khaki/Red (Gradient)</MenuItem>
                    <MenuItem value="defense">Defense Dark Violet (Gradient)</MenuItem>
                    <MenuItem value="orange">Orange Tech (Gradient)</MenuItem>
                    <MenuItem value="violet">Modern Purple (Gradient)</MenuItem>
                  </Select>
                </FormControl>
                
                <Alert severity="info" sx={{ py: 0.5, px: 1.5, fontSize: '0.8rem', borderRadius: 2 }}>
                  Canvas real-time preview draws local canvas fonts. The text is 100% correct, sharp and clear.
                </Alert>
              </Box>
            </Grid>

            {/* Canvas Preview Right */}
            <Grid item xs={12} md={7} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Box sx={{ 
                border: '2px solid #e2e8f0', 
                borderRadius: 2, 
                overflow: 'hidden', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                width: '100%',
                maxWidth: 400,
                aspectRatio: '1/1',
                bgcolor: '#f8fafc'
              }}>
                <canvas 
                  ref={canvasRef} 
                  width={800} 
                  height={800} 
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setShowCanvasMaker(false)} 
            color="inherit" 
            sx={{ fontWeight: 600, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={isGeneratingCanvas}
            onClick={async () => {
              // Get canvas element inside DOM and trigger upload
              const canvasEl = document.querySelector('canvas[width="800"]');
              if (canvasEl) {
                // Convert canvas to Base64 image
                const dataUri = canvasEl.toDataURL('image/jpeg', 0.9);
                setIsGeneratingCanvas(true);
                addToast('Saving and uploading custom thumbnail... 🚀', 'info');
                try {
                  const responseBlob = await fetch(dataUri);
                  const blob = await responseBlob.blob();
                  const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
                  
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  const res = await request('/api/admin/upload', {
                    method: 'POST',
                    body: formData
                  });
                  
                  if (res?.url) {
                    updateField('featuredImage', res.url);
                    addToast('Canvas Banner apply aur save ho gaya! 🎉', 'success');
                    setShowCanvasMaker(false);
                  } else {
                    addToast('Banner upload nahi ho paaya.', 'error');
                  }
                } catch (uploadErr) {
                  addToast(uploadErr?.message || 'Upload failed.', 'error');
                } finally {
                  setIsGeneratingCanvas(false);
                }
              } else {
                addToast('Preview canvas not found.', 'error');
              }
            }}
            sx={{ fontWeight: 700, textTransform: 'none', px: 3, borderRadius: 2 }}
          >
            {isGeneratingCanvas ? <CircularProgress size={20} color="inherit" /> : '💾 Apply & Save Banner'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </>
  );
}
