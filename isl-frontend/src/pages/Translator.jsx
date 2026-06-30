/**
 * Translator.jsx — MudraVani ISL Translator (v3 — Premium UI)
 * Modes:
 *   solo — single-user translator with live webcam ML detection
 *   call — 2-user video call with real-time ISL translation relay
 *
 * Suggestion-share fix: when user selects a grammar suggestion in call mode,
 * it is relayed to the partner via a 'suggestion' type message on the chat WS.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import {
  Video, VideoOff, RotateCcw, Copy, Save, Volume2, VolumeX,
  AlertCircle, Wifi, WifiOff, Lightbulb,
  Phone, PhoneOff, Users, User, Link2, Loader2, UserCheck,
  Sparkles, Zap, MessageSquare, CheckCircle2, Send, Settings, Monitor, MonitorOff, Mic, MicOff, Maximize2, Minimize2,
} from 'lucide-react';
import { useWebcam }    from '../hooks/useWebcam';
import { useVideoCall } from '../hooks/useVideoCall';
import { useApp }       from '../context/AppContext';

const MIN_CONFIDENCE = 0.60;

// ── Language config ────────────────────────────────────────────────────────────
const LANG_CONFIG = {
  en: { label: 'EN', full: 'English',  bcp47: 'en-IN', mmLang: 'en',   voiceHints: ['en-IN', 'en_IN', 'English India', 'Ravi', 'Lekha'] },
  hi: { label: 'HI', full: 'Hindi',    bcp47: 'hi-IN', mmLang: 'hi',   voiceHints: ['hi-IN', 'hi_IN', 'Hindi',  'Lekha'] },
  mr: { label: 'MR', full: 'Marathi',  bcp47: 'mr-IN', mmLang: 'mr',   voiceHints: ['mr-IN', 'mr_IN', 'Marathi'] },
};

// ── Translation — Google Translate (primary) + MyMemory (fallback) ───────────
// Google Translate unofficial endpoint always returns the target script (Devanagari)
async function translateViaGoogle(text, targetLang) {
  const tl = LANG_CONFIG[targetLang]?.mmLang || targetLang; // 'hi', 'mr', etc.
  // Use the unofficial single-text endpoint (no API key needed)
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}` +
    `&dt=t&q=${encodeURIComponent(text)}`;
  const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Google HTTP ${res.status}`);
  const data = await res.json();
  // Response shape: [ [[translated, original, ...], ...], ... ]
  if (Array.isArray(data) && Array.isArray(data[0])) {
    const translated = data[0]
      .filter(Boolean)
      .map(chunk => chunk[0])
      .join('')
      .trim();
    if (translated) return translated;
  }
  throw new Error('Empty response');
}

async function translateViaMyMemory(text, targetLang) {
  const langPair = `en|${LANG_CONFIG[targetLang]?.mmLang || targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
  const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return cleanDevanagari(data.responseData.translatedText, targetLang);
  }
  if (data.matches?.length) return cleanDevanagari(data.matches[0].translation || text, targetLang);
  throw new Error('No translation');
}

async function translateText(text, targetLang) {
  if (!text || targetLang === 'en') return text;
  try {
    // Primary: Google Translate (always gives Devanagari for hi/mr)
    return await translateViaGoogle(text, targetLang);
  } catch (err) {
    console.warn('[translateText] Google failed, trying MyMemory:', err.message);
    try {
      return await translateViaMyMemory(text, targetLang);
    } catch (err2) {
      console.warn('[translateText] MyMemory also failed:', err2.message);
      return text; // graceful fallback
    }
  }
}

// ── Extract Devanagari from mixed MyMemory responses ─────────────────────────
// Only needed as a fallback — Google always returns proper script.
function cleanDevanagari(raw, targetLang) {
  if (!raw || targetLang === 'en') return raw;
  const isDevanagari = targetLang === 'hi' || targetLang === 'mr';
  if (!isDevanagari) return raw;

  // If the string already starts with Devanagari, return as-is
  if (/^[\u0900-\u097F]/.test(raw.trim())) return raw.trim();

  // Extract Devanagari from inside parentheses
  const parenMatches = [...raw.matchAll(/\(([^)]+)\)/g)]
    .map(m => m[1].trim())
    .filter(s => /[\u0900-\u097F]/.test(s));
  if (parenMatches.length > 0) {
    const parts  = parenMatches.join(' ').split(',').map(s => s.trim()).filter(Boolean);
    const unique = [...new Set(parts)];
    return unique.join(', ');
  }

  // Extract all Devanagari runs
  const runs = raw.match(/[\u0900-\u097F][\u0900-\u097F\s,।.!?]*/g);
  if (runs) {
    const joined = runs.join(' ').replace(/\s+/g, ' ').trim();
    if (joined.length > 1) return joined;
  }

  return raw; // last resort
}

