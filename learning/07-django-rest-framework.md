# Lesson 7: Django REST Framework (DRF)

> Learn how to build REST APIs using DRF as implemented in ProfitPanel.

---

## 7.1 What Is Django REST Framework?

Django REST Framework (DRF) extends Django to make building REST APIs straightforward. It provides:
- **Serializers** — Convert between Python objects and JSON.
- **API Views** — Handle HTTP methods (GET, POST, PUT, DELETE).
- **Browsable API** — A web interface for testing your API.
- **Authentication & permissions** — Built-in security.
- **Throttling, pagination, filtering** — Production-ready features.

---

## 7.2 REST API Basics

REST (Representational State Transfer) uses HTTP methods to perform operations:

| HTTP Method | URL | Action | Our Implementation |
|-------------|-----|--------|-------------------|
| `GET` | `/api/quotes/` | List all quotes | `QuoteListCreateView.get()` |
| `POST` | `/api/quotes/` | Create a new quote | `QuoteListCreateView.post()` |
| `GET` | `/api/quotes/42/` | Get single quote | Not implemented yet |
| `PUT` | `/api/quotes/42/` | Update a quote | Not implemented yet |
| `DELETE` | `/api/quotes/42/` | Delete a quote | Not implemented yet |

---

## 7.3 Serializers — The Bridge Between Python and JSON

Serializers convert Django model instances to JSON and validate incoming data.

**From `quotes/serializers.py`:**

```python
from rest_framework import serializers
from .models import Quote


class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = ['id', 'name', 'email', 'address', 'monthly_bill',
                  'estimated_savings', 'created_at']
        read_only_fields = ['id', 'estimated_savings', 'created_at']
```

### How it works

**Serialization (Python → JSON):**

```python
quote = Quote.objects.first()
serializer = QuoteSerializer(quote)
serializer.data
# {
#   "id": 1,
#   "name": "Jane Smith",
#   "email": "jane@example.com",
#   "address": "1 Solar Street",
#   "monthly_bill": "1500.00",
#   "estimated_savings": "450.00",
#   "created_at": "2026-03-24T10:00:00Z"
# }
```

**Deserialization (JSON → Python):**

```python
data = {"name": "Jane", "email": "jane@example.com", "address": "...", "monthly_bill": 1500}
serializer = QuoteSerializer(data=data)
serializer.is_valid()  # True
serializer.validated_data
# {'name': 'Jane', 'email': 'jane@example.com', 'address': '...', 'monthly_bill': Decimal('1500')}
```

### `ModelSerializer` vs `Serializer`

`ModelSerializer` automatically generates fields from the model. Without it:

```python
# You'd have to write this manually:
class QuoteSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    address = serializers.CharField()
    monthly_bill = serializers.DecimalField(max_digits=10, decimal_places=2)
    estimated_savings = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
```

`ModelSerializer` generates all this from the model definition automatically.

### `fields` and `read_only_fields`

```python
fields = ['id', 'name', 'email', 'address', 'monthly_bill',
          'estimated_savings', 'created_at']
```

Only these fields are included in the API (never expose everything blindly).

```python
read_only_fields = ['id', 'estimated_savings', 'created_at']
```

These fields are included in responses but **ignored** in requests. Clients can't set `id`, `estimated_savings`, or `created_at` — they're computed server-side.

---

## 7.4 API Views — Handling Requests

DRF provides several levels of abstraction for writing views:

### Level 1: `APIView` (what we use)

The most explicit approach — you write each HTTP method handler:

```python
# From quotes/views.py
from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Quote
from .serializers import QuoteSerializer


class QuoteListCreateView(APIView):

    def get(self, request):
        """Return all quotes, newest first."""
        quotes = Quote.objects.all()
        serializer = QuoteSerializer(quotes, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Accept a new quote, calculate savings, and save."""
        serializer = QuoteSerializer(data=request.data)
        if serializer.is_valid():
            monthly_bill = serializer.validated_data['monthly_bill']
            estimated_savings = round(monthly_bill * Decimal('0.3'), 2)
            serializer.save(estimated_savings=estimated_savings)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(
            {
                'error_code': 'VALIDATION_ERROR',
                'message': 'One or more fields have errors.',
                'field_errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
```

### The `get` method — step by step

```python
def get(self, request):
    # 1. Query all quotes from the database
    quotes = Quote.objects.all()

    # 2. Serialize the queryset (many=True for a list)
    serializer = QuoteSerializer(quotes, many=True)

    # 3. Return JSON response
    return Response(serializer.data)
```

