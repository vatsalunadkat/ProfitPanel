# Lesson 5: Tailwind CSS

> Learn utility-first CSS through ProfitPanel's styling approach.

---

## 5.1 What Is Tailwind CSS?

Tailwind is a **utility-first CSS framework**. Instead of writing custom CSS classes like `.card-header`, you compose small utility classes directly in your HTML/JSX.

**Traditional CSS approach:**

```css
.card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
```

**Tailwind approach (from our code):**

```tsx
<div className="bg-white rounded-2xl p-6 shadow-sm">
```

Each class does one thing: `bg-white` = white background, `rounded-2xl` = 16px border radius, `p-6` = 24px padding, etc.

---

## 5.2 Tailwind Configuration

**From `tailwind.config.js`:**

```javascript
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        svea: {
          dark: '#1f2937',
          navy: '#111827',
          green: '#00ad69',
          'green-light': '#e6f7ef',
          teal: '#0d9488',
          muted: '#6b7280',
          bg: '#f9fafb',
          card: '#ffffff',
        },
      },
      borderRadius: {
        '2xl': '16px',
        xl: '12px',
      },
    },
  },
  plugins: [],
}
```

**Key settings:**

### `content` — Where to scan for classes

```javascript
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

Tailwind scans these files, extracts class names, and only generates CSS for classes actually used. Unused classes are never included → tiny production bundle.

### `darkMode: 'class'`

Enables dark mode by toggling a `.dark` class on the `<html>` element:

```html
<html class="dark">  <!-- dark mode ON -->
<html>                <!-- dark mode OFF (light) -->
```

### `theme.extend` — Custom design tokens

`extend` adds to Tailwind's defaults (rather than replacing them):

```javascript
colors: {
  svea: {
    green: '#00ad69',    // Use as: text-svea-green, bg-svea-green, border-svea-green
    bg: '#f9fafb',       // Use as: bg-svea-bg
  }
}
```

This creates our brand palette accessible via `text-svea-green`, `bg-svea-bg`, etc.

---

## 5.3 Essential Utility Classes — A Reference

Here are all the Tailwind classes used in ProfitPanel, grouped by category:

### Layout & Spacing

| Class | CSS | Used in |
|-------|-----|---------|
| `flex` | `display: flex` | Layout.tsx — flex column layout |
| `flex-col` | `flex-direction: column` | Layout.tsx — stack elements vertically |
| `flex-1` | `flex: 1 1 0%` | Layout.tsx — take remaining space |
| `grid` | `display: grid` | QuoteFormPage.tsx — two-column layout |
| `grid-cols-1` | `grid-template-columns: repeat(1, minmax(0, 1fr))` | Stack on mobile |
| `gap-5` | `gap: 1.25rem` | Spacing between grid/flex items |
| `p-5` | `padding: 1.25rem` | Padding all sides |
| `px-4` | `padding-left/right: 1rem` | Horizontal padding |
| `py-3` | `padding-top/bottom: 0.75rem` | Vertical padding |
| `mb-4` | `margin-bottom: 1rem` | Bottom margin |
| `mx-auto` | `margin: 0 auto` | Center horizontally |

### Sizing

| Class | CSS |
|-------|-----|
| `w-full` | `width: 100%` |
| `h-screen` | `height: 100vh` |
| `max-w-6xl` | `max-width: 72rem` |
| `w-12 h-12` | `width: 3rem; height: 3rem` |
| `h-14` | `height: 3.5rem` |
| `min-h-0` | `min-height: 0` (for flex overflow) |

### Typography

| Class | CSS |
|-------|-----|
| `text-sm` | `font-size: 0.875rem` |
| `text-xs` | `font-size: 0.75rem` |
| `text-2xl` | `font-size: 1.5rem` |
| `text-3xl` | `font-size: 1.875rem` |
| `font-bold` | `font-weight: 700` |
| `font-semibold` | `font-weight: 600` |
| `font-medium` | `font-weight: 500` |
| `tracking-tight` | `letter-spacing: -0.025em` |
| `uppercase` | `text-transform: uppercase` |
| `antialiased` | Font smoothing |

### Colors

| Class | What it styles |
|-------|---------------|
| `text-gray-900` | Text color (near-black) |
| `text-gray-500` | Text color (medium gray) |
| `text-svea-green` | Text in brand green (#00ad69) |
| `bg-white` | White background |
| `bg-gray-50` | Very light gray background |
| `bg-svea-green/10` | Brand green at 10% opacity |
| `border-gray-100` | Light gray border |

### Borders & Shapes

| Class | CSS |
|-------|-----|
| `rounded-2xl` | `border-radius: 16px` (our custom value) |
| `rounded-xl` | `border-radius: 12px` |
| `rounded-full` | `border-radius: 9999px` (fully round) |
| `border` | `border-width: 1px` |
| `border-b-2` | `border-bottom-width: 2px` |
| `shadow-sm` | Small box shadow |

---

## 5.4 Responsive Design

Tailwind uses **mobile-first breakpoints**. Unprefixed classes apply to all screens; prefixed classes apply at that breakpoint and up.

```tsx
// From QuoteFormPage.tsx
<h1 className="text-2xl sm:text-3xl font-bold">
  See how much you could save
