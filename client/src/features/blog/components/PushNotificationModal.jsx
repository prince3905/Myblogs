import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  IconButton,
  Zoom
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QuizIcon from '@mui/icons-material/Quiz';

// Multilingual translations for the Push & Subscribe Notification Modal
const POPUP_TRANSLATIONS = {
  hi: {
    pill: '🔥 LIVE सरकारी जॉब अपडेट्स • 100% FREE',
    title: 'सरकारी नौकरी, भर्ती गजट और आधिकारिक रिजल्ट कभी मिस न हों! 🔔',
    desc: 'UPSC, SSC, Railway, Police, Defence और राज्य सरकार की नौकरियों के Live Alerts, Direct Official Links सीधे अपने फोन पर पाएं।',
    feat1: '⚡ Direct Official Gazette & Apply Links (100% सत्यापित)',
    feat2: '⏳ Last Date & Deadline Reminders (फॉर्म कभी न छूटे)',
    feat3: '📚 Daily Current Affairs & Career Updates (रोजाना)',
    btnAllow: '🔔 हाँ, मुझे फ्री अलर्ट भेजें (Allow Free Alerts)',
    btnLater: 'बाद में (Later)',
    note: '🔒 100% Free Lifetime • 1-क्लिक में कभी भी बंद कर सकते हैं'
  },
  en: {
    pill: '🔥 LIVE GOV JOB ALERTS • 100% FREE',
    title: 'Never Miss Official Vacancies, Federal Gazettes & Civil Service Alerts! 🔔',
    desc: 'Instant notifications for Federal, Civil Service, United Nations, Defense & Public Sector circulars directly on your device.',
    feat1: '⚡ Direct Official .gov & PDF Gazette Links (Zero Spam)',
    feat2: '⏳ Application Deadlines & Urgent Notice Reminders',
    feat3: '📚 Daily International Affairs & Policy Updates',
    btnAllow: '🔔 Yes, Send Me Free Gov Alerts',
    btnLater: 'Later',
    note: '🔒 100% Free Lifetime • Unsubscribe anytime in 1 click'
  },
  ar: {
    pill: '🔥 تنبيهات الوظائف الحكومية المباشرة • مجاناً 100%',
    title: 'لا تفوّت أحدث إعلانات الوظائف الحكومية والجريدة الرسمية! 🔔',
    desc: 'احصل على إشعارات فورية للوظائف الشاغرة في الوزارات والهيئات الاتحادية والأمم المتحدة مباشرة على جهازك.',
    feat1: '⚡ روابط تقديم رسمية معتمدة والجريدة الرسمية PDF',
    feat2: '⏳ تنبيهات مواعيد إغلاق التسجيل وآخر موعد للتقديم',
    feat3: '📚 ملخص يومي لأهم الشؤون الدولية والسياسات الرسمية',
    btnAllow: '🔔 نعم، أرسل لي التنبيهات مجاناً',
    btnLater: 'لاحقاً',
    note: '🔒 خدمة مجانية 100% مدى الحياة • يمكنك الإلغاء بنقرة واحدة'
  },
  es: {
    pill: '🔥 ALERTAS DE EMPLEO PÚBLICO • 100% GRATIS',
    title: '¡No te pierdas las oposiciones oficiales y boletines del estado! 🔔',
    desc: 'Recibe alertas inmediatas de empleo público, convocatorias ministeriales y vacantes oficiales directamente en tu teléfono.',
    feat1: '⚡ Enlaces directos a boletines oficiales (.gob / PDF)',
    feat2: '⏳ Recordatorios de plazos de inscripción urgentes',
    feat3: '📚 Actualizaciones diarias de asuntos internacionales',
    btnAllow: '🔔 Sí, recibir alertas gratuitas',
    btnLater: 'Más tarde',
    note: '🔒 100% Gratuito de por vida • Cancela cuando quieras en 1 clic'
  },
  fr: {
    pill: '🔥 ALERTES CONCOURS PUBLICS • 100% GRATUIT',
    title: 'Ne manquez aucun avis de recrutement de la fonction publique! 🔔',
    desc: 'Alertes instantanées pour les postes gouvernementaux, ministères et organisations internationales directement sur votre appareil.',
    feat1: '⚡ Liens officiels vers le Journal Officiel et PDF vérifiés',
    feat2: '⏳ Rappels des dates limites de candidature',
    feat3: '📚 Actualités internationales et politiques publiques',
    btnAllow: '🔔 Oui, m\'envoyer des alertes gratuites',
    btnLater: 'Plus tard',
    note: '🔒 100% Gratuit à vie • Désabonnement en 1 clic'
  },
  de: {
    pill: '🔥 LIVE ÖFFENTLICHER DIENST ALERTS • 100% KOSTENLOS',
    title: 'Verpassen Sie keine Stellenausschreibungen des Bundes & der Länder! 🔔',
    desc: 'Sofortige Benachrichtigungen über offizielle Ausschreibungen und Stellen im öffentlichen Dienst direkt auf Ihr Gerät.',
    feat1: '⚡ Direkte Links zu Bund.de & offiziellen Amtsblättern',
    feat2: '⏳ Fristerinnerungen für Bewerbungsschlüsse',
    feat3: '📚 Tägliche internationale Nachrichten & Analysen',
    btnAllow: '🔔 Ja, kostenlose Benachrichtigungen aktivieren',
    btnLater: 'Später',
    note: '🔒 100% Kostenlos • Jederzeit mit 1 Klick abbestellbar'
  }
};

