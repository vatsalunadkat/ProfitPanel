# ProfitPanel Learning Guide

> A hands-on course to learn React, TypeScript, Vite, Tailwind CSS, Django, and Django REST Framework — using ProfitPanel's actual codebase as the teaching material.

---

## How to Use This Guide

Each lesson references real code from the ProfitPanel project. Open the referenced files alongside the lesson to see concepts in context. Exercises at the end of each lesson let you practice by extending the project.

**Recommended approach:**
1. Read the lesson.
2. Open the referenced source files and trace the concepts.
3. Experiment in the running app (`npm run dev` + `python manage.py runserver`).
4. Complete the exercises.

---

## Lessons

### Frontend

| # | Lesson | Topics | Key Files |
|---|--------|--------|-----------|
| 01 | [React Fundamentals](01-react-fundamentals.md) | Components, JSX, props, useState, useEffect, useMemo, event handling, conditional rendering, lists | `App.tsx`, `Layout.tsx`, `LeadCaptureForm.tsx`, `SavingsCalculator.tsx` |
| 02 | [TypeScript for React](02-typescript-for-react.md) | Types, interfaces, generics, type narrowing, classes, event types, tsconfig | `api/quotes.ts`, `LeadCaptureForm.tsx`, `ThemeContext.tsx` |
| 03 | [React Router & Navigation](03-react-router.md) | BrowserRouter, Routes, Route nesting, Outlet, NavLink, basename, SPA routing | `App.tsx`, `Layout.tsx`, `index.html` |
| 04 | [Vite & Build Tooling](04-vite-and-build-tooling.md) | Dev server, HMR, production builds, environment variables, PostCSS, ESLint | `vite.config.ts`, `package.json`, `index.html`, `eslint.config.js` |
| 05 | [Tailwind CSS](05-tailwind-css.md) | Utility classes, responsive design, dark mode, custom theme, animations, arbitrary values | `tailwind.config.js`, `index.css`, all components |

### Backend

| # | Lesson | Topics | Key Files |
|---|--------|--------|-----------|
| 06 | [Django Fundamentals](06-django-fundamentals.md) | Project structure, settings, models, migrations, ORM, admin, URL routing | `settings.py`, `models.py`, `urls.py`, `admin.py` |
| 07 | [Django REST Framework](07-django-rest-framework.md) | Serializers, APIView, validation, error handling, API docs, HTTP status codes | `views.py`, `serializers.py`, `exception_handler.py` |

### Integration & Architecture

| # | Lesson | Topics | Key Files |
|---|--------|--------|-----------|
| 08 | [Frontend-Backend API Integration](08-api-integration.md) | fetch API, async/await, error classes, CORS, data flow, type contracts | `api/config.ts`, `api/quotes.ts`, `LeadCaptureForm.tsx`, `DashboardPage.tsx` |
| 09 | [State Management & Context](09-state-management-context.md) | useState patterns, lifting state, React Context, custom hooks, derived state, useReducer | `ThemeContext.tsx`, `ThemeToggle.tsx`, `QuoteFormPage.tsx`, `DashboardPage.tsx` |
| 10 | [Full-Stack Architecture & Patterns](10-fullstack-architecture.md) | Architecture overview, design patterns, security, testing strategy, deployment, conventions | All files |

---

## Tech Stack Quick Reference

| Technology | Version | Role |
|-----------|---------|------|
| React | 19.2 | UI components |
| TypeScript | 5.9 | Type safety |
| Vite | 8.0 | Dev server & bundler |
| React Router | 7.13 | Client-side routing |
| Tailwind CSS | 3.4 | Utility-first styling |
| Django | 6.0 | Backend framework |
| Django REST Framework | 3.17 | REST API toolkit |
| drf-spectacular | 0.29 | API documentation |
| SQLite | (built-in) | Database |

---

## Prerequisites

- Basic HTML/CSS knowledge
- Basic Python knowledge
- A code editor (VS Code recommended)
- Node.js and Python installed

---

## Quick Start

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (separate terminal)
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open http://localhost:5173 to see the app.

---

## Interview Preparation

Targeted documents for the Svea Solar Fullstack Engineer case interview:

| # | Document | Focus |
|---|----------|-------|
| 00 | [Job Description](interview/00-job-description.md) | Full JD for reference |
| 01 | [Architectural Choices](interview/01-architectural-choices.md) | Why React+Django, SPA vs SSR, SQLite vs Postgres, error envelope design |
| 02 | [Implementation Reasoning](interview/02-implementation-reasoning.md) | Code-level decisions: custom error class, dual validation, Decimal precision, state lifting, useMemo, controlled components |
| 03 | [Core Concepts](interview/03-core-concepts.md) | None vs null, = vs == vs ===, async/await, closures, truthy/falsy, HTTP methods, status codes |
| 04 | [Advanced React Hooks](interview/04-advanced-react-hooks.md) | useState, useEffect, useContext, useMemo, useCallback, useRef, useReducer, custom hooks, Rules of Hooks |
| 05 | [Auth & Security](interview/05-auth-and-security.md) | JWT vs sessions, OAuth, CORS, CSRF, XSS, SQL injection, token storage |
| 06 | [Python & Django Deep Dive](interview/06-python-django-deep-dive.md) | Decorators, generators, ORM N+1, middleware, signals, migrations, DRF internals |
| 07 | [Behavioral & Culture](interview/07-behavioral-and-culture.md) | STAR method, Svea Solar values, system design questions, questions to ask them |