### The `post` method — step by step

```python
def post(self, request):
    # 1. Pass incoming JSON data to the serializer
    serializer = QuoteSerializer(data=request.data)

    # 2. Validate the data (checks types, required fields, validators)
    if serializer.is_valid():

        # 3. Business logic: calculate estimated savings
        monthly_bill = serializer.validated_data['monthly_bill']
        estimated_savings = round(monthly_bill * Decimal('0.3'), 2)

        # 4. Save to database, passing the computed field
        serializer.save(estimated_savings=estimated_savings)

        # 5. Return the created object with 201 status
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # 6. If validation fails, return errors with 400 status
    return Response({...}, status=status.HTTP_400_BAD_REQUEST)
```

### `serializer.save()` — What happens

`serializer.save(estimated_savings=estimated_savings)`:
1. Takes `validated_data` (name, email, address, monthly_bill).
2. Adds `estimated_savings` from the keyword argument.
3. Calls `Quote.objects.create(**data)`.
4. Returns the created `Quote` instance.

### Level 2: Generic Views (alternative)

DRF has shortcuts that reduce boilerplate:

```python
from rest_framework.generics import ListCreateAPIView

class QuoteListCreateView(ListCreateAPIView):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer

    def perform_create(self, serializer):
        monthly_bill = serializer.validated_data['monthly_bill']
        estimated_savings = round(monthly_bill * Decimal('0.3'), 2)
        serializer.save(estimated_savings=estimated_savings)
```

This does the same thing with less code, but our `APIView` approach gives more control over the error response format.

### Level 3: ViewSets (most concise)

```python
from rest_framework.viewsets import ModelViewSet

class QuoteViewSet(ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
```

This auto-generates list, create, retrieve, update, and delete — but we chose `APIView` for explicit control.

---

## 7.5 DRF Configuration

**From `core/settings.py`:**

