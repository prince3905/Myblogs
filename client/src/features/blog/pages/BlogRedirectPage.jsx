import { Navigate, useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { usePost } from '../../../hooks/usePost';
import { postUrl } from '../../../shared/lib/category';
import NotFoundPage from './NotFoundPage';

export default function BlogRedirectPage() {
  const { slug } = useParams();
  const { post, loading } = usePost(slug);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!post) return <NotFoundPage />;
  return <Navigate to={postUrl(post)} replace />;
}

