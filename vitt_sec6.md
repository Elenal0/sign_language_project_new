## Section 6: JWT Authentication — VERY IMPORTANT

### Q75. What is JWT?

**Concept and Fundamentals:**
**JSON Web Token (JWT)**, formally defined in **RFC 7519**, is an open, industry-standard method for representing claims securely between two parties as a compact, URL-safe JSON object.
Key architectural characteristics of JWT:
1. **Self-Contained:** A JWT carries all necessary contextual claims about the user (e.g., subject identifier, username, assigned roles, permissions, expiration timestamp) directly within its payload. The receiving party does not need to query a central database or session store to discover who the user is or what roles they hold.
2. **Cryptographically Signed:** Tokens are digitally signed using either:
   - A symmetric shared secret via HMAC algorithms (e.g., **HS256** - HMAC with SHA-256).
   - An asymmetric public/private key pair via RSA or ECDSA (e.g., **RS256** or **ES256**).
   The signature guarantees the **integrity** and **authenticity** of the token—the receiver can verify that the claims have not been tampered with in transit.
3. **Compact & URL-Safe:** Base64URL encoding ensures the token can be transmitted easily inside HTTP `Authorization` headers, query parameters, or URL paths without character escaping issues.
4. **Structural Composition:** A JWT consists of three distinct parts concatenated by dots (`.`):
   $$\text{JWT} = \text{Header} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{Payload} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{Signature}$$

**My Project Implementation:**
In VittSaathi, JWT serves as the exclusive security backbone for all API requests:
- Signed using HMAC-SHA256 (`HS256`) with a 256-bit cryptographically random secret key stored in environment variables.
- Contains standard claims (`sub` = user ID, `iat` = issued at timestamp, `exp` = expiration timestamp) and custom claims (`roles` = `["ROLE_USER"]`, `email` = `user@example.com`).
- Passed by the React frontend in the HTTP request header:
  `Authorization: Bearer <jwt_token>`
- Parsed and verified on every request by Spring Security's `JwtAuthenticationFilter`.

**Why I Used It:**
Financial platforms require high-throughput API processing and horizontal scalability. JWT eliminates database lookup overhead on every authenticated request, prevents CSRF attacks when stored securely in client memory, and enables seamless authentication across both the Spring Boot core service and the Python AI microservice.

**Alternatives and Comparison:**

| Token / Session Technology | Storage Location | Server Memory Overhead | Cross-Domain / Microservice Friendly | Tamper-Proof Guarantee |
| :--- | :--- | :--- | :--- | :--- |
| **JWT (JSON Web Token)** | Client-side (Memory / Storage)| Zero ($O(1)$) | High (Self-contained cryptographic proof)| Yes (Cryptographic signature) |
| **Server-Side Session ID**| Server RAM / Redis | Linear ($O(N)$ active users)| Low (Requires shared session store) | Yes (Opaque random token) |
| **HTTP Basic Auth** | Client sends user/pass per call | Zero | Moderate | High risk if credentials intercepted |
| **PASETO (Platform-Agnostic SEcuriTy Token)** | Client-side | Zero | High (Modern cryptographic cipher suites)| Yes (Prevents cipher confusion) |

**Interview-Ready Answer:**
"A JSON Web Token (JWT), defined in RFC 7519, is an open standard URL-safe token format that encodes identity claims in a compact JSON object and verifies integrity through cryptographic signatures. It consists of three dot-separated components: a header declaring the algorithm, a payload containing identity and authorization claims, and a digital signature verifying authenticity. 
In VittSaathi, I implemented JWT with HS256 encryption to handle authentication across our decoupled React frontend and Spring Boot microservice. Because the token is self-contained, our backend verifies user identity and permissions via cryptographic math on every API request without touching the PostgreSQL database, enabling high-performance, stateless horizontal scaling."

**Follow-up Depth:**
- *Cross-Question:* Can a client read the contents of a JWT without knowing the server's secret key?
  - *Answer:* Yes! A standard signed JWT (`JWS`) is merely **Base64URL encoded**, not encrypted. Anyone who intercepts the token can decode the header and payload using standard Base64 decoding. The secret key is only required to **verify the signature** or **generate** a new token. Therefore, sensitive confidential data (like plain passwords, credit card numbers, or social security numbers) must never be placed inside the JWT payload.

---

### Q76. Why did you use JWT?

**Concept and Fundamentals:**
The decision to use JWT over legacy stateful session cookies (`JSESSIONID`) is driven by fundamental distributed systems requirements:
1. **Zero Database I/O on Authentication:** In classic session authentication, every single incoming API request forces the server to execute a database or cache lookup (`SELECT * FROM sessions WHERE id = ?`). In a high-traffic system processing hundreds of concurrent requests per second, session queries saturate connection pools. JWT replaces database reads with CPU-bound cryptographic hash verification, taking sub-millisecond execution time.
2. **Stateless Horizontal Scaling:** When replicating backend containers across multiple Docker instances or Kubernetes pods, stateful sessions require **Sticky Sessions** (session affinity on load balancers) or a centralized distributed session store (like Redis session replication). With JWT, any backend replica can validate any token independently using the shared secret key.
3. **Decoupled Architecture & Mobile/CORS Support:** Cookies are subject to cross-origin restrictions (CORS) and third-party cookie blocking in modern browsers. Standard HTTP Bearer tokens in headers are platform-agnostic, working seamlessly across web SPAs, React Native mobile apps, and third-party API clients.
4. **Cross-Service Authorization:** In VittSaathi's multi-service architecture (Spring Boot Core and Python LangGraph AI service), the Python microservice can independently verify the user's JWT token without making an internal RPC call back to Spring Boot.

**My Project Implementation:**
In VittSaathi, when a user accesses their portfolio dashboard, the React frontend executes parallel API calls:
- `GET /api/v1/accounts`
- `GET /api/v1/transactions/summary`
- `GET /api/v1/budgets/progress`
Because we use JWT, Spring Boot handles all three parallel requests simultaneously across different worker threads without performing a single session lookup query. Furthermore, when the user queries the AI Advisor, the Python FastAPI service validates the exact same JWT signature before executing multi-agent LangGraph workflows.

**Why I Used It:**
JWT enabled true statelessness, eliminated database connection pool bottlenecks, simplified Docker multi-container deployment, and allowed both Java and Python services to share a unified authentication model.

**Alternatives and Comparison:**

| Architectural Metric | Stateful Sessions (`JSESSIONID`) | Stateless JWT (`Bearer`) |
| :--- | :--- | :--- |
| **Database/Cache Load** | 1 read query per incoming HTTP request | **0 read queries** (Cryptographic verification) |
| **Load Balancing** | Requires sticky sessions or Redis replication | Pure stateless round-robin load balancing |
| **Microservice Interoperability** | Complex session propagation | Native (Any service with secret key can verify) |
| **Instant Token Revocation** | Trivially easy (Delete session from DB/Redis) | Requires a token blacklist (e.g., Redis TTL) |

**Interview-Ready Answer:**
"I chose JWT for VittSaathi because our architecture is completely decoupled into a React Single-Page Application, a Spring Boot transactional core, and a Python AI microservice. Using traditional stateful HTTP sessions would have required sticky sessions on our load balancer or redundant database lookups on every request to verify user identity. 
With JWT, user claims and permissions are self-contained and cryptographically signed. This allows our Spring Boot backend to serve parallel dashboard requests with zero database session overhead, while simultaneously allowing our Python microservice to validate user identity independently using the same cryptographic secret."

**Follow-up Depth:**
- *Cross-Question:* What is the biggest architectural trade-off you accepted by choosing JWT over server sessions?
  - *Answer:* The biggest trade-off is **revocation difficulty**. Once a JWT is issued, it remains valid until its expiration time unless an explicit revocation mechanism is introduced. If a user logs out or has their account compromised, the token cannot be invalidated purely through stateless means. In VittSaathi, we mitigated this trade-off by using short-lived 15-minute access tokens coupled with a Redis-backed token blacklist for explicit logouts.

---

### Q77. How does JWT authentication work?

**Concept and Fundamentals:**
JWT authentication operates as a closed cryptographic token-exchange lifecycle:
```
Client (React)                  Server (Spring Boot)             Database / Cache
      |                                   |                              |
  1.  |--- POST /auth/login (creds) ----->|                              |
      |                                   |--- Verify bcrypt hash ------>|
      |                                   |<-- Credentials OK -----------|
      |                                   |                              |
      |                                   |-- Generate JWT (HMAC-SHA256) |
  2.  |<-- Return {token, refreshToken} --|                              |
      |                                   |                              |
  3.  |--- GET /api/v1/accounts --------->|                              |
      |    (Authorization: Bearer JWT)    |                              |
      |                                   |-- 1. Extract Bearer token    |
      |                                   |-- 2. Verify HMAC Signature   |
      |                                   |-- 3. Check expiration (exp)  |
      |                                   |-- 4. Check Redis Blacklist ->|
      |                                   |-- 5. Set SecurityContext     |
      |                                   |--- Query Account data ------>|
      |                                   |<-- Return Records -----------|
  4.  |<-- Return JSON 200 OK ------------|                              |
```

