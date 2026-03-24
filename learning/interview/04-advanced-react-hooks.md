# Interview Prep: Advanced React Hooks

> Deep dive into every React hook, with ProfitPanel examples and interview-ready explanations.

---

## 1. `useState` — Local Component State

### Basics
```tsx
const [count, setCount] = useState(0)          // Primitive
const [user, setUser] = useState<User | null>(null)  // Object with type
const [items, setItems] = useState<string[]>([])      // Array
```

### Functional updates (when new state depends on previous state)
```tsx
// ✗ Might use stale state in async scenarios
setCount(count + 1)

// ✓ Always uses latest state
setCount(prev => prev + 1)
```

### Lazy initialization (expensive initial value)
```tsx
// ✗ Runs JSON.parse on EVERY render
const [data, setData] = useState(JSON.parse(localStorage.getItem('data')!))

// ✓ Runs JSON.parse only on FIRST render
const [data, setData] = useState(() => JSON.parse(localStorage.getItem('data')!))
```

### ProfitPanel usage
```tsx
// LeadCaptureForm.tsx — multiple state variables for form
const [name, setName] = useState('')
const [email, setEmail] = useState('')
const [address, setAddress] = useState('')
const [message, setMessage] = useState('')
const [monthlyBill, setMonthlyBill] = useState(initialBill)
const [errors, setErrors] = useState<string[]>([])
const [success, setSuccess] = useState(false)
const [submitting, setSubmitting] = useState(false)
```

### Interview insight
> "Each `useState` call is independent. React preserves state between renders based on the order of hook calls — this is why hooks can't be called conditionally."

---

## 2. `useEffect` — Side Effects

### Basic patterns

```tsx
// Runs after EVERY render
useEffect(() => {
  console.log('rendered')
})

// Runs only on MOUNT (empty deps)
useEffect(() => {
  fetchData()
}, [])

// Runs when `id` changes
useEffect(() => {
  fetchUser(id)
}, [id])

// Cleanup function (runs before next effect or unmount)
useEffect(() => {
  const ws = new WebSocket(url)
  return () => ws.close()  // Cleanup
}, [url])
```

### ProfitPanel usage

```tsx
// DashboardPage.tsx — fetch data on mount
useEffect(() => {
  let cancelled = false
  fetchQuotes()
    .then(data => { if (!cancelled) setQuotes(data) })
    .catch(err => { if (!cancelled) setError(err.message) })
    .finally(() => { if (!cancelled) setLoading(false) })
  return () => { cancelled = true }
}, [])
```

**Why the `cancelled` flag?**
- Prevents state updates on unmounted components.
- If the user navigates away before the fetch completes, the cleanup runs, setting `cancelled = true`.
- Without this: React warning "Can't perform a React state update on an unmounted component."

### Common mistakes

```tsx
// ✗ Missing dependency — stale closure
useEffect(() => {
  fetchData(userId)
}, [])  // Should include userId

// ✗ Object/array in deps — infinite loop
useEffect(() => {
  doSomething(options)
}, [options])  // New object every render → always different → infinite loop

// ✓ Fix: useMemo the object or destructure primitives
const { page, limit } = options
useEffect(() => {
  doSomething(page, limit)
}, [page, limit])
```

### Lifecycle mapping (class → hooks)
| Class lifecycle | Hook equivalent |
|----------------|----------------|
| `componentDidMount` | `useEffect(() => {}, [])` |
| `componentDidUpdate` | `useEffect(() => {}, [deps])` |
| `componentWillUnmount` | `useEffect(() => () => cleanup(), [])` |

---

## 3. `useContext` — Consuming Context

### How it works
```tsx
// 1. Create context with default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// 2. Provide value in a parent
<ThemeContext.Provider value={{ theme, toggleTheme }}>
  <App />
</ThemeContext.Provider>

// 3. Consume in any child
const { theme, toggleTheme } = useContext(ThemeContext)
```

### ProfitPanel usage

