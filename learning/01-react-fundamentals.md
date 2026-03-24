# Lesson 1: React Fundamentals

> Learn React from the ground up using ProfitPanel's actual code.

---

## 1.1 What Is React?

React is a JavaScript library for building user interfaces using **components** — small, self-contained pieces of UI that you compose together like building blocks.

**Key ideas:**
- **Declarative:** You describe _what_ the UI should look like, not _how_ to update it.
- **Component-based:** Each piece of UI is a function that returns JSX.
- **Unidirectional data flow:** Data flows from parent to child via props.

---

## 1.2 The Entry Point — `main.tsx`

Every React app starts by mounting components into the DOM. Here's ours:

```tsx
// frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Line-by-line breakdown:**

| Line | What it does |
|------|-------------|
| `createRoot(document.getElementById('root')!)` | Finds the `<div id="root">` in `index.html` and creates a React root. The `!` is a TypeScript non-null assertion. |
| `<StrictMode>` | A development-only wrapper that warns about unsafe patterns (double-renders components to catch side effects). Has zero production overhead. |
| `<App />` | Renders our top-level component. |

**Try it yourself:** Open `frontend/index.html` and find the `<div id="root"></div>`. That's where the entire React app lives.

---

## 1.3 JSX — HTML Inside JavaScript

JSX lets you write markup directly in your JavaScript/TypeScript files. It looks like HTML but compiles to `React.createElement()` calls.

**From our `QuoteFormPage.tsx`:**

```tsx
<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
  See how much you could save
</h1>
```

**Key JSX differences from HTML:**

| HTML | JSX | Why? |
|------|-----|------|
| `class=` | `className=` | `class` is a reserved word in JavaScript |
| `for=` | `htmlFor=` | `for` is a reserved word in JavaScript |
| `onclick=` | `onClick=` | Events use camelCase |
| `<br>` | `<br />` | All tags must be closed |
| `style="color: red"` | `style={{ color: 'red' }}` | Style takes an object, not a string |

**Embedding expressions** — anything in `{}` is evaluated as JavaScript:

```tsx
// From Layout.tsx
<span>&copy; {new Date().getFullYear()} Svea Solar</span>
```

This renders the current year dynamically.

---

## 1.4 Components — Functions That Return UI

In React, a component is just a function that returns JSX. By convention, component names start with an uppercase letter.

### Simple component (no props)

```tsx
// frontend/src/components/Layout.tsx
export default function Layout() {
  return (
    <div className="h-screen bg-svea-bg dark:bg-gray-900 flex flex-col overflow-auto">
      <nav>...</nav>
      <main>
        <Outlet />
      </main>
      <footer>...</footer>
    </div>
  )
}
```

### Component with props

Props are the inputs to a component, passed as attributes in JSX:

```tsx
// frontend/src/components/Layout.tsx
function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) =>
      `text-sm font-medium px-1 py-1 border-b-2 transition-colors ${
        isActive
          ? 'border-svea-green text-gray-900 dark:text-white'
          : 'border-transparent text-gray-500 dark:text-gray-400'
      }`
    }>
      {children}
    </NavLink>
  )
}
```

**Key concepts here:**
- **Destructuring:** `{ to, children }` pulls values out of the props object.
- **`children`:** A special prop — whatever you put between `<NavItem>...</NavItem>` tags.
- **TypeScript typing:** `{ to: string; children: React.ReactNode }` defines the prop types inline.

**Usage:**

```tsx
<NavItem to="/">Get a Quote</NavItem>
<NavItem to="/dashboard">Dashboard</NavItem>
```

---

## 1.5 The `useState` Hook — Making Components Interactive

`useState` lets components remember values between renders.

**Syntax:** `const [value, setValue] = useState(initialValue)`

**From `LeadCaptureForm.tsx`:**

```tsx
const [name, setName] = useState('')
const [email, setEmail] = useState('')
const [address, setAddress] = useState('')
const [bill, setBill] = useState(initialBill)
const [status, setStatus] = useState<Status>('idle')
const [errorMessages, setErrorMessages] = useState<string[]>([])
```

**How it works:**
1. `useState('')` — Initialize with an empty string.
2. `name` — The current value.
3. `setName` — A function to update the value and trigger a re-render.
4. `useState<Status>('idle')` — TypeScript generic specifies the type explicitly (useful for union types).
5. `useState<string[]>([])` — Initialize as an empty array of strings.

**Updating state:**

```tsx
<input
  value={name}
  onChange={e => setName(e.target.value)}
