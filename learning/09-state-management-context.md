# Lesson 9: State Management & React Context

> Learn how ProfitPanel manages application state with Context API and hooks.

---

## 9.1 Types of State

Not all state is equal. Understanding the categories helps you choose the right tool:

| Type | Example in ProfitPanel | Where it lives | Tool |
|------|----------------------|----------------|------|
| **Local/UI state** | Form inputs, loading flag | Inside the component | `useState` |
| **Shared state** | Monthly bill (calculator ↔ form) | Nearest common parent | `useState` + props |
| **Global state** | Theme (light/dark) | Entire app | React Context |
| **Server state** | List of quotes | Backend database | `fetch` + `useState` |

---

## 9.2 Local State with `useState`

The simplest form — state that only one component needs:

```tsx
// DashboardPage.tsx
const [search, setSearch] = useState('')
const [sortKey, setSortKey] = useState<SortKey>('created_at')
const [sortDir, setSortDir] = useState<SortDir>('desc')
```

These only matter to the DashboardPage. No other component needs to know the search query or sort order.

---

## 9.3 Shared State — Lifting State Up

When two sibling components need the same data, move the state to their common parent:

```tsx
// QuoteFormPage.tsx — parent owns the shared state
export default function QuoteFormPage() {
  const [monthlyBill, setMonthlyBill] = useState(DEFAULT_BILL)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SavingsCalculator
        defaultBill={DEFAULT_BILL}
        onBillChange={setMonthlyBill}     // Child 1 updates state
      />
      <LeadCaptureForm
        initialBill={monthlyBill}          // Child 2 reads state
      />
    </div>
  )
}
```

**The data flow:**

```
QuoteFormPage
├── State: monthlyBill = 500
│
├── SavingsCalculator
│   ├── Receives: defaultBill=500, onBillChange=setMonthlyBill
│   └── User moves slider → onBillChange(1200)
│       → QuoteFormPage re-renders with monthlyBill=1200
│
└── LeadCaptureForm
    ├── Receives: initialBill=1200
    └── useEffect syncs local bill state
```

### The Callback Pattern

```tsx
// Parent passes a setter function as a prop:
<SavingsCalculator onBillChange={setMonthlyBill} />

// Child calls it when the value changes:
function updateBill(value: number) {
  setBill(value)         // Update local state (for the slider)
  onBillChange(value)    // Notify parent (for the form)
}
```

**Rule:** State flows down (via props). Events flow up (via callbacks).

---

## 9.4 React Context — Global State

When state needs to be accessed by many components at different levels, "prop drilling" (passing through many layers) becomes painful:

```
App → Layout → Nav → ThemeToggle  (needs theme)
App → Layout → Main → Dashboard   (needs theme)
App → Layout → Main → Form        (needs theme)
```

Without Context, you'd pass `theme` through Layout, Nav, Main, etc. even though those components don't use it. Context solves this.

### Building the ThemeContext — Step by Step

**From `frontend/src/context/ThemeContext.tsx`:**

#### Step 1: Define the types

```tsx
type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}
```

The context will provide two things: the current theme and a function to toggle it.

#### Step 2: Create the context

```tsx
const ThemeContext = createContext<ThemeContextValue | null>(null)
```

`createContext(null)` creates a context with no default value. We use `null` and check for it later — this catches the error of using the context outside its provider.

#### Step 3: Initialize from localStorage/system preferences

```tsx
function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
```

**Priority:**
1. User's explicit choice (stored in `localStorage`).
2. System preference (`prefers-color-scheme` media query).
3. Default: `'light'`.

#### Step 4: Create the Provider component

```tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')  // Toggle <html class="dark">
    localStorage.setItem('theme', theme)             // Persist choice
  }, [theme])

  function toggleTheme() {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

**Key points:**
- `ThemeProvider` is a regular component that wraps its children.
- `ThemeContext.Provider` makes the `value` available to all descendants.
- The `useEffect` syncs theme changes to the DOM and localStorage.
- `useState<Theme>(getInitialTheme)` — passing a function to useState means it runs once (lazy initialization).

#### Step 5: Create a custom hook for consumers

```tsx
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

**Why a custom hook?**
1. **Safety:** Throws a clear error if used outside the provider.
2. **Convenience:** `useTheme()` is cleaner than `useContext(ThemeContext)`.
3. **TypeScript:** The return type is `ThemeContextValue` (not `ThemeContextValue | null`).

---

## 9.5 Using the Context

### Wrapping the app (App.tsx)

```tsx
export default function App() {
  return (
    <ThemeProvider>                          {/* Provides context to everything below */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>...</Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
```

### Consuming in a component (ThemeToggle.tsx)

```tsx
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      {/* Toggle switch UI */}
    </button>
  )
}
```

That's it. `ThemeToggle` doesn't need any props — it reads directly from the context.

---

## 9.6 Context vs Props — When to Use Which

| Scenario | Use Props | Use Context |
|----------|----------|-------------|
| Parent → direct child | Yes | No |
| Parent → grandchild (1-2 levels) | Yes | Maybe |
| Used by many components at different depths | No | Yes |
| Rarely changes | Either | Context |
| Changes frequently (e.g., mouse position) | Props | Avoid (causes many re-renders) |

---

