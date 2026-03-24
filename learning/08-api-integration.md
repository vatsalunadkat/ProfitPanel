# Lesson 8: Frontend-Backend API Integration

> Learn how ProfitPanel's React frontend communicates with Django.

---

## 8.1 The Big Picture

```
┌─────────────────────────────┐         ┌─────────────────────────────┐
│      React Frontend         │  HTTP   │      Django Backend          │
│      (localhost:5173)       │ ◄─────► │      (localhost:8000)        │
│                             │  JSON   │                              │
│  api/config.ts (base URL)   │         │  /api/quotes/ (endpoint)     │
│  api/quotes.ts (functions)  │         │  views.py (handlers)         │
│  components (use the data)  │         │  serializers.py (validation) │
└─────────────────────────────┘         └─────────────────────────────┘
```

The frontend and backend are **completely separate applications** that communicate via JSON over HTTP.

---

## 8.2 API Configuration

**From `frontend/src/api/config.ts`:**

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
```

**Why a separate config file?**
- **Single source of truth** for the API URL.
- **Environment flexibility**: Development uses localhost, production can point elsewhere.
- **The `??` operator**: If `VITE_API_BASE_URL` isn't set, fall back to localhost.

---

## 8.3 The `fetch` API — Making HTTP Requests

JavaScript's native `fetch` is used for all API calls. Let's study both functions:

### GET — Fetching Data

```typescript
// From api/quotes.ts
export async function fetchQuotes(): Promise<QuoteResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/quotes/`)
  if (!response.ok) throw new Error('Failed to fetch quotes')
  return response.json()
}
```

**Line-by-line:**

| Line | What it does |
|------|-------------|
| `async function` | Marks the function as asynchronous (can use `await`) |
| `fetch(\`...\`)` | Sends an HTTP GET request (GET is the default method) |
| `await` | Pauses execution until the request completes |
| `response.ok` | `true` for status codes 200-299 |
| `response.json()` | Parses the JSON body into a JavaScript object |
| `: Promise<QuoteResponse[]>` | TypeScript return type — a promise resolving to an array |

### POST — Sending Data

```typescript
export async function submitQuote(data: QuoteSubmission): Promise<QuoteResponse> {
  const response = await fetch(`${API_BASE_URL}/api/quotes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    let apiError: ApiError
    try {
      apiError = await response.json()
    } catch {
      apiError = {
        error_code: 'NETWORK_ERROR',
        message: 'Unable to reach the server.',
      }
    }
    throw new QuoteApiError(apiError)
  }
  return response.json()
}
```

**Key details:**

| Concept | Code | Explanation |
|---------|------|-------------|
| Method | `method: 'POST'` | Tell the server we're creating data |
| Content-Type | `headers: { 'Content-Type': 'application/json' }` | Tell the server we're sending JSON |
| Body | `body: JSON.stringify(data)` | Convert the JS object to a JSON string |
| Error handling | `try { apiError = await response.json() }` | Try to parse the error response |
| Fallback | `catch { apiError = { ... } }` | If parsing fails (server down, not JSON), use a generic error |

---

## 8.4 TypeScript Interfaces — The Contract

Interfaces define the shape of data flowing between frontend and backend:

```typescript
// What we SEND to the API
export interface QuoteSubmission {
  name: string
  email: string
  address: string
  monthly_bill: number
}

// What we RECEIVE from the API
export interface QuoteResponse {
  id: number
  name: string
  email: string
  address: string
  monthly_bill: string       // Django Decimal → JSON string
  estimated_savings: string  // Computed server-side
  created_at: string         // ISO 8601 datetime
}

// Error response format
export interface ApiError {
  error_code: string
  message: string
  field_errors?: Record<string, string[]>
}
```

**Important:** `monthly_bill` is `number` when sending but `string` when receiving. Django's `DecimalField` serializes to a string to preserve precision. The frontend parses it with `parseFloat()` when displaying.

---

## 8.5 Custom Error Class

```typescript
export class QuoteApiError extends Error {
  errorCode: string
  friendlyMessages: string[]