Detailed lifecycle phases:
1. **Authentication Handshake:** The client sends credentials via HTTPS `POST /api/v1/auth/login`.
2. **Credential Verification:** Spring Security's `AuthenticationManager` verifies the username and validates the password hash via `BCryptPasswordEncoder`.
3. **Token Construction & Signing:** The server constructs the JSON payload with claims, computes the signature using HMAC-SHA256 and the server secret, and returns the token string to the client.
4. **Client-Side Storage:** React stores the access token in memory or secure storage.
5. **Authenticated Request:** For subsequent API calls, Axios attaches the token: `Authorization: Bearer <token>`.
6. **Filter Interception & Cryptographic Math:** `JwtAuthenticationFilter` intercepts the request:
   - Verifies the signature using the server secret key.
   - Asserts that `System.currentTimeMillis() < exp`.
   - Checks Redis to confirm the token has not been blacklisted on logout.
   - Populates Spring's `SecurityContextHolder` with a `UsernamePasswordAuthenticationToken`.
7. **Downstream Execution:** The controller processes the request and returns the data.

**My Project Implementation:**
In VittSaathi, this workflow is implemented using Spring Security 6:
- `AuthController.java`: Exposes `/api/v1/auth/login`.
- `JwtTokenProvider.java`: Handles token generation, claim extraction, and signature validation.
- `JwtAuthenticationFilter.java`: Registered in the `SecurityFilterChain` before `UsernamePasswordAuthenticationFilter.class`.
- React Axios Interceptor: Automatically injects `Authorization: Bearer ${token}` on every outgoing HTTP request.

**Why I Used It:**
This decoupled workflow provides end-to-end security, protects user credentials (which are transmitted only once during initial login), and guarantees zero database overhead for session validation.

**Alternatives and Comparison:**

| Step | Session-Based Authentication | JWT Authentication |
| :--- | :--- | :--- |
| **Initial Login** | Verifies password, creates row in session table, sets cookie | Verifies password, computes HMAC signature, returns JWT |
| **Request Identification** | Browser sends `Cookie: JSESSIONID=xyz` | Client sends `Authorization: Bearer <token>` |
| **Server Validation** | Queries session store / DB by session ID | Recomputes HMAC hash on header + payload; zero DB query |
| **Logout** | Deletes row from session table | Client deletes token; server adds token ID to Redis blacklist |

**Interview-Ready Answer:**
"JWT authentication works in three phases: issuance, transmission, and verification. During login, the user submits credentials; once verified with BCrypt, our backend creates a JWT containing user claims and an expiration timestamp, cryptographically signs it using HMAC-SHA256, and returns it. 
For all subsequent requests, our React frontend sends this token in the `Authorization: Bearer` header. In Spring Boot, our `JwtAuthenticationFilter` intercepts the request, validates the signature against our secret key, checks that the token hasn't expired or been revoked in Redis, and establishes the user's security context—all without making a database query."

**Follow-up Depth:**
- *Cross-Question:* What happens inside the JVM when `JwtAuthenticationFilter` sets the `SecurityContext`?
  - *Answer:* `SecurityContextHolder` uses a `ThreadLocal` storage strategy by default. When the filter calls `SecurityContextHolder.getContext().setAuthentication(auth)`, it attaches the authentication object to the specific Tomcat worker thread processing that request. Downstream controllers can access the authenticated user via `@AuthenticationPrincipal`. At the end of the request filter chain, Spring Security's `FilterChainProxy` automatically clears the `ThreadLocal` context, preventing thread-pooling memory leaks or identity contamination across subsequent requests.

---

### Q78. What are the three parts of a JWT?

**Concept and Fundamentals:**
A JSON Web Token consists of three distinct parts separated by period (`.`) characters:
$$\text{JWT} = \underbrace{\text{Base64URL}(\text{Header})}_{\text{Part 1}} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \underbrace{\text{Base64URL}(\text{Payload})}_{\text{Part 2}} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \underbrace{\text{Base64URL}(\text{Signature})}_{\text{Part 3}}$$

Visual and functional breakdown:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJlbWFpbCI6InVzZXJAdml0dHNhYXRoaS5jb20iLCJyb2xlcyI6WyJST0xFX1VTRVIiXSwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.4z_WpT9H-k21p8M5wZ7nN7YyG1h0-3uE6o4rV-9tXsY
  \________________________________/ \____________________________________________________________________________________________________/ \__________________________________________/
              Header                                                Payload                                                                                  Signature
```
1. **Header:** A JSON object containing metadata about the token, specifically the cryptographic algorithm used to sign it (`alg`) and the token type (`typ`).
2. **Payload:** A JSON object containing the claims—statements about the entity (user) and additional contextual metadata (`sub`, `exp`, `iat`, custom roles).
3. **Signature:** A cryptographic hash generated by hashing the Base64URL-encoded header concatenated with the Base64URL-encoded payload, using the algorithm specified in the header and the server's private secret key.

**My Project Implementation:**
In VittSaathi, our generated tokens adhere strictly to this three-part standard:
- Header: `{"alg": "HS256", "typ": "JWT"}`
- Payload: User ID, email, role array, issue timestamp, expiration timestamp.
- Signature: Generated via `Keys.hmacShaKeyFor(secret.getBytes())` using the **jjwt** (Java JWT) library.

**Why I Used It:**
The 3-part design separates metadata, business claims, and cryptographic verification, ensuring universal parsability across programming languages (Java, Python, JavaScript) while maintaining tamper-proof integrity.

**Alternatives and Comparison:**

| Component | Format Before Encoding | Role | Can Client Read It? |
| :--- | :--- | :--- | :--- |
| **1. Header** | JSON (`alg`, `typ`) | Declares cryptographic algorithms | Yes (Decode Base64URL) |
| **2. Payload** | JSON (Claims, `sub`, `exp`)| Carries user identity and authorization data | Yes (Decode Base64URL) |
| **3. Signature** | Binary cryptographic hash | Validates that header and payload were not altered | No (Opaque cryptographic digest) |

**Interview-Ready Answer:**
"A JWT consists of three parts separated by dots: the Header, the Payload, and the Signature. The Header specifies the token type and the hashing algorithm like HMAC-SHA256. The Payload contains the claims, such as the user ID, roles, and expiration time. The Signature is calculated by taking the Base64URL-encoded header and payload, combining them with a secret key, and running them through the specified hashing algorithm. 
In VittSaathi, the signature guarantees that even though anyone can inspect the header and payload, only our backend can issue or validate them because only we possess the secret signing key."

**Follow-up Depth:**
- *Cross-Question:* Can a JWT have an empty signature (i.e., only two parts with a trailing dot)?
  - *Answer:* Yes, RFC 7519 defines an "unsecured JWT" where `alg` is set to `"none"`. In an unsecured JWT, the signature is empty: `header.payload.`. In early JWT implementations, this led to the notorious **JWT "alg: none" vulnerability**, where attackers stripped the signature and changed `alg` to `none` to impersonate admins. In VittSaathi, our JJWT library parser explicitly forbids `alg: none` tokens, rejecting any token that lacks a valid HMAC signature.

---

### Q79. What is the header?

**Concept and Fundamentals:**
The **Header** is the first component of a JWT. It is a JSON object that defines the cryptographic envelope and metadata instructions needed by the recipient to parse and verify the token.
Standard header parameters registered in RFC 7515 (JSON Web Signature - JWS):
1. **`alg` (Algorithm - Mandatory):** Specifies the cryptographic algorithm used to sign the token. Examples:
   - `HS256`: HMAC using SHA-256 (symmetric shared secret).
   - `RS256`: RSASSA-PKCS1-v1_5 using SHA-256 (asymmetric private/public key).
   - `ES256`: ECDSA using P-256 curve and SHA-256.
   - `none`: Unsecured token (forbidden in production).
2. **`typ` (Type - Optional but recommended):** Explicitly identifies the media type of the token. Typically set to `"JWT"`.
3. **`kid` (Key ID - Optional):** A hint indicating which key was used to sign the token. Crucial in enterprise environments supporting **Key Rotation**, where multiple public/private keys are active simultaneously.
4. **`cty` (Content Type):** Used only in nested token scenarios (e.g., when a JWT is signed and then encrypted inside a JWE).

Before transmission, this JSON object is serialized to bytes and encoded into a **Base64URL** string (without padding `=`).

**My Project Implementation:**
In VittSaathi, `JwtTokenProvider` constructs the header automatically:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```
Encoded representation:
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

**Why I Used It:**
The header informs our Spring Boot and Python AI token verifiers exactly which cryptographic routine to execute to validate the signature.

**Alternatives and Comparison:**

| Header Parameter | Purpose | Value in VittSaathi |
| :--- | :--- | :--- |
| **`alg`** | Cryptographic signature algorithm | `"HS256"` |
| **`typ`** | Token type identifier | `"JWT"` |
| **`kid`** | Key identifier for key rotation | Omitted (single environment secret) |

**Interview-Ready Answer:**
"The header is the first segment of a JWT, encoded in Base64URL. It contains metadata about the token, most importantly the `alg` property which specifies the cryptographic algorithm used for signing—such as HS256 or RS256—and the `typ` property, which is typically set to 'JWT'. 
In VittSaathi, our header specifies `{\"alg\": \"HS256\", \"typ\": \"JWT\"}`. This tells our Spring Security filter chain to verify the token signature using the HMAC-SHA256 algorithm before parsing any contained claims."

**Follow-up Depth:**
- *Cross-Question:* Why is relying blindly on the `alg` header parameter a severe security hazard (Algorithm Switching Attack)?
  - *Answer:* In an Algorithm Switching Attack (or Key Confusion Attack), an application expecting an asymmetric `RS256` token receives a token where an attacker has modified the header to `HS256` and signed it using the server's public key (which is publicly accessible). If the server blindly trusts the header's `alg` parameter, it verifies the HMAC signature using the public key as the symmetric secret, allowing the attacker to forge valid tokens. To prevent this, our backend strictly hardcodes the verification algorithm to HMAC-SHA256 and never trusts dynamic algorithm selection from unverified headers.

