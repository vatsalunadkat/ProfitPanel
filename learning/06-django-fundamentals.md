# Lesson 6: Django Fundamentals

> Learn Django's core concepts through ProfitPanel's backend.

---

## 6.1 What Is Django?

Django is a Python web framework that follows the **"batteries included"** philosophy — it provides everything you need to build a web application: URL routing, database ORM, admin interface, authentication, and more.

**Key philosophy:** "Don't repeat yourself" (DRY).

---

## 6.2 Project Structure

```
backend/
├── manage.py              ← Command-line utility
├── db.sqlite3             ← SQLite database file
├── requirements.txt       ← Python dependencies
├── core/                  ← Project configuration (settings, URLs)
│   ├── __init__.py
│   ├── settings.py        ← All project settings
│   ├── urls.py            ← Root URL configuration
│   ├── wsgi.py            ← WSGI entry point (production)
│   ├── asgi.py            ← ASGI entry point (async)
│   └── exception_handler.py  ← Custom error handling
└── quotes/                ← App: our business logic
    ├── __init__.py
    ├── models.py           ← Database models
    ├── views.py            ← Request handlers
    ├── urls.py             ← App URL patterns
    ├── serializers.py      ← Data serialization (DRF)
    ├── admin.py            ← Admin interface registration
    ├── apps.py             ← App configuration
    ├── tests.py            ← Test suite
    └── migrations/         ← Database schema history
        ├── __init__.py
        └── 0001_initial.py
```

### Project vs App

| Concept | Example | Purpose |
|---------|---------|---------|
| **Project** | `core/` | Configuration, settings, root URLs |
| **App** | `quotes/` | A self-contained feature module |

A Django project can contain multiple apps. Each app handles one concern (quotes, users, payments, etc.).

---

## 6.3 `manage.py` — The Command Center

`manage.py` is the entry point for all Django management commands:

```bash
# Start the development server
python manage.py runserver

# Create database tables from models
python manage.py makemigrations
python manage.py migrate

# Create a superuser for the admin panel
python manage.py createsuperuser

# Open Django's interactive shell
python manage.py shell

# Run tests
python manage.py test
```

---

## 6.4 Settings — `core/settings.py`

This file configures everything about your Django project. Let's break down the key sections:

### Installed Apps

```python
INSTALLED_APPS = [
    'django.contrib.admin',        # Admin interface
    'django.contrib.auth',         # User authentication
    'django.contrib.contenttypes', # Content type framework
    'django.contrib.sessions',     # Session management
    'django.contrib.messages',     # Messaging framework
    'django.contrib.staticfiles',  # Static file serving
    'rest_framework',              # Django REST Framework
    'corsheaders',                 # CORS headers for the React frontend
    'drf_spectacular',             # Auto-generated API documentation
    'quotes',                      # Our quotes app
]
```

Every app must be registered here. Third-party packages (`rest_framework`, `corsheaders`) are installed via pip and registered like any other app.

### Middleware

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',           # Must be first — adds CORS headers
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

Middleware processes every request/response. Think of it as a pipeline:

```
Request  → CorsMiddleware → SecurityMiddleware → ... → View
Response ← CorsMiddleware ← SecurityMiddleware ← ... ← View
```

**Order matters!** CorsMiddleware must be first to add headers before other middleware can reject the request.

### Database

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

- **SQLite** is a file-based database — perfect for development. No server needed.
- `BASE_DIR / 'db.sqlite3'` uses Python's `pathlib` for cross-platform paths.
- For production, you'd switch to PostgreSQL or MySQL.

### CORS Configuration

```python
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^http://localhost:\d+$',
    r'^http://127\.0\.0\.1:\d+$',
]
```

Since the React frontend (port 5173) makes requests to Django (port 8000), the browser blocks them by default (CORS policy). This setting allows any localhost origin.

### BASE_DIR

```python
BASE_DIR = Path(__file__).resolve().parent.parent
```

