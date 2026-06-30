// /**
//  * Translator.jsx — MudraVani ISL Translator (v3 — Premium UI)
//  * Modes:
//  *   solo — single-user translator with live webcam ML detection
//  *   call — 2-user video call with real-time ISL translation relay
//  *
//  * Suggestion-share fix: when user selects a grammar suggestion in call mode,
//  * it is relayed to the partner via a 'suggestion' type message on the chat WS.
//  */

// import { useState, useCallback, useEffect, useRef } from 'react';
// import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
// import {
//   Video, VideoOff, RotateCcw, Copy, Save, Volume2, VolumeX,
//   AlertCircle, Wifi, WifiOff, Lightbulb,
//   Phone, PhoneOff, Users, User, Link2, Loader2, UserCheck,
//   Sparkles, Zap, MessageSquare, CheckCircle2, Send, Settings, Monitor, MonitorOff, Mic, MicOff, Maximize2, Minimize2,
// } from 'lucide-react';
// import { useWebcam }    from '../hooks/useWebcam';
// import { useVideoCall } from '../hooks/useVideoCall';
// import { useApp }       from '../context/AppContext';

// const MIN_CONFIDENCE = 0.60;

// // ── Language config ────────────────────────────────────────────────────────────
// const LANG_CONFIG = {
//   en: { label: 'EN', full: 'English',  bcp47: 'en-IN', mmLang: 'en',   voiceHints: ['en-IN', 'en_IN', 'English India', 'Ravi', 'Lekha'] },
//   hi: { label: 'HI', full: 'Hindi',    bcp47: 'hi-IN', mmLang: 'hi',   voiceHints: ['hi-IN', 'hi_IN', 'Hindi',  'Lekha'] },
//   mr: { label: 'MR', full: 'Marathi',  bcp47: 'mr-IN', mmLang: 'mr',   voiceHints: ['mr-IN', 'mr_IN', 'Marathi'] },
// };

// // ── Translation — Google Translate (primary) + MyMemory (fallback) ───────────
// // Google Translate unofficial endpoint always returns the target script (Devanagari)
// async function translateViaGoogle(text, targetLang) {
//   const tl = LANG_CONFIG[targetLang]?.mmLang || targetLang; // 'hi', 'mr', etc.
//   // Use the unofficial single-text endpoint (no API key needed)
//   const url =
//     `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}` +
//     `&dt=t&q=${encodeURIComponent(text)}`;
//   const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
//   if (!res.ok) throw new Error(`Google HTTP ${res.status}`);
//   const data = await res.json();
//   // Response shape: [ [[translated, original, ...], ...], ... ]
//   if (Array.isArray(data) && Array.isArray(data[0])) {
//     const translated = data[0]
//       .filter(Boolean)
//       .map(chunk => chunk[0])
//       .join('')
//       .trim();
//     if (translated) return translated;
//   }
//   throw new Error('Empty response');
// }

// async function translateViaMyMemory(text, targetLang) {
//   const langPair = `en|${LANG_CONFIG[targetLang]?.mmLang || targetLang}`;
//   const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
//   const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
//   if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
//   const data = await res.json();
//   if (data.responseStatus === 200 && data.responseData?.translatedText) {
//     return cleanDevanagari(data.responseData.translatedText, targetLang);
//   }
//   if (data.matches?.length) return cleanDevanagari(data.matches[0].translation || text, targetLang);
//   throw new Error('No translation');
// }

// async function translateText(text, targetLang) {
//   if (!text || targetLang === 'en') return text;
//   try {
//     // Primary: Google Translate (always gives Devanagari for hi/mr)
//     return await translateViaGoogle(text, targetLang);
//   } catch (err) {
//     console.warn('[translateText] Google failed, trying MyMemory:', err.message);
//     try {
//       return await translateViaMyMemory(text, targetLang);
//     } catch (err2) {
//       console.warn('[translateText] MyMemory also failed:', err2.message);
//       return text; // graceful fallback
//     }
//   }
// }

// // ── Extract Devanagari from mixed MyMemory responses ─────────────────────────
// // Only needed as a fallback — Google always returns proper script.
// function cleanDevanagari(raw, targetLang) {
//   if (!raw || targetLang === 'en') return raw;
//   const isDevanagari = targetLang === 'hi' || targetLang === 'mr';
//   if (!isDevanagari) return raw;

//   // If the string already starts with Devanagari, return as-is
//   if (/^[\u0900-\u097F]/.test(raw.trim())) return raw.trim();

//   // Extract Devanagari from inside parentheses
//   const parenMatches = [...raw.matchAll(/\(([^)]+)\)/g)]
//     .map(m => m[1].trim())
//     .filter(s => /[\u0900-\u097F]/.test(s));
//   if (parenMatches.length > 0) {
//     const parts  = parenMatches.join(' ').split(',').map(s => s.trim()).filter(Boolean);
//     const unique = [...new Set(parts)];
//     return unique.join(', ');
//   }

//   // Extract all Devanagari runs
//   const runs = raw.match(/[\u0900-\u097F][\u0900-\u097F\s,।.!?]*/g);
//   if (runs) {
//     const joined = runs.join(' ').replace(/\s+/g, ' ').trim();
//     if (joined.length > 1) return joined;
//   }

//   return raw; // last resort
// }

// // ── Pick the best TTS voice for a BCP-47 tag ─────────────────────────────────
// function pickVoice(bcp47, hints) {
//   if (!window.speechSynthesis) return null;
//   const voices = window.speechSynthesis.getVoices();
//   if (!voices.length) return null;
//   // Exact locale match
//   let v = voices.find(v => v.lang === bcp47);
//   if (v) return v;
//   // Hint substring match (e.g. 'hi-IN', 'Hindi', 'Lekha')
//   for (const hint of (hints || [])) {
//     v = voices.find(v => v.lang.includes(hint) || v.name.includes(hint));
//     if (v) return v;
//   }
//   // Language prefix match
//   const prefix = bcp47.split('-')[0];
//   v = voices.find(v => v.lang.startsWith(prefix));
//   return v || null;
// }
// const HOLD_FRAMES    = 8;

// const STATUS_META = {
//   idle:       { label: 'Not in call',        color: 'var(--text-faint)', dot: 'var(--text-faint)', glow: 'transparent' },
//   connecting: { label: 'Connecting…',        color: 'var(--yellow)',     dot: 'var(--yellow)',      glow: 'var(--yellow)' },
//   waiting:    { label: 'Waiting for partner',color: 'var(--blue)',       dot: 'var(--blue)',        glow: 'var(--blue)' },
//   connected:  { label: 'Live',               color: 'var(--green)',      dot: 'var(--green)',       glow: 'var(--green)' },
//   full:       { label: 'Room full',           color: 'var(--red)',        dot: 'var(--red)',         glow: 'var(--red)' },
//   error:      { label: 'Error',               color: 'var(--red)',        dot: 'var(--red)',         glow: 'var(--red)' },
// };

// const RADIUS = 26;
// const CIRC   = 2 * Math.PI * RADIUS;

// const normalizeRoomCode = (v) =>
//   v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

// function confColor(pct) {
//   if (pct >= 90) return 'var(--green)';
//   if (pct >= 75) return 'var(--yellow)';
//   return 'var(--red)';
// }

// /* ─── Animated confidence ring ─────────────────────────────────────────────── */
// function ConfidenceRing({ pct, sign, hasHand }) {
//   const springPct = useSpring(pct, { stiffness: 120, damping: 18 });
//   const offset    = useMotionValue(CIRC);

//   useEffect(() => {
//     offset.set(CIRC - (CIRC * pct) / 100);
//   }, [pct]);

