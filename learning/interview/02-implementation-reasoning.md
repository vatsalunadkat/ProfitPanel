# Interview Prep: Implementation Choices & Reasoning

> Prepare to explain WHY specific code patterns were chosen, and demonstrate depth of thinking.

---

## 1. Custom Error Class (`QuoteApiError`)

### What we did

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

### Why
- **`instanceof` discrimination:** `catch (err) { if (err instanceof QuoteApiError) }` lets us handle API errors differently from network errors or JS bugs.
- **User-friendly messages:** Raw API messages ("Enter a valid email address.") are translated to friendlier text.
- **Single responsibility:** Error parsing logic is in the API layer, not in component code.

### The reasoning to articulate
> "I separated error handling into a custom class because components shouldn't need to know the format of API error responses. The class acts as an adapter between the API's error contract and the UI's needs. This also makes testing easier — I can test error parsing independently of components."

---

## 2. Dual Validation (Client + Server)

### What we did

```tsx
// Client-side (LeadCaptureForm.tsx)
function validate(): string[] {
  const errs: string[] = []
  if (!name.trim()) errs.push('Name is required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Email is not valid.')
  return errs
}

// Server-side (serializer + model validators)
serializer.is_valid()  // Django validates email, required fields, min values
```

### Why both?
| Layer | Purpose | Example |
|-------|---------|---------|
| **Client** | UX — instant feedback, no network delay | "Name is required" appears immediately |
| **Server** | Security — can't be bypassed | Malicious user sends `curl` directly to API |

### Key talking point
> "Client-side validation is for user experience, never for security. A user can disable JavaScript or call the API directly with curl. The server must always be the source of truth for validation."

---

## 3. Computed Fields (Server-Side Savings Calculation)

### What we did

```python
def post(self, request):
    serializer = QuoteSerializer(data=request.data)
    if serializer.is_valid():
        monthly_bill = serializer.validated_data['monthly_bill']
        estimated_savings = round(monthly_bill * Decimal('0.3'), 2)
        serializer.save(estimated_savings=estimated_savings)
```

### Why server-side, not client-side?
- **Single source of truth:** The calculation formula lives in one place.
- **Consistency:** All quotes use the same formula, regardless of frontend version.
- **Business logic isolation:** If the formula changes (e.g., from 30% to dynamic based on location), one backend change updates everything.
- **Data integrity:** `estimated_savings` is `read_only` in the serializer — clients can't forge it.

### Why `Decimal('0.3')` not `0.3`?
```python
# Float:  0.1 + 0.2 = 0.30000000000000004
# Decimal: Decimal('0.1') + Decimal('0.2') = Decimal('0.3')
```
For money calculations, floating-point rounding errors are unacceptable. `Decimal` provides exact arithmetic.

---

## 4. State Lifting Pattern (Calculator → Form)

### What we did

```tsx
// QuoteFormPage — parent owns the shared state
const [monthlyBill, setMonthlyBill] = useState(DEFAULT_BILL)

<SavingsCalculator onBillChange={setMonthlyBill} />
<LeadCaptureForm initialBill={monthlyBill} />
```

### Why not just use Context?
- **Scope:** Only two components need this data — Context would be overkill.
- **Explicitness:** Props make the data flow visible. Context hides it.
- **Performance:** Context changes re-render all consumers. Prop changes only re-render the receiving component.

### Rule of thumb
> "Use the simplest solution that works: local state → lifted state → Context → external state library. Don't reach for a bigger tool until you've outgrown the smaller one."

---

## 5. `useMemo` for Filtering and Sorting

### What we did

```tsx
const filtered = useMemo(() => {
  return quotes.filter(r => r.name.toLowerCase().includes(q))
}, [quotes, search])

const sorted = useMemo(() => {
  const copy = [...filtered]
  copy.sort(...)
  return copy
}, [filtered, sortKey, sortDir])
```

### Why `useMemo`?
- **Performance:** Filtering and sorting are O(n log n). Without `useMemo`, they'd run on every render (even for unrelated state changes like typing in the search box).
- **Derived state chain:** `sorted` depends on `filtered`, which depends on `quotes` + `search`. `useMemo` only recomputes when ancestors change.

### Why `[...filtered]` (spread)?
- `Array.sort()` mutates in place. Spreading creates a new array to avoid mutating the memoized `filtered` result.
- React relies on reference equality for change detection — mutating would break it.

### When NOT to use useMemo
- Simple computations (adding two numbers).
- State that changes on every render anyway.
- Premature optimization — benchmark first.

---

## 6. Controlled Components for Forms

### What we did
Every input is controlled — React owns the value:

```tsx
<input value={name} onChange={e => setName(e.target.value)} />
```

