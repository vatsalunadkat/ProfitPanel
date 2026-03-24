# Lesson 4: Vite & Build Tooling

> Understand how Vite powers ProfitPanel's development and production builds.

---

## 4.1 What Is Vite?

Vite (French for "fast") is a modern build tool that provides:
- **Lightning-fast dev server** — Uses native ES modules; no bundling during development.
- **Hot Module Replacement (HMR)** — Changes appear in the browser instantly without losing state.
- **Optimized production builds** — Uses Rollup under the hood for tree-shaking and code splitting.

### Vite vs Older Tools (webpack, Create React App)

| Feature | webpack / CRA | Vite |
|---------|--------------|------|
| Dev server startup | Slow (bundles everything first) | Instant (serves raw ES modules) |
| Hot reload speed | Seconds | Milliseconds |
| Config complexity | Complex `webpack.config.js` | Minimal `vite.config.ts` |
| Production bundler | webpack | Rollup (proven, fast) |
| TypeScript | Needs loaders | Built-in support |

---

## 4.2 Our Vite Configuration

**From `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ProfitPanel/',
})
```

That's just 6 lines. Let's unpack each part:

### `defineConfig`

A helper that provides TypeScript autocompletion and type checking for the config object. You could use a plain object, but `defineConfig` gives you editor support.

### `plugins: [react()]`

The `@vitejs/plugin-react` plugin enables:
- **Fast Refresh** — React-specific HMR that preserves component state.
- **JSX transformation** — Compiles JSX without needing `import React`.
- **Automatic runtime** — Uses React 17+'s new JSX transform.

### `base: '/ProfitPanel/'`

Sets the base URL path for all assets. This is critical for deploying to a subfolder (GitHub Pages). Without it:
- Dev: works fine (localhost:5173)
- Production: all asset paths would break on `username.github.io/ProfitPanel/`

---

## 4.3 How Vite's Dev Server Works

When you run `npm run dev`:

```
Browser requests: http://localhost:5173/
    │
    ▼
Vite serves index.html as-is
    │
    ▼
Browser sees: <script type="module" src="/src/main.tsx">
    │
    ▼
Browser requests: /src/main.tsx
    │
    ▼
Vite transforms TSX → JS on the fly (single file, not whole app)
    │
    ▼
Browser executes, finds imports (App.tsx, index.css, etc.)
    │
    ▼
Each import triggers another request → Vite transforms each file on demand
```

**Key insight:** Vite does NOT bundle your code during development. Each file is served individually as a native ES module. This is why startup is instant — it only processes files the browser actually requests.

---

## 4.4 The `package.json` Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

| Script | Command | What it does |
|--------|---------|-------------|
| `dev` | `vite` | Starts the dev server with HMR |
| `build` | `tsc -b && vite build` | Type-check with TypeScript, then create production bundle |
| `lint` | `eslint .` | Check code quality and style |
| `preview` | `vite preview` | Preview the production build locally |
| `deploy` | `npm run build && gh-pages -d dist` | Build + deploy to GitHub Pages |

### Why `tsc -b` before `vite build`?

Vite strips TypeScript types without checking them (for speed). Running `tsc -b` first catches type errors before building. This is a deliberate tradeoff:
- **Dev:** Fast iteration, no type checking blocking you.
- **Build:** Full type checking, then optimized bundling.

---

## 4.5 Environment Variables

Vite uses a specific convention for environment variables:

```typescript
// frontend/src/api/config.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
```

**Key rules:**
1. Only variables prefixed with `VITE_` are exposed to client code.
2. Access them via `import.meta.env.VITE_*`.
3. `import.meta.env.BASE_URL` is always available (from `base` in config).
4. `import.meta.env.MODE` is `'development'` or `'production'`.
5. `import.meta.env.DEV` and `import.meta.env.PROD` are boolean shortcuts.

**Create `.env` files for different environments:**

```
# .env (default)
VITE_API_BASE_URL=http://localhost:8000

# .env.production (used during `vite build`)
VITE_API_BASE_URL=https://api.production.com
```

**The `??` operator** — Nullish coalescing: if the left side is `null` or `undefined`, use the right side. This provides a fallback URL for development.

---

## 4.6 The HTML Entry Point

