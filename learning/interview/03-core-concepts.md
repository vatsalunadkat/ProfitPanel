# Interview Prep: Core Programming Concepts

> Fundamental concepts that come up in every fullstack interview. Covers Python, JavaScript/TypeScript, and cross-language comparisons.

---

## 1. `None` vs `null` vs `undefined`

### Python: `None`
```python
x = None          # Explicit "no value"
type(None)         # <class 'NoneType'>
x is None          # ✓ Always use `is`, not ==
```
- `None` is a **singleton** — there's only one `None` object in memory.
- Use `is None` / `is not None`, never `== None` (because `==` can be overridden by `__eq__`).

### JavaScript: `null` and `undefined`
```javascript
let a;              // undefined — declared but never assigned
let b = null;       // null — explicitly "no value"
let c = undefined;  // explicitly set to undefined (legal but discouraged)
```

| | `null` | `undefined` |
|---|--------|-------------|
| **Meaning** | Intentional empty value | Variable exists but has no value |
| **typeof** | `"object"` (historical bug) | `"undefined"` |
| **JSON** | `null` is valid JSON | `undefined` is omitted from JSON |
| **== comparison** | `null == undefined` → `true` | `undefined == null` → `true` |
| **=== comparison** | `null === undefined` → `false` | `undefined === null` → `false` |

### TypeScript
```typescript
let x: string | null = null       // Explicit null
let y: string | undefined         // Defaults to undefined
let z?: string                    // Optional — same as string | undefined
```
- TypeScript's `strictNullChecks` flag (enabled in ProfitPanel) forces you to handle `null`/`undefined` explicitly.

### Cross-language comparison
| Language | "No value" | How to check |
|----------|-----------|-------------|
| **Python** | `None` | `x is None` |
| **JavaScript** | `null` or `undefined` | `x == null` (catches both) or strict `x === null` |
| **TypeScript** | `null` or `undefined` | `x == null` or narrowing with `if (x)` |
| **Java** | `null` | `x == null` |
| **SQL** | `NULL` | `IS NULL` (never `= NULL`) |

---

## 2. `=` vs `==` vs `===`

### JavaScript / TypeScript

| Operator | Name | Type Coercion | Example |
|----------|------|--------------|---------|
| `=` | Assignment | N/A | `x = 5` |
| `==` | Loose equality | YES | `"5" == 5` → `true` |
| `===` | Strict equality | NO | `"5" === 5` → `false` |

**Coercion traps with `==`:**
```javascript
0 == ""         // true  (both coerce to 0)
0 == "0"        // true
"" == "0"       // false (string comparison)
false == "0"    // true  (both coerce to 0)
null == undefined // true
NaN == NaN      // false (NaN is never equal to anything)
```

**Rule: Always use `===` in JavaScript/TypeScript.**
The only exception: `x == null` is idiomatic for checking `null` OR `undefined`.

### Python
```python
# = is assignment
x = 5

# == checks value equality (can be overridden by __eq__)
[1, 2] == [1, 2]  # True (same content)

# is checks identity (same object in memory)
[1, 2] is [1, 2]  # False (different objects)

# But:
a = None
a is None          # True (None is a singleton)
```

**Rule: Use `==` for value comparison, `is` for identity (mainly `None`, `True`, `False`).**

---

## 3. `async` / `await`

### The Problem
```javascript
// Without async: callback hell
fetch('/api/quotes')
  .then(res => res.json())
  .then(data => {
    fetch('/api/other/' + data.id)
      .then(res => res.json())
      .then(other => console.log(other))
  })
```

### JavaScript / TypeScript

```typescript
// With async/await — reads like synchronous code
async function loadData() {
  const res = await fetch('/api/quotes')
  const data = await res.json()
  const other = await fetch(`/api/other/${data.id}`)
  return other.json()
}
```

**Key concepts:**
- `async` marks a function as returning a `Promise`.
- `await` pauses execution until the `Promise` resolves.
- Under the hood, it's still non-blocking — the event loop handles other work while waiting.
- `await` can only be used inside `async` functions.

