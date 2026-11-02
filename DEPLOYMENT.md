# Drishya Vaani — production deployment (Render + Vercel)

## Why calls never connected

The live Render service was **not running the code on `main`**:

| Check against https://sign-language-backend-4uar.onrender.com | Result |
|---|---|
| `GET /turn-credentials` | **404**, and the route is missing from `/openapi.json` |
| `GET /ws/signal/<room>` | **404**, and uvicorn logged *"No supported WebSocket library detected"* |
| Packages installed by the build | torch, transformers, language-tool-python, mediapipe 0.10.11, plain `uvicorn` on Python 3.10, which is the requirements file of the **`frontend-animation`** branch |

So both browsers loaded the page, but neither could open the signaling WebSocket. Neither one
ever learned the other existed, and no offer, answer or ICE candidate was exchanged.
`/predict` kept working because it is plain HTTP.

`main` also had a requirements file that could not have worked on Render: it had **no
`mediapipe`** (imported by `src/feature_extraction.py`), pins that need Python ≥ 3.11, and
two conflicting OpenCV builds.

## Fix the existing Render service (Dashboard → sign-language-backend → Settings)

1. **Build & Deploy → Branch:** `main`
2. **Root Directory:** `sign_language_project`
3. **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
4. **Start Command:**
   `python -m uvicorn api.server:app --host 0.0.0.0 --port $PORT --ws websockets --proxy-headers --forwarded-allow-ips="*" --workers 1`
5. **Health Check Path:** `/health`
6. **Environment:** `PYTHON_VERSION=3.10.12`, `WEB_CONCURRENCY=1`
7. **Manual Deploy → Clear build cache & deploy**

### Verify after deploy
```
curl https://sign-language-backend-4uar.onrender.com/health
# must include  "websocket_support": true, "signaling": true
curl https://sign-language-backend-4uar.onrender.com/turn-credentials
```
In the Render log you should see `✅ WebSocket support via 'websockets'`.
While two people are in a room, `GET /rooms/<CODE>` shows `signal_peers: 2`.

## TURN server (needed for calls across different networks)

STUN alone only connects users whose NATs are "easy" (for example, the same Wi-Fi).
Mobile data (carrier-grade NAT), college or office Wi-Fi, and most phone-to-laptop calls need
a TURN relay. The public Open Relay fallback is best-effort only. Set up one of these on
Render (Environment tab):

* **Metered.ca (free 20 GB/month):** sign up at https://dashboard.metered.ca, create an app,
  then set `METERED_APP_NAME=<your-subdomain>` (from `<name>.metered.live`) and
  `METERED_API_KEY=<API key>`.
* **Cloudflare Realtime TURN:** `CLOUDFLARE_TURN_KEY_ID`, `CLOUDFLARE_TURN_API_TOKEN`
* **Any TURN server:** `TURN_URLS=turn:host:3478,turns:host:5349`, `TURN_USERNAME`, `TURN_CREDENTIAL`

`/turn-credentials` returns `"turnConfigured": true` once one of these works.

## Vercel (frontend)

`VITE_API_URL=https://sign-language-backend-4uar.onrender.com` must be set in
**Vercel → Project → Settings → Environment Variables** (Production). Vite bakes it in at
build time, so **redeploy** after the backend change. The hook derives `wss://…` from it.

## Render free tier notes

* The service sleeps after about 15 minutes idle. The frontend now polls `/health` for up to
  90 s before joining, so the first join after a sleep takes longer but succeeds.
* Each redeploy restarts the process and drops in-memory rooms. Clients rejoin
  automatically with backoff.
