import { useState, useCallback, useRef, useEffect, createContext, useContext, useMemo } from 'react';
import {
  Box, Typography, Button, Card, CardContent,
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

const oddOutPuzzles = [
  { category: 'preschool', common: '🍎', odd: '🐱' },
  { category: 'preschool', common: '🐶', odd: '🍌' },
  { category: 'preschool', common: '🚗', odd: '🐸' },
  { category: 'preschool', common: '🎈', odd: '🔑' },
  
  { category: 'primary', common: '🍎', odd: '🍏' },
  { category: 'primary', common: '🦁', odd: '🐈' },
  { category: 'primary', common: '✈️', odd: '⛵' },
  { category: 'primary', common: '🍪', odd: '🍕' },
  
  { category: 'upper', common: '😀', odd: '😬' },
  { category: 'upper', common: '⏰', odd: '🕰️' },
  { category: 'upper', common: '⚽', odd: '⚾' },
  { category: 'upper', common: '🍀', odd: '☘️' },
  { category: 'upper', common: '📈', odd: '📉' }
];

const pictureBoardData = {
  animals: [
    { nameEn: 'Lion', nameHi: 'शेर', emoji: '🦁' },
    { nameEn: 'Elephant', nameHi: 'हाथी', emoji: '🐘' },
    { nameEn: 'Tiger', nameHi: 'बाघ', emoji: '🐅' },
    { nameEn: 'Cow', nameHi: 'गाय', emoji: '🐄' },
    { nameEn: 'Dog', nameHi: 'कुत्ता', emoji: '🐕' },
    { nameEn: 'Cat', nameHi: 'बिल्ली', emoji: '🐈' },
    { nameEn: 'Rabbit', nameHi: 'खरगोश', emoji: '🐰' },
    { nameEn: 'Monkey', nameHi: 'बंदर', emoji: '🐒' },
    { nameEn: 'Horse', nameHi: 'घोड़ा', emoji: '🐎' },
    { nameEn: 'Bear', nameHi: 'भालू', emoji: '🐻' },
    { nameEn: 'Deer', nameHi: 'हिरण', emoji: '🦌' },
    { nameEn: 'Sheep', nameHi: 'भेड़', emoji: '🐑' },
  ],
  fruits: [
    { nameEn: 'Apple', nameHi: 'सेब', emoji: '🍎' },
    { nameEn: 'Banana', nameHi: 'केला', emoji: '🍌' },
    { nameEn: 'Mango', nameHi: 'आम', emoji: '🥭' },
    { nameEn: 'Watermelon', nameHi: 'तरबूज', emoji: '🍉' },
    { nameEn: 'Grapes', nameHi: 'अंगूर', emoji: '🍇' },
    { nameEn: 'Orange', nameHi: 'संतरा', emoji: '🍊' },
    { nameEn: 'Pineapple', nameHi: 'अनानास', emoji: '🍍' },
    { nameEn: 'Strawberry', nameHi: 'स्ट्रॉबेरी', emoji: '🍓' },
    { nameEn: 'Pomegranate', nameHi: 'अनार', emoji: '🍎' },
    { nameEn: 'Papaya', nameHi: 'पपीता', emoji: '🍈' },
    { nameEn: 'Cherry', nameHi: 'चेरी', emoji: '🍒' },
    { nameEn: 'Coconut', nameHi: 'नारियल', emoji: '🥥' },
  ],
  vehicles: [
    { nameEn: 'Car', nameHi: 'कार', emoji: '🚗' },
    { nameEn: 'Bicycle', nameHi: 'साइकिल', emoji: '🚲' },
    { nameEn: 'Bus', nameHi: 'बस', emoji: '🚌' },
    { nameEn: 'Train', nameHi: 'रेलगाड़ी', emoji: '🚂' },
    { nameEn: 'Aeroplane', nameHi: 'हवाई जहाज', emoji: '✈️' },
    { nameEn: 'Ship', nameHi: 'पानी का जहाज', emoji: '🚢' },
    { nameEn: 'Motorcycle', nameHi: 'मोटर साइकिल', emoji: '🏍️' },
    { nameEn: 'Helicopter', nameHi: 'हेलीकॉप्टर', emoji: '🚁' },
    { nameEn: 'Truck', nameHi: 'ट्रक', emoji: '🚚' },
    { nameEn: 'Ambulance', nameHi: 'एम्बुलेंस', emoji: '🚑' },
    { nameEn: 'Tractor', nameHi: 'ट्रैक्टर', emoji: '🚜' },
    { nameEn: 'Rocket', nameHi: 'रॉकेट', emoji: '🚀' },
  ],
  birds: [
    { nameEn: 'Peacock', nameHi: 'मोर', emoji: '🦚' },
    { nameEn: 'Parrot', nameHi: 'तोता', emoji: '🦜' },
    { nameEn: 'Crow', nameHi: 'कौआ', emoji: '🐦' },
    { nameEn: 'Pigeon', nameHi: 'कबूतर', emoji: '🐦' },
    { nameEn: 'Duck', nameHi: 'बत्तख', emoji: '🦆' },
    { nameEn: 'Hen', nameHi: 'मुर्गी', emoji: '🐔' },
    { nameEn: 'Owl', nameHi: 'उल्लू', emoji: '🦉' },
    { nameEn: 'Eagle', nameHi: 'चील', emoji: '🦅' },
    { nameEn: 'Swan', nameHi: 'हंस', emoji: '🦢' },
    { nameEn: 'Sparrow', nameHi: 'गौरैया', emoji: '🐦' },
    { nameEn: 'Penguin', nameHi: 'पेंगुइन', emoji: '🐧' },
    { nameEn: 'Woodpecker', nameHi: 'कटफोड़वा', emoji: '🐦' },
  ]
};

const hindiAlphabet = [
  { letter: 'अ', word: 'अनार', emoji: '🍎', description: 'अ से अनार' },
  { letter: 'आ', word: 'आम', emoji: '🥭', description: 'आ से आम' },
  { letter: 'इ', word: 'इमली', emoji: '🫚', description: 'इ से इमली' },
  { letter: 'ई', word: 'ईख', emoji: '🎋', description: 'ई से ईख' },
  { letter: 'उ', word: 'उल्लू', emoji: '🦉', description: 'उ से उल्लू' },
  { letter: 'ऊ', word: 'ऊन', emoji: '🧶', description: 'ऊ से ऊन' },
  { letter: 'ए', word: 'एड़ी', emoji: '🦶', description: 'ए से एड़ी' },
  { letter: 'ऐ', word: 'ऐनक', emoji: '👓', description: 'ऐ से ऐनक' },
  { letter: 'ओ', word: 'ओखली', emoji: '🥣', description: 'ओ से ओखली' },
  { letter: 'औ', word: 'औरत', emoji: '👩', description: 'औ से औरत' },
  { letter: 'अं', word: 'अंगूर', emoji: '🍇', description: 'अं से अंगूर' },
  
  { letter: 'क', word: 'कबूतर', emoji: '🐦', description: 'क से कबूतर' },
  { letter: 'ख', word: 'खरगोश', emoji: '🐰', description: 'ख से खरगोश' },
  { letter: 'ग', word: 'गमला', emoji: '🪴', description: 'ग से गमला' },
  { letter: 'घ', word: 'घर', emoji: '🏠', description: 'घ से घर' },
  { letter: 'च', word: 'चम्मच', emoji: '🥄', description: 'च से चम्मच' },
  { letter: 'छ', word: 'छाता', emoji: '☂️', description: 'छ से छाता' },
  { letter: 'ज', word: 'जहाज', emoji: '🚢', description: 'ज से जहाज' },
  { letter: 'झ', word: 'झंडा', emoji: '🇮🇳', description: 'झ से झंडा' },
  { letter: 'ट', word: 'टमाटर', emoji: '🍅', description: 'ट से टमाटर' },
  { letter: 'ठ', word: 'ठठेरा', emoji: '👨‍🏭', description: 'ठ से ठठेरा' },
  { letter: 'ड', word: 'डमरू', emoji: '🥁', description: 'ड से डमरू' },
  { letter: 'ढ', word: 'ढक्कन', emoji: '🫙', description: 'ढ से ढक्कन' },
  { letter: 'त', word: 'तरबूज', emoji: '🍉', description: 'त से तरबूज' },
  { letter: 'थ', word: 'थरमस', emoji: '🧴', description: 'थ से थरमस' },
  { letter: 'द', word: 'दवात', emoji: '✒️', description: 'द से दवात' },
  { letter: 'ध', word: 'धनुष', emoji: '🏹', description: 'ध से धनुष' },
  { letter: 'न', word: 'नल', emoji: '🚰', description: 'न से नल' },
  { letter: 'प', word: 'पतंग', emoji: '🪁', description: 'प से पतंग' },
  { letter: 'फ', word: 'फल', emoji: '🍎', description: 'फ से फल' },
  { letter: 'ब', word: 'बत्तख', emoji: '🦆', description: 'ब से बत्तख' },
  { letter: 'भ', word: 'भालू', emoji: '🐻', description: 'भ से भालू' },
  { letter: 'म', word: 'मछली', emoji: '🐟', description: 'म से मछली' },
  { letter: 'य', word: 'यज्ञ', emoji: '🔥', description: 'य से यज्ञ' },
  { letter: 'र', word: 'रथ', emoji: '🛒', description: 'र से रथ' },
  { letter: 'ल', word: 'लट्टू', emoji: '🪀', description: 'ल से लट्टू' },
  { letter: 'व', word: 'वन', emoji: '🌳', description: 'व से वन' },
  { letter: 'श', word: 'शलगम', emoji: '🍠', description: 'श से shalgam' },
  { letter: 'ष', word: 'षट्कोण', emoji: '⬡', description: 'ष से षट्कोण' },
  { letter: 'स', word: 'सपेरा', emoji: '🐍', description: 'स से सपेरा' },
  { letter: 'ह', word: 'हाथी', emoji: '🐘', description: 'ह से हाथी' },
  { letter: 'क्ष', word: 'क्षत्रिय', emoji: '⚔️', description: 'क्ष से क्षत्रिय' },
  { letter: 'त्र', word: 'त्रिशूल', emoji: '🔱', description: 'त्र से त्रिशूल' },
  { letter: 'ज्ञ', word: 'ज्ञानी', emoji: '👨‍🏫', description: 'ज्ञ से ज्ञानी' },
];

const englishAlphabet = [
  { letter: 'A', word: 'Apple', emoji: '🍎', description: 'A for Apple' },
  { letter: 'B', word: 'Banana', emoji: '🍌', description: 'B for Banana' },
  { letter: 'C', word: 'Cat', emoji: '🐱', description: 'C for Cat' },
  { letter: 'D', word: 'Dog', emoji: '🐕', description: 'D for Dog' },
  { letter: 'E', word: 'Elephant', emoji: '🐘', description: 'E for Elephant' },
  { letter: 'F', word: 'Fish', emoji: '🐟', description: 'F for Fish' },
  { letter: 'G', word: 'Grapes', emoji: '🍇', description: 'G for Grapes' },
  { letter: 'H', word: 'Hat', emoji: '🎩', description: 'H for Hat' },
  { letter: 'I', word: 'Ice Cream', emoji: '🍦', description: 'I for Ice Cream' },
  { letter: 'J', word: 'Jellyfish', emoji: '🪼', description: 'J for Jellyfish' },
  { letter: 'K', word: 'Kangaroo', emoji: '🦘', description: 'K for Kangaroo' },
  { letter: 'L', word: 'Lion', emoji: '🦁', description: 'L for Lion' },
  { letter: 'M', word: 'Monkey', emoji: '🐒', description: 'M for Monkey' },
  { letter: 'N', word: 'Nest', emoji: '🪹', description: 'N for Nest' },
  { letter: 'O', word: 'Orange', emoji: '🍊', description: 'O for Orange' },
  { letter: 'P', word: 'Penguin', emoji: '🐧', description: 'P for Penguin' },
  { letter: 'Q', word: 'Queen', emoji: '👸', description: 'Q for Queen' },
  { letter: 'R', word: 'Rabbit', emoji: '🐰', description: 'R for Rabbit' },
  { letter: 'S', word: 'Sun', emoji: '☀️', description: 'S for Sun' },
  { letter: 'T', word: 'Tiger', emoji: '🐅', description: 'T for Tiger' },
  { letter: 'U', word: 'Umbrella', emoji: '☂️', description: 'U for Umbrella' },
  { letter: 'V', word: 'Violin', emoji: '🎻', description: 'V for Violin' },
  { letter: 'W', word: 'Watermelon', emoji: '🍉', description: 'W for Watermelon' },
  { letter: 'X', word: 'Xylophone', emoji: '🪘', description: 'X for Xylophone' },
  { letter: 'Y', word: 'Yak', emoji: '🐂', description: 'Y for Yak' },
  { letter: 'Z', word: 'Zebra', emoji: '🦓', description: 'Z for Zebra' },
];

const spellingWords = [
  { word: 'CAT', emoji: '🐱', grade: 'preschool' },
  { word: 'DOG', emoji: '🐕', grade: 'preschool' },
  { word: 'PIG', emoji: '🐷', grade: 'preschool' },
  { word: 'COW', emoji: '🐄', grade: 'preschool' },
  { word: 'SUN', emoji: '☀️', grade: 'preschool' },
  { word: 'FOX', emoji: '🦊', grade: 'preschool' },
  { word: 'OWL', emoji: '🦉', grade: 'preschool' },
  
  { word: 'FROG', emoji: '🐸', grade: 'primary' },
  { word: 'DUCK', emoji: '🦆', grade: 'primary' },
  { word: 'LION', emoji: '🦁', grade: 'primary' },
  { word: 'BEAR', emoji: '🐻', grade: 'primary' },
  { word: 'APPLE', emoji: '🍎', grade: 'primary' },
  { word: 'GRAPE', emoji: '🍇', grade: 'primary' },
  { word: 'MELON', emoji: '🍉', grade: 'primary' },
  
  { word: 'BANANA', emoji: '🍌', grade: 'upper' },
  { word: 'MONKEY', emoji: '🐵', grade: 'upper' },
  { word: 'ORANGE', emoji: '🍊', grade: 'upper' },
  { word: 'CHERRY', emoji: '🍒', grade: 'upper' },
  { word: 'ROCKET', emoji: '🚀', grade: 'upper' },
  { word: 'PENCIL', emoji: '✏️', grade: 'upper' },
  { word: 'ELEPHANT', emoji: '🐘', grade: 'upper' },
];

let globalAudioCtx = null;

function getAudioCtx() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioContextClass();
    }
    if (globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  } catch {
    return null;
  }
}

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      }).catch(() => {});
    } else if (ctx) {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    }
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
}

