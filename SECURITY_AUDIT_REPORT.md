# Security Audit Report — SanketSetu Project

**Date:** June 28, 2026  
**Auditor Role:** Senior Security Engineer  
**Audit Scope:** Full full-stack codebase review (`isl-frontend` and `sign_language_project`) including APIs, ML pipelines, dependencies, configuration, and data handling.  
**Mode:** Read-Only Audit (No code modifications applied)

---

# Executive Summary

* **Overall Security Score:** **68 / 100**
* **Overall Risk Level:** **High**

### Summary Assessment
SanketSetu is well-architected with clean separation between the frontend React/Vite client and the FastAPI/MediaPipe machine learning backend. However, several high-severity security weaknesses exist that must be remediated before production deployment. The most critical vulnerabilities stem from insecure deserialization of ML models (`joblib.load` / `pickle`), unbounded base64 payload processing on the `/predict` API endpoint (posing a severe Denial of Service risk), lack of API authentication, and missing HTTP security headers. 

---

# Vulnerabilities

## SEC-VULN-001: Insecure Deserialization of ML Models and Data Arrays
* **Severity:** **Critical**
* **File(s) affected:** 
  * `sign_language_project/api/server.py` (lines 63–64)
  * `sign_language_project/src/inference.py` (lines 12–13)
  * `sign_language_project/src/realtime.py` (lines 47–48)
  * `sign_language_project/src/train.py` (line 16)
* **Description:** The application loads pre-trained machine learning pipelines (`sign_language_model.pkl`), label encoders (`label_encoder.pkl`), and NumPy target arrays (`y.npy` via `allow_pickle=True`) using Python's `joblib.load()` and `pickle` deserialization mechanisms without integrity verification.
* **Why it is a security risk:** Python's `pickle` engine is inherently insecure against untrusted data. An attacker who modifies or replaces `.pkl` or `.npy` files (via compromised cloud storage, unauthorized filesystem access, or man-in-the-middle model downloads) can inject malicious payloads using custom `__reduce__` methods.
* **Possible impact:** Arbitrary Remote Code Execution (RCE) with the privileges of the running server process upon application startup or model loading.
* **Recommended fix:** Transition ML model serialization to secure, non-executable formats such as **ONNX** (`.onnx`) for inference models and JSON/`safetensors` for metadata and encoders. If `joblib` must be used temporarily, implement cryptographic HMAC signature checks before loading any `.pkl` file. Set `allow_pickle=False` when loading `.npy` arrays.
* **Whether the fix is safe or could affect application functionality:** **Requires Approval** (Medium impact on functionality — requires adapting model serialization routines and inference loading logic).

---

## SEC-VULN-002: Unbounded Request Payload Size & Missing Rate Limiting (DoS Vector)
* **Severity:** **High**
* **File(s) affected:** 
  * `sign_language_project/api/server.py` (lines 71–73, 83–94)
* **Description:** The POST `/predict` endpoint accepts base64-encoded image strings inside the `PredictRequest` JSON schema without enforcing string length limits or maximum request payload boundaries. Additionally, no rate-limiting middleware throttles incoming requests.
* **Why it is a security risk:** Decoding multi-gigabyte base64 payloads in memory and passing unverified byte buffers into OpenCV (`cv2.imdecode`) and CPU-bound MediaPipe feature extraction routines consumes massive amounts of RAM and CPU cycles.
* **Possible impact:** Denial of Service (DoS), memory exhaustion leading to server crashes (OOM killer), and API degradation for all users.
* **Recommended fix:** 
  1. Add Pydantic validation constraints on `PredictRequest.image` (e.g., `Field(..., max_length=1_000_000)` to limit payload sizes to ~1MB).
  2. Configure Uvicorn/FastAPI maximum request body limits.
  3. Integrate rate-limiting middleware (e.g., `slowapi`) to cap requests per IP.
* **Whether the fix is safe or could affect application functionality:** **Safe** (Does not affect normal webcam frame transmission, which averages 50KB–100KB per frame).

---

## SEC-VULN-003: Overly Permissive CORS Configuration
* **Severity:** **Medium**
* **File(s) affected:** 
  * `sign_language_project/api/server.py` (lines 38–44)
