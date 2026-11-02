"""
signaling.py — WebSocket signaling + chat relay for the Drishya Vaani ISL video call.

Endpoints
---------
GET  /turn-credentials       ICE server config (STUN + TURN) for RTCPeerConnection
WS   /ws/signal/{room_id}    WebRTC SDP offer/answer + trickle-ICE relay (mesh, max 6 peers)
WS   /ws/chat/{room_id}      Names / translations / suggestions / chat broadcast

Signaling protocol (JSON text frames)
-------------------------------------
server -> client  {"type": "joined", "peer_id": str, "existing_peers": [str]}
server -> client  {"type": "peer_joined", "peer_id": str}
server -> client  {"type": "peer_left",   "peer_id": str}
server -> client  {"type": "full"}
client -> server  {"type": "offer"|"answer"|"ice", "to_id": str, ...}  (server stamps from_id)
client <-> server {"type": "ping"} / {"type": "pong"}

The newcomer always creates the offers, so there is no offer glare on join.

TURN configuration (environment variables, first match wins)
-------------------------------------------------------------
1. METERED_API_KEY + METERED_APP_NAME       short-lived creds from Metered.ca
       (METERED_APP_NAME is the sub-domain:  <name>.metered.live)
2. CLOUDFLARE_TURN_KEY_ID + CLOUDFLARE_TURN_API_TOKEN   Cloudflare Realtime TURN
3. TURN_URLS + TURN_USERNAME + TURN_CREDENTIAL          any static TURN server
4. Fallback: Google STUN + the public Open Relay TURN (best-effort only)

STUN alone only works when both users are on "easy" NATs. Two phones on
mobile data, or one user on a college / office network, almost always need
TURN — configure option 1, 2 or 3 in production.

State is in-process memory, so the service MUST run with a single worker.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
import uuid
from typing import Any

import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

logger = logging.getLogger("sanketsetu.signaling")

router = APIRouter()

MAX_PEERS = 6                     # mesh topology: more than ~6 peers saturates uplinks
MAX_MESSAGE_BYTES = 64 * 1024     # SDP blobs are ~5-10 KB; anything larger is abuse
ROOM_ID_RE = re.compile(r"^[A-Z0-9_-]{1,32}$")
SIGNAL_TYPES = {"offer", "answer", "ice"}

# room_id -> {peer_id: WebSocket}
signal_rooms: dict[str, dict[str, WebSocket]] = {}
# room_id -> set of WebSockets
chat_rooms: dict[str, set[WebSocket]] = {}


# ── Helpers ───────────────────────────────────────────────────────────────────

def normalize_room_id(raw: str) -> str | None:
    room = (raw or "").strip().upper()
    return room if ROOM_ID_RE.match(room) else None


async def _send(ws: WebSocket, payload: dict) -> bool:
    """Send JSON; return False if the socket is already dead."""
    try:
        await ws.send_text(json.dumps(payload))
        return True
    except Exception:
        return False


# ── TURN / ICE configuration ──────────────────────────────────────────────────

STUN_SERVERS: list[dict[str, Any]] = [
    {"urls": ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]},
    {"urls": "stun:stun.cloudflare.com:3478"},
]

OPEN_RELAY_FALLBACK: dict[str, Any] = {
    "urls": [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
        "turns:openrelay.metered.ca:443",
    ],
    "username": "openrelayproject",
    "credential": "openrelayproject",
}

_ice_cache: dict[str, Any] = {"servers": None, "source": None, "expires": 0.0}
ICE_CACHE_SECONDS = 30 * 60


def _static_turn_from_env() -> list[dict[str, Any]] | None:
    urls = [u.strip() for u in os.getenv("TURN_URLS", "").split(",") if u.strip()]
    username = os.getenv("TURN_USERNAME", "").strip()
    credential = os.getenv("TURN_CREDENTIAL", "").strip()
    if urls and username and credential:
        return [{"urls": urls, "username": username, "credential": credential}]
    return None


async def _metered_turn() -> list[dict[str, Any]] | None:
    api_key = os.getenv("METERED_API_KEY", "").strip()
    app_name = os.getenv("METERED_APP_NAME", "").strip()
    if not api_key:
        return None
    if not app_name:
        logger.warning("METERED_API_KEY is set but METERED_APP_NAME is missing — skipping Metered")
        return None
    url = f"https://{app_name}.metered.live/api/v1/turn/credentials"
    async with httpx.AsyncClient(timeout=6.0) as client:
        resp = await client.get(url, params={"apiKey": api_key})
    resp.raise_for_status()
    data = resp.json()
    if isinstance(data, list) and data:
        return data
    raise ValueError(f"Unexpected Metered response: {str(data)[:200]}")


async def _cloudflare_turn() -> list[dict[str, Any]] | None:
    key_id = os.getenv("CLOUDFLARE_TURN_KEY_ID", "").strip()
    token = os.getenv("CLOUDFLARE_TURN_API_TOKEN", "").strip()
    if not (key_id and token):
        return None
    url = f"https://rtc.live.cloudflare.com/v1/turn/keys/{key_id}/credentials/generate-ice-servers"
    async with httpx.AsyncClient(timeout=6.0) as client:
        resp = await client.post(
            url,
            headers={"Authorization": f"Bearer {token}"},
            json={"ttl": 86400},
        )
    resp.raise_for_status()
    servers = resp.json().get("iceServers")
    if servers:
        return servers if isinstance(servers, list) else [servers]
    raise ValueError("Cloudflare response had no iceServers")


async def get_ice_servers() -> tuple[list[dict[str, Any]], str]:
    """Return (ice_servers, source). Cached so we don't hit TURN APIs on every join."""
    now = time.time()
    if _ice_cache["servers"] and now < _ice_cache["expires"]:
        return _ice_cache["servers"], _ice_cache["source"]

    for source, fetcher in (("metered", _metered_turn), ("cloudflare", _cloudflare_turn)):
        try:
            servers = await fetcher()
            if servers:
                result = STUN_SERVERS + servers
                _ice_cache.update(servers=result, source=source, expires=now + ICE_CACHE_SECONDS)
                logger.info("ICE servers loaded from %s (%d entries)", source, len(result))
                return result, source
        except Exception as e:  # network error, bad key, etc. — try the next option
            logger.warning("TURN provider %s failed: %s", source, e)

    static = _static_turn_from_env()
    if static:
        return STUN_SERVERS + static, "static"

    # Short cache so a misconfiguration doesn't stick for 30 min once fixed
    result = STUN_SERVERS + [OPEN_RELAY_FALLBACK]
    _ice_cache.update(servers=result, source="public-fallback", expires=now + 60)
    return result, "public-fallback"


