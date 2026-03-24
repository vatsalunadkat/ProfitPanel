# Interview Prep: Python & Django Deep Dive

> Advanced Python concepts, Django internals, and ORM patterns — interview-ready with ProfitPanel references.

---

## 1. Python Decorators

### What they are
A decorator wraps a function to add behavior without modifying the function itself.

```python
def log_calls(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"{func.__name__} returned {result}")
        return result
    return wrapper

@log_calls
def add(a, b):
    return a + b

add(1, 2)
# Calling add
# add returned 3
```

### `@log_calls` is equivalent to:
```python
add = log_calls(add)
```

### ProfitPanel decorators
```python
# drf-spectacular uses decorators for API documentation
@extend_schema_view(
    get=extend_schema(summary='List all quotes'),
    post=extend_schema(summary='Submit a new quote'),
)
class QuoteListCreateView(APIView):
    ...
```

### Built-in decorators
```python
class MyClass:
    @staticmethod       # No self — utility function
    def utility():
        pass

    @classmethod        # cls instead of self — factory methods
    def create(cls):
        return cls()

    @property           # Access like attribute, computed on read
    def full_name(self):
        return f"{self.first} {self.last}"
```

### Decorator with arguments
```python
def rate_limit(max_calls):
    def decorator(func):
        def wrapper(*args, **kwargs):
            # check rate limit
            return func(*args, **kwargs)
        return wrapper
    return decorator

@rate_limit(max_calls=100)
def api_endpoint():
    pass
```

---

## 2. Context Managers

### The problem
```python
# ✗ File might not close if exception occurs
f = open('file.txt')
data = f.read()
f.close()  # Never reached if f.read() raises
```

### The solution
```python
# ✓ Guaranteed cleanup
with open('file.txt') as f:
    data = f.read()
# f.close() is called automatically, even if exception occurs
```

### How they work
```python
class MyContextManager:
    def __enter__(self):
        print("Setup")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print("Cleanup")
        return False  # Don't suppress exceptions

with MyContextManager() as m:
    print("Inside")
# Output: Setup → Inside → Cleanup
```

### `contextlib` shortcut
```python
from contextlib import contextmanager

@contextmanager
def timer():
    start = time.time()
    yield  # Code inside "with" block runs here
    print(f"Elapsed: {time.time() - start:.2f}s")

with timer():
    heavy_computation()
```

### Django examples
```python
# Database transactions
from django.db import transaction

with transaction.atomic():
    quote.save()
    send_notification(quote)
    # If send_notification raises, quote.save() is rolled back
```

---

## 3. Generators and Iterators

### Generators
Functions that `yield` values one at a time instead of returning all at once.

```python
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

fib = fibonacci()
next(fib)  # 0
next(fib)  # 1
next(fib)  # 1
next(fib)  # 2
```

### Why generators?
- **Memory efficient:** Don't load all data into memory.
- **Lazy evaluation:** Compute values on demand.
- **Infinite sequences:** Can represent infinite data.

### Generator expressions
```python
# List comprehension — creates entire list in memory
squares = [x**2 for x in range(1_000_000)]  # 8MB

# Generator expression — creates one value at a time
squares = (x**2 for x in range(1_000_000))  # ~100 bytes
```

### Django ORM uses iterators
```python
# QuerySet is lazy — no DB query until iteration
quotes = Quote.objects.filter(monthly_bill__gt=100)  # No query yet
for q in quotes:  # Query executed here
    print(q.name)

# .iterator() for huge querysets — doesn't cache results
for q in Quote.objects.all().iterator():
    process(q)  # Each row fetched and discarded
```

---

## 4. List Comprehensions vs Map/Filter

```python
# List comprehension (Pythonic)
names = [q.name.upper() for q in quotes if q.monthly_bill > 100]

# Equivalent with map and filter
names = list(map(lambda q: q.name.upper(), filter(lambda q: q.monthly_bill > 100, quotes)))

# Dictionary comprehension
bill_map = {q.email: q.monthly_bill for q in quotes}

# Set comprehension
unique_names = {q.name for q in quotes}
```

**Rule:** Prefer comprehensions over `map`/`filter` in Python — they're more readable.

---

## 5. Django ORM Deep Dive

### QuerySet is lazy
```python
# None of these execute a query:
qs = Quote.objects.all()
qs = qs.filter(monthly_bill__gt=100)
qs = qs.order_by('-created_at')
qs = qs[:10]

# Query executes when you:
list(qs)           # Iterate
qs[0]              # Index
len(qs)            # Count
repr(qs)           # Print
bool(qs)           # Check truthiness
for q in qs: ...   # Loop
```

### The N+1 problem
```python
# ✗ N+1 queries — 1 for quotes, N for each author
for quote in Quote.objects.all():
    print(quote.author.name)  # Each .author triggers a DB query

# ✓ select_related (JOIN) — for ForeignKey/OneToOne
for quote in Quote.objects.select_related('author').all():
    print(quote.author.name)  # 1 query total

# ✓ prefetch_related (separate query + Python join) — for ManyToMany/reverse FK
for author in Author.objects.prefetch_related('quotes').all():
    print(author.quotes.count())  # 2 queries total
```