//   return (
//     <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
//       {/* Glow pulse when high confidence */}
//       {hasHand && pct >= 90 && (
//         <motion.div
//           animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
//           transition={{ duration: 1.5, repeat: Infinity }}
//           style={{
//             position: 'absolute', inset: 0, borderRadius: '50%',
//             background: 'var(--green-soft)', pointerEvents: 'none',
//           }}
//         />
//       )}
//       <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
//         <circle cx={36} cy={36} r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={5} />
//         <motion.circle
//           cx={36} cy={36} r={RADIUS} fill="none"
//           stroke={hasHand ? confColor(pct) : 'var(--text-ghost)'}
//           strokeWidth={5} strokeLinecap="round"
//           strokeDasharray={CIRC}
//           style={{ strokeDashoffset: offset }}
//         />
//       </svg>
//       <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//         <span style={{ fontSize: '0.78rem', fontWeight: 700, color: hasHand ? confColor(pct) : 'var(--text-ghost)' }}>
//           {pct}%
//         </span>
//       </div>
//     </div>
//   );
// }

// /* ─── Word chip with bounce-in ─────────────────────────────────────────────── */
// function WordChip({ word, index, color = 'accent' }) {
//   return (
//     <motion.span
//       key={`${word}-${index}`}
//       initial={{ opacity: 0, scale: 0.5, y: 8 }}
//       animate={{ opacity: 1, scale: 1, y: 0 }}
//       transition={{ type: 'spring', stiffness: 400, damping: 20 }}
//       style={{
//         padding: '3px 10px', borderRadius: 6,
//         fontSize: '0.85rem', fontWeight: 600,
//         background: color === 'accent' ? 'var(--accent-soft)' : 'var(--blue-soft)',
//         border: `1px solid ${color === 'accent' ? 'var(--accent-border)' : 'var(--blue-border)'}`,
//         color: color === 'accent' ? 'var(--accent)' : 'var(--blue)',
//       }}
//     >
//       {word}
//     </motion.span>
//   );
// }

// /* ─── Incoming suggestion toast (peer sent) ─────────────────────────────────── */
// function IncomingSuggestionBanner({ text, onDismiss }) {
//   useEffect(() => {
//     if (!text) return;
//     const t = setTimeout(onDismiss, 7000);
//     return () => clearTimeout(t);
//   }, [text, onDismiss]);

//   return (
//     <AnimatePresence>
//       {text && (
//         <motion.div
//           initial={{ opacity: 0, y: -16, scale: 0.95 }}
//           animate={{ opacity: 1, y: 0, scale: 1 }}
//           exit={{ opacity: 0, y: -12, scale: 0.95 }}
//           transition={{ type: 'spring', stiffness: 300, damping: 24 }}
//           style={{
//             background: 'linear-gradient(135deg, var(--blue-soft), var(--accent-softer))',
//             border: '1px solid var(--blue-border)',
//             borderRadius: 14, padding: '14px 18px',
//             display: 'flex', alignItems: 'flex-start', gap: 12,
//           }}
//         >
//           {/* Animated icon */}
//           <motion.div
//             animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
//             transition={{ duration: 0.6, delay: 0.1 }}
//             style={{
//               width: 36, height: 36, borderRadius: 10, flexShrink: 0,
//               background: 'var(--blue-soft)', border: '1px solid var(--blue-border)',
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//             }}
//           >
//             <MessageSquare size={16} style={{ color: 'var(--blue)' }} />
//           </motion.div>
//           <div style={{ flex: 1 }}>
//             <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
//               Partner wants to say
//             </p>
//             <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
//               "{text}"
//             </p>
//           </div>
//           <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, marginTop: 2, fontSize: 16, lineHeight: 1 }}>×</button>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }

// /* ─── Main ──────────────────────────────────────────────────────────────────── */
// export default function Translator() {
//   const {
//     videoRef, canvasRef, isActive, isDetecting, error,
//     fps, prediction, backendReady, start, stop, stopDetection,
//   } = useWebcam();

//   const {
//     localVideoRef, status: callStatus, mySlot,
//     peerSentence, peerWord, peerSuggestion, peerName, peerChat,
//     attachRemoteVideoRef, joinRoom, leaveRoom, sendTranslation, sendSuggestion, sendChatMessage,
//     getPeerConnection,
//   } = useVideoCall();

//   const { addToHistory, showToast, getSuggestions } = useApp();

//   const [mode, setMode]               = useState('solo');
//   const [roomInput, setRoomInput]     = useState('');
//   const [inRoom, setInRoom]           = useState(false);
//   const [userName, setUserName]       = useState('');
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [sidebarTab, setSidebarTab]   = useState('transcript');
//   const [isMuted, setIsMuted]         = useState(false);
//   const [isVideoOn, setIsVideoOn]     = useState(true);
//   const [isAslActive, setIsAslActive] = useState(true);
//   const [currentTime, setCurrentTime] = useState('');
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const screenStreamRef = useRef(null);
//   useEffect(() => {
//     const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})), 1000);
//     return () => clearInterval(t);
//   }, []);


//   const [sentence, setSentence]             = useState([]);
//   const [language, setLanguage]             = useState('en');
//   const [translatedText, setTranslatedText] = useState('');
//   const [isTranslating, setIsTranslating]   = useState(false);
//   const [isSpeaking, setIsSpeaking]         = useState(false);
//   const [speechRate, setSpeechRate]         = useState(1.25);  // Web Speech API: 0.1–10, 1=normal
//   const [lastWord, setLastWord]             = useState('');
//   const [holdCount, setHoldCount]           = useState(0);
//   const [suggestions, setSuggestions]       = useState([]);
//   const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  
//   // Chat and History
//   const [chatMessages, setChatMessages] = useState([]);
//   const [chatInput, setChatInput] = useState('');
//   const sentenceRef   = useRef([]);
//   const translateAbortRef = useRef(null);

//   useEffect(() => { sentenceRef.current = sentence; }, [sentence]);

//   // ── Auto-translate whenever sentence or language changes ──────────────────
//   useEffect(() => {
//     const english = sentence.map(s => s.word).join(' ');
//     if (!english) { setTranslatedText(''); return; }
//     if (language === 'en') { setTranslatedText(english); return; }
//     // Debounce: cancel previous in-flight translation
//     const timer = setTimeout(async () => {
//       setIsTranslating(true);
//       const result = await translateText(english, language);
//       setTranslatedText(result);
//       setIsTranslating(false);
//     }, 400); // wait 400ms after last word added
//     return () => clearTimeout(timer);
//   }, [sentence, language]);

//   // ── Sign detection ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!prediction?.hand_detected) { setHoldCount(0); return; }
//     const { sign, confidence } = prediction;
//     if (confidence < MIN_CONFIDENCE || sign === lastWord) { setHoldCount(0); return; }

//     setHoldCount(prev => {
//       const next = prev + 1;
//       if (next >= HOLD_FRAMES) {
//         setSentence(s => {
//           const updated = [...s, { word: sign, confidence }];
//           setSuggestions(getSuggestions(updated.map(x => x.word)));
//           if (mode === 'call' && callStatus === 'connected') {
//             sendTranslation(sign, updated.map(x => x.word).join(' '));
//           }
//           return updated;
//         });
//         setLastWord(sign);
//         return 0;
//       }
//       return next;
//     });
//   }, [prediction, lastWord, getSuggestions, mode, callStatus, sendTranslation]);

//   // ── Helpers ────────────────────────────────────────────────────────────────
//   const getText = () => sentence.map(s => s.word).join(' ');
//   const getDisplayText = () => translatedText || getText();

//   const handleStart = useCallback(async (opts) => {
//     setLastWord(''); setHoldCount(0);
//     return await start(opts);
//   }, [start]);

//   const handleStop  = useCallback(() => stop(), [stop]);

//   const handleReset = useCallback(() => {
//     setSentence([]); setLastWord(''); setHoldCount(0); setSuggestions([]); setSelectedSuggestion(null);
//     setTranslatedText(''); setIsTranslating(false);
//   }, []);

//   const handleCopy = () =>
//     navigator.clipboard.writeText(getDisplayText() || getText()).then(() => showToast('Copied!', 'success'));