### Why not uncontrolled (`ref`)?
- **Validation:** Can validate on every keystroke.
- **Conditional logic:** Can enable/disable submit based on form state.
- **Synchronization:** Calculator bill syncs to form bill via state.
- **Testability:** State is inspectable, not hidden in DOM.

### When uncontrolled is okay
- File inputs (`<input type="file">`).
- Performance-critical forms with many fields (use react-hook-form).
- Integration with non-React libraries.

---

## 7. Dark Mode with CSS Class Strategy

### What we did

```tsx
// ThemeContext sets class on <html>
document.documentElement.classList.toggle('dark', theme === 'dark')

// Tailwind config
darkMode: 'class'

// Components use dark: prefix
className="bg-white dark:bg-gray-800"
```

### Why `class` strategy over `media` strategy?
| Strategy | How it works | User control |
|----------|-------------|-------------|
| `class` ✓ | Toggle `.dark` class | User can override system preference |
| `media` | `@media (prefers-color-scheme: dark)` | Follows system only, no toggle |

- **User preference:** The toggle lets users override their system preference.
- **Persistence:** `localStorage` remembers their choice across sessions.
- **Fallback:** If no stored preference, respects system setting.

---

## 8. API Layer Separation

### What we did

```
src/api/
├── config.ts    ← Base URL configuration
└── quotes.ts    ← API functions, types, and error handling
```

Components import functions, never call `fetch` directly:

```tsx
import { submitQuote, fetchQuotes } from '../api/quotes'
```

### Why
- **Single source of change:** Switch from `fetch` to `axios`? One file.
- **Type safety:** `QuoteSubmission` and `QuoteResponse` interfaces co-locate with the functions that use them.
- **Error handling:** Centralized — not duplicated across components.
- **Testing:** Mock the API module, not the global `fetch`.

### The reasoning to articulate
> "This follows the Dependency Inversion Principle — components depend on an abstraction (the API module), not on the implementation (fetch). If we need to add authentication headers, caching, or retry logic, we change one file without touching any components."

---

## 9. Error Humanization Pattern

### What we did

```typescript
const FRIENDLY_FIELD_MESSAGES: Record<string, Record<string, string>> = {
  email: {
    'Enter a valid email address.': 'Email is invalid.',
    'This field is required.': 'Email is required.',
  },
}
```

### Why a lookup map?
- **Maintainability:** Add/change messages without touching logic.
- **Fallback:** Unknown errors still display a formatted version.
- **Separation:** The API can change its error messages without breaking the UI (as long as we update the map).

### Why not just use the API messages directly?
- API messages are technical ("Enter a valid email address.").
- Users need contextual guidance ("Please enter your home address so we can assess your solar potential.").
- Different languages may need different friendly messages.

---

## 10. Skeleton Loading UI

### What we did

```tsx
if (loading) {
  return (
    <div>
      {[1, 2].map(i => (
        <div key={i} className="animate-pulse h-24 bg-white rounded-2xl border" />
      ))}
      {[1, 2, 3].map(i => (
        <div key={i} className="h-14 bg-white rounded-xl border" />
      ))}
    </div>
  )
}
```

### Why skeleton over spinner?
- **Perceived performance:** Skeletons show the page structure immediately — feels faster.
- **Layout stability:** No content shift when data loads (CLS = 0).
- **Modern UX:** Standard pattern used by GitHub, Facebook, YouTube.

---

## 11. OpenAPI Documentation with drf-spectacular

### What we did

```python
@extend_schema_view(
    get=extend_schema(summary='List all quotes', ...),
    post=extend_schema(summary='Submit a new quote', ..., examples=[...]),
)
```

### Why
- **Self-documenting API:** Frontend developers can read the docs without asking backend developers.
- **Contract testing:** The schema can be used to auto-generate TypeScript types.
- **Interactive testing:** Swagger UI lets you test endpoints without Postman.
- **Standardized:** OpenAPI is an industry standard — tools like Postman, Insomnia, and code generators support it.

---

## 12. Key Questions They Might Ask

**Q: Walk me through a feature you built and explain your implementation choices.**
> Use the quote submission flow: form validation (dual layer), API call (fetch with error handling), server computation (Decimal for precision), consistent error envelope, and success state.

**Q: How would you refactor this if requirements changed?**
> If the savings formula became dynamic (based on location, panel type, etc.), I'd create a dedicated `calculate_savings` service function, potentially behind an API endpoint so the calculator can show real-time estimates.

**Q: Why did you use X instead of Y?**
> Always frame as trade-offs: "X is simpler/more explicit/better for our scale. Y would be better if we needed Z." Never say one is objectively "better."

**Q: What would you change if you had more time?**
> Pagination, authentication, background jobs for expensive calculations, comprehensive test suite, CI/CD pipeline, error monitoring (Sentry).