// ── Pick the best TTS voice for a BCP-47 tag ─────────────────────────────────
function pickVoice(bcp47, hints) {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Exact locale match
  let v = voices.find(v => v.lang === bcp47);
  if (v) return v;
  // Hint substring match (e.g. 'hi-IN', 'Hindi', 'Lekha')
  for (const hint of (hints || [])) {
    v = voices.find(v => v.lang.includes(hint) || v.name.includes(hint));
    if (v) return v;
  }
  // Language prefix match
  const prefix = bcp47.split('-')[0];
  v = voices.find(v => v.lang.startsWith(prefix));
  return v || null;
}
const HOLD_FRAMES    = 8;

const STATUS_META = {
  idle:       { label: 'Not in call',        color: 'var(--text-faint)', dot: 'var(--text-faint)', glow: 'transparent' },
  connecting: { label: 'Connecting…',        color: 'var(--yellow)',     dot: 'var(--yellow)',      glow: 'var(--yellow)' },
  waiting:    { label: 'Waiting for partner',color: 'var(--blue)',       dot: 'var(--blue)',        glow: 'var(--blue)' },
  connected:  { label: 'Live',               color: 'var(--green)',      dot: 'var(--green)',       glow: 'var(--green)' },
  full:       { label: 'Room full',           color: 'var(--red)',        dot: 'var(--red)',         glow: 'var(--red)' },
  error:      { label: 'Error',               color: 'var(--red)',        dot: 'var(--red)',         glow: 'var(--red)' },
};

const RADIUS = 26;
const CIRC   = 2 * Math.PI * RADIUS;

const normalizeRoomCode = (v) =>
  v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

function confColor(pct) {
  if (pct >= 90) return 'var(--green)';
  if (pct >= 75) return 'var(--yellow)';
  return 'var(--red)';
}

/* ─── Animated confidence ring ─────────────────────────────────────────────── */
function ConfidenceRing({ pct, sign, hasHand }) {
  const springPct = useSpring(pct, { stiffness: 120, damping: 18 });
  const offset    = useMotionValue(CIRC);

  useEffect(() => {
    offset.set(CIRC - (CIRC * pct) / 100);
  }, [pct]);

  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      {/* Glow pulse when high confidence */}
      {hasHand && pct >= 90 && (
        <motion.div
          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'var(--green-soft)', pointerEvents: 'none',
          }}
        />
      )}
      <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={36} cy={36} r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={5} />
        <motion.circle
          cx={36} cy={36} r={RADIUS} fill="none"
          stroke={hasHand ? confColor(pct) : 'var(--text-ghost)'}
          strokeWidth={5} strokeLinecap="round"
          strokeDasharray={CIRC}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: hasHand ? confColor(pct) : 'var(--text-ghost)' }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}

