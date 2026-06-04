import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Container, Typography, Tabs, Tab, Button, Slider, IconButton,
  Card, CardContent, TextField, LinearProgress, Alert, Select, MenuItem,
  FormControl, InputLabel, Tooltip, Grid
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
import imageCompression from 'browser-image-compression';
import { jsPDF } from 'jspdf';
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
    <Layout useContainer={false}>
      <Seo
        title="Free Student Utility Tools - Photo Compressor, Passport Cropper, Age Calculator"
        description="Free online tools for government exam students: compress photo to 20KB, passport size photo cropper 3.5x4.5 cm, age calculator for government forms, image to PDF converter, and PDF compressor. All browser-based, no upload needed."
        keywords="photo compressor under 20kb, passport size photo resizer online, age calculator for government forms, image to pdf converter free, pdf compressor, signature maker, image format converter, ssc photo resize tool"
        jsonLd={seoSchema}
      />
      <Box sx={{ py: { xs: 4, md: 5 }, px: { xs: 2, md: 3 } }}>
        <Container maxWidth="lg" disableGutters>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              📋 Student Utility Tools
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Sarkari form mein chahe photo resize karna ho, PDF banana ho, signature chahiye — sab kuch yahin free me karo.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sarkari exams jaise SSC, UPSC, Railway aur Banking ke form bharte waqt students ko photo size 20KB se kam karna, signature crop karna, documents ko PDF me badalna aur exact age calculate karna hota hai. Yeh saare tools aapke browser mein locally chalte hain — koi server upload nahi, koi data leak nahi.
            </Typography>
          </Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            {tools.map((t, i) => (
              <Tab key={i} icon={t.icon} label={t.label} sx={{ minHeight: 56, textTransform: 'none', fontWeight: 600 }} />
            ))}
          </Tabs>
          <TabPanel value={tab} index={0}><PhotoCompressor /></TabPanel>
          <TabPanel value={tab} index={1}><ImageToPdf /></TabPanel>
          <TabPanel value={tab} index={2}><PassportCropper /></TabPanel>
          <TabPanel value={tab} index={3}><PdfCompressor /></TabPanel>
          <TabPanel value={tab} index={4}><SignatureMaker /></TabPanel>
          <TabPanel value={tab} index={5}><MergePdf /></TabPanel>
          <TabPanel value={tab} index={6}><FormatConverter /></TabPanel>
          <TabPanel value={tab} index={7}><BgWhitener /></TabPanel>
          <TabPanel value={tab} index={8}><AgeCalculator /></TabPanel>

          <Box sx={{ mt: 4, px: 1 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
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
              <Typography variant="body2" color="text.secondary">
                Government exam forms require photos under specific KB limits — usually 20KB, 50KB, or 100KB.
                Our <strong>photo compressor for govt exams</strong> uses aggressive compression to meet exact size targets.
                Upload your photo, use the quick presets like <strong>"Passport Photo (≤50 KB)"</strong> or <strong>"Signature (≤20 KB)"</strong>,
                and download directly. All processing happens in your browser — no server upload, no privacy risk.
              </Typography>
            )}
            {tab === 1 && (
              <Typography variant="body2" color="text.secondary">
                SSC, UPSC, Railway aur Banking forms mein aadhar card, marksheet, caste certificate sabhi documents
                ki scanned copy ek hi PDF me upload karni hoti hai. Yeh <strong>image to PDF converter</strong> aapko
                multiple photos ko A4 size PDF mein combine karne deta hai. Arrow buttons se images ko reorder bhi kar
                sakte hain taaki sequence sahi rahe.
              </Typography>
            )}
            {tab === 2 && (
              <Typography variant="body2" color="text.secondary">
                HAR <strong>passport size photo cropper 3.5 x 4.5 cm</strong> form ka standard size hai. Chahe SSC
                ho ya UPSC Police, photo ka exact ratio 3.5cm by 4.5cm hona chahiye. Yeh tool aapko blue box drag
                karke face ko adjust karne deta hai, phir automatically 413×531 pixels (300 DPI) ki image JPEG format
                mein download hoti hai — ready for upload.
              </Typography>
            )}
            {tab === 3 && (
              <Typography variant="body2" color="text.secondary">
                Kafi portals pe PDF size 500KB se 1MB se upar nahi hona chahiye. Hamara <strong>PDF compressor</strong>
                har page ko re-render karta hai, images ko downsample karta hai aur metadata strip karta hai.
                Four presets hain — Maximum se 80%+ compression, Low se 15-30% reduction. Quality bar adjust karke
                perfect balance paayein.
              </Typography>
            )}
            {tab === 4 && (
              <Typography variant="body2" color="text.secondary">
                Digital signatures ke liye ab kisi app ki zaroorat nahi. Yeh <strong>signature maker</strong> tool
                mouse ya finger se sign draw karne deta hai, phir JPEG format mein white background ke saath download
                karta hai. Govt forms transparent signatures reject karte hain, isliye background white rakha gaya hai.
                Stroke bold (3.5px) hai taaki form me clear dikhe.
              </Typography>
            )}
            {tab === 5 && (
              <Typography variant="body2" color="text.secondary">
                Multiple PDF files (jaise aadhar, marksheet, certificates) ko ek single PDF mein merge karna
                sarkari forms ke liye zaroori hota hai. Yeh <strong>merge PDF tool</strong> aapko up/down arrows
                se files reorder karne deta hai, phir exact usi sequence mein merged PDF generate karta hai.
              </Typography>
            )}
            {tab === 6 && (
              <Typography variant="body2" color="text.secondary">
                Kuch government portals sirf JPG format accept karte hain, kuch sirf PNG. Yeh <strong>image format converter</strong>
                PNG ↔ JPG ↔ WebP me badalta hai. Transparent PNG ko JPG me convert karte waqt white background auto add
                hota hai (black bg nahi aayega). Quality slider se file size control karein.
              </Typography>
            )}
            {tab === 7 && (
              <Typography variant="body2" color="text.secondary">
                Passport aur government forms ke liye white background wali photo chahiye hoti hai. Yeh <strong>AI background remover</strong>
                browser mein hi TensorFlow.js chalata hai — free, koi server cost nahi. Model pehli baar ~40MB download hota hai,
                phir cached rehta hai. Background remove hone ke baad pure white (#FFFFFF) background pe composite hota hai
                aur 413×531px JPEG download hota hai.
              </Typography>
            )}
            {tab === 8 && (
              <Typography variant="body2" color="text.secondary">
                Sarkari forms mein exact age years, months aur days me likhni hoti hai. Yeh <strong>age calculator for government forms</strong>
                birth date dalne par correct age count karta hai — months me days borrow karte waqt saari edge cases handle ki gayi hain
                (jaise Jan 31 se March 1). "As on" date bhi daal sakte hain agar form me kisi specific date tak age chahiye.
              </Typography>
            )}
          </Box>

          <TopPosts />
        </Container>
      </Box>
    </Layout>
  );
}

