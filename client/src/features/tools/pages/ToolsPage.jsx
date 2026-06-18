import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Container, Typography, Tabs, Tab, Button, Slider, IconButton,
  Card, CardContent, TextField, LinearProgress, Alert, Select, MenuItem,
  FormControl, InputLabel, Tooltip, Grid, Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CropIcon from '@mui/icons-material/Crop';
import CompressIcon from '@mui/icons-material/Compress';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DrawIcon from '@mui/icons-material/Draw';
import MergeIcon from '@mui/icons-material/Layers';
import SwapIcon from '@mui/icons-material/SwapHoriz';
import BrushIcon from '@mui/icons-material/Brush';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkIcon from '@mui/icons-material/Work';
import Layout from '../../blog/components/Layout';
import Seo from '../../blog/components/Seo';
import PostCard from '../../blog/components/PostCard';

function TabPanel({ children, value, index }) {
  return value === index && <Box sx={{ py: 3 }}>{children}</Box>;
}

const tools = [
  { label: 'Photo Compressor', icon: <CompressIcon /> },
  { label: 'Image to PDF', icon: <PictureAsPdfIcon /> },
  { label: 'Passport Cropper', icon: <CropIcon /> },
  { label: 'PDF Compressor', icon: <CompressIcon /> },
  { label: 'Signature Maker', icon: <DrawIcon /> },
  { label: 'Merge PDF', icon: <MergeIcon /> },
  { label: 'Format Converter', icon: <SwapIcon /> },
  { label: 'Bg Whitener', icon: <BrushIcon /> },
  { label: 'Age Calculator', icon: <CalendarMonthIcon /> },
];

function TopPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts?limit=6&fields=title,slug,excerpt,featuredImage,category')
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || posts.length === 0) return null;

  return (
    <Box sx={{ mt: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary' }}>
          Top Trending Posts
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {posts.map((post) => (
          <Card key={post._id} sx={{ cursor: 'pointer' }}>
            <PostCard post={post} />
          </Card>
        ))}
      </Box>
    </Box>
  );
}

function NewJobs() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts?limit=6&category=Sarkari%20Jobs%20%26%20Exams&fields=title,slug,excerpt,featuredImage,category')
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || posts.length === 0) return null;

  return (
    <Box sx={{ mt: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <WorkIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary' }}>
          Latest Govt Jobs & Notifications
        </Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {posts.map((post) => (
          <Card key={post._id} sx={{ cursor: 'pointer' }}>
            <PostCard post={post} />
          </Card>
        ))}
      </Box>
    </Box>
  );
}

export default function ToolsPage() {
  const [tab, setTab] = useState(0);

  const seoSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Student Utility Tools for Government Exams - Digital Home',
    url: 'https://www.digitalhomeblog.in/tools',
    applicationCategory: 'Multimedia',
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires JavaScript',
    description: 'Free online student utility tools for Indian government exam forms: photo compressor under 20KB, passport size photo cropper 3.5x4.5 cm, age calculator for government forms, image to PDF converter, signature maker, and PDF compressor. All tools work offline in your browser.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    author: { '@type': 'Organization', name: 'Digital Home' }
  };

  return (
    <Layout>
      <Seo
        title="Free Student Utility Tools - Photo Compressor, Passport Cropper, Age Calculator"
        description="Free online tools for government exam students: compress photo to 20KB, passport size photo cropper 3.5x4.5 cm, age calculator for government forms, image to PDF converter, and PDF compressor. All browser-based, no upload needed."
        keywords="photo compressor under 20kb, passport size photo resizer online, age calculator for government forms, image to pdf converter free, pdf compressor, signature maker, image format converter, ssc photo resize tool"
        jsonLd={seoSchema}
      />
      <Box sx={{ py: { xs: 3, md: 5 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Container maxWidth="lg" disableGutters>
          <Box sx={{ mb: 4, px: { xs: 0.5, sm: 0 } }}>
            <Typography variant="h4" fontWeight={900} gutterBottom sx={{ fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }, color: 'text.primary', mb: 1 }}>
              📋 Student Utility Tools
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
              Sarkari form mein chahe photo resize karna ho, PDF banana ho, signature chahiye — sab kuch yahin free me karo.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              Sarkari exams jaise SSC, UPSC, Railway aur Banking ke form bharte waqt students ko photo size 20KB se kam karna, signature crop karna, documents ko PDF me badalna aur exact age calculate karna hota hai. Yeh saare tools aapke browser mein locally chalte hain — koi server upload nahi, koi data leak nahi.
            </Typography>
          </Box>
          <Tabs 
            value={tab} 
            onChange={(_, v) => setTab(v)} 
            variant="scrollable" 
            scrollButtons="auto" 
            allowScrollButtonsMobile
            sx={{ 
              mb: 3,
              '& .MuiTabs-indicator': {
                display: 'none'
              },
              '& .MuiTabs-flexContainer': {
                gap: 1.2,
                py: 0.5,
              },
            }}
          >
            {tools.map((t, i) => {
              const isSelected = tab === i;
              return (
                <Tab 
                  key={i} 
                  icon={t.icon} 
                  iconPosition="start"
                  label={t.label} 
                  sx={{ 
                    minHeight: 44, 
                    textTransform: 'none', 
                    fontWeight: 700,
                    borderRadius: '30px',
                    px: { xs: 2, sm: 2.5 },
                    py: 0.8,
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'rgba(0,0,0,0.08)',
                    bgcolor: isSelected ? 'primary.main' : '#ffffff',
                    color: isSelected ? '#ffffff !important' : '#4B5563 !important',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSelected ? '0 6px 16px rgba(79, 70, 229, 0.2)' : '0 2px 6px rgba(0,0,0,0.01)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: isSelected ? 'primary.main' : 'rgba(79, 70, 229, 0.04)',
                      transform: 'translateY(-2px)',
                    },
                    gap: 0.8,
                    fontSize: '0.88rem'
                  }} 
                />
              );
            })}
          </Tabs>
          
          <Box sx={{ mb: 4 }}>
            <TabPanel value={tab} index={0}><PhotoCompressor /></TabPanel>
            <TabPanel value={tab} index={1}><ImageToPdf /></TabPanel>
            <TabPanel value={tab} index={2}><PassportCropper /></TabPanel>
            <TabPanel value={tab} index={3}><PdfCompressor /></TabPanel>
            <TabPanel value={tab} index={4}><SignatureMaker /></TabPanel>
            <TabPanel value={tab} index={5}><MergePdf /></TabPanel>
            <TabPanel value={tab} index={6}><FormatConverter /></TabPanel>
            <TabPanel value={tab} index={7}><BgWhitener /></TabPanel>
            <TabPanel value={tab} index={8}><AgeCalculator /></TabPanel>
          </Box>

          <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '24px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', bgcolor: '#FCFBFC', mt: 4 }}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 2, fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
              {tab === 0 && 'How to Compress Photo to 20KB for Government Forms'}
              {tab === 1 && 'How to Convert Images to PDF for SSC & UPSC Forms'}
              {tab === 2 && 'Passport Size Photo Cropper 3.5 x 4.5 cm Guide'}
              {tab === 3 && 'How to Compress PDF for Online Applications'}
              {tab === 4 && 'How to Create Signature for Digital Forms'}
              {tab === 5 && 'How to Merge Multiple PDF Files for Exams'}
              {tab === 6 && 'Convert Image Format for Government Portals'}
              {tab === 7 && 'Remove Photo Background for Passport Applications'}
              {tab === 8 && 'Age Calculator for Government Forms Guide'}
            </Typography>
            {tab === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Government exam forms require photos under specific KB limits — usually 20KB, 50KB, or 100KB.
                Our <strong>photo compressor for govt exams</strong> uses aggressive compression to meet exact size targets.
                Upload your photo, use the quick presets like <strong>"Passport Photo (≤50 KB)"</strong> or <strong>"Signature (≤20 KB)"</strong>,
                and download directly. All processing happens in your browser — no server upload, no privacy risk.
              </Typography>
            )}
            {tab === 1 && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                SSC, UPSC, Railway aur Banking forms mein aadhar card, marksheet, caste certificate sabhi documents
                ki scanned copy ek hi PDF me upload karni hoti hai. Yeh <strong>image to PDF converter</strong> aapko
                multiple photos ko A4 size PDF mein combine karne deta hai. Arrow buttons se images ko reorder bhi kar
                sakte hain taaki sequence sahi rahe.
              </Typography>
            )}
            {tab === 2 && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                HAR <strong>passport size photo cropper 3.5 x 4.5 cm</strong> form ka standard size hai. Chahe SSC
                ho ya UPSC Police, photo ka exact ratio 3.5cm by 4.5cm hona chahiye. Yeh tool aapko blue box drag
                karke face ko adjust karne deta hai, aur dynamic touch options support ke saath mobile browser me bhi perfect work karega. automatically 413×531 pixels (300 DPI) ki image JPEG format
                mein download hoti hai — ready for upload.
              </Typography>
            )}
            {tab === 3 && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Kafi portals pe PDF size 500KB se 1MB se upar nahi hona chahiye. Hamara <strong>PDF compressor</strong>
                har page ko re-render karta hai, images ko downsample karta hai aur metadata strip karta.
                Four presets hain — Maximum se 80%+ compression, Low se 15-30% reduction. Quality bar adjust karke
                perfect balance paayein.
              </Typography>
            )}
            {tab === 4 && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Digital signatures ke liye ab kisi app ki zaroorat nahi. Yeh <strong>signature maker</strong> tool
                mouse ya finger se sign draw karne deta hai, phir JPEG format mein white background ke saath download
                karta hai. Govt forms transparent signatures reject karte hain, isliye background white rakha gaya hai.
                Stroke bold (3.5px) hai taaki form me clear dikhe.
              </Typography>
            )}
            {tab === 5 && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Multiple PDF files (jaise aadhar, marksheet, certificates) ko ek single PDF mein merge karna
                sarkari forms ke liye zaroori hota hai. Yeh <strong>merge PDF tool</strong> aapko up/down arrows
                se files reorder karne deta hai, phir exact usi sequence mein merged PDF generate karta hai.
              </Typography>
            )}
            {tab === 6 && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Kuch government portals sirf JPG format accept karte hain, kuch sirf PNG. Yeh <strong>image format converter</strong>
                PNG ↔ JPG ↔ WebP me badalta hai. Transparent PNG ko JPG me convert karte waqt white background auto add
                hota hai (black bg nahi aayega). Quality slider se file size control karein.
              </Typography>
            )}
            {tab === 7 && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Passport aur government forms ke liye white background wali photo chahiye hoti hai. Yeh <strong>AI background remover</strong>
                browser mein hi TensorFlow.js chalata hai — free, koi server cost nahi. Model pehli baar ~40MB download hota hai,
                phir cached rehta hai. Background remove hone ke baad pure white (#FFFFFF) background pe composite hota hai
                aur 413×531px JPEG download hota hai.
              </Typography>
            )}
            {tab === 8 && (
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                Sarkari forms mein exact age years, months aur days me likhni hoti hai. Yeh <strong>age calculator for government forms</strong>
                birth date dalne par correct age count karta hai — months me days borrow karte waqt saari edge cases handle ki gayi hain
                (jaise Jan 31 se March 1). "As on" date bhi daal sakte hain agar form me kisi specific date tak age chahiye.
              </Typography>
            )}
          </Paper>

          <NewJobs />
          <TopPosts />
        </Container>
      </Box>
    </Layout>
  );
}