---

### Q80. What is the payload?

**Concept and Fundamentals:**
The **Payload** (or Claims Set) is the second segment of a JWT. It is a JSON object containing the **claims**—statements about an entity (typically the authenticated user) and additional contextual metadata.
RFC 7519 categorizes claims into three distinct classes:
1. **Registered Claims:** Predefined, standardized claims recommended to promote interoperability:
   - `sub` (Subject): The principal identifier of the user (e.g., UUID or email).
   - `iss` (Issuer): The identity of the authorization server that issued the token.
   - `aud` (Audience): The intended recipient service(s) for the token.
   - `exp` (Expiration Time): Unix epoch timestamp after which the token is invalid.
   - `nbf` (Not Before): Unix epoch timestamp before which the token must not be accepted.
   - `iat` (Issued At): Unix epoch timestamp indicating when the token was created.
   - `jti` (JWT ID): Unique identifier for the token, used to prevent replay attacks and track blacklisting.
2. **Public Claims:** Custom claims defined by application developers, registered in the IANA JSON Web Token Registry to prevent collision (e.g., OpenID Connect claims like `email`, `profile`).
3. **Private Claims:** Custom claims agreed upon by the communicating parties to share information specific to the application (e.g., `roles: ["ROLE_USER"]`, `tier: "PREMIUM"`).

**My Project Implementation:**
In VittSaathi, the payload structure is designed to be lightweight and secure:
```json
{
  "sub": "42",
  "email": "kiran@example.com",
  "roles": ["ROLE_USER"],
  "iat": 1729000000,
  "exp": 1729000900,
  "jti": "c4b3f81e-8a21-4f10-92de-41a293847291"
}
```

**Why I Used It:**
The payload provides instant authorization context. When an API call arrives, Spring Security reads the user's primary key (`sub`) and granted authorities (`roles`) directly from the token, completely eliminating database queries to the `users` and `roles` tables.

**Alternatives and Comparison:**

| Claim Type | Example | Purpose in VittSaathi |
| :--- | :--- | :--- |
| **Registered (`sub`, `exp`, `iat`, `jti`)** | `sub: "42"`, `exp: 1729000900` | Identifies user, enforces 15-min TTL, enables Redis blacklist |
| **Private (`email`, `roles`)** | `roles: ["ROLE_USER"]` | Enforces Spring Security RBAC without DB query |

**Interview-Ready Answer:**
"The payload is the middle part of a JWT, containing the claims or statements about the user and the token itself. These claims are divided into registered claims—like `sub` for user ID, `exp` for expiration timestamp, and `iat` for issue time—and custom claims like user roles and email. 
In VittSaathi, our payload contains the user ID as the subject, their assigned roles, an expiration timestamp set to 15 minutes, and a unique `jti` UUID. This allows our backend to immediately determine who the user is and what endpoints they can access without querying the database, while keeping sensitive data out of the token."

**Follow-up Depth:**
- *Cross-Question:* Why shouldn't you put user account balances or recent transactions inside the JWT payload?
  - *Answer:* For two critical reasons: First, a standard JWT is not encrypted; any network snooper or client-side script can view its contents. Second, and more importantly, financial balances change rapidly. Because a JWT is immutable once signed, any balance stored inside the token would become stale within seconds, creating synchronization inconsistencies across the application. Only stable, slow-changing identity and authorization attributes belong in a JWT payload.

---

### Q81. What is the signature?

**Concept and Fundamentals:**
The **Signature** is the third and most critical component of a JWT. It is the cryptographic proof that guarantees the **integrity** and **authenticity** of the token.
The signature ensures two immutable guarantees:
1. **Tamper Detection (Integrity):** If a malicious user or man-in-the-middle attacker modifies a single byte in the header or payload (e.g., changing `"roles": ["ROLE_USER"]` to `"roles": ["ROLE_ADMIN"]`), the signature becomes invalid.
2. **Sender Authenticity:** Because generating a valid signature requires knowledge of the server's secret private key, a valid signature proves that the token was issued by a trusted entity.

**Mathematical Generation of the Signature:**
To calculate the signature using HMAC-SHA256 (`HS256`):
$$\text{Signature} = \text{HMAC-SHA256}\Big(\text{Base64URL}(\text{Header}) \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{Base64URL}(\text{Payload}), \ K_{\text{secret}}\Big)$$
1. The server takes the Base64URL-encoded header and Base64URL-encoded payload, concatenating them with a period.
2. It feeds this string and the secret signing key ($K_{\text{secret}}$) into the HMAC-SHA256 cryptographic hash function.
3. The resulting binary message authentication code is Base64URL-encoded to form the final segment of the JWT.

**My Project Implementation:**
In VittSaathi, `JwtTokenProvider` signs tokens using a 256-bit cryptographic secret managed via JJWT:
```java
SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
String token = Jwts.builder()
    .setSubject(userId)
    .claim("roles", roles)
    .setIssuedAt(now)
    .setExpiration(expiryDate)
    .signWith(key, SignatureAlgorithm.HS256)
    .compact();
```

**Why I Used It:**
The cryptographic signature makes JWTs tamper-proof. Without the signature, clients could forge user IDs or escalate privileges at will.

**Alternatives and Comparison:**

| Signing Scheme | Key Type | Who Can Sign? | Who Can Verify? | Best Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Symmetric (HS256)** | Single shared secret key | Anyone with secret | Anyone with secret | Single backend / tightly controlled microservices |
| **Asymmetric (RS256 / ES256)**| Public/Private key pair | Only Private Key holder | Anyone with Public Key | Multi-tenant auth servers (Auth0, Okta, Keycloak) |

**Interview-Ready Answer:**
"The signature is the final part of a JWT, responsible for guaranteeing tamper resistance and authenticity. It is calculated by taking the Base64URL-encoded header, concatenating it with the Base64URL-encoded payload, and hashing them together using a secret key and a cryptographic algorithm like HMAC-SHA256. 
In VittSaathi, the signature ensures that a client cannot alter their user ID or role inside the payload. When an API request arrives, Spring Security recomputes the HMAC hash using our server's secret key; if even a single character was tampered with, the hashes will not match, and the request is rejected immediately."

**Follow-up Depth:**
- *Cross-Question:* If an attacker intercepts a valid JWT, can they alter the payload and generate a new signature?
  - *Answer:* No. To generate a valid signature matching the modified payload, the attacker would need the server's secret key ($K_{\text{secret}}$). Because HMAC-SHA256 is computationally infeasible to reverse or forge without the key (requiring $2^{256}$ brute-force attempts for a 256-bit key), an attacker cannot generate a valid signature.

---

### Q82. Is JWT encrypted?

**Concept and Fundamentals:**
**No, by default, a standard JWT is signed, NOT encrypted.**
This is one of the most widespread misconceptions in web engineering.
RFC standards distinguish between two distinct types of JSON Web Tokens:
1. **JWS (JSON Web Signature - RFC 7515):** This is what 99% of developers refer to as a "JWT".
   - The header and payload are simply **Base64URL encoded**.
   - Base64URL is a reversible encoding scheme designed for ASCII transport, **NOT encryption**.
   - Anyone who intercepts or possesses the token can paste it into `jwt.io` or run `atob()` in browser DevTools to read the claims in plain text.
   - **Guarantees:** Integrity and Authenticity (Tamper-proof).
   - **Does NOT Guarantee:** Confidentiality (Privacy).
2. **JWE (JSON Web Encryption - RFC 7516):**
   - The payload is genuinely encrypted using symmetric or asymmetric encryption algorithms (such as AES-GCM or RSA-OAEP).
   - The contents cannot be read by anyone without the decryption key.
   - A JWE has **five parts** separated by dots instead of three:
     $$\text{Header} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{Encrypted Key} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{IV} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{Ciphertext} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{Auth Tag}$$

**My Project Implementation:**
In VittSaathi, we use standard signed JWS (`HS256`). Because the payload is visible in plain text to anyone holding the token:
- We **never** store passwords, bank account numbers, PAN/SSN numbers, or private encryption keys inside the JWT claims.
- The payload contains only non-sensitive routing data: internal user ID (`sub: "42"`), email, role, and expiration timestamp.
- Confidentiality in transit is guaranteed by **TLS/HTTPS encryption** at the network transport layer.

**Why I Used It:**
JWS is lightweight, fast to verify, and universally supported across Java and Python runtimes. Implementing full JWE introduces significant computational overhead (encryption/decryption cycles on every HTTP request) that is unnecessary when transport confidentiality is already enforced via HTTPS.

**Alternatives and Comparison:**

| Standard | Structure | Confidential? (Can read payload?) | Tamper-proof? | Performance Overhead |
| :--- | :--- | :--- | :--- | :--- |
| **JWS (Standard JWT)** | 3 parts (`header.payload.sig`) | **No (Plain Base64URL)** | **Yes (Signed)** | Minimal (Hashing only) |
| **JWE (Encrypted JWT)** | 5 parts (`header.key.iv.cipher.tag`)| **Yes (Encrypted ciphertext)**| **Yes (Authenticated)** | High (Symmetric/Asymmetric cipher) |

**Interview-Ready Answer:**
"By default, standard JWTs are signed, not encrypted. The header and payload are merely Base64URL-encoded JSON, meaning anyone who inspects the token can easily decode and read its contents. What the token provides is integrity and authenticity through its cryptographic signature, guaranteeing it hasn't been modified. 
In VittSaathi, because we use standard signed JWS tokens, we strictly adhere to security best practices by never placing sensitive data like passwords or account numbers in the payload. We store only safe identifiers like user ID and roles, and rely on HTTPS at the transport layer to encrypt the entire HTTP request in transit."

