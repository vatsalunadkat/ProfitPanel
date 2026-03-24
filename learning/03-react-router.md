# Lesson 3: React Router & Navigation

> Learn client-side routing using react-router-dom as used in ProfitPanel.

---

## 3.1 What Is Client-Side Routing?

Traditional websites load a new HTML page for every URL. **Client-side routing** changes the URL and renders different components _without_ a full page reload. This makes the app feel fast and seamless.

ProfitPanel uses **react-router-dom v7**, the standard routing library for React.

---

## 3.2 Setting Up the Router

**From `App.tsx`:**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import QuoteFormPage from './pages/QuoteFormPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<QuoteFormPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
```

**Breaking it down:**

| Concept | Code | What it does |
|---------|------|-------------|
| **BrowserRouter** | `<BrowserRouter>` | Enables routing using the browser's history API (`/path` style URLs) |
| **basename** | `basename={import.meta.env.BASE_URL}` | Prepends `/ProfitPanel/` to all routes (for GitHub Pages deployment) |
| **Routes** | `<Routes>` | A container that renders only the first matching `<Route>` |
| **Layout route** | `<Route path="/" element={<Layout />}>` | A parent route that renders the persistent Layout |
| **Index route** | `<Route index element={<QuoteFormPage />} />` | Renders at the parent's exact path (`/`) |
| **Named route** | `<Route path="dashboard" ...>` | Renders at `/dashboard` |

---

## 3.3 Route Nesting and `<Outlet />`

The most powerful pattern in React Router is **nested routes**. The parent route renders shared UI, and child routes render into an `<Outlet />`.

```tsx
// App.tsx — route definition
<Route path="/" element={<Layout />}>          // Parent
  <Route index element={<QuoteFormPage />} />  // Child 1: renders at /
  <Route path="dashboard" element={<DashboardPage />} /> // Child 2: renders at /dashboard
</Route>
```

```tsx
// Layout.tsx — the parent component
export default function Layout() {
  return (
    <div className="h-screen flex flex-col">
      <nav>...</nav>              {/* Always visible */}
      <main>
        <Outlet />                {/* Child route renders here */}
      </main>
      <footer>...</footer>        {/* Always visible */}
    </div>
  )
}
```

**Visual representation:**

```
URL: /
┌──────────────────────────┐
│ <Layout>                 │
│ ┌──── Nav ──────────────┐│
│ │ Get a Quote | Dashboard││
│ └───────────────────────┘│
│ ┌──── <Outlet /> ───────┐│
│ │ <QuoteFormPage />      ││
│ └───────────────────────┘│
│ ┌──── Footer ───────────┐│
│ │ © 2026 Svea Solar      ││
│ └───────────────────────┘│
└──────────────────────────┘

URL: /dashboard
┌──────────────────────────┐
│ <Layout>                 │
│ ┌──── Nav ──────────────┐│  ← Same nav
│ │ Get a Quote | Dashboard││
│ └───────────────────────┘│
│ ┌──── <Outlet /> ───────┐│
│ │ <DashboardPage />      ││  ← Different content
│ └───────────────────────┘│
│ ┌──── Footer ───────────┐│  ← Same footer
│ │ © 2026 Svea Solar      ││
│ └───────────────────────┘│
└──────────────────────────┘
```

---

## 3.4 Navigation with `<NavLink>`

`<NavLink>` is like an `<a>` tag but uses client-side routing instead of full page reloads:

```tsx
// From Layout.tsx
<NavLink
  to={to}
  end={to === '/'}
  className={({ isActive }) =>
    `text-sm font-medium px-1 py-1 border-b-2 transition-colors ${
      isActive
        ? 'border-svea-green text-gray-900 dark:text-white'
        : 'border-transparent text-gray-500'
    }`
  }
>
  {children}
