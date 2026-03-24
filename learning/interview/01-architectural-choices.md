# Interview Prep: Architectural Choices

> Prepare to explain WHY you made each architectural decision in ProfitPanel, and discuss alternatives.

---

## 1. Decoupled SPA Architecture (React + Django)

### What we chose
Separate frontend (React SPA) and backend (Django REST API) communicating via JSON over HTTP.

### Why
- **Independent deployment:** Frontend deploys to GitHub Pages (static), backend deploys independently.
- **Team scaling:** Frontend and backend developers can work in parallel without blocking.
- **Technology flexibility:** Can swap frontend framework without touching the backend, and vice versa.
- **Clear contract:** The REST API serves as a well-defined interface between the two.
- **Relevance to Svea Solar:** Their website team has dedicated frontend and backend roles — a decoupled architecture lets them work independently.

### Alternatives considered

| Alternative | Pros | Cons |
|------------|------|------|
| **Django templates (monolith)** | Simpler deployment, built-in CSRF, no CORS | Tightly coupled, no rich interactivity, harder to reuse API |
| **Next.js fullstack** | SSR, SEO-friendly, one codebase | Locks you into Node.js backend, no Python |
| **Django + HTMX** | Simpler, no JS framework needed | Limited interactivity, not suitable for complex UIs |

### When you'd choose differently
- If SEO were critical (product pages) → Server-side rendering (Next.js or Django templates).
- If the team were very small → Monolith to reduce operational complexity.
- If real-time were needed → Add WebSocket layer (Django Channels or separate Node service).

---

## 2. Django REST Framework vs Alternatives

### What we chose
DRF with `APIView` for explicit control over request handling.

### Why
- **Mature & battle-tested:** Most popular Python REST library, massive ecosystem.
- **Serializer pattern:** Handles validation, serialization, and deserialization in one place.
- **Browsable API:** Free interactive docs for development/debugging.
- **Schema generation:** drf-spectacular auto-generates OpenAPI docs.
- **Matches Svea Solar stack:** JD mentions Python REST APIs and Django.

### Why `APIView` over `ModelViewSet`

```python
# We chose this (explicit)
class QuoteListCreateView(APIView):
    def get(self, request): ...
    def post(self, request): ...

# Instead of this (magic)
class QuoteViewSet(ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
```

**Reasoning:**
- Explicit HTTP method handlers are easier to understand and debug.
- Custom error envelope format requires manual response construction.
- Business logic (savings calculation) is clearer when written explicitly.
- ViewSets generate more URLs than needed (PUT, PATCH, DELETE) — violates principle of least privilege.

### Alternatives

| Alternative | Trade-off |
|------------|-----------|
| **FastAPI** | Faster, async-native, auto-docs — but less Django ecosystem integration |
| **Flask + Marshmallow** | Lighter weight — but more manual wiring |
| **Django Ninja** | Pydantic-based, FastAPI-like — but smaller community |
| **GraphQL (Graphene)** | Flexible queries — but over-engineered for a simple CRUD app |

---

## 3. SQLite vs PostgreSQL

### What we chose
SQLite for development.

### Why for now
- **Zero configuration:** No database server to install or manage.
- **Single-file database:** Easy to reset, version, or share.
- **Sufficient for development:** Fast, reliable, supports most SQL features.

### When to switch to PostgreSQL
- **Multi-user access:** SQLite has write-locking issues under concurrency.
- **Production deployment:** PostgreSQL handles concurrent writes, has better performance at scale.
- **Advanced features:** Full-text search, JSONB columns, array fields, advisory locks.
- **Data integrity:** Better constraint enforcement, row-level locking.

### The Django advantage
Switching is a one-line config change:

```python
# From:
DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3'}}

# To:
DATABASES = {'default': {'ENGINE': 'django.db.backends.postgresql', 'NAME': 'profitpanel', 'HOST': 'localhost'}}
```

Django's ORM abstracts the database — queries work identically on both.

---

## 4. React with Vite vs Alternatives

### What we chose
React 19 + Vite 8 + TypeScript.

### Why React
- **Ecosystem:** Largest frontend ecosystem, most third-party libraries.
- **Job market:** Most in-demand frontend framework.
- **Component model:** Composable, reusable, testable.
- **Matches Svea Solar:** JD lists React and TypeScript as bonus skills.

### Why Vite over alternatives

| Tool | Startup Time | Config | Why not |
|------|-------------|--------|---------|
| **Vite** ✓ | ~100ms | Minimal | — |
| **webpack/CRA** | 5-30s | Complex | Slow, deprecated (CRA) |
| **Next.js** | Medium | Opinionated | Over-engineered for a pure SPA |
| **Parcel** | Fast | Zero-config | Smaller ecosystem |

### Why not Next.js?
- ProfitPanel doesn't need SSR or SEO (it's an internal dashboard).
- Vite is simpler — no server runtime needed.
- If Svea Solar's website needed SEO → Next.js would be the right choice.

---

## 5. Tailwind CSS vs Alternatives

### What we chose
Tailwind CSS utility-first approach.

### Why
- **No CSS bloat:** Only generates classes actually used → tiny production bundle.
- **Consistency:** Design tokens (colors, spacing) enforced via config.
- **Dark mode:** Built-in `dark:` variant with class strategy.
- **Speed:** No context-switching between TSX and CSS files.
- **Responsive:** Mobile-first breakpoints right in the markup.

### Alternatives

