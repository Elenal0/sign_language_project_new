// isl-frontend/src/hooks/useWebRTC.js

import { useRef, useState, useCallback, useEffect } from 'react'

// Dynamically builds WebSocket URL from whatever host the browser is on.
// PC:      ws://localhost:5173  → Vite proxy → ws://localhost:8000
// Android: ws://192.168.x.x:5173 → Vite proxy → ws://localhost:8000
const getWsBase = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Free TURN — needed if both devices are on different networks
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
]

export function useWebRTC(roomId, localStream) {
  const wsRef = useRef(null)
  const pcRef = useRef(null)

  const [remoteStream,       setRemoteStream]       = useState(null)
  const [connectionState,    setConnectionState]    = useState('idle')
  const [partnerTranslation, setPartnerTranslation] = useState([])
  const [partnerSentence,    setPartnerSentence]    = useState('')

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    setRemoteStream(null)
    setConnectionState('idle')
    setPartnerTranslation([])
    setPartnerSentence('')
  }, [])

  // ── Create RTCPeerConnection ──────────────────────────────────────────────────
  const createPeerConnection = useCallback((ws) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc

    // Add local camera tracks so remote peer sees our video
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
    }

    // Receive remote video
    const remoteMediaStream = new MediaStream()
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => remoteMediaStream.addTrack(track))
      setRemoteStream(remoteMediaStream)
    }

    // Forward ICE candidates to remote peer via signaling
    pc.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }))
      }
    }

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState
      if (s === 'connected') setConnectionState('connected')
      else if (s === 'disconnected' || s === 'failed' || s === 'closed') setConnectionState('disconnected')
    }

    return pc
  }, [localStream])

  // ── Connect to room ───────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!roomId || !localStream) return

    setConnectionState('connecting')
    const ws = new WebSocket(`${getWsBase()}/ws/signal/${roomId}`)
    wsRef.current = ws

    ws.onopen = () => createPeerConnection(ws)

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data)

      switch (msg.type) {
        case 'peer-joined': {
          // We are the initiator — send the offer
          const pc = pcRef.current
          if (!pc) break
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          ws.send(JSON.stringify({ type: 'offer', sdp: pc.localDescription }))
          break
        }

        case 'offer': {
          const pc = pcRef.current || createPeerConnection(ws)
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          ws.send(JSON.stringify({ type: 'answer', sdp: pc.localDescription }))
          break
        }

        case 'answer': {
          const pc = pcRef.current
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          break
        }

        case 'ice-candidate': {
          const pc = pcRef.current
          if (pc && msg.candidate) {
            try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)) } catch (_) {}
          }
          break
        }

        case 'translation': {
          setPartnerTranslation(prev => [...prev, msg.word].slice(-50))
          if (msg.sentence !== undefined) setPartnerSentence(msg.sentence)
          break
        }

        case 'peer-left':
          setConnectionState('disconnected')
          setRemoteStream(null)
          break

        case 'error':
          setConnectionState('error')
          break

        default:
          break
      }
    }

    ws.onerror = () => setConnectionState('error')
    ws.onclose = () => setConnectionState(prev => prev === 'connected' ? 'disconnected' : prev)
  }, [roomId, localStream, createPeerConnection])

  // ── Send our translation to partner ──────────────────────────────────────────
  const sendTranslation = useCallback((word, sentence) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'translation', word, sentence }))
    }
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  return {
    remoteStream,
    connectionState,
    partnerTranslation,
    partnerSentence,
    connect,
    disconnect: cleanup,
    sendTranslation,
  }
}