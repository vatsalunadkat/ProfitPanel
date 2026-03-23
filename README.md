# ProfitPanel - Solar Quote Platform

> Calculate. Capture. Convert.

A full-stack solar quotation platform where customers estimate their energy savings, submit a lead-capture form, and a back-office dashboard displays all incoming quote requests.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Django](https://img.shields.io/badge/Django-6.0-green?logo=django)
![DRF](https://img.shields.io/badge/DRF-3.17-red)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?logo=swagger)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)

---

## Setup

### Quick Start

**Windows:** Double-click `start-dev.bat` — it starts both servers and opens the app.

**macOS / Linux:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Manual Start

#### Backend (Django)

**Requirements:** Python 3.10+

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API will be available at http://localhost:8000/api/quotes/

You can also visit that URL in a browser — Django REST Framework provides a browsable HTML interface for testing.

#### API Documentation (Swagger / ReDoc)

With the backend running, interactive API docs are available at:

| URL | Description |
|---|---|
| [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) | **Swagger UI** — interactive explorer where you can try requests directly |
| [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/) | **ReDoc** — clean, read-only API reference |
| [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/) | Raw OpenAPI 3.0 schema (YAML) |

Powered by [drf-spectacular](https://drf-spectacular.readthedocs.io/). The schema is auto-generated from the DRF serializers and view annotations — it stays in sync with the code.

#### Frontend (React)

**Requirements:** Node.js 18+

```bash
cd frontend
cp .env.example .env.local     # uses localhost:8000 by default
npm install
npm run dev
```

Open http://localhost:5173/ProfitPanel/ in your browser.

> **Note:** Both servers need to be running simultaneously for the full app to work. The frontend makes API calls to the backend.

---

## Tech Stack & Implementation Choices

### Backend: Django + Django REST Framework (DRF)

Django is a Python web framework. DRF is a library built on top of it that makes building REST APIs fast - it provides serializers (convert between Python objects and JSON), automatic input validation, and a browsable HTML API for testing.

**Why this over the alternatives:**

| Considered | Verdict |
|---|---|
| **FastAPI** | More modern and performant, but requires bringing your own ORM (SQLAlchemy) and wiring up validation manually. For a CRUD-heavy project, that's more setup with no real benefit. |
| **Flask** | Same problem - too much manual assembly for serialization, validation, and database access. Fine for microservices, but DRF's batteries-included approach is faster for this scope. |
| **Express.js (Node)** | Would keep the stack all-JavaScript, but loses Django's admin panel, ORM, and DRF's automatic validation - all of which save significant time. |

**In production I'd add:** Authentication on the dashboard (JWT or session-based), rate limiting on the POST endpoint, and input sanitisation middleware.

### Database: SQLite

A file-based database that comes built into Django. No server to install, no connection strings - it just works.

**Why this over the alternatives:**

| Considered | Verdict |
|---|---|
| **PostgreSQL** | The production choice - handles concurrent writes, has better tooling, and scales. But for an assessment, installing and configuring a database server is overhead with no benefit. |
| **MySQL** | Same argument as PostgreSQL, with slightly worse Django integration. |

**In production I'd switch to:** PostgreSQL, with connection pooling and proper backup strategy.

### Frontend Build Tool: Vite

A modern build tool that uses native ES modules for instant dev server starts.

**Why this over the alternatives:**

| Considered | Verdict |
|---|---|
| **Create React App (CRA)** | No longer maintained by Meta. Very slow cold starts (~30 seconds). Effectively deprecated. |
| **Next.js** | Excellent framework, but brings SSR, file-based routing, and API routes - concepts that add complexity this project doesn't need. Overkill for a simple SPA. |

**In production I'd add:** Code splitting, lazy-loaded routes, and a proper CI/CD pipeline with build caching.

### Styling: Tailwind CSS v3

**What it is:** A utility-first CSS framework where styles are written directly in the HTML/JSX as class names.

> ⚠️ **Why v3 specifically:** Tailwind v4 (released 2025) is a complete rewrite with a different config system. I pinned to v3 to ensure all setup instructions and class names work correctly. See [CHALLENGES.md](docs/CHALLENGES.md) for details.

**Why this over the alternatives:**

| Considered | Verdict |
|---|---|
| **CSS Modules** | Requires switching between `.tsx` and `.module.css` files constantly. Fine for large teams, slower for solo work. |
| **Styled Components / Emotion** | CSS-in-JS adds runtime overhead and heavier bundles. Useful when styles depend heavily on dynamic props - not the case here. |
| **Plain CSS** | Zero setup but leads to specificity conflicts, naming conventions, and grows messy fast in a component-based app. |

Tailwind keeps styles co-located with JSX, the spacing scale enforces visual consistency, and unused classes are stripped at build time so the CSS bundle stays tiny.

**In production I'd add:** A custom design system config in `tailwind.config.js` with brand colours, typography, and component presets.

### Frontend Framework: React 19 + TypeScript

React is the UI library and TypeScript adds static types to JavaScript, catching bugs before they reach the browser.

**Why TypeScript:** Types serve as living documentation - anyone reading `QuoteResponse` knows exactly what shape the API returns without checking the backend.

### Routing: React Router v6

Client-side routing - navigating between the Quote Form and Dashboard without full page reloads.

**Why not something else:** React Router is the de facto standard for React SPAs. Alternatives like TanStack Router are newer and promising but less documented. For an assessment, using the industry standard reduces risk.

### Savings Calculation

The formula `savings = bill × 0.3` is intentionally simple. The calculation happens **server-side** in the Django view and the result is stored in the database. This means:
- The stored value is consistent regardless of future frontend changes
- The logic can be replaced with a real calculation (based on roof size, location, panel type) without any data migration
- A preview calculation also runs client-side for instant feedback, rounded to match the backend's 2-decimal-place precision

### Architecture: CORS

The backend accepts requests from `localhost:5173` (Vite dev server) via `django-cors-headers`. When running the deployed frontend on GitHub Pages, the evaluator needs to run the Django backend locally - cross-origin requests to `localhost:8000` are expected and handled.

---

## API Error Handling

All API error responses follow a consistent structure:

```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "One or more fields have errors.",
  "field_errors": {
    "email": ["Enter a valid email address."],
    "monthly_bill": ["Monthly bill must be a positive number."]
  }
}
```

| Error Code | HTTP Status | When it happens |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Form fields fail validation (missing, wrong format, out of range) |
| `INVALID_JSON` | 400 | Request body is not valid JSON |
| `METHOD_NOT_ALLOWED` | 405 | Using PUT/DELETE/PATCH on the quotes endpoint |
| `SERVER_ERROR` | 500 | Unexpected server failure |

The frontend translates these into user-friendly messages - users never see raw JSON or technical error codes.

---

## Project Structure

```
ProfitPanel/
├── backend/
│   ├── core/                # Django project settings, root URL config, exception handler
│   │   ├── settings.py      # CORS, DRF, drf-spectacular config
│   │   ├── urls.py          # API routes + Swagger/ReDoc endpoints
│   │   └── exception_handler.py
│   ├── quotes/              # The quotes app
│   │   ├── models.py        # Quote model (name, email, address, monthly_bill, savings)
│   │   ├── serializers.py   # DRF serializer with validation rules
│   │   ├── views.py         # List + Create endpoints with OpenAPI annotations
│   │   └── urls.py
│   ├── requirements.txt
│   └── .gitignore
├── frontend/
│   ├── public/              # Static assets, logos, 404.html (SPA routing fix)
│   ├── src/
│   │   ├── api/             # API helpers, TypeScript types, error handling
│   │   ├── components/      # SavingsCalculator, LeadCaptureForm, Layout, ThemeToggle
│   │   ├── context/         # ThemeContext (light/dark mode provider)
│   │   └── pages/           # QuoteFormPage, DashboardPage
│   ├── .env.example
│   └── .gitignore
├── docs/
│   ├── CHALLENGES.md        # Problems encountered and how I solved them
│   └── SETUP.md             # Detailed setup and troubleshooting guide
├── start-dev.bat            # One-click dev startup (Windows)
├── start-dev.sh             # One-click dev startup (macOS / Linux)
├── .gitignore
└── README.md
```

---

## Additional Documentation

- **[docs/CHALLENGES.md](docs/CHALLENGES.md)** — Problems I ran into during development and how I solved them.
- **[docs/SETUP.md](docs/SETUP.md)** — Detailed setup guide with links and troubleshooting tips.

---

## What I'd Do Differently in Production

| Layer | Improvement |
|---|---|
| **Backend** | Add JWT authentication to protect the dashboard, rate-limit the POST endpoint, add pagination to GET, input sanitisation |
| **Database** | Switch to PostgreSQL for concurrent writes, add database backups, add an index on `created_at` |
| **Frontend** | Add automated tests (vitest + React Testing Library), lazy-load dashboard route, add error boundary components |
| **Deployment** | CI/CD pipeline with GitHub Actions, environment-specific builds, HTTPS everywhere |
| **Monitoring** | Add structured logging (e.g. Sentry), health-check endpoint, uptime monitoring |
