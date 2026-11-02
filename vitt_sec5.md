## Section 5: REST API Questions

### Q62. What is REST?

**Concept and Fundamentals:**
**REST (Representational State Transfer)** is an architectural style for distributed hypermedia systems, formulated by Roy Fielding in his 2000 doctoral dissertation. 
REST is not a protocol, standard, or programming language; it is a set of **architectural constraints** that, when applied to a system, yield desirable properties such as scalability, loose coupling, modifiability, visibility, portability, and reliability.
The core concept of REST centers around **Resources**:
- Any cohesive piece of information or concept that can be named (e.g., a user, a bank account, a financial ledger).
- Each resource is uniquely identified by a URI (Uniform Resource Identifier).
- Clients do not manipulate the resource directly; instead, they exchange **Representations** of the resource's current state (typically formatted as JSON, XML, or binary protocols) using standard uniform operations (HTTP methods).

**My Project Implementation:**
In VittSaathi, the core communication between the React Single Page Application (SPA) and the Spring Boot backend adheres strictly to REST principles:
- Resources are exposed via intuitive, hierarchical URIs: `/api/v1/accounts`, `/api/v1/transactions`, `/api/v1/budgets`.
- Data is exchanged exclusively in JSON representations (`Content-Type: application/json`).
- State transitions are performed through standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).

**Why I Used It:**
REST provides universal interoperability across diverse client platforms. By adhering to REST, VittSaathi decouples the frontend user experience from backend server implementations, allowing web clients, mobile apps, and internal microservices to consume identical API contracts.

**Alternatives and Comparison:**

| Architecture | Paradigm | Protocol Coupling | Overhead | Typings / Schema |
| :--- | :--- | :--- | :--- | :--- |
| **REST** | Resource-oriented | Loosely coupled to HTTP | Low (Lightweight JSON) | Implicit (OpenAPI / Swagger) |
| **GraphQL** | Graph / Query-oriented | Transport-agnostic (usually HTTP POST) | Moderate | Strict, client-defined schema |
| **gRPC** | RPC (Remote Procedure Call) | Strictly tied to HTTP/2 | Ultra-low (Protobuf binary) | Strict Protobuf contracts |
| **SOAP** | Document / RPC-oriented | Transport-agnostic | Heavy (Verbose XML envelopes) | Strict WSDL contracts |

**Interview-Ready Answer:**
"REST stands for Representational State Transfer, an architectural style formulated by Roy Fielding for building scalable, decoupled web services. In REST, everything is treated as a resource uniquely identified by a URI, and clients interact with these resources by transferring representations of their state—most commonly JSON—over standard HTTP methods. 
In VittSaathi, our Spring Boot backend exposes a RESTful API where financial entities like accounts, transactions, and advisory reports are modelled as nouns and manipulated using standard HTTP verbs, ensuring our React frontend remains completely decoupled from the backend persistence layer."

**Follow-up Depth:**
- *Cross-Question:* Is REST strictly bound to the HTTP protocol?
  - *Answer:* Theoretically, no. Fielding's dissertation defines REST as a network architecture style that can operate over any protocol providing uniform addressing and standard transfer operations. However, in practice, virtually 100% of commercial REST implementations are built over HTTP/HTTPS, relying directly on HTTP verbs, headers, and status codes.

---

### Q63. What makes an API RESTful?

**Concept and Fundamentals:**
An API is classified as genuinely **RESTful** if and only if it satisfies the **Six Guiding Architectural Constraints** defined by Roy Fielding:
1. **Client-Server Architecture:** Separation of concerns. The user interface concerns (state display, user interaction) are separated from data storage and business logic concerns, enabling independent evolution and scaling of client and server tiers.
2. **Statelessness:** Each request from client to server must contain all of the contextual information necessary to understand and complete the request. The server must not store any client session context across requests.
3. **Cacheability:** Responses must implicitly or explicitly define themselves as cacheable or non-cacheable (via HTTP headers like `Cache-Control`, `ETag`, `Expires`) to prevent clients from reusing stale financial data while eliminating redundant server processing.
4. **Uniform Interface:** The defining hallmark of REST, comprising four sub-constraints:
   - *Identification of resources:* Resources are identified in requests via URIs (`/api/v1/transactions/42`).
   - *Manipulation of resources through representations:* Clients holding a representation (JSON) have sufficient information to modify or delete the resource.
   - *Self-descriptive messages:* Each message includes enough metadata (MIME types, headers) explaining how to process it.
   - *HATEOAS (Hypermedia As The Engine Of Application State):* Clients discover available actions dynamically via embedded hypermedia links.
5. **Layered System:** The client cannot tell whether it is connected directly to the end server, or to an intermediary (reverse proxy, load balancer, API gateway, CDN).
6. **Code on Demand (Optional):** Servers can temporarily extend client functionality by transferring executable code (e.g., JavaScript applets).

The **Richardson Maturity Model** grades REST compliance across 4 levels:
- Level 0: The Swamp of POX (Single URI, single HTTP POST method, RPC-style).
- Level 1: Resources (Multiple URIs, but still single HTTP verb).
- Level 2: HTTP Verbs & Status Codes (Standard verbs and appropriate status codes).
- Level 3: Hypermedia Controls (Full HATEOAS compliance).

**My Project Implementation:**
In VittSaathi, the API operates at **Richardson Maturity Level 2** (with selective hypermedia navigation):
- Resources have unique URIs with plural nouns (`/api/v1/budgets`).
- Verbs map directly to actions (`POST` creates, `GET` reads, `DELETE` removes).
- Complete statelessness is enforced via cryptographically signed JWT tokens in the `Authorization: Bearer` header.
- Explicit `Cache-Control: no-store` headers are set on sensitive balance endpoints to prevent caching on public intermediary proxies.

**Why I Used It:**
Adhering to REST constraints provides predictable client-server interaction patterns, enables stateless horizontal scaling of backend Docker containers, and standardizes testing across all financial operations.

**Alternatives and Comparison:**