**Follow-up Depth:**
- *Cross-Question:* If JWT payload data is unencrypted, why don't attackers steal it and impersonate the user?
  - *Answer:* The security model relies on treating the entire token as a **Bearer credential**. Just like an opaque session cookie, possession of the token allows access. We protect the token from interception by enforcing HTTPS (preventing network sniffing) and storing it securely on the client to prevent Cross-Site Scripting (XSS) extraction. The unencrypted nature of the claims is safe as long as the claims contain no confidential secrets.

---

### Q83. What is the difference between encoding and encryption?

**Concept and Fundamentals:**
Encoding, Encryption, and Hashing are three distinct cryptographic/data transformations that are frequently conflated:

1. **Encoding (e.g., Base64, Base64URL, Hex, ASCII):**
   - **Purpose:** Data usability and transport compatibility. Transforms binary data into a human-readable ASCII string format so it can travel safely across protocols (HTTP headers, URLs, email) without character corruption.
   - **Security / Confidentiality:** **Zero security.**
   - **Reversibility:** Fully reversible by anyone without any secret key, password, or algorithm knowledge. Running `Base64.decode(str)` instantly recovers the original data.

2. **Encryption (e.g., AES-256, RSA-2048, ChaCha20):**
   - **Purpose:** **Confidentiality.** Transforms plaintext into unreadable ciphertext so that unauthorized parties cannot understand the data.
   - **Security / Confidentiality:** Extremely high.
   - **Reversibility:** Two-way transformation, but reversible **ONLY by possessing the secret cryptographic key** (symmetric key or private asymmetric key). Without the key, decrypting is computationally infeasible.

3. **Hashing (e.g., SHA-256, BCrypt, HMAC):**
   - **Purpose:** **Integrity and verification.** A one-way mathematical function that maps arbitrary-sized input data to a fixed-size digest.
   - **Reversibility:** Mathematically irreversible (one-way). You cannot "unhash" a SHA-256 digest back into the original plaintext.

**My Project Implementation:**
In VittSaathi, all three concepts are deliberately applied in their proper roles:
- **Encoding:** Base64URL encodes the JWT header and payload so they can be passed inside HTTP headers.
- **Hashing:** BCrypt hashes user passwords before database storage; HMAC-SHA256 hashes the JWT header and payload with a secret to produce the signature.
- **Encryption:** AES-256 encrypts sensitive database columns (e.g., external API access tokens) at rest; TLS 1.3 encrypts HTTP packets in transit.

**Why I Used It:**
Understanding this distinction ensures that sensitive user secrets are never merely "encoded" under the false assumption of security.

**Alternatives and Comparison:**

| Operation | Primary Purpose | Reversible? | Requires Secret Key? | Example in VittSaathi |
| :--- | :--- | :--- | :--- | :--- |
| **Encoding** | Data transport & format conversion | **Yes, trivially by anyone** | **No** | Base64URL in JWT strings |
| **Encryption** | Confidentiality (Privacy) | **Yes, with secret key only** | **Yes** | TLS 1.3 in transit, AES-256 at rest |
| **Hashing** | Integrity & Authentication | **No (One-way math)** | Only for HMAC (keyed hash) | BCrypt for passwords, HMAC for JWT signatures |

**Interview-Ready Answer:**
"The fundamental difference is that encoding is designed for data transport compatibility, whereas encryption is designed for confidentiality. Encoding—like Base64URL—transforms data into a standardized ASCII format without using a key, meaning anyone can reverse it. Encryption transforms plaintext into ciphertext using a mathematical algorithm and a secret key, ensuring that only holders of the correct decryption key can read the underlying data. 
In VittSaathi, the JWT header and payload are merely Base64URL-encoded for safe HTTP transport, while actual confidentiality is enforced through HTTPS transport encryption and AES-256 encryption for sensitive data at rest."

**Follow-up Depth:**
- *Cross-Question:* Why does JWT use Base64URL encoding instead of standard Base64 encoding?
  - *Answer:* Standard Base64 uses the characters `+` and `/`, and pads with `=`. In URLs and HTTP headers, `+` is often interpreted as a space, `/` is interpreted as a path delimiter, and `=` requires URL percentage-encoding (`%3D`). **Base64URL** (RFC 4648) solves this by replacing `+` with `-`, replacing `/` with `_`, and completely omitting trailing `=` padding characters, making the resulting token completely safe for HTTP headers, URL query parameters, and REST paths without escaping.

---

### Q84. How is a JWT generated?

**Concept and Fundamentals:**
JWT generation is a deterministic, five-step algorithmic process executed on the authorization server upon successful user credential verification:
1. **Step 1: Construct the Header JSON:**
   Create a JSON object defining the signing algorithm and token type:
   ```json
   {"alg": "HS256", "typ": "JWT"}
   ```
2. **Step 2: Construct the Payload JSON (Claims):**
   Assemble the standard registered claims and application-specific claims:
   ```json
   {
     "sub": "42",
     "roles": ["ROLE_USER"],
     "iat": 1729000000,
     "exp": 1729000900
   }
   ```
3. **Step 3: Base64URL Encode Header and Payload:**
   Serialize both JSON objects to UTF-8 strings and encode them:
   $$\text{encodedHeader} = \text{Base64URL}(\text{Header})$$
   $$\text{encodedPayload} = \text{Base64URL}(\text{Payload})$$
4. **Step 4: Compute the Digital Signature:**
   Concatenate the two encoded strings with a dot separator, and compute the HMAC-SHA256 hash using the server's private secret key:
   $$\text{rawSignature} = \text{HMAC-SHA256}\Big(\text{encodedHeader} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{encodedPayload}, \ K_{\text{secret}}\Big)$$
   $$\text{encodedSignature} = \text{Base64URL}(\text{rawSignature})$$
5. **Step 5: Assemble Final Token String:**
   Concatenate all three encoded strings:
   $$\text{JWT} = \text{encodedHeader} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{encodedPayload} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{encodedSignature}$$

**My Project Implementation:**
In VittSaathi, this is encapsulated in `JwtTokenProvider.java` using the `jjwt-api` library:
```java
public String generateAccessToken(Authentication authentication) {
    UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtExpirationMs); // 15 mins

    List<String> roles = userPrincipal.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList());

    return Jwts.builder()
            .setSubject(Long.toString(userPrincipal.getId()))
            .claim("email", userPrincipal.getUsername())
            .claim("roles", roles)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
}
```

**Why I Used It:**
Encapsulating token generation within a dedicated provider class adheres to the Single Responsibility Principle, centralizing expiration constants, algorithm definitions, and claim management in one audited location.

**Alternatives and Comparison:**

| Library / Tool | Platform | Performance | Security Maintenance |
| :--- | :--- | :--- | :--- |
| **JJWT (`io.jsonwebtoken`)** | Java / Spring Boot | High, modern fluent builder API | Actively maintained, strictly conforms to RFC specs |
| **Nimbus JOSE + JWT** | Java / Enterprise | Very high, complex configuration | Standard in Spring Security OAuth2 |
| **PyJWT** | Python / FastAPI | High | Used in our Python AI service |

**Interview-Ready Answer:**
"Generating a JWT involves five sequential steps: first, constructing the JSON header specifying the algorithm; second, creating the JSON payload with user claims, issue time, and expiration; third, Base64URL-encoding both parts; fourth, hashing them together with our server secret key using HMAC-SHA256 to create the binary signature; and fifth, Base64URL-encoding that signature and joining all three parts with dots. 
In VittSaathi, I implemented this using the JJWT library inside `JwtTokenProvider`. Upon successful login, the provider injects the user's primary key, email, roles, and a 15-minute expiration timestamp, cryptographically signs it with our 256-bit secret, and returns the compact token to the frontend."

**Follow-up Depth:**
- *Cross-Question:* What minimum key length is required for an HMAC-SHA256 secret key according to cryptographic standards?
  - *Answer:* RFC 7518 (JSON Web Algorithms) explicitly mandates that keys used with `HS256` **MUST have a size greater than or equal to 256 bits (32 bytes)**. If you attempt to sign an HMAC-SHA256 token with a short password like `"my-secret"`, modern libraries like JJWT 0.12+ will throw a `WeakKeyException` at startup and refuse to run, preventing brute-force dictionary attacks.

---

### Q85. How does the server validate a JWT?

**Concept and Fundamentals:**
Server-side validation of a JWT is an efficient cryptographic verification process that does not require database access. When an incoming request arrives with a token, the server executes five sequential verification checks:
1. **Format & Structural Validation:**
   The server splits the incoming string by the `.` delimiter. It verifies that the token contains exactly three non-empty segments (`header`, `payload`, `signature`). If not, it rejects the request immediately (`MalformedJwtException`).
2. **Cryptographic Signature Verification:**
   - The server takes the received `header` and `payload` segments.
   - It recomputes the HMAC-SHA256 signature using its own secret key:
     $$\text{expectedSignature} = \text{Base64URL}\Big(\text{HMAC-SHA256}(\text{header} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{payload}, \ K_{\text{secret}})\Big)$$
   - It compares `expectedSignature` with the received `signature` using a **constant-time string comparison** (`MessageDigest.isEqual()`) to prevent **timing attacks**.
   - If they do not match, the token was forged or tampered with; validation fails immediately (`SignatureException`).