`Path(__file__)` = the settings file itself. `.resolve()` = absolute path. `.parent.parent` = go up two directories (from `core/settings.py` → `backend/`).

---

## 6.5 Models — Defining the Database

Models are Python classes that define your database schema. Django's ORM (Object-Relational Mapper) translates them to SQL.

**From `quotes/models.py`:**

```python
from django.db import models
from django.core.validators import MinValueValidator


class Quote(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    address = models.TextField()
    monthly_bill = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    estimated_savings = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} — {self.email}"

    class Meta:
        ordering = ['-created_at']
```

### Field Types

| Field | Python Type | Database Column | Notes |
|-------|-----------|----------------|-------|
| `CharField(max_length=200)` | `str` | `VARCHAR(200)` | Short text with max length |
| `EmailField()` | `str` | `VARCHAR(254)` | Like CharField but validates email format |
| `TextField()` | `str` | `TEXT` | Unlimited text |
| `DecimalField(max_digits=10, decimal_places=2)` | `Decimal` | `DECIMAL(10,2)` | Precise money values |
| `DateTimeField(auto_now_add=True)` | `datetime` | `DATETIME` | Auto-set on creation |

### Validators

```python
validators=[MinValueValidator(0.01)]
```

Validators run during `serializer.is_valid()` or `model.full_clean()`. This ensures `monthly_bill` is at least 0.01.

### `__str__` — Human-readable representation

```python
def __str__(self):
    return f"{self.name} — {self.email}"
```

Used in the admin panel and shell. Without it, you'd see `Quote object (1)`.

### `class Meta`

```python
class Meta:
    ordering = ['-created_at']  # Default ordering: newest first
```

The `-` means descending. `Quote.objects.all()` will always return quotes newest first.

---

## 6.6 Migrations — Database Version Control

Migrations track changes to your models and apply them to the database:

```bash
# Step 1: Create migration files from model changes
python manage.py makemigrations

# Step 2: Apply migrations to the database
python manage.py migrate
```

**What happens:**

```
models.py change → makemigrations → 0001_initial.py → migrate → SQL executed
```

Our initial migration creates the `quotes_quote` table (naming convention: `{app}_{model}`).

**Never edit the database manually.** Always change models.py, then migrate.

---

## 6.7 URL Routing

Django uses a simple URL → view mapping.

### Root URLs (`core/urls.py`)

```python
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('quotes.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
```

| URL Pattern | What it does |
|-------------|-------------|
| `admin/` | Django admin panel |
| `api/` | Delegates to `quotes/urls.py` |
| `api/schema/` | OpenAPI schema (JSON) |
| `api/docs/` | Swagger interactive docs |
| `api/redoc/` | ReDoc API documentation |

### `include()` — Delegating URL patterns

`include('quotes.urls')` says: "For any URL starting with `api/`, strip that prefix and match against `quotes/urls.py`."

### App URLs (`quotes/urls.py`)

```python
from django.urls import path
from .views import QuoteListCreateView

urlpatterns = [
    path('quotes/', QuoteListCreateView.as_view(), name='quote-list-create'),
]
```

**Combined:** `api/` + `quotes/` = `api/quotes/` → `QuoteListCreateView`

### Named URLs

`name='quote-list-create'` lets you reference URLs by name:

```python
from django.urls import reverse
url = reverse('quote-list-create')  # Returns '/api/quotes/'
```

---

## 6.8 The Admin Panel

**From `quotes/admin.py`:**

```python
from django.contrib import admin
from .models import Quote

admin.site.register(Quote)
```

Just one line registers the `Quote` model in Django's admin interface. Access it at `http://localhost:8000/admin/`.

**To use admin:**

```bash
python manage.py createsuperuser
# Enter username, email, password
# Then visit /admin/ and log in
```

The admin panel lets you:
- View, create, edit, and delete Quote records.
- Search and filter data.
- See the `__str__` representation.

---