| Richardson Level | Characteristics | VittSaathi Status |
| :--- | :--- | :--- |
| **Level 0 (POX/RPC)** | Single endpoint (`/api`), POST only, action inside payload | Rejected (tight coupling, non-standard) |
| **Level 1 (Resources)** | Multiple URIs (`/accounts`, `/transactions`), single verb | Rejected (underutilizes HTTP) |
| **Level 2 (HTTP Verbs & Codes)**| Proper HTTP verbs, status codes, URIs | **Implemented across all core endpoints** |
| **Level 3 (HATEOAS)** | Hypermedia links embedded in responses (`_links`) | Evaluated; omitted for reduced payload size |

**Interview-Ready Answer:**
"An API is truly RESTful when it complies with Fielding's six core constraints: Client-Server separation, Statelessness, Cacheability, a Uniform Interface, Layered Systems, and optionally Code on Demand. In practice, this is evaluated using the Richardson Maturity Model. 
In VittSaathi, our API achieves Richardson Level 2 maturity. Every entity is exposed through noun-based resource URIs like `/api/v1/transactions`, operations map strictly to standard HTTP verbs, responses return standard status codes like 201 Created and 404 Not Found, and complete statelessness is maintained using JWTs in the Authorization header."

**Follow-up Depth:**
- *Cross-Question:* Why did you choose Level 2 over full Level 3 (HATEOAS) for VittSaathi?
  - *Answer:* While HATEOAS is architecturally pure, implementing hypermedia links (like HAL or Spring HATEOAS) in a single-page application adds serialization overhead, increases network payload size by 20–30%, and introduces complexity that modern React SPA routers (which maintain internal route declarations) rarely utilize. Level 2 provided the optimal balance of standard HTTP semantics, developer velocity, and network efficiency.

---

### Q64. Difference between REST API and SOAP?

**Concept and Fundamentals:**
REST and SOAP represent fundamentally different philosophies for system-to-system communication:
1. **Architectural Style vs. Strict Protocol:**
   - **REST** is an architectural style. It enforces high-level principles (statelessness, uniform interface) but allows flexibility in payload formats (JSON, XML, YAML) and error handling.
   - **SOAP (Simple Object Access Protocol)** is a rigid, standardized W3C messaging protocol. It mandates strict XML envelopes containing a `<SOAP-ENV:Header>` and `<SOAP-ENV:Body>`, and uses a **WSDL (Web Services Description Language)** contract for formal interface definition.
2. **Transport Layer:**
   - REST is typically implemented over HTTP/HTTPS, utilizing native verbs and status codes.
   - SOAP is transport-agnostic; it can travel over HTTP, SMTP, JMS (Java Message Service), or TCP. However, over HTTP, SOAP almost always uses `POST`, ignoring standard HTTP verbs and status codes (often returning HTTP 200 with a `<soap:Fault>` XML payload).
3. **Security Standards:**
   - REST relies on transport-level security (HTTPS/TLS) and modern token standards (OAuth2, JWT).
   - SOAP supports **WS-Security**, enabling end-to-end message-level encryption, digital signatures, and SAML token propagation across intermediate routing brokers.
4. **State and Transactions:**
   - REST is strictly stateless.
   - SOAP supports **WS-AtomicTransaction**, enabling distributed ACID 2-phase commit (2PC) transactions across heterogeneous servers.

**My Project Implementation:**
In VittSaathi, REST was chosen over SOAP. The frontend is a React application where native browser JavaScript parses JSON with zero overhead via `JSON.parse()`. Integrating SOAP would have required parsing complex XML DOM structures and managing large WSDL files in the browser.

**Why I Used It:**
Financial wealth tracking requires rapid UI responsiveness, low network bandwidth overhead on mobile connections, and clean developer workflows. JSON payloads over REST are typically 60–80% smaller than equivalent SOAP XML envelopes.

**Alternatives and Comparison:**

| Feature | REST | SOAP |
| :--- | :--- | :--- |
| **Definition** | Architectural style | Rigid W3C Protocol |
| **Payload Format** | JSON (primarily), XML, YAML, Protobuf | Strictly XML |
| **Contract** | OpenAPI / Swagger (optional) | WSDL (mandatory contract) |
| **Bandwidth & Speed** | Lightweight, high throughput | Heavy, high serialization overhead |
| **Security Mechanism** | HTTPS / TLS, JWT, OAuth2 | WS-Security, XML Encryption |
| **Browser Compatibility**| Native JSON parsing in JavaScript | Extremely difficult, requires XML parsing |

**Interview-Ready Answer:**
"The core difference is that REST is an architectural style based on lightweight resources and standard HTTP semantics, whereas SOAP is a strict, protocol-based specification that mandates XML envelopes and formal WSDL contracts. 
For VittSaathi, REST with JSON was the obvious choice over SOAP. SOAP's heavy XML packaging and high bandwidth overhead make it poorly suited for modern browser-based Single Page Applications. REST provided fast, native JSON serialization for React, lower network latency, and simple stateless authentication via JWTs."

**Follow-up Depth:**
- *Cross-Question:* When would you still choose SOAP over REST in enterprise banking?
  - *Answer:* SOAP is still required in legacy inter-bank clearing networks and payment gateways that require **WS-Security** for message-level encryption across intermediate hops (where TLS is terminated at intermediate proxies), or systems requiring **WS-AtomicTransaction** for distributed two-phase commit (2PC) transactions across heterogeneous mainframe banking cores.

---

### Q65. What are HTTP methods?

**Concept and Fundamentals:**
**HTTP Methods** (also known as HTTP Verbs) are request tokens specified in RFC 7231 and RFC 5789 that indicate the desired action to be performed on the identified resource.
The primary HTTP methods used in web systems:
1. **`GET`:** Requests a representation of the specified resource. Must be safe and idempotent. Must not alter server state.
2. **`POST`:** Submits an entity to the specified resource, causing a change in state or side effects on the server (e.g., creating a child resource, processing an order). Non-safe, non-idempotent.
3. **`PUT`:** Replaces all current representations of the target resource with the request payload. If the resource does not exist, it may create it. Idempotent.
4. **`PATCH`:** Applies partial modifications to a resource. Unlike `PUT`, it only sends the fields to be updated. Not inherently idempotent, though usually implemented idempotently.
5. **`DELETE`:** Removes all current representations of the target resource. Idempotent.
6. **`HEAD`:** Identical to `GET`, but the server must not return a message body in the response. Used to inspect response headers (`Content-Length`, `Last-Modified`) without fetching data.
7. **`OPTIONS`:** Describes the communication options for the target resource. Heavily used in CORS preflight requests (`Access-Control-Allow-Methods`).