3. **Expiration Verification (`exp` claim):**
   The server extracts the `exp` timestamp from the payload and asserts:
   $$\text{currentTime} < \text{exp}$$
   If expired, it throws `ExpiredJwtException`.
4. **Clock Skew Tolerance (Optional):**
   Servers often allow 30–60 seconds of clock skew tolerance to account for slight NTP drift across distributed server clusters.
5. **Revocation / Blacklist Check:**
   The server checks an in-memory Redis blacklist to verify that the token's unique ID (`jti`) was not invalidated via an explicit user logout.

**My Project Implementation:**
In VittSaathi, validation occurs in `JwtAuthenticationFilter`:
```java
public boolean validateToken(String token) {
    try {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        // Check Redis blacklist
        if (redisTemplate.hasKey("blacklist:" + token)) {
            log.warn("Token is blacklisted");
            return false;
        }
        return true;
    } catch (JwtException | IllegalArgumentException e) {
        log.error("JWT validation error: {}", e.getMessage());
        return false;
    }
}
```

**Why I Used It:**
Cryptographic signature validation is executed entirely in CPU memory in less than 0.2 milliseconds, protecting our PostgreSQL database from high-concurrency connection exhaustion.

**Alternatives and Comparison:**

| Verification Step | Failure Exception | HTTP Response |
| :--- | :--- | :--- |
| **Malformed Structure** | `MalformedJwtException` | `401 Unauthorized` |
| **Signature Mismatch** | `SignatureException` | `401 Unauthorized` |
| **Token Expired** | `ExpiredJwtException` | `401 Unauthorized` (Triggers frontend refresh) |
| **Token Blacklisted** | Custom Security Exception | `401 Unauthorized` |

**Interview-Ready Answer:**
"Validating a JWT involves cryptographic verification without database overhead. When a request arrives, our Spring Security filter splits the token into its three segments, takes the received header and payload, and recomputes the HMAC-SHA256 signature using our backend secret key. It then performs a constant-time comparison against the received signature to verify the data hasn't been altered. 
Once the signature is verified, it checks that the current time is before the expiration timestamp and checks Redis to ensure the token hasn't been revoked. If all checks pass, Spring Security populates the SecurityContext with the user's identity."

**Follow-up Depth:**
- *Cross-Question:* Why is a 'constant-time comparison' strictly required when comparing cryptographic signatures?
  - *Answer:* Standard string comparison (`String.equals()`) terminates early on the very first mismatched byte. An attacker can measure microscopic differences in server response times (nanoseconds) across thousands of requests to deduce valid signature bytes one by one—a vulnerability known as a **Timing Attack**. Constant-time comparison (`MessageDigest.isEqual()`) always iterates through all bytes regardless of where a mismatch occurs, eliminating timing side-channels.

---

### Q86. Where do you store the JWT on the frontend?

**Concept and Fundamentals:**
Client-side storage of authentication tokens in Single-Page Applications (SPAs) involves a critical security trade-off between two major attack vectors: **Cross-Site Scripting (XSS)** and **Cross-Site Request Forgery (CSRF)**:

1. **`localStorage` / `sessionStorage`:**
   - **XSS Risk:** **Extremely Vulnerable.** Any malicious JavaScript running in the browser (via a compromised npm package, third-party analytics script, or injected DOM element) can execute `localStorage.getItem('token')` and exfiltrate the token to an attacker's server.
   - **CSRF Risk:** **Completely Immune.** Browsers never automatically attach `localStorage` values to cross-origin HTTP requests.
   - **Convenience:** Trivially easy to implement in React using Axios interceptors.

2. **In-Memory JavaScript State (React State / Redux / Context):**
   - **XSS Risk:** **Highly Resistant.** The token is kept in private closure variables or memory state. Malicious scripts cannot simply read a storage key. However, if the page is refreshed, the token is lost.
   - **CSRF Risk:** **Immune.**

3. **`HttpOnly`, `Secure`, `SameSite` Cookies:**
   - **XSS Risk:** **Completely Immune.** When a cookie is marked `HttpOnly`, client-side JavaScript (`document.cookie`) cannot access it under any circumstances, preventing XSS token theft.
   - **CSRF Risk:** **Vulnerable unless protected.** Because browsers automatically attach cookies to outgoing requests, attackers can trick users into triggering unauthorized actions from malicious third-party sites.
   - **Mitigation:** Mitigated by configuring `SameSite=Strict` or `SameSite=Lax`, and using anti-CSRF tokens.

**My Project Implementation:**
In VittSaathi, we implement the **Recommended Production Hybrid Strategy**:
- **Access Token:** Stored **in-memory** within React application state (Context API). It is attached to outgoing Axios requests via an Authorization header.
- **Refresh Token:** Stored in an **`HttpOnly`, `Secure`, `SameSite=Strict` Cookie** issued by Spring Boot on the `/api/v1/auth/login` endpoint.
- When the page is reloaded, React executes a silent background call to `POST /api/v1/auth/refresh-token`. The browser automatically sends the secure cookie, and Spring Boot returns a new short-lived access token into memory.

**Why I Used It:**
This hybrid architecture provides the gold standard of SPA security: client-side JavaScript cannot read the refresh token (preventing permanent session theft via XSS), while the in-memory access token prevents CSRF attacks on transactional endpoints.

**Alternatives and Comparison:**

| Storage Mechanism | XSS Vulnerability | CSRF Vulnerability | Persists across Page Refresh? | Recommended by OWASP? |
| :--- | :--- | :--- | :--- | :--- |
| **`localStorage`** | **Critical (Stealable via JS)** | Immune | Yes | No (discouraged for sensitive apps)|
| **In-Memory (React State)**| Minimal (Not directly accessible)| Immune | No (lost on refresh) | Yes (for Access Tokens) |
| **`HttpOnly` Cookie** | **Immune (JS blocked)** | Needs `SameSite` protection | Yes | Yes (for Refresh Tokens) |

**Interview-Ready Answer:**
"Where to store a JWT represents a balance between XSS and CSRF risks. Storing tokens in `localStorage` makes them trivially vulnerable to XSS theft, while using standard cookies exposes you to CSRF. 
In VittSaathi, I implemented the OWASP-recommended hybrid pattern: the short-lived 15-minute access token is stored strictly in React's in-memory state, making it inaccessible to XSS storage scrapers. The long-lived refresh token is stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie that JavaScript cannot read. When the page refreshes or the access token expires, a silent API call uses the secure cookie to replenish the in-memory token."

**Follow-up Depth:**
- *Cross-Question:* What does the `SameSite=Strict` cookie attribute actually do?
  - *Answer:* `SameSite=Strict` instructs the browser to never send the cookie in cross-site requests under any circumstances—even if a user clicks an external hyperlink leading to your site from an external email or webpage. The cookie is only transmitted if the request originates from the exact same domain, effectively neutralizing Cross-Site Request Forgery (CSRF) attacks.

---

### Q87. What happens when the token expires?

**Concept and Fundamentals:**
Token expiration is enforced via the registered `exp` claim, which contains a Unix timestamp representing the exact second the token ceases to be valid.
Lifecycle when a token expires:
1. **Server-Side Rejection:**
   When an expired token is sent in the `Authorization: Bearer` header, the backend parser (e.g., JJWT) calculates that `System.currentTimeMillis() / 1000 > exp`. It throws an `ExpiredJwtException`, halts further request processing, and invokes `JwtAuthenticationEntryPoint`, returning an **HTTP 401 Unauthorized** response with an error code like `TOKEN_EXPIRED`.
2. **Client-Side Detection:**
   The frontend HTTP client (Axios) intercepts the 401 response via a **Response Interceptor**.
3. **Automated Refresh Workflow (Silent Refresh):**
   - The interceptor pauses the failed request and queues any subsequent parallel requests.
   - It issues a background `POST /api/v1/auth/refresh` request sending the long-lived refresh token.
   - If the refresh token is valid, the server returns a fresh access token.
   - The Axios interceptor updates the in-memory token, updates the original request's `Authorization` header, and replays the original request transparently. The end user experiences zero UI interruption.
4. **Session Termination (Hard Expiry):**
   If the refresh token itself has expired or been revoked, the refresh request fails with 401/403. The frontend clears all memory state and redirects the user to the `/login` page with an informational toast: *"Session expired, please log in again."*

**My Project Implementation:**
In VittSaathi:
- Access tokens expire after **15 minutes**.
- Refresh tokens expire after **7 days**.
- Axios response interceptor intercepts 401 errors, requests a new access token via `/api/v1/auth/refresh`, and retries the original API call.

**Why I Used It:**
Short expiration windows limit the blast radius if an access token is intercepted over an insecure network, while the automated refresh flow ensures a seamless user experience.

**Alternatives and Comparison:**

| Token Expiration Scenario | Server Action | Client UX Action |
| :--- | :--- | :--- |
| **Access Token Expired, Refresh Valid** | Rejects API call with 401 `TOKEN_EXPIRED` | Transparent background refresh; replay request without user disruption |
| **Refresh Token Expired** | Rejects refresh endpoint with 401/403 | Force logout; redirect user to `/login` |
| **No Expiration (`exp` omitted)** | Security anti-pattern; token valid forever | Catastrophic vulnerability if leaked |

**Interview-Ready Answer:**
"When an access token expires, the backend's JJWT parser throws an `ExpiredJwtException` and Spring Security rejects the request with an HTTP 401 Unauthorized status. 
In VittSaathi, our React frontend handles this transparently using an Axios response interceptor. When a 401 is received with an expired token error, the interceptor pauses outgoing requests and sends a background request to our `/api/v1/auth/refresh` endpoint using the HttpOnly refresh token. Once a new 15-minute access token is issued, the interceptor updates the failed request's header and replays it automatically, so the user never experiences an unexpected session interruption."

