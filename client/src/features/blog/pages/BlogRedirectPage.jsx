import { Navigate, useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { usePost } from '../../../hooks/usePost';
import { postUrl } from '../../../shared/lib/category';
import Layout from '../components/Layout';
import NotFoundPage from './NotFoundPage';

export default function BlogRedirectPage() {
  const { slug } = useParams();
  const { post, loading } = usePost(slug);

  if (loading) return <Layout><Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box></Layout>;
  if (!post) return <NotFoundPage />;
  return <Navigate to={postUrl(post)} replace />;
}