//   const handleSave = () => {
//     if (!sentence.length) return showToast('Nothing to save yet', 'error');
//     const avgConf = sentence.reduce((a, s) => a + s.confidence, 0) / sentence.length;
//     addToHistory({
//       sentence: getDisplayText(),
//       originalEnglish: getText(),
//       words: sentence.map(s => s.word),
//       lang: language,
//       confidence: avgConf,
//     });
//     showToast('Saved to history ✓', 'success');
//   };

//   const handleSpeak = useCallback(() => {
//     const textToSpeak = getDisplayText();
//     if (!textToSpeak || isSpeaking) return;
//     // Cancel any ongoing speech
//     speechSynthesis.cancel();
//     const cfg = LANG_CONFIG[language] || LANG_CONFIG.en;
//     const u   = new SpeechSynthesisUtterance(textToSpeak);
//     u.lang    = cfg.bcp47;
//     // Try to find a matching Indian-accent voice
//     const doSpeak = () => {
//       const bestVoice = pickVoice(cfg.bcp47, cfg.voiceHints);
//       if (bestVoice) u.voice = bestVoice;
//       u.rate   = speechRate;
//       u.pitch  = 1.0;
//       u.volume = 1.0;
//       u.onstart = () => setIsSpeaking(true);
//       u.onend   = () => setIsSpeaking(false);
//       u.onerror = () => setIsSpeaking(false);
//       speechSynthesis.speak(u);
//     };
//     // Voices may not be loaded yet on first call — wait for them
//     if (speechSynthesis.getVoices().length > 0) {
//       doSpeak();
//     } else {
//       speechSynthesis.onvoiceschanged = () => { doSpeak(); speechSynthesis.onvoiceschanged = null; };
//     }
//   }, [language, isSpeaking, translatedText, sentence, speechRate]);

//   // Apply suggestion — and relay to partner in call mode
//   const applySuggestion = (text) => {
//     setSentence([]);
//     setSuggestions([]);
//     setSelectedSuggestion(text);
//     showToast('Suggestion applied', 'success');

//     const msg = { id: Date.now(), sender: 'Me', text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
//     setChatMessages(p => [...p, msg]);

//     // Relay the chosen suggestion to partner as a chat message
//     if (mode === 'call' && callStatus === 'connected' && sendChatMessage) {
//       sendChatMessage(text);
//     }
//   };

//   const handleSendChat = () => {
//     if (!chatInput.trim()) return;
//     const text = chatInput.trim();
//     setChatInput('');
//     const msg = { id: Date.now(), sender: 'Me', text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
//     setChatMessages(p => [...p, msg]);
//     if (mode === 'call' && callStatus === 'connected' && sendChatMessage) {
//       sendChatMessage(text);
//     }
//   };

//   useEffect(() => {
//     if (peerChat) {
//       setChatMessages(p => [...p, { id: peerChat.id, sender: peerName || 'Partner', text: peerChat.text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
//     }
//   }, [peerChat, peerName]);

//   const handleJoinRoom = async () => {
//     const roomId = normalizeRoomCode(roomInput);
//     if (!roomId) return showToast('Enter a room code', 'error');
//     setRoomInput(roomId);
//     if (!isActive) {
//       const ok = await handleStart({ detect: false });
//       if (!ok) return;
//     }
//     await joinRoom(roomId, getStream(), userName);
//     setInRoom(true);
//   };

//   const handleLeaveRoom = () => { leaveRoom(); setInRoom(false); setRoomInput(''); };

//   const handleModeSwitch = (m) => {
//     if (m === 'solo' && inRoom) handleLeaveRoom();
//     if (m === 'call') stopDetection();
//     setMode(m); handleReset();
//   };

//   // ── Real mic mute: toggle the audio track on the live stream ─────────────────
//   const handleMicToggle = useCallback(() => {
//     const stream = getStream();
//     if (stream) {
//       stream.getAudioTracks().forEach(t => { t.enabled = isMuted; }); // flip: muted=true means disable
//     }
//     setIsMuted(prev => !prev);
//   }, [getStream, isMuted]);

//   // ── Real screen share ─────────────────────────────────────────────────────────
//   const handleScreenShare = useCallback(async () => {
//     if (isScreenSharing) {
//       // Stop screen share, restore camera
//       if (screenStreamRef.current) {
//         screenStreamRef.current.getTracks().forEach(t => t.stop());
//         screenStreamRef.current = null;
//       }
//       // Replace sender track back to camera
//       const camStream = getStream();
//       if (camStream) {
//         const videoTrack = camStream.getVideoTracks()[0];
//         if (videoTrack) {
//           const pc = getPeerConnection();
//           if (pc) {
//             const sender = pc.getSenders().find(s => s.track?.kind === 'video');
//             if (sender) sender.replaceTrack(videoTrack).catch(() => {});
//           }
//         }
//       }
//       setIsScreenSharing(false);
//       return;
//     }
//     try {
//       const screenStream = await navigator.mediaDevices.getDisplayMedia({
//         video: { cursor: 'always', frameRate: 15 },
//         audio: false,
//       });
//       screenStreamRef.current = screenStream;
//       const screenTrack = screenStream.getVideoTracks()[0];
//       // Replace the sender's video track with screen
//       const pc = getPeerConnection();
//       if (pc) {
//         const sender = pc.getSenders().find(s => s.track?.kind === 'video');
//         if (sender) sender.replaceTrack(screenTrack).catch(() => {});
//       }
//       // Auto-stop when user clicks browser's 'Stop sharing'
//       screenTrack.onended = () => {
//         screenStreamRef.current = null;
//         setIsScreenSharing(false);
//       };
//       setIsScreenSharing(true);
//     } catch (err) {
//       if (err.name !== 'NotAllowedError') console.warn('Screen share error:', err);
//     }
//   }, [isScreenSharing, getPeerConnection]);

//   useEffect(() => {
//     if (mode !== 'call' || !inRoom || !isActive) return;
//     // Start detection whenever camera is active in a room, regardless of connection status
//     // so predictions are ready the moment the peer connects
//     if (!isDetecting) start();
//   }, [mode, inRoom, isActive, isDetecting, start]);


//   useEffect(() => stop, [stop]);

//   // ── Derived ────────────────────────────────────────────────────────────────
//   const pct  = prediction ? Math.round(prediction.confidence * 100) : 0;
//   const meta = STATUS_META[callStatus] || STATUS_META.idle;

//   // ═══════════════════════════════════════════════════════════════════════════
//   // RENDER
//   // ═══════════════════════════════════════════════════════════════════════════
  
//   // Render variables
//   return (
//     <div className="flex flex-col h-full bg-[#050505] text-white overflow-hidden relative font-sans">
      
//       {/* Subtle Glowing Background Orbs */}
//       <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
//       <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

//       {/* HEADER */}
//       <header className="relative z-50 shrink-0">
//         {/* Row 1: Branding + Right controls */}
//         <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
//           {/* Left: Branding & live indicator */}
//           <div className="flex items-center gap-2 md:gap-4">
//             <div className="flex items-center gap-2 md:gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-3 md:px-4 py-2 rounded-2xl">
//               <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="p-1.5 bg-indigo-500/20 rounded-lg">
//                 <Video className="w-4 h-4 text-indigo-400" />
//               </motion.div>
//               <h1 className="font-semibold text-sm tracking-wide">Drishya Vaani</h1>
//             </div>
//             {(isActive || backendReady) && (
//               <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
//                 <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-emerald-500" />
//                 <span className="text-xs font-medium text-emerald-400">SignSync™ Active</span>
//               </div>
//             )}
//           </div>

//           {/* Center (desktop only): Language & Mode switchers */}
//           <div className="hidden md:flex items-center gap-4">
//             <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
//               {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
//                 <button key={code} onClick={() => setLanguage(code)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${language === code ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>
//                   {cfg.label}
//                 </button>
//               ))}
//             </div>
//             <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
//               {[{ id: 'solo', label: 'Solo', icon: User }, { id: 'call', label: 'Call', icon: Users }].map(({ id, label, icon: Icon }) => (
//                 <button key={id} onClick={() => handleModeSwitch(id)} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === id ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>
//                   <Icon className="w-3.5 h-3.5" /> {label}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Right: Time + mobile live dot */}
//           <div className="flex items-center gap-2 md:gap-3">
//             {(isActive || backendReady) && (
//               <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="flex sm:hidden w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
//             )}
//             <div className="hidden md:flex px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
//               End-to-end Encrypted
//             </div>
//             <div className="text-[10px] md:text-sm font-medium text-gray-300 bg-white/5 px-2 md:px-3 py-1.5 rounded-xl border border-white/10">
//               {currentTime}
//             </div>
//           </div>
//         </div>

