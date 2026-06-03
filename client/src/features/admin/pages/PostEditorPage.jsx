import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Typography, TextField, Select, MenuItem, FormControl, InputLabel, Button, Grid, Alert, Box, Paper, Divider, FormControlLabel, Checkbox, CircularProgress, Chip, Collapse, IconButton, Tooltip } from '@mui/material';
import { ArrowBack, ExpandMore, ExpandLess, ContentCopy } from '@mui/icons-material';
import ImageUpload from '../../../components/ImageUpload';
import RichTextEditor from '../../../components/RichTextEditor';
import { useToast } from '../../../components/Toast';
import { request } from '../../../shared/lib/api';

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
  const [aiModel, setAiModel] = useState('gemini-flash-latest');
  const [aiLength, setAiLength] = useState('medium');
  const [aiTone, setAiTone] = useState('informative');
  const [aiLanguage, setAiLanguage] = useState('hinglish');
  const [aiCommand, setAiCommand] = useState('');
  const [kwData, setKwData] = useState(null);
  const [serpData, setSerpData] = useState(null);
  const [seoDrawerOpen, setSeoDrawerOpen] = useState(false);
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
      const title = finalTitle;
      const plainText = stripHtml(data.content || '');

      updateField('content', data.content || '');
      updateField('slug', data.slug || makeSlug(title));
      updateField('excerpt', data.summary || plainText.slice(0, 250));
      updateField('seoTitle', data.seoTitle || title.slice(0, 70));
      updateField('seoDescription', data.seoDescription || data.summary || plainText.slice(0, 155));
      updateField('category', data.category || 'Tech & Tutorials');
      if (data.keywords?.length) {
        const kw = data.keywords.join(', ');
        updateField('tags', kw);
        updateField('seoKeywords', kw);
        try {
          const pexelRes = await request('/api/pexels/search', {
            method: 'POST',
            body: JSON.stringify({ query: data.keywords[0], page: Math.floor(Math.random() * 15) + 1 })
          });
          if (pexelRes?.imageUrl) updateField('featuredImage', pexelRes.imageUrl);
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
      setAiLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const payload = {
      ...form,
      tags: form.tags,
      seoKeywords: form.seoKeywords
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
                helperText="This will appear in post previews and SEO description if not specified"
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
                      const tag = form.tags?.split(',')[0]?.trim() || form.title?.split(' ').slice(0, 2).join(' ') || 'blog';
                      try {
                        const pexelRes = await request('/api/pexels/search', {
                          method: 'POST',
                          body: JSON.stringify({ query: tag, page: Math.floor(Math.random() * 20) + 1 })
                        });
                        if (pexelRes?.imageUrl) updateField('featuredImage', pexelRes.imageUrl);
                        else addToast('Image nahi mili, dubara try kar', 'error');
                      } catch {
                        addToast('Server se connect nahi ho paaya', 'error');
                      }
                    }}
                    sx={{ minWidth: 80, height: 28, fontSize: '0.75rem', borderRadius: 2 }}
                  >
                    ✨ Magic
                  </Button>
                </Box>
                <ImageUpload value={form.featuredImage} onChange={(val) => updateField('featuredImage', val)} />
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
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  📈 SEO Traffic Insights
                </Typography>
                <IconButton size="small">{seoDrawerOpen ? <ExpandLess /> : <ExpandMore />}</IconButton>
              </Box>
              <Collapse in={seoDrawerOpen}>
                <Box sx={{ mb: 3, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  {/* Recommended Tags */}
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', mb: 0.75 }}>
                    🏷️ Recommended Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                    {(kwData?.filtered || []).filter(k => k.type === 'short-tail' || k.type === 'lsi').slice(0, 6).length > 0
                      ? (kwData.filtered).filter(k => k.type === 'short-tail' || k.type === 'lsi').slice(0, 6).map((k, i) => (
                          <Chip key={i} label={k.keyword} size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#e0e7ff', color: '#4338ca' }} />
                        ))
                      : <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>Keyword research nahi hua hai. Pehle AI Write karo.</Typography>
                    }
                  </Box>

                  {/* Low-Difficulty Long-Tails */}
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', mb: 0.75 }}>
                    🎯 Low-Difficulty Long-Tails (KD ≤ 25%)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                    {(kwData?.filtered || []).filter(k => (k.type === 'long-tail' || k.type === 'question-based') && k.kd <= 25).length > 0
                      ? (kwData.filtered).filter(k => (k.type === 'long-tail' || k.type === 'question-based') && k.kd <= 25).slice(0, 5).map((k, i) => (
                          <Chip key={i} label={`${k.keyword} (${k.kd}%)`} size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#d1fae5', color: '#166534' }} />
                        ))
                      : <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>Koi low-difficulty long-tail nahi mila.</Typography>
                    }
                  </Box>

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
                  {!kwData && (
                    <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', mt: 1, fontStyle: 'italic' }}>
                      💡 Insaan ke search data ke liye "AI Write" dabao — auto keyword research fill ho jayega.
                    </Typography>
                  )}
                </Box>
              </Collapse>

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
      </Box>
    </>
  );
}
