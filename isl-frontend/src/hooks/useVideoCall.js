/**
 * useVideoCall.js — WebRTC mesh hook for N-user ISL video call (up to 6).
 * v4 — Full mesh topology: each user holds a direct RTCPeerConnection to
 *       every other participant. The newer joiner always sends the offer.
 *
 * Exported state:
 *   status        — 'idle' | 'connecting' | 'waiting' | 'connected' | 'full' | 'error'
 *   myId          — this user's server-assigned UUID
 *   remotePeers   — Map<peerId, { stream: MediaStream|null, name: string }>
 *   peerSentence  — last ISL sentence received from any peer (for overlay)
 *   peerWord      — last single ISL word received from any peer
 *   peerSuggestion— last suggestion received from any peer
 *   peerName      — display name of first / only remote peer (convenience)
 *   peerChat      — { text, sender, id } of last chat message
 *
 * Exported actions:
 *   joinRoom(roomId, localStream, userName)
 *   leaveRoom()
 *   sendTranslation(word, sentence)
 *   sendSuggestion(text)
 *   sendChatMessage(text)
 *   replaceVideoTrack(newTrack)  — swaps video on ALL peer connections (screen share)
 */

import { useRef, useState, useCallback, useEffect } from "react";

// ── WebSocket base URL ────────────────────────────────────────────────────────
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

// ── ICE servers ───────────────────────────────────────────────────────────────
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

// ── Wait for ICE gathering to complete (non-trickle ICE) ─────────────────────
const waitForIceGathering = (pc, timeoutMs = 8000) =>
  new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const done = () => { pc.onicegatheringchange = null; resolve(); };
    pc.onicegatheringchange = () => { if (pc.iceGatheringState === "complete") done(); };
    setTimeout(done, timeoutMs);
  });

// ─────────────────────────────────────────────────────────────────────────────

