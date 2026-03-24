# Lesson 10: Full-Stack Architecture & Patterns

> Understand how all the pieces fit together and learn design patterns used across ProfitPanel.

---

## 10.1 Architecture Overview

ProfitPanel follows a **decoupled SPA architecture**: the frontend and backend are independent applications that communicate via a REST API.

```
┌─────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              React SPA (Vite)                    │    │
│  │                                                  │    │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────┐   │    │
│  │  │  Pages  │  │Components│  │  API Layer   │   │    │
│  │  │         │  │          │  │              │   │    │
│  │  │ Quote   │  │ Layout   │  │ config.ts    │   │    │
│  │  │ Form    │  │ Savings  │  │ quotes.ts    │──┼────┼──── HTTP/JSON
│  │  │ Page    │  │ Calc     │  │              │   │    │
│  │  │         │  │ Lead     │  │              │   │    │
│  │  │ Dash    │  │ Form     │  │              │   │    │
│  │  │ board   │  │ Theme    │  │              │   │    │
│  │  │ Page    │  │ Toggle   │  │              │   │    │
│  │  └─────────┘  └──────────┘  └──────────────┘   │    │
│  │                                                  │    │
│  │  ┌─────────────────┐  ┌────────────────────┐    │    │
│  │  │    Context       │  │    Router          │    │    │
│  │  │  ThemeProvider   │  │  BrowserRouter     │    │    │
│  │  └─────────────────┘  └────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          │  HTTP Requests (GET, POST)
                          │  JSON Responses
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Django Backend (DRF)                     │
│                                                          │
│  ┌──────────┐  ┌────────────┐  ┌───────────────────┐   │
│  │  URLs    │  │   Views    │  │   Serializers     │   │
│  │          │──│            │──│                   │   │
│  │ /api/    │  │ List       │  │ QuoteSerializer   │   │
│  │ quotes/  │  │ Create     │  │                   │   │
│  └──────────┘  └────────────┘  └───────────────────┘   │
│                       │                                  │
│                       ▼                                  │
│              ┌────────────────┐                          │
│              │    Models      │                          │
│              │    (ORM)       │                          │
│              │    Quote       │                          │
│              └────────┬───────┘                          │
│                       │                                  │
│                       ▼                                  │
│              ┌────────────────┐                          │
│              │   Database     │                          │
│              │   (SQLite)     │                          │
│              └────────────────┘                          │
└─────────────────────────────────────────────────────────┘
```

---

## 10.2 Frontend Architecture Patterns

### Component Hierarchy

```
App
├── ThemeProvider (context)
└── BrowserRouter (routing)
    └── Routes
        └── Layout (persistent shell)
            ├── Nav (with NavItems)
            ├── Outlet → [
            │   QuoteFormPage (page)
            │   ├── SavingsCalculator (interactive widget)
            │   └── LeadCaptureForm (form with API call)
            │
            │   DashboardPage (page)
            │   └── (self-contained: fetch, search, sort, render)
            │ ]
            └── Footer
```

### Folder Organization

```
src/
├── api/          ← API layer (data fetching, types, error handling)
├── components/   ← Reusable UI components
├── context/      ← React Context providers
├── pages/        ← Route-level components (one per URL)
├── App.tsx       ← Root component (routing setup)
├── main.tsx      ← Entry point (mounts React)
└── index.css     ← Global styles
```

**Convention:** Pages compose components. Components are reusable. API functions are standalone.

---

## 10.3 Design Patterns in the Codebase

### Pattern 1: Container/Presentational Split

Pages act as "containers" (managing data/state), components act as "presentational" (rendering UI):

```
QuoteFormPage (container)
├── Owns state: monthlyBill
├── Coordinates children
│
├── SavingsCalculator (presentational + local state)
│   └── Receives data via props
│   └── Reports changes via callback
│
└── LeadCaptureForm (presentational + local state + API call)
    └── Receives initial data via props
    └── Manages own form state
    └── Calls API directly
```

### Pattern 2: Controlled Components

All form inputs are **controlled** — React owns the value:

```tsx
<input
  value={name}                         // React controls the value
  onChange={e => setName(e.target.value)} // Every keystroke updates state
/>
```

**Why controlled?** You can validate, transform, and read the value at any time. Uncontrolled components (using `ref`) are harder to manage.

### Pattern 3: Error Boundary / Error States

Each component handles its own error states rather than relying on a global error handler:

```tsx
// LeadCaptureForm — local error state
const [errorMessages, setErrorMessages] = useState<string[]>([])

// DashboardPage — local error state
const [error, setError] = useState('')
```

This gives each component control over how errors are displayed and recovered from.

### Pattern 4: Loading State Machine

Components follow a state machine pattern for async operations:

```
idle → loading → success
                → error → (user retries) → loading → ...
```

```tsx
// LeadCaptureForm
type Status = 'idle' | 'loading' | 'success' | 'error'

// Each status renders different UI:
// idle    → show the form
// loading → show spinner, disable submit
// success → show success message
// error   → show form with error banner
```

### Pattern 5: Composition over Inheritance

React prefers composition. Instead of an `AbstractFormComponent` base class:

```tsx
// Layout uses Outlet for composition:
<Layout>
  <Outlet />  {/* Different content per route */}
</Layout>

// QuoteFormPage composes two components side by side:
<SavingsCalculator />
<LeadCaptureForm />
```

---

## 10.4 Backend Architecture Patterns

### Pattern 1: Fat Models, Thin Views

The Quote model defines business rules (ordering, validation):

```python
class Quote(models.Model):
    monthly_bill = models.DecimalField(
        validators=[MinValueValidator(0.01)],  # Validation in the model
    )
    class Meta:
        ordering = ['-created_at']  # Business rule: newest first
```

The view is thin — it delegates to the serializer and model:

```python
def post(self, request):
    serializer = QuoteSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(estimated_savings=...)
        return Response(serializer.data, status=201)
```

### Pattern 2: Consistent Error Envelope

Every API error follows the same format:

```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "One or more fields have errors.",
  "field_errors": { "email": ["Enter a valid email address."] }
}
```

This is enforced by:
1. **Custom exception handler** (`core/exception_handler.py`) — catches DRF errors.
2. **Explicit error responses** in views — validation errors.
3. **Frontend error class** (`QuoteApiError`) — parses the envelope.

### Pattern 3: Serializer as Gatekeeper

The serializer acts as the security boundary:

```python
class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        fields = [...]                                    # Only expose these fields
        read_only_fields = ['id', 'estimated_savings', 'created_at']  # Can't be set by clients
```

- `fields` prevents data leakage.
- `read_only_fields` prevents unauthorized modification.
- Validation runs automatically on `is_valid()`.

---

## 10.5 Data Flow Patterns

### Unidirectional Data Flow (Frontend)

```
User Action → Event Handler → State Update → Re-render → Updated UI
     │                                                        │
     └────────────────── User sees result ◄───────────────────┘
```

Example from SavingsCalculator:

```
User drags slider → handleSliderChange → setBill(1200) + onBillChange(1200)
    │                                          │                    │
    │                                   SavingsCalculator       QuoteFormPage
    │                                   re-renders with         updates monthlyBill
    │                                   new savings values      → LeadCaptureForm
    │                                          │                re-renders
    └───── User sees updated calculations ◄────┘
```

### Request/Response Cycle (Full Stack)

```
React Component
    │ handleSubmit()
    ▼
API Layer (quotes.ts)
    │ fetch(POST /api/quotes/)
    ▼
CORS Middleware
    │ Adds Access-Control headers
    ▼
Django URL Router
    │ /api/ → quotes.urls → QuoteListCreateView
    ▼
DRF APIView.post()
    │ QuoteSerializer(data=request.data)
    │ serializer.is_valid()
    ▼
Django ORM
    │ Quote.objects.create(...)
    ▼
SQLite Database
    │ INSERT INTO quotes_quote ...
    ▼
Response travels back up the stack
    │ → JSON → fetch → API layer → Component → UI update
```

---

## 10.6 Security Considerations

| Concern | Backend Solution | Frontend Solution |
|---------|-----------------|-------------------|
| **Input validation** | Serializer validation, model validators | Client-side validation (UX, not security) |
| **SQL injection** | Django ORM parameterizes queries | N/A |
| **XSS** | DRF auto-escapes output | React auto-escapes JSX |
| **CSRF** | CSRF middleware (for session auth) | Token-based API doesn't need CSRF |
| **CORS** | `CORS_ALLOWED_ORIGIN_REGEXES` | Enforced by browser |
| **Data exposure** | `fields` + `read_only_fields` | Never trust client data |
| **Secrets** | `SECRET_KEY` in settings (use env vars in prod) | `VITE_` prefix prevents leaking server vars |

**Important:** Client-side validation is for **user experience only**. A malicious user can bypass it. The server must always validate.

---

## 10.7 Testing Strategy (Guide)

Although ProfitPanel's test suite is minimal, here's how you'd test each layer:

### Frontend Testing

```
Unit tests (Vitest/Jest):
├── API functions: mock fetch, test error handling
├── Custom hooks: test state logic
└── Utility functions: test humanizeFieldErrors

Component tests (Testing Library):
├── LeadCaptureForm: render, fill inputs, submit, check states
├── SavingsCalculator: input values, check calculations
└── DashboardPage: mock API, verify table rendering

E2E tests (Playwright/Cypress):
└── Full flow: submit quote → see it on dashboard
```

### Backend Testing

```python
# Django's test client
from django.test import TestCase
from rest_framework.test import APIClient

class QuoteAPITest(TestCase):
    def test_create_quote(self):
        client = APIClient()
        response = client.post('/api/quotes/', {
            'name': 'Jane', 'email': 'jane@example.com',
            'address': 'Stockholm', 'monthly_bill': '1500.00',
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['estimated_savings'], '450.00')

    def test_invalid_email(self):
        client = APIClient()
        response = client.post('/api/quotes/', {
            'name': 'Jane', 'email': 'not-an-email',
            'address': 'Stockholm', 'monthly_bill': '1500',
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('email', response.data['field_errors'])
```

---

