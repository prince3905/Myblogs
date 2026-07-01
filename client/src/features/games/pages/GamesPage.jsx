import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Container, Typography, Box, Button, Grid, Card, CardContent, 
  Paper, IconButton, Chip, Slider, LinearProgress, Avatar, Dialog, DialogTitle, DialogContent, DialogContentText
} from '@mui/material';
import { Link } from 'react-router-dom';
import Layout from '../../blog/components/Layout';
import Seo from '../../blog/components/Seo';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarIcon from '@mui/icons-material/Star';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// --- SOUND SYSTEM WITH MOBILE FIX ---
let globalAudioCtx = null;

function getAudioCtx() {
  if (!globalAudioCtx) {
    globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

function playSound(type, isMuted) {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, t); // C5
      osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
      speakVoice("Great job!", isMuted);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t); // A3
      osc.frequency.exponentialRampToValueAtTime(130, t + 0.25);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
      speakVoice("Try again!", isMuted);
    } else if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    } else {
      // standard click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  } catch (err) {}
}

function speakVoice(text, isMuted) {
  if (isMuted) return;
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
}

// --- DATASETS ---
const EMOJIS = [
  { char: '🐱', name: 'Cat', group: 'animal' },
  { char: '🐶', name: 'Dog', group: 'animal' },
  { char: '🦁', name: 'Lion', group: 'animal' },
  { char: '🐘', name: 'Elephant', group: 'animal' },
  { char: '🐸', name: 'Frog', group: 'animal' },
  { char: '🐒', name: 'Monkey', group: 'animal' },
  { char: '🍎', name: 'Apple', group: 'fruit' },
  { char: '🍌', name: 'Banana', group: 'fruit' },
  { char: '🍓', name: 'Strawberry', group: 'fruit' },
  { char: '🍇', name: 'Grapes', group: 'fruit' },
  { char: '🚗', name: 'Car', group: 'vehicle' },
  { char: '🚲', name: 'Bicycle', group: 'vehicle' },
  { char: '✈️', name: 'Airplane', group: 'vehicle' },
  { char: '🚀', name: 'Rocket', group: 'vehicle' },
  { char: '🎈', name: 'Balloon', group: 'toy' },
  { char: '🧸', name: 'Teddy Bear', group: 'toy' },
  { char: '⚽', name: 'Soccer Ball', group: 'toy' },
  { char: '🍕', name: 'Pizza', group: 'food' },
  { char: '🍦', name: 'Ice Cream', group: 'food' }
];

const COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Yellow', hex: '#FBBF24' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Purple', hex: '#8B5CF6' }
];