export default function PushNotificationModal() {
  const [open, setOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentLang, setCurrentLang] = useState('hi');
  const timerRef = useRef(null);

  // Sync language with user preference or timezone on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('dh_user_lang');
      if (savedLang && POPUP_TRANSLATIONS[savedLang]) {
        setCurrentLang(savedLang);
      } else {
        const browserLang = (navigator.language || '').slice(0, 2);
        if (POPUP_TRANSLATIONS[browserLang]) {
          setCurrentLang(browserLang);
        } else {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
          if (tz.includes('Dubai') || tz.includes('Riyadh') || tz.includes('Qatar') || tz.includes('Kuwait')) {
            setCurrentLang('ar');
          } else if (tz.includes('Madrid')) {
            setCurrentLang('es');
          } else if (tz.includes('Paris')) {
            setCurrentLang('fr');
          } else if (tz.includes('Berlin')) {
            setCurrentLang('de');
          } else if (tz.includes('London') || tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Toronto')) {
            setCurrentLang('en');
          } else {
            setCurrentLang('hi');
          }
        }
      }
    } catch (e) {}
  }, [open]);

  useEffect(() => {
    if (
      window.location.pathname.startsWith('/global-jobs') || 
      window.location.pathname.startsWith('/india/sarkari-jobs') ||
      window.location.pathname.startsWith('/job-alerts') ||
      window.location.pathname.startsWith('/live-alerts')
    ) return;

    // Check if already granted
    if ('Notification' in window && Notification.permission === 'granted') {
      setIsSubscribed(true);
      return;
    }

    // Check if permission already permanently blocked
    if ('Notification' in window && Notification.permission === 'denied') {
      return;
    }

    // Check if dismissed in this session
    if (sessionStorage.getItem('push_modal_dismissed') === 'true') {
      return;
    }

    let triggered = false;
    const triggerPrompt = () => {
      if (triggered) return;
      triggered = true;
      checkAndShowPrompt();
      window.removeEventListener('scroll', handleScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    // 1. Trigger ONLY after 50% scroll
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 300 && window.scrollY / scrollHeight >= 0.5) {
        triggerPrompt();
      }
    };

    // 2. Gentle reading delay fallback (45 seconds)
    timerRef.current = setTimeout(triggerPrompt, 45000);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const checkAndShowPrompt = () => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('push_modal_dismissed') === 'true') return;
    if ('Notification' in window && Notification.permission === 'granted') {
      setIsSubscribed(true);
      return;
    }
    if ('Notification' in window && Notification.permission !== 'denied') {
      setOpen(true);
    }
  };

  const handleAllow = async () => {
    setOpen(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    sessionStorage.setItem('push_modal_dismissed', 'true');

    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setIsSubscribed(true);
        }
      }

      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          try {
            if (OneSignal.Notifications) {
              await OneSignal.Notifications.requestPermission();
            }
            if (OneSignal.User && OneSignal.User.PushSubscription) {
              await OneSignal.User.PushSubscription.optIn();
            }
          } catch (e) {}
        });
      }
    } catch (err) {
      console.warn('[Push Modal] Permission request notice:', err.message);
    }
  };

  const handleLater = () => {
    setOpen(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    sessionStorage.setItem('push_modal_dismissed', 'true');
  };

  if (isSubscribed) return null;

  const t = POPUP_TRANSLATIONS[currentLang] || POPUP_TRANSLATIONS.en;
  const isRTL = currentLang === 'ar';

  return (
    <Dialog
      open={open}
      onClose={handleLater}
      TransitionComponent={Zoom}
      keepMounted
      dir={isRTL ? 'rtl' : 'ltr'}
      PaperProps={{
        sx: {
          borderRadius: '20px',
          padding: { xs: '12px 8px', sm: '20px 16px' },
          maxWidth: '420px',
          width: '92%',
          margin: 'auto',
          background: 'linear-gradient(145deg, #ffffff 0%, #F8FAFC 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }
      }}
    >
      {/* Background glow accent */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 160,
          height: 160,
          bgcolor: 'rgba(239, 68, 68, 0.12)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      <IconButton
        onClick={handleLater}
        size="small"
        sx={{
          position: 'absolute',
          right: isRTL ? 'auto' : 12,
          left: isRTL ? 12 : 'auto',
          top: 12,
          color: '#94A3B8',
          bgcolor: 'rgba(0,0,0,0.04)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.08)', color: '#475569' },
          zIndex: 2
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, position: 'relative', zIndex: 1 }}>
        {/* Top Urgency Pill Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            bgcolor: '#FEE2E2',
            color: '#DC2626',
            px: 1.5,
            py: 0.4,
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 850,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            mb: 1.5,
            border: '1px solid rgba(220, 38, 38, 0.2)'
          }}
        >
          <Box sx={{ width: 6, height: 6, bgcolor: '#DC2626', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
          {t.pill}
        </Box>

        {/* Animated Bell Icon */}
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            bgcolor: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
            background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.8,
            boxShadow: '0 10px 25px rgba(220, 38, 38, 0.35)',
            animation: 'bellRing 2s infinite ease-in-out',
            '@keyframes bellRing': {
              '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
              '10%, 30%': { transform: 'rotate(-15deg) scale(1.08)' },
              '20%, 40%': { transform: 'rotate(15deg) scale(1.08)' },
              '50%': { transform: 'rotate(0deg) scale(1)' }
            }
          }}
        >
          <NotificationsActiveIcon sx={{ fontSize: 32 }} />
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '1.2rem', sm: '1.35rem' },
            color: '#0F172A',
            letterSpacing: '-0.02em',
            mb: 0.8,
            lineHeight: 1.3
          }}
        >
          {t.title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#475569',
            fontSize: { xs: '0.85rem', sm: '0.92rem' },
            lineHeight: 1.5,
            mb: 2.2,
            px: { xs: 0.5, sm: 1 }
          }}
        >
          {t.desc}
        </Typography>

        {/* Feature Highlights */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.9,
            mb: 2.5,
            bgcolor: 'rgba(241, 245, 249, 0.85)',
            p: 1.5,
            borderRadius: '12px',
            textAlign: isRTL ? 'right' : 'left',
            border: '1px solid rgba(226, 232, 240, 0.8)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlashOnIcon sx={{ fontSize: 17, color: '#EAB308' }} />
            <Typography variant="caption" sx={{ fontWeight: 750, color: '#1E293B', fontSize: '0.8rem' }}>
              {t.feat1}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ fontSize: 17, color: '#16A34A' }} />
            <Typography variant="caption" sx={{ fontWeight: 750, color: '#1E293B', fontSize: '0.8rem' }}>
              {t.feat2}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuizIcon sx={{ fontSize: 17, color: '#4F46E5' }} />
            <Typography variant="caption" sx={{ fontWeight: 750, color: '#1E293B', fontSize: '0.8rem' }}>
              {t.feat3}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleAllow}
            fullWidth
            sx={{
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              color: '#ffffff',
              py: 1.35,
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 850,
              textTransform: 'none',
              letterSpacing: '0.01em',
              boxShadow: '0 8px 22px rgba(220, 38, 38, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)',
                boxShadow: '0 10px 26px rgba(220, 38, 38, 0.5)'
              }
            }}
          >
            {t.btnAllow}
          </Button>

          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem', fontWeight: 600, mt: 0.2 }}>
            {t.note}
          </Typography>

          <Button
            variant="text"
            onClick={handleLater}
            sx={{
              color: '#64748B',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'none',
              py: 0.4,
              '&:hover': { bgcolor: 'transparent', color: '#1E293B' }
            }}
          >
            {t.btnLater}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
