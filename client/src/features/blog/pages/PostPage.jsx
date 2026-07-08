import { Link, useParams } from 'react-router-dom';
import { Container, Typography, Box, Button, Chip, CircularProgress, Alert, Divider, Paper, Avatar } from '@mui/material';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import Seo from '../components/Seo';
import ReadingProgress from '../../../components/ReadingProgress';
import LikeButton from '../../../components/LikeButton';
import CommentSection from '../components/CommentSection';
import SocialShare from '../../../components/SocialShare';
import TableOfContents from '../../../components/TableOfContents';
import AdSlot from '../../../components/AdSlot';
import { MonetizationOn, Info, PictureAsPdf } from '@mui/icons-material';
import { useEffect } from 'react';
import Prism from 'prismjs';
import { optimizeImage } from '../../../shared/lib/images';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-jsx';
import { usePost } from '../../../hooks/usePost';
import { postUrl } from '../../../shared/lib/category';

const HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=700&q=80',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=700&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=700&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=700&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=700&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=700&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=700&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=700&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=700&q=80',
  'https://images.unsplash.com/photo-1559526324-593bc073d938?w=700&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&q=80',
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=700&q=80',
];

function extractFaqs(content) {
  if (!content) return [];
  const faqs = [];
  const regex = /<h[23][^>]*>(?:Question:\s*)?([^<]+\?)\s*<\/h[23]>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const question = match[1].trim();
    const answer = match[2].replace(/<[^>]*>/g, '').trim();
    if (question && answer) {
      faqs.push({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer
        }
      });
    }
  }
  return faqs;
}

function pickHero(title) {
  if (!title) return HERO_PHOTOS[0];
  const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return HERO_PHOTOS[Math.abs(hash) % HERO_PHOTOS.length];
}

function cleanDevanagari(text) {
  if (!text) return '';
  
  // 1. Map of common Hindi terms to English equivalents
  const translationMap = {
    'विभाग': 'Board / Department',
    'कुल पद': 'Total Vacancies',
    'अंतिम तिथि': 'Last Date to Apply',
    'ऑनलाइन आवेदन शुरू': 'Application Start Date',
    'आवेदन शुरू': 'Application Start Date',
    'आवेदन शुल्क': 'Application Fee',
    'सामान्य': 'General',
    'ओबीसी': 'OBC',
    'ईडब्ल्यूएस': 'EWS',
    'एसटी': 'ST',
    'एससी': 'SC',
    'आयु सीमा': 'Age Limit',
    'न्यूनतम आयु': 'Minimum Age',
    'अधिकतम आयु': 'Maximum Age',
    'पात्रता': 'Eligibility',
    'योग्यता': 'Eligibility',
    'परीक्षा तिथि': 'Exam Date',
    'प्रवेश पत्र': 'Admit Card',
    'परिणाम': 'Result',
    'वेतनमान': 'Salary',
    'चयन प्रक्रिया': 'Selection Process',
    'इवेंट नाम': 'Event Name',
    'शुरू/अंतिम तिथि': 'Date Range',
    'तिथि': 'Date',
    'महत्वपूर्ण तिथियां': 'Important Dates',
    'महत्वपूर्ण लिंक': 'Important Links',
    'ऑपरेटर': 'Operator',
    'जूनियर असिस्टेंट': 'Junior Assistant',
    'विभिन्न पद': 'Various Posts',
    'सरकारी नौकरी का सुनहरा मौका, तुरंत करें आवेदन': 'Apply Online',
    'रुपये': 'INR',
    'शुल्क': 'Fee'
  };

  let cleanText = text;
  Object.keys(translationMap).forEach(key => {
    const regex = new RegExp(key, 'gi');
    cleanText = cleanText.replace(regex, translationMap[key]);
  });

  // 2. Map Hindi months to English
  const monthsMap = {
    'जनवरी': 'January', 'फरवरी': 'February', 'मार्च': 'March', 'अप्रैल': 'April',
    'मई': 'May', 'जून': 'June', 'जुलाई': 'July', 'अगस्त': 'August',
    'सितंबर': 'September', 'अक्टूबर': 'October', 'नवंबर': 'November', 'दिसंबर': 'December'
  };
  Object.keys(monthsMap).forEach(m => {
    cleanText = cleanText.replace(new RegExp(m, 'gi'), monthsMap[m]);
  });

  // 3. Remove nested parentheses repetitions caused by bilingual inputs
  cleanText = cleanText
    .replace(/Board \/ Department \(Board\)/gi, 'Board')
    .replace(/Total Vacancies \(Total Vacancies\)/gi, 'Total Vacancies')
    .replace(/Last Date to Apply \(Last Date\)/gi, 'Last Date');

  // 4. Strip any remaining Devanagari (Hindi) unicode characters
  cleanText = cleanText.replace(/[\u0900-\u097F]+/g, '');

  // 5. Cleanup spacing & trailing punctuation
  cleanText = cleanText
    .replace(/\s*\(\s*\)/g, '')
    .replace(/:\s*$/, '')
    .replace(/[ \t]+/g, ' ')
    .trim();

  return cleanText;
}