```python
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'core.exception_handler.custom_exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

| Setting | Purpose |
|---------|---------|
| `EXCEPTION_HANDLER` | Custom error format for all API errors |
| `DEFAULT_SCHEMA_CLASS` | Use drf-spectacular for auto-generated API docs |

---

## 7.6 Custom Exception Handler

**From `core/exception_handler.py`:**

```python
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """Wrap all DRF errors in a consistent {error_code, message} envelope."""
    response = exception_handler(exc, context)

    if response is None:
        return Response(
            {'error_code': 'SERVER_ERROR', 'message': 'An unexpected error occurred.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if response.status_code == 400 and isinstance(response.data, dict):
        if 'detail' in response.data and 'parse' in str(response.data['detail']).lower():
            response.data = {
                'error_code': 'INVALID_JSON',
                'message': 'The request body is not valid JSON.',
            }
            return response

    if response.status_code == 405:
        response.data = {
            'error_code': 'METHOD_NOT_ALLOWED',
            'message': f'The {context["request"].method} method is not allowed.',
        }

    if response.status_code == 404:
        response.data = {
            'error_code': 'NOT_FOUND',
            'message': 'The requested resource was not found.',
        }

    return response
```

**Why custom error handling?**

DRF's default errors look different per scenario. Our handler ensures a **consistent error envelope**:

```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "One or more fields have errors.",
  "field_errors": {
    "email": ["Enter a valid email address."]
  }
}
```

The React frontend knows exactly what format to expect ← this is crucial for good API design.

---

## 7.7 API Documentation with drf-spectacular

**From `core/settings.py`:**

```python
SPECTACULAR_SETTINGS = {
    'TITLE': 'Svea Solar Quote API',
    'DESCRIPTION': 'REST API for the ProfitPanel solar quote platform.',
    'VERSION': '1.0.0',
    'TAGS': [
        {'name': 'Quotes', 'description': 'Create and list solar quote requests'},
    ],
}
```

**From `core/urls.py`:**

```python
path('api/schema/', SpectacularAPIView.as_view(), name='schema'),       # OpenAPI JSON
path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema')),   # Swagger UI
path('api/redoc/', SpectacularRedocView.as_view(url_name='schema')),    # ReDoc
```

Visit `http://localhost:8000/api/docs/` to see interactive API documentation!

### Schema Decoration

```python
@extend_schema_view(
    get=extend_schema(
        summary='List all quotes',
        description='Returns every quote stored in the database.',
        tags=['Quotes'],
        responses={200: QuoteSerializer(many=True)},
    ),
    post=extend_schema(
        summary='Submit a new quote',
        tags=['Quotes'],
        request=QuoteSerializer,
        responses={
            201: QuoteSerializer,
            400: _ValidationErrorSerializer,
        },
        examples=[
            OpenApiExample('Valid request', value={...}, request_only=True),
            OpenApiExample('Validation error', value={...}, response_only=True),
        ],
    ),
)
class QuoteListCreateView(APIView):
    ...
```

`@extend_schema_view` decorates the class and maps each HTTP method to its documentation. This generates accurate, example-rich API docs automatically.

---

## 7.8 HTTP Status Codes

DRF provides named constants for HTTP status codes:

```python
from rest_framework import status

status.HTTP_200_OK              # Default for Response()
status.HTTP_201_CREATED         # Resource created
status.HTTP_400_BAD_REQUEST     # Client sent invalid data
status.HTTP_404_NOT_FOUND       # Resource doesn't exist
status.HTTP_405_METHOD_NOT_ALLOWED  # Wrong HTTP method
status.HTTP_500_INTERNAL_SERVER_ERROR  # Server bug
```

**Our usage:**

```python
# Success: 201 Created
return Response(serializer.data, status=status.HTTP_201_CREATED)

# Validation error: 400 Bad Request
return Response({...}, status=status.HTTP_400_BAD_REQUEST)
```

---

## 7.9 Request and Response Objects

DRF wraps Django's native objects:

### `request.data`

```python
def post(self, request):
    # request.data contains the parsed JSON body:
    # {'name': 'Jane', 'email': '...', 'address': '...', 'monthly_bill': 1500}
    serializer = QuoteSerializer(data=request.data)
```

`request.data` handles JSON, form data, and multipart — you don't need to parse manually.

### `Response(data, status=...)`

```python
return Response(serializer.data, status=status.HTTP_201_CREATED)
```

`Response` automatically serializes the data to JSON and sets the correct `Content-Type` header.

---

## 7.10 Validation Deep Dive

When `serializer.is_valid()` is called, three levels of validation run:

### Level 1: Field-level validation (automatic)

Based on model field types and constraints:
- `CharField(max_length=200)` → rejects strings > 200 characters.
- `EmailField()` → validates email format.
- `DecimalField(max_digits=10)` → validates number format.
- `MinValueValidator(0.01)` → rejects values ≤ 0.

### Level 2: Custom field validation

You can add within the serializer:

```python
class QuoteSerializer(serializers.ModelSerializer):
    def validate_email(self, value):
        if value.endswith('@spam.com'):
            raise serializers.ValidationError('Disposable emails not allowed.')
        return value
```

### Level 3: Object-level validation

Validate across multiple fields:

```python
class QuoteSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        if attrs.get('monthly_bill', 0) > 50000:
            raise serializers.ValidationError('Bill seems unusually high.')
        return attrs
```

### Validation error format

```python
serializer.errors
# {
#   'email': ['Enter a valid email address.'],
#   'monthly_bill': ['A valid number is required.']
# }
```

This is what we return in the `field_errors` key of our error envelope.

---

## 7.11 The Browsable API

DRF includes a **web-based API explorer** for free. Visit `http://localhost:8000/api/quotes/` in a browser and you'll see:
- A rendered HTML page (not raw JSON).
- A form to POST new quotes directly.
- Formatted JSON response.

This is incredibly useful for development and debugging.

---

## Exercises

1. **Test with curl:** Run the server and try:
   ```bash
   curl http://localhost:8000/api/quotes/
   curl -X POST http://localhost:8000/api/quotes/ -H "Content-Type: application/json" -d '{"name":"Jane","email":"jane@example.com","address":"Stockholm","monthly_bill":1500}'
   ```

2. **Add validation:** Add a custom `validate_email` method to `QuoteSerializer` that rejects emails from `test.com`.

3. **Browsable API:** Visit `http://localhost:8000/api/quotes/` in a browser and submit a quote using the built-in form.

4. **Swagger docs:** Visit `http://localhost:8000/api/docs/` and explore the auto-generated API documentation. Try making requests from Swagger UI.

5. **Add a detail endpoint:** Create a new view and URL pattern for `GET /api/quotes/<id>/` that returns a single quote by its ID.

6. **Generic views refactor:** Rewrite `QuoteListCreateView` using `ListCreateAPIView` and `perform_create`. Compare the code length.

---

**Next lesson:** [08 - Frontend-Backend API Integration](08-api-integration.md)