const formatBytes = (b) => b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`;

function FileUploadZone({ accept, onChange, label, sublabel, icon, multiple = false }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onChange({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <Box
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      sx={{
        border: '2px dashed',
        borderColor: dragActive ? 'primary.main' : 'rgba(79, 70, 229, 0.25)',
        borderRadius: '16px',
        bgcolor: dragActive ? 'rgba(79, 70, 229, 0.04)' : '#FCFBFC',
        p: { xs: 2.5, sm: 4 },
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'rgba(79, 70, 229, 0.02)',
          transform: 'scale(1.005)'
        },
        mb: 2,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        style={{ display: 'none' }}
        multiple={multiple}
      />
      <Box sx={{ color: 'primary.main', mb: 1.5, display: 'flex', justifyContent: 'center' }}>
        {icon || <CloudUploadIcon sx={{ fontSize: { xs: 36, sm: 44 } }} />}
      </Box>
      <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5, fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
        {sublabel || 'Drag & drop file here, or click to browse'}
      </Typography>
    </Box>
  );
}

function PhotoCompressor() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compressed, setCompressed] = useState(null);
  const [targetSize, setTargetSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [origSize, setOrigSize] = useState(0);

  const doCompress = useCallback(async (f, targetKB) => {
    setLoading(true);
    setCompressed(null);
    let currentFile = f;
    let iteration = 0;
    const maxIterations = 30;
    let maxDim = 2000;
    let quality = 0.8;

    try {
      const imageCompression = (await import('browser-image-compression')).default;
      while (iteration < maxIterations) {
      try {
        const out = await imageCompression(currentFile, {
          maxSizeMB: targetKB / 1024,
          maxWidthOrHeight: maxDim,
          useWebWorker: false,
          fileType: 'image/jpeg',
          initialQuality: quality,
        });
        if (out.size / 1024 <= targetKB) {
          setCompressed(out);
          setLoading(false);
          return;
        }
        currentFile = out;
      } catch {}
      maxDim = Math.floor(maxDim * 0.75);
      quality = Math.max(0.15, quality - 0.12);
      iteration++;
    }
    } catch (err) {
      console.error("Compression library failed to load:", err);
    }
    try {
      const img = new Image();
      img.src = URL.createObjectURL(f);
      await new Promise(r => { img.onload = r; });
      let w = img.naturalWidth, h = img.naturalHeight;
      let dim = Math.max(w, h);
      while (dim > 50) {
        const scale = 80 / dim;
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.floor(w * scale));
        c.height = Math.max(1, Math.floor(h * scale));
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.4));
        if (blob.size / 1024 <= targetKB) { setCompressed(new File([blob], f.name, { type: 'image/jpeg' })); setLoading(false); return; }
        dim = Math.floor(dim * 0.65);
        w = Math.floor(w * 0.65);
        h = Math.floor(h * 0.65);
      }
    } catch {}
    setLoading(false);
  }, []);

  const handleUpload = useCallback(async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setOrigSize(f.size);
    setPreview(URL.createObjectURL(f));
    await doCompress(f, targetSize);
  }, [targetSize, doCompress]);

  const handleSlider = async (_, val) => {
    setTargetSize(val);
    if (file) await doCompress(file, val);
  };

  const quickResize = async (kb) => {
    setTargetSize(kb);
    if (file) await doCompress(file, kb);
  };

  return (
    <Card sx={{
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      border: '1px solid rgba(0,0,0,0.06)',
      '&:hover': { transform: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'text.primary', mb: 1 }}>Photo / Sign Resizer</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Photo ko exact KB me resize karein: <strong>{targetSize} KB</strong></Typography>
        
        <Box sx={{ display: 'flex', gap: 1.2, mb: 3, flexWrap: 'wrap' }}>
          <Button size="small" variant={targetSize === 50 ? 'contained' : 'outlined'} onClick={() => quickResize(50)} sx={{ borderRadius: '20px', textTransform: 'none', px: 2.5, py: 0.6 }}>📷 Passport Photo (≤50 KB)</Button>
          <Button size="small" variant={targetSize === 20 ? 'contained' : 'outlined'} onClick={() => quickResize(20)} sx={{ borderRadius: '20px', textTransform: 'none', px: 2.5, py: 0.6 }}>✍️ Signature (≤20 KB)</Button>
          <Button size="small" variant={targetSize === 10 ? 'contained' : 'outlined'} onClick={() => quickResize(10)} sx={{ borderRadius: '20px', textTransform: 'none', px: 2.5, py: 0.6 }}>📄 Sign (≤10 KB)</Button>
        </Box>
        
        <Slider value={targetSize} onChange={handleSlider} min={3} max={200} step={1} valueLabelDisplay="auto" valueLabelFormat={v => `${v} KB`} sx={{ mb: 4 }} />
        
        <FileUploadZone
          accept="image/*"
          onChange={handleUpload}
          label="Upload Photo or Signature"
          sublabel="Drag and drop your image here, or click to browse"
        />

        {loading && <LinearProgress sx={{ mt: 3, borderRadius: 2 }} />}
        
        {preview && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#FAF9FA', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} />
            <Typography variant="caption" display="block" sx={{ mt: 2, fontWeight: 600 }}>Original: {formatBytes(origSize)} {compressed && ` → Compressed: ${formatBytes(compressed.size)} ✅`}</Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', width: '100%' }}>
              {compressed && (
                <Button variant="contained" startIcon={<DownloadIcon />} href={URL.createObjectURL(compressed)} download={`compressed.${compressed.name.split('.').pop() || 'jpg'}`} sx={{ borderRadius: '12px', textTransform: 'none' }}>Download ({formatBytes(compressed.size)})</Button>
              )}
              <IconButton color="error" onClick={() => { setFile(null); setPreview(null); setCompressed(null); }} sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' } }}><DeleteIcon /></IconButton>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function ImageToPdf() {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleAdd = useCallback((e) => {
    Array.from(e.target.files || []).forEach(f => {
      setImages(prev => [...prev, f]);
      setPreviews(prev => [...prev, URL.createObjectURL(f)]);
    });
  }, []);

  const remove = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => { URL.revokeObjectURL(prev[i]); return prev.filter((_, idx) => idx !== i); });
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    setImages(prev => { const a = [...prev]; [a[i], a[j]] = [a[j], a[i]]; return a; });
    setPreviews(prev => { const a = [...prev]; [a[i], a[j]] = [a[j], a[i]]; return a; });
  };

  const generatePdf = async () => {
    if (!images.length) return;
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const m = 10;
      const mw = pw - m * 2;
      previews.forEach((url, i) => {
        if (i > 0) pdf.addPage();
        const img = new Image();
        img.src = url;
        const r = img.naturalWidth / img.naturalHeight || 1;
        let w = mw, h = w / r;
        if (h > ph - m * 2) { h = ph - m * 2; w = h * r; }
        pdf.addImage(url, 'JPEG', m, m, w, h);
      });
      pdf.save('combined-document.pdf');
    } catch (err) {
      alert("Failed to load PDF generation library: " + err.message);
    }
  };

  return (
    <Card sx={{
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      border: '1px solid rgba(0,0,0,0.06)',
      '&:hover': { transform: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'text.primary', mb: 1 }}>📄 Image to PDF Converter</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Documents/photos ko ek PDF me combine karein. Images ko drag/arrow se reorder karein.</Typography>
        
        <FileUploadZone
          accept="image/*"
          onChange={handleAdd}
          multiple={true}
          label="Add Marks sheets, certificates or pictures"
          sublabel="Drag & drop images here, or click to choose (multiple allowed)"
          icon={<AddPhotoAlternateIcon sx={{ fontSize: { xs: 36, sm: 44 } }} />}
        />

        {images.length > 0 && (
          <>
            <Typography variant="caption" sx={{ mt: 2.5, display: 'block', fontWeight: 700, color: 'text.primary' }}>{images.length} image(s) — Arrow buttons se order badle, PDF usi sequence me banega:</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mt: 1.5 }}>
              {previews.map((url, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.2, border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px', bgcolor: '#FAF9FA' }}>
                  <Typography variant="body2" fontWeight={800} color="text.secondary" sx={{ minWidth: 20 }}>#{i + 1}</Typography>
                  <img src={url} alt="" style={{ height: 48, width: 48, objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }} />
                  <Box sx={{ display: 'flex', gap: 0.2 }}>
                    <Tooltip title="Move Up"><span><IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)} sx={{ p: 0.5 }}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Move Down"><span><IconButton size="small" disabled={i === images.length - 1} onClick={() => move(i, 1)} sx={{ p: 0.5 }}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
                  </Box>
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{images[i].name.slice(0, 20)}</Typography>
                  <IconButton size="small" color="error" onClick={() => remove(i)} sx={{ ml: 1, bgcolor: 'rgba(239, 68, 68, 0.05)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </Box>
            <Button variant="contained" startIcon={<PictureAsPdfIcon />} onClick={generatePdf} sx={{ mt: 3, borderRadius: '12px', textTransform: 'none' }}>Download PDF ({images.length} pages)</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PassportCropper() {
  const [preview, setPreview] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const boxSize = 240; // Reduced slightly to fit small mobile screens better

  const handleUpload = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setCrop({ x: 0, y: 0 });
  }, []);

  const handleCrop = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const ctx = canvas.getContext('2d');
    const tw = 413, th = 531;
    canvas.width = tw;
    canvas.height = th;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tw, th);
    const dw = img.clientWidth, dh = img.clientHeight;
    const sx = (crop.x / dw) * img.naturalWidth;
    const sy = (crop.y / dh) * img.naturalHeight;
    const sw = (boxSize / dw) * img.naturalWidth;
    const sh = (boxSize / dh) * img.naturalHeight;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
    canvas.toBlob(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'passport-photo.jpg';
      a.click();
    }, 'image/jpeg', 0.95);
  }, [crop]);

  const updateCropPosition = useCallback((clientX, clientY, currentTarget) => {
    const rect = currentTarget.getBoundingClientRect();
    setCrop({
      x: Math.max(0, Math.min(clientX - rect.left - boxSize / 2, rect.width - boxSize)),
      y: Math.max(0, Math.min(clientY - rect.top - boxSize / 2, rect.height - boxSize)),
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!e.buttons) return;
    updateCropPosition(e.clientX, e.clientY, e.currentTarget);
  }, [updateCropPosition]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches && e.touches[0]) {
      e.preventDefault(); // Prevent scrolling mobile screen while dragging
      updateCropPosition(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
    }
  }, [updateCropPosition]);

  return (
    <Card sx={{
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      border: '1px solid rgba(0,0,0,0.06)',
      '&:hover': { transform: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'text.primary', mb: 1 }}>🖼️ Passport Size Cropper</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>3.5cm × 4.5cm — SSC, UPSC, Railway & all govt forms</Typography>
        
        <FileUploadZone
          accept="image/*"
          onChange={handleUpload}
          label="Upload Photo for Passport"
          sublabel="Drag and drop photo here, or click to select"
        />

        {preview && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Box 
              sx={{ 
                position: 'relative', 
                display: 'inline-block', 
                overflow: 'hidden', 
                borderRadius: '16px', 
                border: '2px dashed rgba(0,0,0,0.15)', 
                cursor: 'crosshair',
                touchAction: 'none' // Important to disable browser drag/scroll
              }} 
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onTouchStart={handleTouchMove}
            >
              <img ref={imgRef} src={preview} alt="" draggable={false} style={{ maxWidth: '100%', maxHeight: 380, display: 'block', borderRadius: '14px' }} />
              <Box sx={{ 
                position: 'absolute', 
                border: '2.5px solid #1976d2', 
                bgcolor: 'rgba(25,118,210,0.06)', 
                pointerEvents: 'none', 
                borderRadius: '8px', 
                boxShadow: '0 0 12px rgba(25,118,210,0.4)', 
                left: crop.x, 
                top: crop.y, 
                width: boxSize, 
                height: boxSize 
              }} />
            </Box>
            <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary', fontWeight: 600 }}>Drag the blue box around your face → Crop & Download</Typography>
            <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5, justifyContent: 'center' }}>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleCrop} sx={{ borderRadius: '12px', textTransform: 'none', px: 3 }}>Crop & Download</Button>
              <IconButton color="error" onClick={() => setPreview(null)} sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' } }}><DeleteIcon /></IconButton>
            </Box>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function PdfCompressor() {
  const [file, setFile] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [origSize, setOrigSize] = useState(0);
  const [compSize, setCompSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [quality, setQuality] = useState(0.5);
  const [scale, setScale] = useState(0.7);
  const [preset, setPreset] = useState(2);

  const qualityPresets = [
    { label: 'Maximum', scale: 0.4, quality: 0.25, desc: 'Smallest size (>80% reduction)' },
    { label: 'High',    scale: 0.55, quality: 0.4, desc: 'Aggressive (60-80% smaller)' },
    { label: 'Medium',  scale: 0.7, quality: 0.5, desc: 'Balanced (40-60% smaller)' },
    { label: 'Low',     scale: 1.0, quality: 0.7, desc: 'Light (15-30% smaller)' },
  ];

  const applyPreset = (idx) => { setPreset(idx); setScale(qualityPresets[idx].scale); setQuality(qualityPresets[idx].quality); };

  const handleUpload = useCallback(async (e) => {
    const f = e.target.files?.[0];
    if (!f || f.type !== 'application/pdf') return alert('Only PDF files allowed');
    setFile(f); setOrigSize(f.size); setCompressedUrl(null); setProgress(0); setTotalPages(0);
    setLoading(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs';
      const data = await f.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data }).promise;
      const numPages = doc.numPages;
      setTotalPages(numPages);
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const margin = 5, maxW = pw - margin * 2, maxH = ph - margin * 2;
      for (let i = 1; i <= numPages; i++) {
        setProgress(i);
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        if (i > 1) pdf.addPage();
        const aspect = canvas.width / canvas.height;
        let w = maxW, h = w / aspect;
        if (h > maxH) { h = maxH; w = h * aspect; }
        pdf.addImage(canvas.toDataURL('image/jpeg', quality), 'JPEG', margin, margin, w, h);
        canvas.width = 0; canvas.height = 0;
      }
      const blob = pdf.output('blob');
      setCompressedUrl(URL.createObjectURL(blob));
      setCompSize(blob.size);
    } catch (e) { alert('Compression failed: ' + e.message); }
    setLoading(false);
  }, [scale, quality]);

  return (
    <Card sx={{
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      border: '1px solid rgba(0,0,0,0.06)',
      '&:hover': { transform: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'text.primary', mb: 1 }}>📦 PDF Compressor</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>PDF ko aggressively compress karein — 2MB+ PDF ko 200-500KB me badle</Typography>
        
        <Box sx={{ display: 'flex', gap: 1.2, mb: 3, flexWrap: 'wrap' }}>
          {qualityPresets.map((p, i) => (
            <Button key={i} size="small" variant={preset === i ? 'contained' : 'outlined'} onClick={() => applyPreset(i)} sx={{ borderRadius: '20px', textTransform: 'none', px: 2, py: 0.6, fontSize: '0.75rem' }}>{p.label}</Button>
          ))}
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" fontWeight={600} sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>Image Scale: {(scale * 100).toFixed(0)}%</Typography>
          <Slider value={scale} onChange={(_, v) => { setScale(v); setPreset(-1); }} min={0.2} max={1.5} step={0.05} valueLabelDisplay="auto" valueLabelFormat={v => `${(v * 100).toFixed(0)}%`} size="small" />
        </Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="caption" fontWeight={600} sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>JPEG Quality: {(quality * 100).toFixed(0)}%</Typography>
          <Slider value={quality} onChange={(_, v) => { setQuality(v); setPreset(-1); }} min={0.1} max={1} step={0.05} valueLabelDisplay="auto" valueLabelFormat={v => `${(v * 100).toFixed(0)}%`} size="small" />
        </Box>

        <FileUploadZone
          accept="application/pdf"
          onChange={handleUpload}
          label="Upload PDF File"
          sublabel="Drag and drop PDF here, or click to browse"
          icon={<PictureAsPdfIcon sx={{ fontSize: { xs: 36, sm: 44 } }} />}
        />

        {loading && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#FAF9FA', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)' }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 1 }}>{totalPages > 0 ? `Processing page ${progress}/${totalPages}...` : 'Loading PDF...'}</Typography>
            <LinearProgress variant={totalPages > 0 ? 'determinate' : 'indeterminate'} value={totalPages > 0 ? (progress / totalPages) * 100 : undefined} sx={{ borderRadius: 2 }} />
          </Box>
        )}
        
        {file && !loading && <Typography variant="caption" sx={{ mt: 2, display: 'block', fontWeight: 600, color: 'text.primary' }}>Original Size: {formatBytes(origSize)}</Typography>}
        
        {compressedUrl && (
          <Box sx={{ mt: 2.5, p: 2, bgcolor: '#DCFCE7', borderRadius: '16px', border: '1px solid #BBF7D0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Typography variant="body2" display="block" fontWeight={700} sx={{ color: '#15803D', mb: 1.5 }}>Compressed: {formatBytes(compSize)} <span style={{ color: compSize < origSize ? '#166534' : '#b91c1c' }}>({(100 - compSize / origSize * 100).toFixed(1)}% smaller)</span></Typography>
            <Button variant="contained" color="success" startIcon={<DownloadIcon />} href={compressedUrl} download="compressed.pdf" sx={{ borderRadius: '12px', textTransform: 'none', px: 3 }}>Download Compressed PDF</Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function SignatureMaker() {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    const resize = () => { c.width = c.clientWidth; c.height = 300; };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const start = useCallback((e) => {
    drawing.current = true;
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const p = e.touches ? { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top } : { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    c.getContext('2d').beginPath();
    c.getContext('2d').moveTo(p.x, p.y);
  }, []);

  const move = useCallback((e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const p = e.touches ? { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top } : { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    c.getContext('2d').lineTo(p.x, p.y);
    c.getContext('2d').stroke();
    setHasContent(true);
  }, []);

  const end = useCallback(() => { drawing.current = false; }, []);

  const clear = () => { canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); setHasContent(false); };

  const download = () => {
    const c = canvasRef.current;
    const tmp = document.createElement('canvas');
    tmp.width = c.width;
    tmp.height = c.height;
    const ctx = tmp.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(c, 0, 0);
    tmp.toBlob(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'signature.jpg';
      a.click();
    }, 'image/jpeg', 0.95);
  };

  return (
    <Card sx={{
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      border: '1px solid rgba(0,0,0,0.06)',
      '&:hover': { transform: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'text.primary', mb: 1 }}>✍️ Signature Maker</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Mouse ya finger se sign karein → JPEG download karein (white background)</Typography>
        <Box sx={{ 
          border: '2px dashed rgba(79, 70, 229, 0.25)', 
          borderRadius: '16px', 
          bgcolor: '#FAF9FA', 
          touchAction: 'none', 
          cursor: 'crosshair',
          overflow: 'hidden',
          transition: 'border-color 0.3s ease',
          '&:hover': { borderColor: 'primary.main' }
        }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}>
          <canvas ref={canvasRef} style={{ width: '100%', height: 300, display: 'block' }} />
        </Box>
        <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'text.secondary', fontWeight: 600 }}>Draw your signature above</Typography>
        <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={download} disabled={!hasContent} sx={{ borderRadius: '12px', textTransform: 'none', px: 3 }}>Download Signature (JPEG)</Button>
          <Button variant="outlined" color="error" onClick={clear} disabled={!hasContent} sx={{ borderRadius: '12px', textTransform: 'none', px: 3 }}>Clear</Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function MergePdf() {
  const [files, setFiles] = useState([]);
  const [merging, setMerging] = useState(false);

  const handleAdd = useCallback((e) => { setFiles(prev => [...prev, ...Array.from(e.target.files || [])]); }, []);
  const remove = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));
  const move = (i, dir) => { const j = i + dir; if (j < 0 || j >= files.length) return; setFiles(prev => { const a = [...prev]; [a[i], a[j]] = [a[j], a[i]]; return a; }); };

  const merge = async () => {
    if (files.length < 2) return alert('Kam se kam 2 PDF files chahiye');
    setMerging(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();
      for (const f of files) {
        const doc = await PDFDocument.load(await f.arrayBuffer());
        const idx = await merged.copyPages(doc, doc.getPages().map((_, i) => i));
        idx.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'merged-document.pdf';
      a.click();
    } catch (e) { alert('Merge failed: ' + e.message); }
    setMerging(false);
  };

  return (
    <Card sx={{
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      border: '1px solid rgba(0,0,0,0.06)',
      '&:hover': { transform: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'text.primary', mb: 1 }}>🔗 Merge PDF Files</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Multiple PDF files ko ek single PDF me merge karein — up/down arrows se order badle</Typography>
        
        <FileUploadZone
          accept="application/pdf"
          onChange={handleAdd}
          multiple={true}
          label="Upload PDF Files to Merge"
          sublabel="Drag & drop multiple PDF files here, or click to select"
          icon={<MergeIcon sx={{ fontSize: { xs: 36, sm: 44 } }} />}
        />

        {files.length > 0 && (
          <>
            <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {files.map((f, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.2, border: '1px solid rgba(0,0,0,0.05)', borderColor: 'divider', borderRadius: '12px', bgcolor: '#FAF9FA' }}>
                  <Typography variant="body2" fontWeight={800} color="text.secondary" sx={{ minWidth: 20 }}>#{i + 1}</Typography>
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.9rem' } }} noWrap>{f.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>{formatBytes(f.size)}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.2 }}>
                    <Tooltip title="Move Up"><span><IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)} sx={{ p: 0.5 }}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Move Down"><span><IconButton size="small" disabled={i === files.length - 1} onClick={() => move(i, 1)} sx={{ p: 0.5 }}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => remove(i)} sx={{ bgcolor: 'rgba(239, 68, 68, 0.05)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </Box>
            {merging && <LinearProgress sx={{ mt: 2, borderRadius: 2 }} />}
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={merge} disabled={merging || files.length < 2} sx={{ mt: 3, borderRadius: '12px', textTransform: 'none', px: 3 }}>Merge & Download ({files.length} files)</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FormatConverter() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(90);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setConvertedUrl(null);
  }, []);

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    const img = new Image();
    img.src = preview;
    await new Promise(r => { img.onload = r; });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    const mimeType = format === 'jpg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/webp';
    c.toBlob(b => {
      setConvertedUrl(URL.createObjectURL(b));
      setLoading(false);
    }, mimeType, quality / 100);
  };

  return (
    <Card sx={{
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      border: '1px solid rgba(0,0,0,0.06)',
      '&:hover': { transform: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'text.primary', mb: 1 }}>🔄 Image Format Converter</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>PNG ↔ JPG ↔ WebP — kisi bhi format me badle</Typography>
        
        <FileUploadZone
          accept="image/*"
          onChange={handleUpload}
          label="Upload Image to Convert"
          sublabel="Drag and drop your image here, or click to browse"
        />

        {preview && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#FAF9FA', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={preview} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
            <Box sx={{ display: 'flex', gap: 2, mt: 3, alignItems: 'center', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Format</InputLabel>
                <Select value={format} label="Format" onChange={(e) => setFormat(e.target.value)}>
                  <MenuItem value="png">PNG</MenuItem>
                  <MenuItem value="jpg">JPG</MenuItem>
                  <MenuItem value="webp">WebP</MenuItem>
                </Select>
              </FormControl>
              {format !== 'png' && (
                <Box sx={{ minWidth: 200, flex: { xs: '1 0 100%', sm: 'none' }, px: 2 }}>
                  <Typography variant="caption" fontWeight={600} sx={{ color: 'text.secondary' }}>Quality: {quality}%</Typography>
                  <Slider value={quality} onChange={(_, v) => setQuality(v)} min={10} max={100} size="small" />
                </Box>
              )}
            </Box>
            {loading && <LinearProgress sx={{ mt: 2, width: '100%', borderRadius: 2 }} />}
            <Box sx={{ mt: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={convert} disabled={loading} sx={{ borderRadius: '12px', textTransform: 'none', px: 3 }}>Convert Format</Button>
              {convertedUrl && (
                <Button variant="outlined" color="success" startIcon={<DownloadIcon />} href={convertedUrl} download={`converted.${format}`} sx={{ borderRadius: '12px', textTransform: 'none', px: 3 }}>Save Image</Button>
              )}
              <IconButton color="error" onClick={() => { setFile(null); setPreview(null); setConvertedUrl(null); }} sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' } }}><DeleteIcon /></IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, fontWeight: 600 }}>Note: Government application forms ke liye <strong>JPG/JPEG</strong> format select karein</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function BgWhitener() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleUpload = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setProcessedUrl(null);
  }, []);

  const whiten = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Loading AI model (first time may take ~10s)...');
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const resultBlob = await removeBackground(preview, {
        progress: (key, current, total) => {
          const pct = total > 0 ? Math.round((current / total) * 100) : '';
          setStatus(key === 'download' ? `Downloading model... ${pct}%` : `Processing... ${pct}%`);
        }
      });
      setStatus('Compositing on white background...');
      const img = new Image();
      img.src = URL.createObjectURL(resultBlob);
      await new Promise(r => { img.onload = r; });
      const c = document.createElement('canvas');
      const tw = 413, th = 531;
      c.width = tw;
      c.height = th;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tw, th);
      const r = img.naturalWidth / img.naturalHeight;
      let dw, dh;
      if (r > tw / th) { dw = tw; dh = dw / r; } else { dh = th; dw = dh * r; }
      const dx = (tw - dw) / 2;
      const dy = (th - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      c.toBlob(b => {
        setProcessedUrl(URL.createObjectURL(b));
        setLoading(false);
        setStatus('');
      }, 'image/jpeg', 0.95);
    } catch (e) {
      setStatus('');
      alert('Background removal failed: ' + e.message + '. Try uploading a clear photo with good lighting.');
      setLoading(false);
    }
  };

  return (
    <Card sx={{
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      border: '1px solid rgba(0,0,0,0.06)',
      '&:hover': { transform: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'text.primary', mb: 1 }}>☀️ Photo Background Remover</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>AI automatic background remove karein → pure white background → passport ready JPEG</Typography>
        
        <FileUploadZone
          accept="image/*"
          onChange={handleUpload}
          label="Upload Photo for Background Removal"
          sublabel="Drag and drop photo here, or click to select"
        />

        {status && <Typography variant="caption" sx={{ mt: 2, display: 'block', fontWeight: 700, color: 'primary.main' }}>{status}</Typography>}
        {loading && <LinearProgress sx={{ mt: 1.5, borderRadius: 2 }} />}
        
        {preview && (
          <Box sx={{ mt: 3, display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 1 }}>Original</Typography>
              <img src={preview} alt="" style={{ maxWidth: 140, maxHeight: 170, borderRadius: 8, display: 'block', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
            </Box>
            {processedUrl && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 1 }}>White Background (413×531px)</Typography>
                <img src={processedUrl} alt="" style={{ maxWidth: 140, maxHeight: 170, borderRadius: 8, display: 'block', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
              </Box>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
              <Button variant="contained" startIcon={<BrushIcon />} onClick={whiten} disabled={loading} sx={{ borderRadius: '12px', textTransform: 'none', width: '100%' }}>{loading ? 'Processing...' : 'Remove & Whiten Background'}</Button>
              {processedUrl && (
                <Button variant="outlined" color="success" startIcon={<DownloadIcon />} href={processedUrl} download="passport-white-bg.jpg" sx={{ borderRadius: '12px', textTransform: 'none', width: '100%' }}>Download JPEG</Button>
              )}
              <IconButton color="error" onClick={() => { setFile(null); setPreview(null); setProcessedUrl(null); }} sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' } }}><DeleteIcon /></IconButton>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function AgeCalculator() {
  const [dob, setDob] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [age, setAge] = useState(null);

  const calcAge = (birth, asOn) => {
    let y = asOn.getFullYear() - birth.getFullYear();
    let m = asOn.getMonth() - birth.getMonth();
    let d = asOn.getDate() - birth.getDate();
    let safety = 0;
    while (d < 0 && safety < 3) { m--; d += new Date(asOn.getFullYear(), asOn.getMonth() - 1 - safety, 0).getDate(); safety++; }
    if (d < 0) d = 0;
    while (m < 0) { y--; m += 12; }
    while (m >= 12) { y++; m -= 12; }
    return { years: y, months: m, days: d };
  };

  const calculate = () => {
    if (!dob) return;
    const birth = new Date(dob);
    const asOn = targetDate ? new Date(targetDate) : new Date();
    setAge(calcAge(birth, asOn));
  };

  return (
    <Card sx={{
      borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
      border: '1px solid rgba(0,0,0,0.06)',
      '&:hover': { transform: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: 'text.primary', mb: 1 }}>📅 Age Calculator</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Sarkari form ke liye exact saal, mahine aur din (100% accurate)</Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.8, color: 'text.primary' }}>Date of Birth</Typography>
            <TextField type="date" value={dob} onChange={(e) => setDob(e.target.value)} inputProps={{ placeholder: 'dd/mm/yyyy' }} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight={700} sx={{ mb: 0.8, color: 'text.primary' }}>As on Date (optional — default today)</Typography>
            <TextField type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} inputProps={{ placeholder: 'dd/mm/yyyy' }} fullWidth size="small" />
          </Grid>
        </Grid>

        <Button variant="contained" startIcon={<CalendarMonthIcon />} onClick={calculate} sx={{ borderRadius: '12px', textTransform: 'none', py: 1.2, fontWeight: 700 }} fullWidth>Calculate Age</Button>
        
        {age && (
          <Alert severity="success" sx={{ mt: 3, borderRadius: '16px', border: '1px solid #C3E6CB', bgcolor: '#D4EDDA', color: '#155724', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h4" fontWeight={900} sx={{ fontSize: { xs: '1.8rem', sm: '2.4rem' } }}>{age.years}y {age.months}m {age.days}d</Typography>
            <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>{age.years} years, {age.months} months, {age.days} days</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: '#155724' }}>{age.years} saal, {age.months} mahine, {age.days} din</Typography>
            <Typography variant="caption" sx={{ mt: 1.5, display: 'block', fontWeight: 700, color: '#155724', borderTop: '1px dashed rgba(21, 87, 36, 0.2)', pt: 1, width: '100%', textAlign: 'center' }}>Form me likho: {age.years} Years {age.months} Months {age.days} Days</Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}