**My Project Implementation:**
In VittSaathi, our REST APIs map directly to domain actions:
- `GET /api/v1/accounts`: Lists all accounts for authenticated user.
- `POST /api/v1/transactions`: Executes a debit/credit operation and adjusts account balances.
- `PUT /api/v1/budgets/{id}`: Overwrites budget limits for a category.
- `DELETE /api/v1/transactions/{id}`: Reverses a transaction and restores account balance.
- `OPTIONS`: Automatically handled by Spring Security for browser CORS preflight handshakes.

**Why I Used It:**
Standard HTTP methods provide a self-descriptive uniform interface. Intermediary caches, reverse proxies, and browsers understand the semantic safety and idempotency of requests automatically.

**Alternatives and Comparison:**

| Method | CRUD Mapping | Safe? | Idempotent? | Caching Allowed? |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | Read | Yes | Yes | Yes (Default) |
| **POST** | Create | No | No | Only with explicit cache headers |
| **PUT** | Replace / Update | No | Yes | No |
| **PATCH** | Partial Update | No | No (technically)| No |
| **DELETE** | Delete | No | Yes | No |
| **HEAD** | Metadata Read | Yes | Yes | Yes |

**Interview-Ready Answer:**
"HTTP methods define the action to be taken on a resource identified by a URI. The most common methods are GET for retrieving resources, POST for creating new entries or initiating operations, PUT for replacing an entire resource, PATCH for partial updates, and DELETE for removing resources. 
In VittSaathi, we adhere strictly to standard HTTP verb semantics: GET is used to retrieve account balances without side effects; POST is used for logging transactions; PUT updates monthly budget allocations; and DELETE handles transaction reversals."

**Follow-up Depth:**
- *Cross-Question:* Can a `GET` request have a request body according to the HTTP specification?
  - *Answer:* RFC 7231 specifies that a request body on a GET request has no defined semantic meaning and implementations may reject it. While HTTP/1.1 does not explicitly forbid it, many HTTP client libraries, intermediate proxies, and firewalls either strip the body or reject the request entirely. Therefore, RESTful services should never expect or require a body on GET requests.

---

### Q66. What is idempotency?

**Concept and Fundamentals:**
An HTTP method or operation is defined as **Idempotent** if the intended effect on the server of making $N$ identical requests ($N > 1$) is the exact same as making a single request ($N = 1$):
$$f(f(x)) = f(x)$$
Crucial nuances of idempotency:
1. **Server State vs. Response Payload:** Idempotency applies to the **state of the server resource**, NOT the response code or payload returned to the client.
   - Example: The first `DELETE /api/v1/transactions/42` removes the record and returns `204 No Content`. The second identical `DELETE` request finds no record and returns `404 Not Found`. Despite the differing response codes, the server state is identical in both cases (the transaction does not exist), meaning the operation is strictly idempotent.
2. **Network Resilience:** Idempotency is essential for network fault tolerance. If an HTTP connection times out or drops before receiving the server's response, the client can safely retry the request without risking duplicate state changes (e.g., charging a card twice).

**My Project Implementation:**
In VittSaathi, idempotency is strictly designed into our financial state updates:
- `PUT /api/v1/budgets/5` updating the grocery budget to `500.00` can be executed ten times, and the budget remains exactly `500.00`.
- For `POST /api/v1/transactions` (which is inherently non-idempotent), we implement **Idempotency Keys** (`X-Idempotency-Key: UUID`) stored in Redis. If a network drop causes the frontend to resend the same transaction creation request, the server detects the duplicate idempotency key in Redis and returns the cached original result without deducting the user's balance a second time.

**Why I Used It:**
In financial systems, non-idempotent retries are catastrophic—they result in double debits, duplicated payments, and broken accounting ledgers. Designing idempotent APIs and idempotency key guards guarantees ledger consistency across flaky internet connections.

**Alternatives and Comparison:**

| Operation Scenario | Idempotent Design | Non-Idempotent Hazard |
| :--- | :--- | :--- |
| **Updating Profile** | `PUT /users/me` with full payload sets exact state | `POST /users/me/append` appends duplicate data |
| **Financial Payment** | `POST /transactions` + Redis Idempotency Key | Raw `POST /transactions` charges customer multiple times on network retry |
| **Deleting Account** | `DELETE /accounts/10` leaves account deleted | Custom RPC `POST /accounts/delete` may trigger invalid state transitions |

**Interview-Ready Answer:**
"Idempotency means that executing the same operation multiple times produces the exact same side effects on the server as executing it once. In HTTP terms, GET, PUT, and DELETE are idempotent, whereas POST is not. 
In VittSaathi, idempotency is critical to financial integrity. While PUT and DELETE endpoints are inherently idempotent, our POST transaction creation endpoint guards against duplicate network retries by requiring an `X-Idempotency-Key` header. When a client submits a transaction, we record the key in Redis; if a retry occurs within a 5-minute window, we return the cached response rather than creating a duplicate financial debit."

**Follow-up Depth:**
- *Cross-Question:* How do you implement an idempotency key filter in Spring Boot?
  - *Answer:* We implement a custom `OncePerRequestFilter` or Spring MVC `HandlerInterceptor`. When a request arrives, the filter extracts the `X-Idempotency-Key` header and attempts an atomic Redis `SET key value NX EX 300` (set if not exists with a 5-minute TTL). If the key already exists, the filter halts request processing, fetches the previously stored response from Redis, and returns it immediately with an `X-Cache: IDEMPOTENT-HIT` header.

---

### Q67. Which HTTP methods are idempotent?

**Concept and Fundamentals:**
According to RFC 7231 (Section 4.2.2), HTTP methods are formally categorized based on their safety and idempotency guarantees:

1. **Idempotent Methods:**
   - **`GET`:** Safe and idempotent. Fetching account balance 100 times does not alter the balance.
   - **`HEAD`:** Safe and idempotent. Fetches response headers without response body.
   - **`PUT`:** Idempotent, but NOT safe. Replacing a user's address with `{"city": "Mumbai"}` 5 times leaves the city as Mumbai.
   - **`DELETE`:** Idempotent, but NOT safe. Removing transaction #100 leaves the record deleted regardless of retry count.
   - **`OPTIONS`:** Safe and idempotent. Inquires about supported communication options.
   - **`TRACE`:** Safe and idempotent. Echoes back the received request for debugging.

2. **Non-Idempotent Methods:**
   - **`POST`:** Non-idempotent and non-safe. Submitting `POST /api/v1/transactions` with `{"amount": 100}` three times creates three distinct transactions, debiting 300.
   - **`PATCH`:** Non-idempotent by specification (RFC 5789). While updating a single field can be implemented idempotently, JSON Patch operations like `{"op": "add", "path": "/items", "value": "book"}` append items to a list, altering state on each execution.

**My Project Implementation:**
In VittSaathi, we respect HTTP idempotency classifications:
- All data retrieval endpoints (`GET /api/v1/budgets`, `GET /api/v1/analytics`) are guaranteed safe and idempotent.
- Entity updates (`PUT /api/v1/budgets/{id}`) replace the entire budget configuration idempotently.
- Entity removals (`DELETE /api/v1/budgets/{id}`) cleanly delete the target resource.
- Creation operations (`POST /api/v1/transactions`) are non-idempotent, guarded by transaction locks and idempotency tokens.

**Why I Used It:**
Adhering to standard idempotency classifications allows reverse proxies, browser caches, and HTTP clients to safely auto-retry dropped requests on GET, PUT, and DELETE, while never auto-retrying POST requests.

**Alternatives and Comparison:**

| HTTP Method | Is Safe? (No State Change) | Is Idempotent? ($f(f(x)) = f(x)$) | Safe for Client Auto-Retry? |
| :--- | :--- | :--- | :--- |
| **GET** | **Yes** | **Yes** | **Yes** |
| **HEAD** | **Yes** | **Yes** | **Yes** |
| **PUT** | No | **Yes** | **Yes** |
| **DELETE** | No | **Yes** | **Yes** |
| **POST** | No | No | No (Requires application-level deduplication) |
| **PATCH** | No | No (by RFC specification) | No |

**Interview-Ready Answer:**
"According to RFC 7231, the standard idempotent HTTP methods are GET, HEAD, PUT, DELETE, OPTIONS, and TRACE. In contrast, POST and PATCH are classified as non-idempotent. 
In VittSaathi, we design our APIs around these contracts: GET reads data without side effects; PUT completely replaces budget configurations; and DELETE removes records idempotently. For non-idempotent POST operations like creating financial transactions, we implement idempotency keys in Redis to safely handle client network retries."

**Follow-up Depth:**
- *Cross-Question:* Can a method be Safe without being Idempotent?
  - *Answer:* No. By mathematical definition, any operation that is **Safe** does not alter server state at all. If an operation causes zero state changes ($f(x) = x$), executing it multiple times will still cause zero state changes ($f(f(x)) = x$). Therefore, all safe methods are automatically idempotent.

---

### Q68. What are HTTP status codes?

**Concept and Fundamentals:**
**HTTP Status Codes** are standardized 3-digit integer responses issued by a server to communicate the outcome of a client's HTTP request (specified in RFC 7231).
The status codes are divided into five distinct numerical classes based on the first digit:

1. **`1xx` Informational:** Request received, continuing process (e.g., `101 Switching Protocols` during WebSocket handshakes).
2. **`2xx` Success:** The action was successfully received, understood, and accepted:
   - `200 OK`: Standard success for GET, PUT, PATCH.
   - `201 Created`: Resource successfully created (used in POST).
   - `202 Accepted`: Request accepted for asynchronous processing (e.g., background batch report generation).
   - `204 No Content`: Request succeeded, but response body is intentionally empty (common for DELETE).
3. **`3xx` Redirection:** Further action must be taken by the client to fulfill the request (e.g., `301 Moved Permanently`, `304 Not Modified` for caching).
4. **`4xx` Client Error:** The request contains bad syntax or cannot be fulfilled:
   - `400 Bad Request`: Malformed syntax, invalid JSON, or bean validation failure.
   - `401 Unauthorized`: Client lacks valid authentication credentials.
   - `403 Forbidden`: Authenticated, but client lacks necessary authorization/permissions.
   - `404 Not Found`: Target resource does not exist.
   - `409 Conflict`: Request conflicts with current server state (e.g., duplicate unique email).
   - `422 Unprocessable Entity`: Syntactically correct JSON, but contains semantic business violations.
5. **`5xx` Server Error:** The server failed to fulfill an apparently valid request:
   - `500 Internal Server Error`: Unhandled server exception.
   - `502 Bad Gateway`: Downstream microservice error.
   - `503 Service Unavailable`: Server overloaded or undergoing maintenance.
   - `504 Gateway Timeout`: Upstream service timed out.

**My Project Implementation:**
In VittSaathi, controllers never return raw Java objects directly; they return a `ResponseEntity<T>` encapsulating an explicit HTTP status code:
```java
// Creation returns 201 Created with Location header
return ResponseEntity.created(URI.create("/api/v1/transactions/" + tx.getId())).body(txDTO);

// Deletion returns 204 No Content
return ResponseEntity.noContent().build();
```

**Why I Used It:**
HTTP status codes provide standardized, language-agnostic machine readability. The React frontend's Axios interceptors use these status codes to trigger automated workflows (e.g., redirecting to login on 401, displaying field validation errors on 400).

**Alternatives and Comparison:**

| Approach | REST Compliance | Client Developer Experience | Machine Readability |
| :--- | :--- | :--- | :--- |
| **Standard HTTP Status Codes (`201`, `400`, `404`)** | Fully RESTful | Excellent (Standardized across ecosystem) | High (Native Axios / fetch handling) |
| **Always Return `200 OK` with `{code: 404, msg: "err"}`**| Anti-pattern (POX/RPC) | Poor (Requires manual inspection of body) | Low (Breaks HTTP proxies and caches) |