* **Description:** The FastAPI backend hardcodes local development origins (`http://localhost:5173`, `http://127.0.0.1:5173`) combined with `allow_credentials=True`, `allow_methods=["*"]`, and `allow_headers=["*"]`.
* **Why it is a security risk:** Hardcoding localhost origins breaks when deploying to production domains (e.g., Vercel). Developers frequently replace hardcoded origins with wildcard `*` during hasty production deployments while keeping `allow_credentials=True`, creating critical cross-origin vulnerabilities. Permitting all methods and headers violates the principle of least privilege.
* **Possible impact:** Cross-Origin Resource Sharing misconfigurations leading to unauthorized API access or CSRF-like data exposure in production environments.
* **Recommended fix:** Dynamically load allowed origins from an environment variable (`ALLOWED_ORIGINS`). Restrict allowed HTTP methods (`GET`, `POST`, `OPTIONS`) and specific required headers (`Content-Type`, `Authorization`).
* **Whether the fix is safe or could affect application functionality:** **Requires Approval** (Requires configuring environment variables across local and production deployment setups).

---

## SEC-VULN-004: Unauthenticated API Endpoints
* **Severity:** **Medium** (High in public production)
* **File(s) affected:** 
  * `sign_language_project/api/server.py` (lines 83, 132, 141)
* **Description:** All backend endpoints (`/predict`, `/health`, `/classes`) lack authentication checks.
* **Why it is a security risk:** Publicly exposing compute-heavy ML endpoints allows any external actor to submit arbitrary requests, driving up server infrastructure costs and exhausting server resources.
* **Possible impact:** Compute resource abuse, financial exhaustion (cloud bill spikes), and unauthorized API consumption.
* **Recommended fix:** Implement API key verification via HTTP Bearer headers (`Authorization: Bearer <VITE_API_KEY>`) or API Gateway authentication for all non-health endpoints.
* **Whether the fix is safe or could affect application functionality:** **Requires Approval** (Affects API routing and requires updating frontend `fetch` headers in `useWebcam.js`).

---

## SEC-VULN-005: Missing HTTP Security Headers
* **Severity:** **Medium**
* **File(s) affected:** 
  * `sign_language_project/api/server.py` (lines 32–44)
  * `isl-frontend/index.html` (lines 1–17)
* **Description:** The web application and API lack standard security headers including `Content-Security-Policy (CSP)`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security (HSTS)`, and `Referrer-Policy`.
* **Why it is a security risk:** Without these headers, browsers cannot enforce protections against Cross-Site Scripting (XSS), clickjacking, MIME-type sniffing, and protocol downgrade attacks.
* **Possible impact:** Increased vulnerability to client-side code injection and UI redressing attacks.
* **Recommended fix:** Add security header middleware to FastAPI and declare meta CSP tags in `index.html` or hosting headers (`vercel.json`).
* **Whether the fix is safe or could affect application functionality:** **Safe** (Can be applied immediately with properly scoped CSP allowing required font CDNs).

---

## SEC-VULN-006: Information Leakage via Exception Logging
* **Severity:** **Low**
* **File(s) affected:** 
  * `sign_language_project/api/server.py` (lines 59, 61, 93)
* **Description:** Error handlers pass internal exception strings and absolute file filesystem paths back to clients in HTTP responses (e.g., `detail=f"Invalid image data: {e}"` and `RuntimeError(f"Model not found at {model_path}")`).
* **Why it is a security risk:** Exposing server directory paths (`v:\...`) and internal library exceptions reveals system architecture and environment details to attackers during reconnaissance.
* **Possible impact:** Information disclosure aiding targeted attacks against specific backend libraries or OS structures.
* **Recommended fix:** Log detailed exceptions server-side (`logger.error(..., exc_info=True)`) and return sanitized, generic error strings to the client (e.g., `"Invalid payload structure."`).
* **Whether the fix is safe or could affect application functionality:** **Safe** (Does not impact UI functionality).

---

## SEC-VULN-007: Unsanitized CSV Export (CSV Injection Risk)
* **Severity:** **Low**
* **File(s) affected:** 
  * `isl-frontend/src/pages/History.jsx` (lines 39–46)
* **Description:** The translation history export function formats user-generated translation strings into a CSV file without escaping leading formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`).
* **Why it is a security risk:** If a translated sign sequence or custom dictionary entry begins with formula triggers, opening the exported `.csv` in spreadsheet applications (like Microsoft Excel) can execute arbitrary spreadsheet formulas.
* **Possible impact:** Client-side CSV injection / arbitrary formula execution on user workstations.
* **Recommended fix:** Sanitize CSV output fields by prepending a single quote `'` or space to any value starting with `=`, `+`, `-`, `@`, `\t`, or `\r`.
* **Whether the fix is safe or could affect application functionality:** **Safe** (Completely transparent to normal CSV viewers).