// --- 1. GRADE SELECTOR ---
function GradeSelector({ onSelect }) {
  const options = [
    { id: 'preschool', title: 'LKG & UKG (Preschool)', age: 'Age 3-5', color: '#10B981', emoji: '🧸', desc: 'Visual recognition, count to 10, colors & shadows.' },
    { id: 'primary', title: 'Class 1 & 2', age: 'Age 6-7', color: '#3B82F6', emoji: '🎒', desc: 'Spelling, addition, patterns, and odd-one-out.' },
    { id: 'upper', title: 'Class 3 to 5', age: 'Age 8-10', color: '#8B5CF6', emoji: '🎓', desc: 'Arithmetic, speed memory, complex logic & unscrambling.' }
  ];

  return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em', color: '#111827' }}>
        Select Your Class 🎒
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 500, mx: 'auto' }}>
        Choose your class to play games set at the perfect difficulty for your brain!
      </Typography>

      <Grid container spacing={3} justifyContent="center" maxWidth="lg" sx={{ mx: 'auto', px: 2 }}>
        {options.map((opt) => (
          <Grid item xs={12} md={4} key={opt.id}>
            <Card 
              onClick={() => onSelect(opt.id)}
              sx={{ 
                cursor: 'pointer',
                borderRadius: '24px',
                border: '2px solid transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: opt.color,
                  transform: 'translateY(-8px)',
                  boxShadow: `0 20px 25px -5px ${opt.color}15, 0 10px 10px -5px ${opt.color}10`
                }
              }}
            >
              <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    width: 70, height: 70, borderRadius: '20px', 
                    bgcolor: `${opt.color}15`, display: 'flex', 
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '2.5rem', mb: 3
                  }}
                >
                  {opt.emoji}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#111827' }}>
                  {opt.title}
                </Typography>
                <Chip label={opt.age} size="small" sx={{ bgcolor: `${opt.color}20`, color: opt.color, fontWeight: 700, mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.6 }}>
                  {opt.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// --- 2. GAME LIST / DASHBOARD ---
const GAME_LIST = [
  { id: 'shadow', name: 'Shadow Matcher 👤', desc: 'Find the silhouette matching the colorful emoji.' },
  { id: 'phonics', name: 'Alphabet Phonics 🔠', desc: 'Identify correct items starting with the letter.' },
  { id: 'math', name: 'Math Booster 🧮', desc: 'Count items or solve arithmetic speed questions.' },
  { id: 'memory', name: 'Memory Cards 🧠', desc: 'Match emoji card pairs under the time limit.' },
  { id: 'pattern', name: 'Pattern Completer 🧩', desc: 'Look at the emoji pattern and pick the next object.' },
  { id: 'odd', name: 'Odd One Out 🚫', desc: 'Spot the object that does not belong to the group.' },
  { id: 'word', name: 'Word Builder ✏️', desc: 'Rearrange the scrambled letters into a real word.' },
  { id: 'balloon', name: 'Balloon Pop 🎈', desc: 'Pop numerical balloons matching correct rules.' },
  { id: 'color', name: 'Color Mixer 🎨', desc: 'Mix primary colors together to target shades.' },
  { id: 'reflex', name: 'Speed Tapper ⭐', desc: 'Tap happy emojis as fast as they pop up.' }
];

function GamesDashboard({ grade, onSelectGame, onChangeGrade }) {
  const label = grade === 'preschool' ? 'Preschool' : grade === 'primary' ? 'Class 1 & 2' : 'Class 3 to 5';
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            Brain Boosters Suite <Chip label={label} size="medium" color="primary" sx={{ fontWeight: 800, borderRadius: '8px' }} />
          </Typography>
          <Typography variant="body2" color="text.secondary">Select from 10 games designed to test and sharpen your mind!</Typography>
        </Box>
        <Button 
          variant="outlined" 
          onClick={onChangeGrade} 
          startIcon={<SchoolIcon />}
          sx={{ borderRadius: '9999px', fontWeight: 600 }}
        >
          Change Class
        </Button>
      </Box>

      <Grid container spacing={3}>
        {GAME_LIST.map((game, i) => (
          <Grid item xs={12} sm={6} md={4} key={game.id}>
            <Card 
              onClick={() => onSelectGame(game.id)}
              sx={{ 
                cursor: 'pointer',
                borderRadius: '16px',
                border: '1.5px solid #F3F4F6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)',
                  borderColor: 'primary.main',
                  boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#191c21' }}>
                  {game.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, lineHeight: 1.5 }}>
                  {game.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// --- INDIVIDUAL INTERACTIVE GAMES CONTROLLERS ---

// --- GAME 1: SHADOW MATCHER ---
function GameShadowMatcher({ grade, onWin, onLose, isMuted }) {
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const init = () => {
    const list = [...EMOJIS];
    const target = list[Math.floor(Math.random() * list.length)];
    const count = grade === 'preschool' ? 3 : grade === 'primary' ? 4 : 5;
    
    let pool = list.filter(item => item.char !== target.char);
    const opts = [target];
    for (let i = 0; i < count - 1; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      opts.push(pool[idx]);
      pool.splice(idx, 1);
    }
    
    setQuestion(target);
    setOptions(opts.sort(() => Math.random() - 0.5));
    setFeedback(null);
  };

  useEffect(() => { init(); }, []);

  const handleSelect = (item) => {
    if (feedback) return;
    if (item.char === question.char) {
      setFeedback('correct');
      playSound('success', isMuted);
      setTimeout(() => {
        onWin(10);
        init();
      }, 1200);
    } else {
      setFeedback('wrong');
      playSound('error', isMuted);
      setTimeout(() => {
        onLose(5);
        setFeedback(null);
      }, 1200);
    }
  };

  if (!question) return null;

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="h6" sx={{ mb: 4, fontWeight: 700 }}>Identify the correct emoji that matches this shadow!</Typography>
      
      {/* Target Shadow */}
      <Box 
        sx={{ 
          fontSize: '6rem', 
          mx: 'auto', 
          width: 150, 
          height: 150, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          filter: 'brightness(0) contrast(100%)', // turn completely black/shadow
          bgcolor: '#F3F4F6',
          borderRadius: '50%',
          mb: 5
        }}
      >
        {question.char}
      </Box>

      {/* Options */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <Paper
            key={opt.char}
            onClick={() => handleSelect(opt)}
            elevation={feedback ? 0 : 2}
            sx={{
              p: 2, fontSize: '3rem', cursor: 'pointer', borderRadius: '16px',
              width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid transparent',
              transition: 'all 0.2s',
              '&:hover': { transform: 'scale(1.1)', borderColor: 'primary.main' }
            }}
          >
            {opt.char}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

// --- GAME 2: ALPHABET PHONICS ---
function GameAlphabetPhonics({ grade, onWin, onLose, isMuted }) {
  const [letter, setLetter] = useState('');
  const [options, setOptions] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const init = () => {
    const list = EMOJIS.filter(e => e.name.length > 2);
    const target = list[Math.floor(Math.random() * list.length)];
    const targetLetter = target.name[0].toUpperCase();
    
    // Choose pool of distractors that do NOT start with this letter
    let pool = list.filter(e => e.name[0].toUpperCase() !== targetLetter);
    const count = grade === 'preschool' ? 3 : 4;
    const opts = [target];
    for (let i = 0; i < count - 1; i++) {
      if (pool.length === 0) break;
      const idx = Math.floor(Math.random() * pool.length);
      opts.push(pool[idx]);
      pool.splice(idx, 1);
    }

    setLetter(targetLetter);
    setAnswer(target);
    setOptions(opts.sort(() => Math.random() - 0.5));
    setFeedback(null);
    speakVoice(`Which object starts with the letter ${targetLetter}?`, isMuted);
  };

  useEffect(() => { init(); }, []);

  const handleSelect = (item) => {
    if (feedback) return;
    if (item.char === answer.char) {
      setFeedback('correct');
      playSound('success', isMuted);
      speakVoice(`${letter} is for ${item.name}!`, isMuted);
      setTimeout(() => {
        onWin(10);
        init();
      }, 1500);
    } else {
      setFeedback('wrong');
      playSound('error', isMuted);
      setTimeout(() => {
        onLose(5);
        setFeedback(null);
      }, 1200);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Find the object starting with letter:</Typography>
      <Box sx={{ fontSize: '7rem', fontWeight: 900, color: 'primary.main', mb: 4 }}>
        {letter}
      </Box>

      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <Paper
            key={opt.char}
            onClick={() => handleSelect(opt)}
            sx={{
              p: 3, cursor: 'pointer', borderRadius: '24px', width: 140,
              textAlign: 'center', transition: 'all 0.2s', border: '2px solid transparent',
              '&:hover': { transform: 'translateY(-4px)', borderColor: 'primary.main' }
            }}
          >
            <Box sx={{ fontSize: '3.5rem', mb: 1 }}>{opt.char}</Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#374151' }}>
              {grade === 'preschool' ? '???' : opt.name}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

// --- GAME 3: MATH BOOSTER ---
function GameMathBooster({ grade, onWin, onLose, isMuted }) {
  const [question, setQuestion] = useState('');
  const [visualItems, setVisualItems] = useState([]);
  const [options, setOptions] = useState([]);
  const [answer, setAnswer] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const init = () => {
    setFeedback(null);
    if (grade === 'preschool') {
      // Counting mode
      const num = Math.floor(Math.random() * 8) + 2; // 2 to 9
      const emoji = ['🍎', '🍒', '⭐', '🐶', '🚗'][Math.floor(Math.random() * 5)];
      const items = Array(num).fill(emoji);
      setVisualItems(items);
      setQuestion(`Count the objects! How many ${emoji} do you see?`);
      setAnswer(num);

      const opts = new Set([num]);
      while (opts.size < 4) {
        opts.add(Math.floor(Math.random() * 8) + 2);
      }
      setOptions([...opts].sort(() => Math.random() - 0.5));
    } else {
      // Sums mode
      setVisualItems([]);
      let num1, num2, symbol, ans;
      const isUpper = grade === 'upper';

      if (isUpper) {
        // Class 3-5: Add, subtract, multiply
        const op = Math.floor(Math.random() * 3);
        if (op === 0) {
          num1 = Math.floor(Math.random() * 40) + 10;
          num2 = Math.floor(Math.random() * 40) + 10;
          symbol = '+';
          ans = num1 + num2;
        } else if (op === 1) {
          num1 = Math.floor(Math.random() * 80) + 20;
          num2 = Math.floor(Math.random() * num1);
          symbol = '-';
          ans = num1 - num2;
        } else {
          num1 = Math.floor(Math.random() * 8) + 2;
          num2 = Math.floor(Math.random() * 11) + 2;
          symbol = '×';
          ans = num1 * num2;
        }
      } else {
        // Class 1-2: Add or subtract under 20
        const op = Math.floor(Math.random() * 2);
        num1 = Math.floor(Math.random() * 10) + 5;
        num2 = Math.floor(Math.random() * num1);
        if (op === 0) {
          symbol = '+';
          ans = num1 + num2;
        } else {
          symbol = '-';
          ans = num1 - num2;
        }
      }

      setQuestion(`${num1} ${symbol} ${num2} = ?`);
      setAnswer(ans);

      const opts = new Set([ans]);
      while (opts.size < 4) {
        const offset = Math.floor(Math.random() * 9) - 4;
        opts.add(ans + offset);
      }
      setOptions([...opts].sort(() => Math.random() - 0.5));
    }
  };

  useEffect(() => { init(); }, [grade]);

  const handleSelect = (val) => {
    if (feedback) return;
    if (val === answer) {
      setFeedback('correct');
      playSound('success', isMuted);
      setTimeout(() => {
        onWin(10);
        init();
      }, 1200);
    } else {
      setFeedback('wrong');
      playSound('error', isMuted);
      setTimeout(() => {
        onLose(5);
        setFeedback(null);
      }, 1200);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 800, color: 'text.primary' }}>
        {question}
      </Typography>

      {/* Visual Counters for Preschoolers */}
      {visualItems.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', maxWidth: 400, mx: 'auto', mb: 5 }}>
          {visualItems.map((emoji, idx) => (
            <Box 
              key={idx} 
              sx={{ 
                fontSize: '3rem', animation: 'bounce 1s infinite alternate',
                animationDelay: `${idx * 0.1}s`
              }}
            >
              {emoji}
            </Box>
          ))}
        </Box>
      )}

      {/* Options */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <Button
            key={opt}
            variant="contained"
            onClick={() => handleSelect(opt)}
            sx={{
              borderRadius: '20px', minWidth: 90, py: 2, fontSize: '1.5rem', fontWeight: 800,
              bgcolor: 'background.paper', color: 'primary.main', border: '2px solid', borderColor: 'primary.main',
              boxShadow: 'none', '&:hover': { bgcolor: 'primary.main', color: 'white' }
            }}
          >
            {opt}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

// --- GAME 4: MEMORY CARDS ---
function GameMemoryFlip({ grade, onWin, onLose, isMuted }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [solved, setSolved] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);

  const init = () => {
    const list = [...EMOJIS].sort(() => Math.random() - 0.5);
    const pairCount = grade === 'preschool' ? 2 : grade === 'primary' ? 4 : 6;
    const selected = list.slice(0, pairCount);
    
    // Duplicate and shuffle
    const paired = [...selected, ...selected]
      .map((item, idx) => ({ ...item, id: idx }))
      .sort(() => Math.random() - 0.5);

    setCards(paired);
    setFlipped([]);
    setSolved([]);
    setTimeLeft(grade === 'upper' ? 30 : 60);
  };

  useEffect(() => { init(); }, [grade]);

  // Countdown timer for Upper level
  useEffect(() => {
    if (grade !== 'upper') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          playSound('error', isMuted);
          onLose(10);
          init();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [grade]);

  const handleCardClick = (idx) => {
    if (flipped.length >= 2 || solved.includes(idx) || flipped.includes(idx)) return;
    playSound('click', isMuted);
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const first = cards[newFlipped[0]];
      const second = cards[newFlipped[1]];
      
      if (first.char === second.char) {
        setSolved(prev => [...prev, newFlipped[0], newFlipped[1]]);
        setFlipped([]);
        playSound('success', isMuted);

        // Check if finished
        if (solved.length + 2 === cards.length) {
          setTimeout(() => {
            onWin(20);
            init();
          }, 800);
        }
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      {grade === 'upper' && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ color: 'error.main', fontWeight: 800 }}>
            ⏳ Time Left: {timeLeft}s
          </Typography>
          <LinearProgress variant="determinate" value={(timeLeft / 30) * 100} sx={{ height: 8, borderRadius: 4, maxWidth: 300, mx: 'auto', mt: 1 }} />
        </Box>
      )}

      <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 450, mx: 'auto' }}>
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || solved.includes(idx);
          return (
            <Grid item xs={grade === 'preschool' ? 6 : 3} key={card.id}>
              <Paper
                onClick={() => handleCardClick(idx)}
                sx={{
                  height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.5rem', cursor: 'pointer', borderRadius: '16px',
                  bgcolor: isFlipped ? 'background.paper' : 'primary.main',
                  color: isFlipped ? 'text.primary' : 'primary.contrastText',
                  border: '2px solid',
                  borderColor: isFlipped ? 'primary.main' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isFlipped ? 'rotateY(180deg)' : 'none'
                }}
              >
                {isFlipped ? card.char : '❓'}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

// --- GAME 5: PATTERN COMPLETER ---
function GamePatternCompleter({ grade, onWin, onLose, isMuted }) {
  const [pattern, setPattern] = useState([]);
  const [options, setOptions] = useState([]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  const init = () => {
    setFeedback(null);
    const item1 = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const item2 = EMOJIS.filter(e => e.char !== item1.char)[Math.floor(Math.random() * (EMOJIS.length - 1))];
    
    let seq = [];
    let ans = '';

    if (grade === 'preschool') {
      // ABAB pattern (e.g. 🍎 🍌 🍎 🍌)
      seq = [item1.char, item2.char, item1.char, item2.char];
      ans = item1.char;
    } else if (grade === 'primary') {
      // ABBABB pattern (e.g. 🦁 🐶 🐶 🦁 🐶 [?])
      seq = [item1.char, item2.char, item2.char, item1.char, item2.char];
      ans = item2.char;
    } else {
      // AABAAB (e.g. 🎈 🎈 🧸 🎈 🎈 [?])
      seq = [item1.char, item1.char, item2.char, item1.char, item1.char];
      ans = item2.char;
    }

    setPattern(seq);
    setAnswer(ans);

    const opts = new Set([ans, item1.char, item2.char]);
    while (opts.size < 4) {
      opts.add(EMOJIS[Math.floor(Math.random() * EMOJIS.length)].char);
    }
    setOptions([...opts].sort(() => Math.random() - 0.5));
  };

  useEffect(() => { init(); }, [grade]);

  const handleSelect = (char) => {
    if (feedback) return;
    if (char === answer) {
      setFeedback('correct');
      playSound('success', isMuted);
      setTimeout(() => {
        onWin(10);
        init();
      }, 1200);
    } else {
      setFeedback('wrong');
      playSound('error', isMuted);
      setTimeout(() => {
        onLose(5);
        setFeedback(null);
      }, 1200);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="h6" sx={{ mb: 4, fontWeight: 700 }}>Look closely! Complete the pattern sequence:</Typography>

      {/* Pattern Row */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 6, flexWrap: 'wrap' }}>
        {pattern.map((char, idx) => (
          <Paper 
            key={idx} 
            sx={{ 
              width: 70, height: 70, fontSize: '2.5rem', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', borderRadius: '16px' 
            }}
          >
            {char}
          </Paper>
        ))}
        <Paper 
          sx={{ 
            width: 70, height: 70, fontSize: '2rem', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', borderRadius: '16px',
            bgcolor: 'grey.100', border: '3px dashed', borderColor: 'primary.main',
            color: 'primary.main', fontWeight: 800
          }}
        >
          ?
        </Paper>
      </Box>

      {/* Options */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <Paper
            key={opt}
            onClick={() => handleSelect(opt)}
            sx={{
              p: 2, fontSize: '2.5rem', cursor: 'pointer', borderRadius: '16px',
              width: 70, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid transparent', transition: 'all 0.2s',
              '&:hover': { transform: 'scale(1.1)', borderColor: 'primary.main' }
            }}
          >
            {opt}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

// --- GAME 6: ODD ONE OUT ---
function GameOddOneOut({ grade, onWin, onLose, isMuted }) {
  const [options, setOptions] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const init = () => {
    setFeedback(null);
    const groups = ['animal', 'fruit', 'vehicle', 'food'];
    const primaryGroup = groups[Math.floor(Math.random() * groups.length)];
    const oddGroup = groups.filter(g => g !== primaryGroup)[Math.floor(Math.random() * (groups.length - 1))];

    // Pick 3 from primaryGroup and 1 from oddGroup
    const primaryItems = [...EMOJIS].filter(e => e.group === primaryGroup).sort(() => Math.random() - 0.5);
    const oddItem = [...EMOJIS].filter(e => e.group === oddGroup)[Math.floor(Math.random() * 3)] || EMOJIS[0];

    const opts = [
      primaryItems[0],
      primaryItems[1],
      primaryItems[2],
      oddItem
    ].sort(() => Math.random() - 0.5);

    setAnswer(oddItem);
    setOptions(opts);
  };

  useEffect(() => { init(); }, []);

  const handleSelect = (item) => {
    if (feedback) return;
    if (item.char === answer.char) {
      setFeedback('correct');
      playSound('success', isMuted);
      setTimeout(() => {
        onWin(10);
        init();
      }, 1200);
    } else {
      setFeedback('wrong');
      playSound('error', isMuted);
      setTimeout(() => {
        onLose(5);
        setFeedback(null);
      }, 1200);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="h6" sx={{ mb: 4, fontWeight: 700 }}>One of these does not belong. Click the odd one out!</Typography>

      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
        {options.map((opt) => (
          <Paper
            key={opt.char}
            onClick={() => handleSelect(opt)}
            sx={{
              p: 3, cursor: 'pointer', borderRadius: '24px', width: 110, height: 110,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '3.5rem', border: '2px solid transparent', transition: 'all 0.2s',
              '&:hover': { transform: 'scale(1.05)', borderColor: 'primary.main' }
            }}
          >
            {opt.char}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

// --- GAME 7: WORD BUILDER ---
function GameWordBuilder({ grade, onWin, onLose, isMuted }) {
  const [word, setWord] = useState('');
  const [emoji, setEmoji] = useState('');
  const [scrambled, setScrambled] = useState([]);
  const [selections, setSelections] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const init = () => {
    setFeedback(null);
    setSelections([]);
    
    // Choose list by grade
    const maxLen = grade === 'preschool' ? 3 : grade === 'primary' ? 5 : 7;
    const pool = EMOJIS.filter(e => e.name.length <= maxLen && e.name.indexOf(' ') === -1);
    const target = pool[Math.floor(Math.random() * pool.length)] || EMOJIS[0];
    
    const wordUpper = target.name.toUpperCase();
    setWord(wordUpper);
    setEmoji(target.char);
    
    // Scramble letters
    const letters = wordUpper.split('').map((char, idx) => ({ char, originalIndex: idx, id: idx }));
    setScrambled(letters.sort(() => Math.random() - 0.5));
  };

  useEffect(() => { init(); }, [grade]);

  const handleLetterClick = (letterObj) => {
    if (feedback) return;
    playSound('click', isMuted);
    
    const nextSelections = [...selections, letterObj];
    setSelections(nextSelections);

    const filteredScrambled = scrambled.filter(item => item.id !== letterObj.id);
    setScrambled(filteredScrambled);

    if (nextSelections.length === word.length) {
      const constructed = nextSelections.map(item => item.char).join('');
      if (constructed === word) {
        setFeedback('correct');
        playSound('success', isMuted);
        speakVoice(`${word}! Correct spelling!`, isMuted);
        setTimeout(() => {
          onWin(15);
          init();
        }, 1500);
      } else {
        setFeedback('wrong');
        playSound('error', isMuted);
        setTimeout(() => {
          onLose(5);
          init();
        }, 1500);
      }
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Build the word for the picture!</Typography>
      
      {/* Emoji Hint */}
      <Box sx={{ fontSize: '5rem', mb: 3 }}>
        {emoji}
      </Box>

      {/* Answer Board */}
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 4, minHeight: 60 }}>
        {Array(word.length).fill(null).map((_, idx) => {
          const selectedLetter = selections[idx];
          return (
            <Paper
              key={idx}
              sx={{
                width: 55, height: 55, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 800, borderRadius: '12px',
                border: '2px solid', borderColor: 'primary.main',
                bgcolor: selectedLetter ? 'primary.main' : 'background.paper',
                color: selectedLetter ? 'white' : 'transparent'
              }}
            >
              {selectedLetter ? selectedLetter.char : ''}
            </Paper>
          );
        })}
      </Box>

      {/* Scrambled Bank */}
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
        {scrambled.map((item) => (
          <Button
            key={item.id}
            variant="contained"
            onClick={() => handleLetterClick(item)}
            sx={{
              minWidth: 50, height: 50, fontSize: '1.25rem', fontWeight: 800,
              borderRadius: '12px', bgcolor: 'grey.200', color: '#111827',
              '&:hover': { bgcolor: 'primary.main', color: 'white' }
            }}
          >
            {item.char}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

// --- GAME 8: BALLOON POP ---
function GameBalloonPop({ grade, onWin, onLose, isMuted }) {
  const [targetRule, setTargetRule] = useState('');
  const [balloons, setBalloons] = useState([]);
  const canvasRef = useRef(null);

  const init = () => {
    // Generate rules
    let ruleText = '';
    let validator = () => false;
    
    if (grade === 'preschool') {
      const num = Math.floor(Math.random() * 5) + 1; // Find all 1s, 2s, 3s, etc.
      ruleText = `Pop only balloons with the number ${num}!`;
      validator = (val) => val === num;
    } else if (grade === 'primary') {
      const ruleType = Math.floor(Math.random() * 2);
      if (ruleType === 0) {
        ruleText = 'Pop only EVEN numbers!';
        validator = (val) => val % 2 === 0;
      } else {
        ruleText = 'Pop only ODD numbers!';
        validator = (val) => val % 2 !== 0;
      }
    } else {
      // Upper level logic: solve equations
      const op = Math.floor(Math.random() * 2);
      const val1 = Math.floor(Math.random() * 8) + 1;
      const val2 = Math.floor(Math.random() * 7) + 1;
      const result = op === 0 ? val1 + val2 : val1 * val2;
      ruleText = `Pop the balloon with the answer to: ${val1} ${op === 0 ? '+' : '×'} ${val2}`;
      validator = (val) => val === result;
    }

    setTargetRule(ruleText);
    speakVoice(ruleText, isMuted);

    // Initial balloons
    const list = [];
    for (let i = 0; i < 6; i++) {
      list.push(generateBalloon(i));
    }
    setBalloons(list);
  };

  const generateBalloon = (index) => {
    return {
      id: Math.random(),
      value: Math.floor(Math.random() * 15) + 1,
      x: Math.random() * 80 + 10, // percentage left
      y: 105 + (index * 15), // start below canvas
      speed: Math.random() * 0.8 + 0.4,
      color: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'][Math.floor(Math.random() * 6)]
    };
  };

  useEffect(() => { init(); }, [grade]);

  // Balloon animator loop
  useEffect(() => {
    const interval = setInterval(() => {
      setBalloons(prev => {
        return prev.map(b => {
          let nextY = b.y - b.speed;
          if (nextY < -15) {
            // Respawn balloon at bottom
            return generateBalloon(0);
          }
          return { ...b, y: nextY };
        });
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const handlePop = (balloon) => {
    playSound('pop', isMuted);
    
    // Evaluate if popped correctly
    let correct = false;
    if (grade === 'preschool') {
      const match = targetRule.match(/\d+/);
      if (match && balloon.value === parseInt(match[0])) correct = true;
    } else if (grade === 'primary') {
      if (targetRule.includes('EVEN') && balloon.value % 2 === 0) correct = true;
      if (targetRule.includes('ODD') && balloon.value % 2 !== 0) correct = true;
    } else {
      // Evaluate basic sum from string
      const numbers = targetRule.match(/\d+/g);
      if (numbers && numbers.length === 2) {
        const n1 = parseInt(numbers[0]);
        const n2 = parseInt(numbers[1]);
        const expected = targetRule.includes('+') ? n1 + n2 : n1 * n2;
        if (balloon.value === expected) correct = true;
      }
    }

    if (correct) {
      playSound('success', isMuted);
      onWin(15);
      init();
    } else {
      playSound('error', isMuted);
      onLose(5);
      // Remove balloon popped incorrectly
      setBalloons(prev => prev.filter(b => b.id !== balloon.id));
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2, width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
        {targetRule}
      </Typography>

      <Box 
        ref={canvasRef}
        sx={{
          width: '100%', height: 350, bgcolor: '#EFF6FF', borderRadius: '24px',
          position: 'relative', overflow: 'hidden', border: '2px solid #DBEAFE'
        }}
      >
        {balloons.map((b) => (
          <Box
            key={b.id}
            onClick={() => handlePop(b)}
            sx={{
              position: 'absolute', left: `${b.x}%`, top: `${b.y}%`,
              width: 50, height: 60, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
              bgcolor: b.color, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'white',
              fontWeight: 800, fontSize: '1.25rem', boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.2)',
              transform: 'translateX(-50%)',
              transition: 'transform 0.1s',
              '&::after': {
                content: '""', position: 'absolute', bottom: -6, left: 22,
                width: 0, height: 0, borderLeft: '3px solid transparent',
                borderRight: '3px solid transparent', borderTop: `6px solid ${b.color}`
              }
            }}
          >
            {b.value}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// --- GAME 9: COLOR MIXER ---
function GameColorMixer({ grade, onWin, onLose, isMuted }) {
  const [target, setTarget] = useState(null);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const combinations = [
    { target: 'Green', items: ['Blue', 'Yellow'] },
    { target: 'Purple', items: ['Red', 'Blue'] },
    { target: 'Orange', items: ['Red', 'Yellow'] }
  ];

  const init = () => {
    setSelected([]);
    setFeedback(null);
    
    if (grade === 'preschool') {
      // Just identify colors
      const col = COLORS[Math.floor(Math.random() * COLORS.length)];
      setTarget({ name: col.name, color: col.hex, simple: true });
    } else {
      // Mixing mode
      const combo = combinations[Math.floor(Math.random() * combinations.length)];
      setTarget({ name: combo.target, simple: false, mix: combo.items });
      speakVoice(`Mix two colors to make ${combo.target}!`, isMuted);
    }
  };

  useEffect(() => { init(); }, [grade]);

  const handleSelect = (color) => {
    if (feedback) return;
    playSound('click', isMuted);

    if (target.simple) {
      if (color.name === target.name) {
        setFeedback('correct');
        playSound('success', isMuted);
        setTimeout(() => {
          onWin(10);
          init();
        }, 1200);
      } else {
        setFeedback('wrong');
        playSound('error', isMuted);
        setTimeout(() => {
          onLose(5);
          setFeedback(null);
        }, 1200);
      }
    } else {
      // Mixer mode
      const nextSelected = [...selected, color.name];
      setSelected(nextSelected);

      if (nextSelected.length === 2) {
        const isMatch = target.mix.includes(nextSelected[0]) && target.mix.includes(nextSelected[1]);
        if (isMatch) {
          setFeedback('correct');
          playSound('success', isMuted);
          setTimeout(() => {
            onWin(15);
            init();
          }, 1200);
        } else {
          setFeedback('wrong');
          playSound('error', isMuted);
          setTimeout(() => {
            onLose(5);
            setSelected([]);
            setFeedback(null);
          }, 1200);
        }
      }
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        {target?.simple ? `Identify the color: "${target.name}"` : `Mix colors to make: "${target?.name}"`}
      </Typography>

      {/* Target Color Visualizer */}
      <Box 
        sx={{ 
          width: 100, height: 100, borderRadius: '24px', mx: 'auto', mb: 4,
          border: '3px solid #111827',
          bgcolor: target?.simple ? target.color : (target?.name === 'Green' ? '#10B981' : target?.name === 'Purple' ? '#8B5CF6' : '#F97316')
        }} 
      />

      {/* Show Selected for Mixing */}
      {!target?.simple && (
        <Box sx={{ minHeight: 40, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Mixing: {selected.join(' + ') || 'Click primary colors below...'}
          </Typography>
        </Box>
      )}

      {/* Color Palette */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        {COLORS.slice(0, 3).map((col) => (
          <Button
            key={col.name}
            variant="contained"
            onClick={() => handleSelect(col)}
            disabled={selected.includes(col.name)}
            sx={{
              bgcolor: col.hex, color: 'white', fontWeight: 800, width: 100, py: 2,
              borderRadius: '16px', '&:hover': { bgcolor: col.hex, filter: 'brightness(0.9)' }
            }}
          >
            {col.name}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

// --- GAME 10: SPEED TAPPER ---
function GameSpeedTapper({ grade, onWin, onLose, isMuted }) {
  const [gridSize, setGridSize] = useState(9); // 3x3
  const [activeCell, setActiveCell] = useState(null);
  const [score, setScore] = useState(0);

  const init = () => {
    const size = grade === 'preschool' ? 4 : grade === 'primary' ? 9 : 16;
    setGridSize(size);
    setActiveCell(null);
    setScore(0);
  };

  useEffect(() => { init(); }, [grade]);

  // Reflex loop
  useEffect(() => {
    const speed = grade === 'preschool' ? 1400 : grade === 'primary' ? 1000 : 700;
    const interval = setInterval(() => {
      setActiveCell(Math.floor(Math.random() * gridSize));
    }, speed);

    return () => clearInterval(interval);
  }, [gridSize, grade]);

  const handleCellTap = (idx) => {
    if (idx === activeCell) {
      playSound('pop', isMuted);
      setScore(prev => {
        const next = prev + 1;
        if (next >= 10) {
          playSound('success', isMuted);
          onWin(15);
          init();
        }
        return next;
      });
      setActiveCell(null);
    } else {
      playSound('error', isMuted);
      onLose(2);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Tap the smiling face as fast as you can! (Get 10 points)
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mb: 3 }}>
        Score: {score} / 10
      </Typography>

      {/* Grid */}
      <Grid 
        container 
        spacing={2} 
        justifyContent="center" 
        sx={{ 
          maxWidth: grade === 'preschool' ? 240 : grade === 'primary' ? 320 : 420, 
          mx: 'auto' 
        }}
      >
        {Array(gridSize).fill(null).map((_, idx) => {
          const isActive = idx === activeCell;
          return (
            <Grid item xs={grade === 'preschool' ? 6 : grade === 'primary' ? 4 : 3} key={idx}>
              <Paper
                onClick={() => handleCellTap(idx)}
                sx={{
                  height: 80, borderRadius: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.5rem',
                  bgcolor: isActive ? 'success.light' : 'grey.100',
                  boxShadow: isActive ? '0 8px 16px rgba(16, 185, 129, 0.3)' : 'none',
                  transition: 'background-color 0.1s ease',
                  border: isActive ? '2px solid' : '2px solid transparent',
                  borderColor: 'success.main'
                }}
              >
                {isActive ? '😃' : ''}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

// --- MAIN WRAPPER PAGE ---
export default function GamesPage() {
  const [grade, setGrade] = useState(() => localStorage.getItem('kids_grade') || null);
  const [activeGameId, setActiveGameId] = useState(null);
  const [score, setScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameWrapperRef = useRef(null);

  useEffect(() => {
    if (grade) {
      localStorage.setItem('kids_grade', grade);
    }
  }, [grade]);

  // Full screen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameWrapperRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const handleWin = (pts) => {
    setScore(prev => prev + pts);
  };

  const handleLose = (pts) => {
    setScore(prev => Math.max(0, prev - pts));
  };

  return (
    <Layout>
      <Seo 
        title="Kids Brain Booster Educational Games | Digital Home"
        description="Enhance logic, memory, and arithmetic with 10 free interactive educational games for kids from LKG/UKG to Class 5."
        keywords="kids games, brain booster, educational games class 1, bacho ke game, maths booster games, shadow match game"
      />

      <Container maxWidth="lg" sx={{ py: 2 }}>
        {!grade ? (
          <GradeSelector onSelect={setGrade} />
        ) : !activeGameId ? (
          <GamesDashboard 
            grade={grade} 
            onSelectGame={setActiveGameId} 
            onChangeGrade={() => setGrade(null)} 
          />
        ) : (
          <Box ref={gameWrapperRef} sx={{ bgcolor: isFullscreen ? '#FFFFFF' : 'transparent', p: isFullscreen ? 4 : 0 }}>
            {/* Top Game Controls bar */}
            <Box 
              sx={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                mb: 4, bgcolor: 'background.paper', p: 2, borderRadius: '16px',
                border: '1px solid #E5E7EB'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton 
                  onClick={() => {
                    setActiveGameId(null);
                    if (isFullscreen) document.exitFullscreen().catch(() => {});
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827' }}>
                  {GAME_LIST.find(g => g.id === activeGameId)?.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  icon={<EmojiEventsIcon />} 
                  label={`Score: ${score}`} 
                  color="warning" 
                  sx={{ fontWeight: 800, fontSize: '0.95rem' }} 
                />
                
                <IconButton onClick={() => setIsMuted(prev => !prev)}>
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>

                <IconButton onClick={toggleFullscreen}>
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Box>
            </Box>

            {/* Game Canvas container */}
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 3, md: 5 }, borderRadius: '24px', 
                border: '1.5px solid #E5E7EB', minHeight: 400,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)'
              }}
            >
              {activeGameId === 'shadow' && (
                <GameShadowMatcher grade={grade} onWin={handleWin} onLose={handleLose} isMuted={isMuted} />
              )}
              {activeGameId === 'phonics' && (
                <GameAlphabetPhonics grade={grade} onWin={handleWin} onLose={handleLose} isMuted={isMuted} />
              )}
              {activeGameId === 'math' && (
                <GameMathBooster grade={grade} onWin={handleWin} onLose={handleLose} isMuted={isMuted} />
              )}
              {activeGameId === 'memory' && (
                <GameMemoryFlip grade={grade} onWin={handleWin} onLose={handleLose} isMuted={isMuted} />
              )}
              {activeGameId === 'pattern' && (
                <GamePatternCompleter grade={grade} onWin={handleWin} onLose={handleLose} isMuted={isMuted} />
              )}
              {activeGameId === 'odd' && (
                <GameOddOneOut grade={grade} onWin={handleWin} onLose={handleLose} isMuted={isMuted} />
              )}
              {activeGameId === 'word' && (
                <GameWordBuilder grade={grade} onWin={handleWin} onLose={handleLose} isMuted={isMuted} />
              )}
              {activeGameId === 'balloon' && (
                <GameBalloonPop grade={grade} onWin={handleWin} onLose={handleLose} isMuted={isMuted} />
              )}
              {activeGameId === 'color' && (
                <GameColorMixer grade={grade} onWin={handleWin} onLose={handleLose} isMuted={isMuted} />
              )}
              {activeGameId === 'reflex' && (
                <GameSpeedTapper grade={grade} onWin={handleWin} onLose={handleLose} isMuted={isMuted} />
              )}
            </Paper>
          </Box>
        )}
      </Container>
    </Layout>
  );
}