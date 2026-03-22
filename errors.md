# Errors Encountered During Development

This document records actual runtime errors and bugs we hit while building the project, which ticket they occurred in, and how we fixed them. These are distinct from the [Challenges](CHALLENGES.md) file, which covers design decisions and architectural trade-offs.

---

## 1. `TypeError: unsupported operand type(s) for *: 'decimal.Decimal' and 'float'`

**Ticket:** BE-03 — Build the REST API endpoints (POST and GET /api/quotes/)

**What happened:**
When POSTing a new quote, the server crashed with a 500 error. The savings calculation in the view was written as:
```python
estimated_savings = round(monthly_bill * 0.3, 2)
```
Django's `DecimalField` returns a Python `Decimal` object, and Python does not allow multiplying a `Decimal` by a `float` (`0.3`). This raised a `TypeError` at runtime.

The error was initially hidden because our custom exception handler (`core/exception_handler.py`) caught the unhandled exception and returned a generic `{"error_code": "SERVER_ERROR"}` response. We had to test the serializer directly in a Python shell to see the full traceback.

**How we fixed it:**
We imported `Decimal` and used a `Decimal` string literal for the multiplier:
```python
from decimal import Decimal

estimated_savings = round(monthly_bill * Decimal('0.3'), 2)
```
This keeps the entire calculation in `Decimal` arithmetic, which is also more precise for financial values.

**Lesson learned:** When working with Django `DecimalField` values, always use `Decimal` types in calculations — never mix with `float`. This avoids both type errors and floating-point precision issues with money.

---

## 2. PowerShell does not support `&&` for chaining commands

**Ticket:** BE-01 — Bootstrap the Django project

**What happened:**
When trying to run two commands sequentially with `&&`:
```
venv\Scripts\django-admin startproject core . && venv\Scripts\python manage.py startapp quotes
```
PowerShell returned:
```
The token '&&' is not a valid statement separator in this version.
```
The `&&` operator is a bash/cmd feature. Older versions of PowerShell (and some configurations) do not support it.

**How we fixed it:**
We ran each command separately instead of chaining them.

**Lesson learned:** When scripting on Windows with PowerShell, don't assume bash-style operators work. Run commands individually or use PowerShell's native `;` separator (which runs the second command regardless of the first's exit code).

---

## 3. `TS1484: 'QuoteResponse' is a type and must be imported using a type-only import`

**Ticket:** FE-05 — Build the Quote Dashboard page

**What happened:**
The TypeScript build failed because `QuoteResponse` (an interface) was imported as a regular value import:
```typescript
import { fetchQuotes, QuoteResponse } from '../api/quotes'
```
The project's `tsconfig.json` has `verbatimModuleSyntax` enabled, which requires type-only imports for anything that is purely a type and has no runtime representation.

**How we fixed it:**
We split the import into a value import and a type-only import:
```typescript
import { fetchQuotes } from '../api/quotes'
import type { QuoteResponse } from '../api/quotes'
```

**Lesson learned:** When `verbatimModuleSyntax` is enabled, always use `import type` for interfaces and type aliases. Classes like `QuoteApiError` are fine as value imports because they exist at runtime (used with `instanceof`).

---

## 4. Port conflicts causing silent frontend/backend disconnection

**Ticket:** FE-07 — Match UI to Svea Solar brand (start-dev.bat fix)

**What happened:**
When the `start-dev.bat` script was run while a previous dev session's processes were still holding ports 8000 or 5173, Vite would silently pick the next available port (e.g. 5174). The Django `CORS_ALLOWED_ORIGINS` list was hardcoded to `localhost:5173`, so API requests from the new frontend port were blocked by CORS. The app appeared to load normally but all API calls failed with opaque CORS errors in the browser console — no clear indication that the port had shifted.

**How we fixed it:**
Two changes:
1. Updated `start-dev.bat` to kill any stale processes on ports 8000, 5173–5175 before starting, and launch Vite with `--port 5173 --strictPort` so it fails loudly instead of silently picking a different port.
2. Replaced the hardcoded `CORS_ALLOWED_ORIGINS` list in `backend/core/settings.py` with `CORS_ALLOWED_ORIGIN_REGEXES` using regex patterns (`r'^http://localhost:\d+$'`) so any localhost port is accepted during development.

**Lesson learned:** Hardcoded port numbers in CORS configs are fragile. In development, use regex-based origin matching to tolerate port changes. For production, pin to exact origins.