/>
```

When the user types, `onChange` fires → `setName` updates the state → React re-renders the component → the input shows the new value. This is called **controlled input**.

---

## 1.6 The `useEffect` Hook — Side Effects

`useEffect` runs code _after_ the component renders. It's used for data fetching, subscriptions, DOM manipulation, etc.

**From `DashboardPage.tsx`:**

```tsx
useEffect(() => {
  loadQuotes()
}, [])
```

**The dependency array `[]`:**

| Dependency array | When it runs |
|-----------------|-------------|
| `[]` (empty) | Once, after the first render (like "on mount") |
| `[search]` | After every render where `search` changed |
| No array at all | After _every_ render (usually a bug) |

**From `LeadCaptureForm.tsx` — syncing props to state:**

```tsx
useEffect(() => {
  setBill(initialBill)
}, [initialBill])
```

Whenever the parent passes a new `initialBill`, this effect updates the local `bill` state.

---

## 1.7 The `useMemo` Hook — Expensive Computations

`useMemo` caches a computed value so it only recalculates when its dependencies change.

**From `DashboardPage.tsx`:**

```tsx
const filtered = useMemo(() => {
  const q = search.toLowerCase().trim()
  if (!q) return quotes
  return quotes.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.email.toLowerCase().includes(q) ||
    r.address.toLowerCase().includes(q)
  )
}, [quotes, search])
```

**Why use `useMemo` here?**
- Filtering/sorting arrays on every render is wasteful.
- `useMemo` re-runs the function only when `quotes` or `search` change.
- For small lists it's optional; for large datasets it's essential.

---

## 1.8 Conditional Rendering

React doesn't have `if` blocks in JSX. Instead, use JavaScript expressions:

### Ternary operator

```tsx
// From LeadCaptureForm.tsx
{status === 'loading' ? (
  <span className="inline-flex items-center gap-2 justify-center">
    <svg className="animate-spin w-4 h-4">...</svg>
    Sending...
  </span>
) : (
  'Get my quote'
)}
```

### Logical AND (`&&`)

```tsx
// From DashboardPage.tsx — only render if there are errors
{errorMessages.length > 0 && (
  <div className="text-xs text-red-600" role="alert">
    ...
  </div>
)}
```

### Early return

```tsx
// From LeadCaptureForm.tsx — entire component changes after success
if (status === 'success') {
  return (
    <div className="text-center">
      <h3>Quote request sent!</h3>
      ...
    </div>
  )
}
// otherwise, render the form...
```

---

## 1.9 Rendering Lists

Use `.map()` to turn an array into JSX elements. Always provide a unique `key`.

```tsx
// From DashboardPage.tsx
<tbody>
  {sorted.map(quote => (
    <tr key={quote.id}>
      <td>{quote.name}</td>
      <td>{quote.email}</td>
      <td>{quote.address}</td>
      ...
    </tr>
  ))}
</tbody>
```

**Why `key`?** React uses keys to efficiently update the DOM. Use a unique, stable identifier (like `id` from the database), NOT the array index.

---

## 1.10 Handling Events

Events in React use camelCase and pass a function (not a string):

```tsx
// Form submission — from LeadCaptureForm.tsx
<form onSubmit={handleSubmit} noValidate>

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()  // Prevent full page reload
  // ... validation and API call
}
```

```tsx
// Click handler — from DashboardPage.tsx
<button onClick={loadQuotes}>Refresh</button>
```

```tsx
// Inline handler with event object
<input onChange={e => setSearch(e.target.value)} />
```

---

## 1.11 Component Composition — Props and Children

The `QuoteFormPage` shows how components compose together, passing data through props:

```tsx
// frontend/src/pages/QuoteFormPage.tsx
export default function QuoteFormPage() {
  const [monthlyBill, setMonthlyBill] = useState(DEFAULT_BILL)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SavingsCalculator defaultBill={DEFAULT_BILL} onBillChange={setMonthlyBill} />
      <LeadCaptureForm initialBill={monthlyBill} />
    </div>
  )
}
```

**Data flow diagram:**

```
QuoteFormPage (owns monthlyBill state)
├── SavingsCalculator (receives defaultBill, calls onBillChange)
│   └── User moves slider → calls onBillChange(newValue)
│       → QuoteFormPage updates monthlyBill state
└── LeadCaptureForm (receives initialBill)
    └── Sees updated bill value via useEffect
```

This is **"lifting state up"**: the shared `monthlyBill` lives in the parent, and children communicate through callbacks.

---

## Exercises

1. **Add a new field:** Add a "phone number" field to `LeadCaptureForm`. You'll need a new `useState`, a new `<input>`, and to include it in the `submitQuote` call.

2. **Conditional rendering:** In `SavingsCalculator`, show a message like "Great savings!" when annual savings exceed 10,000 kr.

3. **New page:** Create a simple "About" page component and add it to the router in `App.tsx` (you'll learn routing in a later lesson).

4. **Key experiment:** In `DashboardPage`, change `key={quote.id}` to `key={Math.random()}` and observe what happens in DevTools. Then change it back.

---

**Next lesson:** [02 - TypeScript for React](02-typescript-for-react.md)