```tsx
// ThemeContext.tsx — custom hook wrapping useContext
export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

### Why the guard clause?
- Without it, `ctx` could be `undefined` if the component isn't wrapped in `ThemeProvider`.
- The error message tells the developer exactly what's wrong.
- TypeScript then knows the return type is `ThemeContextType` (not `ThemeContextType | undefined`).

### When to use Context vs props
| Use props when | Use Context when |
|---------------|-----------------|
| 1-2 levels deep | 3+ levels (prop drilling) |
| Few consumers | Many consumers |
| Data is component-specific | Data is app-wide (theme, auth, locale) |

### Performance caveat
**Every consumer re-renders when the context value changes.**

```tsx
// ✗ Creates new object every render → all consumers re-render
<ThemeContext.Provider value={{ theme, toggleTheme }}>

// ✓ Memoize the value
const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])
<ThemeContext.Provider value={value}>
```

---

## 4. `useMemo` — Memoize Computed Values

### What it does
Caches the result of an expensive computation. Only recomputes when dependencies change.

```tsx
const expensive = useMemo(() => {
  return items.filter(i => i.active).sort((a, b) => a.name.localeCompare(b.name))
}, [items])
```

### ProfitPanel usage

```tsx
// DashboardPage.tsx — filter + sort pipeline
const filtered = useMemo(() => {
  const q = search.toLowerCase()
  return quotes.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.email.toLowerCase().includes(q) ||
    r.address.toLowerCase().includes(q)
  )
}, [quotes, search])

const sorted = useMemo(() => {
  const copy = [...filtered]
  // ... sort logic
  return copy
}, [filtered, sortKey, sortDir])
```

### Why `[...filtered]` not `filtered.sort()`?
- `Array.sort()` mutates in place.
- Mutating a memoized value breaks React's assumptions.
- Spread creates a new array — safe to sort.

### When NOT to use useMemo
```tsx
// ✗ Trivial computation — memoization overhead > computation cost
const doubled = useMemo(() => count * 2, [count])

// ✓ Just compute it
const doubled = count * 2
```

**Rule of thumb:** Only memoize if:
1. The computation is O(n) or worse
2. The component re-renders frequently
3. You've measured a performance issue

---

## 5. `useCallback` — Memoize Functions

### What it does
Returns the same function reference between renders unless dependencies change.

```tsx
// Without useCallback — new function every render
const handleClick = () => doSomething(id)

// With useCallback — same function unless `id` changes
const handleClick = useCallback(() => doSomething(id), [id])
```

### When it matters
Only matters when:
1. Passing the function as a prop to a `React.memo` child.
2. The function is in a `useEffect` dependency array.

```tsx
// Child uses React.memo — only re-renders if props change
const ExpensiveChild = React.memo(({ onClick }) => { ... })

// Parent
const handleClick = useCallback(() => {
  console.log(id)
}, [id])

<ExpensiveChild onClick={handleClick} />
```

Without `useCallback`, `handleClick` is a new function on every render → `React.memo` is useless → `ExpensiveChild` re-renders every time.

### Relationship to useMemo
```tsx
// useCallback is syntactic sugar for useMemo returning a function
useCallback(fn, deps)
// is equivalent to
useMemo(() => fn, deps)
```

---

## 6. `useRef` — Mutable Reference

### Two use cases

**1. DOM access:**
```tsx
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  inputRef.current?.focus()  // Focus on mount
}, [])

<input ref={inputRef} />
```

**2. Mutable value that persists across renders (without triggering re-render):**
```tsx
const renderCount = useRef(0)
renderCount.current++  // This does NOT cause a re-render

const intervalId = useRef<number>()
useEffect(() => {
  intervalId.current = setInterval(tick, 1000)
  return () => clearInterval(intervalId.current)
}, [])
```

### `useRef` vs `useState`
| | `useState` | `useRef` |
|---|-----------|---------|
| Triggers re-render | Yes | No |
| Returns | `[value, setter]` | `{ current: value }` |
| Use for | UI data | DOM refs, timers, previous values |

---

## 7. `useReducer` — Complex State Logic

### When to use instead of useState
- Multiple related state values
- Next state depends on previous state
- Complex state transitions

```tsx
type State = { count: number; step: number }
type Action = 
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setStep'; payload: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + state.step }
    case 'decrement': return { ...state, count: state.count - state.step }
    case 'setStep':   return { ...state, step: action.payload }
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 })
dispatch({ type: 'increment' })
```

### When to use
| Use `useState` | Use `useReducer` |
|---------------|-----------------|
| 1-3 independent values | 4+ related values |
| Simple updates | Complex transitions |
| No shared logic | Logic shared between actions |

### ProfitPanel could use it for the form:
```tsx
// Instead of 8 separate useState calls in LeadCaptureForm:
type FormState = { name: string; email: string; ... errors: string[]; submitting: boolean }
type FormAction = 
  | { type: 'setField'; field: string; value: string }
  | { type: 'setErrors'; errors: string[] }
  | { type: 'submitStart' }
  | { type: 'submitSuccess' }
