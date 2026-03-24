# Interview Prep: Authentication & Security

> Deep coverage of JWT, sessions, tokens, CORS, CSRF, XSS — critical for any fullstack engineer interview.

---

## 1. Authentication vs Authorization

| | Authentication (AuthN) | Authorization (AuthZ) |
|---|----------------------|---------------------|
| **Question** | "Who are you?" | "What can you do?" |
| **Example** | Login with email/password | Admin can delete, user can only read |
| **HTTP status** | 401 Unauthorized | 403 Forbidden |
| **Mechanism** | Passwords, tokens, OAuth | Roles, permissions, ACLs |

---

## 2. Session-Based Authentication

### How it works

```
1. Client sends credentials → POST /login { email, password }
2. Server validates, creates a session → stores in DB/Redis
3. Server sends back Set-Cookie: sessionid=abc123
4. Browser automatically sends cookie on every request
5. Server reads cookie → looks up session → identifies user
```

```
Client                          Server
  │                               │
  │─── POST /login ──────────────►│
  │   {email, password}           │
  │                               │── creates session in DB
  │◄── Set-Cookie: sid=abc123 ────│
  │                               │
  │─── GET /dashboard ───────────►│
  │   Cookie: sid=abc123          │── looks up session
  │◄── 200 {user data} ──────────│
```

### Pros
- **Simple:** Browser handles cookies automatically.
- **Revocation:** Delete the session from the server → user is immediately logged out.
- **No client-side storage:** Cookies are managed by the browser.

### Cons
- **Server state:** Sessions consume server memory/DB.
- **Scaling:** Must share session store across servers (Redis, sticky sessions).
- **CSRF vulnerability:** Cookies are sent automatically — attackers can forge requests.

### Django sessions
```python
# Django's default auth uses sessions
# settings.py
SESSION_ENGINE = 'django.contrib.sessions.backends.db'  # Default: database
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_COOKIE_HTTPONLY = True  # JavaScript can't read it
SESSION_COOKIE_SECURE = True   # Only sent over HTTPS
```

---

## 3. JWT (JSON Web Tokens)

### Structure
```
header.payload.signature

eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxfQ.sflKxwRJSMeKKF2QT4fwpM
```

**Header:**
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload (claims):**
```json
{
  "user_id": 1,
  "email": "user@svea.solar",
  "exp": 1700000000,         // Expiration
  "iat": 1699990000,         // Issued at
  "iss": "profitpanel-api"   // Issuer
}
```

**Signature:**
```
HMAC_SHA256(base64(header) + "." + base64(payload), secret_key)
```

### How it works

```
Client                          Server
  │                               │
  │─── POST /login ──────────────►│
  │   {email, password}           │
  │                               │── validates credentials
  │◄── { access_token, refresh }──│── creates JWT with secret key
  │                               │
  │─── GET /api/quotes ──────────►│
  │   Authorization: Bearer eyJ... │── verifies signature
  │◄── 200 {data} ────────────────│── decodes payload → user_id
```

### Pros
- **Stateless:** Server doesn't store sessions — just verifies the signature.
- **Scalable:** Any server with the secret key can verify the token.
- **Cross-domain:** Not tied to cookies — works with mobile apps, SPAs, microservices.
- **Self-contained:** Token carries user data — no DB lookup needed.

### Cons
- **No revocation:** Can't invalidate a token before expiry (need a denylist).
- **Size:** JWTs are larger than session IDs (~1KB vs ~32 bytes).
- **XSS risk:** If stored in `localStorage`, vulnerable to XSS.
- **Complexity:** Need access + refresh token flow.

### Access + Refresh Token Pattern

```
Access Token:  Short-lived (15 min)  — used for API requests
Refresh Token: Long-lived (7 days)   — used to get new access tokens

1. Login → get access + refresh tokens
2. Use access token for API requests
3. Access token expires → send refresh token to /token/refresh
4. Get new access token → continue making requests
5. Refresh token expires → user must log in again
```

**Why two tokens?**
- Short-lived access tokens limit the damage if stolen.
- Refresh tokens can be revoked (stored in DB, unlike access tokens).

### Django implementation (SimpleJWT)
```python
# pip install djangorestframework-simplejwt
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ]
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,    # New refresh token on each refresh
    'BLACKLIST_AFTER_ROTATION': True,  # Old refresh tokens are blacklisted
}

# urls.py
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
]
```

---

## 4. JWT vs Sessions — Comparison

| Feature | Sessions | JWT |
|---------|----------|-----|
| **State** | Server stores session | Stateless (token is self-contained) |
| **Storage** | Cookie (auto-sent) | localStorage, cookie, or memory |
| **Scalability** | Needs shared session store | Any server can verify |
| **Revocation** | Delete session → immediate | Need denylist or short expiry |
| **CSRF** | Vulnerable (cookies auto-sent) | Not vulnerable (token in header) |
| **XSS** | Safer (httpOnly cookie) | Risky if in localStorage |
| **Mobile** | Problematic | Works well |
| **Best for** | Server-rendered apps | SPAs, APIs, microservices |

