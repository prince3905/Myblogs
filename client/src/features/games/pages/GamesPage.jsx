import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { 
  Container, Typography, Box, Button, Grid, Card, CardContent, 
  Paper, IconButton, Chip, LinearProgress
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
import StarsIcon from '@mui/icons-material/Stars';
import RefreshIcon from '@mui/icons-material/Refresh';

// --- DATASETS FROM PREVIOUS WORK ---
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

// --- SHUFFLE / RANDOM HELPERS ---
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

// --- AUDIO & VOICE FEEDBACK HELPERS ---
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

function playAnimalSound(animal, isMuted) {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
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
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t); // A3
      osc.frequency.exponentialRampToValueAtTime(130, t + 0.25);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  } catch {}
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

// --- 1. GRADE SELECTOR ---
function GradeSelector({ onSelect }) {
  const options = [
    { id: 'preschool', title: 'LKG & UKG (Preschool)', age: 'Age 3-5', color: '#10B981', emoji: '🧸', desc: 'Visual recognition, count to 10, colors & animal shadows.' },
    { id: 'primary', title: 'Class 1 & 2', age: 'Age 6-7', color: '#3B82F6', emoji: '🎒', desc: 'Alphabet phonics, math addition, patterns, and memory match.' },
    { id: 'upper', title: 'Class 3 to 5', age: 'Age 8-10', color: '#8B5CF6', emoji: '🎓', desc: 'Arithmetic calculation speed, complex sequences, spelling & tapper.' }
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
  { id: 'shadow', name: 'Shadow & Sound 👤', desc: 'Hear the sound, look at the shadow, and guess the animal.' },
  { id: 'phonics', name: 'Alphabet Phonics 🔠', desc: 'Identify correct items starting with the letter.' },
  { id: 'math', name: 'Math Booster 🧮', desc: 'Count items or solve arithmetic speed equations.' },
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

// --- 3. THE 10 GAMES IMPLEMENTATIONS ---

// --- GAME 1: SHADOW & SOUND (ORIGINAL RESTORED AND SCALED) ---
function GameShadowMatcher({ grade, onWin, onLose, isMuted }) {
  const [current, setCurrent] = useState(() => pickRandom(animalData));
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Generate options based on grade difficulty
  const options = useMemo(() => {
    const others = animalData.filter(d => d.name !== current.name);
    const count = grade === 'preschool' ? 2 : grade === 'primary' ? 3 : 4;
    const wrong = shuffle(others).slice(0, count);
    return shuffle([current, ...wrong]);
  }, [current, grade]);

  const init = () => {
    setCurrent(pickRandom(animalData));
    setFeedback(null);
    setRevealed(false);
    setLocked(false);
  };

  useEffect(() => {
    speakVoice("Guess who hides behind the shadow! Listen to the sound.", isMuted);
  }, [current]);

  const handleAnswer = (animal) => {
    if (locked) return;
    if (animal.name === current.name) {
      setFeedback('correct');
      playSound('success', isMuted);
      speakVoice(`Correct! It is a ${current.name}!`, isMuted);
      setRevealed(true);
      setLocked(true);
      setTimeout(() => {
        onWin(10);
        init();
      }, 2000);
    } else {
      setFeedback('wrong');
      playSound('error', isMuted);
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2, width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Who hides behind the shadow? Listen closely! 👤</Typography>

      <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
        {/* Grey/White Outer circle */}
        <Box sx={{
          width: 170, height: 170,
          borderRadius: '50%', bgcolor: '#ffffff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #E5E7EB',
          overflow: 'hidden', position: 'relative',
        }}>
          {/* ONLY the emoji character gets the black silhouette filter, NOT the circle background! */}
          <Typography
            sx={{
              fontSize: '6.5rem',
              lineHeight: 1,
              filter: revealed ? 'none' : 'brightness(0) contrast(1)', // turns only the text black
              transition: 'filter 0.4s ease',
            }}
          >
            {current.emoji}
          </Typography>
        </Box>

        {/* Audio trigger button */}
        <IconButton
          onClick={() => playAnimalSound(current, isMuted)}
          disabled={locked}
          sx={{
            position: 'absolute', bottom: -4, right: -4,
            bgcolor: '#F59E0B', color: '#ffffff',
            width: 50, height: 50,
            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.45)',
            '&:hover': { bgcolor: '#D97706', transform: 'scale(1.08)' },
            transition: 'all 0.2s ease',
            '&.Mui-disabled': { bgcolor: '#D1D5DB', color: '#9CA3AF', boxShadow: 'none' }
          }}
        >
          <VolumeUpIcon sx={{ fontSize: '1.5rem' }} />
        </IconButton>
      </Box>

      {/* Options */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, maxWidth: 440, mx: 'auto' }}>
        {options.map((animal, i) => {
          const isCorrect = animal.name === current.name;
          let bg = '#ffffff', border = '#E5E7EB';
          if (feedback === 'correct' && isCorrect) { bg = '#BBF7D0'; border = '#22C55E'; }
          if (feedback === 'wrong' && isCorrect) { bg = '#FECACA'; border = '#EF4444'; }
          
          return (
            <Button
              key={animal.name}
              onClick={() => handleAnswer(animal)}
              disabled={locked}
              sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                p: 2, borderRadius: '16px', minHeight: 60,
                bgcolor: bg, color: '#1F2937',
                border: '2px solid', borderColor: border,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                '&:hover': !locked ? {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.15)',
                  borderColor: '#FBBF24',
                  bgcolor: '#FFFBEB',
                } : {},
                textTransform: 'none',
                justifyContent: 'flex-start',
              }}
            >
              <Typography sx={{ fontSize: '1.8rem', lineHeight: 1 }}>{animal.emoji}</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#374151' }}>{animal.name}</Typography>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}

// --- GAME 2: ALPHABET PHONICS (ORIGINAL QUIZ STYLE) ---
function GameAlphabetPhonics({ grade, onWin, onLose, isMuted }) {
  const [current, setCurrent] = useState(() => pickRandom(alphabetData));
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  const options = useMemo(() => {
    const others = alphabetData.filter(d => d.letter !== current.letter);
    const count = grade === 'preschool' ? 2 : grade === 'primary' ? 3 : 4;
    const wrong = shuffle(others).slice(0, count);
    return shuffle([current, ...wrong]);
  }, [current, grade]);

  const init = () => {
    setCurrent(pickRandom(alphabetData));
    setFeedback(null);
    setLocked(false);
  };

  useEffect(() => {
    speakVoice(`Which one starts with the letter ${current.letter}?`, isMuted);
  }, [current]);

  const handleAnswer = (item) => {
    if (locked) return;
    if (item.letter === current.letter) {
      setFeedback('correct');
      playSound('success', isMuted);
      speakVoice(`Yes! ${current.letter} is for ${current.word}!`, isMuted);
      setLocked(true);
      setTimeout(() => {
        onWin(10);
        init();
      }, 2000);
    } else {
      setFeedback('wrong');
      playSound('error', isMuted);
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2, width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Find the picture that starts with letter:</Typography>

      <Box sx={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 100, height: 100, borderRadius: '50%', bgcolor: '#ffffff',
        boxShadow: '0 8px 30px rgba(139, 92, 246, 0.1)', mb: 4,
        border: '3px solid #7C3AED'
      }}>
        <Typography variant="h2" fontWeight={900} sx={{ color: '#7C3AED' }}>{current.letter}</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 440, mx: 'auto' }}>
        {options.map((item, idx) => {
          const isCorrect = item.letter === current.letter;
          let bg = '#ffffff', border = '#E5E7EB';
          if (feedback === 'correct' && isCorrect) { bg = '#BBF7D0'; border = '#22C55E'; }
          if (feedback === 'wrong' && isCorrect) { bg = '#FECACA'; border = '#EF4444'; }

          return (
            <Button
              key={idx}
              onClick={() => handleAnswer(item)}
              disabled={locked}
              sx={{
                display: 'flex', flexDirection: 'column', p: 2, borderRadius: '16px', minHeight: 90,
                bgcolor: bg, color: '#1F2937', border: '2px solid', borderColor: border,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                '&:hover': !locked ? {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 20px rgba(139, 92, 246, 0.15)',
                  bgcolor: '#FDF2F8',
                  borderColor: '#F9A8D4'
                } : {},
                textTransform: 'none'
              }}
            >
              <span style={{ fontSize: '2.5rem', lineHeight: 1.1 }}>{item.emoji}</span>
              <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, color: '#4B5563' }}>
                {grade === 'preschool' ? '???' : item.word}
              </Typography>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}

// --- GAME 3: MATH BOOSTER (WITH VISUAL APPLES) ---
function GameMathBooster({ grade, onWin, onLose, isMuted }) {
  const [problem, setProblem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  const genProblem = useCallback(() => {
    let a, b, op, correct;
    if (grade === 'preschool') {
      a = Math.floor(Math.random() * 8) + 2; // 2 to 9
      b = 0;
      op = '=';
      correct = a;
    } else if (grade === 'primary') {
      a = Math.floor(Math.random() * 10) + 4;
      b = Math.floor(Math.random() * a) + 1;
      op = Math.random() < 0.5 ? '+' : '-';
      correct = op === '+' ? a + b : a - b;
    } else {
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * 12) + 2;
      op = Math.random() < 0.4 ? '+' : Math.random() < 0.7 ? '-' : '×';
      correct = op === '+' ? a + b : op === '-' ? a - b : a * b;
    }

    const wrongs = new Set();
    while (wrongs.size < 3) {
      const offset = Math.floor(Math.random() * 9) - 4;
      const w = correct + (offset === 0 ? 1 : offset);
      if (w !== correct && w >= 0) wrongs.add(w);
    }
    const opts = shuffle([correct, ...wrongs]);
    return { a, b, op, correct, opts };
  }, [grade]);

  useEffect(() => {
    setProblem(genProblem());
    setFeedback(null);
    setLocked(false);
  }, [genProblem]);

  const handleAnswer = (val) => {
    if (locked) return;
    if (val === problem.correct) {
      setFeedback('correct');
      playSound('success', isMuted);
      setLocked(true);
      setTimeout(() => {
        onWin(10);
        setProblem(genProblem());
        setFeedback(null);
        setLocked(false);
      }, 1500);
    } else {
      setFeedback('wrong');
      playSound('error', isMuted);
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  if (!problem) return null;

  // Apples counter display
  const visualApples = problem.a <= 12 && (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mb: 3, fontSize: '1.8rem' }}>
      {Array.from({ length: problem.a }).map((_, idx) => (
        <span key={idx} style={{ display: 'inline-block', animation: 'bounceIn 0.3s ease' }}>🍎</span>
      ))}
    </Box>
  );

  return (
    <Box sx={{ textAlign: 'center', py: 2, width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        {grade === 'preschool' ? 'Count the apples and choose the number! 🍎' : 'Solve the math problem!'}
      </Typography>

      {/* Visual Counters */}
      {visualApples}

      {/* Problem statement */}
      <Typography variant="h3" fontWeight={800} sx={{ color: '#1F2937', mb: 4, fontSize: { xs: '2.4rem', sm: '3.2rem' } }}>
        {grade === 'preschool' ? `Total = ?` : `${problem.a} ${problem.op} ${problem.b} = ?`}
      </Typography>

      {/* Options */}
      <Box sx={{ display: 'flex', gap: 2.5, justifyContent: 'center', flexWrap: 'wrap' }}>
        {problem.opts.map((val, i) => {
          const isCorrect = val === problem.correct;
          let bg = '#ffffff', border = '#E5E7EB';
          if (feedback === 'correct' && isCorrect) { bg = '#BBF7D0'; border = '#22C55E'; }
          if (feedback === 'wrong' && isCorrect) { bg = '#FECACA'; border = '#EF4444'; }

          return (
            <Button
              key={i}
              onClick={() => handleAnswer(val)}
              disabled={locked}
              sx={{
                width: 75, height: 75, borderRadius: '50%', fontSize: '1.8rem', fontWeight: 800,
                bgcolor: bg, color: '#1F2937', border: '3px solid', borderColor: border,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)', minWidth: 0, p: 0,
                '&:hover': !locked ? {
                  transform: 'scale(1.08)',
                  boxShadow: '0 8px 24px rgba(34, 197, 94, 0.2)',
                  borderColor: '#10B981',
                  bgcolor: '#ECFDF5',
                } : {},
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {val}
            </Button>
          );
        })}
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
    
    const paired = [...selected, ...selected]
      .map((item, idx) => ({ ...item, id: idx }))
      .sort(() => Math.random() - 0.5);

    setCards(paired);
    setFlipped([]);
    setSolved([]);
    setTimeLeft(grade === 'upper' ? 30 : 60);
  };

  useEffect(() => { init(); }, [grade]);

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
      seq = [item1.char, item2.char, item1.char, item2.char];
      ans = item1.char;
    } else if (grade === 'primary') {
      seq = [item1.char, item2.char, item2.char, item1.char, item2.char];
      ans = item2.char;
    } else {
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
    
    const maxLen = grade === 'preschool' ? 3 : grade === 'primary' ? 5 : 7;
    const pool = EMOJIS.filter(e => e.name.length <= maxLen && e.name.indexOf(' ') === -1);
    const target = pool[Math.floor(Math.random() * pool.length)] || EMOJIS[0];
    
    const wordUpper = target.name.toUpperCase();
    setWord(wordUpper);
    setEmoji(target.char);
    
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
      
      <Box sx={{ fontSize: '5rem', mb: 3 }}>
        {emoji}
      </Box>

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
    let ruleText = '';
    
    if (grade === 'preschool') {
      const num = Math.floor(Math.random() * 5) + 1;
      ruleText = `Pop only balloons with the number ${num}!`;
    } else if (grade === 'primary') {
      const ruleType = Math.floor(Math.random() * 2);
      if (ruleType === 0) {
        ruleText = 'Pop only EVEN numbers!';
      } else {
        ruleText = 'Pop only ODD numbers!';
      }
    } else {
      const op = Math.floor(Math.random() * 2);
      const val1 = Math.floor(Math.random() * 8) + 1;
      const val2 = Math.floor(Math.random() * 7) + 1;
      ruleText = `Pop the balloon with the answer to: ${val1} ${op === 0 ? '+' : '×'} ${val2}`;
    }

    setTargetRule(ruleText);
    speakVoice(ruleText, isMuted);

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
      x: Math.random() * 80 + 10,
      y: 105 + (index * 15),
      speed: Math.random() * 0.8 + 0.4,
      color: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'][Math.floor(Math.random() * 6)]
    };
  };

  useEffect(() => { init(); }, [grade]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBalloons(prev => {
        return prev.map(b => {
          let nextY = b.y - b.speed;
          if (nextY < -15) {
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
    
    let correct = false;
    if (grade === 'preschool') {
      const match = targetRule.match(/\d+/);
      if (match && balloon.value === parseInt(match[0])) correct = true;
    } else if (grade === 'primary') {
      if (targetRule.includes('EVEN') && balloon.value % 2 === 0) correct = true;
      if (targetRule.includes('ODD') && balloon.value % 2 !== 0) correct = true;
    } else {
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
      const col = COLORS[Math.floor(Math.random() * COLORS.length)];
      setTarget({ name: col.name, color: col.hex, simple: true });
    } else {
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

      <Box 
        sx={{ 
          width: 100, height: 100, borderRadius: '24px', mx: 'auto', mb: 4,
          border: '3px solid #111827',
          bgcolor: target?.simple ? target.color : (target?.name === 'Green' ? '#10B981' : target?.name === 'Purple' ? '#8B5CF6' : '#F97316')
        }} 
      />

      {!target?.simple && (
        <Box sx={{ minHeight: 40, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Mixing: {selected.join(' + ') || 'Click primary colors below...'}
          </Typography>
        </Box>
      )}

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

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 0.8; }
          70% { transform: scale(0.9); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

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