## 9.7 Server State Management

ProfitPanel manages server state with basic `useState` + `useEffect` + `fetch`:

```tsx
// DashboardPage.tsx
const [quotes, setQuotes] = useState<QuoteResponse[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

function loadQuotes() {
  setLoading(true)
  setError('')
  fetchQuotes()
    .then(setQuotes)
    .catch(() => setError('Unable to load quotes.'))
    .finally(() => setLoading(false))
}

useEffect(() => { loadQuotes() }, [])
```

This works well for simple apps. For complex apps, libraries like **TanStack Query** (React Query) handle:
- Caching and deduplication.
- Background refetching.
- Optimistic updates.
- Retry logic.
- Loading/error states automatically.

---

## 9.8 Derived State with `useMemo`

Sometimes you don't need new state — you need state **computed from** existing state:

```tsx
// DashboardPage.tsx — filtering and sorting
const filtered = useMemo(() => {
  const q = search.toLowerCase().trim()
  if (!q) return quotes
  return quotes.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.email.toLowerCase().includes(q) ||
    r.address.toLowerCase().includes(q)
  )
}, [quotes, search])

const sorted = useMemo(() => {
  const copy = [...filtered]
  copy.sort((a, b) => {
    // ... sorting logic
  })
  return copy
}, [filtered, sortKey, sortDir])

const totalSavings = quotes.reduce((sum, q) => sum + parseFloat(q.estimated_savings), 0)
```

**State hierarchy:**

```
quotes (from API)
  └── filtered (derived: quotes + search)
       └── sorted (derived: filtered + sortKey + sortDir)

totalSavings (derived: quotes)
```

**Rule:** Don't store what can be computed. Only store the "source of truth" (quotes, search, sortKey, sortDir).

---

## 9.9 State Update Patterns

### Functional updates

When the new state depends on the previous state, use the function form:

```tsx
// From ThemeContext.tsx
setTheme(prev => (prev === 'light' ? 'dark' : 'light'))

// From DashboardPage.tsx
setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
```

**Why not `setTheme(theme === 'light' ? 'dark' : 'light')`?**
In rare cases, `theme` might be stale (closures). The function form guarantees you're working with the latest value.

### Batch updates

React batches multiple state updates into a single re-render:

```tsx
// These cause ONE re-render, not three:
setStatus('error')
setErrorMessages(err.friendlyMessages)
// (The component re-renders once with both updates)
```

### Resetting multiple state values

```tsx
// After successful submission:
setStatus('success')
setName('')
setEmail('')
setAddress('')
setBill(0)
// All reset in one render
```

---

## 9.10 Advanced: Custom Hook Pattern

You can extract stateful logic into reusable hooks:

```tsx
// Example: Extract the quotes loading logic
function useQuotes() {
  const [quotes, setQuotes] = useState<QuoteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadQuotes() {
    setLoading(true)
    setError('')
    fetchQuotes()
      .then(setQuotes)
      .catch(() => setError('Unable to load quotes.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadQuotes() }, [])

  return { quotes, loading, error, refresh: loadQuotes }
}

// Usage in component:
function DashboardPage() {
  const { quotes, loading, error, refresh } = useQuotes()
  // ... much cleaner component
}
```

**Benefits:**
- Reusable across components.
- Testable in isolation.
- Separates data logic from UI logic.

---

## 9.11 Advanced: Reducer Pattern for Complex State

When a component has many related state variables, `useReducer` can help:

```tsx
// Current approach (many useState calls):
const [status, setStatus] = useState<Status>('idle')
const [errorMessages, setErrorMessages] = useState<string[]>([])
const [name, setName] = useState('')
const [email, setEmail] = useState('')

// Reducer approach:
type FormAction =
  | { type: 'SET_FIELD'; field: string; value: string }
  | { type: 'SUBMIT' }
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; messages: string[] }
  | { type: 'RESET' }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.field]: action.value }
    case 'SUBMIT': return { ...state, status: 'loading', errors: [] }
    case 'SUCCESS': return { status: 'success', name: '', email: '', errors: [] }
    case 'ERROR': return { ...state, status: 'error', errors: action.messages }
    case 'RESET': return initialState
  }
}

const [state, dispatch] = useReducer(formReducer, initialState)

// dispatch({ type: 'SET_FIELD', field: 'name', value: 'Jane' })
// dispatch({ type: 'SUBMIT' })
// dispatch({ type: 'SUCCESS' })
```

This pattern is powerful for forms with complex state transitions.

---

## Exercises

1. **New context:** Create a `NotificationContext` that provides `addNotification(message)` and `notifications` list. Show a toast when a quote is submitted.

2. **Custom hook:** Extract the search + sort logic from `DashboardPage` into a custom `useSortedFilter` hook.

3. **useReducer:** Refactor `LeadCaptureForm` to use `useReducer` for state management instead of multiple `useState` calls.

4. **Persist to localStorage:** Extend the DashboardPage to remember the last search term and sort order in localStorage.

5. **Global quotes context:** Create a `QuotesContext` that provides quotes data to both the dashboard and form, so submitting a quote immediately appears on the dashboard without a manual refresh.

---

**Next lesson:** [10 - Full-Stack Architecture & Patterns](10-fullstack-architecture.md)
