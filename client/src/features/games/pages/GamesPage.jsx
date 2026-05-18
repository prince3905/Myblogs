import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box, Container, Typography, Button, Card, CardContent,
  Paper, Chip, IconButton
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarsIcon from '@mui/icons-material/Stars';
import RefreshIcon from '@mui/icons-material/Refresh';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import Layout from '../../blog/components/Layout';
import Seo from '../../blog/components/Seo';

const alphabetData = [
  { letter: 'A', word: 'Apple', emoji: '🍎' },
  { letter: 'B', word: 'Banana', emoji: '🍌' },
  { letter: 'C', word: 'Cat', emoji: '🐱' },
  { letter: 'D', word: 'Dog', emoji: '🐕' },
  { letter: 'E', word: 'Elephant', emoji: '🐘' },
  { letter: 'F', word: 'Fish', emoji: '🐟' },
  { letter: 'G', word: 'Grapes', emoji: '🍇' },
  { letter: 'H', word: 'Hat', emoji: '🎩' },
  { letter: 'I', word: 'Ice Cream', emoji: '🍦' },
  { letter: 'J', word: 'Juice', emoji: '🧃' },
  { letter: 'K', word: 'Kite', emoji: '🪁' },
  { letter: 'L', word: 'Lion', emoji: '🦁' },
  { letter: 'M', word: 'Mango', emoji: '🥭' },
  { letter: 'N', word: 'Nest', emoji: '🪺' },
  { letter: 'O', word: 'Orange', emoji: '🍊' },
  { letter: 'P', word: 'Parrot', emoji: '🦜' },
  { letter: 'Q', word: 'Queen', emoji: '👑' },
  { letter: 'R', word: 'Rabbit', emoji: '🐰' },
  { letter: 'S', word: 'Sun', emoji: '☀️' },
  { letter: 'T', word: 'Tiger', emoji: '🐯' },
  { letter: 'U', word: 'Umbrella', emoji: '☂️' },
  { letter: 'V', word: 'Violin', emoji: '🎻' },
  { letter: 'W', word: 'Watch', emoji: '⌚' },
  { letter: 'X', word: 'Xylophone', emoji: '🎵' },
  { letter: 'Y', word: 'Yacht', emoji: '⛵' },
  { letter: 'Z', word: 'Zebra', emoji: '🦓' },
];

const animalData = [
  { name: 'Lion', emoji: '🦁', category: 'bigCat' },
  { name: 'Tiger', emoji: '🐯', category: 'bigCat' },
  { name: 'Elephant', emoji: '🐘', category: 'giant' },
  { name: 'Bear', emoji: '🐻', category: 'giant' },
  { name: 'Dog', emoji: '🐕', category: 'pet' },
  { name: 'Cat', emoji: '🐱', category: 'pet' },
  { name: 'Monkey', emoji: '🐵', category: 'trickster' },
  { name: 'Cow', emoji: '🐄', category: 'farm' },
  { name: 'Horse', emoji: '🐴', category: 'farm' },
  { name: 'Pig', emoji: '🐷', category: 'farm' },
  { name: 'Sheep', emoji: '🐑', category: 'farm' },
  { name: 'Duck', emoji: '🦆', category: 'bird' },
  { name: 'Owl', emoji: '🦉', category: 'bird' },
  { name: 'Frog', emoji: '🐸', category: 'trickster' },
  { name: 'Giraffe', emoji: '🦒', category: 'giant' },
  { name: 'Zebra', emoji: '🦓', category: 'giant' },
  { name: 'Rabbit', emoji: '🐰', category: 'pet' },
  { name: 'Fox', emoji: '🦊', category: 'trickster' },
];

