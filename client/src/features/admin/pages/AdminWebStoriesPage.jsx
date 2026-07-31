import { useEffect, useState } from 'react';
import { 
  Typography, Button, Box, Paper, TextField, Alert, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Tab, Tabs
} from '@mui/material';
import { Delete, Edit, OpenInNew, Search, OfflineBolt } from '@mui/icons-material';
import { request } from '../../../shared/lib/api';

export default function AdminWebStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [pingingId, setPingingId] = useState(null);

  // Edit Story Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [activeSlideTab, setActiveSlideTab] = useState(0);

  const handlePingIndexing = (id) => {
    setPingingId(id);
    setMsg('');
    request(`/api/admin/web-stories/${id}/index-ping`, { method: 'POST' })
      .then(res => {
        if (res.success) {
          setMsg('Google Indexing API request sent successfully! Crawlers have been pinged.');
          setMsgType('success');
        } else {
          setMsg(res.message || 'Indexing ping failed.');
          setMsgType('error');
        }
      })
      .catch(err => {
        setMsg('Indexing request failed: ' + err.message);
        setMsgType('error');
      })
      .finally(() => setPingingId(null));
  };

  useEffect(() => {
    loadStories();
  }, [page, search]);

  const loadStories = () => {
    setLoading(true);
    request(`/api/admin/web-stories?page=${page}&search=${encodeURIComponent(search)}`)
      .then(res => {
        const rawList = res?.data || res?.stories || (Array.isArray(res) ? res : []);
        if (Array.isArray(rawList)) {
          setStories(rawList);
          setTotalPages(res?.pagination?.pages || 1);
        } else {
          setStories([]);
        }
      })
      .catch(err => {
        setMsg('Failed to load Web Stories: ' + err.message);
        setMsgType('error');
      })
      .finally(() => setLoading(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this Web Story?')) return;
    request(`/api/admin/web-stories/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.success) {
          setMsg('Web Story successfully deleted!');
          setMsgType('success');
          loadStories();
        }
      })
      .catch(err => {
        setMsg('Delete failed: ' + err.message);
        setMsgType('error');
      });
  };

  const handleEditOpen = (story) => {
    setEditingStory({ ...story });
    setActiveSlideTab(0);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditingStory(null);
  };

  const handleSlideChange = (field, val) => {
    if (!editingStory) return;
    const updatedSlides = [...editingStory.slides];
    updatedSlides[activeSlideTab] = {
      ...updatedSlides[activeSlideTab],
      [field]: val
    };
    setEditingStory(prev => ({
      ...prev,
      slides: updatedSlides
    }));
  };

  const handleSaveEdit = () => {
    if (!editingStory) return;
    request(`/api/admin/web-stories/${editingStory._id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: editingStory.title,
        status: editingStory.status,
        slides: editingStory.slides
      })
    })
      .then(res => {
        if (res.success) {
          setMsg('Web Story successfully updated!');
          setMsgType('success');
          setEditOpen(false);
          loadStories();
        }
      })
      .catch(err => {
        setMsg('Update failed: ' + err.message);
        setMsgType('error');
      });
  };

  return (
    <>
      <Box sx={{
        px: { xs: 2, md: 4 }, py: 2.5, bgcolor: 'white',
        borderBottom: '1px solid', borderColor: '#ECECEC',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Web Stories Manager</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3 }}>Manage and edit your Google Discover visual Web Stories</Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 4 } }}>
        {msg && (
          <Alert 
            severity={msgType} 
            sx={{ mb: 3, borderRadius: 2 }} 
            onClose={() => setMsg('')}
          >
            {msg}
          </Alert>
        )}

        {/* Search & Actions Header */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField
            placeholder="Search Web Stories..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            sx={{ 
              width: { xs: '100%', sm: 300 },
              '& .MuiInputBase-root': { borderRadius: 3 }
            }}
            InputProps={{
              startAdornment: <Search sx={{ color: '#9CA3AF', mr: 1 }} />
            }}
          />
        </Box>

        {/* Stories Listing Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ECECEC', borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Cover</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Story Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Parent Blog Post</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Views</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Created At</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#4B5563' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9CA3AF' }}>Loading stories...</TableCell>
                </TableRow>
              ) : stories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#9CA3AF', fontStyle: 'italic' }}>No Web Stories found.</TableCell>
                </TableRow>
              ) : (
                stories.map((story) => (
                  <TableRow key={story._id} hover>
                    <TableCell>
                      <Box 
                        component="img"
                        src={story.slides[0]?.image}
                        alt="cover"
                        sx={{ width: 44, height: 78, borderRadius: 1.5, objectFit: 'cover', border: '1px solid #E5E7EB' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#111827' }}>
                      {story.title}
                    </TableCell>
                    <TableCell sx={{ color: '#4B5563', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {story.post?.title || 'Unknown Post'}
                    </TableCell>
                    <TableCell>
                      <Box 
                        sx={{ 
                          display: 'inline-block',
                          px: 1.5, py: 0.3,
                          borderRadius: '99px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          bgcolor: story.status === 'published' ? '#DEF7EC' : '#F3F4F6',
                          color: story.status === 'published' ? '#03543F' : '#374151'
                        }}
                      >
                        {story.status}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#111827' }}>{story.views}</TableCell>
                    <TableCell sx={{ color: '#4B5563', whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.825rem' }}>
                        {story.createdAt ? new Date(story.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontWeight: 500 }}>
                        {story.createdAt ? new Date(story.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {story.status === 'published' && (
                        <IconButton 
                          onClick={() => handlePingIndexing(story._id)} 
                          disabled={pingingId === story._id}
                          title="Instant Index (Google Indexing API)"
                          sx={{ color: '#F59E0B' }}
                        >
                          <OfflineBolt fontSize="small" sx={{ animation: pingingId === story._id ? 'pulse 1s infinite' : 'none' }} />
                        </IconButton>
                      )}
                      <IconButton 
                        component="a" 
                        href={`/web-stories/${story.slug || story._id}${story.status === 'draft' ? '?preview=true' : ''}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ color: '#2563EB' }}
                        title={story.status === 'draft' ? "Preview Draft Story" : "View Live Story"}
                      >
                        <OpenInNew fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleEditOpen(story)} sx={{ color: '#4B5563' }} title="Edit Story">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(story._id)} sx={{ color: '#EF4444' }} title="Delete Story">
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
            <Button 
              variant="outlined" 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)}
              sx={{ borderRadius: 2 }}
            >
              Prev
            </Button>
            <Typography sx={{ alignSelf: 'center', mx: 1, fontWeight: 600 }}>Page {page} of {totalPages}</Typography>
            <Button 
              variant="outlined" 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              sx={{ borderRadius: 2 }}
            >
              Next
            </Button>
          </Box>
        )}
      </Box>

      {/* Slide / Story Editor Modal */}
      {editingStory && (
        <Dialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Edit Web Story Content</DialogTitle>
          <DialogContent>
            {/* Main story settings */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: 2, mt: 1.5, mb: 3 }}>
              <TextField
                label="Story Title (Google Search)"
                value={editingStory.title}
                onChange={e => setEditingStory(prev => ({ ...prev, title: e.target.value }))}
                fullWidth
              />
              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editingStory.status}
                  label="Status"
                  onChange={e => setEditingStory(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>Slide Cards Editor (Exactly 5 Slides)</Typography>
            
            {/* Tabs for individual slides */}
            <Tabs 
              value={activeSlideTab} 
              onChange={(e, val) => setActiveSlideTab(val)}
              variant="fullWidth"
              sx={{ borderBottom: '1px solid #E5E7EB', mb: 2.5 }}
            >
              <Tab label="Slide 1 (Cover)" />
              <Tab label="Slide 2 (Elig.)" />
              <Tab label="Slide 3 (Dates)" />
              <Tab label="Slide 4 (Alert)" />
              <Tab label="Slide 5 (CTA)" />
            </Tabs>

            {/* Slide Fields */}
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              {/* Preview mockup */}
              <Box sx={{ 
                width: 180, 
                height: 320, 
                borderRadius: '16px', 
                overflow: 'hidden', 
                position: 'relative', 
                bgcolor: '#000',
                flexShrink: 0,
                border: '1.5px solid #2563EB',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignSelf: 'center'
              }}>
                <Box 
                  component="img"
                  src={editingStory.slides[activeSlideTab]?.image || '/logo.png'}
                  alt="mockup"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                />
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '75%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  p: 1.5,
                  color: '#fff',
                  boxSizing: 'border-box'
                }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', mb: 0.5, lineHeight: 1.2 }}>
                    {editingStory.slides[activeSlideTab]?.heading || 'Slide Heading'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.55rem', color: '#e5e7eb', opacity: 0.9, lineHeight: 1.3 }}>
                    {editingStory.slides[activeSlideTab]?.text || 'Description text...'}
                  </Typography>
                </Box>
              </Box>

              {/* Editing Form */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={`Slide ${activeSlideTab + 1} Heading (Max 50 chars)`}
                  value={editingStory.slides[activeSlideTab]?.heading || ''}
                  onChange={e => handleSlideChange('heading', e.target.value)}
                  fullWidth
                />
                <TextField
                  label={`Slide ${activeSlideTab + 1} Description Text`}
                  value={editingStory.slides[activeSlideTab]?.text || ''}
                  onChange={e => handleSlideChange('text', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                />
                <TextField
                  label={`Slide ${activeSlideTab + 1} Background Image URL`}
                  value={editingStory.slides[activeSlideTab]?.image || ''}
                  onChange={e => handleSlideChange('image', e.target.value)}
                  fullWidth
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleEditClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
            <Button onClick={handleSaveEdit} variant="contained" sx={{ borderRadius: 2 }}>Save Web Story</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