**Error handling:**
```typescript
try {
  const data = await fetchQuotes()
} catch (err) {
  if (err instanceof QuoteApiError) {
    // API returned an error response
  } else {
    // Network failure or bug
  }
}
```

**Parallel execution:**
```typescript
// Sequential — slow (waits for each)
const a = await fetchA()
const b = await fetchB()

// Parallel — fast (runs simultaneously)
const [a, b] = await Promise.all([fetchA(), fetchB()])
```

### Python

```python
import asyncio

async def fetch_data():
    result = await some_async_operation()
    return result

# Run async code
asyncio.run(fetch_data())

# Parallel
results = await asyncio.gather(fetch_a(), fetch_b())
```

**Django note:** Django is synchronous by default. Django 4.1+ added async views:
```python
async def my_view(request):
    data = await sync_to_async(MyModel.objects.all)()
    return JsonResponse(data)
```
But most Django code (ORM, middleware) is still synchronous. ProfitPanel uses synchronous views, which is the standard approach.

### Event Loop (JavaScript)

```
┌──────────────────────────────┐
│         Call Stack            │  ← Runs synchronous code
├──────────────────────────────┤
│         Event Loop            │  ← Checks: "Is the stack empty?"
├──────────────────────────────┤
│   Microtask Queue (Promises) │  ← Processed first
├──────────────────────────────┤
│   Macrotask Queue (setTimeout│  ← Processed second
│   setInterval, I/O)          │
└──────────────────────────────┘
```

1. Synchronous code runs to completion on the call stack.
2. `await` yields control back to the event loop.
3. When the Promise resolves, the continuation is added to the microtask queue.
4. The event loop picks it up when the call stack is empty.

---

## 4. Truthy and Falsy Values

### JavaScript
**Falsy values** (only 8):
```javascript
false, 0, -0, 0n, "", null, undefined, NaN
```
**Everything else is truthy**, including:
```javascript
"0"       // truthy (non-empty string)
[]        // truthy (empty array)
{}        // truthy (empty object)
"false"   // truthy (non-empty string)
```

### Python
**Falsy values:**
```python
False, None, 0, 0.0, 0j, "", [], (), {}, set(), range(0)
```

### Common Interview Gotcha
```javascript
if ([]) console.log("runs!")           // ✓ Runs! [] is truthy
if ([].length) console.log("nope")     // ✗ [].length is 0 → falsy

if ("0") console.log("runs!")          // ✓ Runs! "0" is truthy
if (0) console.log("nope")            // ✗ 0 is falsy
```

---

## 5. `let` vs `const` vs `var`

| Feature | `var` | `let` | `const` |
|---------|-------|-------|---------|
| **Scope** | Function | Block `{}` | Block `{}` |
| **Hoisting** | Hoisted + initialized to `undefined` | Hoisted but NOT initialized (TDZ) | Hoisted but NOT initialized (TDZ) |
| **Re-declaration** | ✓ Allowed | ✗ Error | ✗ Error |
| **Re-assignment** | ✓ Allowed | ✓ Allowed | ✗ Error |
| **Use in 2025** | ✗ Never | When value changes | ✓ Default choice |

**TDZ = Temporal Dead Zone:** The variable exists but can't be accessed until its declaration.

```javascript
console.log(a)  // undefined (var is hoisted)
var a = 1

console.log(b)  // ReferenceError (TDZ)
let b = 2
```

**`const` doesn't mean immutable:**
```javascript
const arr = [1, 2, 3]
arr.push(4)      // ✓ Allowed — mutating the array
arr = [5, 6]     // ✗ Error — reassigning the variable
```

**ProfitPanel convention:** Uses `const` everywhere (functions, components, state). Only `let` when reassignment is needed (loop variables, accumulated values).

---

## 6. Pass by Value vs Pass by Reference