function playAnimalSound(animal) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
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

function ShadowGame({ selectedGrade }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Filter animals: preschool gets easy common pets/birds/farm animals
  const pool = useMemo(() => {
    if (selectedGrade === 'preschool') {
      return animalData.filter(a => a.category === 'pet' || a.category === 'farm' || a.category === 'bird');
    }
    return animalData;
  }, [selectedGrade]);

  const [current, setCurrent] = useState(() => pickRandom(pool) || animalData[0]);

  const options = useMemo(() => {
    if (!current) return [];
    const others = pool.filter(d => d.name !== current.name);
    const count = selectedGrade === 'preschool' ? 1 : selectedGrade === 'primary' ? 2 : 3;
    const wrong = shuffle(others).slice(0, count);
    return shuffle([current, ...wrong]);
  }, [current, pool, selectedGrade]);

  const nextRound = useCallback(() => {
    setRound(r => r + 1);
    setCurrent(pickRandom(pool) || animalData[0]);
    setFeedback(null);
    setRevealed(false);
    setLocked(false);
  }, [pool]);

  if (!current) return null;

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
    <GameFullscreen>
    <Card sx={{
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #FEF9C3 0%, #FED7AA 100%)',
      boxShadow: '0 12px 40px rgba(251, 146, 60, 0.18)',
      overflow: 'visible',
      position: 'relative',
      border: 'none',
      '&:hover': { transform: 'none', boxShadow: '0 12px 40px rgba(251, 146, 60, 0.18)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Shadow & Sound
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<EmojiEventsIcon />}
              label={`Score: ${score}`}
              sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#FEF3C7', color: '#92400E', borderRadius: '12px', px: 0.5 }}
            />
            <GameFullscreenButton />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 2.5, fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
            Who hides behind the shadow? 👀
          </Typography>

          <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Box sx={{
              width: { xs: 150, sm: 190, md: 200 }, height: { xs: 150, sm: 190, md: 200 },
              borderRadius: '50%', bgcolor: '#ffffff',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
            }}>
              <Typography
                sx={{
                  fontSize: { xs: '4.5rem', sm: '6.5rem', md: '7rem' },
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
                position: 'absolute', bottom: -4, right: -4,
                bgcolor: '#F59E0B', color: '#ffffff',
                width: { xs: 48, sm: 54, md: 56 }, height: { xs: 48, sm: 54, md: 56 },
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.45)',
                animation: !locked ? 'pulseGlow 2.5s infinite' : 'none',
                '&:hover': { bgcolor: '#D97706', transform: 'scale(1.08)' },
                transition: 'all 0.2s ease',
                '&.Mui-disabled': { bgcolor: '#D1D5DB', color: '#9CA3AF', boxShadow: 'none' }
              }}
            >
              <VolumeUpIcon sx={{ fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.7rem' } }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, maxWidth: 480, mx: 'auto' }}>
            {options.map((animal, i) => {
              const label = String.fromCharCode(65 + i);
              const isCorrect = animal.name === current.name;
              let bg = '#ffffff', border = 'rgba(0,0,0,0.06)';
              if (feedback === 'correct' && isCorrect) { bg = '#BBF7D0'; border = '#22C55E'; }
              if (feedback === 'wrong' && isCorrect) { bg = '#FECACA'; border = '#EF4444'; }
              return (
                <Button
                  key={animal.name}
                  onClick={() => handleAnswer(animal)}
                  disabled={locked}
                  aria-label={`Option ${label}: ${animal.name}`}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: { xs: 1.5, sm: 1.8 }, borderRadius: '16px', minHeight: { xs: 56, sm: 64 },
                    bgcolor: bg, color: '#1F2937',
                    border: '2px solid', borderColor: border,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    '&:hover': !locked ? {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 20px rgba(251, 146, 60, 0.2)',
                      borderColor: '#FBBF24',
                      bgcolor: '#FFFBEB',
                    } : {},
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                  }}
                >
                  <Typography variant="body2" fontWeight={800}
                    sx={{ color: '#9CA3AF', minWidth: 20, fontSize: '0.85rem' }}>
                    {label}.
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '1.3rem', sm: '1.6rem' }, lineHeight: 1 }}>
                    {animal.emoji}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.9rem', color: '#374151' }}>
                    {animal.name}
                  </Typography>
                </Button>
              );
            })}
          </Box>
        </Box>

        {feedback === 'correct' && (
          <Box sx={{
            textAlign: 'center', mt: 3, p: 2,
            bgcolor: '#DCFCE7', borderRadius: '16px',
            animation: 'bounceIn 0.4s ease',
          }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#16A34A', fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
              🎉 Correct! It's a {current.name}!
            </Typography>
            <Button
              variant="contained"
              onClick={nextRound}
              sx={{ mt: 1.5, borderRadius: '12px', bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, textTransform: 'none', fontWeight: 700 }}
            >
              Next Animal →
            </Button>
          </Box>
        )}

        {feedback === 'wrong' && (
          <Box sx={{
            textAlign: 'center', mt: 3, p: 2,
            bgcolor: '#FEF3C7', borderRadius: '16px',
            animation: 'shake 0.4s ease',
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#D97706', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              ✨ Try again, you can do it!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
    </GameFullscreen>
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
    const ctx = getAudioCtx();
    if (!ctx) return;
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
    const ctx = getAudioCtx();
    if (!ctx) return;
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

function triggerConfetti() {
  if (typeof document === 'undefined') return;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = 0;
  container.style.pointerEvents = 'none';
  container.style.zIndex = '999999';
  document.body.appendChild(container);

  const emojis = ['🎉', '✨', '⭐', '🌟', '🎈', '❤️', '🌈', '🥳', '🐱', '🐶', '🦄', '🍎', '🍭'];
  const count = 25;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.position = 'absolute';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.fontSize = Math.floor(Math.random() * 20 + 24) + 'px';
    el.style.transform = 'translate(-50%, -50%)';
    container.appendChild(el);

    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 140 + 90;
    const x = Math.cos(angle) * velocity;
    const y = Math.sin(angle) * velocity - 120;

    el.animate([
      { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 1 },
      { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.3)`, opacity: 0.9 },
      { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y + 280}px)) scale(0.7)`, opacity: 0 }
    ], {
      duration: 1100 + Math.random() * 500,
      easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
      fill: 'forwards'
    });
  }

  setTimeout(() => {
    container.remove();
  }, 2000);
}

function playSuccess() {
  playHappyVoice();
  triggerConfetti();
}
function playError() { playSadVoice(); }

function AlphabetQuiz({ selectedGrade }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);
  const [current, setCurrent] = useState(() => pickRandom(alphabetData));

  const options = useRef([]);
  if (options.current.length === 0 || locked === false) {
    const count = selectedGrade === 'preschool' ? 1 : selectedGrade === 'primary' ? 2 : 3;
    const others = alphabetData.filter(d => d.letter !== current.letter);
    const wrong = shuffle(others).slice(0, count);
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
    <GameFullscreen>
    <Card sx={{
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #FFF0F5 0%, #E6E6FA 100%)',
      boxShadow: '0 12px 40px rgba(255, 105, 180, 0.15)',
      overflow: 'visible',
      position: 'relative',
      border: 'none',
      '&:hover': { transform: 'none', boxShadow: '0 12px 40px rgba(255, 105, 180, 0.15)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Alphabet Quiz
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<EmojiEventsIcon />}
              label={`Score: ${score}`}
              sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#FEF3C7', color: '#92400E', borderRadius: '12px', px: 0.5 }}
            />
            <GameFullscreenButton />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
            Which one starts with the letter <strong>{current.letter}</strong>?
          </Typography>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: { xs: 80, sm: 100, md: 120 }, height: { xs: 80, sm: 100, md: 120 },
            borderRadius: '50%', bgcolor: '#ffffff',
            boxShadow: '0 8px 30px rgba(139, 92, 246, 0.15)',
            mb: 3,
          }}>
            <Typography variant="h2" fontWeight={800} sx={{ color: '#7C3AED', fontSize: { xs: '2.5rem', sm: '3.2rem', md: '4rem' } }}>
              {current.letter}
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: selectedGrade === 'preschool' ? '1fr' : '1fr 1fr', gap: 1.5, maxWidth: 480, mx: 'auto' }}>
            {options.current.map((item, i) => (
              <Button
                key={i}
                onClick={() => handleAnswer(item)}
                disabled={locked}
                aria-label={`Select ${item.word} for letter ${current.letter}`}
                sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                  p: { xs: 1.5, sm: 2 }, borderRadius: '16px', minHeight: { xs: 85, sm: 100 },
                  bgcolor: feedback === 'correct' && item.letter === current.letter
                    ? '#BBF7D0' : feedback === 'wrong' && item.letter === current.letter
                    ? '#FECACA' : '#ffffff',
                  color: '#1F2937',
                  fontSize: '2.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  border: '2px solid',
                  borderColor: feedback === 'correct' && item.letter === current.letter
                    ? '#22C55E' : feedback === 'wrong' && item.letter === current.letter
                    ? '#EF4444' : 'rgba(0,0,0,0.06)',
                  '&:hover': !locked ? {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.15)',
                    bgcolor: '#FDF2F8',
                    borderColor: '#F9A8D4',
                  } : {},
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'none',
                }}
              >
                <span style={{ fontSize: { xs: '2rem', sm: '2.4rem' }, lineHeight: 1.1 }}>{item.emoji}</span>
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.85rem', color: '#4B5563' }}>
                  {item.word}
                </Typography>
              </Button>
            ))}
          </Box>
        </Box>

        {feedback === 'correct' && (
          <Box sx={{
            textAlign: 'center', mt: 3, p: 2,
            bgcolor: '#DCFCE7', borderRadius: '16px',
            animation: 'bounceIn 0.4s ease',
          }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#16A34A', fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
              🎉 Correct! Great Job!
            </Typography>
            <Button
              variant="contained"
              onClick={nextRound}
              sx={{ mt: 1.5, borderRadius: '12px', bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, textTransform: 'none', fontWeight: 700 }}
            >
              Next Question →
            </Button>
          </Box>
        )}

        {feedback === 'wrong' && (
          <Box sx={{
            textAlign: 'center', mt: 3, p: 2,
            bgcolor: '#FEF3C7', borderRadius: '16px',
            animation: 'shake 0.4s ease',
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#D97706', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              ✨ Try again, you can do it!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
    </GameFullscreen>
  );
}

function MathBooster({ selectedGrade }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  const genProblem = useCallback(() => {
    let op, a, b, correct;
    if (selectedGrade === 'preschool') {
      op = '=';
      a = Math.floor(Math.random() * 5) + 2; // 2 to 6 apples
      b = 0;
      correct = a;
    } else if (selectedGrade === 'primary') {
      op = Math.random() < 0.5 ? '+' : '-';
      a = Math.floor(Math.random() * 8) + 3; // 3 to 10
      b = Math.floor(Math.random() * (a - 1)) + 1;
      correct = op === '+' ? a + b : a - b;
    } else {
      const rand = Math.random();
      if (rand < 0.33) {
        op = '×';
        a = Math.floor(Math.random() * 8) + 2;
        b = Math.floor(Math.random() * 8) + 2;
        correct = a * b;
      } else if (rand < 0.66) {
        op = '+';
        a = Math.floor(Math.random() * 30) + 10;
        b = Math.floor(Math.random() * 30) + 10;
        correct = a + b;
      } else {
        op = '-';
        a = Math.floor(Math.random() * 50) + 20;
        b = Math.floor(Math.random() * a);
        correct = a - b;
      }
    }
    const wrongs = new Set();
    const count = selectedGrade === 'preschool' ? 2 : 3;
    while (wrongs.size < count) {
      const offset = Math.floor(Math.random() * 7) - 3;
      const w = correct + (offset === 0 ? 1 : offset);
      if (w !== correct && w >= 0) wrongs.add(w);
    }
    const opts = shuffle([correct, ...wrongs]);
    return { a, b, op, correct, opts };
  }, [selectedGrade]);

  const [problem, setProblem] = useState(() => genProblem());

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

  const visualCount = (selectedGrade === 'preschool' || selectedGrade === 'primary') && (
    <Box sx={{
      bgcolor: '#ffffff', borderRadius: '16px', p: 2, mb: 3,
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.03)',
      minHeight: 60,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.85rem', mb: 0.8, fontWeight: 600 }}>
        Count and solve:
      </Typography>
      {problem.a <= 12 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', fontSize: { xs: '1.4rem', sm: '1.8rem' } }}>
          {Array.from({ length: problem.a }).map((_, idx) => (
            <span key={idx} role="img" aria-label="apple" style={{ display: 'inline-block', animation: 'bounceIn 0.3s ease', animationDelay: `${idx * 0.04}s` }}>🍎</span>
          ))}
        </Box>
      ) : (
        <Typography variant="h6" fontWeight={800} sx={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>🔢 {problem.a} apples</Typography>
      )}
    </Box>
  );

  return (
    <GameFullscreen>
    <Card sx={{
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #F0FFF0 0%, #E0F4FF 100%)',
      boxShadow: '0 12px 40px rgba(34, 197, 94, 0.15)',
      overflow: 'visible',
      position: 'relative',
      border: 'none',
      '&:hover': { transform: 'none', boxShadow: '0 12px 40px rgba(34, 197, 94, 0.15)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Math Booster
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={`Score: ${score}`}
              sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#DCFCE7', color: '#166534', borderRadius: '12px' }}
            />
            {streak >= 2 && (
              <Chip
                icon={<EmojiEventsIcon sx={{ fontSize: 14 }} />}
                label={`+${10 + (streak >= 2 ? 5 : 0)} streak!`}
                sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#FEF3C7', color: '#92400E', borderRadius: '12px' }}
              />
            )}
            <GameFullscreenButton />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 1 }}>
          {visualCount}

          <Typography variant="h3" fontWeight={800} sx={{ color: '#1F2937', mb: 3, fontSize: { xs: '2.4rem', sm: '3rem', md: '3.5rem' } }}>
            {selectedGrade === 'preschool' ? 'Total' : `${problem.a} ${problem.op === '+' ? '+' : (problem.op === '×' ? '×' : '−')} ${problem.b}`} = ?
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, maxWidth: 360, mx: 'auto' }}>
            {problem.opts.map((val, i) => {
              const isCorrect = val === problem.correct;
              let bg = '#ffffff';
              let border = 'rgba(0,0,0,0.06)';
              if (feedback === 'correct' && isCorrect) { bg = '#BBF7D0'; border = '#22C55E'; }
              if (feedback === 'wrong' && isCorrect) { bg = '#FECACA'; border = '#EF4444'; }
              return (
                <Button
                  key={i}
                  onClick={() => handleAnswer(val)}
                  disabled={locked}
                  aria-label={`Answer option ${val}`}
                  sx={{
                    width: { xs: 68, sm: 80 },
                    height: { xs: 68, sm: 80 },
                    borderRadius: '50%',
                    fontSize: { xs: '1.4rem', sm: '1.8rem' }, fontWeight: 800,
                    bgcolor: bg, color: '#1F2937',
                    border: '3px solid', borderColor: border,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    minWidth: 0,
                    p: 0,
                    '&:hover': !locked ? {
                      transform: 'scale(1.08)',
                      boxShadow: '0 8px 24px rgba(34, 197, 94, 0.2)',
                      borderColor: '#10B981',
                      bgcolor: '#ECFDF5',
                    } : {},
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
            textAlign: 'center', mt: 3, p: 2,
            bgcolor: '#DCFCE7', borderRadius: '16px',
            animation: 'bounceIn 0.4s ease',
          }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#16A34A', fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
              🎉 Correct! +{streak >= 2 ? '15' : '10'} Points
            </Typography>
            <Button
              variant="contained"
              onClick={nextRound}
              sx={{ mt: 1.5, borderRadius: '12px', bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, textTransform: 'none', fontWeight: 700 }}
            >
              Next Question →
            </Button>
          </Box>
        )}

        {feedback === 'wrong' && (
          <Box sx={{
            textAlign: 'center', mt: 3, p: 2,
            bgcolor: '#FEF3C7', borderRadius: '16px',
            animation: 'shake 0.4s ease',
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#D97706', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              ✨ Try again, you can do it!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
    </GameFullscreen>
  );
}

function SpeedTapper({ selectedGrade }) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('speed_tapper_high') || '0', 10));
  
  const gridSize = selectedGrade === 'preschool' ? 4 : selectedGrade === 'primary' ? 9 : 16;
  const [activeIdx, setActiveIdx] = useState(() => Math.floor(Math.random() * gridSize));
  const [activeEmoji, setActiveEmoji] = useState('😃');
  const gameIntervalRef = useRef(null);

  const emojisList = ['😃', '🌟', '🎈', '🍭', '🦁', '🐸', '🦄', '🧁', '🎨', '🚀'];

  const handleCellTap = (idx) => {
    if (idx === activeIdx) {
      setScore(s => {
        const next = s + 1;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem('speed_tapper_high', next.toString());
        }
        return next;
      });
      playHappyVoice(); // pops/chimes sound
      setActiveIdx(Math.floor(Math.random() * gridSize));
      setActiveEmoji(pickRandom(emojisList));
    } else {
      playSadVoice(); // error sound
      setScore(s => Math.max(0, s - 1));
    }
  };

  useEffect(() => {
    // Speed up dynamically based on current score
    const baseSpeed = selectedGrade === 'preschool' ? 1400 : selectedGrade === 'primary' ? 1000 : 700;
    const speed = Math.max(450, baseSpeed - (score * 35));
    gameIntervalRef.current = setInterval(() => {
      setActiveIdx(Math.floor(Math.random() * gridSize));
      setActiveEmoji(pickRandom(emojisList));
    }, speed);

    return () => {
      clearInterval(gameIntervalRef.current);
    };
  }, [score, selectedGrade, gridSize]);

  return (
    <GameFullscreen>
    <Card sx={{
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
      boxShadow: '0 12px 40px rgba(236, 72, 153, 0.15)',
      overflow: 'visible',
      position: 'relative',
      border: 'none',
      width: '100%',
      '&:hover': { transform: 'none', boxShadow: '0 12px 40px rgba(236, 72, 153, 0.15)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#EC4899', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Speed Tapper
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<EmojiEventsIcon />}
              label={`Score: ${score}`}
              sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#FCE7F3', color: '#BE185D', borderRadius: '12px', px: 0.5 }}
            />
            {highScore > 0 && (
              <Chip
                label={`Best: ${highScore}`}
                sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#FEF3C7', color: '#B45309', borderRadius: '12px' }}
              />
            )}
            <GameFullscreenButton />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="body1" sx={{ color: '#6B7280', mb: 4, fontWeight: 600, fontSize: '0.95rem' }}>
            Tap the emoji as fast as you can! ⚡
          </Typography>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${selectedGrade === 'preschool' ? 2 : selectedGrade === 'primary' ? 3 : 4}, 1fr)`, 
            gap: 2, 
            maxWidth: selectedGrade === 'preschool' ? 200 : selectedGrade === 'primary' ? 300 : 400, 
            mx: 'auto',
            mb: 2
          }}>
            {Array.from({ length: gridSize }).map((_, idx) => {
              const isActive = idx === activeIdx;
              return (
                <Button
                  key={idx}
                  onClick={() => handleCellTap(idx)}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: '20px',
                    bgcolor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                    border: '3px solid',
                    borderColor: isActive ? '#EC4899' : 'transparent',
                    boxShadow: isActive ? '0 8px 20px rgba(236, 72, 153, 0.2)' : 'none',
                    transition: 'all 0.1s ease',
                    '&:hover': {
                      bgcolor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                    },
                    fontSize: '2.5rem',
                    p: 0, minWidth: 0
                  }}
                >
                  {isActive ? activeEmoji : ''}
                </Button>
              );
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
    </GameFullscreen>
  );
}

function WordBuilder({ selectedGrade }) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('word_builder_high') || '0', 10));
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [locked, setLocked] = useState(false);

  const wordPool = useMemo(() => {
    return spellingWords.filter(w => w.grade === selectedGrade);
  }, [selectedGrade]);

  const [current, setCurrent] = useState(() => pickRandom(wordPool) || spellingWords[0]);
  const [scrambled, setScrambled] = useState([]);
  const [spelled, setSpelled] = useState([]); // Array of { id, letter }

  const initWord = useCallback((wordObj) => {
    setCurrent(wordObj);
    setSpelled([]);
    setFeedback(null);
    setLocked(false);

    const letters = wordObj.word.split('').map((l, index) => ({ id: index, letter: l, used: false }));
    let scrambledList = shuffle([...letters]);
    while (scrambledList.map(item => item.letter).join('') === wordObj.word && wordObj.word.length > 1) {
      scrambledList = shuffle([...letters]);
    }
    setScrambled(scrambledList);
  }, []);

  useEffect(() => {
    initWord(pickRandom(wordPool) || spellingWords[0]);
  }, [wordPool, initWord]);

  const handleLetterTap = (item) => {
    if (locked || item.used) return;

    setScrambled(prev => prev.map(x => x.id === item.id ? { ...x, used: true } : x));
    const nextSpelled = [...spelled, item];
    setSpelled(nextSpelled);

    if (nextSpelled.length === current.word.length) {
      const spelledStr = nextSpelled.map(x => x.letter).join('');
      if (spelledStr === current.word) {
        setScore(s => {
          const next = s + 1;
          if (next > highScore) {
            setHighScore(next);
            localStorage.setItem('word_builder_high', next.toString());
          }
          return next;
        });
        setFeedback('correct');
        playHappyVoice(); // success audio
        setLocked(true);
        setTimeout(() => {
          const nextWord = pickRandom(wordPool.filter(w => w.word !== current.word)) || pickRandom(wordPool);
          initWord(nextWord);
        }, 1500);
      } else {
        setFeedback('wrong');
        playSadVoice(); // error sound
        setLocked(true);
        setTimeout(() => {
          setSpelled([]);
          setScrambled(prev => prev.map(x => ({ ...x, used: false })));
          setFeedback(null);
          setLocked(false);
        }, 1200);
      }
    }
  };

  const handleRemoveSpelled = (item) => {
    if (locked) return;
    setSpelled(prev => prev.filter(x => x.id !== item.id));
    setScrambled(prev => prev.map(x => x.id === item.id ? { ...x, used: false } : x));
  };

  if (!current) return null;

  return (
    <GameFullscreen>
    <Card sx={{
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
      boxShadow: '0 12px 40px rgba(79, 70, 229, 0.15)',
      overflow: 'visible',
      position: 'relative',
      border: 'none',
      width: '100%',
      '&:hover': { transform: 'none', boxShadow: '0 12px 40px rgba(79, 70, 229, 0.15)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Word Builder
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<EmojiEventsIcon />}
              label={`Score: ${score}`}
              sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#E0E7FF', color: '#312E81', borderRadius: '12px', px: 0.5 }}
            />
            {highScore > 0 && (
              <Chip
                label={`Best: ${highScore}`}
                sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#FEF3C7', color: '#B45309', borderRadius: '12px' }}
              />
            )}
            <GameFullscreenButton />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="body1" sx={{ color: '#6B7280', mb: 3, fontWeight: 600, fontSize: '0.95rem' }}>
            Tap the letters to spell the word! ✍️
          </Typography>

          <Box sx={{
            width: { xs: 100, sm: 130 }, height: { xs: 100, sm: 130 },
            borderRadius: '50%', bgcolor: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 4,
            animation: feedback === 'correct' ? 'bounceIn 0.5s ease' : 'none'
          }}>
            <Typography sx={{ fontSize: { xs: '3.5rem', sm: '4.5rem' } }}>
              {current.emoji}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: current.word.length }).map((_, idx) => {
              const letterObj = spelled[idx];
              return (
                <Box
                  key={idx}
                  onClick={() => letterObj && handleRemoveSpelled(letterObj)}
                  sx={{
                    width: { xs: 40, sm: 50 },
                    height: { xs: 40, sm: 50 },
                    borderRadius: '12px',
                    border: '3px dashed',
                    borderColor: letterObj ? '#4F46E5' : '#C7D2FE',
                    bgcolor: letterObj ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: letterObj ? 'pointer' : 'default',
                    fontSize: { xs: '1.4rem', sm: '1.8rem' },
                    fontWeight: 900,
                    color: '#4F46E5',
                    transition: 'all 0.15s ease',
                    transform: letterObj ? 'scale(1.05)' : 'none',
                    boxShadow: letterObj ? '0 4px 10px rgba(79, 70, 229, 0.15)' : 'none',
                    '&:hover': {
                      borderColor: letterObj ? '#3730A3' : '#C7D2FE',
                      bgcolor: letterObj ? '#F3F4F6' : 'rgba(255, 255, 255, 0.4)'
                    }
                  }}
                >
                  {letterObj ? letterObj.letter : ''}
                </Box>
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
            {scrambled.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleLetterTap(item)}
                disabled={item.used || locked}
                sx={{
                  width: { xs: 48, sm: 58 },
                  height: { xs: 48, sm: 58 },
                  borderRadius: '16px',
                  bgcolor: '#FFFFFF',
                  color: '#1F2937',
                  border: '3px solid #E5E7EB',
                  fontSize: { xs: '1.3rem', sm: '1.6rem' },
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  textTransform: 'none',
                  minWidth: 0,
                  p: 0,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: '#4F46E5',
                    boxShadow: '0 6px 16px rgba(79, 70, 229, 0.15)'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(229, 231, 235, 0.5)',
                    borderColor: 'rgba(229, 231, 235, 0.5)',
                    color: 'rgba(156, 163, 175, 0.5)',
                    boxShadow: 'none'
                  }
                }}
              >
                {item.letter}
              </Button>
            ))}
          </Box>

          <Box sx={{ minHeight: 60 }}>
            {feedback === 'correct' && (
              <Typography variant="h6" fontWeight={800} sx={{ color: '#10B981', animation: 'bounceIn 0.3s ease' }}>
                🎉 Great job! Correct!
              </Typography>
            )}
            {feedback === 'wrong' && (
              <Typography variant="h6" fontWeight={800} sx={{ color: '#EF4444', animation: 'shake 0.3s ease' }}>
                ❌ Try again!
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
    </GameFullscreen>
  );
}

function MemoryMatch({ selectedGrade }) {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('memory_match_high') || '0', 10));

  const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🦄', '🐝'];

  const initGame = useCallback(() => {
    const numPairs = selectedGrade === 'preschool' ? 2 : selectedGrade === 'primary' ? 6 : 8;
    const selectedEmojis = shuffle([...emojis]).slice(0, numPairs);
    const gameEmojis = [...selectedEmojis, ...selectedEmojis];
    const shuffledCards = shuffle(gameEmojis).map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false
    }));

    setCards(shuffledCards);
    setSelected([]);
    setLocked(false);
  }, [selectedGrade]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCardClick = (idx) => {
    if (locked || cards[idx].isFlipped || cards[idx].isMatched) return;

    const updatedCards = [...cards];
    updatedCards[idx].isFlipped = true;
    setCards(updatedCards);

    const nextSelected = [...selected, idx];
    setSelected(nextSelected);

    if (nextSelected.length === 2) {
      const [firstIdx, secondIdx] = nextSelected;
      if (cards[firstIdx].emoji === cards[secondIdx].emoji) {
        updatedCards[firstIdx].isMatched = true;
        updatedCards[secondIdx].isMatched = true;
        setCards(updatedCards);
        setSelected([]);
        
        playHappyVoice(); // success sound

        if (updatedCards.every(c => c.isMatched)) {
          setScore(s => {
            const next = s + 10;
            if (next > highScore) {
              setHighScore(next);
              localStorage.setItem('memory_match_high', next.toString());
            }
            return next;
          });
        }
      } else {
        setLocked(true);
        playSadVoice(); // error sound
        setTimeout(() => {
          updatedCards[firstIdx].isFlipped = false;
          updatedCards[secondIdx].isFlipped = false;
          setCards(updatedCards);
          setSelected([]);
          setLocked(false);
        }, 1000);
      }
    }
  };

  const isWon = cards.length > 0 && cards.every(c => c.isMatched);

  return (
    <GameFullscreen>
    <Card sx={{
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #FDF4FF 0%, #F5D0FE 100%)',
      boxShadow: '0 12px 40px rgba(217, 70, 239, 0.15)',
      overflow: 'visible',
      position: 'relative',
      border: 'none',
      width: '100%',
      '&:hover': { transform: 'none', boxShadow: '0 12px 40px rgba(217, 70, 239, 0.15)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#D946EF', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Memory Match
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<EmojiEventsIcon />}
              label={`Score: ${score}`}
              sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#F5D0FE', color: '#701A75', borderRadius: '12px', px: 0.5 }}
            />
            {highScore > 0 && (
              <Chip
                label={`Best: ${highScore}`}
                sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#FEF3C7', color: '#B45309', borderRadius: '12px' }}
              />
            )}
            <GameFullscreenButton />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="body1" sx={{ color: '#6B7280', mb: 3, fontWeight: 600, fontSize: '0.95rem' }}>
            {isWon ? "🎉 Wow! You matched all pairs!" : "Flip two cards to find matching emojis! 🧠"}
          </Typography>

          {isWon ? (
            <Box sx={{ py: 3 }}>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#A21CAF', mb: 3, fontSize: { xs: '1.8rem', sm: '2.2rem' } }}>
                Fantastic Memory! 🏆
              </Typography>
              <Button
                variant="contained"
                onClick={initGame}
                sx={{
                  borderRadius: '16px', bgcolor: '#D946EF', '&:hover': { bgcolor: '#C084FC' },
                  px: 5, py: 1.8, fontSize: '1.2rem', fontWeight: 800, textTransform: 'none',
                  boxShadow: '0 8px 24px rgba(217, 70, 239, 0.4)'
                }}
              >
                Play Again! 🔄
              </Button>
            </Box>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${selectedGrade === 'preschool' ? 2 : 4}, 1fr)`,
              gap: 2,
              maxWidth: selectedGrade === 'preschool' ? 180 : 360,
              mx: 'auto',
              mb: 2
            }}>
              {cards.map((card, idx) => {
                const showFace = card.isFlipped || card.isMatched;
                return (
                  <Button
                    key={card.id}
                    onClick={() => handleCardClick(idx)}
                    sx={{
                      aspectRatio: '1',
                      borderRadius: '16px',
                      bgcolor: showFace ? '#FFFFFF' : '#D946EF',
                      color: showFace ? '#1F2937' : '#FFFFFF',
                      border: '3px solid',
                      borderColor: showFace ? '#F5D0FE' : 'transparent',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      transition: 'all 0.2s',
                      fontSize: showFace ? { xs: '1.8rem', sm: '2.3rem' } : { xs: '1.5rem', sm: '1.8rem' },
                      fontWeight: 800,
                      p: 0, minWidth: 0,
                      '&:hover': {
                        bgcolor: showFace ? '#FFFFFF' : '#C026D3',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    {showFace ? card.emoji : '❓'}
                  </Button>
                );
              })}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
    </GameFullscreen>
  );
}

function OddOneOut({ selectedGrade }) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('odd_one_out_high') || '0', 10));
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [locked, setLocked] = useState(false);

  const puzzles = useMemo(() => {
    return oddOutPuzzles.filter(p => p.category === selectedGrade);
  }, [selectedGrade]);

  const [current, setCurrent] = useState(() => pickRandom(puzzles) || oddOutPuzzles[0]);
  const [items, setItems] = useState([]);

  const initRound = useCallback((puzzle) => {
    setCurrent(puzzle);
    setFeedback(null);
    setLocked(false);

    const size = selectedGrade === 'preschool' ? 4 : selectedGrade === 'primary' ? 6 : 9;
    const oddIdx = Math.floor(Math.random() * size);
    const list = Array.from({ length: size }).map((_, idx) => ({
      id: idx,
      emoji: idx === oddIdx ? puzzle.odd : puzzle.common,
      isOdd: idx === oddIdx
    }));
    setItems(list);
  }, [selectedGrade]);

  useEffect(() => {
    initRound(pickRandom(puzzles) || oddOutPuzzles[0]);
  }, [puzzles, initRound]);

  const handleCellClick = (item) => {
    if (locked) return;
    if (item.isOdd) {
      setScore(s => {
        const next = s + 1;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem('odd_one_out_high', next.toString());
        }
        return next;
      });
      setFeedback('correct');
      playHappyVoice();
      setLocked(true);
      setTimeout(() => {
        const nextPuzzle = pickRandom(puzzles.filter(p => p.odd !== current.odd)) || pickRandom(puzzles);
        initRound(nextPuzzle);
      }, 1200);
    } else {
      setFeedback('wrong');
      playSadVoice();
      setLocked(true);
      setTimeout(() => {
        setFeedback(null);
        setLocked(false);
      }, 1000);
    }
  };

  if (!current || items.length === 0) return null;

  return (
    <GameFullscreen>
    <Card sx={{
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
      boxShadow: '0 12px 40px rgba(2, 132, 199, 0.15)',
      overflow: 'visible',
      position: 'relative',
      border: 'none',
      width: '100%',
      '&:hover': { transform: 'none', boxShadow: '0 12px 40px rgba(2, 132, 199, 0.15)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#0284C7', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Odd One Out
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<EmojiEventsIcon />}
              label={`Score: ${score}`}
              sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#E0F2FE', color: '#0369A1', borderRadius: '12px', px: 0.5 }}
            />
            {highScore > 0 && (
              <Chip
                label={`Best: ${highScore}`}
                sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#FEF3C7', color: '#B45309', borderRadius: '12px' }}
              />
            )}
            <GameFullscreenButton />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="body1" sx={{ color: '#6B7280', mb: 4, fontWeight: 600, fontSize: '0.95rem' }}>
            Find the emoji that is different from the others! 🔍
          </Typography>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${selectedGrade === 'preschool' ? 2 : 3}, 1fr)`,
            gap: 2.5,
            maxWidth: selectedGrade === 'preschool' ? 200 : 300,
            mx: 'auto',
            mb: 3
          }}>
            {items.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleCellClick(item)}
                disabled={locked}
                sx={{
                  aspectRatio: '1',
                  borderRadius: '20px',
                  bgcolor: '#FFFFFF',
                  border: '3px solid #E0F2FE',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  fontSize: { xs: '2.5rem', sm: '3rem' },
                  p: 0, minWidth: 0,
                  transition: 'all 0.15s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: '#0284C7',
                    boxShadow: '0 6px 16px rgba(2, 132, 199, 0.15)'
                  }
                }}
              >
                {item.emoji}
              </Button>
            ))}
          </Box>

          <Box sx={{ minHeight: 60 }}>
            {feedback === 'correct' && (
              <Typography variant="h6" fontWeight={800} sx={{ color: '#10B981', animation: 'bounceIn 0.3s ease' }}>
                🎉 Spot on! You found it!
              </Typography>
            )}
            {feedback === 'wrong' && (
              <Typography variant="h6" fontWeight={800} sx={{ color: '#EF4444', animation: 'shake 0.3s ease' }}>
                ❌ Look closer!
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
    </GameFullscreen>
  );
}

function LetterSearch({ selectedGrade }) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('letter_search_high') || '0', 10));
  const [target, setTarget] = useState('');
  const [grid, setGrid] = useState([]);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [locked, setLocked] = useState(false);

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'.split('');

  const initRound = useCallback(() => {
    setFeedback(null);
    setLocked(false);

    let size = 9;
    let targetChar = '';
    let pool = [];

    if (selectedGrade === 'preschool') {
      size = 4;
      targetChar = pickRandom(uppercase);
      const otherLetters = uppercase.filter(l => l !== targetChar);
      pool = shuffle(otherLetters).slice(0, 3);
    } else if (selectedGrade === 'primary') {
      size = 9;
      const useSimilar = Math.random() > 0.4;
      if (useSimilar) {
        const groups = [
          ['b', 'd', 'p', 'q', 'g', 'h'],
          ['m', 'n', 'u', 'w', 'v'],
          ['o', 'c', 'e', 'a', 'd'],
          ['t', 'f', 'l', 'i', 'j']
        ];
        const group = pickRandom(groups);
        targetChar = pickRandom(group);
        const distractors = group.filter(x => x !== targetChar);
        pool = shuffle(distractors).slice(0, 8);
        while (pool.length < 8) {
          const rand = pickRandom(lowercase);
          if (rand !== targetChar && !pool.includes(rand)) {
            pool.push(rand);
          }
        }
      } else {
        targetChar = pickRandom(lowercase);
        const distractors = lowercase.filter(x => x !== targetChar);
        pool = shuffle(distractors).slice(0, 8);
      }
    } else {
      size = 16;
      const hardGroups = [
        { target: 'E', distractors: ['F'] },
        { target: 'O', distractors: ['Q'] },
        { target: 'I', distractors: ['l', '1'] },
        { target: 'V', distractors: ['U', 'W'] },
        { target: 'C', distractors: ['G'] },
        { target: 'K', distractors: ['X', 'Y'] },
        { target: 'Z', distractors: ['2'] }
      ];
      const selectedGroup = pickRandom(hardGroups);
      targetChar = selectedGroup.target;
      pool = Array.from({ length: 15 }).map(() => pickRandom(selectedGroup.distractors));
    }

    const itemsList = shuffle([...pool, targetChar]).map((letter, idx) => ({
      id: idx,
      letter,
      isTarget: letter === targetChar
    }));

    setTarget(targetChar);
    setGrid(itemsList);
  }, [selectedGrade]);

  useEffect(() => {
    initRound();
  }, [initRound]);

  const handleCellClick = (item) => {
    if (locked) return;
    if (item.isTarget) {
      setScore(s => {
        const next = s + 1;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem('letter_search_high', next.toString());
        }
        return next;
      });
      setFeedback('correct');
      playHappyVoice();
      setLocked(true);
      setTimeout(() => {
        initRound();
      }, 1200);
    } else {
      setFeedback('wrong');
      playSadVoice();
      setLocked(true);
      setTimeout(() => {
        setFeedback(null);
        setLocked(false);
      }, 1000);
    }
  };

  if (!target || grid.length === 0) return null;

  return (
    <GameFullscreen>
    <Card sx={{
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #F7FEE7 0%, #ECFCCB 100%)',
      boxShadow: '0 12px 40px rgba(132, 204, 22, 0.15)',
      overflow: 'visible',
      position: 'relative',
      border: 'none',
      width: '100%',
      '&:hover': { transform: 'none', boxShadow: '0 12px 40px rgba(132, 204, 22, 0.15)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#65A30D', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Letter Search
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<EmojiEventsIcon />}
              label={`Score: ${score}`}
              sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#ECFCCB', color: '#3F6212', borderRadius: '12px', px: 0.5 }}
            />
            {highScore > 0 && (
              <Chip
                label={`Best: ${highScore}`}
                sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#FEF3C7', color: '#B45309', borderRadius: '12px' }}
              />
            )}
            <GameFullscreenButton />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="h4" fontWeight={900} sx={{ color: '#3F6212', mb: 3, fontSize: { xs: '1.6rem', sm: '2rem' } }}>
            Find the letter: <span style={{ textDecoration: 'underline', color: '#65A30D' }}>{target}</span>
          </Typography>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${selectedGrade === 'preschool' ? 2 : selectedGrade === 'primary' ? 3 : 4}, 1fr)`,
            gap: 2,
            maxWidth: selectedGrade === 'preschool' ? 180 : selectedGrade === 'primary' ? 270 : 360,
            mx: 'auto',
            mb: 3
          }}>
            {grid.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleCellClick(item)}
                disabled={locked}
                sx={{
                  aspectRatio: '1',
                  borderRadius: '20px',
                  bgcolor: '#FFFFFF',
                  border: '3px solid #ECFCCB',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  fontSize: { xs: '1.8rem', sm: '2.4rem' },
                  fontWeight: 900,
                  color: '#3F6212',
                  p: 0, minWidth: 0,
                  transition: 'all 0.15s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: '#84CC16',
                    boxShadow: '0 6px 16px rgba(132, 204, 22, 0.15)'
                  }
                }}
              >
                {item.letter}
              </Button>
            ))}
          </Box>

          <Box sx={{ minHeight: 60 }}>
            {feedback === 'correct' && (
              <Typography variant="h6" fontWeight={800} sx={{ color: '#10B981', animation: 'bounceIn 0.3s ease' }}>
                🎉 Awesome! Correct!
              </Typography>
            )}
            {feedback === 'wrong' && (
              <Typography variant="h6" fontWeight={800} sx={{ color: '#EF4444', animation: 'shake 0.3s ease' }}>
                ❌ Look closely! Try again.
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
    </GameFullscreen>
  );
}

function VarnamalaBoard() {
  const [lang, setLang] = useState('english'); // 'english' | 'hindi'
  const [mode, setMode] = useState('learn'); // 'learn' | 'game'
  const [selected, setSelected] = useState(null);
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('varnamala_high') || '0', 10));
  const [target, setTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  const activeAlphabet = lang === 'english' ? englishAlphabet : hindiAlphabet;

  useEffect(() => {
    setSelected(activeAlphabet[0]);
  }, [lang, activeAlphabet]);

  const initGameTarget = useCallback(() => {
    const list = lang === 'english' ? englishAlphabet : hindiAlphabet;
    const targetObj = pickRandom(list);
    setTarget(targetObj);
    setFeedback(null);
    setLocked(false);
  }, [lang]);

  useEffect(() => {
    if (mode === 'game') {
      initGameTarget();
    }
  }, [mode, initGameTarget]);

  const handleLetterClick = (item) => {
    if (mode === 'learn') {
      setSelected(item);
      playHappyVoice();
    } else {
      if (locked) return;
      if (item.letter === target.letter) {
        setScore(s => {
          const next = s + 1;
          if (next > highScore) {
            setHighScore(next);
            localStorage.setItem('varnamala_high', next.toString());
          }
          return next;
        });
        setFeedback('correct');
        playSuccess();
        setLocked(true);
        setTimeout(() => {
          initGameTarget();
        }, 1200);
      } else {
        setFeedback('wrong');
        playSadVoice();
        setLocked(true);
        setTimeout(() => {
          setFeedback(null);
          setLocked(false);
        }, 1000);
      }
    }
  };

  return (
    <GameFullscreen>
    <Card sx={{
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      boxShadow: '0 12px 40px rgba(245, 158, 11, 0.15)',
      overflow: 'visible',
      position: 'relative',
      border: 'none',
      width: '100%',
      '&:hover': { transform: 'none', boxShadow: '0 12px 40px rgba(245, 158, 11, 0.15)' }
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Language Board
          </Typography>
          <GameFullscreenButton />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant={lang === 'english' ? 'contained' : 'outlined'}
              onClick={() => setLang('english')}
              sx={{ borderRadius: 6, textTransform: 'none', fontWeight: 700, px: 2, bgcolor: lang === 'english' ? '#D97706' : 'transparent', color: lang === 'english' ? '#fff' : '#D97706', borderColor: '#D97706', '&:hover': { bgcolor: lang === 'english' ? '#B45309' : 'rgba(217, 119, 6, 0.08)' } }}
            >
              English (A-Z)
            </Button>
            <Button
              variant={lang === 'hindi' ? 'contained' : 'outlined'}
              onClick={() => setLang('hindi')}
              sx={{ borderRadius: 6, textTransform: 'none', fontWeight: 700, px: 2, bgcolor: lang === 'hindi' ? '#D97706' : 'transparent', color: lang === 'hindi' ? '#fff' : '#D97706', borderColor: '#D97706', '&:hover': { bgcolor: lang === 'hindi' ? '#B45309' : 'rgba(217, 119, 6, 0.08)' } }}
            >
              Hindi (अ-ज्ञ)
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant={mode === 'learn' ? 'contained' : 'outlined'}
              onClick={() => setMode('learn')}
              sx={{ borderRadius: 6, textTransform: 'none', fontWeight: 700, px: 2, bgcolor: mode === 'learn' ? '#059669' : 'transparent', color: mode === 'learn' ? '#fff' : '#059669', borderColor: '#059669', '&:hover': { bgcolor: mode === 'learn' ? '#047857' : 'rgba(5, 150, 105, 0.08)' } }}
            >
              Learning Mode 📖
            </Button>
            <Button
              variant={mode === 'game' ? 'contained' : 'outlined'}
              onClick={() => setMode('game')}
              sx={{ borderRadius: 6, textTransform: 'none', fontWeight: 700, px: 2, bgcolor: mode === 'game' ? '#059669' : 'transparent', color: mode === 'game' ? '#fff' : '#059669', borderColor: '#059669', '&:hover': { bgcolor: mode === 'game' ? '#047857' : 'rgba(5, 150, 105, 0.08)' } }}
            >
              Find Game 🎮
            </Button>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 1 }}>
          {mode === 'learn' && selected && (
            <Box sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              bgcolor: '#FFFFFF', borderRadius: '20px', p: 3, mb: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: { xs: '4.5rem', sm: '6rem' }, fontWeight: 900, color: '#D97706' }}>
                  {selected.letter}
                </Typography>
                <Typography sx={{ fontSize: { xs: '4.5rem', sm: '6.5rem' } }}>
                  {selected.emoji}
                </Typography>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h5" fontWeight={850} sx={{ color: '#1F2937' }}>
                    {selected.word}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#6B7280', mt: 0.5 }}>
                    {selected.description}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {mode === 'game' && target && (
            <Box sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              bgcolor: '#FFFFFF', borderRadius: '20px', p: 3, mb: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<EmojiEventsIcon />}
                  label={`Score: ${score}`}
                  sx={{ fontWeight: 700, fontSize: '0.95rem', bgcolor: '#FEF3C7', color: '#B45309' }}
                />
                {highScore > 0 && (
                  <Chip
                    label={`Best: ${highScore}`}
                    sx={{ fontWeight: 700, fontSize: '0.95rem', bgcolor: '#E0F2FE', color: '#0369A1' }}
                  />
                )}
              </Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#374151', my: 2, fontSize: { xs: '1.6rem', sm: '2.2rem' } }}>
                Find the letter: <span style={{ color: '#D97706', textDecoration: 'underline' }}>{target.letter}</span> ({target.word} {target.emoji})
              </Typography>
              <Box sx={{ minHeight: 40 }}>
                {feedback === 'correct' && (
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#10B981', animation: 'bounceIn 0.3s ease' }}>
                    🎉 Wow! Correct!
                  </Typography>
                )}
                {feedback === 'wrong' && (
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#EF4444', animation: 'shake 0.3s ease' }}>
                    ❌ Look closer! Try again.
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          <Typography variant="body2" sx={{ color: '#78350F', fontWeight: 700, mb: 2, textAlign: 'left' }}>
            {mode === 'learn' ? "Tap any letter to study 📖" : "Tap the correct letter bubble 🎯"}
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(5, 1fr)',
              sm: 'repeat(7, 1fr)',
              md: 'repeat(9, 1fr)',
              lg: 'repeat(10, 1fr)'
            },
            gap: 1.5,
            mx: 'auto'
          }}>
            {activeAlphabet.map((item) => {
              const isCurrentSelected = mode === 'learn' && selected?.letter === item.letter;
              return (
                <Button
                  key={item.letter}
                  onClick={() => handleLetterClick(item)}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: '50%',
                    bgcolor: isCurrentSelected ? '#D97706' : '#FFFFFF',
                    color: isCurrentSelected ? '#FFFFFF' : '#B45309',
                    border: '3px solid',
                    borderColor: isCurrentSelected ? '#B45309' : '#FDE68A',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                    fontSize: { xs: '1.25rem', sm: '1.6rem' },
                    fontWeight: 900,
                    p: 0, minWidth: 0,
                    transition: 'all 0.15s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      bgcolor: isCurrentSelected ? '#D97706' : '#FEF3C7',
                      borderColor: '#D97706'
                    }
                  }}
                >
                  {item.letter}
                </Button>
              );
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
    </GameFullscreen>
  );
}