//         {/* Row 2 (mobile only): Language & Mode switchers */}
//         <div className="flex md:hidden items-center justify-center gap-3 pb-2 px-4">
//           <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
//             {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
//               <button key={code} onClick={() => setLanguage(code)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${language === code ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>
//                 {cfg.label}
//               </button>
//             ))}
//           </div>
//           <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
//             {[{ id: 'solo', label: 'Solo', icon: User }, { id: 'call', label: 'Call', icon: Users }].map(({ id, label, icon: Icon }) => (
//               <button key={id} onClick={() => handleModeSwitch(id)} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${mode === id ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>
//                 <Icon className="w-3 h-3" /> {label}
//               </button>
//             ))}
//           </div>
//         </div>
//       </header>

//       {/* LOBBY OR MAIN CALL */}
//       {!inRoom && mode === 'call' ? (
//         <div className="flex-1 flex items-center justify-center relative z-10">
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-[2rem] w-full max-w-md mx-4 sm:mx-0 shadow-2xl flex flex-col gap-6">
//             <div className="text-center">
//               <div className="mx-auto w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/30">
//                 <Users className="text-indigo-400 w-6 h-6" />
//               </div>
//               <h2 className="text-2xl font-semibold mb-2">Join Session</h2>
//               <p className="text-sm text-gray-400">Enter your name and the room code to connect.</p>
//             </div>
            
//             <div className="flex flex-col gap-4">
//               <input
//                 value={userName}
//                 onChange={e => setUserName(e.target.value)}
//                 placeholder="Your Name"
//                 className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
//               />
//               <input
//                 value={roomInput}
//                 onChange={e => setRoomInput(normalizeRoomCode(e.target.value))}
//                 onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
//                 placeholder="ROOM CODE"
//                 maxLength={8}
//                 className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors uppercase tracking-widest text-center font-mono font-bold"
//               />
//               <motion.button onClick={handleJoinRoom} className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
//                 Join Call
//               </motion.button>
//             </div>
//           </motion.div>
//         </div>
//       ) : (
//         <div className="flex-1 flex overflow-hidden px-2 sm:px-4 pb-2 sm:pb-4 gap-4 relative z-10">
          
//           {/* MAIN VIDEO AREA */}
//           <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-white/10 bg-black/40 shadow-2xl flex items-center justify-center">
            
//             {/* The Main Video Stream (Remote in Call, Local in Solo) */}
//             {mode === 'call' ? (
//               <>
//                 <video 
//                   ref={attachRemoteVideoRef} 
//                   autoPlay 
//                   playsInline 
//                   className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${callStatus === 'connected' ? 'opacity-100' : 'opacity-0'}`} 
//                 />
//                 {callStatus !== 'connected' && (
//                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-400 z-10">
//                     <Loader2 className="w-8 h-8 animate-spin" />
//                     <p>{callStatus === 'waiting' ? 'Waiting for partner to join...' : 'Connecting...'}</p>
//                   </div>
//                 )}
//               </>
//             ) : (
//                <>
//                   {/* Video — mirrored for self-view */}
//                   <video
//                     ref={videoRef}
//                     autoPlay
//                     playsInline
//                     muted
//                     style={{ backfaceVisibility: 'hidden' }}
//                     className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
//                   />
//                   {/* Canvas is HIDDEN — only used for ML frame capture, not display */}
//                   <canvas
//                     ref={canvasRef}
//                     style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
//                   />
//                   {!isActive && (
//                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 z-10">
//                        <button onClick={handleStart} className="bg-indigo-600 px-6 py-3 rounded-full font-medium hover:bg-indigo-500">Start Camera</button>
//                     </div>
//                   )}
//                </>
//             )}

//             {/* Dark gradient for text readability */}
//             <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

//             {/* Top Left Name Tag (Call mode) */}
//             {mode === 'call' && callStatus === 'connected' && (
//               <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
//                 <div className="flex items-end gap-1 h-3">
//                   {[1,2,3,4,5].map(i => (
//                     <motion.div key={i} animate={{ height: ['4px', '12px', '4px'] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }} className="w-1 bg-emerald-400 rounded-full" />
//                   ))}
//                 </div>
//                 <span className="text-sm font-medium">{peerName || 'Partner'}</span>
//               </div>
//             )}

//             {/* Top Right Tracking Badge */}
//             {(mode === 'solo' || (mode === 'call' && callStatus === 'connected')) && isAslActive && (
//               <div className={`absolute top-6 ${mode === 'call' ? 'left-40' : 'right-6'} bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2`}>
//                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
//                  <span className="text-xs font-medium text-indigo-300">AI Tracking Active</span>
//               </div>
//             )}

//             {/* PiP Local Video (Call mode) */}
//             {mode === 'call' && (
//               <motion.div 
//                 drag dragConstraints={{ left: -400, right: 0, top: 0, bottom: 400 }}
//                 className="absolute top-3 sm:top-6 right-3 sm:right-6 w-20 sm:w-36 md:w-56 aspect-[3/4] bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden border border-white/20 sm:border-2 shadow-2xl cursor-move z-20"
//               >
//                 <video ref={(el) => {
//                   videoRef.current = el;
//                   localVideoRef.current = el;
//                   if (el && getStream() && el.srcObject !== getStream()) el.srcObject = getStream();
//                 }} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                
//                 <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
//                   <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
//                     {userName || 'You'}
//                   </div>
//                   {isMuted && <div className="bg-red-500/80 p-1.5 rounded-full"><VolumeX className="w-3 h-3" /></div>}
//                 </div>
//               </motion.div>
//             )}

//             {/* Real-time Translation Overlay */}
//             <AnimatePresence>
//               {(sentence.length > 0 || translatedText) && isAslActive && (
//                 <motion.div 
//                   initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
//                   className="absolute bottom-16 sm:bottom-28 left-2 right-2 sm:left-auto sm:right-auto max-w-4xl sm:w-[90%] bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl overflow-hidden z-20"
//                 >
//                   {/* Shimmer effect */}
//                   <motion.div animate={{ backgroundPosition: ['200% 0', '-200% 0'] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.3), transparent)', backgroundSize: '200% 100%' }} />
                  
//                   <div className="relative z-10">
//                     <div className="flex items-center gap-2 mb-3">
//                       <div className="p-1.5 bg-indigo-500/20 rounded-lg"><MessageSquare className="w-4 h-4 text-indigo-400" /></div>
//                       <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase flex items-center gap-2">
//                         {mode === 'call' && callStatus === 'connected' ? `${peerName || 'PARTNER'} TRANSLATING FROM ISL` : 'TRANSLATING FROM ISL'}
//                         {isTranslating && (
//                           <span className="flex gap-1">
//                             <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1 h-1 bg-indigo-400 rounded-full"/>
//                             <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 bg-indigo-400 rounded-full"/>
//                             <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 bg-indigo-400 rounded-full"/>
//                           </span>
//                         )}
//                       </span>
//                     </div>
                    
//                     <p className="text-lg sm:text-3xl md:text-4xl font-medium leading-tight tracking-tight text-white drop-shadow-lg font-serif">
//                       "{getDisplayText() || getText()}"
//                     </p>

//                     {/* Suggestions */}
//                     {suggestions.length > 0 && (
//                       <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
//                         {suggestions.map((s, i) => (
//                           <button key={i} onClick={() => applySuggestion(s)} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors whitespace-nowrap">
//                             {s}
//                           </button>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Floating Control Bar */}
//             <div className="absolute bottom-3 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-full px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-4 shadow-2xl z-30">