  constructor(apiError: ApiError) {
    super(apiError.message)
    this.errorCode = apiError.error_code
    this.friendlyMessages = apiError.field_errors
      ? humanizeFieldErrors(apiError.field_errors)
      : [apiError.message]
  }
}
```

**Why a custom error class?**

1. `instanceof QuoteApiError` lets us distinguish API errors from other errors.
2. `friendlyMessages` provides user-facing text (not raw API messages).
3. Keeps error handling clean in components.

---

## 8.6 Error Humanization

Raw API errors aren't great UX:

```json
{ "field_errors": { "email": ["Enter a valid email address."] } }
```

The `humanizeFieldErrors` function translates them:

```typescript
const FRIENDLY_FIELD_MESSAGES: Record<string, Record<string, string>> = {
  email: {
    'Enter a valid email address.': 'Email is invalid.',
    'This field is required.': 'Email is required.',
  },
  name: {
    'This field is required.': 'Please enter your name.',
  },
  address: {
    'This field is required.': 'Please enter your home address so we can assess your solar potential.',
  },
  monthly_bill: {
    'This field is required.': 'Please enter your monthly electricity bill.',
    'A valid number is required.': 'Please enter a number (e.g. 1500).',
  },
}

function humanizeFieldErrors(fieldErrors: Record<string, string[]>): string[] {
  const messages: string[] = []
  for (const [field, errors] of Object.entries(fieldErrors)) {
    for (const error of errors) {
      const friendly = FRIENDLY_FIELD_MESSAGES[field]?.[error]
      if (friendly) {
        messages.push(friendly)
      } else if (field === 'monthly_bill' && error.includes('greater than')) {
        messages.push('Your monthly bill must be a positive number.')
      } else {
        const label = field.replace('_', ' ')
        messages.push(`${label.charAt(0).toUpperCase() + label.slice(1)}: ${error}`)
      }
    }
  }
  return messages
}
```

**Pattern breakdown:**

1. Look up the field and error message in the translation map.
2. If found, use the friendly version.
3. If not found, format the raw message with a readable field name.
4. Special case handling for specific error patterns.

---

## 8.7 Using the API in Components

### Submitting data (LeadCaptureForm)

```tsx
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setErrorMessages([])

  // 1. Client-side validation first (instant, no network)
  const clientErrors = validate()
  if (clientErrors.length > 0) {
    setStatus('error')
    setErrorMessages(clientErrors)
    return
  }

  // 2. Show loading state
  setStatus('loading')

  try {
    // 3. Send to API
    await submitQuote({ name, email, address, monthly_bill: bill })

    // 4. Success — reset form
    setStatus('success')
    setName('')
    setEmail('')
    setAddress('')
    setBill(0)
  } catch (err) {
    // 5. Handle errors
    setStatus('error')
    if (err instanceof QuoteApiError) {
      setErrorMessages(err.friendlyMessages)
    } else {
      setErrorMessages(['An unexpected error occurred.'])
    }
  }
}
```

**The validation layers:**

```
User clicks "Submit"
    │
    ▼
Client-side validation (instant, no network)
    │ Pass?
    ▼
API request (POST /api/quotes/)
    │
    ▼
Server-side validation (serializer.is_valid())
    │ Pass?                     │ Fail?
    ▼                           ▼
201 Created                 400 Bad Request
    │                           │
    ▼                           ▼
Show success              Show error messages
```

**Why validate on both sides?**
- **Client-side:** Instant feedback, no network delay.
- **Server-side:** Security — client validation can be bypassed.

### Fetching data (DashboardPage)

```tsx
function loadQuotes() {
  setLoading(true)
  setError('')
  fetchQuotes()
    .then(setQuotes)        // Shorthand for: .then(data => setQuotes(data))
    .catch(() => setError('Unable to load quotes.'))
    .finally(() => setLoading(false))
}

useEffect(() => {
  loadQuotes()
}, [])
```

**The loading states:**

```
Component mounts
    │
    ▼
loading=true → Show skeleton UI
    │
    ▼
fetchQuotes() → GET /api/quotes/
    │
    ├── Success → setQuotes(data), loading=false → Show table
    │
    └── Error → setError(message), loading=false → Show error + retry
