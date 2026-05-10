import { useState } from 'react';
import { Button, Box, Fade } from '@mui/material';
import { request } from '../shared/lib/api';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

function getStorageKey(slug) {
  return `liked_${slug}`;
}

export default function LikeButton({ slug, initialLikes = 0 }) {
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(() => {
    try {
      return localStorage.getItem(getStorageKey(slug)) === 'true';
    } catch {
      return false;
    }
  });

  async function handleLike() {
    setLoading(true);
    const newLiked = !liked;
    try {
      const data = await request(`/api/posts/${slug}/like`, {
        method: 'POST',
        body: JSON.stringify({ liked: newLiked }),
      });
      setLikes(data.likes);
      setLiked(newLiked);
      localStorage.setItem(getStorageKey(slug), String(newLiked));
    } catch (err) {
      console.error('Like failed', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleLike}
      disabled={loading}
      variant={liked ? 'contained' : 'outlined'}
      size="large"
      startIcon={liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      sx={{
        borderRadius: 3,
        px: 3,
        py: 1,
        fontWeight: 600,
        transition: 'all 0.3s ease',
        ...(liked && {
          bgcolor: '#ec4899',
          borderColor: '#ec4899',
          '&:hover': {
            bgcolor: '#db2777',
            borderColor: '#db2777',
          }
        }),
        '&:hover': {
          transform: 'scale(1.05)',
        }
      }}
    >
      <Fade in={true}>
        <Box>
          {likes} Like{likes !== 1 ? 's' : ''}
        </Box>
      </Fade>
    </Button>
  );
}
