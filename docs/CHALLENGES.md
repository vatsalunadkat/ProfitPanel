# Challenges & How I Solved Them

This document records the problems I ran into during development and how I fixed them.

---

## 1. Tailwind CSS changed everything in version 4

**What happened:**
Tailwind CSS v4 (released 2025) completely changed how configuration works. The old setup files and keywords (`tailwind.config.js`, `@tailwind base`, etc.) simply don't exist in v4. Running `npm install tailwindcss` pulls v4 by default — and then nothing works, with no obvious error message.

**How I fixed it:**
I pinned the install to version 3 explicitly:
```
npm install -D tailwindcss@3 postcss autoprefixer
```

**Lesson learned:** Always check whether a tool has had a recent major release before following setup guides. Major version changes often break things silently.

---

## 2. GitHub Pages breaks when you refresh a non-root page

**What happened:**
The app has two pages: the Quote Form (`/`) and the Dashboard (`/dashboard`). React Router handles navigation client-side, but when someone types `yoursite.github.io/ProfitPanel/dashboard` directly into the address bar, GitHub Pages looks for `dashboard/index.html` — which doesn't exist — and returns a 404.

**How I fixed it:**
I added a custom `404.html` that captures the intended path and redirects to `index.html` with the path encoded in the URL. The main `index.html` reads that hint, fixes the URL silently, and React Router takes over. The user never sees any of this.

**Lesson learned:** SPAs need special handling on static hosts like GitHub Pages because the server doesn't know about the app's internal routes.

---

## 3. The calculator and the form didn't stay in sync

**What happened:**
The savings calculator at the top of the page has a "monthly bill" input. The lead capture form below it also has a "monthly bill" field that should match. In React, when you pass a value as a prop to initialise state, it only reads it once — subsequent changes don't propagate.

**How I fixed it:**
I added a `useEffect` that watches for changes in the calculator value and updates the form field whenever it changes.

**Lesson learned:** In React, initial values are just starting points. If two components need to stay connected, you need to explicitly sync them.

---

## 4. People could submit negative or zero electricity bills

**What happened:**
Without validation, someone could type `-500` or `0` and submit the form. Neither makes sense for a solar savings calculation.

**How I fixed it:**
I added a `MinValueValidator(0.01)` on the Django model so the server rejects any bill that's zero or negative. The frontend also has `min={1}` on the input for immediate feedback — but the server-side check is the real safety net.

**Lesson learned:** Always validate on the server, even if the browser also checks. The browser can be bypassed; the server is the final gatekeeper.

---

## 5. Savings calculation rounding was inconsistent

**What happened:**
The frontend used `Math.round()` (rounds to whole numbers), while the backend stores 2 decimal places. For a bill like 1234, the frontend showed 370 but the backend stored 370.20.

**How I fixed it:**
I changed the frontend calculation to round to exactly 2 decimal places:
```
Math.round(bill * 0.3 * 100) / 100
```

**Lesson learned:** When the same calculation happens in two places, make sure they round the same way.

---

## 6. Backend error messages were too technical for users

**What happened:**
Django sends back developer-oriented error messages like `{"email": ["Enter a valid email address."]}`. Showing raw JSON to customers is confusing.

**How I fixed it:**
I built two layers:
1. **Backend:** A consistent error envelope — every error response includes an `error_code`, a `message`, and optional `field_errors`.
2. **Frontend:** A translation layer that converts structured errors into friendly messages. For example, `{"monthly_bill": ["Ensure this value is greater than or equal to 0.01."]}` becomes "Your monthly bill must be a positive number."

**Lesson learned:** APIs should return structured, machine-readable errors. Frontends should turn those into human-readable messages. The two concerns are separate.

---

## 7. The dashboard showed stale data

**What happened:**
If I had the dashboard open and a new quote was submitted from another tab, there was no way to see it without a full page reload.

**How I fixed it:**
I added a "Refresh" button that re-fetches all quotes from the server. For a production app I'd consider polling or WebSockets, but a manual refresh is the simplest reliable approach here.

**Lesson learned:** Data on screen goes stale. Always give users a way to refresh — automatically or manually.

---

## 8. Accessibility basics were missing

**What happened:**
Screen readers couldn't properly understand the forms (labels weren't linked to inputs), and savings updates weren't announced.

**How I fixed it:**
- Linked every `<label>` to its `<input>` using `htmlFor` / `id`
- Added `aria-live="polite"` to the savings results so screen readers announce updates
- Added `role="img"` with `aria-label` on decorative elements