</h1>
```

| Prefix | Min-width | Meaning |
|--------|-----------|---------|
| (none) | 0px | All screens (mobile first) |
| `sm:` | 640px | Small screens and up |
| `md:` | 768px | Medium screens and up |
| `lg:` | 1024px | Large screens and up |
| `xl:` | 1280px | Extra large screens and up |

**From our code — responsive grid:**

```tsx
// QuoteFormPage.tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
  <SavingsCalculator />
  <LeadCaptureForm />
</div>
```

- Mobile: 1 column (stacked).
- Large screens (1024px+): 2 columns side by side.

**Responsive padding:**

```tsx
// Layout.tsx
<main className="px-4 sm:px-6 lg:px-8">
```

- Mobile: 16px horizontal padding.
- Small: 24px.
- Large: 32px.

---

## 5.5 Dark Mode

With `darkMode: 'class'`, every utility has a `dark:` variant:

```tsx
// From Layout.tsx
<div className="bg-svea-bg dark:bg-gray-900 text-gray-800 dark:text-gray-100">
```

**How it works:**
1. `ThemeContext.tsx` adds/removes the `dark` class on `<html>`.
2. Tailwind generates `dark:` variants that apply when `.dark` is on an ancestor.

**Pattern from our components:**

```tsx
// Light mode + dark mode pair
className="bg-white dark:bg-gray-800
           border-gray-100 dark:border-gray-700
           text-gray-900 dark:text-white"
```

The `dark:` prefix only applies when `<html class="dark">` is present.

---

## 5.6 Pseudo-Classes & States

### Hover, focus, active

```tsx
// From LeadCaptureForm.tsx
<button className="
  bg-gray-900 hover:bg-gray-800     // Darker on hover
  active:scale-[0.98]                // Slight shrink on click
  disabled:bg-gray-300               // Gray when disabled
  transition-all duration-200        // Smooth transition
">
```

### Focus states for inputs

```tsx
<input className="
  focus:outline-none                            // Remove default outline
  focus:ring-2 focus:ring-svea-green/30        // Green ring
  focus:border-svea-green                       // Green border
  transition                                    // Smooth transition