## 6.9 The ORM — Querying Data

Django's ORM lets you work with the database using Python instead of SQL:

```python
# Get all quotes (ordered by -created_at from Meta)
Quote.objects.all()

# Get one quote by primary key
Quote.objects.get(pk=1)

# Filter quotes
Quote.objects.filter(email='jane@example.com')
Quote.objects.filter(monthly_bill__gte=1000)   # Greater than or equal

# Create a quote
Quote.objects.create(
    name='Jane',
    email='jane@example.com',
    address='1 Solar Street',
    monthly_bill=1500,
    estimated_savings=450,
)

# Count
Quote.objects.count()

# Ordering
Quote.objects.order_by('name')          # A-Z
Quote.objects.order_by('-monthly_bill')  # Highest first
```

### Common query lookups

| Lookup | Example | SQL Equivalent |
|--------|---------|---------------|
| `exact` | `name='Jane'` | `WHERE name = 'Jane'` |
| `icontains` | `name__icontains='jan'` | `WHERE name ILIKE '%jan%'` |
| `gte` / `lte` | `monthly_bill__gte=1000` | `WHERE monthly_bill >= 1000` |
| `in` | `id__in=[1, 2, 3]` | `WHERE id IN (1, 2, 3)` |
| `isnull` | `email__isnull=True` | `WHERE email IS NULL` |

---

## 6.10 `requirements.txt` — Python Dependencies

```
Django==6.0.3
django-cors-headers==4.9.0
djangorestframework==3.17.0
drf-spectacular==0.29.0
```

**Key packages:**

| Package | Purpose |
|---------|---------|
| `Django` | The web framework |
| `djangorestframework` | REST API toolkit (next lesson) |
| `django-cors-headers` | Allow cross-origin requests from the React frontend |
| `drf-spectacular` | Auto-generate OpenAPI documentation |

**Install dependencies:**

```bash
pip install -r requirements.txt
```

---

## 6.11 The Request/Response Cycle

When a request hits `http://localhost:8000/api/quotes/`:

```
1. Browser sends HTTP request
   │
2. Django's URL resolver matches 'api/' → include('quotes.urls')
   │
3. 'quotes/' matches → QuoteListCreateView
   │
4. Middleware pipeline processes the request
   │
5. View method runs (get or post)
   │
6. View queries database via ORM
   │
7. View returns Response object
   │
8. Middleware pipeline processes the response
   │
9. CorsMiddleware adds Access-Control headers
   │
10. HTTP response sent to browser
```

---

## 6.12 WSGI and ASGI — Production Deployment

```python
# core/wsgi.py — Synchronous (traditional)
application = get_wsgi_application()

# core/asgi.py — Asynchronous (modern)
application = get_asgi_application()
```

- **WSGI** (Web Server Gateway Interface) — Traditional Python server interface. Use with gunicorn.
- **ASGI** (Asynchronous Server Gateway Interface) — Supports async views and WebSockets. Use with uvicorn/daphne.

For development, `python manage.py runserver` uses WSGI. For production, you'd run:

```bash
gunicorn core.wsgi:application --bind 0.0.0.0:8000
```

---

## Exercises

1. **Django shell:** Run `python manage.py shell` and create a Quote object using `Quote.objects.create(...)`. Then query it back.

2. **Admin customization:** In `admin.py`, replace `admin.site.register(Quote)` with a `QuoteAdmin` class that defines `list_display`, `search_fields`, and `list_filter`.

3. **Add a field:** Add a `phone` field to the Quote model. Run `makemigrations` and `migrate` to apply it.

4. **ORM practice:** In the Django shell, write queries to:
   - Find all quotes with `monthly_bill > 1000`.
   - Count total quotes.
   - Get the most recent quote.

5. **Explore the admin:** Create a superuser, log in to `/admin/`, and browse your Quote records.

---

**Next lesson:** [07 - Django REST Framework](07-django-rest-framework.md)
