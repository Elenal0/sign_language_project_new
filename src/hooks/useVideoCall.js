/**
 * useVideoCall.js — WebRTC + WebSocket hook for 2-user ISL video call.
 */

import { useRef, useState, useCallback, useEffect } from "react";

const getWsBase = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
};

const getConfiguredTurnServers = () => {
  const urls = (import.meta.env.VITE_TURN_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  if (!urls.length) return [];
  const username   = import.meta.env.VITE_TURN_USERNAME   || "";
  const credential = import.meta.env.VITE_TURN_CREDENTIAL || "";
  return [{ urls: urls.length === 1 ? urls[0] : urls, ...(username && credential ? { username, credential } : {}) }];
};

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  ...getConfiguredTurnServers(),
  { urls: "turn:openrelay.metered.ca:80",             username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

export function useVideoCall() {
  const localVideoRef        = useRef(null);
  const remoteVideoRef       = useRef(null);
  const pcRef                = useRef(null);
  const signalWsRef          = useRef(null);
  const chatWsRef            = useRef(null);
  const mySlotRef            = useRef(null);
  const remoteStreamRef      = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [status,         setStatus]         = useState("idle");
  const [mySlot,         setMySlot]         = useState(null);
  const [peerSentence,   setPeerSentence]   = useState("");
  const [peerWord,       setPeerWord]       = useState("");
  const [peerSuggestion, setPeerSuggestion] = useState("");

  const cleanup = useCallback(() => {
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
  }, []);

  const buildPeerConnection = useCallback((onIceCandidate) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceCandidatePoolSize: 10 });
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;

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
      if (s === "connected")                        setStatus("connected");
      if (s === "disconnected" || s === "failed") {
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
    setTimeout(() => {
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind !== "video") return;
        if (sender.track.contentHint !== undefined) sender.track.contentHint = "motion";
        const params = sender.getParameters();
        if (!params.encodings?.length) params.encodings = [{}];
        params.encodings[0].maxBitrate            = 400000;
        params.encodings[0].maxFramerate          = 15;
        params.encodings[0].degradationPreference = "maintain-framerate";
        sender.setParameters(params).catch(() => {});
      });
    }, 200);
    return true;
  }, []);

  const joinRoom = useCallback(async (roomId, localStream) => {
    cleanup();
    setStatus("connecting");

    const wsBase  = getWsBase();
    const signalWs = new WebSocket(`${wsBase}/ws/signal/${roomId}`);
    const chatWs   = new WebSocket(`${wsBase}/ws/chat/${roomId}`);
    signalWsRef.current = signalWs;
    chatWsRef.current   = chatWs;

    chatWs.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.slot === mySlotRef.current) return;
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
          const pc = buildPeerConnection((c) => signalWs.send(JSON.stringify({ type: "ice", candidate: c })));
          pcRef.current = pc;
          addLocalTracks(pc, localStream);
          if (msg.slot === "user2") {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            signalWs.send(JSON.stringify({ type: "offer", sdp: offer }));
          }
          break;
        }
        case "offer": {
          const pc = pcRef.current; if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          for (const c of pendingCandidatesRef.current) { try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {} }
          pendingCandidatesRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signalWs.send(JSON.stringify({ type: "answer", sdp: answer }));
          break;
        }
        case "answer": {
          const pc = pcRef.current; if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          for (const c of pendingCandidatesRef.current) { try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {} }
          pendingCandidatesRef.current = [];
          break;
        }
        case "ice": {
          const pc = pcRef.current; if (!pc || !msg.candidate) return;
          if (!pc.remoteDescription) { pendingCandidatesRef.current.push(msg.candidate); return; }
          try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
          break;
        }
        case "peer_left": {
          setStatus("waiting");
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          setPeerSentence(""); setPeerWord(""); setPeerSuggestion("");
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

  useEffect(() => cleanup, [cleanup]);

  return {
    localVideoRef, remoteVideoRef,
    status, mySlot,
    peerSentence, peerWord, peerSuggestion,
    attachRemoteVideoRef,
    joinRoom, leaveRoom,
    sendTranslation, sendSuggestion,
  };
}