//               {/* ── CALL-ONLY controls ── */}
//               {mode === 'call' && (
//                 <>
//                   <button
//                     onClick={handleMicToggle}
//                     className={`p-2 sm:p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20'}`}
//                     title={isMuted ? 'Unmute mic' : 'Mute mic'}
//                   >
//                     {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
//                   </button>
//                   <button
//                     onClick={handleScreenShare}
//                     className={`hidden sm:flex p-2 sm:p-3 rounded-full transition-colors ${isScreenSharing ? 'bg-blue-500/30 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 'bg-white/10 hover:bg-white/20'}`}
//                     title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
//                   >
//                     {isScreenSharing ? <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />}
//                   </button>
//                   <div className="w-px h-6 sm:h-8 bg-white/10" />
//                 </>
//               )}

//               {/* ── SHARED controls (both solo & call) ── */}
//               <button
//                 onClick={() => { setIsVideoOn(!isVideoOn); isVideoOn ? handleStop() : handleStart(); }}
//                 className={`p-2 sm:p-3 rounded-full transition-colors ${!isVideoOn ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20'}`}
//                 title="Toggle camera"
//               >
//                 {isVideoOn ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
//               </button>
//               <button
//                 onClick={() => setIsAslActive(!isAslActive)}
//                 className={`p-2 sm:p-3 rounded-full transition-colors ${isAslActive ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/10 hover:bg-white/20'}`}
//                 title="Toggle AI detection"
//               >
//                 <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
//               </button>
//               <button
//                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//                 className={`p-2 sm:p-3 rounded-full transition-colors ${isSidebarOpen ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}
//                 title={mode === 'call' ? 'Chat' : 'Transcript'}
//               >
//                 <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
//               </button>

//               {/* ── CALL-ONLY: End call ── */}
//               {mode === 'call' && (
//                 <>
//                   <div className="w-px h-6 sm:h-8 bg-white/10" />
//                   <button
//                     onClick={handleLeaveRoom}
//                     className="px-3 sm:px-6 py-1.5 sm:py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-1.5 sm:gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] text-xs sm:text-sm"
//                     title="Leave call"
//                   >
//                     <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
//                     <span className="hidden sm:inline">Leave</span>
//                   </button>
//                 </>
//               )}
//             </div>

//             {/* Screen-share badge */}
//             {isScreenSharing && (
//               <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 px-4 py-2 rounded-xl flex items-center gap-2 z-30">
//                 <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-blue-400" />
//                 <span className="text-xs font-medium text-blue-300">Sharing Screen</span>
//                 <button onClick={handleScreenShare} className="ml-2 text-xs text-blue-400 hover:text-white underline">Stop</button>
//               </div>
//             )}

//           </div>

//           {/* ── MOBILE BOTTOM SHEET (< md) ── */}
//           <AnimatePresence>
//             {isSidebarOpen && (
//               <motion.div
//                 key="mobile-sidebar"
//                 initial={{ y: '100%' }}
//                 animate={{ y: 0 }}
//                 exit={{ y: '100%' }}
//                 transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//                 className="md:hidden absolute inset-x-0 bottom-0 h-[65vh] z-40 bg-gray-950/98 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl flex flex-col overflow-hidden"
//               >
//                 {/* Drag handle + close */}
//                 <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
//                   <div className="flex-1" />
//                   <div className="w-10 h-1 bg-white/20 rounded-full" />
//                   <div className="flex-1 flex justify-end">
//                     <button
//                       onClick={() => setIsSidebarOpen(false)}
//                       className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
//                       aria-label="Close panel"
//                     >
//                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
//                         <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
//                       </svg>
//                     </button>
//                   </div>
//                 </div>
//                 {/* Tabs */}
//                 <div className="flex p-2 bg-black/20 shrink-0">
//                   <button onClick={() => setSidebarTab('transcript')} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${sidebarTab === 'transcript' ? 'bg-white/10 shadow-sm' : 'text-gray-400 hover:text-white'}`}>Transcript</button>
//                   {mode === 'call' && (
//                     <button onClick={() => setSidebarTab('chat')} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${sidebarTab === 'chat' ? 'bg-white/10 shadow-sm' : 'text-gray-400 hover:text-white'}`}>
//                       Chat <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">2</span>
//                     </button>
//                   )}
//                 </div>
//                 {/* Content */}
//                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                   <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
//                     <ConfidenceRing pct={pct} hasHand={!!prediction?.hand_detected} />
//                     <div>
//                       <p className="text-base font-bold">{prediction?.hand_detected ? prediction.sign : '—'}</p>
//                       <p className="text-xs text-gray-400">{prediction?.hand_detected ? `Detected · ${prediction.inference_ms ?? '–'}ms` : 'No hand'}</p>
//                     </div>
//                   </div>
//                   <h3 className="text-sm font-semibold text-gray-300">Conversation</h3>
//                   {chatMessages.map(msg => (
//                     <div key={msg.id} className="flex flex-col gap-1">
//                       <div className="flex items-center gap-2">
//                         <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${msg.sender === 'Me' ? 'bg-indigo-600' : 'bg-gray-600'}`}>{msg.sender === 'Me' ? 'Me' : msg.sender[0]}</div>
//                         <span className="text-sm font-medium">{msg.sender === 'Me' ? (userName || 'You') : msg.sender}</span>
//                         <span className="text-xs text-gray-500">{msg.time}</span>
//                       </div>
//                       <p className="text-sm text-gray-300 pl-8 leading-relaxed">{msg.text}</p>
//                     </div>
//                   ))}
//                   {(translatedText || getText()) && (
//                     <div className="flex flex-col gap-1">
//                       <div className="flex items-center gap-2">
//                         <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-indigo-600/50">Me</div>
//                         <span className="text-sm font-medium">{userName || 'You'}</span>
//                         <span className="text-xs text-gray-500">Now</span>
//                         {isAslActive && <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">ASL</span>}
//                       </div>
//                       <p className="text-sm text-gray-300 pl-8 leading-relaxed italic opacity-80">{getDisplayText() || getText()}</p>
//                     </div>
//                   )}
//                   {mode === 'call' && peerSentence && (
//                     <div className="flex flex-col gap-1">
//                       <div className="flex items-center gap-2">
//                         <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-600">{peerName ? peerName[0] : 'P'}</div>
//                         <span className="text-sm font-medium">{peerName || 'Partner'}</span>
//                         <span className="text-xs text-gray-500">Now</span>
//                       </div>
//                       <p className="text-sm text-gray-300 pl-8 leading-relaxed italic opacity-80">{peerSentence}</p>
//                     </div>
//                   )}
//                 </div>
//                 {mode === 'call' && (
//                   <div className="p-3 bg-black/20 border-t border-white/5 shrink-0">
//                     <div className="relative">
//                       <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="Type to speak or chat..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-500" />
//                       <button onClick={handleSendChat} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-500 transition-colors"><Send className="w-4 h-4" /></button>
//                     </div>
//                   </div>
//                 )}
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* ── DESKTOP SIDE PANEL (md+) ── */}
//           <AnimatePresence>
//             {isSidebarOpen && (
//               <motion.div
//                 key="desktop-sidebar"
//                 initial={{ width: 0, opacity: 0 }}
//                 animate={{ width: 360, opacity: 1 }}
//                 exit={{ width: 0, opacity: 0 }}
//                 className="hidden md:flex flex-col bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden shrink-0 z-20"
//               >
//                 {/* Tabs */}
//                 <div className="flex p-2 bg-black/20 shrink-0">
//                   <button onClick={() => setSidebarTab('transcript')} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${sidebarTab === 'transcript' ? 'bg-white/10 shadow-sm' : 'text-gray-400 hover:text-white'}`}>Transcript</button>
//                   {mode === 'call' && (
//                     <button onClick={() => setSidebarTab('chat')} className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${sidebarTab === 'chat' ? 'bg-white/10 shadow-sm' : 'text-gray-400 hover:text-white'}`}>
//                       Chat <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">2</span>
//                     </button>
//                   )}
//                 </div>
//                 {/* Content */}
//                 <div className="flex-1 overflow-y-auto p-4 space-y-6">
//                   <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
//                     <ConfidenceRing pct={pct} hasHand={!!prediction?.hand_detected} />
//                     <div>
//                       <p className="text-lg font-bold">{prediction?.hand_detected ? prediction.sign : '—'}</p>
//                       <p className="text-xs text-gray-400">{prediction?.hand_detected ? `Detected · ${prediction.inference_ms ?? '–'}ms` : 'No hand'}</p>
//                     </div>
//                   </div>
//                   <h3 className="text-sm font-semibold text-gray-300">Conversation</h3>
//                   {chatMessages.map(msg => (
//                     <div key={msg.id} className="flex flex-col gap-1">
//                       <div className="flex items-center gap-2">
//                         <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${msg.sender === 'Me' ? 'bg-indigo-600' : 'bg-gray-600'}`}>{msg.sender === 'Me' ? 'Me' : msg.sender[0]}</div>
//                         <span className="text-sm font-medium">{msg.sender === 'Me' ? (userName || 'You') : msg.sender}</span>
//                         <span className="text-xs text-gray-500">{msg.time}</span>
//                       </div>
//                       <p className="text-sm text-gray-300 pl-8 leading-relaxed">{msg.text}</p>
//                     </div>
//                   ))}
//                   {(translatedText || getText()) && (
//                     <div className="flex flex-col gap-1">
//                       <div className="flex items-center gap-2">
//                         <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-indigo-600/50">Me</div>
//                         <span className="text-sm font-medium">{userName || 'You'}</span>
//                         <span className="text-xs text-gray-500">Now</span>
//                         {isAslActive && <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">ASL</span>}
//                       </div>
//                       <p className="text-sm text-gray-300 pl-8 leading-relaxed italic opacity-80">{getDisplayText() || getText()}</p>
//                     </div>
//                   )}
//                   {mode === 'call' && peerSentence && (
//                     <div className="flex flex-col gap-1">
//                       <div className="flex items-center gap-2">
//                         <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-600">{peerName ? peerName[0] : 'P'}</div>
//                         <span className="text-sm font-medium">{peerName || 'Partner'}</span>
//                         <span className="text-xs text-gray-500">Now</span>
//                       </div>
//                       <p className="text-sm text-gray-300 pl-8 leading-relaxed italic opacity-80">{peerSentence}</p>
//                     </div>
//                   )}
//                 </div>
//                 {mode === 'call' && (
//                   <div className="p-4 bg-black/20 border-t border-white/5">
//                     <div className="relative">
//                       <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="Type to speak or chat..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-500" />
//                       <button onClick={handleSendChat} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-500 transition-colors"><Send className="w-4 h-4" /></button>
//                     </div>
//                     <p className="text-[10px] text-gray-500 text-center mt-2 font-mono">Press Enter to send</p>
//                   </div>
//                 )}
//               </motion.div>
//             )}
//           </AnimatePresence>