function NumberSequence({ selectedGrade }) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('num_sequence_high') || '0', 10));
  const [sequence, setSequence] = useState([]); // Array of numbers or null for blank
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [locked, setLocked] = useState(false);

  const initRound = useCallback(() => {
    setFeedback(null);
    setLocked(false);

    let start = 1;
    let step = 1;
    let length = 4;
    let blankIdx = 2; // Default to index 2

    if (selectedGrade === 'preschool') {
      start = Math.floor(Math.random() * 6) + 1; // 1 to 6
      step = 1;
      length = 4;
      blankIdx = Math.floor(Math.random() * 2) + 1; // index 1 or 2
    } else if (selectedGrade === 'primary') {
      start = Math.floor(Math.random() * 20) + 1; // 1 to 20
      step = pickRandom([1, 2, 5]);
      length = 4;
      blankIdx = Math.floor(Math.random() * 3) + 1; // index 1, 2 or 3
    } else {
      start = Math.floor(Math.random() * 50) + 10; // 10 to 60
      step = pickRandom([3, 5, 10, -2, -5]);
      length = 5;
      blankIdx = Math.floor(Math.random() * 3) + 1; // index 1, 2 or 3
    }

    const rawList = Array.from({ length }).map((_, idx) => start + idx * step);
    const correct = rawList[blankIdx];
    setCorrectAnswer(correct);

    const seqWithBlank = rawList.map((val, idx) => idx === blankIdx ? null : val);
    setSequence(seqWithBlank);

    const pool = new Set([correct]);
    while (pool.size < 3) {
      const offset = pickRandom([-1, 1, -step, step, 2, -2]);
      const potentialOption = correct + offset;
      if (potentialOption > 0) {
        pool.add(potentialOption);
      }
    }
    setOptions(shuffle(Array.from(pool)));
  }, [selectedGrade]);

  useEffect(() => {
    initRound();
  }, [initRound]);

  const handleOptionClick = (val) => {
    if (locked) return;
    if (val === correctAnswer) {
      setScore(s => {
        const next = s + 1;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem('num_sequence_high', next.toString());
        }
        return next;
      });
      setFeedback('correct');
      playSuccess();
      setLocked(true);
      setTimeout(() => {
        initRound();
      }, 1200);
    } else {
      setFeedback('wrong');
      playSadVoice();
      setLocked(true);
      setTimeout(() => {
        setFeedback(null);
        setLocked(false);
      }, 1000);
    }
  };

  if (sequence.length === 0) return null;

  return (
    <GameFullscreen>
    <Card sx={{
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
      boxShadow: '0 12px 40px rgba(244, 63, 94, 0.15)',
      overflow: 'visible',
      position: 'relative',
      border: 'none',
      width: '100%',
      '&:hover': { transform: 'none', boxShadow: '0 12px 40px rgba(244, 63, 94, 0.15)' }
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#E11D48', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Number Line
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<EmojiEventsIcon />}
              label={`Score: ${score}`}
              sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#FFE4E6', color: '#9F1239', borderRadius: '12px', px: 0.5 }}
            />
            {highScore > 0 && (
              <Chip
                label={`Best: ${highScore}`}
                sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', sm: '0.95rem' }, bgcolor: '#FEF3C7', color: '#B45309', borderRadius: '12px' }}
              />
            )}
            <GameFullscreenButton />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="body1" sx={{ color: '#6B7280', mb: 4, fontWeight: 600, fontSize: '0.95rem' }}>
            Find the missing number to complete the line! 🔢
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4, flexWrap: 'wrap' }}>
            {sequence.map((num, idx) => (
              <Box
                key={idx}
                sx={{
                  width: { xs: 52, sm: 66 },
                  height: { xs: 52, sm: 66 },
                  borderRadius: '50%',
                  border: '4px solid',
                  borderColor: num === null ? '#E11D48' : '#FDA4AF',
                  bgcolor: num === null ? 'rgba(253, 164, 175, 0.2)' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: { xs: '1.4rem', sm: '1.8rem' },
                  fontWeight: 900,
                  color: num === null ? '#E11D48' : '#9F1239',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                  animation: num === null ? 'pulse 1.5s infinite' : 'none'
                }}
              >
                {num === null ? '?' : num}
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
            {options.map((val) => (
              <Button
                key={val}
                onClick={() => handleOptionClick(val)}
                disabled={locked}
                sx={{
                  width: { xs: 58, sm: 70 },
                  height: { xs: 58, sm: 70 },
                  borderRadius: '20px',
                  bgcolor: '#FFFFFF',
                  color: '#9F1239',
                  border: '3px solid #FDA4AF',
                  fontSize: { xs: '1.4rem', sm: '1.8rem' },
                  fontWeight: 900,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  minWidth: 0,
                  p: 0,
                  transition: 'all 0.15s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: '#E11D48',
                    boxShadow: '0 6px 16px rgba(225, 29, 72, 0.15)'
                  }
                }}
              >
                {val}
              </Button>
            ))}
          </Box>

          <Box sx={{ minHeight: 60 }}>
            {feedback === 'correct' && (
              <Typography variant="h6" fontWeight={800} sx={{ color: '#10B981', animation: 'bounceIn 0.3s ease' }}>
                🎉 Great job! Correct!
              </Typography>
            )}
            {feedback === 'wrong' && (
              <Typography variant="h6" fontWeight={800} sx={{ color: '#EF4444', animation: 'shake 0.3s ease' }}>
                ❌ Think again!
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
    </GameFullscreen>
  );
}

function PictureBoard() {
  const [category, setCategory] = useState('animals'); // 'animals' | 'fruits' | 'vehicles' | 'birds'
  const [mode, setMode] = useState('learn'); // 'learn' | 'game'
  const [selected, setSelected] = useState(null);
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('pic_board_high') || '0', 10));
  const [target, setTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  const activeList = pictureBoardData[category];

  useEffect(() => {
    setSelected(activeList[0]);
  }, [category, activeList]);

  const initGameTarget = useCallback(() => {
    const list = pictureBoardData[category];
    const targetObj = pickRandom(list);
    setTarget(targetObj);
    setFeedback(null);
    setLocked(false);
  }, [category]);

  useEffect(() => {
    if (mode === 'game') {
      initGameTarget();
    }
  }, [mode, initGameTarget]);

  const handleItemClick = (item) => {
    if (mode === 'learn') {
      setSelected(item);
      playHappyVoice();
    } else {
      if (locked) return;
      if (item.nameEn === target.nameEn) {
        setScore(s => {
          const next = s + 1;
          if (next > highScore) {
            setHighScore(next);
            localStorage.setItem('pic_board_high', next.toString());
          }
          return next;
        });
        setFeedback('correct');
        playSuccess();
        setLocked(true);
        setTimeout(() => {
          initGameTarget();
        }, 1200);
      } else {
        setFeedback('wrong');
        playSadVoice();
        setLocked(true);
        setTimeout(() => {
          setFeedback(null);
          setLocked(false);
        }, 1000);
      }
    }
  };

  return (
    <GameFullscreen>
    <Card sx={{
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)',
      boxShadow: '0 12px 40px rgba(6, 182, 212, 0.15)',
      overflow: 'visible',
      position: 'relative',
      border: 'none',
      width: '100%',
      '&:hover': { transform: 'none', boxShadow: '0 12px 40px rgba(6, 182, 212, 0.15)' }
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#0891B2', display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            <StarsIcon sx={{ color: '#FBBF24' }} /> Picture Board
          </Typography>
          <GameFullscreenButton />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['animals', 'fruits', 'vehicles', 'birds'].map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? 'contained' : 'outlined'}
                onClick={() => setCategory(cat)}
                sx={{
                  borderRadius: 6, textTransform: 'capitalize', fontWeight: 700, px: 1.5,
                  bgcolor: category === cat ? '#0891B2' : 'transparent',
                  color: category === cat ? '#fff' : '#0891B2',
                  borderColor: '#0891B2',
                  '&:hover': { bgcolor: category === cat ? '#0e7490' : 'rgba(6, 182, 212, 0.08)' }
                }}
              >
                {cat === 'animals' ? '🦁 Animals' : cat === 'fruits' ? '🍎 Fruits' : cat === 'vehicles' ? '🚗 Vehicles' : '🦚 Birds'}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant={mode === 'learn' ? 'contained' : 'outlined'}
              onClick={() => setMode('learn')}
              sx={{ borderRadius: 6, textTransform: 'none', fontWeight: 700, px: 2, bgcolor: mode === 'learn' ? '#059669' : 'transparent', color: mode === 'learn' ? '#fff' : '#059669', borderColor: '#059669', '&:hover': { bgcolor: mode === 'learn' ? '#047857' : 'rgba(5, 150, 105, 0.08)' } }}
            >
              Study 📖
            </Button>
            <Button
              variant={mode === 'game' ? 'contained' : 'outlined'}
              onClick={() => setMode('game')}
              sx={{ borderRadius: 6, textTransform: 'none', fontWeight: 700, px: 2, bgcolor: mode === 'game' ? '#059669' : 'transparent', color: mode === 'game' ? '#fff' : '#059669', borderColor: '#059669', '&:hover': { bgcolor: mode === 'game' ? '#047857' : 'rgba(5, 150, 105, 0.08)' } }}
            >
              Quiz 🎮
            </Button>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', py: 1 }}>
          {mode === 'learn' && selected && (
            <Box sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              bgcolor: '#FFFFFF', borderRadius: '20px', p: 3, mb: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: { xs: '5.5rem', sm: '7rem' } }}>
                  {selected.emoji}
                </Typography>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h4" fontWeight={900} sx={{ color: '#0891B2' }}>
                    {selected.nameEn}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#0891B2', mt: 0.5 }}>
                    {selected.nameHi}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {mode === 'game' && target && (
            <Box sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              bgcolor: '#FFFFFF', borderRadius: '20px', p: 3, mb: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<EmojiEventsIcon />}
                  label={`Score: ${score}`}
                  sx={{ fontWeight: 700, fontSize: '0.95rem', bgcolor: '#CFFAFE', color: '#0891B2' }}
                />
                {highScore > 0 && (
                  <Chip
                    label={`Best: ${highScore}`}
                    sx={{ fontWeight: 700, fontSize: '0.95rem', bgcolor: '#FEF3C7', color: '#B45309' }}
                  />
                )}
              </Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#374151', my: 2, fontSize: { xs: '1.6rem', sm: '2.2rem' } }}>
                Find: <span style={{ color: '#0891B2', textDecoration: 'underline' }}>{target.nameHi} / {target.nameEn}</span>
              </Typography>
              <Box sx={{ minHeight: 40 }}>
                {feedback === 'correct' && (
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#10B981', animation: 'bounceIn 0.3s ease' }}>
                    🎉 Correct! Superb!
                  </Typography>
                )}
                {feedback === 'wrong' && (
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#EF4444', animation: 'shake 0.3s ease' }}>
                    ❌ Keep trying!
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          <Typography variant="body2" sx={{ color: '#0891B2', fontWeight: 700, mb: 2, textAlign: 'left' }}>
            {mode === 'learn' ? "Tap any item to study 📖" : "Tap the correct item bubble 🎯"}
          </Typography>
          
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(4, 1fr)',
              sm: 'repeat(6, 1fr)',
              md: 'repeat(8, 1fr)',
              lg: 'repeat(12, 1fr)'
            },
            gap: 1.8,
            mx: 'auto'
          }}>
            {activeList.map((item) => {
              const isCurrentSelected = mode === 'learn' && selected?.nameEn === item.nameEn;
              return (
                <Button
                  key={item.nameEn}
                  onClick={() => handleItemClick(item)}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: '24px',
                    bgcolor: isCurrentSelected ? '#0891B2' : '#FFFFFF',
                    border: '3px solid',
                    borderColor: isCurrentSelected ? '#0e7490' : '#CFFAFE',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    fontSize: { xs: '2.2rem', sm: '2.8rem' },
                    p: 0, minWidth: 0,
                    transition: 'all 0.15s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      bgcolor: isCurrentSelected ? '#0891B2' : '#ECFEFF',
                      borderColor: '#0891B2'
                    }
                  }}
                >
                  {item.emoji}
                </Button>
              );
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
    </GameFullscreen>
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
      size="small"
    >
      Reset
    </Button>
  );
}

const FullscreenCtx = createContext(null);

function GameFullscreen({ children }) {
  const [active, setActive] = useState(false);

  const open = useCallback(() => {
    setActive(true);
    document.body.style.overflow = 'hidden';
    try { document.documentElement.requestFullscreen?.(); } catch {}
  }, []);

  const close = useCallback(() => {
    setActive(false);
    document.body.style.overflow = '';
    try { document.exitFullscreen?.(); } catch {}
  }, []);

  useEffect(() => {
    const h = () => { if (!document.fullscreenElement) { setActive(false); document.body.style.overflow = ''; } };
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  if (active) {
    return (
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: 999999,
        background: 'linear-gradient(135deg, #F0F9FF 0%, #FFF0F5 50%, #FEF3C7 100%)',
        overflow: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 10, px: { xs: 1.5, sm: 3 }, py: 0.8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <Typography variant="subtitle2" sx={{ color: '#6B7280', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
            <FullscreenIcon sx={{ fontSize: { xs: 16, sm: 18 } }} /> Full Screen
          </Typography>
          <Button
            onClick={close}
            size="small"
            startIcon={<CloseFullscreenIcon />}
            sx={{ borderRadius: 6, color: '#4B5563', bgcolor: '#F3F4F6', '&:hover': { bgcolor: '#E5E7EB' }, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}
          >
            Exit
          </Button>
        </Box>
        <Box sx={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          px: { xs: 1.5, sm: 3, md: 4 }, py: { xs: 1.5, sm: 3, md: 3 },
          minHeight: { xs: 'calc(100vh - 48px)', sm: 'calc(100vh - 56px)' },
        }}>
          <Box sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: 480, md: 580, lg: 620 },
            mx: 'auto',
          }}>
            {children}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <FullscreenCtx.Provider value={{ open, close }}>
      {children}
    </FullscreenCtx.Provider>
  );
}

function GameFullscreenButton() {
  const ctx = useContext(FullscreenCtx);
  if (!ctx) return null;
  return (
    <IconButton
      onClick={ctx.open}
      aria-label="Play in full screen"
      size="small"
      sx={{
        color: '#8B5CF6', bgcolor: 'rgba(139, 92, 246, 0.08)',
        borderRadius: 2, p: 0.5,
        '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.2)', transform: 'scale(1.1)' },
        transition: 'all 0.2s ease',
      }}
    >
      <FullscreenIcon sx={{ fontSize: 20 }} />
    </IconButton>
  );
}

const seoSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Kids Educational Game Zone',
  operatingSystem: 'All',
  applicationCategory: 'EducationalGame',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  audience: {
    '@type': 'Audience',
    audienceType: 'Kindergarten children, Toddlers, Parents'
  },
  author: { '@type': 'Organization', name: 'Digital Home' },
};

const gameTabs = [
  { id: 'alphabet', label: 'Alphabet Quiz', emoji: '🔤', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #FFF0F5 0%, #E6E6FA 100%)', hoverBg: 'rgba(139, 92, 246, 0.08)' },
  { id: 'math', label: 'Math Booster', emoji: '➕', color: '#059669', gradient: 'linear-gradient(135deg, #F0FFF0 0%, #E0F4FF 100%)', hoverBg: 'rgba(5, 150, 105, 0.08)' },
  { id: 'shadow', label: 'Shadow & Sound', emoji: '👀', color: '#D97706', gradient: 'linear-gradient(135deg, #FEF9C3 0%, #FED7AA 100%)', hoverBg: 'rgba(217, 119, 6, 0.08)' },
  { id: 'speed', label: 'Speed Tapper', emoji: '⚡', color: '#EC4899', gradient: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)', hoverBg: 'rgba(236, 72, 153, 0.08)' },
  { id: 'spelling', label: 'Word Builder', emoji: '✍️', color: '#4F46E5', gradient: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', hoverBg: 'rgba(79, 70, 229, 0.08)' },
  { id: 'memory', label: 'Memory Match', emoji: '🧠', color: '#D946EF', gradient: 'linear-gradient(135deg, #FDF4FF 0%, #F5D0FE 100%)', hoverBg: 'rgba(217, 70, 239, 0.08)' },
  { id: 'oddout', label: 'Odd One Out', emoji: '🔍', color: '#0284C7', gradient: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', hoverBg: 'rgba(2, 132, 199, 0.08)' },
  { id: 'findletter', label: 'Letter Search', emoji: '🅰️', color: '#84CC16', gradient: 'linear-gradient(135deg, #F7FEE7 0%, #ECFCCB 100%)', hoverBg: 'rgba(132, 204, 22, 0.08)' },
  { id: 'varnamala', label: 'Language Board', emoji: '🏫', color: '#D97706', gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', hoverBg: 'rgba(217, 119, 6, 0.08)' },
  { id: 'sequence', label: 'Number Line', emoji: '🔢', color: '#F43F5E', gradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)', hoverBg: 'rgba(244, 63, 94, 0.08)' },
  { id: 'picboard', label: 'Picture Board', emoji: '🧸', color: '#06B6D4', gradient: 'linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)', hoverBg: 'rgba(6, 182, 212, 0.08)' },
];

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState('alphabet');
  const [alphabetKey, setAlphabetKey] = useState(0);
  const [mathKey, setMathKey] = useState(0);
  const [shadowKey, setShadowKey] = useState(0);
  const [speedKey, setSpeedKey] = useState(0);
  const [spellingKey, setSpellingKey] = useState(0);
  const [memoryKey, setMemoryKey] = useState(0);
  const [oddoutKey, setOddoutKey] = useState(0);
  const [findletterKey, setFindletterKey] = useState(0);
  const [varnamalaKey, setVarnamalaKey] = useState(0);
  const [sequenceKey, setSequenceKey] = useState(0);
  const [picboardKey, setPicboardKey] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState(() => localStorage.getItem('kids_grade') || 'primary');

  useEffect(() => {
    localStorage.setItem('kids_grade', selectedGrade);
  }, [selectedGrade]);

  const grades = [
    { id: 'preschool', label: 'Preschool (LKG/UKG) 🧸', color: '#10B981', hoverBg: 'rgba(16, 185, 129, 0.08)' },
    { id: 'primary', label: 'Class 1 & 2 🎒', color: '#3B82F6', hoverBg: 'rgba(59, 130, 246, 0.08)' },
    { id: 'upper', label: 'Class 3 to 5 🎓', color: '#8B5CF6', hoverBg: 'rgba(139, 92, 246, 0.08)' }
  ];

  return (
    <Layout>
      <Seo
        title="Free Interactive Educational Games for Kids & Kindergarten | Digital Home"
        description="Play free online educational games for toddlers and kindergarteners. Features fun alphabet matching, animal shadow guessing, and simple math puzzles. No downloads required!"
        keywords="free educational games for kids, kindergarten learning games online, toddler games free, alphabet matching game, math games for kids, animal sound game, preschool learning activities, interactive games for children, US educational games, UK kids games"
        jsonLd={seoSchema}
      />
      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 0.8; }
          70% { transform: scale(0.9); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes puffIn {
          0% { opacity: 0; transform: scale(1.6); filter: blur(4px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Box sx={{ py: { xs: 2.5, md: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            fontWeight={900}
            sx={{
              fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' },
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1.5,
            }}
          >
            🎮 Kids Educational Game Zone
          </Typography>
          <Typography variant="h6" sx={{ color: '#4B5563', fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.2rem' }, mb: 3 }}>
            Fun learning games for toddlers and kindergarteners worldwide 🌎
          </Typography>

          {/* Difficulty Class Selector Chips */}
          <Box sx={{ 
            display: 'inline-flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center',
            bgcolor: '#F3F4F6', p: 1, borderRadius: '9999px', border: '1px solid #E5E7EB'
          }}>
            {grades.map(g => {
              const isSelected = selectedGrade === g.id;
              return (
                <Button
                  key={g.id}
                  onClick={() => setSelectedGrade(g.id)}
                  sx={{
                    borderRadius: '9999px', px: { xs: 2, sm: 3 }, py: 0.8, textTransform: 'none', fontWeight: 800,
                    bgcolor: isSelected ? g.color : 'transparent',
                    color: isSelected ? '#FFFFFF' : '#4B5563',
                    boxShadow: isSelected ? `0 4px 12px ${g.color}33` : 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: isSelected ? g.color : 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  {g.label}
                </Button>
              );
            })}
          </Box>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(5, 1fr)'
          },
          gap: 2,
          mb: 5,
          px: { xs: 1, sm: 0 }
        }}>
          {gameTabs.map((g) => {
            const isSelected = activeGame === g.id;
            return (
              <Button
                key={g.id}
                onClick={() => setActiveGame(g.id)}
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  py: { xs: 1.5, sm: 2 },
                  px: 3,
                  borderRadius: '20px',
                  bgcolor: isSelected ? g.color : '#ffffff',
                  color: isSelected ? '#ffffff' : '#374151',
                  border: `2.5px solid ${isSelected ? g.color : '#E5E7EB'}`,
                  boxShadow: isSelected 
                    ? `0 10px 20px ${g.color}33` 
                    : '0 4px 12px rgba(0,0,0,0.03)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: isSelected ? g.color : g.hoverBg,
                    borderColor: g.color,
                    transform: 'translateY(-3px)',
                    boxShadow: isSelected 
                      ? `0 12px 24px ${g.color}44` 
                      : '0 6px 18px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>{g.emoji}</span>
                <Typography variant="body1" fontWeight={800} sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' }, letterSpacing: '0.01em' }}>
                  {g.label}
                </Typography>
              </Button>
            );
          })}
        </Box>

        <Box sx={{ minHeight: 400 }}>
          {activeGame === 'alphabet' && (
            <section aria-label="Alphabet Matching Quiz Game" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#7C3AED', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  🔤 Alphabet Matching Quiz
                </Typography>
                <ResetButton onReset={() => setAlphabetKey(k => k + 1)} />
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
                Match the letter to the correct picture! Tap the right emoji to earn points.
              </Typography>
              <Box key={`${alphabetKey}_${selectedGrade}`}>
                <AlphabetQuiz selectedGrade={selectedGrade} />
              </Box>
            </section>
          )}

          {activeGame === 'math' && (
            <section aria-label="Kids Math Booster Game" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#059669', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  ➕ Kids Math Booster
                </Typography>
                <ResetButton onReset={() => setMathKey(k => k + 1)} />
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
                Solve fun addition & subtraction problems. Get streak bonuses for consecutive correct answers!
              </Typography>
              <Box key={`${mathKey}_${selectedGrade}`}>
                <MathBooster selectedGrade={selectedGrade} />
              </Box>
            </section>
          )}

          {activeGame === 'shadow' && (
            <section aria-label="Guess the Animal Shadow and Sound Game" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#D97706', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  👀 Guess the Animal Shadow & Sound
                </Typography>
                <ResetButton onReset={() => setShadowKey(k => k + 1)} />
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
                Look at the shadow silhouette, play the animal sound, and guess who it is! Tap the right answer to reveal the animal.
              </Typography>
              <Box key={`${shadowKey}_${selectedGrade}`}>
                <ShadowGame selectedGrade={selectedGrade} />
              </Box>
            </section>
          )}

          {activeGame === 'speed' && (
            <section aria-label="Speed Tapper Reflex Game" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#EC4899', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  ⚡ Speed Tapper
                </Typography>
                <ResetButton onReset={() => setSpeedKey(k => k + 1)} />
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
                Test your reflexes! Tap the emoji as fast as you can. It moves faster as your score increases!
              </Typography>
              <Box key={`${speedKey}_${selectedGrade}`}>
                <SpeedTapper selectedGrade={selectedGrade} />
              </Box>
            </section>
          )}

          {activeGame === 'spelling' && (
            <section aria-label="Kids Word Builder Spelling Game" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#4F46E5', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  ✍️ Word Builder
                </Typography>
                <ResetButton onReset={() => setSpellingKey(k => k + 1)} />
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
                Arrange scrambled letters to spell the word shown by the emoji clue. Tap a letter to place it or remove it!
              </Typography>
              <Box key={`${spellingKey}_${selectedGrade}`}>
                <WordBuilder selectedGrade={selectedGrade} />
              </Box>
            </section>
          )}

          {activeGame === 'memory' && (
            <section aria-label="Kids Memory Match Brain Game" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#D946EF', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  🧠 Memory Match
                </Typography>
                <ResetButton onReset={() => setMemoryKey(k => k + 1)} />
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
                Find matching pairs of emojis! Test your visual memory and match them all.
              </Typography>
              <Box key={`${memoryKey}_${selectedGrade}`}>
                <MemoryMatch selectedGrade={selectedGrade} />
              </Box>
            </section>
          )}

          {activeGame === 'oddout' && (
            <section aria-label="Kids Odd One Out Identification Game" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#0284C7', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  🔍 Odd One Out
                </Typography>
                <ResetButton onReset={() => setOddoutKey(k => k + 1)} />
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
                Find the one item that is different from all the others!
              </Typography>
              <Box key={`${oddoutKey}_${selectedGrade}`}>
                <OddOneOut selectedGrade={selectedGrade} />
              </Box>
            </section>
          )}

          {activeGame === 'findletter' && (
            <section aria-label="Kids Letter Search Identification Game" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#84CC16', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  🅰️ Letter Search
                </Typography>
                <ResetButton onReset={() => setFindletterKey(k => k + 1)} />
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
                Scan the grid to find and tap the target letter!
              </Typography>
              <Box key={`${findletterKey}_${selectedGrade}`}>
                <LetterSearch selectedGrade={selectedGrade} />
              </Box>
            </section>
          )}

          {activeGame === 'varnamala' && (
            <section aria-label="Hindi Varnamala and English Alphabet Learning Board" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#D97706', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  🏫 Language Board (Varnamala & ABC)
                </Typography>
                <ResetButton onReset={() => setVarnamalaKey(k => k + 1)} />
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
                Learn basic English Alphabet (A-Z) and Hindi Varnamala (अ-ज्ञ) with words and pictures, or play a letter-finding quiz!
              </Typography>
              <Box key={`${varnamalaKey}_${selectedGrade}`}>
                <VarnamalaBoard />
              </Box>
            </section>
          )}

          {activeGame === 'sequence' && (
            <section aria-label="Kids Number Sequence Missing Number Game" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#E11D48', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  🔢 Number Line (Missing Number)
                </Typography>
                <ResetButton onReset={() => setSequenceKey(k => k + 1)} />
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
                Find the correct number to fill in the missing space and complete the sequence!
              </Typography>
              <Box key={`${sequenceKey}_${selectedGrade}`}>
                <NumberSequence selectedGrade={selectedGrade} />
              </Box>
            </section>
          )}

          {activeGame === 'picboard' && (
            <section aria-label="Kids Picture Board Vocabulary Game" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: { xs: 0.5, sm: 0 } }}>
                <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#0891B2', fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' } }}>
                  🧸 Picture Board (Animals, Fruits, Vehicles, Birds)
                </Typography>
                <ResetButton onReset={() => setPicboardKey(k => k + 1)} />
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 3, px: { xs: 0.5, sm: 0 }, fontWeight: 500 }}>
                Learn names of Animals, Fruits, Vehicles, and Birds in English and Hindi, or take a visual search quiz!
              </Typography>
              <Box key={`${picboardKey}_${selectedGrade}`}>
                <PictureBoard />
              </Box>
            </section>
          )}
        </Box>

        <Paper sx={{
          mt: 6, p: { xs: 3, md: 4 },
          borderRadius: '24px',
          bgcolor: '#F0F9FF',
          border: '1px solid #BAE6FD',
          boxShadow: '0 4px 20px rgba(3, 105, 161, 0.04)'
        }}>
          <Typography variant="h5" component="h2" fontWeight={800} sx={{ color: '#0369A1', mb: 2, fontSize: { xs: '1.2rem', md: '1.4rem' } }}>
            Why Parents Trust Our Free Online Toddler Games
          </Typography>
          <Typography variant="body2" sx={{ color: '#0C4A6E', lineHeight: 1.8, fontWeight: 500 }}>
            Our interactive learning platform is designed to boost cognitive skills in preschool kids. 
            With animal sound recognition, visual counting math blocks, and letter association, learning 
            becomes purely play-based. Every game uses bright colors, positive audio reinforcement, and 
            gentle error feedback so children stay motivated without frustration. Parents appreciate that 
            there are no ads, no sign-ups, and no downloads — just safe, browser-based educational play 
            that works on any device. Whether your child is learning the alphabet for the first time, 
            practicing simple addition, or discovering animals through shadows and sounds, our games 
            adapt to their pace and make screen time meaningful. Trusted by families in the US, UK, 
            Canada, and across the world for quality early childhood education.
          </Typography>
        </Paper>
      </Box>
    </Layout>
  );
}