**Interview-Ready Answer:**
"HTTP status codes are standardized 3-digit codes divided into five classes: 1xx for informational messages, 2xx for successful operations, 3xx for redirections, 4xx for client-side errors, and 5xx for server-side errors. 
In VittSaathi, we avoid the anti-pattern of returning HTTP 200 for errors. Instead, we use semantic status codes: 201 Created for new transactions, 204 No Content for deletions, 400 Bad Request for bean validation failures, 401 for expired JWTs, 403 for unauthorized resource access, and 500 for unhandled infrastructure faults."

**Follow-up Depth:**
- *Cross-Question:* Why is returning `200 OK` with an error message in the JSON body considered an anti-pattern?
  - *Answer:* It violates HTTP semantics and breaks infrastructure tooling. Reverse proxies, API gateways, and load balancers rely on 5xx codes to trigger circuit breakers, health checks, and automatic retries. Furthermore, HTTP caches treat 200 responses as cacheable, potentially serving an error message to other users.

---

### Q69. Difference between 200, 201, 400, 401, 403, 404 and 500?

**Concept and Fundamentals:**
These seven status codes represent the core operational vocabulary of enterprise RESTful APIs:

1. **`200 OK` vs. `201 Created`:**
   - `200 OK`: General success code for requests that completed successfully and returned data (`GET`, `PUT`, `PATCH`).
   - `201 Created`: Specific success code indicating that a new resource was successfully created on the server (used in `POST`). Should include a `Location` header pointing to the URI of the newly created resource.

2. **`400 Bad Request`:**
   - The server cannot process the request due to a client error: malformed JSON syntax, invalid query parameters, or Jakarta Bean Validation failures (`@NotNull`, `@Positive`).

3. **`401 Unauthorized` vs. `403 Forbidden` (Crucial Interview Distinction):**
   - **`401 Unauthorized` (Authentication Failure):** *"Who are you?"* The client has not provided valid credentials, the JWT token is missing, expired, or cryptographically invalid. The client can fix this by authenticating.
   - **`403 Forbidden` (Authorization Failure):** *"I know who you are, but you cannot access this."* The client is authenticated, but their assigned roles/permissions do not grant access to the requested resource. For example, a regular user attempting to access an Admin report, or User A attempting to view User B's private account ledger. Re-authenticating with the same credentials will not change the outcome.

4. **`404 Not Found`:**
   - The server cannot find the requested resource. Either the URI endpoint does not exist, or the specific resource identifier (e.g., `/accounts/999`) does not exist in the database.

5. **`500 Internal Server Error`:**
   - A generic server-side failure where the application encountered an unexpected runtime exception (e.g., `NullPointerException`, database connection pool exhaustion). Indicates a bug or infrastructure outage that the client could not have anticipated.

**My Project Implementation:**
In VittSaathi, these codes are mapped explicitly in `GlobalExceptionHandler` and controllers:
- `201 Created`: Returned when creating an account or transaction.
- `400 Bad Request`: Returned when a transaction has a negative amount.
- `401 Unauthorized`: Returned by `JwtAuthenticationEntryPoint` when an expired token is supplied.
- `403 Forbidden`: Returned when User A attempts to view `/api/v1/accounts/12` which belongs to User B.
- `404 Not Found`: Returned when an account ID does not exist in PostgreSQL.
- `500 Internal Server Error`: Returned when an unexpected system error occurs, logged with a correlation trace ID.

**Why I Used It:**
Accurate status codes allow the React frontend to react programmatically: 401 triggers an automated token refresh or logout redirect; 403 displays an 'Access Denied' banner; 400 displays inline form error highlights.

**Alternatives and Comparison:**

| Status Code | Name | Primary Cause | Who is at Fault? | Client Action |
| :--- | :--- | :--- | :--- | :--- |
| **200** | OK | Successful operation | Nobody | Render data |
| **201** | Created | Resource created | Nobody | Redirect / update UI list |
| **400** | Bad Request | Validation / syntax error | Client | Fix input data |
| **401** | Unauthorized | Missing / invalid token | Client | Authenticate / refresh token |
| **403** | Forbidden | Insufficient permissions | Client | Request elevated access |
| **404** | Not Found | Resource does not exist | Client | Verify identifier |
| **500** | Internal Error | Uncaught server exception | Server | Contact support / retry later |

**Interview-Ready Answer:**
"These status codes define distinct outcomes: 200 signals general success, while 201 indicates a new resource was created. 400 indicates client validation failures. The key distinction between 401 and 403 is authentication versus authorization: 401 Unauthorized means the user is unauthenticated or their token has expired, whereas 403 Forbidden means the user is authenticated but lacks permission to access that specific resource. 404 indicates the resource doesn't exist, and 500 represents an unhandled server-side fault. 
In VittSaathi, our global exception handler maps domain exceptions directly to these codes, allowing our React frontend to take immediate automated actions like redirecting on 401 or highlighting invalid form fields on 400."

**Follow-up Depth:**
- *Cross-Question:* When would you return a `404 Not Found` instead of a `403 Forbidden` for unauthorized resource access?
  - *Answer:* In high-security systems like financial platforms, returning `403 Forbidden` when User A attempts to access `/api/v1/accounts/42` reveals that account #42 actually exists in the system (resource enumeration vulnerability). To prevent attackers from discovering valid account IDs, the server can intentionally return `404 Not Found`, concealing the resource's existence.

---

### Q70. What is statelessness in REST?

**Concept and Fundamentals:**
**Statelessness** is Constraint #2 of Fielding's REST architectural style. It mandates that:
*"Each request from client to server must contain all of the information necessary to understand and complete the request, and cannot take advantage of any stored context on the server. Session state is therefore kept entirely on the client."*

Key architectural implications of statelessness:
1. **No Server-Side Sessions:** The server does not maintain stateful HTTP sessions (like `HttpSession` or in-memory session tables) holding user identity between requests.
2. **Every Request is Independent:** The server treats every incoming HTTP request as completely autonomous. If request #2 immediately follows request #1 from the same client, the server processes request #2 without relying on data retained from request #1.
3. **Horizontal Scalability:** Because no server holds local session affinity, incoming requests can be routed to any server instance in a cluster via round-robin load balancing without requiring "sticky sessions". If server node A crashes, server node B can immediately process the very next request from that client without interruption.
4. **Reliability and Simplicity:** Eliminates the complexity of distributed session clustering, session replication across networks, and session state serialization bugs.