### Useful QuerySet methods
```python
# Aggregation
from django.db.models import Avg, Sum, Count, Max, Min

Quote.objects.aggregate(
    avg_bill=Avg('monthly_bill'),
    total_savings=Sum('estimated_savings'),
    count=Count('id'),
)

# Annotation (per-row computed field)
Author.objects.annotate(
    quote_count=Count('quotes')
).filter(quote_count__gt=5)

# F expressions (reference model fields in queries)
from django.db.models import F
Quote.objects.filter(estimated_savings__gt=F('monthly_bill') * 0.5)

# Q objects (complex queries with OR)
from django.db.models import Q
Quote.objects.filter(
    Q(name__icontains='solar') | Q(email__icontains='svea')
)

# Values and values_list
Quote.objects.values('name', 'email')           # List of dicts
Quote.objects.values_list('email', flat=True)    # Flat list of emails

# Exists (efficient boolean check)
Quote.objects.filter(email='test@test.com').exists()  # True/False, stops at first match

# Bulk operations
Quote.objects.bulk_create([Quote(...), Quote(...)])  # 1 query for N inserts
Quote.objects.filter(status='draft').update(status='active')  # 1 query for N updates
```

### ProfitPanel ORM patterns
```python
# models.py — field types with validators
class Quote(models.Model):
    monthly_bill = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]  # DB + form validation
    )
    created_at = models.DateTimeField(auto_now_add=True)  # Set once on creation

    class Meta:
        ordering = ['-created_at']  # Default query ordering
```

---

## 6. Django Middleware

### What it is
A hook that processes every request/response. Like a pipeline:

```
Request → Middleware1 → Middleware2 → ... → View → ... → Middleware2 → Middleware1 → Response
```

### ProfitPanel middleware order
```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # 1. CORS (must be first)
    'django.middleware.security.SecurityMiddleware',   # 2. HTTPS redirect, HSTS
    'django.contrib.sessions.middleware.SessionMiddleware',  # 3. Sessions
    'django.middleware.common.CommonMiddleware',       # 4. URL normalization
    'django.middleware.csrf.CsrfViewMiddleware',       # 5. CSRF protection
    'django.contrib.auth.middleware.AuthenticationMiddleware',  # 6. Auth
    'django.contrib.messages.middleware.MessageMiddleware',     # 7. Messages
    'django.middleware.clickjacking.XFrameOptionsMiddleware',   # 8. Clickjacking
]
```

**Why CorsMiddleware is first:**
If CORS headers aren't added to the preflight response, the browser blocks the request before any other middleware runs.

### Custom middleware
```python
class RequestTimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.time()
        response = self.get_response(request)
        duration = time.time() - start
        response['X-Request-Duration'] = f"{duration:.4f}s"
        return response
```

---

## 7. Django Signals

### What they are
Decoupled events that fire when certain actions happen:

```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Quote)
def notify_on_new_quote(sender, instance, created, **kwargs):
    if created:
        send_email(f"New quote from {instance.name}")
```

### Common signals
| Signal | Fires when |
|--------|-----------|
| `pre_save` / `post_save` | Before/after model save |
| `pre_delete` / `post_delete` | Before/after model delete |
| `m2m_changed` | ManyToMany relationship changes |
| `request_started` / `request_finished` | HTTP request lifecycle |

### Why ProfitPanel doesn't use signals
- Only one model, simple logic — signals add indirection.
- Signals make code harder to trace and debug.
- **Rule:** Use signals only for cross-app communication. For same-app logic, explicit function calls are clearer.

---

## 8. Django Migrations

### What they are
Version control for your database schema.

```bash
python manage.py makemigrations  # Detect model changes → create migration file
python manage.py migrate          # Apply migrations to database
python manage.py showmigrations   # See migration status
```

### ProfitPanel's migration
```python
# 0001_initial.py — creates the quotes_quote table
class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='Quote',
            fields=[
                ('id', models.BigAutoField(primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('email', models.EmailField(max_length=254)),
                # ...
            ],
        ),
    ]
```

### Migration commands
```bash
# Reverse a migration
python manage.py migrate quotes 0001  # Go back to migration 0001
python manage.py migrate quotes zero  # Undo all migrations for quotes app

# SQL preview
python manage.py sqlmigrate quotes 0001  # Show SQL without executing

# Squash migrations (combine many into one)
python manage.py squashmigrations quotes 0001 0010
```

---

## 9. Django REST Framework Internals

### Request lifecycle
```
HTTP Request
  → DRF Request (wraps Django's)
  → Authentication (who is the user?)
  → Permission check (can they access this?)
  → Throttle check (rate limiting)
  → Content negotiation (parse request body)
  → View logic (your code)
  → Serialization (Python → JSON)
  → Response rendering
```

### Serializer validation order
```python
class QuoteSerializer(serializers.ModelSerializer):
    # 1. Field-level validation (built-in + custom)
    def validate_email(self, value):
        if 'spam' in value:
            raise ValidationError('No spam')
        return value

    # 2. Object-level validation (cross-field)
    def validate(self, data):
        if data['monthly_bill'] > 10000:
            raise ValidationError('Bill seems too high')
        return data

# Validation order:
# 1. Field type validation (CharField max_length, EmailField format)
# 2. Field validators (MinValueValidator)
# 3. validate_<field> methods
# 4. validate() method
```