**Lesson learned:** Small accessibility improvements cost almost nothing but make the app usable for a much wider audience.

---

## 9. Making two equal-height cards sit side by side

**What happened:**
The Savings Calculator and Lead Capture Form have different content heights. In a two-column grid, one card was much shorter than the other.

**How I fixed it:**
I used `flex flex-col` on both card containers and `mt-auto` on the form's submit button to push it to the bottom. Both cards now stretch to equal height. On mobile, the grid collapses to a single column.

**Lesson learned:** CSS Grid gives equal-height columns, but the content inside also needs to stretch. Combine `grid` with `flex flex-col` and `mt-auto`.

---

## 10. Dark mode with Tailwind requires careful class management

**What happened:**
Three subtle issues emerged:
1. **Flash of wrong theme** on page load before React hydrates
2. **Jarring transition** when switching themes (all colours changed in a single frame)
3. **Range slider styling** — `<input type="range">` ignores most CSS in dark mode

**How I fixed it:**
1. Read theme preference synchronously from `localStorage` / `prefers-color-scheme` before first paint
2. Added `transition-colors duration-200` on the root element
3. Used vendor-specific pseudo-elements (`::-webkit-slider-thumb`, `::-moz-range-thumb`) in a Tailwind `@layer` block

**Lesson learned:** Dark mode is more than adding `dark:` variants. The theme class lifecycle and browser-native form elements need special attention.

---

## 11. Django `Decimal` × `float` type error

**What happened:**
When POSTing a new quote, the server crashed because the savings calculation multiplied a `Decimal` (from Django's `DecimalField`) by a `float`:
```python
estimated_savings = round(monthly_bill * 0.3, 2)  # TypeError
```

**How I fixed it:**
I used a `Decimal` string literal for the multiplier:
```python
from decimal import Decimal
estimated_savings = round(monthly_bill * Decimal('0.3'), 2)
```

**Lesson learned:** When working with Django `DecimalField` values, always use `Decimal` types in calculations — never mix with `float`.

---

## 12. TypeScript `verbatimModuleSyntax` required type-only imports

**What happened:**
The build failed because `QuoteResponse` (an interface) was imported as a regular value import. With `verbatimModuleSyntax` enabled, TypeScript requires type-only imports for anything without a runtime representation.

**How I fixed it:**
Split the import:
```typescript
import { fetchQuotes } from '../api/quotes'
import type { QuoteResponse } from '../api/quotes'
```

**Lesson learned:** With `verbatimModuleSyntax`, always use `import type` for interfaces and type aliases. Classes (used with `instanceof`) are fine as value imports.

---

## 13. Port conflicts causing silent frontend/backend disconnection

**What happened:**
When `start-dev.bat` ran while previous dev processes were still holding ports, Vite would silently pick the next available port (e.g. 5174). The CORS config was hardcoded to `localhost:5173`, so all API calls from the shifted port were blocked — with no clear error message.

**How I fixed it:**
1. Updated startup scripts to kill stale processes on ports 8000, 5173–5175 before starting
2. Launched Vite with `--strictPort` so it fails loudly instead of silently shifting
3. Replaced hardcoded `CORS_ALLOWED_ORIGINS` with `CORS_ALLOWED_ORIGIN_REGEXES` using `r'^http://localhost:\d+$'`

**Lesson learned:** Hardcoded port numbers in CORS configs are fragile. Use regex-based origin matching in development; pin exact origins in production.

---

## 14. React StrictMode causes double API calls in development

**What happened:**
After adding a quote detail modal that fetches a single quote by ID, I noticed the API was called twice every time a row was clicked. The `useEffect` inside the modal component fired twice even though `quoteId` hadn't changed.

**Why it happens:**
The app is wrapped in `<React.StrictMode>` (in `main.tsx`). In development mode, StrictMode intentionally mounts, unmounts, and re-mounts every component to surface bugs related to missing cleanup in effects. This causes every `useEffect` to run twice.

**Resolution:**
No code change needed — this is by design and **only happens in development**. Production builds are unaffected. Removing `<StrictMode>` would stop the double call but is not recommended, as it catches real bugs like missing effect cleanup and stale closures.

**Lesson learned:** If you see effects running twice in development, check for `<StrictMode>` before assuming there's a bug. It's a development-only safeguard, not a production issue.
