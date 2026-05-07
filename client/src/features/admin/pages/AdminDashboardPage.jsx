import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Box, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Seo from '../../blog/components/Seo';
import { useAuth } from '../../auth/context/AuthContext';
import { request } from '../../../shared/lib/api';

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  function loadPosts() {
    request('/api/admin/posts').then(setPosts).catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleDelete() {
    await request(`/api/admin/posts/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    loadPosts();
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Seo title="Admin Dashboard | Inkspire Blog" description="Create, edit, and delete blog posts from the admin panel." />
      
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>Content Studio</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            Welcome, {user?.name || 'Admin'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={Link}
            to="/admin/posts/new"
            variant="contained"
            color="primary"
            size="large"
            sx={{ fontWeight: 600, px: 3, py: 1 }}
          >
            + New Post
          </Button>
          <Button
            variant="outlined"
            onClick={() => { logout(); navigate('/admin/login'); }}
            size="large"
            sx={{ fontWeight: 600 }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

      {/* Posts Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Updated</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post) => (
                <TableRow 
                  key={post._id}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <TableCell sx={{ maxWidth: 400 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {post.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={post.status}
                      size="small"
                      color={post.status === 'published' ? 'success' : 'default'}
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {post.category}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        component={Link}
                        to={`/admin/posts/${post._id}/edit`}
                        size="small"
                        variant="outlined"
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => setDeleteId(post._id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {!posts.length ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No posts yet
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Create your first draft to get started
            </Typography>
          </Box>
        ) : null}
      </Paper>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
