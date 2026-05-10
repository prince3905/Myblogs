import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Typography, TextField, Select, MenuItem, FormControl, InputLabel, Button, Grid, Alert, Box, Paper, Divider } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import ImageUpload from '../../../components/ImageUpload';
import RichTextEditor from '../../../components/RichTextEditor';
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
  canonicalUrl: ''
};

export default function PostEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
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

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
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
        px: 4, py: 2.5, bgcolor: 'white',
        borderBottom: '1px solid', borderColor: '#ECECEC',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button component={Link} to="/admin" sx={{ minWidth: 0, px: 1, color: '#6B7280', borderRadius: 2 }}>
            <ArrowBack />
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>{isEdit ? 'Edit Post' : 'New Post'}</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3 }}>{isEdit ? 'Update your article content and settings' : 'Create a new article for your blog'}</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

        <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* Left Column - Main Content */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, mb: 3, borderRadius: 3 }}>
              <TextField
                fullWidth
                label="Post Title"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
                sx={{ mb: 3 }}
                InputProps={{ sx: { fontSize: '1.25rem', fontWeight: 500 } }}
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
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  Featured Image
                </Typography>
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
                  <MenuItem value="Career">Career</MenuItem>
                  <MenuItem value="Tutorial">Tutorial</MenuItem>
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

              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={form.tags}
                onChange={(e) => updateField('tags', e.target.value)}
                placeholder="react, javascript, tutorial"
                sx={{ mb: 3 }}
                helperText="Separate tags with commas"
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