function playAnimalSound(animal) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);

    const t = ctx.currentTime;
    const cat = animal.category;
    if (cat === 'bigCat') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(70, t);
      osc.frequency.exponentialRampToValueAtTime(130, t + 0.25);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);
      osc.start(t); osc.stop(t + 0.55);
    } else if (cat === 'giant') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.setValueAtTime(160, t + 0.15);
      osc.frequency.setValueAtTime(120, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.start(t); osc.stop(t + 0.5);
    } else if (cat === 'pet') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      osc.frequency.exponentialRampToValueAtTime(450, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t); osc.stop(t + 0.3);
    } else if (cat === 'farm') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(220, t + 0.2);
      osc.frequency.linearRampToValueAtTime(190, t + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
      osc.start(t); osc.stop(t + 0.45);
    } else if (cat === 'bird') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.setValueAtTime(900, t + 0.08);
      osc.frequency.setValueAtTime(700, t + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.start(t); osc.stop(t + 0.25);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(250, t);
      osc.frequency.linearRampToValueAtTime(350, t + 0.12);
      osc.frequency.linearRampToValueAtTime(280, t + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.start(t); osc.stop(t + 0.35);
    }
  } catch {}
}

function ShadowGame() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [current, setCurrent] = useState(() => pickRandom(animalData));

  const others = animalData.filter(d => d.name !== current.name);
  const wrong = shuffle(others).slice(0, 3);
  const options = shuffle([current, ...wrong]);

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
    setCurrent(pickRandom(animalData));
    setFeedback(null);
    setRevealed(false);
    setLocked(false);
  }, []);

  const handleAnswer = useCallback((animal) => {
    if (locked) return;
    if (animal.name === current.name) {
      setScore(s => s + 1);
      setFeedback('correct');
      playSuccess();
      setRevealed(true);
      setLocked(true);
    } else {
      setFeedback('wrong');
      playError();
      setTimeout(() => setFeedback(null), 1200);
    }
  }, [current, locked]);

  return (
    <Card sx={{
      borderRadius: 6,
      background: 'linear-gradient(135deg, #FEF9C3 0%, #FED7AA 100%)',
      boxShadow: '0 8px 32px rgba(251, 146, 60, 0.15)',
      overflow: 'visible',
      position: 'relative',
    }}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Shadow & Sound
          </Typography>
          <Chip
            icon={<EmojiEventsIcon />}
            label={`Score: ${score}`}
            sx={{ fontWeight: 700, fontSize: '1rem', bgcolor: '#FEF3C7', color: '#92400E', borderRadius: 4, px: 1 }}
          />
        </Box>

        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontWeight: 500 }}>
            Who hides behind the shadow? 👀
          </Typography>

          <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Box sx={{
              width: { xs: 160, md: 200 }, height: { xs: 160, md: 200 },
              borderRadius: '50%', bgcolor: '#ffffff',
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
            }}>
              <Typography
                sx={{
                  fontSize: { xs: '5rem', md: '7rem' },
                  lineHeight: 1,
                  filter: revealed ? 'none' : 'brightness(0) contrast(1)',
                  transition: 'filter 0.4s ease',
                  animation: revealed ? 'puffIn 0.5s ease' : 'none',
                }}
                role="img"
                aria-label={revealed ? current.name : 'Hidden animal shadow'}
              >
                {current.emoji}
              </Typography>
            </Box>

            <IconButton
              onClick={() => playAnimalSound(current)}
              aria-label={`Play sound of ${current.name}`}
              disabled={locked}
              sx={{
                position: 'absolute', bottom: -8, right: -8,
                bgcolor: '#F59E0B', color: '#ffffff',
                width: { xs: 48, md: 56 }, height: { xs: 48, md: 56 },
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                '&:hover': { bgcolor: '#D97706', transform: 'scale(1.08)' },
                transition: 'all 0.2s ease',
              }}
            >
              <VolumeUpIcon sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' } }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 480, mx: 'auto' }}>
            {options.map((animal, i) => {
              const label = String.fromCharCode(65 + i);
              const isCorrect = animal.name === current.name;
              let bg = '#ffffff', border = '#E5E7EB';
              if (feedback === 'correct' && isCorrect) { bg = '#BBF7D0'; border = '#22C55E'; }
              if (feedback === 'wrong' && isCorrect) { bg = '#FECACA'; border = '#EF4444'; }
              return (
                <Button
                  key={animal.name}
                  onClick={() => handleAnswer(animal)}
                  disabled={locked}
                  aria-label={`Option ${label}: ${animal.name}`}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    p: 1.5, borderRadius: 4, minHeight: 64,
                    bgcolor: bg, color: '#1F2937',
                    border: '2px solid', borderColor: border,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    '&:hover': !locked ? {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      borderColor: '#FBBF24',
                      bgcolor: '#FFFBEB',
                    } : {},
                    transition: 'all 0.2s ease',
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                  }}
                >
                  <Typography variant="body2" fontWeight={800}
                    sx={{ color: '#9CA3AF', minWidth: 24, fontSize: '0.85rem' }}>
                    {label}.
                  </Typography>
                  <Typography sx={{ fontSize: '1.6rem', lineHeight: 1 }}>
                    {animal.emoji}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                    {animal.name}
                  </Typography>
                </Button>
              );
            })}
          </Box>
        </Box>

        {feedback === 'correct' && (
          <Box sx={{
            textAlign: 'center', mt: 2, p: 2,
            bgcolor: '#DCFCE7', borderRadius: 4,
            animation: 'bounceIn 0.4s ease',
          }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#16A34A' }}>
              🎉 Correct! It's a {current.name}!
            </Typography>
            <Button
              variant="contained"
              onClick={nextRound}
              sx={{ mt: 1.5, borderRadius: 6, bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, textTransform: 'none', fontWeight: 700 }}
            >
              Next Animal →
            </Button>
          </Box>
        )}

        {feedback === 'wrong' && (
          <Box sx={{
            textAlign: 'center', mt: 2, p: 2,
            bgcolor: '#FEF3C7', borderRadius: 4,
            animation: 'shake 0.4s ease',
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#D97706' }}>
              ✨ Try again, you can do it!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function playHappyVoice() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t + i * 0.1);
      g.gain.setValueAtTime(0.13, t + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.2);
      o.connect(g); g.connect(ctx.destination);
      o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.2);
    });
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sawtooth';
    o2.frequency.setValueAtTime(600, t + 0.1);
    o2.frequency.linearRampToValueAtTime(1200, t + 0.35);
    g2.gain.setValueAtTime(0.05, t + 0.1);
    g2.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    o2.connect(g2); g2.connect(ctx.destination);
    o2.start(t + 0.1); o2.stop(t + 0.5);
  } catch {}
}

