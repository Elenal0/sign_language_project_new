"""
signaling.py
WebSocket-based signaling server for N-user ISL video call (mesh topology).

Endpoints:
  GET /turn-credentials      — returns ICE server config (STUN + TURN) for WebRTC
  /ws/signal/{room_id}  — WebRTC SDP + ICE relay (max 6 users per room)
  /ws/chat/{room_id}    — Translation/chat relay (broadcast to room)

Each peer gets a UUID (peer_id). Signaling messages are routed between
specific peers using from_id / to_id fields.

TURN credentials are read from environment variables:
  METERED_API_KEY  — if set, credentials are fetched from Metered.ca TURN API
  TURN_URLS        — comma-separated TURN URL(s), e.g. turn:your-host:3478
  TURN_USERNAME    — TURN username
  TURN_CREDENTIAL  — TURN credential/password
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import uuid
from collections import defaultdict
from typing import Any

import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_PEERS = 6  # max participants per room

# signal_rooms: room_id -> {peer_id: WebSocket}
signal_rooms: dict[str, dict[str, WebSocket]] = defaultdict(dict)

# chat_rooms: room_id -> set of WebSockets
chat_rooms: dict[str, set[WebSocket]] = defaultdict(set)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _send(ws: WebSocket, payload: dict) -> None:
    """Send JSON safely — ignore errors on closed sockets."""
    try:
        await ws.send_text(json.dumps(payload))
    except Exception:
        pass


# ── TURN credentials endpoint ─────────────────────────────────────────────────

def _build_ice_servers() -> list[dict[str, Any]]:
    """
    Build ICE server list.
    Priority:
      1. METERED_API_KEY env var  → fetch from Metered.ca API (async, called separately)
      2. TURN_URLS / TURN_USERNAME / TURN_CREDENTIAL env vars → custom TURN
      3. Fallback hardcoded STUN + Open Relay TURN
    """
    # Custom TURN from env vars
    turn_urls_raw = os.getenv("TURN_URLS", "")
    turn_urls = [u.strip() for u in turn_urls_raw.split(",") if u.strip()]
    turn_username = os.getenv("TURN_USERNAME", "")
    turn_credential = os.getenv("TURN_CREDENTIAL", "")

    stun_servers = [
        {"urls": "stun:stun.l.google.com:19302"},
        {"urls": "stun:stun1.l.google.com:19302"},
        {"urls": "stun:stun2.l.google.com:19302"},
    ]

    if turn_urls and turn_username and turn_credential:
        return stun_servers + [{
            "urls": turn_urls if len(turn_urls) > 1 else turn_urls[0],
            "username": turn_username,
            "credential": turn_credential,
        }]

    # Hardcoded fallback — Open Relay Project (free, public)
    return stun_servers + [{
        "urls": [
            "turn:openrelay.metered.ca:80",
            "turn:openrelay.metered.ca:80?transport=tcp",
            "turn:openrelay.metered.ca:443",
            "turn:openrelay.metered.ca:443?transport=tcp",
            "turns:openrelay.metered.ca:443",
        ],
        "username": "openrelayproject",
        "credential": "openrelayproject",
    }]


@router.get("/turn-credentials")
async def turn_credentials() -> JSONResponse:
    """
    Returns ICE server config for the frontend.
    If METERED_API_KEY is set, fetches fresh short-lived credentials from Metered.ca.
    """
    metered_key = os.getenv("METERED_API_KEY", "")
    if metered_key:
        try:
            app_name = os.getenv("METERED_APP_NAME", "isl-translation")
            url = f"https://{app_name}.metered.live/api/v1/turn/credentials?apiKey={metered_key}"
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    ice_servers = resp.json()
                    logger.info("Fetched TURN credentials from Metered.ca")
                    return JSONResponse({"iceServers": ice_servers})
        except Exception as e:
            logger.warning(f"Metered TURN fetch failed ({e}), falling back to defaults")

    return JSONResponse({"iceServers": _build_ice_servers()})


# ── Signaling endpoint ────────────────────────────────────────────────────────

@router.websocket("/ws/signal/{room_id}")
async def signal_endpoint(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()
    room = signal_rooms[room_id]

    # Reject if room is full
    if len(room) >= MAX_PEERS:
        await _send(websocket, {"type": "full"})
        await websocket.close()
        return

    # Assign a unique peer ID
    peer_id = str(uuid.uuid4())
    existing_peers = list(room.keys())
    room[peer_id] = websocket

    # Tell the new joiner their ID + everyone already in the room
    await _send(websocket, {
        "type": "joined",
        "peer_id": peer_id,
        "existing_peers": existing_peers,
    })

    # Tell all existing peers about the new arrival
    for eid, ews in list(room.items()):
        if eid != peer_id:
            await _send(ews, {"type": "peer_joined", "peer_id": peer_id})

    logger.info(f"Room {room_id}: {peer_id[:8]} joined ({len(room)} total)")

    try:
        async for raw in websocket.iter_text():
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")

            # ── Keepalive ping from client — just respond with pong ────────────
            if msg_type == "ping":
                await _send(websocket, {"type": "pong"})
                continue

            to_id = msg.get("to_id")

            # Route offer / answer / ice to the specific target peer
            if msg_type in ("offer", "answer", "ice") and to_id:
                target_ws = room.get(to_id)
                if target_ws is not None:
                    msg["from_id"] = peer_id   # stamp sender
                    await _send(target_ws, msg)

    except WebSocketDisconnect:
        pass
    finally:
        current_room = signal_rooms.get(room_id, {})
        current_room.pop(peer_id, None)
        logger.info(f"Room {room_id}: {peer_id[:8]} left ({len(current_room)} remaining)")

        # Notify remaining peers
        for ews in list(current_room.values()):
            await _send(ews, {"type": "peer_left", "peer_id": peer_id})

        # Clean up empty room
        if not current_room:
            signal_rooms.pop(room_id, None)


# ── Chat / translation relay endpoint ────────────────────────────────────────

@router.websocket("/ws/chat/{room_id}")
async def chat_endpoint(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()
    chat_rooms[room_id].add(websocket)
    logger.info(f"Chat room {room_id}: joined ({len(chat_rooms[room_id])} total)")

    try:
        async for raw in websocket.iter_text():
            # Broadcast to all other members
            dead: set[WebSocket] = set()
            for peer in list(chat_rooms[room_id]):
                if peer is websocket:
                    continue
                try:
                    await peer.send_text(raw)
                except Exception:
                    dead.add(peer)
            chat_rooms[room_id] -= dead

    except WebSocketDisconnect:
        pass
    finally:
        room = chat_rooms.get(room_id)
        if room is not None:
            room.discard(websocket)
            if not room:
                chat_rooms.pop(room_id, None)