//         </div>
//       )}
//     </div>
//   );
// }
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
  Sparkles, Zap, MessageSquare, CheckCircle2, Send,
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
    peerSentence, peerWord, peerSuggestion,
    attachRemoteVideoRef, joinRoom, leaveRoom, sendTranslation, sendSuggestion,
  } = useVideoCall();

  const { addToHistory, showToast, getSuggestions } = useApp();

  const [mode, setMode]               = useState('solo');
  const [roomInput, setRoomInput]     = useState('');
  const [inRoom, setInRoom]           = useState(false);
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
    const words = text.replace(/[?.!,]/g, '').split(' ');
    setSentence(words.map(w => ({ word: w, confidence: 1 })));
    setSuggestions([]);
    setSelectedSuggestion(text);
    showToast('Suggestion applied', 'success');

    // ✅ Relay the chosen suggestion to partner
    if (mode === 'call' && callStatus === 'connected' && sendSuggestion) {
      sendSuggestion(text);
    }
  };

  const handleJoinRoom = async () => {
    const roomId = normalizeRoomCode(roomInput);
    if (!roomId) return showToast('Enter a room code', 'error');
    setRoomInput(roomId);
    if (!isActive) {
      const ok = await handleStart({ detect: false });
      if (!ok) return;
    }
    await joinRoom(roomId, getStream());
    setInRoom(true);
  };

  const handleLeaveRoom = () => { leaveRoom(); setInRoom(false); setRoomInput(''); };

  const handleModeSwitch = (m) => {
    if (m === 'solo' && inRoom) handleLeaveRoom();
    if (m === 'call') stopDetection();
    setMode(m); handleReset();
  };

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
  return (
    <div style={{ padding: '1.25rem 1.5rem', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            animate={{ boxShadow: backendReady ? ['0 0 0px var(--accent)', '0 0 16px var(--accent-glow)', '0 0 0px var(--accent)'] : 'none' }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Video size={18} style={{ color: 'var(--accent)' }} />
          </motion.div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>ISL Translator</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {mode === 'call' ? '2-user video call mode' : 'Single user · real-time detection'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Language toggle */}
          <div style={{ display: 'flex', gap: 3, background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
            {Object.entries(LANG_CONFIG).map(([code, cfg]) => (
              <button key={code} onClick={() => setLanguage(code)}
                title={cfg.full}
                style={{
                  padding: '4px 10px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 700,
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                  background: language === code ? 'var(--accent)' : 'transparent',
                  color: language === code ? '#fff' : 'var(--text-muted)',
                }}>
                {cfg.label}
              </button>
            ))}
          </div>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 3, background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
            {[{ id: 'solo', Icon: User, label: 'Solo' }, { id: 'call', Icon: Users, label: 'Call' }].map(({ id, Icon, label }) => (
              <button key={id} onClick={() => handleModeSwitch(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px',
                  borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  border: 'none', transition: 'all 0.2s',
                  background: mode === id ? 'var(--accent)' : 'transparent',
                  color: mode === id ? '#fff' : 'var(--text-muted)',
                }}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Backend banner ── */}
      <motion.div
        animate={{ borderColor: backendReady ? 'var(--green-border)' : 'var(--red-border)' }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
          borderRadius: 10, fontSize: '0.75rem',
          background: backendReady ? 'var(--green-soft)' : 'var(--red-soft)',
          border: `1px solid ${backendReady ? 'var(--green-border)' : 'var(--red-border)'}`,
          color: 'var(--text-muted)',
        }}
      >
        {backendReady
          ? <Wifi size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
          : <WifiOff size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />}
        {backendReady
          ? <span>Backend connected — real-time ML inference active  <strong style={{ color: 'var(--green)' }}>●</strong></span>
          : <span>Backend offline · Start: <code style={{ color: 'var(--red)', background: 'var(--bg-panel)', padding: '1px 6px', borderRadius: 4 }}>uvicorn api.server:app --reload --port 8000</code></span>}
      </motion.div>

      {/* ═══════════════════════════════ SOLO MODE ═══════════════════════════ */}
      {mode === 'solo' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: 16 }}>

          {/* Left — Camera */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <motion.div
              className="card"
              style={{ padding: 0, overflow: 'hidden' }}
              whileHover={{ boxShadow: isActive ? '0 0 32px var(--accent-glow)' : 'var(--shadow-md)' }}
              transition={{ duration: 0.3 }}
            >
              {/* Camera viewport */}
              <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg-inset)' }}>
                <video ref={videoRef} autoPlay playsInline muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
                <canvas ref={canvasRef}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }} />

                {/* Off state */}
                {!isActive && !error && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-inset)', gap: 12 }}>
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                      style={{
                        width: 72, height: 72, borderRadius: 18, background: 'var(--bg-panel)',
                        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Video size={28} style={{ color: 'var(--text-ghost)' }} />
                    </motion.div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                      {backendReady
                        ? <><strong style={{ color: 'var(--text-primary)' }}>Click Start Camera</strong> to begin</>
                        : <span style={{ color: 'var(--red)' }}>Start the backend first</span>}
                    </p>
                  </div>
                )}

                {/* Error state */}
                {error && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <AlertCircle size={32} style={{ color: 'var(--red)', margin: '0 auto 8px' }} />
                      <p style={{ color: 'var(--red)', fontWeight: 600 }}>Camera Error</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>{error}</p>
                    </div>
                  </div>
                )}

                {/* LIVE badge */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute', top: 10, left: 10,
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'var(--glass-bg)', backdropFilter: 'blur(8px)',
                        padding: '4px 10px', borderRadius: 8, border: '1px solid var(--glass-border)',
                      }}
                    >
                      <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', display: 'block' }} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--red)', fontWeight: 700 }}>LIVE</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{fps} fps</span>
                      {prediction?.inference_ms && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{prediction.inference_ms}ms</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hold progress bar overlay at bottom */}
                {prediction?.hand_detected && holdCount > 0 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.3)' }}>
                    <motion.div
                      animate={{ width: `${(holdCount / HOLD_FRAMES) * 100}%` }}
                      style={{ height: '100%', background: 'var(--accent)' }}
                    />
                  </div>
                )}
              </div>

              {/* Controls bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', flexWrap: 'wrap' }}>
                {!isActive
                  ? (
                    <motion.button
                      onClick={handleStart} disabled={!backendReady}
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: backendReady ? 1 : 0.5 }}
                      whileHover={backendReady ? { scale: 1.03, boxShadow: '0 0 20px var(--accent-glow)' } : {}}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Video size={14} /> {backendReady ? 'Start Camera' : 'Backend Offline'}
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={handleStop}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid var(--red-border)', padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    >
                      <VideoOff size={14} /> Stop
                    </motion.button>
                  )}
                <motion.button onClick={handleReset} className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                >
                  <RotateCcw size={13} /> Reset
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right — Detection + Sentence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DetectionCard pct={pct} prediction={prediction} holdCount={holdCount} />
            <SentenceCard
              sentence={sentence} suggestions={suggestions}
              getText={getText} getDisplayText={getDisplayText}
              translatedText={translatedText} isTranslating={isTranslating}
              language={language} langConfig={LANG_CONFIG}
              handleCopy={handleCopy}
              handleSave={handleSave} handleSpeak={handleSpeak}
              isSpeaking={isSpeaking} applySuggestion={applySuggestion}
              speechRate={speechRate} setSpeechRate={setSpeechRate}
              mode={mode} callStatus={callStatus}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════ CALL MODE ═══════════════════════════ */}
      {mode === 'call' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Join panel */}
          <AnimatePresence>
            {!inRoom && (
              <motion.div
                key="join"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="card"
                style={{ background: 'var(--accent-softer)', borderColor: 'var(--accent-border)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Link2 size={16} style={{ color: 'var(--accent)' }} />
                  </motion.div>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Join a Room</p>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
                  Both users enter the <strong style={{ color: 'var(--text-primary)' }}>same room code</strong> to connect.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={roomInput}
                    onChange={e => setRoomInput(normalizeRoomCode(e.target.value))}
                    onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                    placeholder="ROOM CODE"
                    maxLength={8}
                    className="input-field"
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.2em', fontWeight: 700, textAlign: 'center' }}
                  />
                  <motion.button onClick={handleJoinRoom} className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: roomInput.trim() ? 1 : 0.5, flexShrink: 0 }}
                    whileHover={{ scale: 1.03, boxShadow: '0 0 20px var(--accent-glow)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Phone size={14} /> Join
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active call */}
          {inRoom && (
            <>
              {/* Status bar */}
              <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <motion.span
                    animate={callStatus === 'connected'
                      ? { boxShadow: [`0 0 0 0 ${meta.glow}`, `0 0 0 6px transparent`] }
                      : {}}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ width: 9, height: 9, borderRadius: '50%', background: meta.dot, display: 'inline-block' }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: meta.color }}>{meta.label}</span>
                  {mySlot && <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', background: 'var(--bg-inset)', padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace' }}>{mySlot}</span>}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-ghost)', fontFamily: 'monospace' }}>#{roomInput}</span>
                </div>
                <motion.button onClick={handleLeaveRoom}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)', fontSize: '0.75rem', fontWeight: 600 }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                >
                  <PhoneOff size={12} /> Leave
                </motion.button>
              </div>

              {/* Incoming suggestion from partner */}
              <IncomingSuggestionBanner
                text={peerSuggestion}
                onDismiss={() => {/* hook handles it */}}
              />

              {/* 2-panel video grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {/* YOU */}
                <VideoPanel
                  label="You" slot={mySlot} isLive={isActive}
                  videoRef={(el) => {
                    videoRef.current = el;
                    localVideoRef.current = el;
                    const stream = getStream();
                    if (el && stream && el.srcObject !== stream) {
                      el.srcObject = stream; el.play?.().catch(() => {});
                    }
                  }}
                  canvasRef={canvasRef}
                  hideCanvas
                  sentence={sentence}
                  chipColor="accent"
                  accentColor="var(--accent)"
                  statusEl={isActive && (
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'var(--red)', marginLeft: 'auto' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', display: 'block' }} /> LIVE
                    </motion.span>
                  )}
                  controls={
                    <div style={{ display: 'flex', gap: 6, padding: '8px 12px', flexWrap: 'wrap' }}>
                      {!isActive
                        ? <button onClick={handleStart} disabled={!backendReady} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', opacity: backendReady ? 1 : 0.5 }}><Video size={13} /> Camera</button>
                        : <button onClick={handleStop} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)' }}><VideoOff size={13} /> Stop</button>}
                      <button onClick={handleReset} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}><RotateCcw size={12} /></button>
                    </div>
                  }
                />

                {/* PARTNER */}
                <VideoPanel
                  label="Partner" isLive={callStatus === 'connected'}
                  videoRef={attachRemoteVideoRef}
                  sentence={peerSentence ? peerSentence.split(' ').map((w, i) => ({ word: w, confidence: 1 })) : []}
                  chipColor="blue"
                  accentColor="var(--blue)"
                  statusEl={callStatus === 'connected' && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'var(--green)', marginLeft: 'auto' }}>
                      <CheckCircle2 size={11} /> Connected
                    </motion.span>
                  )}
                  placeholder={
                    callStatus !== 'connected' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        {callStatus === 'waiting' || callStatus === 'connecting'
                          ? <Loader2 size={28} style={{ color: 'var(--text-ghost)', animation: 'spin 1s linear infinite' }} />
                          : <Users size={28} style={{ color: 'var(--text-ghost)' }} />}
                        <p style={{ color: 'var(--text-faint)', fontSize: '0.78rem' }}>
                          {callStatus === 'waiting' ? 'Waiting for partner…' : 'No partner yet'}
                        </p>
                      </div>
                    )
                  }
                />
              </div>

              {/* Call bottom: detection + sentence */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
                <DetectionCard pct={pct} prediction={prediction} holdCount={holdCount} compact />
                <SentenceCard
                  sentence={sentence} suggestions={suggestions}
                  getText={getText} getDisplayText={getDisplayText}
                  translatedText={translatedText} isTranslating={isTranslating}
                  language={language} langConfig={LANG_CONFIG}
                  handleCopy={handleCopy}
                  handleSave={handleSave} handleSpeak={handleSpeak}
                  isSpeaking={isSpeaking} applySuggestion={applySuggestion}
                  speechRate={speechRate} setSpeechRate={setSpeechRate}
                  mode={mode} callStatus={callStatus}
                  compact
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes ping  { 75%, 100% { transform: scale(2); opacity: 0; } }
        @media (max-width: 768px) {
          .translator-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── VideoPanel subcomponent ───────────────────────────────────────────────── */
function VideoPanel({ label, slot, isLive, videoRef, canvasRef, hideCanvas, sentence, chipColor, accentColor, statusEl, controls, placeholder }) {
  return (
    <motion.div
      className="card"
      style={{ padding: 0, overflow: 'hidden' }}
      whileHover={isLive ? { boxShadow: `0 0 24px ${accentColor}44` } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Panel header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: chipColor === 'accent' ? 'var(--accent-soft)' : 'var(--blue-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {chipColor === 'accent'
            ? <User size={13} style={{ color: 'var(--accent)' }} />
            : <UserCheck size={13} style={{ color: 'var(--blue)' }} />}
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}{slot ? ` · ${slot}` : ''}
        </span>
        {statusEl}
      </div>

      {/* Video */}
      <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--bg-inset)' }}>
        <video ref={videoRef} autoPlay playsInline muted={chipColor === 'accent'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
        {/* Canvas MUST stay in DOM so captureFrame() always has a valid drawing surface.
             hideCanvas only makes it visually invisible — never unmounts it. */}
        {canvasRef && (
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none', display: hideCanvas ? 'none' : 'block' }} />
        )}
        {placeholder && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-inset)' }}>
            {placeholder}
          </div>
        )}
        {/* Glowing border when live */}
        {isLive && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, border: `2px solid ${accentColor}`, pointerEvents: 'none', borderRadius: 0 }}
          />
        )}
      </div>

      {/* Word chips */}
      <div style={{ padding: '10px 14px', minHeight: 50, borderTop: '1px solid var(--border)' }}>
        {sentence.length === 0
          ? <p style={{ color: 'var(--text-ghost)', fontSize: '0.78rem' }}>Signs appear here…</p>
          : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <AnimatePresence>
                {sentence.map((s, i) => <WordChip key={`${s.word}-${i}`} word={s.word} index={i} color={chipColor} />)}
              </AnimatePresence>
            </div>
          )}
      </div>
      {controls && controls}
    </motion.div>
  );
}