**Follow-up Depth:**
- *Cross-Question:* How do you prevent multiple simultaneous 401 errors from triggering multiple duplicate refresh token calls in React?
  - *Answer:* We implement an **Axios Refresh Mutex / Queue**. We maintain an `isRefreshing` boolean flag. When the first 401 arrives, `isRefreshing` is set to `true`, and subsequent failing requests push their callbacks into a subscriber array. Once the single refresh request resolves, all queued requests in the subscriber array are executed with the new token, and `isRefreshing` resets to `false`.

---

### Q88. What is refresh token?

**Concept and Fundamentals:**
A **Refresh Token** is a specialized, long-lived credential whose sole purpose is to obtain new, short-lived **Access Tokens** without requiring the user to re-enter their username and password.
Key characteristics of a Refresh Token:
1. **Extended Lifespan:** While an access token typically lives for 5 to 15 minutes, a refresh token typically lives for days, weeks, or months (e.g., 7 days in VittSaathi).
2. **Restricted Scope & Surface Area:** Unlike access tokens, which are transmitted on every single API call across all endpoints, a refresh token is **ONLY sent to a single dedicated endpoint**: `POST /api/v1/auth/refresh`. This drastically minimizes network exposure.
3. **Storage Security:** Must be stored with maximum security—preferably in an `HttpOnly`, `Secure` cookie, or in an encrypted database table on mobile devices.
4. **Stateful Revocation Capability:** While access tokens are stateless, refresh tokens are almost always tracked in a server-side database or Redis store. This allows administrators or users to revoke a user's session (e.g., "Log out of all devices") by deleting the refresh token record.

**My Project Implementation:**
In VittSaathi:
- When a user logs in, Spring Boot generates both an Access Token (15 min) and a Refresh Token (7 days).
- The refresh token is an opaque cryptographic UUID or a high-entropy string stored in PostgreSQL in a `refresh_tokens` table tied to the `user_id`, with an explicit expiration timestamp and a `revoked` boolean flag.
- Returned to the client inside a secure cookie:
  `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh`

**Why I Used It:**
Refresh tokens solve the fundamental dilemma of stateless authentication: balancing security (short token lifetimes) with user convenience (not forcing users to re-login every 15 minutes).

**Alternatives and Comparison:**

| Dimension | Access Token | Refresh Token |
| :--- | :--- | :--- |
| **Lifespan** | Short (10–15 minutes) | Long (7–30 days) |
| **Transmission Frequency**| Every API request | Only to `/auth/refresh` |
| **Statefulness** | Stateless (Cryptographic validation) | Stateful (Tracked in DB/Redis for revocation) |
| **Payload** | Carries user claims and roles | Opaque token or minimal token ID |
| **Target Audience** | Resource Servers (API endpoints) | Authorization Server (`/auth/refresh`) |

**Interview-Ready Answer:**
"A refresh token is a long-lived credential used exclusively to request new short-lived access tokens without forcing the user to re-enter their credentials. 
In VittSaathi, our access tokens expire after 15 minutes to limit exposure if intercepted, while our refresh token is valid for 7 days and stored in a secure, HttpOnly cookie restricted to the `/api/v1/auth/refresh` endpoint. Unlike access tokens, refresh tokens are tracked in our PostgreSQL database, which allows us to provide instant session revocation if a user logs out or changes their password."

**Follow-up Depth:**
- *Cross-Question:* What is **Refresh Token Rotation (RTR)** and why is it recommended?
  - *Answer:* Refresh Token Rotation is a security standard where every time a refresh token is used to obtain a new access token, the authorization server invalidates the used refresh token and issues a brand-new refresh token alongside the new access token. If an attacker manages to steal a refresh token, any subsequent use by either the legitimate user or the attacker immediately flags a token re-use condition, allowing the server to revoke all sessions in that family instantly.

---

### Q89. Access token vs refresh token?

**Concept and Fundamentals:**
Understanding the architectural separation between Access Tokens and Refresh Tokens is essential for building secure distributed systems:

| Feature / Dimension | Access Token | Refresh Token |
| :--- | :--- | :--- |
| **Core Purpose** | Authorize access to protected API resources | Authorize issuance of a new Access Token |
| **Typical Lifespan** | 5 to 15 minutes | Several days to months (e.g., 7–30 days) |
| **Storage Location** | In-Memory (React state / Context) | `HttpOnly`, `Secure` Cookie or Encrypted Storage |
| **Network Exposure** | High (Transmitted on every single HTTP request) | Ultra-low (Transmitted only to `/refresh` endpoint) |
| **Server Verification** | Stateless (Verified via CPU cryptographic math) | Stateful (Checked against DB or Redis whitelist) |
| **Revocation Model** | Difficult (Relies on short TTL or Redis blacklist) | Instant (Delete record from DB or Redis) |
| **Format** | Signed JWT (Header + Payload + Signature) | Opaque high-entropy string or specialized JWT |
| **Impact if Compromised** | Attacker gains access for up to 15 minutes | Attacker can maintain access indefinitely unless revoked |

**My Project Implementation:**
In VittSaathi:
- **Access Token:** 15-minute validity, carries user ID and `ROLE_USER`, sent in `Authorization: Bearer` header on endpoints like `/api/v1/transactions`.
- **Refresh Token:** 7-day validity, opaque 128-bit secure random string stored in PostgreSQL `refresh_tokens` table, accessible only by `/api/v1/auth/refresh`.

**Why I Used It:**
This separation provides optimal defense-in-depth: frequent API calls use short-lived stateless tokens that minimize database load, while long-term session persistence is anchored by a tightly guarded, statefully revocable token.

**Alternatives and Comparison:**

| Architecture Pattern | Security Assessment | User Experience |
| :--- | :--- | :--- |
| **Access Token Only (Long Lifespan, e.g., 30 days)** | **Severe Risk.** Leaked token provides 30 days of uncontrolled access. | Convenient (Never prompted to login) |
| **Access Token Only (Short Lifespan, e.g., 15 min)** | Secure, but **Terrible UX**. User forced to login every 15 min. | Frustrating |
| **Dual Token Architecture (Access + Refresh)** | **Optimal.** High security + Seamless user experience. | Excellent (Silent background refresh) |

**Interview-Ready Answer:**
"The core difference lies in their purpose, lifespan, and security posture. An access token is a short-lived, stateless JWT—typically lasting 15 minutes—sent on every API request to authorize access to resources. A refresh token is a long-lived credential—lasting days or weeks—stored in an HttpOnly cookie and used exclusively at the authentication endpoint to obtain new access tokens. 
In VittSaathi, this two-token architecture gives us the best of both worlds: high performance through stateless access tokens that bypass database session lookups, and strong security through stateful refresh tokens that allow instant session revocation."

**Follow-up Depth:**
- *Cross-Question:* Can a refresh token also be a JWT instead of an opaque string?
  - *Answer:* Yes, refresh tokens can be JWTs. However, using opaque tokens stored in a database or Redis for refresh tokens is often preferred because refresh tokens require stateful revocation checks anyway. An opaque token carries zero metadata, preventing any possibility of data leakage if inspected.

---

### Q90. What is stateless authentication?

**Concept and Fundamentals:**
**Stateless Authentication** is an authentication paradigm where the server does not retain any session records, active user states, or authentication context in its memory or database across requests.
- **Traditional Stateful Authentication:**
  - Client submits credentials.
  - Server validates credentials, creates a session object in server memory (`HttpSession`), generates a random session ID, and sends it in a `Set-Cookie: JSESSIONID=...` header.
  - On every subsequent request, the server looks up the session ID in its memory or Redis cluster to identify the user.
  - **Memory Cost:** $O(N)$ where $N$ is the number of concurrent logged-in users.
- **Stateless Authentication (JWT-Based):**
  - Client submits credentials.
  - Server validates credentials, generates a cryptographically signed token containing identity claims, and returns it to the client.
  - The server stores **nothing** in memory or database.
  - On subsequent requests, the client presents the token. The server verifies the signature using mathematical cryptographic operations.
  - **Memory Cost:** $O(1)$ constant memory overhead regardless of user count.

**My Project Implementation:**
In VittSaathi, Spring Security's session creation policy is configured as stateless:
```java
http.sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
```
Tomcat never allocates a session table, and no `JSESSIONID` cookie is ever generated. Every single API request is evaluated independently based on its cryptographic Bearer token.

**Why I Used It:**
Statelessness allows our Spring Boot and Python AI containers to run in lightweight Docker containers and scale horizontally across multiple instances without needing distributed session clustering.

**Alternatives and Comparison:**

| Dimension | Stateful (Session-Based) | Stateless (Token-Based) |
| :--- | :--- | :--- |
| **Session State Location**| Server Memory / Redis | Client-Side (Inside Token) |
| **Server Resource Usage**| Scales linearly with user base | Constant memory usage |
| **Horizontal Scalability**| Requires Sticky Sessions or Redis clustering | Trivially scalable (Round-robin routing) |
| **Cross-Service Sharing** | Requires shared session database | Works natively across microservices |
| **Immediate Invalidation**| Trivially easy (Delete session row) | Requires blacklist cache |