" />
```

### Placeholder text

```tsx
<input className="placeholder:text-gray-400 dark:placeholder:text-gray-500" />
```

---

## 5.7 The `@tailwind` Directives

**From `index.css`:**

```css
@tailwind base;        /* Normalize/reset styles */
@tailwind components;  /* Component classes */
@tailwind utilities;   /* All utility classes */
```

These directives inject Tailwind's generated CSS. The `@layer` directive lets us add custom styles that Tailwind can intelligently order:

```css
@layer base {
  body {
    @apply antialiased text-gray-800 bg-svea-bg dark:bg-gray-900 dark:text-gray-100;
  }
}
```

`@apply` lets you use Tailwind utilities inside custom CSS — useful for base styles.

---

## 5.8 Custom CSS Components

**From `index.css`:**

```css
@layer components {
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 9999px;
    background: #e5e7eb;
  }
  input[type="range"]::-webkit-slider-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #00ad69;
    border: 2px solid #fff;
  }
}
```

Some elements (like range sliders) need custom CSS that Tailwind can't express as utilities. Put them in `@layer components` so Tailwind orders them correctly.

---

## 5.9 Custom Animations

```css
@layer components {
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.4s ease-out forwards;
  }
  .animate-fade-in-up-delay {
    animation: fade-in-up 0.4s ease-out 0.15s forwards;
    opacity: 0;
  }
}
```

**Used in `SavingsCalculator.tsx` for staggered card animations:**

```tsx
<div className="grid grid-cols-3 gap-2 animate-fade-in-up">
  {/* Cards appear one after another */}
</div>
<div className="mt-3 animate-fade-in-up-delay">
  {/* This appears 150ms later */}
</div>
<div className="mt-3 animate-fade-in-up-delay-2">
  {/* This appears 300ms later */}
</div>
```

---

## 5.10 Arbitrary Values

When Tailwind doesn't have the exact value you need, use square brackets:

```tsx
// From DashboardPage.tsx
className="hover:bg-svea-green/[0.03]"   // 3% opacity (not a standard value)

// From ThemeToggle.tsx
className="left-[calc(100%-1.625rem)]"   // Calculated position

// From index.css
className="text-[10px]"                    // 10px font (not a standard size)
className="text-[11px]"                    // 11px font
```

The `[]` syntax lets you use any CSS value, even `calc()`.

---

## 5.11 Opacity Modifier

Tailwind uses `/` syntax for opacity:

```tsx
bg-svea-green/10       // background: rgba(0, 173, 105, 0.1)
bg-svea-green/5        // background: rgba(0, 173, 105, 0.05)
focus:ring-svea-green/30  // Ring at 30% opacity
text-svea-green/70     // Text at 70% opacity
```

---

## 5.12 Transition Utilities

```tsx
// Smooth color transitions
className="transition-colors duration-200"

// All properties transition
className="transition-all duration-200"

// Specific transition
className="transition-all duration-300 ease-in-out"
```

| Class | What transitions |
|-------|-----------------|
| `transition` | color, background, border, opacity, shadow, transform |
| `transition-colors` | Only color properties |
| `transition-all` | All CSS properties |
| `duration-200` | 200ms transition |
| `ease-in-out` | Acceleration curve |

---

## 5.13 Common Patterns in ProfitPanel

### Card pattern

```tsx
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 sm:p-6">
  {/* Card content */}
</div>
```

### Input pattern

```tsx
<input className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600
  rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100
  placeholder:text-gray-400 dark:placeholder:text-gray-500
  focus:outline-none focus:ring-2 focus:ring-svea-green/30 focus:border-svea-green transition" />
```

### Button pattern

```tsx
<button className="bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800
  text-white font-medium rounded-full px-6 py-3
  transition-all duration-200 text-sm hover:shadow-md active:scale-[0.98]">
  Get my quote
</button>
```

### Badge pattern

```tsx
<span className="inline-flex items-center gap-1.5 bg-svea-green/10 text-svea-green
  text-xs font-semibold px-3 py-1.5 rounded-full">
  {annualSavings} kr/year
</span>
```

---

## Exercises

1. **Build a card:** Create a new component with the card pattern. Add a title, description, and a badge showing a status.

2. **Responsive layout:** Make a 1-column layout on mobile, 2-column on `md:`, and 3-column on `lg:` using Tailwind grid.

3. **Custom color:** Add a new color called `solar-gold` with value `#f59e0b` to `tailwind.config.js`. Use it in a component.

4. **Dark mode:** Toggle dark mode on/off using the ThemeToggle and observe how every component adapts. Inspect elements in DevTools to see which classes apply.

5. **Animation:** Create a new `animate-slide-in-left` animation in `index.css` using `@keyframes` and apply it to an element.

---

**Next lesson:** [06 - Django Fundamentals](06-django-fundamentals.md)
