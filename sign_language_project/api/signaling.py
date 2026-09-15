"""
signaling.py
WebSocket-based signaling server for N-user ISL video call (mesh topology).

Endpoints:
  /ws/signal/{room_id}  — WebRTC SDP + ICE relay (max 6 users per room)
  /ws/chat/{room_id}    — Translation/chat relay (broadcast to room)

Each peer gets a UUID (peer_id). Signaling messages are routed between
specific peers using from_id / to_id fields.
"""

from __future__ import annotations

import json
import logging
import uuid
from collections import defaultdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

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
            to_id    = msg.get("to_id")

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