**My Project Implementation:**
In VittSaathi, statelessness is strictly enforced in Spring Security:
```java
http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
```
Spring Boot is explicitly instructed never to create or use an `HttpSession`. Every single incoming request from the React frontend contains an `Authorization: Bearer <jwt_token>` header. Our `JwtAuthenticationFilter` validates the signature, extracts the user ID, and populates the thread-local `SecurityContextHolder` solely for the duration of that individual request thread.

**Why I Used It:**
Statelessness enables VittSaathi's backend containers to be horizontally replicated behind an Nginx or AWS Application Load Balancer without complex distributed session replication mechanisms.

**Alternatives and Comparison:**

| Dimension | Stateful Architecture (HTTP Sessions) | Stateless Architecture (REST + JWT) |
| :--- | :--- | :--- |
| **Server Memory Usage** | Scales linearly with active users ($O(N)$ memory) | Constant ($O(1)$ memory); zero session storage |
| **Load Balancing** | Requires Sticky Sessions (IP hash / session cookie) | Pure Round-Robin / Least Connections |
| **Failover Resilience** | Node crash drops all active user sessions | Seamless; any node handles subsequent requests |
| **Horizontal Scaling** | High complexity (Session clustering via Redis/hazelcast) | Trivially simple; spin up new Docker containers |

**Interview-Ready Answer:**
"Statelessness in REST means that the server retains no client session context between requests. Every incoming request must carry all the data and credentials required to understand and authorize it. 
In VittSaathi, we enforce statelessness by configuring Spring Security's `SessionCreationPolicy.STATELESS`. The server never allocates `HttpSession` memory. Instead, the React client attaches a signed JWT in the Authorization header of every request. This architecture allows us to horizontally scale our backend Docker containers behind a round-robin load balancer without sticky sessions or session replication."

**Follow-up Depth:**
- *Cross-Question:* If REST is stateless, how do you handle features like 'Shopping Carts' or multi-step financial planning wizards?
  - *Answer:* In a stateless REST architecture, transient workflow state is stored either on the client side (in React component state, Redux, or localStorage) and submitted in full with each step, or stored explicitly as a persistent database entity (e.g., a `DraftAdvisoryPlan` record with a unique ID in PostgreSQL). The server remains stateless with respect to the user's connection.

---

### Q71. How did you structure your API endpoints?

**Concept and Fundamentals:**
Enterprise RESTful API endpoint design follows established naming conventions and structural principles:
1. **Use Plural Nouns for Resources:** URIs identify resources (nouns), not actions (verbs). Avoid `/getTransactions` or `/createAccount`; use `/transactions` and `/accounts`.
2. **Represent Relationships via Hierarchical Paths:** Sub-resources that exist within the context of a parent resource are nested: `/accounts/{accountId}/transactions`.
3. **Use HTTP Verbs for Actions:** CRUD operations map to standard verbs (`GET`, `POST`, `PUT`, `DELETE`).
4. **Consistent URI Versioning:** Prefix endpoints with API version identifiers (`/api/v1`) to allow backwards-compatible evolution.
5. **Kebab-Case for URIs:** Standard practice uses lowercase alphanumeric characters separated by hyphens (e.g., `/api/v1/advisory-plans`).
6. **Query Parameters for Filtering and Sorting:** Keep base URIs clean; apply filters and modifiers via query strings: `/api/v1/transactions?category=INVESTMENT&sortBy=date`.

**My Project Implementation:**
In VittSaathi, the API is structured into four primary domain namespaces:
```
/api/v1/auth
  ├── POST   /register             -> User onboarding
  ├── POST   /login                -> Credential verification, returns JWT
  └── POST   /logout               -> Invalidation / token revocation

/api/v1/accounts
  ├── GET    /                     -> List all user accounts
  ├── POST   /                     -> Create a new bank/investment account
  ├── GET    /{id}                 -> Retrieve account metadata & balance
  └── GET    /{id}/transactions    -> Nested transactions for specific account

/api/v1/transactions
  ├── GET    /                     -> Paginated/filtered transaction history
  ├── POST   /                     -> Log a new transaction (debit/credit)
  └── DELETE /{id}                 -> Reverse transaction record

/api/v1/budgets
  ├── GET    /summary              -> 50/30/20 budget breakdown vs reality
  ├── POST   /                     -> Set monthly budget allocations
  └── PUT    /{id}                 -> Update category limits

/api/v1/ai-advisor
  ├── POST   /chat                 -> Multi-agent financial planning session
  └── GET    /plans/latest         -> Fetch latest generated advisory roadmap
```

**Why I Used It:**
A consistent, hierarchical API structure makes the API self-documenting, reduces frontend integration errors, and adheres to standard REST architectural patterns.

**Alternatives and Comparison:**

| Endpoint Design Pattern | Example URI | Evaluation |
| :--- | :--- | :--- |
| **RESTful Hierarchical Nouns** | `POST /api/v1/transactions` | **Standard, clean, self-descriptive** |
| **RPC / Action-Oriented URIs** | `POST /api/v1/createTransaction` | Violates REST; mixes verbs into URIs |
| **Flat Non-Hierarchical URIs** | `GET /api/v1/getAccountTransactionsById` | Difficult to browse, lacks resource context |

**Interview-Ready Answer:**
"In VittSaathi, I structured the API endpoints around plural nouns, hierarchical resource relationships, and standard HTTP verbs, prefixed by `/api/v1` for versioning. 
For example, authentication endpoints are grouped under `/api/v1/auth`, account management under `/api/v1/accounts`, and transactional ledgers under `/api/v1/transactions`. To represent nested relationships, we use paths like `/api/v1/accounts/{id}/transactions`. We use query parameters for pagination and filtering rather than polluting the URI path, ensuring our endpoints are intuitive and adhere to industry standards."