/* ─── Detection card subcomponent ────────────────────────────────────────────── */
function DetectionCard({ pct, prediction, holdCount, compact }) {
  return (
    <div className="card" style={compact ? { padding: '12px 14px' } : {}}>
      <p className="section-label">Current Detection</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ConfidenceRing pct={pct} hasHand={!!prediction?.hand_detected} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={prediction?.sign || 'idle'}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              style={{ fontSize: compact ? '1.2rem' : '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}
            >
              {prediction?.hand_detected ? prediction.sign : '—'}
            </motion.p>
          </AnimatePresence>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 4 }}>
            {prediction?.hand_detected ? `Detected · ${prediction.inference_ms ?? '–'}ms` : 'No hand in frame'}
          </p>
        </div>
      </div>
      {prediction?.hand_detected && holdCount > 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginBottom: 3 }}>Holding…</p>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${(holdCount / 8) * 100}%` }}
              style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--blue))', borderRadius: 2 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sentence builder card subcomponent ─────────────────────────────────────── */
function SentenceCard({
  sentence, suggestions, getText, getDisplayText,
  translatedText, isTranslating, language, langConfig,
  handleCopy, handleSave, handleSpeak, isSpeaking,
  speechRate, setSpeechRate,
  applySuggestion, mode, callStatus, compact
}) {
  const cfg         = langConfig?.[language] || { full: 'English', bcp47: 'en-IN' };
  const displayText = getDisplayText?.() || getText?.() || '';
  const englishText = getText?.() || '';
  const showTranslation = language !== 'en' && !!translatedText && translatedText !== englishText;

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, ...(compact ? { padding: '12px 14px' } : {}) }}>
      <p className="section-label">Sentence Builder</p>

      {/* English words (source) */}
      <div style={{
        minHeight: compact ? 50 : 70, padding: '0.75rem', background: 'var(--bg-inset)',
        borderRadius: 10, border: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6,
      }}>
        {sentence.length === 0
          ? <p style={{ color: 'var(--text-ghost)', fontSize: '0.875rem', alignSelf: 'center' }}>Translated words appear here…</p>
          : (
            <AnimatePresence>
              {sentence.map((s, i) => <WordChip key={`${s.word}-${i}`} word={s.word} index={i} />)}
            </AnimatePresence>
          )}
      </div>

      {/* Translated output panel */}
      <AnimatePresence>
        {language !== 'en' && (
          <motion.div
            key="translation-panel"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0.6rem 0.75rem',
              background: 'var(--accent-softer)',
              border: '1px solid var(--accent-border)',
              borderRadius: 10,
              minHeight: 42,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {/* Language badge */}
              <span style={{
                fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em',
                color: 'var(--accent)', background: 'var(--accent-soft)',
                border: '1px solid var(--accent-border)', borderRadius: 4,
                padding: '2px 6px', flexShrink: 0,
              }}>{cfg.full.toUpperCase()}</span>

              {isTranslating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <motion.div
                    animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 12, height: 12, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Translating…</span>
                </div>
              ) : translatedText ? (
                <AnimatePresence mode="wait">
                  <motion.p
                    key={translatedText}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}
                  >
                    {translatedText}
                  </motion.p>
                </AnimatePresence>
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-ghost)' }}>Translation will appear here…</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <Lightbulb size={12} style={{ color: 'var(--yellow)' }} />
              <span className="section-label" style={{ marginBottom: 0 }}>
                Suggestions
                {mode === 'call' && callStatus === 'connected' && (
                  <span style={{ marginLeft: 6, fontSize: '0.6rem', color: 'var(--blue)', background: 'var(--blue-soft)', padding: '1px 6px', borderRadius: 9999, border: '1px solid var(--blue-border)' }}>
                    shared with partner
                  </span>
                )}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {suggestions.slice(0, 3).map((s, i) => (
                <motion.button
                  key={i} onClick={() => applySuggestion(s)}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    textAlign: 'left', padding: '7px 10px', borderRadius: 8,
                    fontSize: '0.78rem', cursor: 'pointer',
                    background: 'var(--yellow-soft)', border: '1px solid var(--yellow-border)',
                    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  }}
                  whileHover={{ background: 'var(--yellow-soft)', color: 'var(--text-primary)', borderColor: 'var(--yellow)', scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{s}</span>
                  {mode === 'call' && callStatus === 'connected' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.65rem', color: 'var(--blue)', flexShrink: 0 }}>
                      <Send size={10} /> Send
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speed presets + action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>

        {/* Speed row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.06em', userSelect: 'none' }}>SPEED</span>
          <div style={{ display: 'flex', gap: 3, background: 'var(--bg-inset)', borderRadius: 7, padding: 2, border: '1px solid var(--border)' }}>
            {[0.75, 1, 1.25, 1.5, 2].map(rate => (
              <button
                key={rate}
                onClick={() => setSpeechRate(rate)}
                title={`${rate}× speed`}
                style={{
                  padding: '3px 8px', borderRadius: 5,
                  fontSize: '0.68rem', fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  transition: 'all 0.15s',
                  background: speechRate === rate ? 'var(--accent)' : 'transparent',
                  color: speechRate === rate ? '#fff' : 'var(--text-muted)',
                  minWidth: 36,
                }}
              >
                {rate}×
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <motion.button onClick={handleCopy} className="btn-secondary" disabled={!sentence.length}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Copy size={13} /> Copy
        </motion.button>
        <motion.button onClick={handleSave} className="btn-secondary" disabled={!sentence.length}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Save size={13} /> Save
        </motion.button>
        <motion.button
          onClick={handleSpeak}
          disabled={!displayText || isSpeaking}
          title={`Speak in ${cfg.full}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem',
            background: isSpeaking ? 'var(--accent-soft)' : 'var(--bg-elevated)',
            color: isSpeaking ? 'var(--accent)' : 'var(--text-muted)',
            border: `1px solid ${isSpeaking ? 'var(--accent-border)' : 'var(--border)'}`,
            padding: '0.45rem 0.8rem', borderRadius: 8, cursor: 'pointer',
          }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        >
          {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
          {isSpeaking ? `Speaking ${cfg.label}…` : `Speak ${cfg.label}`}
        </motion.button>
        </div> {/* end action buttons */}
      </div> {/* end speed+actions column */}
    </div>
  );
}