### JavaScript
- **Primitives** (number, string, boolean, null, undefined, symbol, bigint): **pass by value**.
- **Objects** (arrays, objects, functions): **pass by reference** (technically pass by sharing — the reference is copied).

```javascript
// Primitives — copy
let a = 5
let b = a
b = 10
console.log(a)  // 5 — unchanged

// Objects — shared reference
let arr1 = [1, 2, 3]
let arr2 = arr1
arr2.push(4)
console.log(arr1)  // [1, 2, 3, 4] — also changed!

// To copy an object:
let arr3 = [...arr1]        // shallow copy
let obj2 = { ...obj1 }      // shallow copy
let deep = structuredClone(obj1) // deep copy (ES2022)
```

### Python
Python is **pass by object reference** (all variables are references):
```python
# Mutable objects — behave like "pass by reference"
a = [1, 2, 3]
b = a
b.append(4)
print(a)  # [1, 2, 3, 4]

# Immutable objects — behave like "pass by value"
x = 5
y = x
y = 10
print(x)  # 5
```

### React relevance
```tsx
// React uses reference equality for re-render checks
const [items, setItems] = useState([1, 2, 3])

// ✗ WRONG — mutates existing array, React won't re-render
items.push(4)
setItems(items)

// ✓ RIGHT — creates new array, React detects the change
setItems([...items, 4])
```

This is why ProfitPanel's `DashboardPage` uses `[...filtered].sort()` instead of `filtered.sort()`.

---

## 7. Closures

### What is a closure?
A function that **remembers the variables from its outer scope** even after the outer function has returned.

```javascript
function createCounter() {
  let count = 0                    // Enclosed variable
  return function() {
    count++                        // Accesses outer scope
    return count
  }
}

const counter = createCounter()
counter()  // 1
counter()  // 2
counter()  // 3
```

### Closures in React
Every React component render creates a closure:
```tsx
function Counter() {
  const [count, setCount] = useState(0)

  function handleClick() {
    // This closure captures the `count` from THIS render
    setTimeout(() => {
      console.log(count) // Logs the value at time of click, not current
    }, 3000)
  }
}
```

### Stale closure trap (interview classic)
```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000)
}
// Prints: 3, 3, 3 (var is function-scoped, closure captures same `i`)

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000)
}
// Prints: 0, 1, 2 (let is block-scoped, each iteration has its own `i`)
```

---

## 8. `this` keyword (JavaScript)

| Context | `this` refers to |
|---------|-----------------|
| Global scope | `window` (browser) / `global` (Node) |
| Object method | The object |
| Constructor (`new`) | The new instance |
| Arrow function | Inherited from enclosing scope |
| `call`/`apply`/`bind` | Explicitly set |
| Event handler | The element (DOM) |

```javascript
const obj = {
  name: 'Svea',
  greet() { return this.name },        // 'Svea'
  greetArrow: () => this.name,          // undefined (arrow inherits outer `this`)
}
```

**React relevance:** This is why React uses arrow functions for event handlers:
```tsx
// Arrow function — `this` is always the component scope (not relevant in functional components)
const handleClick = () => { /* ... */ }
```
In functional components (like ProfitPanel), `this` is rarely used.

---

## 9. Prototypes and Inheritance

### JavaScript (Prototypal)
```javascript
// Every object has a hidden [[Prototype]] link
const animal = { speak() { return 'sound' } }
const dog = Object.create(animal)
dog.speak()  // 'sound' — found via prototype chain

// Modern class syntax (sugar over prototypes)
class Animal {
  speak() { return 'sound' }
}
class Dog extends Animal {
  speak() { return 'woof' }
}
```

### Python (Classical)
```python
class Animal:
    def speak(self):
        return 'sound'

class Dog(Animal):
    def speak(self):
        return 'woof'

# Python supports multiple inheritance
class GuideDog(Dog, ServiceAnimal):
    pass
```