---

# Proposed Code Changes

## 1. File: `sign_language_project/api/server.py`
### Exact changes that would be made:
```diff
--- a/sign_language_project/api/server.py
+++ b/sign_language_project/api/server.py
@@ -14,8 +14,8 @@
 import joblib
-from fastapi import FastAPI, HTTPException
+from fastapi import FastAPI, HTTPException, Security, Depends
+from fastapi.security import APIKeyHeader
 from fastapi.middleware.cors import CORSMiddleware
-from pydantic import BaseModel
+from pydantic import BaseModel, Field
 
@@ -36,11 +36,25 @@
 )
 
+ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
+API_KEY_SECRET = os.getenv("API_KEY_SECRET", "dev-secret-key")
+api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
+
+async def verify_api_key(api_key: str = Security(api_key_header)):
+    if os.getenv("ENV") == "production" and api_key != API_KEY_SECRET:
+        raise HTTPException(status_code=401, detail="Unauthorized API access.")
+    return api_key
+
 app.add_middleware(
     CORSMiddleware,
-    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
+    allow_origins=ALLOWED_ORIGINS,
     allow_credentials=True,
-    allow_methods=["*"],
-    allow_headers=["*"],
+    allow_methods=["GET", "POST", "OPTIONS"],
+    allow_headers=["Content-Type", "X-API-Key"],
 )
 
@@ -70,7 +84,7 @@
 class PredictRequest(BaseModel):
-    image: str  # base64-encoded JPEG frame from webcam
+    image: str = Field(..., max_length=1_000_000, description="Base64 encoded frame (<1MB)")
 
@@ -81,7 +95,7 @@
-@app.post("/predict", response_model=PredictResponse)
-async def predict(req: PredictRequest):
+@app.post("/predict", response_model=PredictResponse, dependencies=[Depends(verify_api_key)])
+async def predict(req: PredictRequest):
@@ -91,7 +105,8 @@
         frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
     except Exception as e:
-        raise HTTPException(status_code=400, detail=f"Invalid image data: {e}")
+        logger.error(f"Image decode failure: {e}", exc_info=True)
+        raise HTTPException(status_code=400, detail="Invalid image payload format.")
```
* **Reason for the change:** Enforces request size constraints (preventing DoS), parametrizes CORS for safe deployments, adds API key authorization, and prevents sensitive error string disclosure.
* **Expected impact:** Secure API endpoint robust against OOM payloads and unauthorized external queries.
* **Risk of breaking existing functionality:** **Medium** (Requires frontend environment variables to pass `X-API-Key` if authentication is enforced).

---

## 2. File: `isl-frontend/src/hooks/useWebcam.js`
### Exact changes that would be made:
```diff
--- a/isl-frontend/src/hooks/useWebcam.js
+++ b/isl-frontend/src/hooks/useWebcam.js
@@ -3,6 +3,7 @@
 const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
+const API_KEY = import.meta.env.VITE_API_KEY || 'dev-secret-key'
 const TARGET_FPS = 10
@@ -45,7 +46,10 @@
       const res = await fetch(`${API_URL}/predict`, {
         method: 'POST',
-        headers: { 'Content-Type': 'application/json' },
+        headers: { 
+          'Content-Type': 'application/json',
+          'X-API-Key': API_KEY
+        },
         body: JSON.stringify({ image: base64 }),
       })
```
* **Reason for the change:** Attaches API authentication header required by secured backend endpoints.
* **Expected impact:** Seamless authentication handshake between React client and FastAPI server.
* **Risk of breaking existing functionality:** **Low**.