</NavLink>
```

### `<NavLink>` vs `<Link>` vs `<a>`

| Component | When to use |
|-----------|------------|
| `<NavLink>` | Navigation where you need to style the active link (navbars, menus) |
| `<Link>` | Internal links where active styling isn't needed |
| `<a href>` | External links to other websites |

### The `end` prop

```tsx
end={to === '/'}
```

Without `end`, NavLink to `/` would be "active" for _every_ URL (since `/dashboard` starts with `/`). The `end` prop makes it only match the exact path.

### The `isActive` render prop

`className` can accept a function that receives `{ isActive }`:

```tsx
className={({ isActive }) =>
  isActive ? 'active-class' : 'inactive-class'
}
```

This is how we apply a green bottom border to the current page's nav item.

---

## 3.5 The `basename` Prop — Deploying to Subpaths

```tsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
```

ProfitPanel is deployed to GitHub Pages at `https://username.github.io/ProfitPanel/`. The `basename` ensures:
- Route `/` actually matches `/ProfitPanel/`
- Route `/dashboard` matches `/ProfitPanel/dashboard`
- All `<NavLink>` URLs include the prefix automatically

`import.meta.env.BASE_URL` comes from Vite's config:

```typescript
// vite.config.ts
export default defineConfig({
  base: '/ProfitPanel/',
})
```

---

## 3.6 Route Types Reference

| Route type | Example | Matches |
|-----------|---------|---------|
| **Static** | `<Route path="dashboard" />` | `/dashboard` exactly |
| **Index** | `<Route index />` | The parent's exact path |
| **Dynamic** | `<Route path="quotes/:id" />` | `/quotes/42`, `/quotes/100` |
| **Catch-all** | `<Route path="*" />` | Any unmatched URL (404 page) |
| **Layout** | `<Route element={<Layout />}>` | Wraps children, renders `<Outlet />` |

---

## 3.7 Programmatic Navigation (Advanced)

Sometimes you need to navigate from code (not from a link click):

```tsx
import { useNavigate } from 'react-router-dom'

function SomeComponent() {
  const navigate = useNavigate()

  function handleSuccess() {
    navigate('/dashboard')        // Go to dashboard
    navigate(-1)                  // Go back one page
    navigate('/dashboard', { replace: true })  // Replace current entry in history
  }
}
```

This isn't used in ProfitPanel yet — but it's useful when you want to redirect after a form submission (e.g., "go to dashboard after submitting a quote").

---

## 3.8 Reading URL Parameters (Advanced)

For dynamic routes like `/quotes/:id`, extract the parameter:

```tsx
import { useParams } from 'react-router-dom'

function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  // fetch quote by id...
}
```

This pattern would be useful if ProfitPanel added a quote detail page.

---

## 3.9 GitHub Pages SPA Routing Hack

Notice the script in `index.html`:

```html
<script>
  (function(l) {
    if (l.search[1] === '/') {
      var decoded = l.search.slice(1).split('&').map(function(s) {
        return s.replace(/~and~/g, '&')
      }).join('?');
      window.history.replaceState(null, null, l.pathname + decoded + l.hash);
    }
  }(window.location))
</script>
```

**Why?** GitHub Pages serves static files. If you navigate to `/ProfitPanel/dashboard` directly, the server looks for a `dashboard/index.html` which doesn't exist → 404. 

The `public/404.html` page redirects to `index.html` with the path encoded in the query string, and this script decodes it back. This is a common workaround for deploying SPAs (Single Page Apps) on static hosts.

---

## Exercises

1. **Add a route:** Create an "About" page (`AboutPage.tsx`) and add it as a route at `/about`. Add a nav link in `Layout.tsx`.

2. **Dynamic route:** Create a route `/quotes/:id` that shows a single quote's details using `useParams`.

3. **Active styling:** Change the active NavLink style from a green bottom border to a green background with white text.

4. **Catch-all 404:** Add a `<Route path="*" element={<NotFoundPage />} />` that shows a "Page not found" message for invalid URLs.

5. **Programmatic redirect:** After a successful quote submission in `LeadCaptureForm`, redirect to the dashboard using `useNavigate()`.

---

**Next lesson:** [04 - Vite & Build Tooling](04-vite-and-build-tooling.md)
