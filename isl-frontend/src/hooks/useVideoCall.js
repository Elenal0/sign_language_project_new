/**
 * useVideoCall.js
 * WebRTC + WebSocket hook for 2-user ISL video call.
 *
 * Responsibilities:
 *  - Connect to FastAPI signaling WebSocket (/ws/signal/{roomId})
 *  - Handle WebRTC offer/answer/ICE exchange
 *  - Expose localVideoRef (reuses webcam stream) and remoteVideoRef
 *  - Relay translations over a separate /ws/chat/{roomId} channel
 *  - Export status: 'idle' | 'connecting' | 'waiting' | 'connected' | 'full' | 'error'
 */

import { useRef, useState, useCallback, useEffect } from 'react';

const getWsBase = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

// Free public STUN servers — no account needed
const getConfiguredTurnServers = () => {
  const urls = (import.meta.env.VITE_TURN_URLS || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  if (!urls.length) return [];

  const username = import.meta.env.VITE_TURN_USERNAME || '';
  const credential = import.meta.env.VITE_TURN_CREDENTIAL || '';

  return [{
    urls: urls.length === 1 ? urls[0] : urls,
    ...(username && credential ? { username, credential } : {}),
  }];
};

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  ...getConfiguredTurnServers(),
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export function useVideoCall() {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef          = useRef(null);   // RTCPeerConnection
  const signalWsRef   = useRef(null);   // signaling channel
  const chatWsRef     = useRef(null);    // translation relay channel
  const mySlotRef     = useRef(null);   // 'user1' | 'user2'
  const remoteStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [status, setStatus]           = useState('idle');
  const [mySlot, setMySlot]           = useState(null);
  const [peerSentence, setPeerSentence] = useState('');
  const [peerWord, setPeerWord]       = useState('');

  // ─── Teardown helper ──────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (signalWsRef.current) {
      signalWsRef.current.close();
      signalWsRef.current = null;
    }
    if (chatWsRef.current) {
      chatWsRef.current.close();
      chatWsRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
    mySlotRef.current = null;
    setMySlot(null);
    setPeerSentence('');
    setPeerWord('');
  }, []);

  // ─── Build RTCPeerConnection ───────────────────────────────────────────────
  const buildPeerConnection = useCallback((onIceCandidate) => {
    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,  // pre-gather candidates → no spike when negotiation starts
    });
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) onIceCandidate(e.candidate);
    };

    pc.ontrack = (e) => {
      const stream = remoteStreamRef.current || new MediaStream();
      remoteStreamRef.current = stream;
      if (!stream.getTracks().some((track) => track.id === e.track.id)) {
        stream.addTrack(e.track);
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play?.().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected')     setStatus('connected');
      if (state === 'disconnected' || state === 'failed') {
        setStatus('waiting');
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
    };

    return pc;
  }, []);

  const attachRemoteVideoRef = useCallback((el) => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current;
      el.play?.().catch(() => {});
    }
  }, []);

  // ─── Add local tracks to peer connection ──────────────────────────────────
  const addLocalTracks = useCallback((pc, stream) => {
    const mediaStream = stream || localVideoRef.current?.srcObject;
    const tracks = mediaStream?.getTracks?.() || [];

    if (!tracks.length) {
      console.warn('[video-call] No local media tracks available before negotiation');
      return false;
    }

    tracks.forEach((track) => {
      const alreadyAdded = pc.getSenders().some((sender) => sender.track === track);
      if (!alreadyAdded) pc.addTrack(track, mediaStream);
    });

    // Cap encoding so WebRTC doesn't spike CPU — prioritise smooth framerate over quality
    setTimeout(() => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind !== 'video') return;

        // contentHint tells encoder to favour motion smoothness (less CPU spikes)
        if (sender.track.contentHint !== undefined) sender.track.contentHint = 'motion';

        const params = sender.getParameters();
        if (!params.encodings || !params.encodings.length) params.encodings = [{}];
        params.encodings[0].maxBitrate           = 400_000;  // 400 kbps — half of before
        params.encodings[0].maxFramerate         = 15;        // 15fps — frees ~40% encode CPU
        params.encodings[0].degradationPreference = 'maintain-framerate'; // drop quality, keep fps
        sender.setParameters(params).catch(() => {});
      });
    }, 200);

    return true;
  }, []);

  // ─── Join room ────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async (roomId, localStream) => {
    cleanup();
    setStatus('connecting');

    const wsBase = getWsBase();
    const sigUrl  = `${wsBase}/ws/signal/${roomId}`;
    const chatUrl = `${wsBase}/ws/chat/${roomId}`;

    const signalWs = new WebSocket(sigUrl);
    const chatWs   = new WebSocket(chatUrl);
    signalWsRef.current = signalWs;
    chatWsRef.current   = chatWs;

    // ── Chat WebSocket: receive partner's translations ──
    chatWs.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'translation' && msg.slot !== mySlotRef.current) {
          if (msg.sentence !== undefined) setPeerSentence(msg.sentence);
          if (msg.word     !== undefined) setPeerWord(msg.word);
        }
      } catch { /* ignore malformed */ }
    };

    // ── Signal WebSocket: WebRTC handshake ──
    signalWs.onmessage = async (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      switch (msg.type) {
        // Server assigns slot: user1 (initiator) or user2 (joiner)
        case 'joined': {
          mySlotRef.current = msg.slot;
          setMySlot(msg.slot);
          setStatus(msg.slot === 'user1' ? 'waiting' : 'connecting');

          if (msg.slot === 'user2') {
            // user2 is the second to arrive — create offer side
            const pc = buildPeerConnection((candidate) => {
              signalWs.send(JSON.stringify({ type: 'ice', candidate }));
            });
            pcRef.current = pc;
            addLocalTracks(pc, localStream);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            signalWs.send(JSON.stringify({ type: 'offer', sdp: offer }));
          } else {
            // user1 waits — build PC ready to receive offer
            const pc = buildPeerConnection((candidate) => {
              signalWs.send(JSON.stringify({ type: 'ice', candidate }));
            });
            pcRef.current = pc;
            addLocalTracks(pc, localStream);
          }
          break;
        }

        case 'offer': {
          const pc = pcRef.current;
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          for (const candidate of pendingCandidatesRef.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
          }
          pendingCandidatesRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signalWs.send(JSON.stringify({ type: 'answer', sdp: answer }));
          break;
        }

        case 'answer': {
          const pc = pcRef.current;
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          for (const candidate of pendingCandidatesRef.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
          }
          pendingCandidatesRef.current = [];
          break;
        }

        case 'ice': {
          const pc = pcRef.current;
          if (!pc || !msg.candidate) return;
          if (!pc.remoteDescription) {
            pendingCandidatesRef.current.push(msg.candidate);
            return;
          }
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch { /* ignore stale candidates */ }
          break;
        }

        case 'peer_left': {
          setStatus('waiting');
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          setPeerSentence('');
          setPeerWord('');
          break;
        }

        case 'full': {
          setStatus('full');
          cleanup();
          break;
        }

        default: break;
      }
    };

    signalWs.onerror = () => setStatus('error');
    signalWs.onclose = (e) => {
      if (e.code !== 1000) setStatus('idle');
    };
  }, [cleanup, buildPeerConnection, addLocalTracks]);

  // ─── Leave room ───────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => {
    cleanup();
    setStatus('idle');
  }, [cleanup]);

  // ─── Send translation to partner ──────────────────────────────────────────
  const sendTranslation = useCallback((word, sentence) => {
    const ws = chatWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      type: 'translation',
      slot: mySlotRef.current,
      word,
      sentence,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  return {
    localVideoRef,
    remoteVideoRef,
    status,
    mySlot,
    peerSentence,
    peerWord,
    attachRemoteVideoRef,
    joinRoom,
    leaveRoom,
    sendTranslation,
  };
}
