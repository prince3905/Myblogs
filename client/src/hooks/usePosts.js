import { useState, useEffect, useCallback } from 'react';
import { postsService } from '../services/posts';

export function usePosts(params = {}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(params.page || 1);
  const [pages, setPages] = useState(1);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = { ...params, page };
      
      // Format dates properly for API - only valid dates
      if (queryParams.dateFrom) {
        const d = new Date(queryParams.dateFrom);
        if (d instanceof Date && !isNaN(d.getTime()) && d.getTime() > 0) {
          queryParams.dateFrom = d.toISOString().split('T')[0];
        } else {
          delete queryParams.dateFrom;
        }
      }
      if (queryParams.dateTo) {
        const d = new Date(queryParams.dateTo);
        if (d instanceof Date && !isNaN(d.getTime()) && d.getTime() > 0) {
          queryParams.dateTo = d.toISOString().split('T')[0];
        } else {
          delete queryParams.dateTo;
        }
      }
      
      const data = await postsService.getAll(queryParams);
      setPosts(data.posts || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params), page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, total, page, pages, setPage, refetch: fetchPosts };
}