function parseTableSpecs(htmlContent) {
  if (!htmlContent) return [];
  const specs = [];

  const clean = (val) => {
    return val
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 1. Extract from modern quick-highlights-box
    const highlightCards = doc.querySelectorAll('.quick-highlights-box div');
    highlightCards.forEach(el => {
      // Skip container divs (which contain child divs)
      if (el.querySelector('div')) return;

      const keySpan = el.querySelector('span');
      const valStrong = el.querySelector('strong');
      if (keySpan && valStrong) {
        let key = clean(keySpan.textContent);
        let value = clean(valStrong.textContent);
        if (key.endsWith(':')) key = key.slice(0, -1).trim();
        if (key && value) {
          specs.push({ key, value });
        }
      }
    });

    // 2. Extract from any table rows (handles 2-column, 3-column, etc.)
    const tableRows = doc.querySelectorAll('table tr');
    tableRows.forEach(row => {
      // Skip table header rows
      if (row.querySelector('th')) return;

      const cells = Array.from(row.querySelectorAll('td')).map(cell => clean(cell.textContent));
      if (cells.length >= 2) {
        let key = cells[0];
        // Filter out empty cell indicators like '-'
        const valueParts = cells.slice(1).filter(c => c && c !== '-' && c !== '—');
        const value = valueParts.join(' / ');

        if (key.endsWith(':')) key = key.slice(0, -1).trim();

        const lowerKey = key.toLowerCase();
        const lowerVal = value.toLowerCase();

        // Skip utility rows, link instructions, download buttons
        if (
          !key || !value ||
          lowerKey.includes('click') || lowerVal.includes('click') ||
          lowerKey.includes('download') || lowerVal.includes('download') ||
          lowerKey.includes('link') || lowerVal.includes('link') ||
          lowerKey.includes('official website') || lowerVal.includes('official website') ||
          lowerKey.includes('apply') || lowerVal.includes('apply') ||
          lowerKey.includes('महत्वपूर्ण') || lowerKey.includes('लिंक') ||
          lowerKey === 'category' || lowerKey === 'dates' ||
          key.length > 60 || value.length > 250
        ) {
          return;
        }

        // Avoid duplicates if already parsed from quick-highlights
        if (!specs.some(s => s.key.toLowerCase() === key.toLowerCase())) {
          specs.push({ key, value });
        }
      }
    });
  } catch (err) {
    console.error('Error parsing table specs:', err);
  }

  return specs;
}