```

---

## 8. `useLayoutEffect` — Synchronous After DOM Update

### Difference from useEffect
```
Render → DOM update → useLayoutEffect (sync) → Browser paint → useEffect (async)
```

- `useEffect`: Runs **after** the browser paints. Non-blocking. Use 99% of the time.
- `useLayoutEffect`: Runs **before** the browser paints. Blocks paint. Use for measuring DOM.

### When to use
```tsx
// Measure an element's size before paint
useLayoutEffect(() => {
  const { width, height } = ref.current.getBoundingClientRect()
  setDimensions({ width, height })
}, [])
```

Use it when:
- You need to measure DOM elements.
- You need to synchronize scroll position.
- You see a "flash" with `useEffect` (layout shift before correction).

---

## 9. Custom Hooks — Extracting Reusable Logic

### Pattern
Any function starting with `use` that calls other hooks:

```tsx
// Custom hook for fetching data
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(url)
      .then(res => res.json())
      .then(data => { if (!cancelled) setData(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [url])

  return { data, loading, error }
}

// Usage
const { data: quotes, loading, error } = useFetch<QuoteResponse[]>('/api/quotes/')
```

### ProfitPanel example: `useTheme`
```tsx
export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

### Rules of custom hooks
1. Name must start with `use`.
2. Can call other hooks.
3. Each component using the hook gets its own state (state is not shared).
4. Follow the Rules of Hooks (no conditional calls).

---

## 10. Rules of Hooks

1. **Only call hooks at the top level** — not inside loops, conditions, or nested functions.
2. **Only call hooks from React functions** — components or custom hooks.

```tsx
// ✗ WRONG — conditional hook
if (isLoggedIn) {
  const [user, setUser] = useState(null)  // Breaks hook order
}

// ✓ RIGHT — unconditional hook, conditional logic inside
const [user, setUser] = useState(null)
useEffect(() => {
  if (isLoggedIn) fetchUser().then(setUser)
}, [isLoggedIn])
```

**Why?** React identifies hooks by their **call order**. If a hook is conditionally skipped, all subsequent hooks shift position, causing state corruption.

---

## 11. React 19 Features (Interview Bonus)

ProfitPanel uses React 19.2. Key new features:

### `use()` hook
```tsx
// Can be called conditionally (unlike other hooks)
function UserProfile({ userPromise }) {
  const user = use(userPromise)  // Suspends until resolved
  return <div>{user.name}</div>
}
```

### Server Components
- Components that run on the server, sending HTML to the client.
- Not used in ProfitPanel (client-side SPA), but good to mention.

### Actions
```tsx
// Form actions — submit without manual event handling
<form action={submitAction}>
  <input name="email" />
  <button type="submit">Submit</button>
</form>
```

### `useOptimistic`
```tsx
const [optimisticItems, addOptimistic] = useOptimistic(items, (state, newItem) => [
  ...state,
  { ...newItem, pending: true },
])
```

---

## 12. Hook Cheat Sheet for Interviews

| Hook | Purpose | Re-renders? | ProfitPanel? |
|------|---------|------------|-------------|
| `useState` | Local state | Yes | ✓ Everywhere |
| `useEffect` | Side effects (fetch, timers) | No | ✓ DashboardPage, ThemeContext |
| `useContext` | Access context value | Yes (on value change) | ✓ ThemeContext |
| `useMemo` | Cache computed values | No | ✓ DashboardPage filtering |
| `useCallback` | Cache functions | No | ✗ Not used |
| `useRef` | DOM refs, mutable values | No | ✗ Not used |
| `useReducer` | Complex state machine | Yes | ✗ Not used |
| `useLayoutEffect` | Sync DOM measurements | No | ✗ Not used |