---

## 3. File: `isl-frontend/src/pages/History.jsx`
### Exact changes that would be made:
```diff
--- a/isl-frontend/src/pages/History.jsx
+++ b/isl-frontend/src/pages/History.jsx
@@ -38,9 +38,13 @@
   const handleExport = () => {
+    const sanitizeCsv = (val) => {
+      const str = String(val);
+      return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
+    };
     const rows = [
       ['Sentence', 'Words', 'Language', 'Confidence', 'Time'],
-      ...history.map(h => [h.sentence, h.words.join(' | '), h.lang, (h.confidence * 100).toFixed(1) + '%', new Date(h.timestamp).toLocaleString()])
+      ...history.map(h => [sanitizeCsv(h.sentence), sanitizeCsv(h.words.join(' | ')), h.lang, (h.confidence * 100).toFixed(1) + '%', sanitizeCsv(new Date(h.timestamp).toLocaleString())])
     ]
     const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
```
* **Reason for the change:** Prevents CSV formula injection vulnerabilities upon data export.
* **Expected impact:** Safe CSV file generation immune to spreadsheet formula execution.
* **Risk of breaking existing functionality:** **None**.

---

## 4. File: `isl-frontend/index.html`
### Exact changes that would be made:
```diff
--- a/isl-frontend/index.html
+++ b/isl-frontend/index.html
@@ -6,6 +6,7 @@
     <meta name="description" content="SanketSetu — Real-time Indian Sign Language Translation powered by AI. Bridge the communication gap with our ML-powered ISL translator." />
     <meta name="theme-color" content="#0f172a" />
+    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:8000 https://*.vercel.app;" />
     <title>SanketSetu — Indian Sign Language Translator</title>
```
* **Reason for the change:** Establishes client-side Content Security Policy boundaries against XSS.
* **Expected impact:** Mitigation of unauthorized script execution and unapproved data exfiltration.
* **Risk of breaking existing functionality:** **Low** (Must ensure all production API domains are listed in `connect-src`).

---

# Deployment Security Checklist

Before deploying SanketSetu to production (e.g., Vercel + Cloud VM/Render/Railway), ensure the following checklist is completed:

- [ ] **Environment Variables:** Set explicit `ALLOWED_ORIGINS` pointing strictly to the frontend production domain (no `*` wildcard).
- [ ] **API Authentication:** Enable `API_KEY_SECRET` in backend runtime and match `VITE_API_KEY` in frontend build environments.
- [ ] **HTTPS Enforcement:** Verify SSL/TLS certificates are active for both frontend and backend server pipelines.
- [ ] **Payload Limits:** Configure web server reverse-proxy (Nginx/Cloudflare) or Uvicorn to reject HTTP requests exceeding 1.5MB.
- [ ] **Model Integrity:** Ensure pre-trained model files (`.pkl`) are stored in restricted-access directories or migrate weights to ONNX format.
- [ ] **Error Handling:** Verify production logging strips internal file paths and stack traces from client API responses.
- [ ] **Security Headers:** Enforce HSTS, CSP, and `X-Content-Type-Options` headers across all web requests.

---

# Final Recommendation

### Safe to Apply Immediately (No Risk to Functionality)
1. **SEC-VULN-002 (Partial):** Pydantic `max_length` string validation on `/predict` image payloads.
2. **SEC-VULN-005:** Adding CSP and HTTP security headers to `index.html` and FastAPI middlewares.
3. **SEC-VULN-006:** Sanitizing generic HTTP exception error messages and logging stack traces server-side.
4. **SEC-VULN-007:** Sanitizing CSV export fields in `History.jsx` against formula injection.

### Requires User Approval (May Affect Application Functionality)
1. **SEC-VULN-001 (Model Deserialization):** Refactoring model pipelines from `joblib`/`pickle` to ONNX or integrating cryptographic HMAC validation checks.
2. **SEC-VULN-003 & SEC-VULN-004 (CORS & API Authentication):** Modifying CORS allowed origins and enforcing API key verification headers across the React frontend and FastAPI backend.

---
*End of Security Audit Report.*
