import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShareIcon from '@mui/icons-material/Share';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpIcon from '@mui/icons-material/Help';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Layout from '../../blog/components/Layout';

export default function CurrentAffairsDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Interactive Quiz State
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchDetail();
    window.scrollTo(0, 0);
  }, [slug]);

  async function fetchDetail() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/current-affairs/${slug}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.message || 'Article not found');
      }
    } catch (err) {
      setError('Failed to load article: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOptionSelect(questionId, optionIndex) {
    if (submitted) return; // Prevent changing after submission
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  }

  function handleQuizSubmit() {
    if (!data?.quizzes) return;
    let score = 0;
    data.quizzes.forEach(q => {
      if (userAnswers[q.questionId] === q.correctOptionIndex) {
        score += 1;
      }
    });
    setQuizScore(score);
    setSubmitted(true);
  }

  function handleResetQuiz() {
    setUserAnswers({});
    setSubmitted(false);
    setQuizScore(0);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  }

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: '#4F46E5' }} />
        </Box>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="error" sx={{ mb: 3 }}>{error || 'Article not found'}</Alert>
          <Button component={Link} to="/current-affairs" variant="contained">
            Back to Current Affairs List
          </Button>
        </Container>
      </Layout>
    );
  }

  const cleanTitle = data.title;
  const canonicalUrl = `https://www.digitalhomeblog.in/current-affairs/${data.slug}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${cleanTitle}\n\nआज का डेली करेंट अफेयर्स और 10 MCQs क्विज़ यहाँ पढ़ें:\n${canonicalUrl}`)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(cleanTitle)}`;

  return (
    <Layout>
      <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: { xs: 3, md: 5 } }}>
        <Helmet>
        <title>{data.seoTitle || `${cleanTitle} | Digital Home`}</title>
        <meta name="description" content={data.seoDescription || data.summary} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={cleanTitle} />
        <meta property="og:description" content={data.summary} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
      </Helmet>

      <Container maxWidth="md">
        {/* Breadcrumb Nav */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, fontSize: '0.85rem', color: '#64748B' }}>
          <Link to="/" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <Link to="/current-affairs" style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>Current Affairs</Link>
          <span>/</span>
          <span style={{ color: '#94A3B8' }}>{data.dateString}</span>
        </Box>

        {/* Article Main Container */}
        <Box sx={{ bgcolor: 'white', p: { xs: 2.5, md: 5 }, borderRadius: 4, border: '1px solid #E2E8F0', mb: 4 }}>
          {/* Top Meta Badges */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
            <Chip
              icon={<CalendarMonthIcon sx={{ fontSize: '1rem !important' }} />}
              label={data.dateString}
              sx={{ bgcolor: '#EEF2FF', color: '#4338CA', fontWeight: 700 }}
            />
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: '1rem !important' }} />}
              label={`${data.readingTimeMinutes || 6} Min Read`}
              variant="outlined"
              sx={{ fontWeight: 600, borderColor: '#E2E8F0' }}
            />
            <Chip
              icon={<QuizIcon sx={{ fontSize: '1rem !important' }} />}
              label="10 MCQs Included"
              sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 700 }}
            />
          </Box>

          {/* Title */}
          <Typography variant="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', md: '2.2rem' }, lineHeight: 1.35, color: '#0F172A', mb: 2.5 }}>
            {cleanTitle}
          </Typography>

          {/* Share Buttons Toolbar */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', py: 1.5, borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mr: 1 }}>SHARE:</Typography>
            <Button
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              startIcon={<WhatsAppIcon />}
              sx={{ bgcolor: '#25D366', color: 'white', fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 1.5, '&:hover': { bgcolor: '#1EBE5D' } }}
            >
              WhatsApp
            </Button>
            <Button
              href={telegramShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              startIcon={<TelegramIcon />}
              sx={{ bgcolor: '#0088cc', color: 'white', fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 1.5, '&:hover': { bgcolor: '#0077b5' } }}
            >
              Telegram
            </Button>
            <Button
              onClick={handleCopyLink}
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, borderColor: '#CBD5E1', color: '#475569' }}
            >
              {copySuccess ? 'Copied! ✅' : 'Copy Link'}
            </Button>
          </Box>

          {/* Summary Callout Box */}
          <Box sx={{ bgcolor: '#EFF6FF', p: 2.5, borderRadius: 3, borderLeft: '4px solid #3B82F6', mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E40AF', mb: 0.5 }}>
              📌 मुख्य सारांश (Executive Summary):
            </Typography>
            <Typography variant="body2" sx={{ color: '#1E3A8A', lineHeight: 1.6 }}>
              {data.summary}
            </Typography>
          </Box>

          {/* Article Full HTML Body */}
          <Box
            sx={{
              color: '#334155',
              fontSize: { xs: '1rem', md: '1.05rem' },
              lineHeight: 1.8,
              '& h2': {
                fontWeight: 800,
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                color: '#0F172A',
                mt: 4,
                mb: 1.5,
                borderBottom: '2px solid #E2E8F0',
                pb: 1
              },
              '& h3': {
                fontWeight: 700,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                color: '#1E293B',
                mt: 3,
                mb: 1
              },
              '& p': {
                mb: 2
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                my: 2.5,
                borderRadius: 2,
                overflow: 'hidden'
              },
              '& th, & td': {
                border: '1px solid #E2E8F0',
                p: 1.5,
                textAlign: 'left',
                fontSize: '0.9rem'
              },
              '& th': {
                bgcolor: '#F1F5F9',
                fontWeight: 700,
                color: '#0F172A'
              },
              '& .static-gk-box': {
                bgcolor: '#F0FDF4',
                borderLeft: '4px solid #16A34A',
                p: 2,
                my: 2,
                borderRadius: 2
              }
            }}
            dangerouslySetInnerHTML={{ __html: data.content }}
          />
        </Box>

        {/* Interactive 10-MCQ Practice Quiz Section */}
        {data.quizzes && data.quizzes.length > 0 && (
          <Box sx={{ bgcolor: 'white', p: { xs: 2.5, md: 5 }, borderRadius: 4, border: '1px solid #E2E8F0', mb: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3, pb: 2, borderBottom: '2px solid #E2E8F0' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                  🎯 आज का डेली GK क्विज़ ({data.dateString})
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                  दैनिक करेंट अफेयर्स पर आधारित 10 महत्वपूर्ण वस्तुनिष्ठ प्रश्न (MCQs) का लाइव अभ्यास करें।
                </Typography>
              </Box>
              <Button
                component={Link}
                to={`/daily-quiz/${data.dateString}`}
                variant="contained"
                startIcon={<QuizIcon />}
                sx={{ bgcolor: '#4F46E5', fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
              >
                Timed Exam Mode ⏱️
              </Button>
            </Box>

            {/* Scorecard Banner if Submitted */}
            {submitted && (
              <Box sx={{
                bgcolor: quizScore >= 7 ? '#ECFDF5' : quizScore >= 5 ? '#FFFBEB' : '#FEF2F2',
                border: `1.5px solid ${quizScore >= 7 ? '#10B981' : quizScore >= 5 ? '#F59E0B' : '#EF4444'}`,
                borderRadius: 3,
                p: 3,
                mb: 4,
                textAlign: 'center'
              }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: quizScore >= 7 ? '#065F46' : quizScore >= 5 ? '#92400E' : '#991B1B', mb: 1 }}>
                  Your Score: {quizScore} / {data.quizzes.length} ({Math.round((quizScore / data.quizzes.length) * 100)}%)
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                  {quizScore >= 8 ? '🌟 Excellent Performance! आपकी तैयारी शानदार है।' : quizScore >= 5 ? '👍 Good Effort! व्याख्या पढ़कर कमजोर विषयों को मजबूत करें।' : '📖 Need Revision! नीचे दिए गए स्पष्टीकरण को ध्यान से पढ़ें।'}
                </Typography>
                <Button onClick={handleResetQuiz} variant="outlined" sx={{ fontWeight: 700, textTransform: 'none', mr: 2 }}>
                  🔄 Retake Quiz
                </Button>
                <Button
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Maine aaj ke Current Affairs Quiz (${data.dateString}) me ${quizScore}/10 score kiya! Aap bhi attempt karein:\n${canonicalUrl}`)}`}
                  target="_blank"
                  variant="contained"
                  startIcon={<WhatsAppIcon />}
                  sx={{ bgcolor: '#25D366', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#1EBE5D' } }}
                >
                  Share Score on WhatsApp
                </Button>
              </Box>
            )}

            {/* Questions List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {data.quizzes.map((q, idx) => {
                const selectedOption = userAnswers[q.questionId];
                const isCorrect = selectedOption === q.correctOptionIndex;
                const showFeedback = submitted;

                return (
                  <Card
                    key={q.questionId || idx}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: '1.5px solid',
                      borderColor: showFeedback ? (isCorrect ? '#86EFAC' : '#FCA5A5') : '#E2E8F0',
                      bgcolor: showFeedback ? (isCorrect ? '#F0FDF4' : '#FEF2F2') : '#FFFFFF'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                      <Chip label={`Q${idx + 1}`} size="small" sx={{ fontWeight: 800, bgcolor: '#EEF2FF', color: '#4338CA' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', flex: 1 }}>
                        {q.questionText}
                      </Typography>
                      {showFeedback && (
                        isCorrect ? <CheckCircleIcon sx={{ color: '#16A34A' }} /> : <CancelIcon sx={{ color: '#DC2626' }} />
                      )}
                    </Box>

                    {/* Options */}
                    <RadioGroup
                      value={selectedOption !== undefined ? selectedOption : ''}
                      onChange={(e) => handleOptionSelect(q.questionId, Number(e.target.value))}
                    >
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                        {q.options.map((opt, optIdx) => {
                          const isOptionCorrect = optIdx === q.correctOptionIndex;
                          const isOptionSelected = selectedOption === optIdx;

                          let optionBg = '#F8FAFC';
                          let optionBorder = '#E2E8F0';

                          if (showFeedback) {
                            if (isOptionCorrect) {
                              optionBg = '#DCFCE7';
                              optionBorder = '#16A34A';
                            } else if (isOptionSelected) {
                              optionBg = '#FEE2E2';
                              optionBorder = '#DC2626';
                            }
                          } else if (isOptionSelected) {
                            optionBg = '#EEF2FF';
                            optionBorder = '#4F46E5';
                          }

                          return (
                            <Box
                              key={optIdx}
                              onClick={() => handleOptionSelect(q.questionId, optIdx)}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1.5,
                                borderRadius: 2,
                                border: `1.5px solid ${optionBorder}`,
                                bgcolor: optionBg,
                                cursor: submitted ? 'default' : 'pointer',
                                transition: 'all 0.15s',
                                '&:hover': {
                                  borderColor: submitted ? optionBorder : '#4F46E5'
                                }
                              }}
                            >
                              <FormControlLabel
                                value={optIdx}
                                control={<Radio size="small" disabled={submitted} />}
                                label={<Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1E293B' }}>{opt}</Typography>}
                                sx={{ m: 0, width: '100%' }}
                              />
                            </Box>
                          );
                        })}
                      </Box>
                    </RadioGroup>

                    {/* Explanation Box (Revealed on Submit) */}
                    {showFeedback && (
                      <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #CBD5E1' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <HelpIcon sx={{ fontSize: '1.1rem', color: '#4F46E5' }} /> सही उत्तर व विस्तृत व्याख्या:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                          {q.explanation}
                        </Typography>
                      </Box>
                    )}
                  </Card>
                );
              })}
            </Box>

            {/* Submit Button */}
            {!submitted && (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  onClick={handleQuizSubmit}
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: '#10B981',
                    color: 'white',
                    fontWeight: 800,
                    px: 6,
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  Submit Answers & View Score 🎯
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  </Layout>
  );
}
