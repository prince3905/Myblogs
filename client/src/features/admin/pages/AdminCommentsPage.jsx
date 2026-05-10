import { useEffect, useState } from 'react';
import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Box, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { CheckCircle, Delete, Refresh } from '@mui/icons-material';
import { request } from '../../../shared/lib/api';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  function loadComments() {
    request('/api/admin/comments')
      .then(data => setComments(data.comments || []))
      .catch(err => setError(err.message));
  }

  useEffect(() => { loadComments(); }, []);

  async function handleApprove(id) {
    try {
      await request(`/api/admin/comments/${id}/approve`, { method: 'PUT' });
      loadComments();
    } catch (err) { setError(err.message); }
  }

  async function handleDelete() {
    try {
      await request(`/api/admin/comments/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      loadComments();
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <Box sx={{
        px: 4, py: 2.5, bgcolor: 'white',
        borderBottom: '1px solid', borderColor: '#ECECEC',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Comments</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3 }}>Approve and manage reader comments</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadComments}
          sx={{ fontWeight: 600, borderRadius: 2, px: 3 }}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
        {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #ECECEC', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { color: '#6B7280', fontWeight: 600, fontSize: '0.75rem', py: 1.5, px: 3, borderBottom: '1px solid #ECECEC' } }}>
                  <TableCell sx={{ width: '30%' }}>Comment</TableCell>
                  <TableCell sx={{ width: '20%' }}>Author</TableCell>
                  <TableCell sx={{ width: '20%' }}>Post</TableCell>
                  <TableCell sx={{ width: '12%' }}>Date</TableCell>
                  <TableCell sx={{ width: '8%' }}>Status</TableCell>
                  <TableCell sx={{ width: '10%' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comments.map((c, i) => (
                  <TableRow key={c._id} sx={{
                    '& td': { py: 1.8, px: 3, borderBottom: i < comments.length - 1 ? '1px solid #ECECEC' : 'none' },
                    '&:hover': { bgcolor: '#F9FAFB' },
                    opacity: c.approved ? 1 : 0.7,
                  }}>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {c.content}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{c.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280' }}>{c.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{c.post?.title || 'Unknown'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{new Date(c.createdAt).toLocaleDateString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={c.approved ? 'Approved' : 'Pending'} size="small"
                        sx={{
                          fontWeight: 600, fontSize: '0.7rem', height: 24, borderRadius: 1.5,
                          bgcolor: c.approved ? '#D1FAE5' : '#FEF3C7',
                          color: c.approved ? '#065F46' : '#92400E',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {!c.approved && (
                          <Button size="small" onClick={() => handleApprove(c._id)}
                            sx={{ minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.75rem', fontWeight: 600, color: '#059669', borderRadius: 1.5, '&:hover': { bgcolor: '#ECFDF5' } }}
                          >
                            <CheckCircle sx={{ fontSize: '0.9rem', mr: 0.3 }} /> Approve
                          </Button>
                        )}
                        <Button size="small" onClick={() => setDeleteId(c._id)}
                          sx={{ minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', borderRadius: 1.5, '&:hover': { bgcolor: '#FEF2F2' } }}
                        >
                          <Delete sx={{ fontSize: '0.9rem', mr: 0.3 }} /> Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {!comments.length ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>No comments yet</Typography>
                      <Typography sx={{ color: '#9CA3AF', fontSize: '0.85rem', mt: 0.5 }}>Comments from readers will appear here for moderation</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Delete Comment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#6B7280' }}>Are you sure you want to delete this comment? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: '#6B7280', fontWeight: 600, borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ fontWeight: 600, borderRadius: 2, px: 3 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
