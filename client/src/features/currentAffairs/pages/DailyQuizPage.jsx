import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TimerIcon from '@mui/icons-material/Timer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import ArticleIcon from '@mui/icons-material/Article';
import Layout from '../../blog/components/Layout';

export default function DailyQuizPage() {
  const { date } = useParams();
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionId]: optionIndex }
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [gradingResult, setGradingResult] = useState(null);
  const [gradingLoading, setGradingLoading] = useState(false);

  // 10-minute timer in seconds
  const [secondsRemaining, setSecondsRemaining] = useState(600);

  useEffect(() => {
    fetchQuiz();
    window.scrollTo(0, 0);
  }, [date]);

  useEffect(() => {
    if (isSubmitted || loading || !quizData) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, loading, quizData, selectedAnswers]);

  async function fetchQuiz() {
    setLoading(true);
    setError('');
    try {
      let url = '/api/current-affairs/quiz/today';
      if (date) url += `?date=${encodeURIComponent(date)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.quizzes?.length > 0) {
        setQuizData(json);
      } else {
        setError(json.message || 'No quiz available for this date.');
      }
    } catch (err) {
      setError('Failed to load quiz: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectOption(optionIndex) {
    if (isSubmitted || !quizData) return;
    const currentQ = quizData.quizzes[currentIndex];
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.questionId]: optionIndex
    }));
  }

  async function handleSubmitTest() {
    if (isSubmitted || !quizData) return;
    setGradingLoading(true);
    try {
      const res = await fetch('/api/current-affairs/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateString: quizData.dateString,
          answers: selectedAnswers
        })
      });
      const json = await res.json();
      if (json.success) {
        setGradingResult(json);
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Grading submission error:', err);
    } finally {
      setGradingLoading(false);
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  if (error || !quizData) {
    return (
      <Layout>
        <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
          <Alert severity="warning" sx={{ mb: 3 }}>{error || 'Quiz not found'}</Alert>
          <Button component={Link} to="/current-affairs" variant="contained">
            Back to Current Affairs
          </Button>
        </Container>
      </Layout>
    );
  }

  const currentQ = quizData.quizzes[currentIndex];
  const totalQuestions = quizData.quizzes.length;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <Layout>
      <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', py: { xs: 2, md: 4 } }}>
        <Helmet>
          <title>Daily Current Affairs GK Quiz ({quizData.dateString}) | Digital Home</title>
          <meta name="description" content={`आज का डेली करेंट अफेयर्स मॉक टेस्ट (${quizData.dateString}) हल करें। 10 महत्वपूर्ण MCQs, टाइमर और विस्तृत व्याख्या।`} />
        </Helmet>

      <Container maxWidth="md">
        {/* Top Header Card */}
        <Box sx={{ bgcolor: 'white', p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Daily Current Affairs Mock Test
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Date: {quizData.dateString} • {totalQuestions} Questions • 10 Minutes
            </Typography>
          </Box>

          {!isSubmitted && (
            <Chip
              icon={<TimerIcon sx={{ color: secondsRemaining < 60 ? '#EF4444' : '#4F46E5' }} />}
              label={`Time Left: ${formatTime(secondsRemaining)}`}
              sx={{
                fontWeight: 800,
                fontSize: '0.9rem',
                bgcolor: secondsRemaining < 60 ? '#FEF2F2' : '#EEF2FF',
                color: secondsRemaining < 60 ? '#DC2626' : '#4338CA',
                p: 1
              }}
            />
          )}
        </Box>

        {/* Test Result View (When Submitted) */}
        {isSubmitted && gradingResult ? (
          <Box sx={{ bgcolor: 'white', p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid #E2E8F0', mb: 4 }}>
            <Box sx={{
              textAlign: 'center',
              p: 4,
              bgcolor: gradingResult.percentage >= 70 ? '#ECFDF5' : gradingResult.percentage >= 50 ? '#FFFBEB' : '#FEF2F2',
              borderRadius: 3,
              border: `1.5px solid ${gradingResult.percentage >= 70 ? '#10B981' : '#F59E0B'}`,
              mb: 4
            }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: gradingResult.percentage >= 70 ? '#065F46' : '#92400E', mb: 1 }}>
                {gradingResult.score} / {gradingResult.total}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
                Score: {gradingResult.percentage}% • {gradingResult.passed ? 'PASSED ✅' : 'NEED PRACTICE ⚠️'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                Answered: {answeredCount} / {totalQuestions} • Correct: {gradingResult.score} • Incorrect: {totalQuestions - gradingResult.score}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setSelectedAnswers({});
                    setCurrentIndex(0);
                    setSecondsRemaining(600);
                  }}
                  variant="outlined"
                  startIcon={<ReplayIcon />}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Restart Test
                </Button>
                <Button
                  component={Link}
                  to={`/current-affairs/${quizData.slug}`}
                  variant="contained"
                  startIcon={<ArticleIcon />}
                  sx={{ bgcolor: '#4F46E5', fontWeight: 700, textTransform: 'none' }}
                >
                  Read Full Current Affairs Article
                </Button>
              </Box>
            </Box>

            {/* Question by Question Detailed Review */}
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 3 }}>
              Detailed Question Review & Explanations:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {gradingResult.results?.map((res, idx) => (
                <Card
                  key={idx}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1.5px solid',
                    borderColor: res.isCorrect ? '#86EFAC' : '#FCA5A5',
                    bgcolor: res.isCorrect ? '#F0FDF4' : '#FEF2F2'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
                    <Chip label={`Q${idx + 1}`} size="small" sx={{ fontWeight: 800, bgcolor: '#EEF2FF', color: '#4338CA' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', flex: 1 }}>
                      {res.questionText}
                    </Typography>
                    {res.isCorrect ? (
                      <Chip label="Correct (+1)" size="small" color="success" sx={{ fontWeight: 700 }} />
                    ) : (
                      <Chip label="Incorrect (0)" size="small" color="error" sx={{ fontWeight: 700 }} />
                    )}
                  </Box>

                  <Box sx={{ pl: 4, mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#334155', mb: 0.5 }}>
                      <strong>Your Answer:</strong> {res.selectedOptionIndex !== null ? res.options[res.selectedOptionIndex] : '<Not Attempted>'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#065F46', fontWeight: 700 }}>
                      <strong>Correct Answer:</strong> {res.options[res.correctOptionIndex]}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #CBD5E1' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#4F46E5', display: 'block', mb: 0.5 }}>
                      💡 विस्तृत व्याख्या (Explanation):
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.6 }}>
                      {res.explanation}
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        ) : (
          /* Active Test Simulator */
          <Box sx={{ bgcolor: 'white', p: { xs: 2.5, md: 4 }, borderRadius: 4, border: '1px solid #E2E8F0', mb: 4 }}>
            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#4F46E5' }}>
                  Question {currentIndex + 1} of {totalQuestions}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#10B981' }}>
                  Attempted: {answeredCount}/{totalQuestions}
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 8, borderRadius: 4, bgcolor: '#EEF2FF', '& .MuiLinearProgress-bar': { bgcolor: '#4F46E5' } }} />
            </Box>

            {/* Question Navigator Bubbles */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 4, pb: 2, borderBottom: '1px solid #F1F5F9' }}>
              {quizData.quizzes.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = selectedAnswers[q.questionId] !== undefined;
                return (
                  <Box
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      bgcolor: isCurrent ? '#4F46E5' : isAnswered ? '#10B981' : '#F1F5F9',
                      color: isCurrent || isAnswered ? 'white' : '#64748B',
                      border: isCurrent ? '2px solid #312E81' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {idx + 1}
                  </Box>
                );
              })}
            </Box>

            {/* Current Question */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 3, lineHeight: 1.5 }}>
                {currentIndex + 1}. {currentQ.questionText}
              </Typography>

              {/* Options */}
              <RadioGroup
                value={selectedAnswers[currentQ.questionId] !== undefined ? selectedAnswers[currentQ.questionId] : ''}
                onChange={(e) => handleSelectOption(Number(e.target.value))}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQ.questionId] === optIdx;
                    return (
                      <Box
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          borderRadius: 2.5,
                          border: `1.5px solid ${isSelected ? '#4F46E5' : '#E2E8F0'}`,
                          bgcolor: isSelected ? '#EEF2FF' : '#F8FAFC',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          '&:hover': {
                            borderColor: '#4F46E5',
                            bgcolor: isSelected ? '#EEF2FF' : '#FFFFFF'
                          }
                        }}
                      >
                        <FormControlLabel
                          value={optIdx}
                          control={<Radio size="small" />}
                          label={<Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B' }}>{opt}</Typography>}
                          sx={{ m: 0, width: '100%' }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </RadioGroup>
            </Box>

            {/* Navigation & Submit Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 3, borderTop: '1px solid #F1F5F9' }}>
              <Button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                startIcon={<ArrowBackIcon />}
                sx={{ fontWeight: 700, textTransform: 'none' }}
              >
                Previous
              </Button>

              {currentIndex < totalQuestions - 1 ? (
                <Button
                  variant="contained"
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ bgcolor: '#4F46E5', fontWeight: 700, textTransform: 'none', px: 3 }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disabled={gradingLoading}
                  onClick={handleSubmitTest}
                  startIcon={gradingLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                  sx={{ bgcolor: '#10B981', color: 'white', fontWeight: 800, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#059669' } }}
                >
                  {gradingLoading ? 'Submitting...' : 'Finish & Submit Test 🎯'}
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  </Layout>
  );
}
