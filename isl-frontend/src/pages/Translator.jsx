/**
 * Translator.jsx — SanketSetu ISL Translator
 * Modes:
 *   solo — original single-user translator (behaviour 100% preserved)
 *   call — 2-user video call with real-time ISL translation relay
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, RotateCcw, Copy, Save, Volume2, VolumeX,
  CheckCircle2, AlertCircle, Wifi, WifiOff, Lightbulb,
  Phone, PhoneOff, Users, User, Link2, Loader2, UserCheck,
} from 'lucide-react';
import { useWebcam }    from '../hooks/useWebcam';
import { useVideoCall } from '../hooks/useVideoCall';
import { useApp }       from '../context/AppContext';

const MIN_CONFIDENCE = 0.60;
const HOLD_FRAMES    = 8;
const SOLO_DETECTION_FPS = 30; // Increased from 4 for more fluid detection

const STATUS_META = {
  idle:       { label: 'Not in call',        color: 'var(--text-faint)', dot: 'var(--text-faint)' },
  connecting: { label: 'Connecting',          color: 'var(--yellow)',     dot: 'var(--yellow)' },
  waiting:    { label: 'Waiting for partner', color: 'var(--blue)',       dot: 'var(--blue)' },
  connected:  { label: 'Connected',           color: 'var(--green)',      dot: 'var(--green)' },
  full:       { label: 'Room full',           color: 'var(--red)',        dot: 'var(--red)' },
  error:      { label: 'Error',               color: 'var(--red)',        dot: 'var(--red)' },
};

const RADIUS = 28;
const CIRC   = 2 * Math.PI * RADIUS;

const normalizeRoomCode = (value) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

function confColor(pct) {
  if (pct >= 90) return 'var(--green)';
  if (pct >= 75) return 'var(--yellow)';
  return 'var(--red)';
}

export default function Translator() {
  // ── Webcam / ML detection ──────────────────────────────────────────────────
  const {
    videoRef, canvasRef, isActive, isDetecting, error,
    fps, prediction, backendReady, start, stop, startDetection, stopDetection, getStream,
    setDetectionFps,
  } = useWebcam();

  // ── Video call ─────────────────────────────────────────────────────────────
  const {
    localVideoRef,
    status: callStatus, mySlot,
    peerSentence, peerWord,
    attachRemoteVideoRef, joinRoom, leaveRoom, sendTranslation,
  } = useVideoCall();

  // ── App context ────────────────────────────────────────────────────────────
  const { addToHistory, showToast, getSuggestions } = useApp();

  // ── Local state ────────────────────────────────────────────────────────────
  const [mode, setMode]           = useState('solo');   // 'solo' | 'call'
  const [roomInput, setRoomInput] = useState('');
  const [inRoom, setInRoom]       = useState(false);
  const [sentence, setSentence]   = useState([]);
  const [language, setLanguage]   = useState('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastWord, setLastWord]   = useState('');
  const [holdCount, setHoldCount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);

  // Keep latest sentence in a ref so sendTranslation never reads stale closure
  const sentenceRef = useRef([]);
  useEffect(() => { sentenceRef.current = sentence; }, [sentence]);

  // ── Sign detection (identical logic to original) ───────────────────────────
  useEffect(() => {
    if (!prediction?.hand_detected) { setHoldCount(0); return; }
    const { sign, confidence } = prediction;

    if (confidence < MIN_CONFIDENCE || sign === lastWord) { setHoldCount(0); return; }

    setHoldCount((prev) => {
      const next = prev + 1;
      if (next >= HOLD_FRAMES) {
        setSentence((s) => {
          const updated = [...s, { word: sign, confidence }];
          setSuggestions(getSuggestions(updated.map((x) => x.word)));

          // Relay to partner if in call mode
          if (mode === 'call' && callStatus === 'connected') {
            const sentenceText = updated.map((x) => x.word).join(' ');
            sendTranslation(sign, sentenceText);
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
  const getText = () => sentence.map((s) => s.word).join(' ');

  const handleStart = useCallback(async (options) => {
    setLastWord('');
    setHoldCount(0);
    return await start(options);
  }, [start]);

  const handleStop = useCallback(() => stop(), [stop]);

  const handleReset = useCallback(() => {
    setSentence([]);
    setLastWord('');
    setHoldCount(0);
    setSuggestions([]);
  }, []);

  const handleCopy = () =>
    navigator.clipboard.writeText(getText()).then(() => showToast('Copied!', 'success'));

  const handleSave = () => {
    if (!sentence.length) return showToast('Nothing to save yet', 'error');
    const avgConf = sentence.reduce((a, s) => a + s.confidence, 0) / sentence.length;
    addToHistory({
      sentence: getText(),
      words:    sentence.map((s) => s.word),
      lang:     language,
      confidence: avgConf,
    });
    showToast('Saved to history', 'success');
  };

  const handleSpeak = () => {
    if (!getText() || isSpeaking) return;
    const u = new SpeechSynthesisUtterance(getText());
    u.lang = language === 'en' ? 'en-IN' : 'hi-IN';
    u.onstart = () => setIsSpeaking(true);
    u.onend   = () => setIsSpeaking(false);
    speechSynthesis.speak(u);
  };

  const applySuggestion = (text) => {
    const words = text.replace(/[?.!,]/g, '').split(' ');
    setSentence(words.map((w) => ({ word: w, confidence: 1 })));
    setSuggestions([]);
    showToast('Suggestion applied', 'success');
  };

  const handleJoinRoom = async () => {
    const roomId = normalizeRoomCode(roomInput);
    if (!roomId) return showToast('Enter a room code', 'error');
    setRoomInput(roomId);
    if (!isActive) {
      const cameraStarted = await handleStart({ detect: false });
      if (!cameraStarted) return;
    }
    await joinRoom(roomId, getStream());
    setInRoom(true);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    setInRoom(false);
    setRoomInput('');
  };

  const handleModeSwitch = (m) => {
    if (m === 'solo' && inRoom) handleLeaveRoom();
    if (m === 'call') stopDetection();
    setMode(m);
    handleReset();
  };

  useEffect(() => {
    if (mode !== 'call' || !inRoom || !isActive) return;
    if (callStatus === 'connected' && !isDetecting) startDetection();
    if (callStatus !== 'connected' && isDetecting) stopDetection();
  }, [mode, inRoom, isActive, callStatus, isDetecting, startDetection, stopDetection]);

  // ── Throttle ML detection during active call to free CPU for WebRTC video encoding ──
  useEffect(() => {
    if (mode === 'call' && callStatus === 'connected') {
      setDetectionFps(2);  // 2fps during call — halves backend load & canvas CPU
    } else {
      setDetectionFps(SOLO_DETECTION_FPS);  // restore full FPS when not in an active call
    }
  }, [mode, callStatus, setDetectionFps]);

  // Cleanup on unmount
  useEffect(() => stop, [stop]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const pct  = prediction ? Math.round(prediction.confidence * 100) : 0;
  const meta = STATUS_META[callStatus] || STATUS_META.idle;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '1.25rem', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>ISL Translator</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {mode === 'call' ? '2-user video call mode' : 'Single user mode'}
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 10, padding: 3, border: '1px solid var(--border)' }}>
          {[{ id: 'solo', Icon: User, label: 'Solo' }, { id: 'call', Icon: Users, label: 'Video Call' }].map(({ id, Icon, label }) => (
            <button key={id} onClick={() => handleModeSwitch(id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 7, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.18s', background: mode === id ? 'var(--accent)' : 'transparent', color: mode === id ? '#ffffff' : 'var(--text-muted)' }}>
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Backend status banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, marginBottom: 16, fontSize: '0.75rem', background: backendReady ? 'var(--green-soft)' : 'var(--red-soft)', border: `1px solid ${backendReady ? 'var(--green-border)' : 'var(--red-border)'}`, color: 'var(--text-muted)' }}>
        {backendReady
          ? <Wifi size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
          : <WifiOff size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />}
        {backendReady
          ? <span>SanketSetu backend connected — real-time ML inference active.</span>
          : <span>Backend offline. Start: <code style={{ color: 'var(--red)', background: 'var(--bg-panel)', padding: '1px 6px', borderRadius: 4 }}>uvicorn api.server:app --reload --port 8000</code></span>}
      </div>

      {/* ── CALL MODE: Room join panel ── */}
      <AnimatePresence>
        {mode === 'call' && !inRoom && (
          <motion.div key="join-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
            className="card" style={{ background: 'var(--accent-softer)', borderColor: 'var(--accent-border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Link2 size={16} style={{ color: 'var(--accent)' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Join a Room</p>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              Both users must enter the <strong style={{ color: 'var(--text-primary)' }}>same room code</strong>. Share a code with your partner, then both join.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                value={roomInput}
                onChange={(e) => setRoomInput(normalizeRoomCode(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                placeholder="e.g. ABCD"
                maxLength={8}
                className="input-field"
                style={{ flex: 1, minWidth: 160, fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}
              />
              <button onClick={handleJoinRoom} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', opacity: roomInput.trim() ? 1 : 0.5 }}>
                <Phone size={14} /> Join Room
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CALL MODE: Active 2-panel layout ── */}
      {mode === 'call' && inRoom && (
        <div style={{ marginBottom: 16 }}>
          {/* Call status bar */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: 10, marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, display: 'inline-block', boxShadow: callStatus === 'connected' ? '0 0 6px var(--green)' : 'none' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: meta.color }}>{meta.label}</span>
              {mySlot && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', background: 'var(--bg-inset)', padding: '2px 8px', borderRadius: 6 }}>
                  You: {mySlot}
                </span>
              )}
              <span style={{ fontSize: '0.7rem', color: 'var(--text-ghost)', fontFamily: 'monospace' }}>Room: {roomInput}</span>
            </div>
            <button onClick={handleLeaveRoom} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', padding: '4px 12px', borderRadius: 8, cursor: 'pointer', background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)' }}>
              <PhoneOff size={12} /> Leave
            </button>
          </div>

          {/* 2-panel video grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 12 }}>

            {/* YOUR panel */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={13} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>You {mySlot ? `· ${mySlot}` : ''}</span>
                {isActive && (
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'var(--red)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'ping 1.5s ease-out infinite' }} />
                    LIVE
                  </span>
                )}
              </div>
              <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--bg-inset)' }}>
                {/* localVideoRef shares the same DOM node as videoRef via callback ref */}
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    localVideoRef.current = el;
                    const stream = getStream();
                    if (el && stream && el.srcObject !== stream) {
                      el.srcObject = stream;
                      el.play?.().catch(() => {});
                    }
                  }}
                  autoPlay playsInline muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none',
                  visibility: mode === 'call' ? 'hidden' : 'visible',
                }} />
                {!isActive && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-inset)', gap: 8 }}>
                    <Video size={24} style={{ color: 'var(--text-ghost)' }} />
                    <p style={{ color: 'var(--text-faint)', fontSize: '0.78rem' }}>Camera off</p>
                  </div>
                )}
              </div>
              {/* Your current sentence */}
              <div style={{ padding: '10px 14px', minHeight: 48, borderTop: '1px solid var(--border)' }}>
                {sentence.length === 0
                  ? <p style={{ color: 'var(--text-ghost)', fontSize: '0.78rem' }}>Your signs appear here</p>
                  : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {sentence.map((s, i) => (
                        <span key={i} style={{ fontSize: '0.78rem', fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                          {s.word}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* PARTNER panel */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCheck size={13} style={{ color: 'var(--blue)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Partner</span>
                {callStatus === 'connected' && (
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'var(--green)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                    Connected
                  </span>
                )}
              </div>
              <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--bg-inset)' }}>
                <video
                  ref={attachRemoteVideoRef}
                  autoPlay playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
                {callStatus !== 'connected' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-inset)', gap: 10 }}>
                    {callStatus === 'waiting' || callStatus === 'connecting'
                      ? <Loader2 size={28} style={{ color: 'var(--text-ghost)', animation: 'spin 1s linear infinite' }} />
                      : <Users size={28} style={{ color: 'var(--text-ghost)' }} />}
                    <p style={{ color: 'var(--text-faint)', fontSize: '0.78rem' }}>
                      {callStatus === 'waiting' ? 'Waiting for partner' : 'No partner yet'}
                    </p>
                  </div>
                )}
              </div>
              {/* Partner's translated sentence */}
              <div style={{ padding: '10px 14px', minHeight: 48, borderTop: '1px solid var(--border)' }}>
                {peerSentence
                  ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {peerSentence.split(' ').map((w, i) => (
                        <span key={i} style={{ fontSize: '0.78rem', fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: 'var(--blue-soft)', border: '1px solid var(--blue-border)', color: 'var(--blue)' }}>
                          {w}
                        </span>
                      ))}
                    </div>
                  )
                  : <p style={{ color: 'var(--text-ghost)', fontSize: '0.78rem' }}>Partner's signs appear here</p>}
              </div>
            </div>
          </div>

          {/* Camera controls for call mode */}
          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {!isActive
                ? <button onClick={handleStart} className="btn-primary" disabled={!backendReady} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', opacity: backendReady ? 1 : 0.5 }}><Video size={15} /> Start Camera</button>
                : <button onClick={handleStop} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer', background: 'var(--red-soft)', border: '1px solid var(--red-border)', color: 'var(--red)' }}><VideoOff size={15} /> Stop Camera</button>}
              <button onClick={handleReset} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.875rem' }}><RotateCcw size={14} /> Reset</button>
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 10, padding: 3, marginLeft: 'auto', border: '1px solid var(--border)' }}>
                {['en', 'hi'].map((l) => (
                  <button key={l} onClick={() => setLanguage(l)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.18s', background: language === l ? 'var(--accent)' : 'transparent', color: language === l ? '#ffffff' : 'var(--text-muted)' }}>
                    {l === 'en' ? 'EN' : 'HI'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT (solo camera + right panel) ── */}
      <div style={{ display: 'grid', gap: 16 }} className="lg:grid-cols-[3fr_2fr]">

        {/* LEFT: solo camera (hidden in call mode — camera is in 2-panel above) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'solo' && (
            <>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg-inset)' }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                  <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }} />

                  {/* Loading Skeleton */}
                  {!isActive && !error && backendReady && isDetecting === undefined && (
                    <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
                  )}

                  {!isActive && !error && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-inset)', gap: 12 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bg-panel)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Video size={26} style={{ color: 'var(--text-faint)' }} />
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Camera off —{' '}
                        {backendReady
                          ? <strong style={{ color: 'var(--text-primary)' }}>click Start Camera</strong>
                          : <span style={{ color: 'var(--red)' }}>start the backend first</span>}
                      </p>
                    </div>
                  )}

                  {error && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
                      <div style={{ textAlign: 'center' }}>
                        <AlertCircle size={32} style={{ color: 'var(--red)', margin: '0 auto 8px' }} />
                        <p style={{ color: 'var(--red)', fontSize: '0.875rem', fontWeight: 500 }}>Camera Error</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>{error}</p>
                      </div>
                    </div>
                  )}

                  {isActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--glass-bg)', backdropFilter: 'blur(8px)', padding: '5px 10px', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                      <span style={{ position: 'relative', width: 8, height: 8 }}>
                        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--red)', opacity: 0.75, animation: 'ping 1.5s ease-out infinite' }} />
                        <span style={{ position: 'relative', display: 'block', width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 600 }}>LIVE</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{fps} fps</span>
                      {prediction?.inference_ms && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{prediction.inference_ms}ms</span>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Solo controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', flexWrap: 'wrap' }}>
                  {!isActive
                    ? <button onClick={handleStart} className="btn-primary" disabled={!backendReady} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: backendReady ? 1 : 0.5 }}><Video size={15} />{backendReady ? 'Start Camera' : 'Backend Offline'}</button>
                    : <button onClick={handleStop} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-soft)', color: 'var(--red)', border: '1px solid var(--red-border)', padding: '0.55rem 1.1rem', borderRadius: 10, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}><VideoOff size={15} /> Stop</button>}
                  <button onClick={handleReset} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><RotateCcw size={13} /> Reset</button>
                  <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', borderRadius: 10, padding: 3, marginLeft: 'auto', border: '1px solid var(--border)' }}>
                    {['en', 'hi'].map((l) => (
                      <button key={l} onClick={() => setLanguage(l)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.18s', background: language === l ? 'var(--accent)' : 'transparent', color: language === l ? '#ffffff' : 'var(--text-muted)' }}>
                        {l === 'en' ? 'EN' : 'HI'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: detection + sentence builder (both modes) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Current detection */}
          <div className="card">
            <p className="section-label">Current Detection</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={36} cy={36} r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={5} />
                  <circle cx={36} cy={36} r={RADIUS} fill="none"
                    stroke={prediction?.hand_detected ? confColor(pct) : 'var(--text-ghost)'}
                    strokeWidth={5} strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC - (CIRC * pct) / 100}
                    style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
                  />
                </svg>
                {/* Particle burst effect on high confidence */}
                {prediction?.hand_detected && pct >= 90 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--green-soft)', pointerEvents: 'none' }}
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: prediction?.hand_detected ? confColor(pct) : 'var(--text-ghost)' }}>{pct}%</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AnimatePresence mode="wait">
                  <motion.p key={prediction?.sign || 'idle'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                    style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {prediction?.hand_detected ? prediction.sign : '—'}
                  </motion.p>
                </AnimatePresence>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 4 }}>
                  {prediction?.hand_detected ? `Detected · ${prediction.inference_ms ?? '–'}ms` : 'No hand in frame'}
                </p>
              </div>
            </div>

            {/* Hold progress bar */}
            {prediction?.hand_detected && holdCount > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginBottom: 4 }}>Holding…</p>
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                  <motion.div animate={{ width: `${(holdCount / HOLD_FRAMES) * 100}%` }} style={{ height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                </div>
              </div>
            )}
          </div>

          {/* Sentence builder */}
          <div className="card" style={{ flex: 1 }}>
            <p className="section-label">Sentence Builder</p>
            <div style={{ minHeight: 80, padding: '0.75rem', background: 'var(--bg-inset)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 12 }}>
              {sentence.length === 0
                ? <p style={{ color: 'var(--text-ghost)', fontSize: '0.875rem' }}>Translated words appear here…</p>
                : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <AnimatePresence>
                      {sentence.map((s, i) => (
                        <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          style={{ padding: '3px 10px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
                          {s.word}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
            </div>

            {/* Grammar suggestions */}
            {suggestions.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <Lightbulb size={11} style={{ color: 'var(--yellow)' }} />
                  <span className="section-label" style={{ marginBottom: 0 }}>Suggestions</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <AnimatePresence>
                    {suggestions.slice(0, 3).map((s, i) => (
                      <motion.button key={i} onClick={() => applySuggestion(s)}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ textAlign: 'left', padding: '5px 10px', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', background: 'var(--yellow-soft)', border: '1px solid var(--yellow-border)', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.target.style.background = 'var(--yellow-soft)'; e.target.style.color = 'var(--text-primary)'; e.target.style.borderColor = 'var(--yellow)'; }}
                        onMouseLeave={(e) => { e.target.style.background = 'var(--yellow-soft)'; e.target.style.color = 'var(--text-secondary)'; e.target.style.borderColor = 'var(--yellow-border)'; }}>
                        {s}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={handleCopy} className="btn-secondary" disabled={!sentence.length} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}><Copy size={13} /> Copy</button>
              <button onClick={handleSave} className="btn-secondary" disabled={!sentence.length} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}><Save size={13} /> Save</button>
              <button onClick={handleSpeak} disabled={!getText() || isSpeaking}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', background: isSpeaking ? 'var(--accent-soft)' : 'var(--bg-elevated)', color: isSpeaking ? 'var(--accent)' : 'var(--text-muted)', border: `1px solid ${isSpeaking ? 'var(--accent-border)' : 'var(--border)'}`, padding: '0.45rem 0.8rem', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />} Speak
              </button>
            </div>
          </div>

          {/* Partner sentence card (call mode only) */}
          {mode === 'call' && inRoom && peerSentence && (
            <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ border: '1px solid var(--blue-border)' }}>
              <p className="section-label">Partner's Translation</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--blue)', lineHeight: 1.5 }}>{peerSentence}</p>
              {peerWord && <p style={{ fontSize: '0.72rem', color: 'var(--text-ghost)', marginTop: 6 }}>Latest sign: <strong style={{ color: 'var(--text-secondary)' }}>{peerWord}</strong></p>}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
