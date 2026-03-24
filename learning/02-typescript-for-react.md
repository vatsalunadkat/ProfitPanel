# Lesson 2: TypeScript for React

> Learn TypeScript through the patterns used in ProfitPanel.

---

## 2.1 What Is TypeScript?

TypeScript is a superset of JavaScript that adds **static types**. Every valid JavaScript file is also valid TypeScript, but TypeScript lets you catch bugs at compile time instead of runtime.

**Why use it?**
- Catch errors before the code runs (typos, wrong argument types, missing properties).
- Better autocomplete and documentation in your editor.
- Makes refactoring large codebases safer.

---

## 2.2 Basic Types

```typescript
// Primitives
let name: string = 'Jane'
let bill: number = 1500
let isActive: boolean = true

// Arrays
let errors: string[] = ['Name is required.', 'Email is required.']
let ids: number[] = [1, 2, 3]

// Union types — a value can be one of several types
let status: 'idle' | 'loading' | 'success' | 'error' = 'idle'
```

**From our code — `LeadCaptureForm.tsx`:**

```tsx
type Status = 'idle' | 'loading' | 'success' | 'error'

const [status, setStatus] = useState<Status>('idle')
```

The `type` keyword creates a **type alias**. `Status` can only ever be one of those four strings — if you try `setStatus('done')`, TypeScript will show an error immediately.

---

## 2.3 Interfaces — Defining Object Shapes

An `interface` defines the shape of an object: what properties it has and their types.

**From `api/quotes.ts`:**

```typescript
export interface QuoteSubmission {
  name: string
  email: string
  address: string
  monthly_bill: number
}

export interface QuoteResponse {
  id: number
  name: string
  email: string
  address: string
  monthly_bill: string      // Note: string from the API, not number
  estimated_savings: string  // Decimal fields come as strings from Django
  created_at: string         // ISO date string
}
```

**Using them:**

```typescript
// TypeScript ensures you pass the right shape
await submitQuote({
  name: 'Jane',
  email: 'jane@example.com',
  address: '1 Solar Street',
  monthly_bill: 1500,
})

// If you forget a field:
await submitQuote({ name: 'Jane' })
// ERROR: Missing 'email', 'address', and 'monthly_bill'
```

### `interface` vs `type`

| Feature | `interface` | `type` |
|---------|-----------|--------|
| Object shapes | Yes | Yes |
| Union types | No | `type X = 'a' \| 'b'` |
| Extending | `extends` keyword | `&` intersection |
| Declaration merging | Yes (can add fields later) | No |
| **Convention** | Use for object shapes | Use for unions and computed types |

---

## 2.4 Typing Component Props

Every React component's props should be typed. There are several patterns:

### Pattern 1: Inline type annotation

```tsx
// From Layout.tsx
function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  ...
}
```

Good for simple components with 1-2 props.

### Pattern 2: Named interface

```tsx
// From SavingsCalculator.tsx
interface SavingsCalculatorProps {
  defaultBill?: number        // The ? means optional
  onBillChange: (bill: number) => void  // A callback function
}

export default function SavingsCalculator({ defaultBill = 0, onBillChange }: SavingsCalculatorProps) {
  ...
}
```

| Syntax | Meaning |
|--------|---------|
| `defaultBill?: number` | Optional prop — may be `undefined` |
| `defaultBill = 0` | Default value in destructuring — if undefined, use `0` |
| `(bill: number) => void` | Function that takes a number, returns nothing |

### Pattern 3: Interface with `initialBill`

```tsx
// From LeadCaptureForm.tsx
interface LeadCaptureFormProps {
  initialBill?: number
}

export default function LeadCaptureForm({ initialBill = 0 }: LeadCaptureFormProps) {
  ...
}
```

---

## 2.5 Generics — Making Things Reusable

Generics let you write code that works with _any_ type while staying type-safe.

### `useState` with generics

```tsx
// TypeScript infers string from the initial value:
const [name, setName] = useState('')  // useState<string>

// But sometimes you need to be explicit:
const [status, setStatus] = useState<Status>('idle')
const [errorMessages, setErrorMessages] = useState<string[]>([])
const [quotes, setQuotes] = useState<QuoteResponse[]>([])
```

