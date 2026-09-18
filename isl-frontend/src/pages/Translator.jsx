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
import { useWebcam }           from '../hooks/useWebcam';
import { useVideoCall }         from '../hooks/useVideoCall';
import { useApp }               from '../context/AppContext';
import MeetingReadyModal        from '../components/MeetingReadyModal';

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

/* ─── VideoTile ─────────────────────────────────────────────────────────────── */
function VideoTile({ stream, name, isPinned, onPin }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
      ref.current.play?.().catch(() => {});
    }
  }, [stream]);

  return (
    <div
      onClick={onPin}
      className={`relative w-full h-full min-h-0 rounded-2xl overflow-hidden bg-gray-900/80 cursor-pointer border-2 transition-all duration-200 ${
        isPinned
          ? 'border-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.5)]'
          : 'border-white/10 hover:border-white/30'
      }`}
      title={isPinned ? 'Click to unpin' : 'Click to pin fullscreen'}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={false}
        className="w-full h-full object-cover"
      />
      {/* Placeholder avatar when stream not yet flowing */}
      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
          <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-300">
            {name?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-xs">Connecting…</span>
        </div>
      )}
      {/* Name label */}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium pointer-events-none">
        {name || 'Partner'}
      </div>
      {isPinned && (
        <div className="absolute top-3 right-3 bg-indigo-500/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold pointer-events-none">
          Pinned
        </div>
      )}
    </div>
  );
}