**Interview-Ready Answer:**
"Stateless authentication is an architecture where the server stores no session records or user state in memory between requests. Instead, all identity claims and permissions are encapsulated inside a cryptographically signed client-side token like a JWT. 
In VittSaathi, we enforce statelessness via Spring Security's `SessionCreationPolicy.STATELESS`. Because our servers never allocate session memory, incoming requests can be routed to any backend container without sticky sessions, allowing us to scale our Dockerized microservices horizontally with zero session-synchronization overhead."

**Follow-up Depth:**
- *Cross-Question:* If an application is completely stateless, how can you track how many active users are currently logged in?
  - *Answer:* In a purely stateless system, you cannot know the exact count of active sessions from server memory alone. To track active users in a stateless architecture, you implement asynchronous telemetry: for example, emitting a lightweight heartbeat event or updating a `last_active_at` timestamp in Redis or a time-series store during API calls.

---

### Q91. Why is JWT considered stateless?

**Concept and Fundamentals:**
JWT is classified as **stateless** because the token is entirely **self-contained**:
1. **Self-Contained Data:** The token carries its own identity metadata: the user ID (`sub`), user email, assigned roles, issue time, and expiration time.
2. **Cryptographic Self-Verification:** The server does not need to query a database table, Redis cache, or in-memory dictionary to verify whether the token is genuine. The authenticity of the token is verified using purely mathematical cryptographic algorithms (HMAC or RSA) using the server's local secret key.
3. **No Server Session Record:** When a JWT is issued, the server does not store a copy of the token. Once the token string is transmitted in the HTTP response, the server forgets it completely.
4. **Independent Nodes:** If Node A issues a JWT to a user, and the next request is routed to Node B, Node B can validate the token immediately without communicating with Node A or sharing a database, provided both nodes have access to the same signing secret.

**My Project Implementation:**
In VittSaathi, when a user queries `/api/v1/transactions`, our `JwtAuthenticationFilter` reads the token, executes `Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token)`, extracts `userId = 42` and `roles = [ROLE_USER]`, and immediately authorizes the request. No database read or session lookup is executed.

**Why I Used It:**
This stateless design provides sub-millisecond authorization checks and enables frictionless microservice communication between our Java backend and Python LangGraph service.

**Alternatives and Comparison:**

| Property | Stateful Token (e.g., Random UUID) | Stateless Token (JWT) |
| :--- | :--- | :--- |
| **Information Carried** | None (Opaque pointer) | Complete (User ID, roles, expiry) |
| **Verification Method** | Database / Cache Lookup | Mathematical Cryptographic Verification |
| **Storage Requirement** | Mandatory Server Storage | Zero Server Storage |
| **Network Autonomy** | Coupled to Central Session DB | Completely Autonomous |

**Interview-Ready Answer:**
"A JWT is considered stateless because it is completely self-contained. It encapsulates the user's identity, roles, and expiration time directly within its payload, and proves its own authenticity through a cryptographic signature. 
Unlike stateful sessions where the server must query a session database to identify the caller, a server validating a JWT requires only its secret key and CPU cycles to verify the signature. Once issued, our Spring Boot server stores no record of the token, allowing any server node to validate incoming requests independently."

**Follow-up Depth:**
- *Cross-Question:* If you introduce a Redis blacklist to revoke JWTs on logout, is your system still 100% stateless?
  - *Answer:* Technically, no. The moment you introduce a server-side Redis lookup to check whether a token has been revoked, you introduce a degree of statefulness. However, it is an **optimized hybrid statefulness**: the Redis check is an ultra-fast $O(1)$ in-memory existence check that only stores *revoked* tokens until their natural expiration, rather than storing state for *every active user*. The primary authentication data remains entirely stateless within the token.

---

### Q92. Can a JWT be revoked?

**Concept and Fundamentals:**
By foundational design, **a purely stateless JWT cannot be revoked before its expiration time** ($exp$). Because the token is self-contained and the server maintains no central session registry, any server holding the secret key will consider a mathematically valid, unexpired token legitimate.
However, in real-world production systems, revocation is an absolute requirement for security:
- A user clicks "Logout".
- A user changes or resets their password.
- A user's device is lost or stolen.
- Suspicious activity or privilege downgrade occurs.

To achieve token revocation in a JWT architecture, engineering teams employ several proven strategies:
1. **Redis Blacklist (Token Deny-List - VittSaathi Approach):**
   When a user logs out, the remaining lifetime of the token is calculated:
   $$\text{TTL} = exp - \text{currentTime}$$
   The token string (or its unique `jti` ID) is inserted into Redis with this TTL:
   `SET blacklist:<token_or_jti> "revoked" EX <TTL>`
   During authentication validation, the server checks Redis. If the key exists, the token is rejected. Once the token naturally expires, Redis automatically evicts the key, preventing memory bloat.
2. **Short Token Lifespans (10–15 Minutes):**
   Combine short-lived access tokens with revocable refresh tokens. If access token revocation is needed, the damage window is strictly capped at 15 minutes.
3. **User Token Version / `jwt_version` in DB:**
   The `users` table holds a `token_version INT` column, also included in the JWT payload. To invalidate all active tokens for a user, increment the database column (`token_version = token_version + 1`). Any incoming token with an older version number is rejected.
4. **Key Rotation (Nuclear Option):**
   Changing the server's master secret key instantly invalidates all JWTs issued across the entire platform.

**My Project Implementation:**
In VittSaathi, we implement the **Redis Blacklist Strategy**:
- When the user calls `POST /api/v1/auth/logout`, `AuthService` extracts the JWT, computes the remaining seconds until `exp`, and writes `blacklist:<token>` to Redis with an automatic TTL.
- `JwtAuthenticationFilter` executes `redisTemplate.hasKey("blacklist:" + token)` before setting the `SecurityContext`.

**Why I Used It:**
The Redis blacklist provides instant revocation on logout while maintaining sub-millisecond lookup performance ($O(1)$) and preventing memory leaks via Redis TTL auto-eviction.

**Alternatives and Comparison:**

| Revocation Strategy | Revocation Speed | Storage Overhead | Implementation Complexity |
| :--- | :--- | :--- | :--- |
| **Redis Blacklist (VittSaathi)**| **Instant** | Low (Stores only logged-out tokens until exp)| Low |
| **Token Version in DB** | **Instant** | Zero (Single integer column in user table)| Requires DB read per request (loses statelessness)|
| **Short TTL Only (No Blacklist)**| Delayed (Up to 15 min)| Zero | Trivial |
| **Secret Key Rotation** | Instant for ALL users| Zero | Extreme (Forces entire user base to re-login) |

**Interview-Ready Answer:**
"By default, a purely stateless JWT cannot be revoked because the server keeps no record of active tokens. However, in production, revocation is mandatory for secure logouts. 
In VittSaathi, I solved this by implementing a Redis token blacklist. When a user logs out, we extract the token's expiration timestamp, calculate the remaining lifetime, and store the token in Redis with an equivalent TTL. Our Spring Security filter performs an $O(1)$ check against Redis on every request; if the token is blacklisted, it is rejected with a 401. Once the token naturally expires, Redis automatically evicts it, keeping our cache memory footprint extremely lean."

**Follow-up Depth:**
- *Cross-Question:* Doesn't checking Redis on every request destroy the stateless performance benefit of JWT?
  - *Answer:* While it introduces an external network hop, checking an in-memory Redis cluster over a local bridge network takes sub-millisecond latency (typically 0.3–0.8ms) and performs a lightweight key existence check (`EXISTS`). This is vastly more scalable than querying a relational PostgreSQL database with complex table joins and transaction locks. It represents a pragmatic engineering balance between absolute statelessness and strict security compliance.

---

### Q93. What is the role of a secret key?

**Concept and Fundamentals:**
In symmetric JWT architectures (such as `HS256`), the **Secret Key** is the cryptographic anchor of trust for the entire authentication system.
Its critical roles include:
1. **Generating the Digital Signature:** During token issuance, the authorization server uses the secret key as the second input to the HMAC-SHA256 algorithm:
   $$\text{Signature} = \text{HMAC-SHA256}(\text{Header} \mathbin{\Vert} \text{"."} \mathbin{\Vert} \text{Payload}, \ K_{\text{secret}})$$
2. **Guaranteeing Authenticity & Non-Repudiation:** Because only the trusted backend server possesses the secret key, any token bearing a mathematically valid signature is proven to have been generated by that authorized server.
3. **Preventing Claim Tampering:** If a malicious party intercepts a token and alters the claims inside the payload (e.g., elevating their privileges or changing their user ID), they cannot generate the matching signature without the secret key. Any modification will cause the signature verification to fail.
4. **Cryptographic Entropy Requirements:** Under RFC 7518, an HMAC-SHA256 secret key must contain at least 256 bits (32 bytes) of cryptographic entropy to prevent brute-force dictionary attacks.

**My Project Implementation:**
In VittSaathi, the secret key is:
- Generated using a secure random generator (`SecureRandom`) to ensure maximum entropy.
- Injected at runtime via the environment variable `JWT_SECRET_KEY`.
- Strictly excluded from Git version control via `.gitignore`.
- Parsed in `JwtTokenProvider` via `Keys.hmacShaKeyFor(secret.getBytes())`.

**Why I Used It:**
The secret key protects the financial integrity of VittSaathi. It ensures that attackers cannot forge authentication tokens to gain unauthorized access to user financial portfolios.

**Alternatives and Comparison:**

| Key Paradigm | Algorithm | Key Storage Model | Use Case |
| :--- | :--- | :--- | :--- |
| **Symmetric Secret Key** | HS256 / HS512 | Same key used for both Signing and Verification | Monoliths / Tightly coupled microservices (VittSaathi) |
| **Asymmetric Key Pair** | RS256 / ES256 | Private Key signs (Auth server); Public Key verifies (API gateways)| Public OAuth2 identity providers (Auth0, Google SSO) |