**From `index.html`:**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/ProfitPanel/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SolarQuote – ProfitPanel</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Important details:**
- `type="module"` — Tells the browser to use ES module loading.
- `src="/src/main.tsx"` — Points directly to a TypeScript file! Vite transforms it on the fly.
- `<div id="root">` — Where React mounts the entire app.
- The favicon references `href="/ProfitPanel/..."` matching the base URL.

In production, Vite replaces the script tag with the bundled, hashed filename (e.g., `assets/index-a1b2c3.js`).

---

## 4.7 Production Build Output

Running `npm run build` creates:

```
dist/
├── index.html          ← Minified, with hashed asset references
├── assets/
│   ├── index-[hash].js     ← All JS bundled and minified
│   ├── index-[hash].css    ← All CSS bundled and minified
│   └── vendor-[hash].js    ← React + libraries (code-split)
└── 404.html            ← Copied from public/
```

**The `[hash]` suffix** enables aggressive caching — the filename changes only when the content changes, so browsers can cache forever.

---

## 4.8 PostCSS and CSS Processing

**From `postcss.config.js`:**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

PostCSS is a CSS processing pipeline. Each plugin transforms CSS:

1. **Tailwind CSS** — Scans your source files and generates utility classes.
2. **Autoprefixer** — Adds vendor prefixes (`-webkit-`, `-moz-`) for browser compatibility.

Vite runs PostCSS automatically when it encounters CSS imports like `import './index.css'`.

---

## 4.9 ESLint Configuration

**From `eslint.config.js`:**

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,           // Core JS best practices
      tseslint.configs.recommended,     // TypeScript-specific rules
      reactHooks.configs.flat.recommended,  // Enforce Rules of Hooks
      reactRefresh.configs.vite,        // Ensure components export correctly for HMR
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,         // Allow browser globals (window, document)
    },
  },
])
```

**Key rules enforced:**
- **React Hooks rules:** Hooks must be called at the top level, not inside conditions/loops.
- **React Refresh:** Components must be exported in a way that supports Fast Refresh.
- **TypeScript:** No `any`, prefer `const`, consistent type assertions.

---

## 4.10 `import.meta` — The Module Meta Object

`import.meta` is a standard JavaScript feature for getting metadata about the current module:

```typescript
// Vite-specific properties:
import.meta.env.MODE        // 'development' or 'production'
import.meta.env.BASE_URL    // '/' or '/ProfitPanel/'
import.meta.env.DEV         // true in dev
import.meta.env.PROD        // true in production
import.meta.env.VITE_*      // Custom env variables

// Usage in our code:
<BrowserRouter basename={import.meta.env.BASE_URL}>
<img src={import.meta.env.BASE_URL + 'svea_solar_logo.jpg'} />
```

---

## 4.11 The Dependency Chain

```
index.html
  └─ src/main.tsx
       └─ src/App.tsx
            ├─ react-router-dom (from node_modules)
            ├─ src/context/ThemeContext.tsx
            ├─ src/components/Layout.tsx
            │    ├─ src/components/ThemeToggle.tsx
            │    └─ <Outlet /> (renders child routes)
            ├─ src/pages/QuoteFormPage.tsx
            │    ├─ src/components/SavingsCalculator.tsx
            │    └─ src/components/LeadCaptureForm.tsx
            │         └─ src/api/quotes.ts
            │              └─ src/api/config.ts
            └─ src/pages/DashboardPage.tsx
                 └─ src/api/quotes.ts
```

Vite traces this entire dependency graph starting from `index.html`. In dev, it transforms files on demand. In production, it bundles everything into optimized chunks.

---

## Exercises

1. **Explore HMR:** Run `npm run dev`, then change the title in `QuoteFormPage.tsx`. Watch the browser update without a full reload.

2. **Environment variable:** Create a `.env` file with `VITE_APP_TITLE=My Solar App`. Use `import.meta.env.VITE_APP_TITLE` in the nav bar. Verify it works.

3. **Analyze the build:** Run `npm run build`, then inspect the `dist/` folder. Open the generated `index.html` — see how Vite replaced the script tag.

4. **Preview production:** Run `npm run preview` and compare the behavior with `npm run dev`.

5. **Add static assets:** Place an image in `public/` and reference it in a component using `import.meta.env.BASE_URL + 'image.png'`.

---

**Next lesson:** [05 - Tailwind CSS](05-tailwind-css.md)