### Interview answer
> "Sessions are simpler and provide immediate revocation, making them ideal for server-rendered apps. JWTs are stateless and scale better for SPAs and microservices. For ProfitPanel, since it's a decoupled SPA, JWT would be the natural choice — but the current version doesn't require authentication."

---

## 5. Where to Store Tokens

| Storage | XSS Safe? | CSRF Safe? | Recommendation |
|---------|-----------|-----------|----------------|
| `localStorage` | ✗ (JS can read) | ✓ (not auto-sent) | Avoid for sensitive tokens |
| `sessionStorage` | ✗ (JS can read) | ✓ (not auto-sent) | Slightly better (cleared on tab close) |
| `httpOnly cookie` | ✓ (JS can't read) | ✗ (auto-sent) | Best, but needs CSRF protection |
| In-memory variable | ✓ (not persisted) | ✓ (not auto-sent) | Best security, lost on refresh |

### Best practice
```
Access token  → in-memory (JavaScript variable)
Refresh token → httpOnly, Secure, SameSite=Strict cookie
```

---

## 6. OAuth 2.0

### What it is
A protocol for **delegated authorization** — letting a third-party app access your resources without sharing your password.

### Roles
- **Resource Owner:** The user (you)
- **Client:** The app requesting access (ProfitPanel)
- **Authorization Server:** Issues tokens (Google, GitHub)
- **Resource Server:** Holds protected resources (Google Calendar)

### Authorization Code Flow (most secure)

```
1. User clicks "Login with Google"
2. App redirects to Google's auth URL
3. User logs in and consents
4. Google redirects back with an authorization code
5. App exchanges code for tokens (server-to-server)
6. App uses access token to call Google APIs
```

```
User          App           Google
 │             │              │
 │─ click ────►│              │
 │             │─ redirect ──►│
 │             │              │── user logs in
 │◄────────────┼── code ◄────│
 │             │─ code ──────►│── server-to-server
 │             │◄── tokens ───│
 │◄── logged ──│              │
```

### Why not just send the token directly?
The authorization code is exchanged server-to-server — the token never passes through the browser, preventing interception.

---

## 7. CORS (Cross-Origin Resource Sharing)

### The problem
Browsers enforce the **Same-Origin Policy** — a page at `localhost:5173` can't make API requests to `localhost:8000` (different port = different origin).

### How CORS solves it

```
Browser (localhost:5173)          Server (localhost:8000)
  │                                  │
  │─── OPTIONS /api/quotes/ ────────►│  (Preflight)
  │   Origin: http://localhost:5173  │
  │                                  │
  │◄── 200 ─────────────────────────│
  │   Access-Control-Allow-Origin:   │
  │     http://localhost:5173        │
  │   Access-Control-Allow-Methods:  │
  │     GET, POST                    │
  │                                  │
  │─── POST /api/quotes/ ──────────►│  (Actual request)
  │◄── 201 Created ─────────────────│
```

### ProfitPanel CORS configuration
```python
# settings.py
INSTALLED_APPS = ['corsheaders', ...]
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...]  # First!

CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^http://localhost:\d+$',    # Any localhost port
    r'^http://127\.0\.0\.1:\d+$', # Any loopback port
]
```

### Why regex patterns instead of explicit origins?
- Vite may use different ports (5173, 5174, etc.).
- Regex covers all development scenarios without listing each port.

### Key headers
| Header | Purpose |
|--------|---------|
| `Access-Control-Allow-Origin` | Which origins can access the resource |
| `Access-Control-Allow-Methods` | Which HTTP methods are allowed |
| `Access-Control-Allow-Headers` | Which request headers are allowed |
| `Access-Control-Allow-Credentials` | Whether cookies/auth headers are sent |
| `Access-Control-Max-Age` | How long the browser can cache the preflight |

---

## 8. CSRF (Cross-Site Request Forgery)

### The attack
```
1. User is logged into bank.com (has session cookie)
2. User visits evil.com
3. evil.com contains: <form action="bank.com/transfer" method="POST">
4. Form auto-submits → browser sends bank.com's session cookie
5. Bank processes the transfer — user didn't intend this!
```

### Defenses

**CSRF Token (Django's default):**
```python
# Django middleware adds a token to forms
{% csrf_token %}
# Renders: <input type="hidden" name="csrfmiddlewaretoken" value="abc123">

# Server verifies the token matches — attackers can't guess it
```

**SameSite cookies:**
```
Set-Cookie: sessionid=abc123; SameSite=Strict
```
- `Strict`: Cookie only sent for same-site requests.
- `Lax`: Sent for top-level navigation (links) but not forms/XHR.
- `None`: Always sent (requires `Secure` flag).

**ProfitPanel note:** Since ProfitPanel uses a decoupled SPA without authentication, CSRF is not currently a concern. If session auth were added, Django's CSRF middleware would handle it. If JWT auth were added, CSRF is not relevant (token sent in Authorization header, not cookie).

---

## 9. XSS (Cross-Site Scripting)

### Types

| Type | How | Example |
|------|-----|---------|
| **Stored** | Script saved in DB, served to other users | Comment: `<script>steal()</script>` |
| **Reflected** | Script in URL, reflected in response | `site.com/search?q=<script>steal()</script>` |
| **DOM-based** | Script manipulates DOM directly | `document.innerHTML = userInput` |

### React's built-in protection
```tsx
// React escapes all values by default
const name = '<script>alert("xss")</script>'
<p>{name}</p>
// Renders: <p>&lt;script&gt;alert("xss")&lt;/script&gt;</p>
// The script is shown as text, not executed
```

**Except `dangerouslySetInnerHTML`:**
```tsx
// ✗ DANGEROUS — bypasses React's escaping
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// Only use with sanitized content (e.g., DOMPurify)
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

### Django's protection
```python
# Django templates auto-escape by default
{{ user_input }}  → Escaped

# Must explicitly mark as safe
{{ user_input|safe }}  → NOT escaped (dangerous)
```

### Prevention checklist
1. Never use `dangerouslySetInnerHTML` with unsanitized input.
2. Never construct HTML from user input.
3. Use Content Security Policy (CSP) headers.
4. Validate and sanitize all user input on the server.
5. Use `httpOnly` cookies (JavaScript can't access them).

---

## 10. SQL Injection

### The attack
```python
# ✗ VULNERABLE — user input directly in SQL
cursor.execute(f"SELECT * FROM users WHERE email = '{email}'")
# If email = "'; DROP TABLE users; --"
# Executes: SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
```

### Prevention
```python
# ✓ Parameterized queries
cursor.execute("SELECT * FROM users WHERE email = %s", [email])

# ✓ Django ORM (always parameterized)
User.objects.filter(email=email)  # Safe by default

# ✓ Django serializer validation
serializer.is_valid()  # Validates before any DB operation
```

**ProfitPanel is safe:** Uses Django ORM and DRF serializers — no raw SQL anywhere.

---

## 11. HTTPS and TLS

### How HTTPS works
```
1. Client sends "Hello" with supported cipher suites
2. Server sends certificate (contains public key)
3. Client verifies certificate with CA
4. Client generates session key, encrypts with server's public key
5. Both sides use session key for symmetric encryption
6. All data is encrypted from this point on
```

### Why it matters
- **Confidentiality:** Passwords, tokens, personal data encrypted in transit.
- **Integrity:** Data can't be tampered with.
- **Authentication:** Proves the server is who it claims to be.
- **Required for:** `Secure` cookies, HTTP/2, service workers, `SameSite=None`.

---

## 12. Content Security Policy (CSP)

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
```

| Directive | Controls |
|-----------|---------|
| `default-src` | Fallback for all resource types |
| `script-src` | Where scripts can load from |
| `style-src` | Where styles can load from |
| `img-src` | Where images can load from |
| `connect-src` | Where fetch/XHR can connect to |

### Interview talking point
> "CSP is a defense-in-depth measure against XSS. Even if an attacker injects a script tag, the browser won't execute it if the source isn't whitelisted."

---

## 13. Security Quick-Reference

| Threat | Attack | Defense |
|--------|--------|---------|
| **XSS** | Inject scripts via user input | React auto-escaping, CSP, input sanitization |
| **CSRF** | Forge requests using victim's cookies | CSRF tokens, SameSite cookies |
| **SQL Injection** | Inject SQL via user input | Parameterized queries, ORM |
| **Broken Auth** | Steal credentials, session hijack | HTTPS, httpOnly cookies, token rotation |
| **CORS Misconfiguration** | Allow `*` origin with credentials | Explicit origin allowlist |
| **Sensitive Data Exposure** | Tokens in URL, logs, error messages | Use headers, redact logs, generic errors |
| **SSRF** | Server makes requests to internal services | Validate URLs, allowlist, network policies |

---

## 14. Interview Questions

**Q: How would you add authentication to ProfitPanel?**
> "I'd use JWT with Django REST Framework SimpleJWT. Access tokens (15 min) stored in memory, refresh tokens (7 days) in httpOnly cookies. Protected endpoints use `IsAuthenticated` permission class. Frontend stores access token in a React Context, intercepts 401 responses to refresh automatically."

**Q: Why not use sessions for a SPA?**
> "Sessions work, but JWT is better suited for decoupled architectures. Sessions require server-side storage and don't scale as easily. JWTs are stateless — any server can verify them. They also work naturally with the Authorization header instead of relying on cookies, which avoids CSRF concerns."

**Q: How do you handle token expiry?**
> "Short-lived access tokens (15 min) limit exposure if stolen. When a request gets a 401, the frontend silently sends the refresh token to get a new access token. If the refresh token is also expired, redirect to login. Refresh token rotation (new refresh token on each refresh) limits the window for replay attacks."