**Follow-up Depth:**
- *Cross-Question:* How do you represent non-CRUD business actions in a RESTful API (e.g., locking an account or running an AI financial plan)?
  - *Answer:* For non-CRUD operations, REST allows modeling the action as a sub-resource or state transition. For example, instead of `POST /lockAccount`, we use `PUT /api/v1/accounts/{id}/status` with a body `{"status": "LOCKED"}`, or treat the execution as creating an instance of a process resource: `POST /api/v1/ai-advisor/consultations`.

---

### Q72. How did you handle authentication in REST APIs?

**Concept and Fundamentals:**
Authentication in REST APIs must respect the **statelessness** constraint. Traditional stateful authentication (storing an `HttpSession` in server RAM and returning a `JSESSIONID` cookie) is avoided in modern distributed microservices.
The standard pattern for stateless REST API authentication is **Token-Based Authentication using JSON Web Tokens (JWT)**:
1. **Credential Exchange:** The client sends an initial `POST /api/v1/auth/login` request over HTTPS containing user credentials (email and password).
2. **Verification & Issuance:** The server verifies the credentials against hashed records (bcrypt), generates a cryptographically signed JWT containing claims (user ID, roles, expiration timestamp), and returns it in the response body.
3. **Subsequent Authorized Requests:** The client stores the token and includes it in the `Authorization` HTTP header of all subsequent requests:
   `Authorization: Bearer <token_string>`
4. **Stateless Verification:** When a request arrives, a security interceptor filter extracts the token from the header, verifies the cryptographic signature using a secret key, checks the expiration claim, and injects the user's identity into the application context. No database query is required to verify the user's active session.

**My Project Implementation:**
In VittSaathi, authentication is managed by **Spring Security 6** via a custom `JwtAuthenticationFilter`:
- The filter extends `OncePerRequestFilter`.
- It intercepts every incoming HTTP request, parses the `Authorization` header, and strips the `"Bearer "` prefix.
- `JwtTokenProvider` validates the token's HMAC-SHA256 signature and expiration timestamp.
- If valid, it extracts the username and roles, instantiates a `UsernamePasswordAuthenticationToken`, and loads it into `SecurityContextHolder.getContext().setAuthentication(auth)`.
- If invalid or expired, the request is rejected immediately at the filter chain level by `JwtAuthenticationEntryPoint` with an HTTP 401 Unauthorized response.

**Why I Used It:**
JWT authentication enables zero-database session lookups on every request, supports stateless microservice scalability, and eliminates CSRF vulnerabilities when tokens are stored in memory.

**Alternatives and Comparison:**

| Mechanism | Session Storage | DB Lookup per Request? | CSRF Vulnerability | Scalability |
| :--- | :--- | :--- | :--- | :--- |
| **Stateless JWT (`Bearer`)** | Client (Memory / Secure Storage) | **No** (Cryptographic validation) | **Immune** (No auto-sent cookies)| High |
| **HTTP Basic Auth** | Client sends user/pass on every call | Yes (Repeated DB password checks)| Immune | Low (Exposes credentials) |
| **Server-Side Session Cookies**| Server RAM / Redis session store | Yes (Session table lookup) | High (Requires CSRF tokens) | Moderate (Requires sticky sessions) |
| **OAuth2 / OIDC** | Delegated Authorization Server | Token introspection or JWT | Immune | Very High (Enterprise SSO) |

**Interview-Ready Answer:**
"In VittSaathi, I implemented stateless token-based authentication using JSON Web Tokens and Spring Security 6. When a user logs in, the backend verifies their hashed password with BCrypt and issues a signed JWT containing their user ID and roles. 
On subsequent requests, the React frontend attaches this token as a Bearer token in the HTTP Authorization header. Our custom `JwtAuthenticationFilter` intercepts the request, cryptographically validates the token signature using HMAC-SHA256, verifies its expiration, and establishes the user's authentication context in memory without querying the PostgreSQL database on every request."

**Follow-up Depth:**
- *Cross-Question:* How do you prevent replay attacks if a JWT token is intercepted over the network?
  - *Answer:* First, the entire API is strictly served over **HTTPS/TLS**, which encrypts the Authorization header in transit, preventing network sniffing. Second, we configure short token lifetimes (15 minutes for access tokens) combined with refresh token rotation. Third, we can bind tokens to client fingerprint hashes (e.g., user-agent or IP subnet) to reject tokens replayed from foreign environments.

---

### Q73. How did you prevent unauthorized access?

**Concept and Fundamentals:**
Preventing unauthorized access requires a defense-in-depth model encompassing both **Authentication** (*identifying the user*) and **Authorization** (*enforcing access control rules*).
Unauthorized access vulnerabilities typically manifest in two forms:
1. **Vertical Privilege Escalation:** A regular user accesses administrative endpoints (e.g., `/api/v1/admin/users`).
2. **Horizontal Privilege Escalation (BOLA / IDOR - Broken Object Level Authorization):** User A modifies the URI path variable to access User B's private resources (e.g., User A accessing `/api/v1/accounts/102` which belongs to User B). BOLA is ranked as the **#1 vulnerability in the OWASP API Security Top 10**.

Preventing unauthorized access involves:
- **Role-Based Access Control (RBAC):** Restricting endpoints based on user roles (`ROLE_USER`, `ROLE_ADMIN`) using Spring Security method security (`@PreAuthorize("hasRole('ADMIN')")`).
- **Object-Level Tenant Isolation:** Validating that the resource being accessed belongs to the authenticated user making the request.

**My Project Implementation:**
In VittSaathi, unauthorized access is prevented through multi-tiered controls:
1. **URL-Level Security:** In `SecurityFilterChain`, public endpoints (`/api/v1/auth/**`, Swagger UI) are configured as `permitAll()`, while all other endpoints require explicit authentication (`authenticated()`).
2. **Defense against IDOR / BOLA:** In service classes, database queries never fetch resources purely by entity ID. They always enforce composite ownership filtering:
```java
// Vulnerable to BOLA:
// accountRepository.findById(accountId);

// Secure VittSaathi implementation:
accountRepository.findByIdAndUserEmail(accountId, authenticatedUserEmail)
    .orElseThrow(() -> new ResourceNotFoundException("Account not found for this user"));
```
If User A tries to view User B's account ID, the query returns empty, triggering a 404/403 and preventing data exposure.