### ProfitPanel serializer
```python
class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = '__all__'
        read_only_fields = ['id', 'estimated_savings', 'created_at']
```

**`read_only_fields`:** Client can't set `id`, `estimated_savings`, or `created_at`. These are:
- `id`: Auto-generated by DB
- `estimated_savings`: Computed by server
- `created_at`: Auto-set by `auto_now_add=True`

---

## 10. Python Type Hints

```python
# Basic types
name: str = "Alice"
age: int = 30
active: bool = True
price: float = 9.99

# Collections
names: list[str] = ["Alice", "Bob"]
config: dict[str, int] = {"port": 8000}
unique: set[str] = {"a", "b"}
point: tuple[float, float] = (1.0, 2.0)

# Optional
from typing import Optional
user: Optional[str] = None  # Same as str | None (Python 3.10+)
user: str | None = None     # Python 3.10+ syntax

# Function signatures
def calculate_savings(bill: Decimal, rate: Decimal = Decimal('0.3')) -> Decimal:
    return round(bill * rate, 2)

# Type aliases
QuoteDict = dict[str, str | int | float]
```

**Python type hints are NOT enforced at runtime.** They're for:
- IDE autocomplete
- Static analysis (mypy)
- Documentation

---

## 11. Python Dunder (Magic) Methods

```python
class Quote:
    def __init__(self, name, bill):     # Constructor
        self.name = name
        self.bill = bill

    def __str__(self):                  # str(quote), print(quote)
        return f"Quote from {self.name}"

    def __repr__(self):                 # repr(quote), debugging
        return f"Quote(name={self.name!r}, bill={self.bill})"

    def __eq__(self, other):            # quote1 == quote2
        return self.name == other.name

    def __lt__(self, other):            # quote1 < quote2 (enables sorting)
        return self.bill < other.bill

    def __len__(self):                  # len(quote)
        return len(self.name)

    def __getitem__(self, key):         # quote['name']
        return getattr(self, key)
```

### ProfitPanel's `__str__`
```python
class Quote(models.Model):
    def __str__(self):
        return f'{self.name} – ${self.monthly_bill}/mo'
```
Used in Django admin and shell for readable representation.

---

## 12. Python `*args` and `**kwargs`

```python
def func(*args, **kwargs):
    print(args)    # Tuple of positional args
    print(kwargs)  # Dict of keyword args

func(1, 2, 3, name="Alice", age=30)
# args = (1, 2, 3)
# kwargs = {'name': 'Alice', 'age': 30}

# Unpacking
def greet(name, age):
    print(f"{name} is {age}")

data = {'name': 'Alice', 'age': 30}
greet(**data)  # Same as greet(name='Alice', age=30)

items = [1, 2, 3]
print(*items)  # Same as print(1, 2, 3)
```

---

## 13. Error Handling Patterns

### Python
```python
try:
    result = risky_operation()
except ValueError as e:
    handle_value_error(e)
except (TypeError, KeyError):
    handle_other()
except Exception as e:
    handle_anything(e)
else:
    # Runs only if no exception
    process(result)
finally:
    # Always runs
    cleanup()
```

### Custom exceptions
```python
class QuoteValidationError(Exception):
    def __init__(self, field, message):
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")
```

### ProfitPanel's error handling
```python
# exception_handler.py
def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)  # DRF's default
    if response is not None:
        if isinstance(response.data, dict) and not response.data.get('error_code'):
            response.data = {
                'error_code': 'validation_error',
                'message': 'Validation failed.',
                'field_errors': response.data,
            }
    return response
```

**Why custom?** DRF's default returns raw field errors `{"email": ["Enter a valid email."]}`. The custom handler wraps them in a consistent envelope `{"error_code": "...", "message": "...", "field_errors": {...}}`.

---

## 14. Interview Questions

**Q: Explain Django's request lifecycle.**
> "Request hits WSGI/ASGI server → middleware pipeline (in order) → URL resolution → view → serialization → middleware pipeline (reverse) → response. DRF adds authentication, permissions, throttling, and content negotiation between URL resolution and the view."

**Q: What is the N+1 problem and how do you solve it?**
> "When querying a list of objects and accessing a related object on each one, Django makes 1 query for the list plus N queries for each related object. Fix with `select_related` (SQL JOIN for FK/O2O) or `prefetch_related` (separate query + Python-side join for M2M/reverse FK)."

**Q: How do Django migrations work?**
> "Django compares the current model definitions against the last migration state to detect changes. `makemigrations` generates a Python file describing the change. `migrate` executes the SQL against the database. Migrations are version-controlled, allowing the team to share schema changes."

**Q: What's the difference between `select_related` and `prefetch_related`?**
> "`select_related` uses a SQL JOIN — one query, but only works for FK/OneToOne. `prefetch_related` does a separate query for the related objects and joins them in Python — works for ManyToMany and reverse ForeignKey."
