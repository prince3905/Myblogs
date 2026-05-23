import { Button, Box, Tooltip } from '@mui/material';
import { useState, useEffect } from 'react';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ShareIcon from '@mui/icons-material/Share';

import { postUrl } from '../shared/lib/category';

export default function SocialShare({ title, slug, category }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(`${window.location.origin}${postUrl({ slug, category })}`);
  }, [slug, category]);

  function share(platform) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    const links = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%0A${encodedUrl}`
    };
    
    window.open(links[platform], '_blank', 'width=600,height=400');
  }

  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5,
          color: 'text.secondary',
          fontWeight: 600,
        }}
      >
        <ShareIcon fontSize="small" />
        Share:
      </Box>
      
      <Tooltip title="Share on Twitter" arrow>
        <Button
          size="small"
          variant="outlined"
          onClick={() => share('twitter')}
          sx={{
            minWidth: 'auto',
            width: 36,
            height: 36,
            borderRadius: '50%',
            borderColor: '#1DA1F2',
            color: '#1DA1F2',
            p: 0,
            '&:hover': {
              bgcolor: '#1DA1F2',
              color: 'white',
              borderColor: '#1DA1F2',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <TwitterIcon fontSize="small" />
        </Button>
      </Tooltip>
      
      <Tooltip title="Share on Facebook" arrow>
        <Button
          size="small"
          variant="outlined"
          onClick={() => share('facebook')}
          sx={{
            minWidth: 'auto',
            width: 36,
            height: 36,
            borderRadius: '50%',
            borderColor: '#1877F2',
            color: '#1877F2',
            p: 0,
            '&:hover': {
              bgcolor: '#1877F2',
              color: 'white',
              borderColor: '#1877F2',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <FacebookIcon fontSize="small" />
        </Button>
      </Tooltip>
      
      <Tooltip title="Share on LinkedIn" arrow>
        <Button
          size="small"
          variant="outlined"
          onClick={() => share('linkedin')}
          sx={{
            minWidth: 'auto',
            width: 36,
            height: 36,
            borderRadius: '50%',
            borderColor: '#0A66C2',
            color: '#0A66C2',
            p: 0,
            '&:hover': {
              bgcolor: '#0A66C2',
              color: 'white',
              borderColor: '#0A66C2',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <LinkedInIcon fontSize="small" />
        </Button>
      </Tooltip>

      <Tooltip title="Share on WhatsApp" arrow>
        <Button
          size="small"
          variant="outlined"
          onClick={() => share('whatsapp')}
          sx={{
            minWidth: 'auto',
            width: 36,
            height: 36,
            borderRadius: '50%',
            borderColor: '#25D366',
            color: '#25D366',
            p: 0,
            '&:hover': {
              bgcolor: '#25D366',
              color: 'white',
              borderColor: '#25D366',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <WhatsAppIcon fontSize="small" />
        </Button>
      </Tooltip>
    </Box>
  );
}
