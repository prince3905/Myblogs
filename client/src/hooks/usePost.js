import { useState, useEffect } from 'react';
import { postsService } from '../services/posts';

export function usePost(slug) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await postsService.getBySlug(slug);
        setPost({ ...data.post, relatedPosts: data.relatedPosts });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  return { post, loading, error };
}