/* ─── VideoGrid ─────────────────────────────────────────────────────────────── */
// Auto-adjusting grid for remote peers (local video is always a separate PiP).
// When a peer is pinned: featured (big) + strip (others on right).
// When nothing pinned: equal-size CSS grid.
function VideoGrid({ remotePeers, pinnedPeerId, onPinToggle }) {
  const peerList = [...remotePeers.entries()]; // [[id, {stream,name}], ...]

  if (peerList.length === 0) return null;

  // ── Featured + strip layout when a tile is pinned ──────────────────────────
  if (pinnedPeerId && remotePeers.has(pinnedPeerId)) {
    const pinned = remotePeers.get(pinnedPeerId);
    const others = peerList.filter(([id]) => id !== pinnedPeerId);
    return (
      <div className="absolute inset-0 flex gap-3">
        {/* Pinned tile — takes the bulk of the space */}
        <div className="flex-1 min-w-0">
          <VideoTile
            stream={pinned.stream}
            name={pinned.name || 'Partner'}
            isPinned
            onPin={() => onPinToggle(null)}
          />
        </div>
        {/* Side strip — other remote peers */}
        {others.length > 0 && (
          <div className="flex flex-col gap-3 w-48 shrink-0">
            {others.map(([id, peer]) => (
              <div key={id} className="flex-1 min-h-0">
                <VideoTile
                  stream={peer.stream}
                  name={peer.name || 'Partner'}
                  isPinned={false}
                  onPin={() => onPinToggle(id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Equal grid — no pin ────────────────────────────────────────────────────
  // Column count: 1 → 1 col, 2 → 2 cols, 3-4 → 2 cols, 5 → 3 cols
  const count = peerList.length;
  const cols  = count <= 1 ? 1 : count <= 4 ? 2 : 3;

  return (
    <div
      className="absolute inset-0"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '12px',
      }}
    >
      {peerList.map(([id, peer]) => (
        <VideoTile
          key={id}
          stream={peer.stream}
          name={peer.name || 'Partner'}
          isPinned={false}
          onPin={() => onPinToggle(id)}
        />
      ))}
    </div>
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
    status: callStatus, myId,
    remotePeers,
    peerSentence, peerWord, peerSuggestion, peerName, peerChat,
    joinRoom, leaveRoom, sendTranslation, sendSuggestion, sendChatMessage,
    replaceVideoTrack,
  } = useVideoCall();

  const { addToHistory, showToast, getSuggestions } = useApp();

  const [mode, setMode]               = useState('solo');
  const [roomInput, setRoomInput]     = useState('');
  const [inRoom, setInRoom]           = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [pinnedPeerId, setPinnedPeerId]         = useState(null); // peerId pinned to fullscreen, null = equal grid
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

  // Show "Your meeting's ready" modal when host is alone waiting for others.
  // Auto-dismiss once the first person joins.
  useEffect(() => {
    if (callStatus === 'waiting' && remotePeers.size === 0) {
      setShowMeetingModal(true);
    }
    if (remotePeers.size > 0) {
      setShowMeetingModal(false);
    }
  }, [callStatus, remotePeers.size]);

  const handleLeaveRoom = () => {
    leaveRoom();
    setInRoom(false);
    setRoomInput('');
    setShowMeetingModal(false);
  };


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
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      // Restore camera track on all peer connections
      const camStream = getStream();
      if (camStream) {
        const videoTrack = camStream.getVideoTracks()[0];
        if (videoTrack) replaceVideoTrack(videoTrack);
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
      // Replace video track on every peer connection at once
      replaceVideoTrack(screenTrack);
      // Auto-stop when user clicks browser's 'Stop sharing'
      screenTrack.onended = () => {
        screenStreamRef.current = null;
        setIsScreenSharing(false);
        const camStream = getStream();
        if (camStream) {
          const videoTrack = camStream.getVideoTracks()[0];
          if (videoTrack) replaceVideoTrack(videoTrack);
        }
      };
      setIsScreenSharing(true);
    } catch (err) {
      if (err.name !== 'NotAllowedError') console.warn('Screen share error:', err);
    }
  }, [isScreenSharing, getStream, replaceVideoTrack]);

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
  // RENDER — Light Theme (Drishya Vaani)
  // ═══════════════════════════════════════════════════════════════════════════

  const PAGE_BG = 'linear-gradient(160deg, #faf8ff 0%, #eef2ff 45%, #fdf6ff 100%)';
  const GLASS   = 'rgba(255,255,255,0.72)';
  const GLASS_B = '1px solid rgba(196,181,253,0.28)';
  const ACCENT  = '#7c3aed';
  const TEXT    = '#1e1b4b';
  const MUTED   = '#64748b';
  const FAINT   = '#94a3b8';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: PAGE_BG, color: TEXT, overflow: 'hidden', position: 'relative', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {showMeetingModal && (
        <MeetingReadyModal roomCode={roomInput} onDismiss={() => setShowMeetingModal(false)} />
      )}

      <div aria-hidden="true" style={{ position: 'absolute', width: 600, height: 600, top: -200, left: -200, borderRadius: '50%', filter: 'blur(90px)', background: 'radial-gradient(circle, rgba(196,181,253,0.28) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div aria-hidden="true" style={{ position: 'absolute', width: 500, height: 500, bottom: -150, right: -100, borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(circle, rgba(186,230,255,0.22) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* HEADER */}
      <header style={{ position: 'relative', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(196,181,253,0.2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: '14px', padding: '0.45rem 1rem' }}>
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
              <Video style={{ width: 15, height: 15, color: ACCENT }} />
            </motion.div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: TEXT }}>Drishya Vaani</span>
          </div>
          {(isActive || backendReady) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: '9999px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.22)' }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669' }}>SignSync™ Active</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: '12px', padding: '3px' }}>
            {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
              <button key={code} onClick={() => setLanguage(code)} style={{ padding: '0.3rem 0.85rem', borderRadius: '9px', fontSize: '0.72rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.18s', background: language === code ? ACCENT : 'transparent', color: language === code ? '#fff' : MUTED, boxShadow: language === code ? '0 2px 12px rgba(124,58,237,0.3)' : 'none' }}>{cfg.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: '12px', padding: '3px' }}>
            {[{ id: 'solo', label: 'Solo', icon: User }, { id: 'call', label: 'Call', icon: Users }].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => handleModeSwitch(id)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.85rem', borderRadius: '9px', fontSize: '0.72rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.18s', background: mode === id ? ACCENT : 'transparent', color: mode === id ? '#fff' : MUTED, boxShadow: mode === id ? '0 2px 12px rgba(124,58,237,0.3)' : 'none' }}>
                <Icon style={{ width: 12, height: 12 }} /> {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.85rem', borderRadius: '9999px', background: 'rgba(5,150,105,0.07)', border: '1px solid rgba(5,150,105,0.2)' }}>
            <Sparkles style={{ width: 11, height: 11, color: '#059669' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#059669' }}>End-to-end Encrypted</span>
          </div>
          <div style={{ padding: '0.35rem 0.85rem', borderRadius: '10px', background: GLASS, border: GLASS_B, fontSize: '0.8rem', fontWeight: 600, color: TEXT }}>{currentTime}</div>
        </div>
      </header>

      {/* LOBBY */}
      {!inRoom && mode === 'call' ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: GLASS, backdropFilter: 'blur(24px)', border: GLASS_B, borderRadius: '28px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 24px 80px rgba(124,58,237,0.1)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ margin: '0 auto 1rem', width: 52, height: 52, borderRadius: '16px', background: 'rgba(124,58,237,0.08)', border: '1.5px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users style={{ color: ACCENT, width: 22, height: 22 }} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: TEXT, marginBottom: '0.4rem' }}>Join Session</h2>
              <p style={{ fontSize: '0.84rem', color: MUTED }}>Enter your name and room code to connect.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Your Name"
                style={{ background: 'rgba(124,58,237,0.04)', border: '1.5px solid rgba(124,58,237,0.18)', borderRadius: '14px', padding: '0.75rem 1rem', fontSize: '0.88rem', color: TEXT, outline: 'none' }} />
              <input value={roomInput} onChange={e => setRoomInput(normalizeRoomCode(e.target.value))} onKeyDown={e => e.key === 'Enter' && handleJoinRoom()} placeholder="ROOM CODE" maxLength={8}
                style={{ background: 'rgba(124,58,237,0.04)', border: '1.5px solid rgba(124,58,237,0.18)', borderRadius: '14px', padding: '0.75rem 1rem', fontSize: '0.92rem', fontWeight: 700, letterSpacing: '0.18em', textAlign: 'center', fontFamily: 'monospace', color: TEXT, outline: 'none', textTransform: 'uppercase' }} />
              <motion.button onClick={handleJoinRoom} whileHover={{ scale: 1.02, boxShadow: '0 12px 36px rgba(124,58,237,0.3)' }} whileTap={{ scale: 0.97 }}
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', borderRadius: '14px', padding: '0.85rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                Join Call
              </motion.button>
            </div>
          </motion.div>
        </div>
      ) : (
        /* MAIN LAYOUT */
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '0.85rem', gap: '0.85rem', position: 'relative', zIndex: 10 }}>

          {/* VIDEO AREA */}
          <div style={{ flex: 1, position: 'relative', borderRadius: '24px', overflow: 'hidden', background: 'rgba(12,9,35,0.94)', border: '1.5px solid rgba(196,181,253,0.22)', boxShadow: '0 20px 60px rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {mode === 'call' ? (
              <>
                {remotePeers.size > 0 ? (
                  <VideoGrid remotePeers={remotePeers} pinnedPeerId={pinnedPeerId} onPinToggle={setPinnedPeerId} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: FAINT, zIndex: 10 }}>
                    <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: '0.9rem' }}>{callStatus === 'waiting' ? 'Waiting for others…' : 'Connecting…'}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', backfaceVisibility: 'hidden' }} />
                <canvas ref={canvasRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} />
                {!isActive && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', background: 'rgba(12,9,35,0.85)', zIndex: 10 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '20px', background: 'rgba(124,58,237,0.15)', border: '2px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Video style={{ color: '#a78bfa', width: 30, height: 30 }} />
                    </div>
                    <p style={{ color: FAINT, fontSize: '0.88rem' }}>Camera is off</p>
                    <motion.button onClick={handleStart} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', borderRadius: '100px', padding: '0.75rem 2rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                      Start Camera
                    </motion.button>
                  </div>
                )}
              </>
            )}

            {/* Bottom gradient */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, rgba(10,8,30,0.95) 0%, rgba(10,8,30,0.5) 45%, transparent 100%)', pointerEvents: 'none', zIndex: 5 }} />

            {/* Participant badge */}
            {mode === 'call' && remotePeers.size > 0 && (
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '12px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
                  {[1,2,3,4,5].map(i => <motion.div key={i} animate={{ height: ['4px','12px','4px'] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }} style={{ width: 3, background: '#34d399', borderRadius: 2 }} />)}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#fff' }}>{remotePeers.size === 1 ? (peerName || 'Partner') : `${remotePeers.size + 1} participants`}</span>
              </div>
            )}

            {/* AI Tracking badge */}
            {(mode === 'solo' || (mode === 'call' && remotePeers.size > 0)) && isAslActive && (
              <div style={{ position: 'absolute', top: '1rem', ...(mode === 'call' ? { left: '10.5rem' } : { right: '1rem' }), background: 'rgba(124,58,237,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(167,139,250,0.35)', borderRadius: '10px', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem', zIndex: 10 }}>
                <Sparkles style={{ width: 13, height: 13, color: '#a78bfa' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#c4b5fd' }}>AI Tracking Active</span>
              </div>
            )}

            {/* Local PiP */}
            {mode === 'call' && (
              <motion.div drag dragConstraints={{ left: -800, right: 0, top: 0, bottom: 400 }}
                style={{ position: 'absolute', top: '1rem', right: '1rem', width: 176, aspectRatio: '3/4', background: '#1a1528', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(196,181,253,0.3)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', cursor: 'move', zIndex: 20 }}
                whileHover={{ borderColor: 'rgba(167,139,250,0.6)' }}>
                <video ref={el => { videoRef.current = el; if (el && getStream() && el.srcObject !== getStream()) el.srcObject = getStream(); }} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '0.6rem', left: '0.6rem', right: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
                  <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 500, color: '#fff' }}>{userName || 'You'}</div>
                  {isMuted && <div style={{ background: 'rgba(239,68,68,0.8)', borderRadius: '50%', padding: '4px', display: 'flex' }}><VolumeX style={{ width: 10, height: 10, color: '#fff' }} /></div>}
                </div>
              </motion.div>
            )}

            {/* Translation overlay */}
            <AnimatePresence>
              {(sentence.length > 0 || translatedText) && isAslActive && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  style={{ position: 'absolute', bottom: '5.5rem', width: 'calc(100% - 3rem)', maxWidth: 760, background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(24px)', border: '1px solid rgba(196,181,253,0.25)', borderRadius: '20px', padding: '1.25rem 1.5rem', overflow: 'hidden', zIndex: 20 }}>
                  <motion.div animate={{ backgroundPosition: ['200% 0', '-200% 0'] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none', background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.5), transparent)', backgroundSize: '200% 100%' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <div style={{ padding: '0.3rem', background: 'rgba(124,58,237,0.2)', borderRadius: '8px' }}><MessageSquare style={{ width: 13, height: 13, color: '#a78bfa' }} /></div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {mode === 'call' && remotePeers.size > 0 ? `${peerName || 'PARTNER'} TRANSLATING FROM ISL` : 'TRANSLATING FROM ISL'}
                        {isTranslating && (
                          <span style={{ display: 'flex', gap: 3 }}>
                            {[0, 0.2, 0.4].map((d, i) => <motion.span key={i} animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d }} style={{ width: 4, height: 4, borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />)}
                          </span>
                        )}
                      </span>
                    </div>
                    <p style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.5rem)', fontWeight: 500, color: '#fff', lineHeight: 1.25, fontFamily: "'Playfair Display', Georgia, serif" }}>"{getDisplayText() || getText()}"</p>
                    {suggestions.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', overflowX: 'auto', paddingBottom: '2px' }}>
                        {suggestions.map((s, i) => <button key={i} onClick={() => applySuggestion(s)} style={{ padding: '0.35rem 0.9rem', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer', whiteSpace: 'nowrap' }}>{s}</button>)}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating control bar */}
            <div style={{ position: 'absolute', bottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '9999px', padding: '0.5rem 1rem', zIndex: 30 }}>
              {mode === 'call' && (
                <>
                  <CtrlBtn active={isMuted} activeColor="rgba(239,68,68,0.25)" activeIconColor="#f87171" title={isMuted ? 'Unmute mic' : 'Mute mic'} onClick={handleMicToggle}>
                    {isMuted ? <MicOff style={{ width: 18, height: 18 }} /> : <Mic style={{ width: 18, height: 18 }} />}
                  </CtrlBtn>
                  <CtrlBtn active={isScreenSharing} activeColor="rgba(59,130,246,0.25)" activeIconColor="#60a5fa" title={isScreenSharing ? 'Stop sharing' : 'Share screen'} onClick={handleScreenShare}>
                    {isScreenSharing ? <MonitorOff style={{ width: 18, height: 18 }} /> : <Monitor style={{ width: 18, height: 18 }} />}
                  </CtrlBtn>
                  {inRoom && (
                    <CtrlBtn title="Share meeting link" onClick={() => setShowMeetingModal(true)}>
                      <Link2 style={{ width: 18, height: 18 }} />
                    </CtrlBtn>
                  )}
                  <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.18)' }} />
                </>
              )}
              <CtrlBtn active={!isVideoOn} activeColor="rgba(239,68,68,0.25)" activeIconColor="#f87171" title="Toggle camera" onClick={() => { setIsVideoOn(!isVideoOn); isVideoOn ? handleStop() : handleStart(); }}>
                {isVideoOn ? <Video style={{ width: 18, height: 18 }} /> : <VideoOff style={{ width: 18, height: 18 }} />}
              </CtrlBtn>
              <motion.button onClick={() => setIsAslActive(!isAslActive)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} title="Toggle AI detection"
                style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: isAslActive ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isAslActive ? '0 0 20px rgba(124,58,237,0.55)' : 'none', transition: 'all 0.25s' }}>
                <Sparkles style={{ width: 18, height: 18 }} />
              </motion.button>
              <CtrlBtn active={isSidebarOpen} activeColor="rgba(255,255,255,0.2)" title="Transcript / Chat" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <MessageSquare style={{ width: 18, height: 18 }} />
              </CtrlBtn>
              {mode === 'call' && (
                <>
                  <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.18)' }} />
                  <motion.button onClick={handleLeaveRoom} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '9999px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                    <PhoneOff style={{ width: 14, height: 14 }} /> Leave
                  </motion.button>
                </>
              )}
            </div>

            {/* Screen share banner */}
            {isScreenSharing && (
              <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(59,130,246,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '12px', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 30 }}>
                <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#60a5fa' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#93c5fd' }}>Sharing Screen</span>
                <button onClick={handleScreenShare} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}>Stop</button>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: GLASS, backdropFilter: 'blur(24px)', border: GLASS_B, borderRadius: '22px', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, zIndex: 20, boxShadow: '0 12px 48px rgba(124,58,237,0.08)' }}>
                <div style={{ display: 'flex', padding: '0.5rem', background: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(196,181,253,0.18)', gap: '0.25rem' }}>
                  <TabBtn active={sidebarTab === 'transcript'} onClick={() => setSidebarTab('transcript')}>Transcript</TabBtn>
                  {mode === 'call' && <TabBtn active={sidebarTab === 'chat'} onClick={() => setSidebarTab('chat')}>Chat</TabBtn>}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.88)', border: '1.5px solid rgba(196,181,253,0.22)', borderRadius: '18px', padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 12px rgba(124,58,237,0.06)' }}>
                    <ConfidenceRing pct={pct} hasHand={!!prediction?.hand_detected} />
                    <div>
                      <p style={{ fontSize: '1.05rem', fontWeight: 700, color: TEXT, marginBottom: '0.15rem' }}>{prediction?.hand_detected ? prediction.sign : '—'}</p>
                      <p style={{ fontSize: '0.72rem', color: FAINT }}>{prediction?.hand_detected ? `Detected · ${prediction.inference_ms ?? '–'}ms` : 'No hand detected'}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa' }}>Conversation</p>
                  {chatMessages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: msg.sender === 'Me' ? ACCENT : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{msg.sender === 'Me' ? 'Me' : msg.sender[0]}</div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT }}>{msg.sender === 'Me' ? (userName || 'You') : msg.sender}</span>
                        <span style={{ fontSize: '0.66rem', color: FAINT }}>{msg.time}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: MUTED, paddingLeft: '2rem', lineHeight: 1.6 }}>{msg.text}</p>
                    </div>
                  ))}
                  {(translatedText || getText()) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(124,58,237,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: '#fff' }}>Me</div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT }}>{userName || 'You'}</span>
                        <span style={{ fontSize: '0.66rem', color: FAINT }}>Now</span>
                        {isAslActive && <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(124,58,237,0.08)', color: ACCENT, border: '1px solid rgba(124,58,237,0.22)', borderRadius: '5px', padding: '1px 6px' }}>ASL</span>}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: MUTED, paddingLeft: '2rem', lineHeight: 1.6, fontStyle: 'italic', opacity: 0.9 }}>{getDisplayText() || getText()}</p>
                    </div>
                  )}
                  {mode === 'call' && peerSentence && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: '#fff' }}>{peerName ? peerName[0] : 'P'}</div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT }}>{peerName || 'Partner'}</span>
                        <span style={{ fontSize: '0.66rem', color: FAINT }}>Now</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: MUTED, paddingLeft: '2rem', lineHeight: 1.6, fontStyle: 'italic', opacity: 0.9 }}>{peerSentence}</p>
                    </div>
                  )}
                  {(sentence.length > 0 || translatedText) && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      {[
                        { icon: Copy,    label: 'Copy',  action: handleCopy  },
                        { icon: Save,    label: 'Save',  action: handleSave  },
                        { icon: isSpeaking ? VolumeX : Volume2, label: isSpeaking ? 'Stop' : 'Speak', action: handleSpeak },
                        { icon: RotateCcw, label: 'Reset', action: handleReset },
                      ].map(({ icon: Icon, label, action }) => (
                        <motion.button key={label} onClick={action} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', borderRadius: '9999px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)', color: ACCENT, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                          <Icon style={{ width: 12, height: 12 }} /> {label}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
                {mode === 'call' && (
                  <div style={{ padding: '0.85rem', borderTop: '1px solid rgba(196,181,253,0.18)', background: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ position: 'relative' }}>
                      <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="Type to speak or chat…"
                        style={{ width: '100%', background: 'rgba(124,58,237,0.04)', border: '1.5px solid rgba(124,58,237,0.18)', borderRadius: '14px', paddingLeft: '1rem', paddingRight: '3rem', paddingTop: '0.7rem', paddingBottom: '0.7rem', fontSize: '0.84rem', color: TEXT, outline: 'none', boxSizing: 'border-box' }} />
                      <button onClick={handleSendChat} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Send style={{ width: 14, height: 14, color: '#fff' }} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.62rem', color: FAINT, textAlign: 'center', marginTop: '0.4rem', fontFamily: 'monospace' }}>Press Enter to send</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.22); border-radius: 9999px; }
      `}</style>
    </div>
  );
}

function CtrlBtn({ children, onClick, title, active = false, activeColor = 'rgba(255,255,255,0.2)', activeIconColor }) {
  return (
    <motion.button onClick={onClick} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }} title={title}
      style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', background: active ? activeColor : 'rgba(255,255,255,0.08)', color: active && activeIconColor ? activeIconColor : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.18s, color 0.18s' }}>
      {children}
    </motion.button>
  );
}

function TabBtn({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '0.45rem 0.75rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: active ? 'rgba(124,58,237,0.12)' : 'transparent', color: active ? '#7c3aed' : '#94a3b8', transition: 'all 0.18s' }}>
      {children}
    </button>
  );
}