| Alternative | Trade-off |
|------------|-----------|
| **CSS Modules** | Scoped styles, but more files and context-switching |
| **styled-components** | CSS-in-JS, but runtime overhead and bundle size |
| **SASS/SCSS** | Powerful nesting/mixins, but requires BEM/naming convention discipline |
| **Plain CSS** | No dependencies, but hard to maintain consistency at scale |

### When SASS makes sense (relevant to JD)
The JD mentions SASS experience. SASS is better when:
- You need complex mixins or functions.
- Working with an existing SASS codebase.
- The design system uses a BEM-style methodology.
- You want CSS separate from component files.

---

## 6. Client-Side Routing (React Router)

### What we chose
react-router-dom v7 with BrowserRouter.

### Why BrowserRouter over HashRouter
- **Clean URLs:** `/dashboard` instead of `/#/dashboard`.
- **Standard behavior:** Works like a real multi-page site.
- **SEO potential:** Search engines handle clean URLs better.

### GitHub Pages SPA Workaround
The 404.html → redirect hack is needed because GitHub Pages doesn't support SPA routing natively. A real server (Nginx, Vercel, Netlify) would handle this with a catch-all rule.

---

## 7. Consistent Error Envelope

### What we chose
Every API error follows the same structure:

```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "One or more fields have errors.",
  "field_errors": {"email": ["Enter a valid email address."]}
}
```

### Why
- **Frontend predictability:** One error parsing path, not many.
- **Error categorization:** `error_code` lets the frontend handle different errors differently.
- **User-friendly messages:** `message` is always safe to show to users.
- **Field-level detail:** `field_errors` enables per-input error display.

### How it's enforced
1. **Custom exception handler** (`exception_handler.py`) catches all DRF errors.
2. **View-level** error formatting for validation errors.
3. **Frontend** `QuoteApiError` class parses the envelope.

### Alternative: RFC 7807 Problem Details
An industry standard for error responses:

```json
{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more fields have errors.",
  "errors": [...]
}
```

Our approach is simpler but could evolve toward this standard.

---

## 8. Event-Driven Design (Interview Focus)

The JD specifically mentions **event-driven design**. While ProfitPanel doesn't implement it, here's how you'd discuss it:

### What is event-driven architecture?
Instead of direct function calls, components communicate by emitting and reacting to events.

### Where it applies at Svea Solar

```
User submits quote on website
    │
    ▼ (event: QuoteSubmitted)
    │
    ├── Lead Management: Create lead in CRM
    ├── Notification: Email confirmation to customer
    ├── Analytics: Track conversion
    └── Sales: Alert sales team
```

### Implementation options

| Technology | Use case |
|-----------|----------|
| **Django Signals** | Intra-app events (post_save, pre_delete) |
| **Celery + RabbitMQ/Redis** | Async background tasks |
| **AWS SNS/SQS** | Cloud-native event bus |
| **Kafka** | High-throughput event streaming |
| **Webhooks** | Notify external systems |

### How to add it to ProfitPanel

```python
# Django signal — fire after Quote is saved
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Quote)
def on_quote_created(sender, instance, created, **kwargs):
    if created:
        send_confirmation_email.delay(instance.email)  # Celery task
        notify_sales_team.delay(instance.id)            # Celery task
        track_analytics_event('quote_submitted', {'bill': str(instance.monthly_bill)})
```

### Key talking points for the interview
- **Loose coupling:** Services don't need to know about each other.
- **Scalability:** Event consumers can scale independently.
- **Resilience:** If email service is down, the quote still saves; email sends when service recovers.
- **Auditability:** Events create a natural log of everything that happened.

---

## 9. Scaling Considerations

### Current architecture limitations
- SQLite: Single-writer, files on disk.
- No caching: Every request hits the database.
- No pagination: `Quote.objects.all()` returns everything.
- No authentication: API is open.
- No rate limiting: Vulnerable to abuse.

### How to scale (talking points)

| Concern | Solution |
|---------|----------|
| **Database** | PostgreSQL + connection pooling (pg_bouncer) |
| **Caching** | Redis for frequently accessed data (quote lists) |
| **Pagination** | DRF's `PageNumberPagination` or cursor-based |
| **CDN** | CloudFront/Cloudflare for static assets |
| **Load balancing** | Nginx → multiple Gunicorn workers |
| **Background jobs** | Celery for email sending, report generation |
| **Search** | Elasticsearch or PostgreSQL full-text search |
| **Monitoring** | Sentry for errors, Prometheus + Grafana for metrics |

---

## 10. Questions They Might Ask & Suggested Answers

**Q: Why did you separate frontend and backend?**
> For independent deployment, team scalability, and a clear API contract. The website team at Svea Solar has dedicated frontend and backend roles, so this architecture lets them work in parallel.

**Q: Why Django over FastAPI?**
> Django's ecosystem is unmatched — admin panel, ORM, migrations, auth, and the vast DRF ecosystem. FastAPI is faster and async-native, but for a CMS-integrated website (like Svea Solar's), Django/Wagtail is the natural choice.

**Q: How would you handle real-time updates?**
> For the dashboard, polling or WebSockets via Django Channels. For event-driven notifications, Celery with a message broker (Redis/RabbitMQ).

**Q: What would you change in production?**
> PostgreSQL, environment-based settings (django-environ), proper SECRET_KEY management, authentication (JWT or session), pagination, rate limiting, Sentry for error tracking, and CI/CD with GitHub Actions.

**Q: How would you add authentication?**
> For API consumers: JWT tokens via djangorestframework-simplejwt. For Svea Solar's internal tools: SSO/SAML integration. For a public website: session-based auth with Django's built-in system.
