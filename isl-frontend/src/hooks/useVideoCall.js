/**
 * useVideoCall.js — WebRTC + WebSocket hook for 2-user ISL video call.
 *
 * Fix log:
 *  v3 — Non-trickle ICE: wait for all candidates before sending offer/answer
 *       so the SDP is self-contained and doesn't rely on separate ice messages
 *       arriving in the right order.
 *       More STUN servers + wider TURN coverage (UDP 80, TCP 443, TLS 443).
 *       Auto ICE-restart on failure so users don't have to leave & rejoin.
 */

import { useRef, useState, useCallback, useEffect } from "react";

// ── WebSocket base URL ────────────────────────────────────────────────────────
// In production on Vercel, window.location.host is the Vercel domain which
// has NO WebSocket support. We must point directly to the Render backend.
// In dev, window.location.host works because Vite proxies /ws → localhost:8000.
const getWsBase = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl
      .replace(/^https:/, "wss:")
      .replace(/^http:/, "ws:")
      .replace(/\/$/, "");
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
};

// ── TURN credentials from env (optional override) ────────────────────────────
const getConfiguredTurnServers = () => {
  const urls = (import.meta.env.VITE_TURN_URLS || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  if (!urls.length) return [];
  const username   = import.meta.env.VITE_TURN_USERNAME   || "";
  const credential = import.meta.env.VITE_TURN_CREDENTIAL || "";
  return [{ urls: urls.length === 1 ? urls[0] : urls, ...(username && credential ? { username, credential } : {}) }];
};

// ── ICE server list ───────────────────────────────────────────────────────────
// 5 Google STUN servers for maximum NAT coverage, plus Metered.ca free TURN
// on every available transport (UDP 80, UDP 443, TCP 443, TLS 443).
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302"  },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  ...getConfiguredTurnServers(),
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:80?transport=tcp",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
      "turns:openrelay.metered.ca:443",
    ],
    username:   "openrelayproject",
    credential: "openrelayproject",
  },
];

// ── Helper: wait for ICE gathering to finish (non-trickle ICE) ───────────────
// Waits until pc.iceGatheringState === "complete" or the timeout fires.
// This ensures the SDP offer/answer contains ALL candidates (STUN + TURN)
// before it is sent, so the remote side doesn't need separate ice messages.
const waitForIceGathering = (pc, timeoutMs = 8000) =>
  new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const done = () => { pc.onicegatheringchange = null; resolve(); };
    pc.onicegatheringchange = () => {
      if (pc.iceGatheringState === "complete") done();
    };
    setTimeout(done, timeoutMs); // hard timeout — never block indefinitely
  });

// ─────────────────────────────────────────────────────────────────────────────