### Key difference
- **JavaScript:** Prototype chain — objects inherit from other objects.
- **Python:** Class hierarchy — instances inherit from classes (which inherit from other classes).

---

## 10. Type Coercion (JavaScript)

```javascript
// String concatenation wins
"5" + 3      // "53" (3 coerced to string)
"5" + true   // "5true"

// Arithmetic operators convert to number
"5" - 3      // 2
"5" * 2      // 10
true + 1     // 2

// Comparison
"5" > 3      // true (string coerced to number)
"abc" > "abd" // false (lexicographic)
```

**Why TypeScript helps:**
```typescript
// TypeScript catches this at compile time
const result: number = "5" + 3  // Error: Type 'string' is not assignable to type 'number'
```

---

## 11. Immutability

### Why immutability matters in React
React uses **shallow reference equality** to detect changes:
```tsx
const [user, setUser] = useState({ name: 'Alice', age: 30 })

// ✗ WRONG — same reference, React won't re-render
user.age = 31
setUser(user)

// ✓ RIGHT — new object, React detects change
setUser({ ...user, age: 31 })

// ✓ Nested update
setUser({ ...user, address: { ...user.address, city: 'Stockholm' } })
```

### Python immutability
```python
# Immutable: int, float, str, tuple, frozenset
# Mutable: list, dict, set

# Tuple vs List
t = (1, 2, 3)  # Immutable
l = [1, 2, 3]  # Mutable

# Frozen set
s = frozenset({1, 2, 3})  # Immutable set (can be used as dict key)
```

---

## 12. HTTP Methods and REST

| Method | Action | Idempotent | Safe | Body |
|--------|--------|-----------|------|------|
| `GET` | Read | ✓ | ✓ | No |
| `POST` | Create | ✗ | ✗ | Yes |
| `PUT` | Replace | ✓ | ✗ | Yes |
| `PATCH` | Partial update | ✗* | ✗ | Yes |
| `DELETE` | Remove | ✓ | ✗ | Optional |

**ProfitPanel uses:**
- `GET /api/quotes/` — list all quotes
- `POST /api/quotes/` — create a new quote

**Idempotent:** Making the same request multiple times has the same effect. `GET` always returns the same data. `POST` creates a new resource each time.

---

## 13. Status Codes

| Range | Category | Examples |
|-------|----------|---------|
| **2xx** | Success | 200 OK, 201 Created, 204 No Content |
| **3xx** | Redirect | 301 Moved, 304 Not Modified |
| **4xx** | Client error | 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found |
| **5xx** | Server error | 500 Internal, 502 Bad Gateway, 503 Unavailable |

**ProfitPanel returns:**
- `200` for `GET /api/quotes/`
- `201` for successful `POST /api/quotes/`
- `400` for validation errors (custom error envelope)

---

## 14. Quick-Fire Answers

**What is hoisting?**
> Variable and function declarations are moved to the top of their scope during compilation. `var` is initialized to `undefined`; `let`/`const` are hoisted but not initialized (TDZ).

**What is the event loop?**
> JavaScript's mechanism for handling async operations. It processes the call stack, then microtasks (Promises), then macrotasks (setTimeout, I/O).

**What is a Promise?**
> An object representing the eventual completion or failure of an async operation. States: pending → fulfilled/rejected. Chain with `.then()/.catch()` or use `await`.

**What is CORS?**
> Cross-Origin Resource Sharing. Browsers block requests to different origins by default. The server sends `Access-Control-Allow-Origin` headers to permit specific origins. ProfitPanel uses `django-cors-headers`.

**What is the virtual DOM?**
> React's in-memory representation of the UI. On state change, React creates a new virtual DOM, diffs it with the previous one, and only updates the real DOM for changed nodes (reconciliation).

**What is tree shaking?**
> Dead code elimination. Vite/Rollup analyzes `import`/`export` statements and removes unused code from the bundle.

**What is the difference between a library and a framework?**
> A library is code you call (React). A framework is code that calls you (Django). "Inversion of control."
