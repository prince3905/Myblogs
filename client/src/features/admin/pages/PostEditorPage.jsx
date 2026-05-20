import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Typography, TextField, Select, MenuItem, FormControl, InputLabel, Button, Grid, Alert, Box, Paper, Divider, FormControlLabel, Checkbox, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
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
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [aiLength, setAiLength] = useState('medium');
  const [aiTone, setAiTone] = useState('informative');
  const [aiLanguage, setAiLanguage] = useState('hinglish');
  const [aiCommand, setAiCommand] = useState('');
  const isEdit = Boolean(id);

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
    return str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleAIWrite(autoTrending) {
    if (!autoTrending && !form.title.trim()) {
      addToast('Pehle title to daal bhai!', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const data = await request('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ title: form.title, model: aiModel, length: aiLength, tone: aiTone, language: aiLanguage, autoTrending, command: aiCommand })
      });
      const title = autoTrending ? data.slug || 'Trending Post' : form.title;
      const plainText = stripHtml(data.content || '');

      updateField('content', data.content || '');
      updateField('slug', data.slug || makeSlug(title));
      updateField('excerpt', data.summary || plainText.slice(0, 250));
      updateField('seoTitle', data.seoTitle || title.slice(0, 70));
      updateField('seoDescription', data.seoDescription || data.summary || plainText.slice(0, 155));
      updateField('category', data.category || 'Technology');
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
      addToast('AI ne sab bhar diya! 🎉', 'success');
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
                  onChange={(e) => updateField('title', e.target.value)}
                  required
                  InputProps={{ sx: { fontSize: '1.25rem', fontWeight: 500 } }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleAIWrite(true)}
                  disabled={aiLoading}
                  sx={{ minWidth: 130, height: 56, flexShrink: 0, borderRadius: 2, fontWeight: 700, fontSize: '0.8rem' }}
                >
                  {aiLoading ? <CircularProgress size={20} /> : '🔥 Trending'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleAIWrite(false)}
                  disabled={aiLoading || !form.title.trim()}
                  sx={{ minWidth: 120, height: 56, flexShrink: 0, borderRadius: 2 }}
                >
                  {aiLoading ? <CircularProgress size={20} /> : '✨ AI Write'}
                </Button>
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
                    <MenuItem disabled>— ChatGPT —</MenuItem>
                    <MenuItem value="gpt-4o-mini">GPT-4o Mini 💬</MenuItem>
                    <MenuItem value="gpt-4o">GPT-4o 💬</MenuItem>
                    <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo 💬</MenuItem>
                    <MenuItem disabled>— Gemini (Free) —</MenuItem>
                    <MenuItem value="gemini-flash-latest">Gemini Flash 🪐</MenuItem>
                    <MenuItem disabled>— Groq (Free) —</MenuItem>
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
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Slug (auto-generated if empty)"
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
                  <MenuItem value="Technology">Technology</MenuItem>
                  <MenuItem value="Tutorial">Tutorial</MenuItem>
                  <MenuItem value="Career">Career</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Lifestyle">Lifestyle</MenuItem>
                  <MenuItem value="Health">Health</MenuItem>
                  <MenuItem value="Reviews">Reviews</MenuItem>
                  <MenuItem value="Education">Education</MenuItem>
                  <MenuItem value="YouTube">YouTube</MenuItem>
                  <MenuItem value="Promotions">Promotions</MenuItem>
                  <MenuItem value="News">News</MenuItem>
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

              {form.category === 'Reviews' && (
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ min: 1, max: 5, step: 0.5 }}
                  label="Rating (1-5)"
                  value={form.rating}
                  onChange={(e) => updateField('rating', e.target.value)}
                  placeholder="4.5"
                  sx={{ mb: 3 }}
                  helperText="Product rating for review posts"
                />
              )}

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