@router.get("/turn-credentials")
async def turn_credentials() -> JSONResponse:
    servers, source = await get_ice_servers()
    return JSONResponse(
        {"iceServers": servers, "source": source, "turnConfigured": source != "public-fallback"},
        headers={"Cache-Control": "no-store"},
    )


@router.get("/rooms/{room_id}")
async def room_info(room_id: str) -> JSONResponse:
    """Debug helper: how many peers are currently in a room."""
    room = normalize_room_id(room_id)
    if room is None:
        return JSONResponse({"detail": "Invalid room id"}, status_code=400)
    return JSONResponse({
        "room": room,
        "signal_peers": len(signal_rooms.get(room, {})),
        "chat_peers": len(chat_rooms.get(room, set())),
        "max_peers": MAX_PEERS,
    })


# ── Signaling endpoint ────────────────────────────────────────────────────────

@router.websocket("/ws/signal/{room_id}")
async def signal_endpoint(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()

    room_key = normalize_room_id(room_id)
    if room_key is None:
        await _send(websocket, {"type": "error", "detail": "invalid_room"})
        await websocket.close(code=4400)
        return

    room = signal_rooms.setdefault(room_key, {})
    if len(room) >= MAX_PEERS:
        await _send(websocket, {"type": "full"})
        await websocket.close(code=4403)
        return

    # No await between the capacity check and the insert → atomic on the event loop
    peer_id = str(uuid.uuid4())
    existing_peers = list(room.keys())
    room[peer_id] = websocket
    logger.info("Room %s: %s joined (%d total)", room_key, peer_id[:8], len(room))

    try:
        await _send(websocket, {"type": "joined", "peer_id": peer_id, "existing_peers": existing_peers})
        for other_id, other_ws in list(room.items()):
            if other_id != peer_id:
                await _send(other_ws, {"type": "peer_joined", "peer_id": peer_id})

        while True:
            raw = await websocket.receive_text()
            if len(raw) > MAX_MESSAGE_BYTES:
                continue
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if not isinstance(msg, dict):
                continue

            msg_type = msg.get("type")
            if msg_type == "ping":
                await _send(websocket, {"type": "pong", "t": msg.get("t")})
                continue
            if msg_type == "leave":
                break

            to_id = msg.get("to_id")
            if msg_type in SIGNAL_TYPES and to_id:
                target = room.get(to_id)
                if target is None:
                    # Target vanished — tell the sender so it can drop that peer
                    await _send(websocket, {"type": "peer_left", "peer_id": to_id})
                    continue
                msg["from_id"] = peer_id
                if not await _send(target, msg):
                    logger.info("Room %s: relay to %s failed", room_key, to_id[:8])

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Signal socket error in room %s", room_key)
    finally:
        current = signal_rooms.get(room_key, {})
        current.pop(peer_id, None)
        logger.info("Room %s: %s left (%d remaining)", room_key, peer_id[:8], len(current))
        for other_ws in list(current.values()):
            await _send(other_ws, {"type": "peer_left", "peer_id": peer_id})
        if not current:
            signal_rooms.pop(room_key, None)


# ── Chat / translation relay endpoint ────────────────────────────────────────

@router.websocket("/ws/chat/{room_id}")
async def chat_endpoint(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()

    room_key = normalize_room_id(room_id)
    if room_key is None:
        await websocket.close(code=4400)
        return

    members = chat_rooms.setdefault(room_key, set())
    members.add(websocket)
    logger.info("Chat %s: joined (%d total)", room_key, len(members))

    try:
        while True:
            raw = await websocket.receive_text()
            if len(raw) > MAX_MESSAGE_BYTES:
                continue
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if isinstance(msg, dict) and msg.get("type") == "ping":
                await _send(websocket, {"type": "pong"})
                continue

            dead: list[WebSocket] = []
            for peer in list(members):
                if peer is websocket:
                    continue
                try:
                    await peer.send_text(raw)
                except Exception:
                    dead.append(peer)
            for d in dead:
                members.discard(d)

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Chat socket error in room %s", room_key)
    finally:
        current = chat_rooms.get(room_key)
        if current is not None:
            current.discard(websocket)
            if not current:
                chat_rooms.pop(room_key, None)