## 10.8 Deployment Architecture

### Current: GitHub Pages (Static Frontend)

```
Frontend (GitHub Pages)          Backend (local/future server)
┌──────────────────────┐        ┌──────────────────────┐
│  Static HTML/JS/CSS  │  API   │  Django + Gunicorn    │
│  /ProfitPanel/       │ ◄────► │  :8000               │
│  No server needed    │  calls │  SQLite/PostgreSQL    │
└──────────────────────┘        └──────────────────────┘
```

### Production deployment (future)

```
                     ┌──────────────────┐
Internet ──────────► │   Nginx / CDN    │
                     │ (reverse proxy)  │
                     └──────┬───────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
        Static files               Gunicorn/uvicorn
        (React build)              (Django app)
        index.html, JS, CSS            │
                                       ▼
                                  PostgreSQL
```

---

## 10.9 Development Workflow

### Starting the project

```bash
# Terminal 1: Frontend
cd frontend
npm install
npm run dev         # → http://localhost:5173

# Terminal 2: Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # → http://localhost:8000
```

Or use the convenience script:

```bash
# Windows
start-dev.bat

# Linux/macOS
./start-dev.sh
```

### Development cycle

```
1. Edit code (React component / Django view)
2. Frontend: HMR auto-refreshes the browser
   Backend: Dev server auto-reloads on save
3. Test: Check browser + check API (Swagger/curl)
4. Commit: git add + git commit
```

---

## 10.10 Conventions & Best Practices in This Project

### Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `SavingsCalculator`, `LeadCaptureForm` |
| Component files | PascalCase.tsx | `SavingsCalculator.tsx` |
| Hooks | camelCase, start with `use` | `useTheme()`, `useState()` |
| Event handlers | camelCase, start with `handle`/`on` | `handleSubmit`, `onBillChange` |
| Django models | PascalCase (singular) | `Quote` |
| Django apps | lowercase | `quotes` |
| API URLs | lowercase, plural | `/api/quotes/` |
| CSS classes | kebab-case (Tailwind) | `text-gray-900`, `bg-svea-green` |

### File Organization Rules

1. **One component per file** — Each `.tsx` file exports one component.
2. **Co-locate related code** — API types live with API functions.
3. **Pages import components** — Never the reverse.
4. **Context provides, hooks consume** — `ThemeProvider` provides, `useTheme` consumes.

### Code Quality Tools

| Tool | What it does | Config file |
|------|-------------|-------------|
| **TypeScript** | Type checking | `tsconfig.app.json` |
| **ESLint** | Code quality rules | `eslint.config.js` |
| **Tailwind** | Utility CSS generation | `tailwind.config.js` |
| **Vite** | Build & dev server | `vite.config.ts` |
| **Django** | Server framework | `core/settings.py` |

---

## 10.11 What to Learn Next

Now that you understand the full stack, here are recommended next steps:

### Frontend
- [ ] **React Testing Library** — Write component tests.
- [ ] **TanStack Query** — Better server state management.
- [ ] **Framer Motion** — Advanced animations.
- [ ] **Zustand/Jotai** — Alternative to Context for complex state.
- [ ] **React Hook Form** — Powerful form library with validation.

### Backend
- [ ] **Django testing** — Write model and API tests.
- [ ] **Authentication** — Add JWT or session-based auth.
- [ ] **PostgreSQL** — Switch from SQLite for production.
- [ ] **Celery** — Background task processing.
- [ ] **Docker** — Containerize the application.

### DevOps
- [ ] **GitHub Actions** — CI/CD pipeline (lint, test, deploy).
- [ ] **Docker Compose** — Run frontend + backend + database together.
- [ ] **Environment management** — Use `.env` files properly.

---

## Exercises

1. **Add tests:** Write a Django test for the Quote API (test creation, validation errors, listing).

2. **Add a feature end-to-end:** Add a "phone" field — update the Django model, serializer, API docs, TypeScript interface, form component, and dashboard table.

3. **Error boundary:** Create a React Error Boundary component that catches JavaScript errors and shows a friendly message instead of crashing.

4. **API documentation:** Visit `/api/docs/` and verify every endpoint is documented correctly. Add examples for edge cases.

5. **Performance audit:** Open Chrome DevTools → Performance tab. Record loading the dashboard, and identify any slow renders.

---

## Congratulations!

You've completed the ProfitPanel learning course. You now understand:
- **React** — Components, hooks, JSX, state, props, context.
- **TypeScript** — Types, interfaces, generics, narrowing.
- **React Router** — Client-side routing, nested routes, navigation.
- **Vite** — Dev server, HMR, production builds, environment variables.
- **Tailwind CSS** — Utility-first styling, responsive design, dark mode.
- **Django** — Models, ORM, URLs, admin, settings, migrations.
- **Django REST Framework** — Serializers, views, validation, documentation.
- **API Integration** — fetch, error handling, CORS, data flow.
- **State Management** — useState, useContext, useMemo, patterns.
- **Architecture** — Full-stack patterns, security, deployment, testing.

The best way to solidify this knowledge is to **build a feature**. Pick one of the exercises and implement it end to end!
