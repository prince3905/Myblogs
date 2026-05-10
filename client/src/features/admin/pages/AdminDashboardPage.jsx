import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Box, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { Article, Mail, Comment, Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import { request } from '../../../shared/lib/api';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState('');

  function loadPosts() {
    request('/api/admin/posts').then(setPosts).catch(err => setError(err.message));
  }

  function loadSubscribers() {
    request('/api/admin/subscribers').then(data => setSubscribers(data.subscribers || [])).catch(() => {});
  }

  useEffect(() => { loadPosts(); loadSubscribers(); }, []);

  async function handleDelete() {
    await request(`/api/admin/posts/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    loadPosts();
  }

  return (
    <>
      {/* Top bar */}
      <Box sx={{
        px: 4, py: 2.5, bgcolor: 'white',
        borderBottom: '1px solid', borderColor: '#ECECEC',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Dashboard</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3 }}>Welcome back, {user?.name || 'Admin'}</Typography>
        </Box>
        <Button
          component={Link}
          to="/admin/posts/new"
          variant="contained"
          startIcon={<Add />}
          sx={{ fontWeight: 600, borderRadius: 2, px: 3 }}
        >
          New Post
        </Button>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, mb: 4 }}>
          {[
            { label: 'Total Posts', value: posts.length, icon: <Article />, color: '#4F46E5' },
            { label: 'Subscribers', value: subscribers.length, icon: <Mail />, color: '#059669' },
            { label: 'Pending Comments', value: 0, icon: <Comment />, color: '#D97706' },
          ].map(stat => (
            <Paper key={stat.label} elevation={0} sx={{
              p: 3, borderRadius: 3, border: '1px solid #ECECEC',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: 2.5,
                bgcolor: `${stat.color}0d`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: stat.color,
              }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography sx={{ color: '#6B7280', fontSize: '0.8rem', fontWeight: 500 }}>{stat.label}</Typography>
                <Typography sx={{ color: '#111827', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2 }}>{stat.value}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Posts */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden', mb: 4 }}>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #ECECEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Posts ({posts.length})</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { color: '#6B7280', fontWeight: 600, fontSize: '0.75rem', py: 1.5, px: 3, borderBottom: '1px solid #ECECEC' } }}>
                  <TableCell sx={{ width: '40%' }}>Title</TableCell>
                  <TableCell sx={{ width: '15%' }}>Status</TableCell>
                  <TableCell sx={{ width: '15%' }}>Category</TableCell>
                  <TableCell sx={{ width: '15%' }}>Updated</TableCell>
                  <TableCell sx={{ width: '15%' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.slice(0, 10).map((post, i) => (
                  <TableRow key={post._id} sx={{
                    '& td': { py: 1.8, px: 3, borderBottom: i < Math.min(posts.length, 10) - 1 ? '1px solid #ECECEC' : 'none' },
                    '&:hover': { bgcolor: '#F9FAFB' },
                    transition: 'background 0.15s',
                  }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>{post.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={post.status} size="small"
                        sx={{
                          fontWeight: 600, fontSize: '0.7rem', height: 24, borderRadius: 1.5,
                          bgcolor: post.status === 'published' ? '#D1FAE5' : '#F3F4F6',
                          color: post.status === 'published' ? '#065F46' : '#6B7280',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{post.category || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{new Date(post.updatedAt).toLocaleDateString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button component={Link} to={`/admin/posts/${post._id}/edit`} size="small"
                          sx={{ minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5', borderRadius: 1.5, '&:hover': { bgcolor: '#EEF2FF' } }}
                        >
                          <Edit sx={{ fontSize: '0.9rem', mr: 0.3 }} /> Edit
                        </Button>
                        <Button size="small" onClick={() => setDeleteId(post._id)}
                          sx={{ minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderRadius: 1.5, '&:hover': { bgcolor: '#FEF2F2' } }}
                        >
                          <Delete sx={{ fontSize: '0.9rem', mr: 0.3 }} /> Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {!posts.length ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Article sx={{ fontSize: 40, color: '#D1D5DB', mb: 1 }} />
                      <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>No posts yet</Typography>
                      <Button component={Link} to="/admin/posts/new" variant="contained" size="small" sx={{ mt: 1.5, fontWeight: 600, borderRadius: 2 }}>
                        Create your first post
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Subscribers */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #ECECEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Subscribers ({subscribers.length})</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { color: '#6B7280', fontWeight: 600, fontSize: '0.75rem', py: 1.5, px: 3, borderBottom: '1px solid #ECECEC' } }}>
                  <TableCell sx={{ width: '60%' }}>Email</TableCell>
                  <TableCell sx={{ width: '40%' }}>Subscribed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscribers.map((s, i) => (
                  <TableRow key={s._id} sx={{
                    '& td': { py: 1.8, px: 3, borderBottom: i < subscribers.length - 1 ? '1px solid #ECECEC' : 'none' },
                    '&:hover': { bgcolor: '#F9FAFB' },
                  }}>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.875rem', color: '#111827', fontWeight: 500 }}>{s.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{new Date(s.createdAt).toLocaleDateString()}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {!subscribers.length ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 6 }}>
                      <Mail sx={{ fontSize: 40, color: '#D1D5DB', mb: 1 }} />
                      <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>No subscribers yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#6B7280' }}>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: '#6B7280', fontWeight: 600, borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ fontWeight: 600, borderRadius: 2, px: 3 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