**Why I Used It:**
In financial platforms, protecting user balances, transaction ledgers, and net worth data from unauthorized access is non-negotiable. Object-level checks guarantee absolute tenant isolation.

**Alternatives and Comparison:**

| Defense Layer | Prevents What? | Implementation Mechanism |
| :--- | :--- | :--- |
| **Transport Layer (TLS 1.3)** | Eavesdropping, Man-in-the-Middle | HTTPS encryption |
| **Authentication Filter** | Unauthenticated public access | `JwtAuthenticationFilter` (401 Unauthorized) |
| **Role-Based Access (RBAC)**| Vertical Privilege Escalation | `@PreAuthorize("hasRole('ADMIN')")` (403 Forbidden) |
| **Tenant Ownership Scoping** | Horizontal Escalation (BOLA / IDOR) | `WHERE account.id = :id AND user.email = :email` |

**Interview-Ready Answer:**
"In VittSaathi, we prevent unauthorized access using a defense-in-depth approach covering both vertical and horizontal privilege escalation. At the URL level, Spring Security enforces that all API endpoints require a valid JWT, rejecting unauthenticated traffic with HTTP 401. 
To prevent horizontal privilege escalation—or Broken Object Level Authorization (BOLA), the #1 OWASP API vulnerability—we ensure our service layer never queries records by resource ID alone. Every database query explicitly binds the authenticated user's ID extracted from the verified JWT: for example, querying `findByIdAndUserEmail(id, userEmail)`. If User A attempts to guess or substitute User B's account ID in the URL, the query returns empty, preventing any unauthorized data access."

**Follow-up Depth:**
- *Cross-Question:* Can an attacker bypass authorization checks by tampering with the user ID claim inside the JWT payload?
  - *Answer:* No. The JWT payload is cryptographically protected by the digital signature created using our backend secret key (HMAC-SHA256). If an attacker alters even a single character in the base64-encoded payload (e.g., changing `userId: 10` to `userId: 1`), the calculated cryptographic hash will no longer match the token's signature, and the server will reject the token immediately.

---

### Q74. How did you validate request payloads?

**Concept and Fundamentals:**
Request payload validation is the process of ensuring that data submitted by external clients adheres strictly to expected formats, structural types, size constraints, and business domain boundaries before it is processed by business logic.
Validation follows a **layered validation model**:
1. **Syntactic & Structural Validation:** Enforcing JSON syntax, correct data types, and non-null constraints at the API gateway or controller boundary.
2. **Semantic & Business Rule Validation:** Enforcing business-specific constraints in the domain service layer (e.g., checking if an account has sufficient balance prior to debiting).
3. **Database Constraint Validation:** Final safety net enforced by table schema constraints (e.g., `CHECK (amount > 0)`, `UNIQUE (email)`).

At the controller boundary, Spring Boot integrates the **Jakarta Bean Validation 3.0** standard:
- Developers apply validation annotations directly onto DTO fields.
- The `@Valid` annotation is attached to the `@RequestBody` parameter.
- Spring MVC executes validation automatically after JSON deserialization.
- Failures populate a `BindingResult` or trigger `MethodArgumentNotValidException`.

**My Project Implementation:**
In VittSaathi, payload validation is enforced using annotated DTOs:
- `TransactionRequestDTO`:
  - `@NotNull(message = "Account ID cannot be null")`
  - `@Positive(message = "Transaction amount must be strictly greater than zero")`
  - `@Digits(integer = 10, fraction = 2, message = "Amount cannot exceed 2 decimal places")`
  - `@Size(max = 100, message = "Merchant name cannot exceed 100 characters")`
- `RegisterRequestDTO`:
  - `@Email(message = "Invalid email format")`
  - `@Size(min = 8, max = 64, message = "Password must be between 8 and 64 characters")`
  - `@Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$", message = "Password must contain uppercase, lowercase, digit, and special character")`

Our `GlobalExceptionHandler` intercepts `MethodArgumentNotValidException` and extracts all field validation errors into a clean, structured JSON response.

**Why I Used It:**
Financial backends must never process negative money transfers, malformed currency units, or SQL injection payloads. Validating payloads at the controller boundary prevents invalid data from entering service workflows or hitting the database.

**Alternatives and Comparison:**

| Validation Level | Technique | Pro | Con |
| :--- | :--- | :--- | :--- |
| **DTO Bean Validation (`@Valid`)** | Jakarta Annotations | Declarative, automatic, fail-fast at API edge | Cannot easily perform database-dependent checks |
| **Service Layer Validation** | Imperative Java code | Can query database for contextual business rules | Repetitive boilerplate code |
| **Database Schema Constraints** | SQL `CHECK`, `NOT NULL` | Uncompromising data integrity | Late failure; expensive database round-trip |

**Interview-Ready Answer:**
"In VittSaathi, we validate incoming request payloads at the controller boundary using Jakarta Bean Validation annotations applied to our DTOs. For instance, on transaction requests, we annotate monetary amounts with `@Positive` and `@Digits(integer=10, fraction=2)` to strictly prevent negative values or fractional cents, and enforce strong password regex patterns on registration. 
By placing `@Valid` on the controller's `@RequestBody`, Spring automatically runs these checks before our service code executes. If any field fails, our `GlobalExceptionHandler` intercepts the resulting `MethodArgumentNotValidException` and returns an HTTP 400 response with a clear map of field-specific error messages."

**Follow-up Depth:**
- *Cross-Question:* How would you validate a complex cross-field constraint—for example, ensuring that if transaction type is 'TRANSFER', a 'destinationAccountId' field must not be null?
  - *Answer:* For cross-field validation, single-field annotations are insufficient. You can create a **Custom Class-Level Constraint Annotation** (e.g., `@ValidTransfer`) backed by a custom `ConstraintValidator<ValidTransfer, TransactionRequestDTO>`. The validator inspects both the `type` and `destinationAccountId` fields simultaneously on the DTO instance and returns false if the conditional requirement is violated.