**Interview-Ready Answer:**
"The secret key is the cryptographic foundation of a symmetric JWT implementation. It is used by the server to compute the HMAC-SHA256 digital signature during token issuance and to verify that signature on every incoming request. 
In VittSaathi, the secret key ensures that our tokens are tamper-proof. Because only our backend knows this secret, any attempt by an attacker to alter their user ID or role claims will invalidate the signature. We maintain this key as an externalized 256-bit environment variable, ensuring it is never hardcoded or checked into source control."

**Follow-up Depth:**
- *Cross-Question:* How long does it take an attacker to brute-force a weak 32-character secret key using modern GPU clusters?
  - *Answer:* If a developer uses a weak, dictionary-based secret like `"my-super-secret-jwt-key-12345"`, an attacker holding an intercepted token can run offline dictionary attacks using tools like Hashcat at billions of hashes per second, cracking the key in minutes. However, a cryptographically random 256-bit key has $2^{256}$ possible combinations, making brute-force attacks computationally impossible with known computing power.

---

### Q94. What happens if the secret key is compromised?

**Concept and Fundamentals:**
The compromise of a JWT secret key in a symmetric authentication system (`HS256`) represents a **Catastrophic Security Breach (Severity: CRITICAL / CVSS 10.0)**.
The immediate ramifications of a compromised secret key:
1. **Total System Impersonation:** Anyone who possesses the secret key can forge arbitrary JWT tokens. An attacker can create a token with `sub: "admin"`, set `roles: ["ROLE_ADMIN"]`, sign it with the compromised key, and gain full administrative access to all backend resources.
2. **Indiscriminate Data Access:** Attackers can generate tokens for any customer user ID, bypassing authentication to read, modify, or delete sensitive financial ledgers, bank account details, and advisory plans.
3. **Bypass of Network Defenses:** Because the forged tokens have cryptographically valid signatures, they pass through API gateways, firewalls, and security filter chains without triggering standard intrusion detection alarms.

**Emergency Incident Response Playbook:**
When a key compromise is detected or suspected:
1. **Immediate Key Invalidation (Key Revocation):** Rotate the secret key in the production environment variables immediately.
2. **Instant Invalidation of All Active Sessions:** Changing the secret key immediately causes all existing legitimate and forged tokens to fail signature verification, forcing all users across the platform to re-authenticate.
3. **Purge Caches & Blacklists:** Flush the Redis token cache and invalidate all refresh token records in PostgreSQL.
4. **Audit Log Forensics:** Inspect access logs for unusual IP addresses, token generation anomalies, and privilege escalation events during the compromise window.
5. **Root Cause Remediation:** Determine how the key leaked (e.g., committed to a public Git repository, exposed in application logs, SSRF vulnerability, or compromised server environment) and patch the vulnerability.

**My Project Implementation:**
In VittSaathi, secret key exposure is prevented through strict operational controls:
- Keys are stored in `.env` files that are strictly excluded from source control.
- In production, Docker Compose injects secrets from secure environment variables.
- We support zero-downtime key rotation through dual-key verification configurations if needed.

**Why I Used It:**
Understanding the severity of key compromise reinforces the necessity of strict secret hygiene, externalized configuration, and automated key rotation capabilities.

**Alternatives and Comparison:**

| Attack Scenario | Impact under Symmetric (HS256) | Impact under Asymmetric (RS256) |
| :--- | :--- | :--- |
| **Verification Key Leaked** | Total platform compromise (Same key signs tokens)| **Zero impact** (Public key can only verify, not forge) |
| **Signing Key Leaked** | Total platform compromise | Total platform compromise (Private key can forge) |

**Interview-Ready Answer:**
"If the secret key is compromised, the entire authentication system is broken. An attacker with the secret key can forge valid JWTs for any user in the system, escalate their privileges to administrator, and access or modify all private financial records without detection. 
If this occurs, the emergency response requires immediately rotating the secret key in our environment configuration and invalidating all refresh tokens in PostgreSQL. This instantly invalidates every active token across the platform, forcing all users to re-authenticate with their credentials. We prevent this by keeping secrets externalized in environment variables and never committing them to source code."

**Follow-up Depth:**
- *Cross-Question:* How can you design an architecture that supports seamless key rotation without logging out all legitimate active users?
  - *Answer:* You implement **Key ID (`kid`) based verification**. In the JWT header, you include a `kid` property (e.g., `{"alg": "HS256", "kid": "key-2026-v2"}`). The backend maintains a map of active keys: the current signing key (`key-v2`) and the previous key (`key-v1`). New tokens are signed with `key-v2`, but the filter validates incoming tokens against whichever key matches the token's `kid`. Once all `key-v1` tokens reach their 15-minute expiration, `key-v1` is decommissioned permanently.

---

### Q95. How do you protect JWTs against attacks?

**Concept and Fundamentals:**
Securing a JWT-based authentication system requires a comprehensive, multi-layered defense model covering transmission, storage, token structure, and server verification:

1. **Transport Layer Security (Enforce HTTPS / TLS 1.3):**
   - Mandate TLS encryption for all endpoints. This prevents network sniffing, packet inspection, and Man-in-the-Middle (MitM) token extraction.
2. **Defend Against Algorithm Downgrade & Switching Attacks:**
   - Explicitly hardcode the expected cryptographic algorithm in your backend parser (e.g., `builder.requireAlgorithm("HS256")`).
   - Explicitly reject the `"alg": "none"` header.
3. **Enforce Strong Secret Entropy:**
   - Use high-entropy keys with at least 256 bits of cryptographic randomness generated via `SecureRandom` to prevent offline dictionary cracking.
4. **Mitigate Token Theft (XSS vs. CSRF Protection):**
   - Store short-lived access tokens in **in-memory React state**, making them inaccessible to DOM-based XSS scripts.
   - Store long-lived refresh tokens in **`HttpOnly`, `Secure`, `SameSite=Strict` cookies**, preventing JavaScript access and blocking cross-origin CSRF exploits.
5. **Short Expiration Windows:**
   - Limit access token validity to **10–15 minutes**. Even if a token is stolen, the attacker's window of opportunity is extremely narrow.
6. **Implement Refresh Token Rotation (RTR):**
   - Invalidate the old refresh token every time a new one is issued. If a token reuse attempt is detected, immediately invalidate all refresh tokens in that family.
7. **Maintain a Rapid Revocation Mechanism:**
   - Implement a Redis-backed blacklist to allow instant token revocation upon user logout or suspicious security alerts.
8. **Never Store PII or Sensitive Data in Claims:**
   - Do not include passwords, account numbers, or encryption keys in the unencrypted JWT payload.

**My Project Implementation:**
In VittSaathi, all eight defensive measures are actively implemented:
- Strict CORS configuration restricts API access exclusively to our trusted frontend origin (`http://localhost:3000` in dev, production domain in prod).
- In-memory access tokens + HttpOnly refresh cookies.
- JJWT library enforces HS256 and forbids `alg: none`.
- Redis blacklist enables instant logout revocation.
- 15-minute access token lifespan.

**Why I Used It:**
Financial platforms handle sensitive wealth and investment data. Implementing defense-in-depth ensures that a failure in one layer (such as a third-party XSS script vulnerability) does not compromise the entire user authentication boundary.

**Alternatives and Comparison:**

| Attack Vector | Vulnerability Mechanism | VittSaathi Countermeasure |
| :--- | :--- | :--- |
| **XSS Token Theft** | Malicious script steals token from `localStorage` | In-memory token storage; HttpOnly cookie for refresh token |
| **CSRF Exploitation** | Browser auto-attaches cookies on malicious origin | `SameSite=Strict` cookie policy; custom header requirements |
| **Algorithm Confusion** | Attacker changes `RS256` to `HS256` or `none` | Backend enforces explicit algorithm whitelist; rejects `none` |
| **Token Replay** | Attacker replays intercepted token | Short 15-min TTL; TLS transport encryption; Redis blacklist |
| **Brute-Force Cracking**| Attacker cracks weak secret offline | 256-bit cryptographically random secret key |

**Interview-Ready Answer:**
"Protecting JWTs requires a defense-in-depth strategy across transport, storage, and validation. First, we enforce HTTPS to prevent network sniffing. Second, we protect against XSS and CSRF by keeping access tokens in React memory and storing refresh tokens in HttpOnly, Secure, SameSite=Strict cookies. 
Third, we enforce short 15-minute expirations and Refresh Token Rotation so compromised tokens have a minimal blast radius. Fourth, our Spring Boot parser strictly enforces HMAC-SHA256 and rejects the 'alg: none' exploit. Finally, we maintain a Redis-backed token blacklist for instant revocation on logout, ensuring comprehensive protection across the entire token lifecycle."

**Follow-up Depth:**
- *Cross-Question:* How do you protect against an attacker using Cross-Site Scripting (XSS) to silently make API calls using the in-memory token while the user is active?
  - *Answer:* While storing tokens in memory prevents attackers from *stealing* the token string for offline use, an active XSS exploit can still make unauthorized `fetch` calls in the user's browser context while the page is open. To prevent this root cause, you must implement a strict **Content Security Policy (CSP)** via HTTP headers (disallowing `unsafe-inline` scripts and restricting script sources), sanitize all user inputs using DOMPurify before rendering, and escape output to eliminate XSS vulnerabilities at the source.