**Why explicit generics?**
- `useState([])` → TypeScript infers `never[]` (can't add anything to it!).
- `useState<string[]>([])` → TypeScript knows it's an array of strings.
- `useState<Status>('idle')` → Without the generic, TypeScript just sees `string`.

### Mapped types in our code

```typescript
// From api/quotes.ts
export interface ApiError {
  error_code: string
  message: string
  field_errors?: Record<string, string[]>
}
```

`Record<string, string[]>` is a built-in generic type meaning "an object with string keys and string-array values":

```typescript
// This is valid for Record<string, string[]>:
{
  email: ['Enter a valid email address.'],
  name: ['This field is required.'],
}
```

---

## 2.6 Type Narrowing

TypeScript can narrow types based on runtime checks:

```tsx
// From LeadCaptureForm.tsx
} catch (err) {
  setStatus('error')
  if (err instanceof QuoteApiError) {
    // TypeScript KNOWS err is QuoteApiError here — has .friendlyMessages
    setErrorMessages(err.friendlyMessages)
  } else {
    // err could be anything else
    setErrorMessages(['An unexpected error occurred.'])
  }
}
```

### `instanceof` narrowing

```typescript
if (err instanceof QuoteApiError) {
  // err.errorCode is available here
  // err.friendlyMessages is available here
}
```

### Truthiness narrowing

```tsx
// From ThemeContext.tsx
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx  // TypeScript knows ctx is NOT null here
}
```

---

## 2.7 Classes in TypeScript

Our project has one class — a custom error:

```typescript
// From api/quotes.ts
export class QuoteApiError extends Error {
  errorCode: string
  friendlyMessages: string[]

  constructor(apiError: ApiError) {
    super(apiError.message)                  // Call parent constructor
    this.errorCode = apiError.error_code
    this.friendlyMessages = apiError.field_errors
      ? humanizeFieldErrors(apiError.field_errors)
      : [apiError.message]
  }
}
```

**Key features:**
- `extends Error` — Inherits from JavaScript's built-in Error class.
- `errorCode: string` — Property declaration with type.
- `constructor` — Called when you do `new QuoteApiError(...)`.
- `super()` — Calls the parent class constructor.

---

## 2.8 The Non-Null Assertion Operator (`!`)

```tsx
// From main.tsx
createRoot(document.getElementById('root')!)
```

`document.getElementById()` returns `HTMLElement | null`. The `!` tells TypeScript "I guarantee this won't be null." Use sparingly — if `root` doesn't exist, you'll get a runtime error.

**Safer alternative:**

```tsx
const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')
createRoot(root).render(<App />)
```

---

## 2.9 TypeScript Configuration

Our project uses `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",                    // Output modern JavaScript
    "lib": ["ES2023", "DOM", "DOM.Iterable"], // Available global types
    "module": "ESNext",                    // Use ES modules
    "jsx": "react-jsx",                    // Transform JSX automatically
    "strict": true,                        // Enable all strict checks
    "noUnusedLocals": true,                // Error on unused variables
    "noUnusedParameters": true,            // Error on unused function params
    "moduleResolution": "bundler",         // Resolve modules like Vite does
    "noEmit": true,                        // Don't emit JS files (Vite handles that)
  }
}
```

**Important flags explained:**

| Flag | What it does | Why we want it |
|------|-------------|----------------|
| `strict: true` | Enables all strict type-checking options | Catches the most bugs |
| `noEmit: true` | TypeScript only checks; Vite builds | Avoids duplicate output |
| `jsx: "react-jsx"` | Auto-imports React for JSX | No need for `import React from 'react'` |
| `moduleResolution: "bundler"` | Resolve imports like Vite/webpack | Allows `.tsx` imports |

---

## 2.10 Typing Event Handlers

React provides typed event objects:

```tsx
// Form event
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
}

// Change event on input
function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
  updateBill(parseFloat(e.target.value) || 0)
}

// Inline — TypeScript infers the type automatically
<input onChange={e => setName(e.target.value)} />
```

**Common React event types:**

| Type | Used for |
|------|---------|
| `React.FormEvent` | `<form onSubmit>` |
| `React.ChangeEvent<HTMLInputElement>` | `<input onChange>` |
| `React.MouseEvent<HTMLButtonElement>` | `<button onClick>` |
| `React.KeyboardEvent` | `onKeyDown`, `onKeyUp` |

---

## 2.11 Advanced: Discriminated Unions

Our `Status` type is a simple example, but discriminated unions can model complex states:

```typescript
// Current code:
type Status = 'idle' | 'loading' | 'success' | 'error'
const [status, setStatus] = useState<Status>('idle')
const [errorMessages, setErrorMessages] = useState<string[]>([])

// Advanced pattern — combine status and data:
type FormState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; messages: string[] }

// Now TypeScript ensures you only access `messages` when status is 'error':
if (state.status === 'error') {
  console.log(state.messages)  // OK
}
```

---

## Exercises

1. **Add a type:** Create an interface for the savings calculation result (monthly savings, annual savings, percentage). Use it in `SavingsCalculator.tsx`.

2. **Strict null check:** Remove the `!` from `document.getElementById('root')!` in `main.tsx` and handle the null case properly with an `if` check.

3. **Discriminated union:** Refactor `LeadCaptureForm` to use a discriminated union for form state instead of separate `status` and `errorMessages` state variables.

4. **Explore:** Run `npx tsc --noEmit` in the `frontend/` directory to see if there are any TypeScript errors. Fix any you find.

---

**Next lesson:** [03 - React Router & Navigation](03-react-router.md)
