import { useState, useEffect, useCallback } from 'react';
import { postsService } from '../services/posts';

export function usePosts(params = {}) {
  // Check if we are fetching the default homepage feed (limit 6 or 10, page 1, no filters)
  const isDefaultHome = !params.search && !params.category && !params.tags && !params.dateFrom && !params.dateTo && (!params.limit || params.limit === 10 || params.limit === 6);

  const [posts, setPosts] = useState(() => {
    if (isDefaultHome && typeof window !== 'undefined' && window.__INITIAL_POSTS__) {
      const p = window.__INITIAL_POSTS__.posts || [];
      return params.limit ? p.slice(0, params.limit) : p;
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (isDefaultHome && typeof window !== 'undefined' && window.__INITIAL_POSTS__) {
      return false;
    }
    return true;
  });
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(() => {
    if (isDefaultHome && typeof window !== 'undefined' && window.__INITIAL_POSTS__) {
      return window.__INITIAL_POSTS__.total || 0;
    }
    return 0;
  });
  const [page, setPage] = useState(params.page || 1);
  const [pages, setPages] = useState(() => {
    if (isDefaultHome && typeof window !== 'undefined' && window.__INITIAL_POSTS__) {
      return window.__INITIAL_POSTS__.pages || 1;
    }
    return 1;
  });

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
    // If we have initial posts loaded in window.__INITIAL_POSTS__ and we are on page 1,
    // skip the initial fetch, consume it, and clean up.
    if (isDefaultHome && page === 1 && typeof window !== 'undefined' && window.__INITIAL_POSTS__) {
      delete window.__INITIAL_POSTS__;
      return;
    }
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, total, page, pages, setPage, refetch: fetchPosts };
}