export function useVideoCall() {
  // ── Refs (don't trigger re-renders) ────────────────────────────────────────
  const localStreamRef        = useRef(null);
  const signalWsRef           = useRef(null);
  const chatWsRef             = useRef(null);
  const myIdRef               = useRef(null);
  const myNameRef             = useRef("User");
  // Map<peerId, { pc: RTCPeerConnection, stream: MediaStream, name: string }>
  const peersRef              = useRef(new Map());
  // Map<peerId, RTCIceCandidate[]> — buffer candidates arriving before remoteDesc
  const pendingCandidatesRef  = useRef(new Map());

  // ── React state ─────────────────────────────────────────────────────────────
  const [status,        setStatus]        = useState("idle");
  const [myId,          setMyId]          = useState(null);
  // Map<peerId, { stream: MediaStream|null, name: string }>
  const [remotePeers,   setRemotePeers]   = useState(new Map());
  const [peerSentence,  setPeerSentence]  = useState("");
  const [peerWord,      setPeerWord]      = useState("");
  const [peerSuggestion,setPeerSuggestion]= useState("");
  const [peerName,      setPeerName]      = useState("");
  const [peerChat,      setPeerChat]      = useState(null);

  // ── Sync peersRef → React state ─────────────────────────────────────────────
  const syncPeers = useCallback(() => {
    setRemotePeers(new Map(
      [...peersRef.current.entries()].map(([id, { stream, name }]) => [id, { stream, name }])
    ));
    // Keep peerName as the first peer's name for backwards-compat
    const first = peersRef.current.values().next().value;
    setPeerName(first?.name || "");
  }, []);

  // ── Full cleanup ─────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    for (const { pc } of peersRef.current.values()) {
      try { pc.close(); } catch {}
    }
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();

    if (signalWsRef.current) { signalWsRef.current.close(); signalWsRef.current = null; }
    if (chatWsRef.current)   { chatWsRef.current.close();   chatWsRef.current   = null; }

    myIdRef.current = null;
    setMyId(null);
    setRemotePeers(new Map());
    setStatus("idle");
    setPeerSentence("");
    setPeerWord("");
    setPeerSuggestion("");
    setPeerName("");
    setPeerChat(null);
  }, []);

  // ── Create one RTCPeerConnection for a specific remote peer ──────────────────
  const createPeerConnection = useCallback((peerId) => {
    // Avoid duplicates
    if (peersRef.current.has(peerId)) return peersRef.current.get(peerId).pc;

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });

    // Add local tracks to this connection
    const stream = localStreamRef.current;
    if (stream) stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    // Receive remote stream
    const remoteStream = new MediaStream();
    peersRef.current.set(peerId, { pc, stream: remoteStream, name: "" });

    pc.ontrack = (e) => {
      if (!remoteStream.getTracks().some((t) => t.id === e.track.id)) {
        remoteStream.addTrack(e.track);
      }
      const entry = peersRef.current.get(peerId);
      if (entry) {
        peersRef.current.set(peerId, { ...entry, stream: remoteStream });
        syncPeers();
      }
    };

    // Trickle ICE candidates to the specific peer
    pc.onicecandidate = (e) => {
      if (e.candidate && signalWsRef.current?.readyState === WebSocket.OPEN) {
        signalWsRef.current.send(JSON.stringify({
          type: "ice",
          to_id: peerId,
          candidate: e.candidate,
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") setStatus("connected");
      if (s === "failed") { try { pc.restartIce(); } catch {} }
      if (s === "disconnected") {
        const anyConnected = [...peersRef.current.values()]
          .some(({ pc: p }) => p.connectionState === "connected");
        if (!anyConnected) setStatus("waiting");
      }
    };

    return pc;
  }, [syncPeers]);

  // ── Join a room ──────────────────────────────────────────────────────────────
  const joinRoom = useCallback(async (roomId, localStream, userName) => {
    cleanup();
    setStatus("connecting");
    localStreamRef.current = localStream;
    myNameRef.current = userName || "User";

    const wsBase    = getWsBase();
    const signalWs  = new WebSocket(`${wsBase}/ws/signal/${roomId}`);
    const chatWs    = new WebSocket(`${wsBase}/ws/chat/${roomId}`);
    signalWsRef.current = signalWs;
    chatWsRef.current   = chatWs;

    // ── Chat WebSocket ─────────────────────────────────────────────────────────
    chatWs.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        // Ignore own messages
        if (msg.peer_id && msg.peer_id === myIdRef.current) return;

        if (msg.type === "name") {
          // Update that peer's name in the map
          const entry = peersRef.current.get(msg.peer_id);
          if (entry) {
            peersRef.current.set(msg.peer_id, { ...entry, name: msg.name });
            syncPeers();
          }
          // Reply once so they know our name
          if (!msg.isReply && chatWs.readyState === WebSocket.OPEN) {
            chatWs.send(JSON.stringify({
              type: "name", name: myNameRef.current,
              peer_id: myIdRef.current, isReply: true,
            }));
          }
        }

        if (msg.type === "translation") {
          if (msg.sentence !== undefined) setPeerSentence(msg.sentence);
          if (msg.word     !== undefined) setPeerWord(msg.word);
        }

        if (msg.type === "suggestion") {
          setPeerSuggestion(msg.text || "");
          setTimeout(() => setPeerSuggestion(""), 7000);
        }

        if (msg.type === "chat") {
          setPeerChat({ text: msg.text, sender: msg.name || "Partner", id: Date.now() });
        }
      } catch {}
    };

    // ── Signal WebSocket ───────────────────────────────────────────────────────
    signalWs.onmessage = async (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      switch (msg.type) {

        case "joined": {
          // Server assigned us a peer_id + list of who is already in the room
          myIdRef.current = msg.peer_id;
          setMyId(msg.peer_id);

          if (msg.existing_peers.length === 0) {
            setStatus("waiting");
          } else {
            setStatus("connecting");
            // We are the newcomer — send offers to every existing peer
            for (const existingId of msg.existing_peers) {
              const pc = createPeerConnection(existingId);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              await waitForIceGathering(pc);
              signalWs.send(JSON.stringify({
                type: "offer", to_id: existingId, sdp: pc.localDescription,
              }));
            }
            syncPeers();
          }

          // Announce our name to everyone in the room (via chat WS)
          setTimeout(() => {
            if (chatWs.readyState === WebSocket.OPEN) {
              chatWs.send(JSON.stringify({
                type: "name", name: myNameRef.current, peer_id: msg.peer_id,
              }));
            }
          }, 600);
          break;
        }

        case "peer_joined": {
          // Someone new joined after us. They will send us an offer — just prep the PC.
          const newId = msg.peer_id;
          if (!peersRef.current.has(newId)) {
            createPeerConnection(newId);
            syncPeers();
          }
          break;
        }

        case "offer": {
          const fromId = msg.from_id;
          const pc = createPeerConnection(fromId);
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          // Flush buffered ICE candidates
          for (const c of (pendingCandidatesRef.current.get(fromId) || [])) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          pendingCandidatesRef.current.delete(fromId);
          // Send answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await waitForIceGathering(pc);
          signalWs.send(JSON.stringify({
            type: "answer", to_id: fromId, sdp: pc.localDescription,
          }));
          break;
        }

        case "answer": {
          const fromId = msg.from_id;
          const pc = peersRef.current.get(fromId)?.pc;
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          for (const c of (pendingCandidatesRef.current.get(fromId) || [])) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          pendingCandidatesRef.current.delete(fromId);
          break;
        }

        case "ice": {
          const fromId = msg.from_id;
          const pc = peersRef.current.get(fromId)?.pc;
          if (!pc || !msg.candidate) return;
          if (!pc.remoteDescription) {
            const buf = pendingCandidatesRef.current.get(fromId) || [];
            buf.push(msg.candidate);
            pendingCandidatesRef.current.set(fromId, buf);
            return;
          }
          try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
          break;
        }

        case "peer_left": {
          const leftId = msg.peer_id;
          const entry = peersRef.current.get(leftId);
          if (entry) {
            try { entry.pc.close(); } catch {}
            peersRef.current.delete(leftId);
            pendingCandidatesRef.current.delete(leftId);
            syncPeers();
          }
          if (peersRef.current.size === 0) setStatus("waiting");
          break;
        }

        case "full": {
          setStatus("full");
          cleanup();
          break;
        }

        default: break;
      }
    };

    signalWs.onerror = () => setStatus("error");
    signalWs.onclose = (ev) => { if (ev.code !== 1000) setStatus("idle"); };
  }, [cleanup, createPeerConnection, syncPeers]);

  // ── Leave room ────────────────────────────────────────────────────────────────
  const leaveRoom = useCallback(() => cleanup(), [cleanup]);

  // ── Replace video track on ALL peer connections (for screen share) ────────────
  const replaceVideoTrack = useCallback((newTrack) => {
    for (const { pc } of peersRef.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(newTrack).catch(() => {});
    }
  }, []);

  // ── Chat / translation senders ────────────────────────────────────────────────
  const sendTranslation = useCallback((word, sentence) => {
    const ws = chatWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "translation", peer_id: myIdRef.current, word, sentence }));
  }, []);

  const sendSuggestion = useCallback((text) => {
    const ws = chatWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "suggestion", peer_id: myIdRef.current, text }));
  }, []);

  const sendChatMessage = useCallback((text) => {
    const ws = chatWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "chat", peer_id: myIdRef.current, name: myNameRef.current, text }));
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return {
    status,
    myId,
    remotePeers,
    peerSentence,
    peerWord,
    peerSuggestion,
    peerName,
    peerChat,
    joinRoom,
    leaveRoom,
    replaceVideoTrack,
    sendTranslation,
    sendSuggestion,
    sendChatMessage,
  };
}