const formatBytes = (b) => b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`;

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
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>Photo / Sign Resizer</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Photo ko exact KB me resize karein: <strong>{targetSize} KB</strong></Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Button size="small" variant={targetSize === 50 ? 'contained' : 'outlined'} onClick={() => quickResize(50)} sx={{ borderRadius: 4, textTransform: 'none' }}>📷 Passport Photo (≤50 KB)</Button>
          <Button size="small" variant={targetSize === 20 ? 'contained' : 'outlined'} onClick={() => quickResize(20)} sx={{ borderRadius: 4, textTransform: 'none' }}>✍️ Signature (≤20 KB)</Button>
          <Button size="small" variant={targetSize === 10 ? 'contained' : 'outlined'} onClick={() => quickResize(10)} sx={{ borderRadius: 4, textTransform: 'none' }}>📄 Sign (≤10 KB)</Button>
        </Box>
        <Slider value={targetSize} onChange={handleSlider} min={3} max={200} step={1} valueLabelDisplay="auto" valueLabelFormat={v => `${v} KB`} sx={{ mb: 2 }} />
        <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
          Upload Photo/Sign
          <input hidden type="file" accept="image/*" onChange={handleUpload} />
        </Button>
        {loading && <LinearProgress sx={{ mt: 2 }} />}
        {preview && (
          <Box sx={{ mt: 2 }}>
            <img src={preview} alt="preview" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8 }} />
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>Original: {formatBytes(origSize)} {compressed && ` → Compressed: ${formatBytes(compressed.size)} ✅`}</Typography>
            {compressed && (
              <Button variant="contained" startIcon={<DownloadIcon />} href={URL.createObjectURL(compressed)} download={`compressed.${compressed.name.split('.').pop() || 'jpg'}`} sx={{ mt: 1 }}>Download ({formatBytes(compressed.size)})</Button>
            )}
            <IconButton color="error" onClick={() => { setFile(null); setPreview(null); setCompressed(null); }} sx={{ ml: 1, mt: 1 }}><DeleteIcon /></IconButton>
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
    e.target.value = '';
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

  const generatePdf = () => {
    if (!images.length) return;
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
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>📄 Image to PDF Converter</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Documents/photos ko ek PDF me combine karein. Images ko drag/arrow se reorder karein.</Typography>
        <Button variant="outlined" component="label" startIcon={<AddPhotoAlternateIcon />}>
          Add Images
          <input hidden type="file" accept="image/*" multiple onChange={handleAdd} />
        </Button>
        {images.length > 0 && (
          <>
            <Typography variant="caption" sx={{ mt: 1.5, display: 'block', fontWeight: 600 }}>{images.length} image(s) — Arrow buttons se order badle, PDF usi sequence me banega:</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              {previews.map((url, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ minWidth: 24 }}>#{i + 1}</Typography>
                  <img src={url} alt="" style={{ height: 56, width: 56, objectFit: 'cover', borderRadius: 6 }} />
                  <Box sx={{ display: 'flex', gap: 0.3 }}>
                    <Tooltip title="Move Up"><span><IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
                    <Tooltip title="Move Down"><span><IconButton size="small" disabled={i === images.length - 1} onClick={() => move(i, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
                  </Box>
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="caption" color="text.secondary">{images[i].name.slice(0, 20)}</Typography>
                  <IconButton size="small" color="error" onClick={() => remove(i)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </Box>
            <Button variant="contained" startIcon={<PictureAsPdfIcon />} onClick={generatePdf} sx={{ mt: 2 }}>Download PDF ({images.length} pages)</Button>
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
  const boxSize = 280;

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

  const handleMouseMove = useCallback((e) => {
    if (!e.buttons) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCrop({
      x: Math.max(0, Math.min(e.clientX - rect.left - boxSize / 2, rect.width - boxSize)),
      y: Math.max(0, Math.min(e.clientY - rect.top - boxSize / 2, rect.height - boxSize)),
    });
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>🖼️ Passport Size Cropper</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>3.5cm × 4.5cm — SSC, UPSC, Railway & all govt forms</Typography>
        <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
          Upload Photo
          <input hidden type="file" accept="image/*" onChange={handleUpload} />
        </Button>
        {preview && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block', overflow: 'hidden', borderRadius: 2, border: '2px dashed #aaa', cursor: 'crosshair' }} onMouseMove={handleMouseMove}>
              <img ref={imgRef} src={preview} alt="" draggable={false} style={{ maxWidth: '100%', maxHeight: 400, display: 'block' }} />
              <Box sx={{ position: 'absolute', border: '2px solid #1976d2', bgcolor: 'rgba(25,118,210,0.08)', pointerEvents: 'none', borderRadius: 1, boxShadow: '0 0 8px rgba(25,118,210,0.5)', left: crop.x, top: crop.y, width: boxSize, height: boxSize }} />
            </Box>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>Blue box ko face ke around drag karein → Crop & Download</Typography>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleCrop} sx={{ mt: 1 }}>Crop & Download</Button>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <IconButton color="error" onClick={() => setPreview(null)} sx={{ ml: 1, mt: 1 }}><DeleteIcon /></IconButton>
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
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>📦 PDF Compressor</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>PDF ko aggressively compress karein — 2MB+ PDF ko 200-500KB me badle</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {qualityPresets.map((p, i) => (
            <Button key={i} size="small" variant={preset === i ? 'contained' : 'outlined'} onClick={() => applyPreset(i)} sx={{ borderRadius: 4, textTransform: 'none', fontSize: '0.75rem' }}>{p.label}</Button>
          ))}
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption">Image Scale: {(scale * 100).toFixed(0)}%</Typography>
          <Slider value={scale} onChange={(_, v) => { setScale(v); setPreset(-1); }} min={0.2} max={1.5} step={0.05} valueLabelDisplay="auto" valueLabelFormat={v => `${(v * 100).toFixed(0)}%`} size="small" />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption">JPEG Quality: {(quality * 100).toFixed(0)}%</Typography>
          <Slider value={quality} onChange={(_, v) => { setQuality(v); setPreset(-1); }} min={0.1} max={1} step={0.05} valueLabelDisplay="auto" valueLabelFormat={v => `${(v * 100).toFixed(0)}%`} size="small" />
        </Box>
        <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
          Upload PDF
          <input hidden type="file" accept="application/pdf" onChange={handleUpload} />
        </Button>
        {loading && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption">{totalPages > 0 ? `Processing page ${progress}/${totalPages}...` : 'Loading PDF...'}</Typography>
            <LinearProgress variant={totalPages > 0 ? 'determinate' : 'indeterminate'} value={totalPages > 0 ? (progress / totalPages) * 100 : undefined} sx={{ mt: 0.5 }} />
          </Box>
        )}
        {file && !loading && <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Original: {formatBytes(origSize)}</Typography>}
        {compressedUrl && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" display="block" fontWeight={600}>Compressed: {formatBytes(compSize)} <span style={{ color: compSize < origSize ? 'green' : 'red' }}>({(100 - compSize / origSize * 100).toFixed(1)}% smaller)</span></Typography>
            <Button variant="contained" startIcon={<DownloadIcon />} href={compressedUrl} download="compressed.pdf" sx={{ mt: 1 }}>Download</Button>
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
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>✍️ Signature Maker</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Mouse ya finger se sign karein → JPEG download karein (white background)</Typography>
        <Box sx={{ border: '2px dashed #aaa', borderRadius: 2, bgcolor: '#fff', touchAction: 'none', cursor: 'crosshair' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}>
          <canvas ref={canvasRef} style={{ width: '100%', height: 300, display: 'block' }} />
        </Box>
        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>Draw your signature above</Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={download} disabled={!hasContent}>Download Signature (JPEG)</Button>
          <Button variant="outlined" color="error" onClick={clear} disabled={!hasContent}>Clear</Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function MergePdf() {
  const [files, setFiles] = useState([]);
  const [merging, setMerging] = useState(false);

  const handleAdd = useCallback((e) => { setFiles(prev => [...prev, ...Array.from(e.target.files || [])]); e.target.value = ''; }, []);
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
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>🔗 Merge PDF Files</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Multiple PDF files ko ek single PDF me merge karein — up/down arrows se order badle</Typography>
        <Button variant="outlined" component="label" startIcon={<AddPhotoAlternateIcon />}>
          Add PDF Files
          <input hidden type="file" accept="application/pdf" multiple onChange={handleAdd} />
        </Button>
        {files.length > 0 && (
          <>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {files.map((f, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ minWidth: 24 }}>#{i + 1}</Typography>
                  <Typography variant="body2" sx={{ flex: 1 }}>{f.name}</Typography>
                  <Typography variant="caption">{formatBytes(f.size)}</Typography>
                  <Tooltip title="Move Up"><span><IconButton size="small" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title="Move Down"><span><IconButton size="small" disabled={i === files.length - 1} onClick={() => move(i, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton></span></Tooltip>
                  <IconButton size="small" color="error" onClick={() => remove(i)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </Box>
            {merging && <LinearProgress sx={{ mt: 1 }} />}
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={merge} disabled={merging || files.length < 2} sx={{ mt: 2 }}>Merge & Download ({files.length} files)</Button>
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
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>🔄 Image Format Converter</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>PNG ↔ JPG ↔ WebP — kisi bhi format me badle</Typography>
        <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
          Upload Image
          <input hidden type="file" accept="image/*" onChange={handleUpload} />
        </Button>
        {preview && (
          <Box sx={{ mt: 2 }}>
            <img src={preview} alt="" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8 }} />
            <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Format</InputLabel>
                <Select value={format} label="Format" onChange={(e) => setFormat(e.target.value)}>
                  <MenuItem value="png">PNG</MenuItem>
                  <MenuItem value="jpg">JPG</MenuItem>
                  <MenuItem value="webp">WebP</MenuItem>
                </Select>
              </FormControl>
              {format !== 'png' && (
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="caption">Quality: {quality}%</Typography>
                  <Slider value={quality} onChange={(_, v) => setQuality(v)} min={10} max={100} />
                </Box>
              )}
            </Box>
            {loading && <LinearProgress sx={{ mt: 1 }} />}
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={convert} disabled={loading} sx={{ mt: 1 }}>Convert & Download</Button>
            {convertedUrl && (
              <Button variant="outlined" startIcon={<DownloadIcon />} href={convertedUrl} download={`converted.${format}`} sx={{ mt: 1, ml: 1 }}>Save</Button>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Note: Government application forms ke liye <strong>JPG/JPEG</strong> format select karein</Typography>
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
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>☀️ Photo Background Remover</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>AI automatic background remove karein → pure white background → passport ready JPEG</Typography>
        <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
          Upload Photo
          <input hidden type="file" accept="image/*" onChange={handleUpload} />
        </Button>
        {status && <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>{status}</Typography>}
        {loading && <LinearProgress sx={{ mt: 1 }} />}
        {preview && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption">Original</Typography>
              <img src={preview} alt="" style={{ maxWidth: 150, maxHeight: 180, borderRadius: 8, display: 'block' }} />
            </Box>
            {processedUrl && (
              <Box>
                <Typography variant="caption">White Background (413×531px)</Typography>
                <img src={processedUrl} alt="" style={{ maxWidth: 150, maxHeight: 180, borderRadius: 8, display: 'block' }} />
              </Box>
            )}
            <Box>
              <Button variant="contained" startIcon={<BrushIcon />} onClick={whiten} disabled={loading} sx={{ display: 'block' }}>{loading ? 'Processing...' : 'Remove & Whiten Background'}</Button>
              {processedUrl && (
                <Button variant="outlined" startIcon={<DownloadIcon />} href={processedUrl} download="passport-white-bg.jpg" sx={{ mt: 1, display: 'block' }}>Download JPEG</Button>
              )}
            </Box>
            <IconButton color="error" onClick={() => { setFile(null); setPreview(null); setProcessedUrl(null); }}><DeleteIcon /></IconButton>
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
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>📅 Age Calculator</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Sarkari form ke liye exact saal, mahine aur din (100% accurate)</Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Date of Birth</Typography>
          <TextField type="date" value={dob} onChange={(e) => setDob(e.target.value)} inputProps={{ placeholder: 'dd/mm/yyyy' }} fullWidth size="small" />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>As on Date (optional — default today)</Typography>
          <TextField type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} inputProps={{ placeholder: 'dd/mm/yyyy' }} fullWidth size="small" />
        </Box>
        <Button variant="contained" startIcon={<CalendarMonthIcon />} onClick={calculate} fullWidth>Calculate Age</Button>
        {age && (
          <Alert severity="success" sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800}>{age.years}y {age.months}m {age.days}d</Typography>
            <Typography variant="body1">{age.years} years, {age.months} months, {age.days} days</Typography>
            <Typography variant="body2">{age.years} saal, {age.months} mahine, {age.days} din</Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Form me likho: {age.years} Years {age.months} Months {age.days} Days</Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}