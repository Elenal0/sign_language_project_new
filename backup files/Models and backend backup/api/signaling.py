"""
signaling.py
WebSocket-based signaling server for 2-user ISL video call.

Endpoints:
  /ws/signal/{room_id}  — WebRTC SDP + ICE relay (max 2 users per room)
  /ws/chat/{room_id}    — Translation text relay (broadcast to room)

Each room holds at most 2 connections. The first joiner is 'user1',
the second is 'user2'. When either leaves, the remaining user is notified.
"""

from __future__ import annotations

import json
import logging
from collections import defaultdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter()

# ── In-memory room state ──────────────────────────────────────────────────────
# signal_rooms: room_id -> {"user1": WebSocket | None, "user2": WebSocket | None}
signal_rooms: dict[str, dict[str, WebSocket | None]] = defaultdict(
    lambda: {"user1": None, "user2": None}
)

# chat_rooms: room_id -> set of WebSockets
chat_rooms: dict[str, set[WebSocket]] = defaultdict(set)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _send(ws: WebSocket, payload: dict) -> None:
    """Send JSON safely — ignore errors on closed sockets."""
    try:
        await ws.send_text(json.dumps(payload))
    except Exception:
        pass


def _other_slot(slot: str) -> str:
    return "user2" if slot == "user1" else "user1"


# ── Signaling endpoint ────────────────────────────────────────────────────────

@router.websocket("/ws/signal/{room_id}")
async def signal_endpoint(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()
    room = signal_rooms[room_id]

    # Assign slot
    if room["user1"] is None:
        slot = "user1"
    elif room["user2"] is None:
        slot = "user2"
    else:
        # Room is full
        await _send(websocket, {"type": "full"})
        await websocket.close()
        return

    room[slot] = websocket
    await _send(websocket, {"type": "joined", "slot": slot})
    logger.info(f"Room {room_id}: {slot} joined")

    other = _other_slot(slot)

    try:
        async for raw in websocket.iter_text():
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            # Forward offer / answer / ICE to the other peer
            if msg.get("type") in ("offer", "answer", "ice"):
                peer_ws = room[other]
                if peer_ws is not None:
                    await _send(peer_ws, msg)

    except WebSocketDisconnect:
        pass
    finally:
        current_room = signal_rooms.get(room_id)
        if current_room is room and current_room.get(slot) is websocket:
            current_room[slot] = None
        logger.info(f"Room {room_id}: {slot} left")

        # Notify the remaining peer
        peer_ws = current_room.get(other) if current_room is room else None
        if peer_ws is not None:
            await _send(peer_ws, {"type": "peer_left"})

        # Clean up empty room
        if (
            current_room is room
            and current_room["user1"] is None
            and current_room["user2"] is None
        ):
            signal_rooms.pop(room_id, None)


# ── Chat / translation relay endpoint ────────────────────────────────────────

@router.websocket("/ws/chat/{room_id}")
async def chat_endpoint(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()
    chat_rooms[room_id].add(websocket)
    logger.info(f"Chat room {room_id}: connection added ({len(chat_rooms[room_id])} total)")

    try:
        async for raw in websocket.iter_text():
            # Broadcast to all other members in the room
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