export default function PostPage() {
  const { slug, category } = useParams();
  const { post, loading, error } = usePost(slug);

  useEffect(() => {
    if (post && post.content) {
      setTimeout(() => {
        Prism.highlightAll();
      }, 100);
    }
  }, [post]);

  if (loading) {
    return <Layout><Container sx={{ py: 8, textAlign: 'center' }}><CircularProgress size={60} /></Container></Layout>;
  }

  if (error) {
    return <Layout><Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container></Layout>;
  }

  if (!post) {
    return <Layout><Container sx={{ py: 4 }}><Alert severity="warning">Post not found</Alert></Container></Layout>;
  }

  const heroImage = optimizeImage(post.featuredImage || pickHero(post.title), 1000, 600);

  const generateBrandedPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = [16, 185, 129];
      const textColor = [30, 41, 59];
      const lightBg = [241, 245, 249];

      let currentY = 25;

      // Helper to check page limits and add new page dynamically
      const checkPageOverflow = (neededHeight) => {
        if (currentY + neededHeight > 270) {
          doc.addPage();
          
          // Draw header banner on secondary pages
          doc.setFillColor(...primaryColor);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('DIGITAL HOME BLOG - Job Summary (Continued)', 15, 10);
          
          // Faint watermark in center background
          doc.setTextColor(245, 247, 250);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(36);
          doc.text('DIGITAL HOME BLOG', 105, 148, { align: 'center', angle: 45 });
          
          currentY = 25;
        }
      };

      // Faint watermark for the first page
      doc.setTextColor(245, 247, 250);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(36);
      doc.text('DIGITAL HOME BLOG', 105, 148, { align: 'center', angle: 45 });

      // Draw primary header banner
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('DIGITAL HOME BLOG', 15, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Fastest Government Jobs & Exam Alerts Portal', 15, 25);

      // Title
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      
      const cleanTitleText = cleanDevanagari(post.title);
      const titleLines = doc.splitTextToSize(cleanTitleText, 180);
      doc.text(titleLines, 15, 48);
      
      currentY = 48 + (titleLines.length * 7);

      // Category and Date info
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const cleanCategoryText = cleanDevanagari(post.category);
      doc.text(`Category: ${cleanCategoryText}  |  Published: ${new Date(post.publishedAt || post.createdAt).toLocaleDateString()}`, 15, currentY);
      currentY += 8;

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.line(15, currentY, 195, currentY);
      currentY += 10;

      // Table specs section
      const specs = parseTableSpecs(post.content);
      if (specs.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text('Vacancy Overview & Details', 15, currentY);
        currentY += 6;

        doc.setFontSize(10);
        let renderedIndex = 0;
        specs.forEach((spec) => {
          const cleanKey = cleanDevanagari(spec.key);
          const cleanValue = cleanDevanagari(spec.value);

          if (!cleanKey || !cleanValue) return;

          checkPageOverflow(8);

          if (renderedIndex % 2 === 0) {
            doc.setFillColor(...lightBg);
            doc.rect(15, currentY - 4, 180, 8, 'F');
          }

          doc.setTextColor(...textColor);
          doc.setFont('helvetica', 'bold');
          doc.text(cleanKey, 18, currentY + 1.5);

          doc.setFont('helvetica', 'normal');
          const valLines = doc.splitTextToSize(cleanValue, 100);
          doc.text(valLines, 90, currentY + 1.5);

          currentY += Math.max(8, valLines.length * 5);
          renderedIndex++;
        });
      }

      // Description text helper
      const extractPostDescription = (htmlContent) => {
        const parser = new DOMParser();
        const docObj = parser.parseFromString(htmlContent, 'text/html');
        
        const tables = docObj.querySelectorAll('table');
        tables.forEach(t => t.remove());
        const highlights = docObj.querySelectorAll('.quick-highlights-box');
        highlights.forEach(h => h.remove());
        const buttons = docObj.querySelectorAll('.action-buttons-group');
        buttons.forEach(b => b.remove());
        const buttonsClass = docObj.querySelectorAll('.btn-link-action');
        buttonsClass.forEach(b => b.remove());
        
        const elements = docObj.querySelectorAll('p, li, h2, h3');
        const list = [];
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (!text) return;
          const tagName = el.tagName.toLowerCase();
          list.push({ type: tagName, text });
        });
        return list;
      };

      // Print full descriptive blog content
      const paragraphs = extractPostDescription(post.content);
      if (paragraphs.length > 0) {
        checkPageOverflow(20);
        currentY += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text('Post Description & Important Guidelines', 15, currentY);
        currentY += 8;

        doc.setTextColor(...textColor);
        paragraphs.forEach(p => {
          const cleanText = cleanDevanagari(p.text);
          if (!cleanText || cleanText.length < 5) return;

          let size = 9.5;
          let fontType = 'normal';
          let lineGap = 5.5;
          let prefix = '';
          
          if (p.type.startsWith('h')) {
            size = 11;
            fontType = 'bold';
            lineGap = 7;
            currentY += 3;
          } else if (p.type === 'li') {
            prefix = '• ';
          }

          doc.setFont('helvetica', fontType);
          doc.setFontSize(size);
          
          const maxTextW = 180;
          const textLines = doc.splitTextToSize(prefix + cleanText, maxTextW);
          const neededH = textLines.length * lineGap + 3;
          
          checkPageOverflow(neededH);
          
          doc.text(textLines, 15, currentY);
          currentY += (textLines.length * lineGap) + 2;
        });
      }

      currentY += 5;

      // 4-Column Viral Services Promotion Card
      checkPageOverflow(65);
      const promoY = currentY;
      const productionOrigin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'https://www.digitalhomeblog.in' : window.location.origin;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(16, 185, 129);
      doc.rect(15, promoY, 180, 58, 'FD');

      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('🚀 Free Student Utility Services (100% Free & No Ads):', 20, promoY + 7);

      doc.setFontSize(9.5);
      
      // Link 1: Job Alerts
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text('⭐ 1. Live Job Alerts Portal:', 22, promoY + 16);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'normal');
      const alertsUrl = `${productionOrigin}/job-alerts`;
      doc.text('digitalhomeblog.in/job-alerts', 22, promoY + 21);
      doc.link(22, promoY + 18, 80, 4, { url: alertsUrl });

      // Link 2: Student Tools
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text('📷 2. Free Resizer & PDF Tools:', 110, promoY + 16);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'normal');
      const toolsUrl = `${productionOrigin}/tools`;
      doc.text('digitalhomeblog.in/tools', 110, promoY + 21);
      doc.link(110, promoY + 18, 80, 4, { url: toolsUrl });

      // Link 3: Games Page
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text('🎮 3. Brain Booster Kids Games:', 22, promoY + 32);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'normal');
      const gamesUrl = `${productionOrigin}/games`;
      doc.text('digitalhomeblog.in/games', 22, promoY + 37);
      doc.link(22, promoY + 34, 80, 4, { url: gamesUrl });

      // Link 4: Blog Section
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text('📰 4. Tech, Health & AI Blog:', 110, promoY + 32);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'normal');
      const blogUrl = `${productionOrigin}/blog`;
      doc.text('digitalhomeblog.in/blog', 110, promoY + 37);
      doc.link(110, promoY + 34, 80, 4, { url: blogUrl });

      // Promotional footer note
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Save this PDF & share it in your WhatsApp/Telegram groups to help other students!', 20, promoY + 50);

      currentY = promoY + 62;

      // Bottom Primary post direct link CTA block
      checkPageOverflow(26);
      const canonicalUrl = `${productionOrigin}${postUrl(post)}`;

      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(239, 68, 68);
      doc.rect(15, currentY, 180, 22, 'FD');

      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('👉 Click the Link Below to Apply & View Details Online:', 20, currentY + 7);

      doc.setTextColor(37, 99, 235);
      doc.setFontSize(10);
      doc.text(canonicalUrl, 20, currentY + 15);
      doc.link(20, currentY + 11, 170, 6, { url: canonicalUrl });

      // Signature page footer info
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('This job alert document is downloaded from Digital Home Blog.', 15, 285);
      doc.text('Stay tuned for fast recruitment updates!', 195, 285, { align: 'right' });

      const fileName = `${post.slug}-summary.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF Generation failed:', err);
    }
  };

  return (
    <Layout>
       <ReadingProgress />
       <Seo 
          title={post.seoTitle || post.title} 
          description={post.seoDescription || post.excerpt}
          image={post.featuredImage}
          url={`${window.location.origin}${postUrl(post)}`}
          canonical={post.canonicalUrl}
          keywords={(post.seoKeywords || []).join(', ')}
          jsonLd={(() => {
            const blogPostingSchema = {
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.seoTitle || post.title,
              description: post.seoDescription || post.excerpt,
              image: post.featuredImage,
              datePublished: post.publishedAt,
              dateModified: post.updatedAt,
              author: { '@type': 'Person', name: 'Harry Prince' },
              publisher: { '@type': 'Organization', name: 'Digital Home' },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${window.location.origin}${postUrl(post)}`,
              },
            };

            const schemas = [blogPostingSchema];

            // Injects dynamic JobPosting Schema to get structural tables on Google listings
            if (post.category === 'Sarkari Jobs & Exams') {
              const specs = parseTableSpecs(post.content);
              const specMap = new Map(specs.map(s => [s.key.toLowerCase(), s.value]));

              let orgName = 'Sarkari Board';
              for (const [k, v] of specMap.entries()) {
                if (k.includes('board') || k.includes('organizer') || k.includes('विभाग') || k.includes('आयोजक')) {
                  orgName = v;
                  break;
                }
              }

              let validThrough = '';
              for (const [k, v] of specMap.entries()) {
                if (k.includes('last date') || k.includes('अंतिम तिथि') || k.includes('deadline')) {
                  const match = v.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
                  if (match) {
                    validThrough = `${match[3]}-${match[2]}-${match[1]}T23:59:59`;
                  } else {
                    const matchISO = v.match(/(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/);
                    if (matchISO) {
                      validThrough = `${matchISO[1]}-${matchISO[2]}-${matchISO[3]}T23:59:59`;
                    }
                  }
                  break;
                }
              }

              const jobPostingSchema = {
                '@context': 'https://schema.org',
                '@type': 'JobPosting',
                title: post.title,
                description: post.seoDescription || post.excerpt,
                datePosted: post.publishedAt || post.createdAt,
                validThrough: validThrough || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                hiringOrganization: {
                  '@type': 'Organization',
                  name: orgName,
                  sameAs: window.location.origin
                },
                jobLocation: {
                  '@type': 'Place',
                  address: {
                    '@type': 'PostalAddress',
                    addressCountry: 'IN',
                    addressRegion: 'India'
                  }
                }
              };
              schemas.push(jobPostingSchema);
            }

            const parsedFaqs = extractFaqs(post.content);
            if (parsedFaqs.length > 0) {
              schemas.push({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: parsedFaqs
              });
            }
            return schemas;
          })()}
        />
      
       <Box sx={{ 
          width: '100%', 
          height: { xs: '40vh', md: '60vh' },
          minHeight: { xs: 280, md: 400 },
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          mb: 4,
          borderRadius: '32px',
          overflow: 'hidden',
        }}>
          <Box
            component="img"
            src={heroImage}
            alt={post.title}
            loading="eager"
            fetchpriority="high"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 0,
            }}
          />
          <Box sx={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1,
          }} />
          <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, pb: 4 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={post.category} component={Link} to={`/category/${post.category}`} clickable sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'primary.main', fontWeight: 600 }} />
              {post.sponsored && (
                <Chip icon={<MonetizationOn />} label="Sponsored" size="small" color="warning" sx={{ bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 600 }} />
              )}
            </Box>
            <Typography variant="h2" component="h1" sx={{ color: 'white', fontWeight: 700, mb: 2, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              {post.title}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString()} • {post.readingTime} min read • {post.views || 0} views
            </Typography>
           </Container>
        </Box>

       <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
         <Button 
           component={Link} 
           to="/blog" 
           color="primary" 
           sx={{ mb: 3, fontWeight: 600 }}
         >
           ← Back to blog
         </Button>

         <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontStyle: 'italic', lineHeight: 1.7, color: 'text.primary' }}>
           {post.excerpt}
         </Typography>

          {post.category === 'Sarkari Jobs & Exams' && !post.disablePdfDownload && (
            <Button
              variant="contained"
              color="error"
              onClick={generateBrandedPDF}
              startIcon={<PictureAsPdf />}
              sx={{
                mb: 4,
                py: 1.2,
                px: 3,
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                '&:hover': {
                  bgcolor: '#dc2626',
                  boxShadow: '0 6px 16px rgba(239, 68, 68, 0.3)'
                }
              }}
            >
              Download Job Summary (PDF डाउनलोड करें)
            </Button>
          )}

          {post.content && post.content.includes('<h') && (
            <TableOfContents content={post.content} />
          )}

          {post.rating && (
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>Rating:</Typography>
              {'★'.repeat(Math.floor(post.rating))}{post.rating % 1 ? '½' : ''}
              <Typography variant="body2" color="text.secondary">({post.rating}/5)</Typography>
            </Box>
          )}

          {/* YouTube Video */}
          {post.videoUrl && (
            <Box sx={{ mb: 4, borderRadius: 3, overflow: 'hidden', aspectRatio: '16/9' }}>
              <iframe
                src={post.videoUrl.replace('watch?v=', 'embed/').split('&')[0]}
                title="YouTube video"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                allowFullScreen
              />
            </Box>
          )}

          {/* Content */}
          <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, mb: 4, bgcolor: 'background.paper' }}>
            <div 
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }} 
              style={{ lineHeight: 1.8, fontSize: '1.1rem', color: 'inherit' }}
            />
            <AdSlot format="incontent" style={{ mt: 4 }} />
          </Paper>

        {/* Tags */}
        {post.tags?.length ? (
          <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {post.tags.map((tag) => (
              <Chip key={tag} label={`#${tag}`} size="small" component={Link} to={`/tags/${tag}`} clickable />
            ))}
          </Box>
        ) : null}

        {/* Affiliate Disclosure */}
        {post.affiliateDisclosure && (
          <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: 'warning.light', border: '1px solid', borderColor: 'warning.main', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Info color="warning" sx={{ mt: 0.2, flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              This post may contain affiliate links. If you make a purchase through these links, we may earn a small commission at no extra cost to you.
            </Typography>
          </Paper>
        )}

        {/* After-post Ad */}
        <AdSlot format="afterpost" style={{ mb: 3 }} />

        {/* Actions: Like + Share */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <LikeButton slug={slug} initialLikes={post.likes || 0} />
          <SocialShare title={post.title} slug={slug} category={post.category} />
        </Box>

        <Divider sx={{ my: 4 }} />
        
        {/* Comments */}
        <CommentSection slug={slug} />

        {/* Author Bio */}
        <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, mt: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: { xs: 2, md: 3 }, alignItems: 'flex-start' }}>
          <Avatar sx={{ width: { xs: 44, md: 56 }, height: { xs: 44, md: 56 }, bgcolor: 'primary.main', fontSize: '1.25rem', fontWeight: 700, flexShrink: 0 }}>
            {post.author?.charAt(0) || 'H'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{post.author || 'Harry Prince'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
              Curious mind and lifelong learner sharing insights on technology, personal finance, career growth, 
              and the trends shaping our world. Every article is researched and written for smart readers like you.
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Related Posts */}
      {post.relatedPosts?.length > 0 && (
        <Box sx={{ bgcolor: 'grey.50', py: 6 }}>
          <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>Related Posts</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: '20px' }}>
              {post.relatedPosts.map((item) => (
                <Box key={item._id} sx={{ display: 'flex' }}>
                  <PostCard post={item} />
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      )}
    </Layout>
  );
}