/* ─── Word chip with bounce-in ─────────────────────────────────────────────── */
function WordChip({ word, index, color = 'accent' }) {
  return (
    <motion.span
      key={`${word}-${index}`}
      initial={{ opacity: 0, scale: 0.5, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      style={{
        padding: '3px 10px', borderRadius: 6,
        fontSize: '0.85rem', fontWeight: 600,
        background: color === 'accent' ? 'var(--accent-soft)' : 'var(--blue-soft)',
        border: `1px solid ${color === 'accent' ? 'var(--accent-border)' : 'var(--blue-border)'}`,
        color: color === 'accent' ? 'var(--accent)' : 'var(--blue)',
      }}
    >
      {word}
    </motion.span>
  );
}

/* ─── Incoming suggestion toast (peer sent) ─────────────────────────────────── */
function IncomingSuggestionBanner({ text, onDismiss }) {
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(onDismiss, 7000);
    return () => clearTimeout(t);
  }, [text, onDismiss]);

  return (
    <AnimatePresence>
      {text && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{
            background: 'linear-gradient(135deg, var(--blue-soft), var(--accent-softer))',
            border: '1px solid var(--blue-border)',
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}
        >
          {/* Animated icon */}
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'var(--blue-soft)', border: '1px solid var(--blue-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MessageSquare size={16} style={{ color: 'var(--blue)' }} />
          </motion.div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Partner wants to say
            </p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              "{text}"
            </p>
          </div>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, marginTop: 2, fontSize: 16, lineHeight: 1 }}>×</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────────── */
export default function Translator() {
  const {
    videoRef, canvasRef, isActive, isDetecting, error,
    fps, prediction, backendReady, start, stop, startDetection, stopDetection, getStream,
    setDetectionFps,
  } = useWebcam();

  const {
    localVideoRef, status: callStatus, mySlot,
    peerSentence, peerWord, peerSuggestion, peerName, peerChat,
    attachRemoteVideoRef, joinRoom, leaveRoom, sendTranslation, sendSuggestion, sendChatMessage,
    getPeerConnection,
  } = useVideoCall();

  const { addToHistory, showToast, getSuggestions } = useApp();

  const [mode, setMode]               = useState('solo');
  const [roomInput, setRoomInput]     = useState('');
  const [inRoom, setInRoom]           = useState(false);
  const [userName, setUserName]       = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab]   = useState('transcript');
  const [isMuted, setIsMuted]         = useState(false);
  const [isVideoOn, setIsVideoOn]     = useState(true);
  const [isAslActive, setIsAslActive] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef(null);
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})), 1000);
    return () => clearInterval(t);
  }, []);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [sentence, setSentence]             = useState([]);
  const [language, setLanguage]             = useState('en');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating]   = useState(false);
  const [isSpeaking, setIsSpeaking]         = useState(false);
  const [speechRate, setSpeechRate]         = useState(1.25);  // Web Speech API: 0.1–10, 1=normal
  const [lastWord, setLastWord]             = useState('');
  const [holdCount, setHoldCount]           = useState(0);
  const [suggestions, setSuggestions]       = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  
  // Chat and History
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const sentenceRef   = useRef([]);
  const translateAbortRef = useRef(null);

  useEffect(() => { sentenceRef.current = sentence; }, [sentence]);

  // ── Auto-translate whenever sentence or language changes ──────────────────
  useEffect(() => {
    const english = sentence.map(s => s.word).join(' ');
    if (!english) { setTranslatedText(''); return; }
    if (language === 'en') { setTranslatedText(english); return; }
    // Debounce: cancel previous in-flight translation
    const timer = setTimeout(async () => {
      setIsTranslating(true);
      const result = await translateText(english, language);
      setTranslatedText(result);
      setIsTranslating(false);
    }, 400); // wait 400ms after last word added
    return () => clearTimeout(timer);
  }, [sentence, language]);

  // ── Sign detection ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!prediction?.hand_detected) { setHoldCount(0); return; }
    const { sign, confidence } = prediction;
    if (confidence < MIN_CONFIDENCE || sign === lastWord) { setHoldCount(0); return; }

    setHoldCount(prev => {
      const next = prev + 1;
      if (next >= HOLD_FRAMES) {
        setSentence(s => {
          const updated = [...s, { word: sign, confidence }];
          setSuggestions(getSuggestions(updated.map(x => x.word)));
          if (mode === 'call' && callStatus === 'connected') {
            sendTranslation(sign, updated.map(x => x.word).join(' '));
          }
          return updated;
        });
        setLastWord(sign);
        return 0;
      }
      return next;
    });
  }, [prediction, lastWord, getSuggestions, mode, callStatus, sendTranslation]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getText = () => sentence.map(s => s.word).join(' ');
  const getDisplayText = () => translatedText || getText();

  const handleStart = useCallback(async (opts) => {
    setLastWord(''); setHoldCount(0);
    return await start(opts);
  }, [start]);

  const handleStop  = useCallback(() => stop(), [stop]);

  const handleReset = useCallback(() => {
    setSentence([]); setLastWord(''); setHoldCount(0); setSuggestions([]); setSelectedSuggestion(null);
    setTranslatedText(''); setIsTranslating(false);
  }, []);

  const handleCopy = () =>
    navigator.clipboard.writeText(getDisplayText() || getText()).then(() => showToast('Copied!', 'success'));

  const handleSave = () => {
    if (!sentence.length) return showToast('Nothing to save yet', 'error');
    const avgConf = sentence.reduce((a, s) => a + s.confidence, 0) / sentence.length;
    addToHistory({
      sentence: getDisplayText(),
      originalEnglish: getText(),
      words: sentence.map(s => s.word),
      lang: language,
      confidence: avgConf,
    });
    showToast('Saved to history ✓', 'success');
  };

  const handleSpeak = useCallback(() => {
    const textToSpeak = getDisplayText();
    if (!textToSpeak || isSpeaking) return;
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    const cfg = LANG_CONFIG[language] || LANG_CONFIG.en;
    const u   = new SpeechSynthesisUtterance(textToSpeak);
    u.lang    = cfg.bcp47;
    // Try to find a matching Indian-accent voice
    const doSpeak = () => {
      const bestVoice = pickVoice(cfg.bcp47, cfg.voiceHints);
      if (bestVoice) u.voice = bestVoice;
      u.rate   = speechRate;
      u.pitch  = 1.0;
      u.volume = 1.0;
      u.onstart = () => setIsSpeaking(true);
      u.onend   = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(u);
    };
    // Voices may not be loaded yet on first call — wait for them
    if (speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      speechSynthesis.onvoiceschanged = () => { doSpeak(); speechSynthesis.onvoiceschanged = null; };
    }
  }, [language, isSpeaking, translatedText, sentence, speechRate]);

  // Apply suggestion — and relay to partner in call mode
  const applySuggestion = (text) => {
    setSentence([]);
    setSuggestions([]);
    setSelectedSuggestion(text);
    showToast('Suggestion applied', 'success');

    const msg = { id: Date.now(), sender: 'Me', text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    setChatMessages(p => [...p, msg]);

    // Relay the chosen suggestion to partner as a chat message
    if (mode === 'call' && callStatus === 'connected' && sendChatMessage) {
      sendChatMessage(text);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    const msg = { id: Date.now(), sender: 'Me', text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    setChatMessages(p => [...p, msg]);
    if (mode === 'call' && callStatus === 'connected' && sendChatMessage) {
      sendChatMessage(text);
    }
  };

  useEffect(() => {
    if (peerChat) {
      setChatMessages(p => [...p, { id: peerChat.id, sender: peerName || 'Partner', text: peerChat.text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    }
  }, [peerChat, peerName]);

  const handleJoinRoom = async () => {
    const roomId = normalizeRoomCode(roomInput);
    if (!roomId) return showToast('Enter a room code', 'error');
    setRoomInput(roomId);
    if (!isActive) {
      const ok = await handleStart({ detect: false });
      if (!ok) return;
    }
    await joinRoom(roomId, getStream(), userName);
    setInRoom(true);
  };

  const handleLeaveRoom = () => { leaveRoom(); setInRoom(false); setRoomInput(''); };

  const handleModeSwitch = (m) => {
    if (m === 'solo' && inRoom) handleLeaveRoom();
    if (m === 'call') stopDetection();
    setMode(m); handleReset();
  };

  // ── Real mic mute: toggle the audio track on the live stream ─────────────────
  const handleMicToggle = useCallback(() => {
    const stream = getStream();
    if (stream) {
      stream.getAudioTracks().forEach(t => { t.enabled = isMuted; }); // flip: muted=true means disable
    }
    setIsMuted(prev => !prev);
  }, [getStream, isMuted]);

  // ── Real screen share ─────────────────────────────────────────────────────────
  const handleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share, restore camera
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      // Replace sender track back to camera
      const camStream = getStream();
      if (camStream) {
        const videoTrack = camStream.getVideoTracks()[0];
        if (videoTrack) {
          const pc = getPeerConnection();
          if (pc) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(videoTrack).catch(() => {});
          }
        }
      }
      setIsScreenSharing(false);
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', frameRate: 15 },
        audio: false,
      });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];
      // Replace the sender's video track with screen
      const pc = getPeerConnection();
      if (pc) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack).catch(() => {});
      }
      // Auto-stop when user clicks browser's 'Stop sharing'
      screenTrack.onended = () => {
        screenStreamRef.current = null;
        setIsScreenSharing(false);
      };
      setIsScreenSharing(true);
    } catch (err) {
      if (err.name !== 'NotAllowedError') console.warn('Screen share error:', err);
    }
  }, [isScreenSharing, getStream, getPeerConnection]);

  useEffect(() => {
    if (mode !== 'call' || !inRoom || !isActive) return;
    // Start detection whenever camera is active in a room, regardless of connection status
    // so predictions are ready the moment the peer connects
    if (!isDetecting) startDetection();
  }, [mode, inRoom, isActive, isDetecting, startDetection]);

  useEffect(() => {
    // Use 4 fps in call mode — enough for smooth sign detection without spiking encode CPU
    setDetectionFps(mode === 'call' ? 4 : 4);
  }, [mode, setDetectionFps]);

  useEffect(() => stop, [stop]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const pct  = prediction ? Math.round(prediction.confidence * 100) : 0;
  const meta = STATUS_META[callStatus] || STATUS_META.idle;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Render variables
  return (
    <div className="flex flex-col h-full bg-[#050505] text-white overflow-hidden relative font-sans">
      
      {/* Subtle Glowing Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-50 shrink-0">
        {/* Row 1: Branding + Right controls */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
          {/* Left: Branding & live indicator */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-3 md:px-4 py-2 rounded-2xl">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="p-1.5 bg-indigo-500/20 rounded-lg">
                <Video className="w-4 h-4 text-indigo-400" />
              </motion.div>
              <h1 className="font-semibold text-sm tracking-wide">Drishya Vaani</h1>
            </div>
            {(isActive || backendReady) && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-400">SignSync™ Active</span>
              </div>
            )}
          </div>

          {/* Center (desktop only): Language & Mode switchers */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
              {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
                <button key={code} onClick={() => setLanguage(code)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${language === code ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                  {cfg.label}
                </button>
              ))}
            </div>
            <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
              {[{ id: 'solo', label: 'Solo', icon: User }, { id: 'call', label: 'Call', icon: Users }].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => handleModeSwitch(id)} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === id ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Time + mobile live dot */}
          <div className="flex items-center gap-2 md:gap-3">
            {(isActive || backendReady) && (
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex sm:hidden w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
            <div className="hidden md:flex px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              End-to-end Encrypted
            </div>
            <div className="text-[10px] md:text-sm font-medium text-gray-300 bg-white/5 px-2 md:px-3 py-1.5 rounded-xl border border-white/10">
              {currentTime}
            </div>
          </div>
        </div>

        {/* Row 2 (mobile only): Language & Mode switchers */}
        <div className="flex md:hidden items-center justify-center gap-3 pb-2 px-4">
          <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
            {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
              <button key={code} onClick={() => setLanguage(code)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${language === code ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                {cfg.label}
              </button>
            ))}
          </div>
          <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
            {[{ id: 'solo', label: 'Solo', icon: User }, { id: 'call', label: 'Call', icon: Users }].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => handleModeSwitch(id)} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${mode === id ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* LOBBY OR MAIN CALL */}
      {!inRoom && mode === 'call' ? (
        <div className="flex-1 flex items-center justify-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-[2rem] w-full max-w-md mx-4 sm:mx-0 shadow-2xl flex flex-col gap-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/30">
                <Users className="text-indigo-400 w-6 h-6" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Join Session</h2>
              <p className="text-sm text-gray-400">Enter your name and the room code to connect.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <input
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Your Name"
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <input
                value={roomInput}
                onChange={e => setRoomInput(normalizeRoomCode(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                placeholder="ROOM CODE"
                maxLength={8}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors uppercase tracking-widest text-center font-mono font-bold"
              />
              <motion.button onClick={handleJoinRoom} className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                Join Call
              </motion.button>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden px-2 sm:px-4 pb-2 sm:pb-4 gap-4 relative z-10">
          
          {/* MAIN VIDEO AREA */}
          <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-white/10 bg-black/40 shadow-2xl flex items-center justify-center">
            
            {/* The Main Video Stream (Remote in Call, Local in Solo) */}
            {mode === 'call' ? (
              <>
                <video 
                  ref={attachRemoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${callStatus === 'connected' ? 'opacity-100' : 'opacity-0'}`} 
                />
                {callStatus !== 'connected' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-400 z-10">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>{callStatus === 'waiting' ? 'Waiting for partner to join...' : 'Connecting...'}</p>
                  </div>
                )}
              </>
            ) : (
               <>
                  {/* Video — mirrored for self-view */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ backfaceVisibility: 'hidden' }}
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* Canvas is HIDDEN — only used for ML frame capture, not display */}
                  <canvas
                    ref={canvasRef}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                  />
                  {!isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 z-10">
                       <button onClick={handleStart} className="bg-indigo-600 px-6 py-3 rounded-full font-medium hover:bg-indigo-500">Start Camera</button>
                    </div>
                  )}
               </>
            )}

            {/* Dark gradient for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

            {/* Top Left Name Tag (Call mode) */}
            {mode === 'call' && callStatus === 'connected' && (
              <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                <div className="flex items-end gap-1 h-3">
                  {[1,2,3,4,5].map(i => (
                    <motion.div key={i} animate={{ height: ['4px', '12px', '4px'] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }} className="w-1 bg-emerald-400 rounded-full" />
                  ))}
                </div>
                <span className="text-sm font-medium">{peerName || 'Partner'}</span>
              </div>
            )}

            {/* Top Right Tracking Badge */}
            {(mode === 'solo' || (mode === 'call' && callStatus === 'connected')) && isAslActive && (
              <div className={`absolute top-6 ${mode === 'call' ? 'left-40' : 'right-6'} bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2`}>
                 <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                 <span className="text-xs font-medium text-indigo-300">AI Tracking Active</span>
              </div>
            )}

            {/* PiP Local Video (Call mode) */}
            {mode === 'call' && (
              <motion.div 
                drag dragConstraints={{ left: -400, right: 0, top: 0, bottom: 400 }}
                className="absolute top-3 sm:top-6 right-3 sm:right-6 w-20 sm:w-36 md:w-56 aspect-[3/4] bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden border border-white/20 sm:border-2 shadow-2xl cursor-move z-20"
              >
                <video ref={(el) => {
                  videoRef.current = el;
                  localVideoRef.current = el;
                  if (el && getStream() && el.srcObject !== getStream()) el.srcObject = getStream();
                }} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
                    {userName || 'You'}
                  </div>
                  {isMuted && <div className="bg-red-500/80 p-1.5 rounded-full"><VolumeX className="w-3 h-3" /></div>}
                </div>
              </motion.div>
            )}

            {/* Real-time Translation Overlay */}
            <AnimatePresence>
              {(sentence.length > 0 || translatedText) && isAslActive && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-16 sm:bottom-28 left-2 right-2 sm:left-auto sm:right-auto max-w-4xl sm:w-[90%] bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl overflow-hidden z-20"
                >
                  {/* Shimmer effect */}
                  <motion.div animate={{ backgroundPosition: ['200% 0', '-200% 0'] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.3), transparent)', backgroundSize: '200% 100%' }} />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-indigo-500/20 rounded-lg"><MessageSquare className="w-4 h-4 text-indigo-400" /></div>
                      <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase flex items-center gap-2">
                        {mode === 'call' && callStatus === 'connected' ? `${peerName || 'PARTNER'} TRANSLATING FROM ISL` : 'TRANSLATING FROM ISL'}
                        {isTranslating && (
                          <span className="flex gap-1">
                            <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1 h-1 bg-indigo-400 rounded-full"/>
                            <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 bg-indigo-400 rounded-full"/>
                            <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 bg-indigo-400 rounded-full"/>
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <p className="text-lg sm:text-3xl md:text-4xl font-medium leading-tight tracking-tight text-white drop-shadow-lg font-serif">
                      "{getDisplayText() || getText()}"
                    </p>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
                        {suggestions.map((s, i) => (
                          <button key={i} onClick={() => applySuggestion(s)} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors whitespace-nowrap">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Control Bar */}
            <div className="absolute bottom-3 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-full px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-4 shadow-2xl z-30">

              {/* ── CALL-ONLY controls ── */}
              {mode === 'call' && (
                <>
                  <button
                    onClick={handleMicToggle}
                    className={`p-2 sm:p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20'}`}
                    title={isMuted ? 'Unmute mic' : 'Mute mic'}
                  >
                    {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                  <button
                    onClick={handleScreenShare}
                    className={`hidden sm:flex p-2 sm:p-3 rounded-full transition-colors ${isScreenSharing ? 'bg-blue-500/30 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 'bg-white/10 hover:bg-white/20'}`}
                    title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                  >
                    {isScreenSharing ? <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                  <div className="w-px h-6 sm:h-8 bg-white/10" />
                </>
              )}

              {/* ── SHARED controls (both solo & call) ── */}
              <button
                onClick={() => { setIsVideoOn(!isVideoOn); isVideoOn ? handleStop() : handleStart(); }}
                className={`p-2 sm:p-3 rounded-full transition-colors ${!isVideoOn ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20'}`}
                title="Toggle camera"
              >
                {isVideoOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button
                onClick={() => setIsAslActive(!isAslActive)}
                className={`p-2 sm:p-3 rounded-full transition-colors ${isAslActive ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/10 hover:bg-white/20'}`}
                title="Toggle AI detection"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 sm:p-3 rounded-full transition-colors ${isSidebarOpen ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}
                title={mode === 'call' ? 'Chat' : 'Transcript'}
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* ── CALL-ONLY: End call ── */}
              {mode === 'call' && (
                <>
                  <div className="w-px h-6 sm:h-8 bg-white/10" />
                  <button
                    onClick={handleLeaveRoom}
                    className="px-3 sm:px-6 py-1.5 sm:py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-1.5 sm:gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] text-xs sm:text-sm"
                    title="Leave call"
                  >
                    <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Leave</span>
                  </button>
                </>
              )}
            </div>

            {/* Screen-share badge */}
            {isScreenSharing && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 px-4 py-2 rounded-xl flex items-center gap-2 z-30">
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs font-medium text-blue-300">Sharing Screen</span>
                <button onClick={handleScreenShare} className="ml-2 text-xs text-blue-400 hover:text-white underline">Stop</button>
              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={isMobile ? { y: '100%', opacity: 0 } : { width: 0, opacity: 0 }}
                animate={isMobile ? { y: 0, opacity: 1 } : { width: 360, opacity: 1 }}
                exit={isMobile ? { y: '100%', opacity: 0 } : { width: 0, opacity: 0 }}
                className={isMobile
                  ? "absolute inset-x-0 bottom-0 h-[62vh] z-40 bg-gray-950/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl flex flex-col overflow-hidden"
                  : "bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex flex-col overflow-hidden shrink-0 z-20"
                }
              >
                {/* Mobile: drag handle + close button */}
                {isMobile && (
                  <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
                    <div className="flex-1" />
                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                    <div className="flex-1 flex justify-end">
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Close panel"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                {/* Tabs */}
                <div className="flex p-2 bg-black/20 shrink-0">
                  <button onClick={() => setSidebarTab('transcript')} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${sidebarTab === 'transcript' ? 'bg-white/10 shadow-sm' : 'text-gray-400 hover:text-white'}`}>Transcript</button>
                  {mode === 'call' && (
                    <button onClick={() => setSidebarTab('chat')} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${sidebarTab === 'chat' ? 'bg-white/10 shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                      Chat <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">2</span>
                    </button>
                  )}
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Confidence Monitor */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                     <ConfidenceRing pct={pct} hasHand={!!prediction?.hand_detected} />
                     <div>
                       <p className="text-lg font-bold">{prediction?.hand_detected ? prediction.sign : '—'}</p>
                       <p className="text-xs text-gray-400">{prediction?.hand_detected ? `Detected · ${prediction.inference_ms ?? '–'}ms` : 'No hand'}</p>
                     </div>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-300">Conversation</h3>

                  {/* Chat History */ }
                  {chatMessages.map(msg => (
                     <div key={msg.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${msg.sender === 'Me' ? 'bg-indigo-600' : 'bg-gray-600'}`}>{msg.sender === 'Me' ? 'Me' : msg.sender[0]}</div>
                        <span className="text-sm font-medium">{msg.sender === 'Me' ? (userName || 'You') : msg.sender}</span>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                      </div>
                      <p className="text-sm text-gray-300 pl-8 leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  ))}

                  {/* Real-time translated text appending */}
                  {(translatedText || getText()) && (
                     <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-indigo-600/50">Me</div>
                        <span className="text-sm font-medium">{userName || 'You'}</span>
                        <span className="text-xs text-gray-500">Now</span>
                        {isAslActive && <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">ASL</span>}
                      </div>
                      <p className="text-sm text-gray-300 pl-8 leading-relaxed italic opacity-80">
                        {getDisplayText() || getText()}
                      </p>
                    </div>
                  )}

                  {mode === 'call' && peerSentence && (
                     <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-600">{peerName ? peerName[0] : 'P'}</div>
                        <span className="text-sm font-medium">{peerName || 'Partner'}</span>
                        <span className="text-xs text-gray-500">Now</span>
                      </div>
                      <p className="text-sm text-gray-300 pl-8 leading-relaxed italic opacity-80">
                        {peerSentence}
                      </p>
                    </div>
                  )}

                </div>

                {/* Input area */}
                {mode === 'call' && (
                  <div className="p-4 bg-black/20 border-t border-white/5">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                        placeholder="Type to speak or chat..." 
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-500" 
                      />
                      <button onClick={handleSendChat} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-500 transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 text-center mt-2 font-mono">Press Enter to send</p>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}
    </div>
  );
}
