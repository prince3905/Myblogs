import { useState } from 'react';
import { Box, Button, Typography, CircularProgress, TextField, Paper, IconButton } from '@mui/material';
import { request } from '../shared/lib/api';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const data = await request('/api/admin/upload', { method: 'POST', body: formData });
      onChange(data.url);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      {value && (
        <Paper 
          elevation={0} 
          sx={{ 
            position: 'relative', 
            mb: 2, 
            borderRadius: 2, 
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <img 
            src={value} 
            alt="preview" 
            style={{ 
              width: '100%', 
              height: 200, 
              objectFit: 'cover',
              display: 'block',
            }} 
          />
          <IconButton
            onClick={() => onChange('')}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.7)',
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Paper>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <Button
          variant="outlined"
          component="label"
          startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          disabled={uploading}
          sx={{ flex: 1 }}
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            hidden
          />
        </Button>
      </Box>
      
      <TextField
        fullWidth
        size="small"
        label="Or paste image URL"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/image.jpg"
      />
    </Box>
  );
}