```

---

## 8.8 CORS — Cross-Origin Resource Sharing

When the frontend (port 5173) requests data from the backend (port 8000), the browser blocks it by default — different ports = different origins.

**Django's CORS config (`settings.py`):**

```python
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^http://localhost:\d+$',
    r'^http://127\.0\.0\.1:\d+$',
]
```

This tells Django: "When a request comes from localhost (any port), add the `Access-Control-Allow-Origin` header to the response."

**What happens without CORS:**

```
Browser: "I want to fetch from localhost:8000"
Browser: "But the page is from localhost:5173 — different origin!"
Browser: "I'll check if the server allows this..."
Server: (no CORS headers)
Browser: "Blocked! CORS policy violation."
```

**With CORS configured:**

```
Browser: "I'll check if the server allows this..."
Server: "Access-Control-Allow-Origin: http://localhost:5173"
Browser: "OK, allowed!"
```

---

## 8.9 The Complete Data Flow

Let's trace a full quote submission from button click to database:

```
1. User fills form, clicks "Get my quote"
   │
2. handleSubmit() runs
   │ - validate() checks client-side
   │ - setStatus('loading')
   │
3. submitQuote({name, email, address, monthly_bill: 1500})
   │
4. fetch('http://localhost:8000/api/quotes/', {
   │   method: 'POST',
   │   headers: {'Content-Type': 'application/json'},
   │   body: '{"name":"Jane","email":"jane@example.com",...}'
   │ })
   │
5. Browser sends: OPTIONS /api/quotes/ (CORS preflight)
   │ Server responds: Access-Control-Allow-Origin: http://localhost:5173
   │
6. Browser sends: POST /api/quotes/ with JSON body
   │
7. Django URL resolver → QuoteListCreateView.post()
   │
8. QuoteSerializer(data=request.data)
   │ serializer.is_valid() → validates all fields
   │
9. estimated_savings = 1500 * 0.3 = 450.00
   │ serializer.save(estimated_savings=450)
   │
10. Quote.objects.create(...) → INSERT INTO quotes_quote ...
    │
11. Response(serializer.data, status=201)
    │ → {"id": 5, "name": "Jane", ..., "estimated_savings": "450.00"}
    │
12. Frontend receives JSON
    │ response.json() → QuoteResponse object
    │
13. setStatus('success')
    │ Form resets, success message shown
```

---

## 8.10 Advanced: Async/Await vs Promises

Both patterns appear in our code:

### Promise chains (DashboardPage)

```typescript
fetchQuotes()
  .then(setQuotes)
  .catch(() => setError('...'))
  .finally(() => setLoading(false))
```

### Async/Await (LeadCaptureForm)

```typescript
try {
  await submitQuote(data)
  setStatus('success')
} catch (err) {
  setStatus('error')
}
```

Both are equivalent. Async/await is generally preferred for readability, especially with multiple sequential steps. Promise chains are more concise for simple one-shot operations.

---

## 8.11 Advanced: Separation of Concerns

Our API layer is cleanly separated:

```
api/
├── config.ts    ← Configuration (base URL)
└── quotes.ts    ← API functions + types + error handling
```

**Components never call `fetch` directly.** They import functions:

```tsx
import { submitQuote, fetchQuotes, QuoteApiError } from '../api/quotes'
```

**Benefits:**
- Change the API URL → update one file.
- Change from `fetch` to `axios` → update one file.
- Add authentication headers → update one file.
- All API types are co-located with the functions.

---

## Exercises

1. **Add error handling:** In `fetchQuotes`, handle specific HTTP status codes differently (e.g., 403 = "Unauthorized", 500 = "Server error").

2. **Loading states:** Add a loading spinner to the DashboardPage's refresh button (like the submit button in LeadCaptureForm).

3. **Optimistic update:** After submitting a quote, immediately add it to the dashboard's list without waiting for a refresh.

4. **Add a DELETE function:** Create `deleteQuote(id: number)` in `api/quotes.ts` that sends `DELETE /api/quotes/{id}/`. (You'll need to add the backend endpoint first.)

5. **Request timing:** Log how long API requests take using `performance.now()` before and after the `fetch` call.

6. **Network simulation:** In Chrome DevTools → Network tab, throttle to "Slow 3G" and observe how loading states work.

---

**Next lesson:** [09 - State Management & React Context](09-state-management-context.md)
