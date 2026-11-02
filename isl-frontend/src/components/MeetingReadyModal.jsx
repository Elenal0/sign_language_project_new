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
import { Copy, Check, X, Lock } from 'lucide-react';

/**
 * Builds the shareable meeting URL from just a room code.
 * Uses window.location.origin so it works on localhost AND production.
 * e.g. https://your-app.vercel.app/translate?room=ABC12345
 */
function buildMeetingUrl(roomCode) {
  return `${window.location.origin}/translate?room=${roomCode}`;
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
      <motion.div
        key="mrm-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(8,7,6,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}
      >
        <motion.div
          key="mrm-card"
          role="dialog" aria-modal="true" aria-label="Invite people"
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={e => e.stopPropagation()}
          className="glass-card"
          style={{ width: '100%', maxWidth: 440, borderRadius: 24, overflow: 'hidden' }}
        >
          {/* Header */}
          <div style={{ padding: '26px 26px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <span className="eyebrow">Room ready</span>
              <h2 className="display" style={{ fontSize: '2.2rem', marginTop: 14 }}>
                Invite <em>someone.</em>
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 8 }}>
                Share the link, or let them scan the code with their phone.
              </p>
            </div>
            <button onClick={onDismiss} className="icon-btn" aria-label="Close"><X size={16} /></button>
          </div>

          {/* QR + code */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 26 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 12, flexShrink: 0, boxShadow: 'var(--shadow-md)' }}>
              <QRCodeSVG value={meetingUrl} size={124} bgColor="#ffffff" fgColor="#141311" level="M" includeMargin={false} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="section-label" style={{ marginBottom: 6 }}>Room code</p>
              <p className="mono" style={{ fontSize: '1.7rem', letterSpacing: '0.2em', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{roomCode}</p>
            </div>
          </div>

          {/* Link */}
          <div style={{ padding: '0 26px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 5, borderRadius: 14, background: 'var(--bg-inset)', border: '1px solid var(--border)' }}>
              <span
                className="mono"
                title={meetingUrl}
                style={{ flex: 1, minWidth: 0, padding: '0 8px', fontSize: '0.76rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', userSelect: 'all' }}
              >
                {meetingUrl}
              </span>
              <motion.button onClick={handleCopy} whileTap={{ scale: 0.95 }} className="btn-primary btn-sm" style={{ minWidth: 92 }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={copied ? 'ok' : 'copy'}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 26px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: '0.74rem', color: 'var(--text-faint)' }}>
            <Lock size={12} />
            Anyone with the link can join. Video is encrypted in transit.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