function playSadVoice() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(440, t);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.35);
    g.gain.setValueAtTime(0.1, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.5);
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(550, t + 0.05);
    o2.frequency.exponentialRampToValueAtTime(350, t + 0.2);
    g2.gain.setValueAtTime(0.04, t + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    o2.connect(g2); g2.connect(ctx.destination);
    o2.start(t + 0.05); o2.stop(t + 0.4);
  } catch {}
}

function playSuccess() { playHappyVoice(); }
function playError() { playSadVoice(); }

function AlphabetQuiz() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState(() => pickRandom(alphabetData));

  const options = useRef([]);
  if (options.current.length === 0 || locked === false) {
    const others = alphabetData.filter(d => d.letter !== current.letter);
    const wrong = shuffle(others).slice(0, 3);
    options.current = shuffle([current, ...wrong]);
  }

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
    const next = pickRandom(alphabetData);
    setCurrent(next);
    options.current = [];
    setFeedback(null);
    setLocked(false);
  }, []);

  const handleAnswer = useCallback((item) => {
    if (locked) return;
    if (item.letter === current.letter) {
      setScore(s => s + 1);
      setFeedback('correct');
      playSuccess();
      setLocked(true);
    } else {
      setFeedback('wrong');
      playError();
      setTimeout(() => setFeedback(null), 1200);
    }
  }, [current, locked]);

  return (
    <Card sx={{
      borderRadius: 6,
      background: 'linear-gradient(135deg, #FFF0F5 0%, #E6E6FA 100%)',
      boxShadow: '0 8px 32px rgba(255, 105, 180, 0.15)',
      overflow: 'visible',
      position: 'relative',
    }}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Alphabet Quiz
          </Typography>
          <Chip
            icon={<EmojiEventsIcon />}
            label={`Score: ${score}`}
            sx={{ fontWeight: 700, fontSize: '1rem', bgcolor: '#FEF3C7', color: '#92400E', borderRadius: 4, px: 1 }}
          />
        </Box>

        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 1, fontWeight: 500 }}>
            Which one starts with the letter <strong>{current.letter}</strong>?
          </Typography>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: { xs: 100, md: 120 }, height: { xs: 100, md: 120 },
            borderRadius: '50%', bgcolor: '#ffffff',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)',
            mb: 3,
          }}>
            <Typography variant="h2" fontWeight={800} sx={{ color: '#7C3AED', fontSize: { xs: '3rem', md: '4rem' } }}>
              {current.letter}
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 480, mx: 'auto' }}>
            {options.current.map((item, i) => (
              <Button
                key={i}
                onClick={() => handleAnswer(item)}
                disabled={locked}
                aria-label={`Select ${item.word} for letter ${current.letter}`}
                sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                  p: 2, borderRadius: 4, minHeight: 100,
                  bgcolor: feedback === 'correct' && item.letter === current.letter
                    ? '#BBF7D0' : feedback === 'wrong' && item.letter === current.letter
                    ? '#FECACA' : '#ffffff',
                  color: '#1F2937',
                  fontSize: '2.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  border: '2px solid',
                  borderColor: feedback === 'correct' && item.letter === current.letter
                    ? '#22C55E' : feedback === 'wrong' && item.letter === current.letter
                    ? '#EF4444' : '#E5E7EB',
                  '&:hover': !locked ? {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    bgcolor: '#FDF2F8',
                    borderColor: '#F9A8D4',
                  } : {},
                  transition: 'all 0.2s ease',
                  textTransform: 'none',
                }}
              >
                <span style={{ fontSize: '2.5rem', lineHeight: 1.2 }}>{item.emoji}</span>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem', color: '#6B7280' }}>
                  {item.word}
                </Typography>
              </Button>
            ))}
          </Box>
        </Box>

        {feedback === 'correct' && (
          <Box sx={{
            textAlign: 'center', mt: 2, p: 2,
            bgcolor: '#DCFCE7', borderRadius: 4,
            animation: 'bounceIn 0.4s ease',
          }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#16A34A' }}>
              🎉 Correct! Great Job!
            </Typography>
            <Button
              variant="contained"
              onClick={nextRound}
              sx={{ mt: 1.5, borderRadius: 6, bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, textTransform: 'none', fontWeight: 700 }}
            >
              Next Question →
            </Button>
          </Box>
        )}

        {feedback === 'wrong' && (
          <Box sx={{
            textAlign: 'center', mt: 2, p: 2,
            bgcolor: '#FEF3C7', borderRadius: 4,
            animation: 'shake 0.4s ease',
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#D97706' }}>
              ✨ Try again, you can do it!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function MathBooster() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  const genProblem = useCallback(() => {
    const op = Math.random() < 0.5 ? '+' : '-';
    let a, b;
    if (op === '+') {
      a = Math.floor(Math.random() * 15) + 2;
      b = Math.floor(Math.random() * 10) + 1;
    } else {
      a = Math.floor(Math.random() * 15) + 5;
      b = Math.floor(Math.random() * a) + 1;
    }
    const correct = op === '+' ? a + b : a - b;
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const offset = Math.floor(Math.random() * 7) - 3;
      const w = correct + (offset === 0 ? 1 : offset);
      if (w !== correct && w >= 0) wrongs.add(w);
    }
    const opts = shuffle([correct, ...wrongs]);
    return { a, b, op, correct, opts };
  }, []);

  const [problem, setProblem] = useState(genProblem);

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
    setProblem(genProblem());
    setFeedback(null);
    setLocked(false);
  }, [genProblem]);

  const handleAnswer = useCallback((val) => {
    if (locked) return;
    if (val === problem.correct) {
      setStreak(s => s + 1);
      setScore(s => s + 10 + (streak >= 2 ? 5 : 0));
      setFeedback('correct');
      playSuccess();
      setLocked(true);
    } else {
      setStreak(0);
      setFeedback('wrong');
      playError();
      setTimeout(() => setFeedback(null), 1200);
    }
  }, [problem, locked, streak]);

  const visualCount = problem.a > 12 ? `${problem.a}` : '🍎'.repeat(problem.a);

  return (
    <Card sx={{
      borderRadius: 6,
      background: 'linear-gradient(135deg, #F0FFF0 0%, #E0F4FF 100%)',
      boxShadow: '0 8px 32px rgba(34, 197, 94, 0.15)',
      overflow: 'visible',
      position: 'relative',
    }}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Math Booster
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`Score: ${score}`}
              sx={{ fontWeight: 700, fontSize: '0.9rem', bgcolor: '#DCFCE7', color: '#166534', borderRadius: 4 }}
            />
            {streak >= 2 && (
              <Chip
                icon={<EmojiEventsIcon sx={{ fontSize: 16 }} />}
                label={`+${10 + (streak >= 2 ? 5 : 0)} streak!`}
                sx={{ fontWeight: 700, fontSize: '0.9rem', bgcolor: '#FEF3C7', color: '#92400E', borderRadius: 4 }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Box sx={{
            bgcolor: '#ffffff', borderRadius: 4, p: 2, mb: 2,
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)',
            minHeight: 60,
          }}>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.85rem', mb: 0.5 }}>
              Count and solve:
            </Typography>
            <Typography variant="h5" fontWeight={600} sx={{ color: '#374151', letterSpacing: '0.05em' }}>
              {typeof visualCount === 'string' ? visualCount : visualCount}
            </Typography>
          </Box>

          <Typography variant="h3" fontWeight={800} sx={{ color: '#1F2937', mb: 3, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            {problem.a} {problem.op === '+' ? <span style={{color:'#059669'}}>+</span> : <span style={{color:'#DC2626'}}>−</span>} {problem.b} = ?
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 400, mx: 'auto' }}>
            {problem.opts.map((val, i) => {
              const isCorrect = val === problem.correct;
              let bg = '#ffffff';
              let border = '#E5E7EB';
              if (feedback === 'correct' && isCorrect) { bg = '#BBF7D0'; border = '#22C55E'; }
              if (feedback === 'wrong' && isCorrect) { bg = '#FECACA'; border = '#EF4444'; }
              return (
                <Button
                  key={i}
                  onClick={() => handleAnswer(val)}
                  disabled={locked}
                  aria-label={`Answer option ${val}`}
                  sx={{
                    width: '100%', aspectRatio: '1/1', borderRadius: '50%',
                    fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800,
                    bgcolor: bg, color: '#1F2937',
                    border: '3px solid', borderColor: border,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    '&:hover': !locked ? {
                      transform: 'scale(1.05)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      borderColor: '#60A5FA',
                      bgcolor: '#EFF6FF',
                    } : {},
                    transition: 'all 0.2s ease',
                    minWidth: 0,
                  }}
                >
                  {val}
                </Button>
              );
            })}
          </Box>
        </Box>

        {feedback === 'correct' && (
          <Box sx={{
            textAlign: 'center', mt: 2, p: 2,
            bgcolor: '#DCFCE7', borderRadius: 4,
            animation: 'bounceIn 0.4s ease',
          }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#16A34A' }}>
              🎉 Correct! +{streak >= 2 ? '15' : '10'} Points
            </Typography>
            <Button
              variant="contained"
              onClick={nextRound}
              sx={{ mt: 1.5, borderRadius: 6, bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, textTransform: 'none', fontWeight: 700 }}
            >
              Next Question →
            </Button>
          </Box>
        )}

        {feedback === 'wrong' && (
          <Box sx={{
            textAlign: 'center', mt: 2, p: 2,
            bgcolor: '#FEF3C7', borderRadius: 4,
            animation: 'shake 0.4s ease',
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#D97706' }}>
              ✨ Try again, you can do it!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function ResetButton({ onReset }) {
  return (
    <Button
      onClick={onReset}
      startIcon={<RefreshIcon />}
      sx={{
        borderRadius: 6, textTransform: 'none', fontWeight: 700,
        color: '#6B7280', borderColor: '#D1D5DB',
        '&:hover': { bgcolor: '#F3F4F6' },
      }}
      variant="outlined"
    >
      Reset Game
    </Button>
  );
}

const seoSchema = {
  '@context': 'https://schema.org',
  '@type': 'Game',
  name: 'Free Online Educational Games for Kids & Kindergarten',
  description: 'Fun and interactive educational games for kids: Alphabet Matching Quiz (A for Apple), Kids Math Booster (addition & subtraction), and Guess the Animal Shadow & Sound. Play online free, no download needed.',
  audience: { '@type': 'Audience', suggestedAge: '3-8 years' },
  educationalRole: 'Alphabet recognition, basic arithmetic, animal identification, sound recognition',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  author: { '@type': 'Organization', name: 'Digital Home' },
};

export default function GamesPage() {
  const [alphabetKey, setAlphabetKey] = useState(0);
  const [mathKey, setMathKey] = useState(0);
  const [shadowKey, setShadowKey] = useState(0);
  const [fs, setFs] = useState(false);

  const enterFs = useCallback(() => {
    setFs(true);
    document.body.style.overflow = 'hidden';
    try { document.documentElement.requestFullscreen?.(); } catch {}
  }, []);

  const exitFs = useCallback(() => {
    setFs(false);
    document.body.style.overflow = '';
    try { document.exitFullscreen?.(); } catch {}
  }, []);

  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) { setFs(false); document.body.style.overflow = ''; } };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const gameContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: fs ? 6 : 5 }}>
      <section aria-label="Alphabet Matching Quiz Game">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant={fs ? "h4" : "h5"} component="h2" fontWeight={800} sx={{ color: '#7C3AED' }}>
            🔤 Alphabet Matching Quiz
          </Typography>
          {!fs && <ResetButton onReset={() => setAlphabetKey(k => k + 1)} />}
        </Box>
        {!fs && <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2 }}>Match the letter to the correct picture! Tap the right emoji to earn points.</Typography>}
        <Box key={alphabetKey}>
          <AlphabetQuiz />
        </Box>
      </section>

      <section aria-label="Kids Math Booster Game">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant={fs ? "h4" : "h5"} component="h2" fontWeight={800} sx={{ color: '#059669' }}>
            ➕ Kids Math Booster
          </Typography>
          {!fs && <ResetButton onReset={() => setMathKey(k => k + 1)} />}
        </Box>
        {!fs && <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2 }}>Solve fun addition & subtraction problems. Get streak bonuses for consecutive correct answers!</Typography>}
        <Box key={mathKey}>
          <MathBooster />
        </Box>
      </section>

      <section aria-label="Guess the Animal Shadow and Sound Game">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant={fs ? "h4" : "h5"} component="h2" fontWeight={800} sx={{ color: '#D97706' }}>
            👀 Guess the Animal Shadow & Sound
          </Typography>
          {!fs && <ResetButton onReset={() => setShadowKey(k => k + 1)} />}
        </Box>
        {!fs && <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2 }}>Look at the shadow silhouette, play the animal sound, and guess who it is! Tap the right answer to reveal the animal.</Typography>}
        <Box key={shadowKey}>
          <ShadowGame />
        </Box>
      </section>
    </Box>
  );

  return (
    <>
      {fs ? (
        <Box sx={{
          position: 'fixed', inset: 0, zIndex: 999999,
          bgcolor: '#0f172a',
          overflow: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          <Box sx={{
            position: 'sticky', top: 0, zIndex: 10, px: 2, py: 1,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            bgcolor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 1 }}>
              🎮 Full Screen Mode
            </Typography>
            <IconButton
              onClick={exitFs}
              aria-label="Exit full screen mode"
              sx={{ color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              <CloseFullscreenIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, px: { xs: 2, md: 6 }, py: { xs: 3, md: 4 }, maxWidth: 900, mx: 'auto', width: '100%' }}>
            {gameContent}
          </Box>
          <Box sx={{ textAlign: 'center', pb: 3 }}>
            <Button
              onClick={exitFs}
              variant="outlined"
              startIcon={<CloseFullscreenIcon />}
              sx={{ borderRadius: 6, color: '#94A3B8', borderColor: '#475569', textTransform: 'none', fontWeight: 600, '&:hover': { borderColor: '#94A3B8' } }}
            >
              Exit Full Screen (Esc)
            </Button>
          </Box>
        </Box>
      ) : (
        <Layout>
          <Seo
            title="Free Online Educational Games for Kids & Kindergarten - Digital Home"
            description="Fun learning games for kids: alphabet matching (A for Apple), math booster (addition & subtraction), and guess the animal shadow & sound game. Play free online educational games for kindergarten children."
            keywords="free online educational games for kids, kindergarten learning games, alphabet matching game, A for Apple, kids math booster, addition subtraction game, guess the animal shadow, animal sounds game, preschool learning"
            jsonLd={seoSchema}
          />
          <Box sx={{ py: { xs: 2, md: 3 } }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h3"
                fontWeight={900}
                sx={{
                  fontSize: { xs: '1.8rem', md: '2.8rem' },
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899, #F59E0B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                🎮 Kids Educational Game Zone
              </Typography>
              <Typography variant="h6" sx={{ color: '#6B7280', fontWeight: 500, fontSize: { xs: '1rem', md: '1.2rem' } }}>
                Learn ABCs, Math & Animals the fun way! 🚀
              </Typography>
              <Button
                onClick={enterFs}
                variant="contained"
                size="large"
                startIcon={<FullscreenIcon />}
                aria-label="Play games in full screen mode"
                sx={{
                  mt: 2, borderRadius: 6, px: 4, py: 1.2,
                  fontSize: '1.1rem', fontWeight: 800,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7C3AED, #DB2777)',
                    transform: 'scale(1.03)',
                    boxShadow: '0 12px 32px rgba(139, 92, 246, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                  animation: 'pulse 2s infinite',
                }}
              >
                🎮 Full Screen Mode
              </Button>
            </Box>

            {gameContent}

            <Paper sx={{ mt: 5, p: 3, borderRadius: 4, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#92400E', mb: 1 }}>
                🧸 Why Educational Games for Kids?
              </Typography>
              <Typography variant="body2" sx={{ color: '#78350F' }}>
                Free online educational games help kindergarten and preschool children develop essential skills 
                like letter recognition, counting, problem-solving, and animal identification in a fun, interactive way. 
                Our games use bright colors, emojis, synthesized sounds, and positive reinforcement to keep young learners 
                engaged. No downloads, no sign-ups — just pure learning fun!
              </Typography>
            </Paper>
          </Box>
        </Layout>
      )}
    </>
  );
}