/**
 * MeetingReadyModal.jsx
 *
 * Shown when the first user joins a room and waits for a partner.
 * Displays:
 *  • Copyable meeting link (with "Copied!" feedback)
 *  • QR code generated client-side from the link (for mobile sharing)
 *  • Dismiss button
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X, Link2, QrCode, Users } from 'lucide-react';

/**
 * Builds the shareable meeting URL from just a room code.
 * Uses window.location.origin so it works on localhost AND production.
 * e.g. https://your-app.vercel.app/translator?room=ABC12345
 */
function buildMeetingUrl(roomCode) {
  return `${window.location.origin}/translator?room=${roomCode}`;
}

export default function MeetingReadyModal({ roomCode, onDismiss }) {
  const [copied, setCopied] = useState(false);
  const meetingUrl = buildMeetingUrl(roomCode);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(meetingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [meetingUrl]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="mrm-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
      >
        {/* Card */}
        <motion.div
          key="mrm-card"
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 24,
            padding: '32px 28px',
            width: '100%',
            maxWidth: 420,
            color: '#fff',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Animated icon */}
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={20} style={{ color: '#818cf8' }} />
              </motion.div>
              <div>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>
                  Your meeting's ready
                </p>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                  Share the link or QR code to invite someone
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onDismiss}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

          {/* Copyable link row */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link2 size={11} /> Meeting link
            </p>
            <div
              style={{
                display: 'flex', alignItems: 'center',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, overflow: 'hidden',
              }}
            >
              <span
                style={{
                  flex: 1, padding: '11px 14px',
                  fontSize: '0.82rem', fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.75)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  userSelect: 'all',
                }}
                title={meetingUrl}
              >
                {meetingUrl}
              </span>
              <motion.button
                onClick={handleCopy}
                whileTap={{ scale: 0.88 }}
                style={{
                  padding: '11px 14px',
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                  border: 'none',
                  borderLeft: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: copied ? '#4ade80' : '#a5b4fc',
                  fontSize: '0.78rem', fontWeight: 600,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Check size={14} /> Copied!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Copy size={14} /> Copy
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* QR Code */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <QrCode size={11} /> Scan with phone
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  display: 'inline-block',
                }}
              >
                <QRCodeSVG
                  value={meetingUrl}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#0f0f0f"
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 12, padding: '10px 14px',
            }}
          >
            <div
              style={{
                width: 22, height: 22, borderRadius: 7, background: 'rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
              }}
            >
              <span style={{ fontSize: 11 }}>🔒</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              Only the person you share this link with can join. The call is end-to-end encrypted.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