export function useVideoCall() {
  const localVideoRef        = useRef(null);
  const remoteVideoRef       = useRef(null);
  const pcRef                = useRef(null);
  const signalWsRef          = useRef(null);
  const chatWsRef            = useRef(null);
  const mySlotRef            = useRef(null);
  const remoteStreamRef      = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const iceRestartTimerRef   = useRef(null);

  const [status,         setStatus]         = useState("idle");
  const [mySlot,         setMySlot]         = useState(null);
  const [peerSentence,   setPeerSentence]   = useState("");
  const [peerWord,       setPeerWord]       = useState("");
  const [peerSuggestion, setPeerSuggestion] = useState("");
  const [peerName,       setPeerName]       = useState("");
  const [peerChat,       setPeerChat]       = useState(null);

  const cleanup = useCallback(() => {
    if (iceRestartTimerRef.current) { clearTimeout(iceRestartTimerRef.current); iceRestartTimerRef.current = null; }
    if (pcRef.current)       { pcRef.current.close();       pcRef.current       = null; }
    if (signalWsRef.current) { signalWsRef.current.close(); signalWsRef.current = null; }
    if (chatWsRef.current)   { chatWsRef.current.close();   chatWsRef.current   = null; }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    remoteStreamRef.current      = null;
    pendingCandidatesRef.current = [];
    mySlotRef.current            = null;
    setMySlot(null);
    setPeerSentence("");
    setPeerWord("");
    setPeerSuggestion("");
    setPeerName("");
    setPeerChat(null);
  }, []);

  const buildPeerConnection = useCallback((onIceCandidate) => {
    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;

    // Keep trickle ICE signaling as a supplement — late candidates can still
    // improve connectivity even though we wait for gathering before send.
    pc.onicecandidate = (e) => { if (e.candidate) onIceCandidate(e.candidate); };

    pc.ontrack = (e) => {
      const stream = remoteStreamRef.current || new MediaStream();
      remoteStreamRef.current = stream;
      if (!stream.getTracks().some((t) => t.id === e.track.id)) stream.addTrack(e.track);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play?.().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") {
        setStatus("connected");
        if (iceRestartTimerRef.current) { clearTimeout(iceRestartTimerRef.current); iceRestartTimerRef.current = null; }
      }
      if (s === "failed") {
        // Auto ICE restart — renegotiate without requiring the user to rejoin
        console.warn("[WebRTC] Connection failed — attempting ICE restart");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setStatus("connecting");
        try { pc.restartIce(); } catch {}
      }
      if (s === "disconnected") {
        setStatus("waiting");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
    };

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === "connected" || s === "completed") setStatus("connected");
      if (s === "failed") {
        setStatus("connecting");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        try { pc.restartIce(); } catch {}
      }
      if (s === "disconnected") {
        setStatus("waiting");
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

  const addLocalTracks = useCallback((pc, stream) => {
    const mediaStream = stream || localVideoRef.current?.srcObject;
    const tracks      = mediaStream?.getTracks?.() || [];
    if (!tracks.length) return false;
    tracks.forEach((track) => {
      if (!pc.getSenders().some((s) => s.track === track)) pc.addTrack(track, mediaStream);
    });
    return true;
  }, []);

  const joinRoom = useCallback(async (roomId, localStream, userName) => {
    cleanup();
    setStatus("connecting");

    const wsBase   = getWsBase();
    const signalWs = new WebSocket(`${wsBase}/ws/signal/${roomId}`);
    const chatWs   = new WebSocket(`${wsBase}/ws/chat/${roomId}`);
    signalWsRef.current = signalWs;
    chatWsRef.current   = chatWs;

    chatWs.onopen = () => {
      chatWs.send(JSON.stringify({ type: "name", slot: mySlotRef.current, name: userName || "User" }));
    };

    chatWs.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.slot === mySlotRef.current) return;
        if (msg.type === "name") {
          setPeerName(msg.name);
          if (!msg.isReply) {
            chatWs.send(JSON.stringify({ type: "name", slot: mySlotRef.current, name: userName || "User", isReply: true }));
          }
        }
        if (msg.type === "chat")        setPeerChat({ text: msg.text, id: Date.now() });
        if (msg.type === "translation") {
          if (msg.sentence !== undefined) setPeerSentence(msg.sentence);
          if (msg.word     !== undefined) setPeerWord(msg.word);
        }
        if (msg.type === "suggestion") {
          setPeerSuggestion(msg.text || "");
          setTimeout(() => setPeerSuggestion(""), 7000);
        }
      } catch {}
    };

    signalWs.onmessage = async (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      switch (msg.type) {

        case "joined": {
          mySlotRef.current = msg.slot;
          setMySlot(msg.slot);
          setStatus(msg.slot === "user1" ? "waiting" : "connecting");

          const pc = buildPeerConnection((c) =>
            signalWs.readyState === WebSocket.OPEN &&
            signalWs.send(JSON.stringify({ type: "ice", candidate: c }))
          );
          pcRef.current = pc;
          addLocalTracks(pc, localStream);

          if (msg.slot === "user2") {
            // Non-trickle ICE: gather ALL candidates before sending the offer.
            // This makes the SDP self-contained — no separate ice messages needed.
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await waitForIceGathering(pc);
            signalWs.send(JSON.stringify({ type: "offer", sdp: pc.localDescription }));
          }
          break;
        }

        case "offer": {
          const pc = pcRef.current; if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          // Flush any ICE candidates that arrived before the offer
          for (const c of pendingCandidatesRef.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          pendingCandidatesRef.current = [];
          // Non-trickle ICE: gather ALL candidates before sending answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await waitForIceGathering(pc);
          signalWs.send(JSON.stringify({ type: "answer", sdp: pc.localDescription }));
          break;
        }

        case "answer": {
          const pc = pcRef.current; if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          for (const c of pendingCandidatesRef.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          pendingCandidatesRef.current = [];
          break;
        }

        case "ice": {
          // Late trickle candidates — add them as a bonus even in non-trickle mode
          const pc = pcRef.current; if (!pc || !msg.candidate) return;
          if (!pc.remoteDescription) { pendingCandidatesRef.current.push(msg.candidate); return; }
          try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
          break;
        }

        case "peer_left": {
          setStatus("waiting");
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          setPeerSentence(""); setPeerWord(""); setPeerSuggestion(""); setPeerName("");
          break;
        }

        case "full": {
          setStatus("full"); cleanup();
          break;
        }

        default: break;
      }
    };

    signalWs.onerror = () => setStatus("error");
    signalWs.onclose = (e) => { if (e.code !== 1000) setStatus("idle"); };
  }, [cleanup, buildPeerConnection, addLocalTracks]);

  const leaveRoom = useCallback(() => { cleanup(); setStatus("idle"); }, [cleanup]);

  const getPeerConnection = useCallback(() => pcRef.current, []);

  const sendTranslation = useCallback((word, sentence) => {
    const ws = chatWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "translation", slot: mySlotRef.current, word, sentence }));
  }, []);

  const sendSuggestion = useCallback((text) => {
    const ws = chatWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "suggestion", slot: mySlotRef.current, text }));
  }, []);

  const sendChatMessage = useCallback((text) => {
    const ws = chatWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "chat", slot: mySlotRef.current, text }));
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return {
    localVideoRef, remoteVideoRef,
    status, mySlot,
    peerSentence, peerWord, peerSuggestion, peerName, peerChat,
    attachRemoteVideoRef,
    joinRoom, leaveRoom,
    getPeerConnection,
    sendTranslation, sendSuggestion, sendChatMessage,
  };
}