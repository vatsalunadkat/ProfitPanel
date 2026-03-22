# Challenges & How We Solved Them

This document records the problems we ran into during development and how we fixed them. Written in plain language so anyone can follow along — no programming experience needed.

---

## 1. Tailwind CSS changed everything in version 4

**What happened:**
Tailwind CSS is the tool we use to style the app (make it look nice — colours, spacing, layout). In 2025, they released version 4, which completely changed how it works. The old setup files and keywords we were using (`tailwind.config.js`, `@tailwind base`, etc.) simply don't exist in v4.

If you type the normal install command (`npm install tailwindcss`), you get v4 by default — and then *nothing* in our styling instructions works. Everything looks broken with no obvious error message, which makes it especially confusing for someone new.

**How we fixed it:**
We pinned the install to version 3 explicitly:
```
npm install -D tailwindcss@3 postcss autoprefixer
```
This tells the package manager "give me version 3, not the latest." All our instructions, class names, and config files work perfectly with v3.

**Lesson learned:** Always check whether a tool has had a recent major release before following older tutorials. Major version changes often break things.

---

## 2. GitHub Pages breaks when you refresh a page that isn't the home page

**What happened:**
Our app has two pages: the Quote Form (`/`) and the Dashboard (`/dashboard`). In the browser, clicking between them works perfectly because React Router handles navigation *inside* the browser — no request goes to the server.

But when you deploy to GitHub Pages and someone types `yoursite.github.io/ProfitPanel/dashboard` directly into the address bar (or refreshes the page), GitHub Pages looks for a file called `dashboard/index.html`. That file doesn't exist — only our single `index.html` exists. So GitHub shows a 404 error page.

**How we fixed it:**
We added a clever workaround using a custom `404.html` file. When GitHub can't find a page, it shows our `404.html` instead of the default error page. Our `404.html` has a tiny script that takes the URL the person wanted (e.g. `/dashboard`) and redirects them to the home page with the path tucked into the URL as a hint. Then our main `index.html` reads that hint, fixes the URL silently, and React Router takes over — showing the right page. The user never sees any of this happen.

**Lesson learned:** "Single Page Apps" (SPAs) need special handling on static hosts like GitHub Pages because the server doesn't know about your app's internal routes.

---

## 3. The calculator and the form didn't stay in sync

**What happened:**
We have a savings calculator at the top of the page where you type your monthly electricity bill. Below it, there's a form where you fill in your contact details — and that form also has a "monthly bill" field that should automatically match what you typed in the calculator.

The problem: in React, when you pass a value as the starting point for a form field, it only reads it *once* — when the form first appears. If you change the calculator afterwards, the form's bill field doesn't update. So if a customer typed 2000 in the calculator, then changed their mind to 3000, the form would still say 2000.

**How we fixed it:**
We added a small piece of code (`useEffect`) that watches for changes in the calculator value and updates the form field whenever it changes. Now they always stay in sync.

**Lesson learned:** In React, initial values are just starting points. If you want two things to stay connected, you need to explicitly tell React to keep them in sync.

---

## 4. People could submit negative or zero electricity bills

**What happened:**
Our form accepts a monthly electricity bill amount. Without any checks, someone could type `-500` or `0` and submit the form. A negative bill makes no sense, and a zero bill means there are no savings to calculate — so both should be rejected.

**How we fixed it:**
We added a validator on the Django model (the part that defines what the data looks like):
```
monthly_bill must be at least 0.01
```
This means the server rejects any bill that's zero or negative and sends back a clear error message explaining why. The frontend also has `min={1}` on the input field so the browser helps catch it before the form is even submitted — but the server-side check is the real safety net because someone could bypass the browser.

**Lesson learned:** Always validate data on the server, even if the browser also checks it. The browser can be tricked; the server is the final gatekeeper.

---

## 5. Savings calculation rounding was inconsistent

**What happened:**
The calculator on the frontend used `Math.round()`, which rounds to the nearest whole number (e.g. 1500 × 0.3 = 450, which is fine). But if someone types 1234, the result is 370.2 — and `Math.round()` turns that into 370, dropping the decimals. Meanwhile, the backend calculates savings with two decimal places (370.20). So the number the customer sees on screen didn't match what gets stored.

**How we fixed it:**
We changed the frontend calculation to round to exactly 2 decimal places, matching the backend:
```
Math.round(bill * 0.3 * 100) / 100
```
Now both sides agree.

**Lesson learned:** When the same calculation happens in two places, make sure they round the same way — otherwise customers see one number and the database stores another.

---

## 6. Backend error messages were too technical for regular users

**What happened:**
When something goes wrong with a form submission, Django sends back error messages designed for developers — things like `{"email": ["Enter a valid email address."]}`. That's a JSON object with field names as keys and arrays of strings as values. If we showed that raw text to a customer, it would be confusing.

**How we fixed it:**
We built two layers:
1. **Backend:** We created a structured error response format with a consistent shape — every error response includes an `error_code` (like `VALIDATION_ERROR` or `SERVER_ERROR`), a human-readable `message`, and optional `field_errors` for form problems. This makes the API predictable for any frontend that uses it.
2. **Frontend:** We translate those structured errors into friendly, plain-language messages. For example, instead of showing `{"monthly_bill": ["Ensure this value is greater than or equal to 0.01."]}`, the user sees "Your monthly bill must be a positive number."

**Lesson learned:** APIs should return structured, machine-readable errors. Frontends should turn those into human-readable messages. The two jobs are separate.

---

## 7. The dashboard showed stale data after submitting a new quote

**What happened:**
If you submitted a quote on the form page and then clicked over to the dashboard, the dashboard fetched fresh data — so it worked. But if you were already *on* the dashboard and someone else submitted a quote (or you had the dashboard open in a second tab), there was no way to see the new data without refreshing the entire page.

**How we fixed it:**
We added a "Refresh" button to the dashboard that re-fetches all quotes from the server without reloading the page. Simple, but it means the operator can always get the latest data with one click.

**Lesson learned:** Data on screen can go stale. Always give users a way to refresh it — either automatically (polling, websockets) or manually (a refresh button). For this project, a button is the simplest and most reliable approach.

---

## 8. Accessibility basics were missing

**What happened:**
Screen readers (software used by visually impaired people) couldn't properly understand our forms because the labels weren't linked to the input fields. Also, when the savings numbers updated, screen readers didn't announce the change — the user wouldn't know anything happened.

**How we fixed it:**
- We linked every `<label>` to its `<input>` using `htmlFor` and `id` attributes
- We added `aria-live="polite"` to the savings results so screen readers announce updates
- We wrapped decorative emoji in proper `role="img"` with `aria-label` descriptions

**Lesson learned:** Small accessibility improvements cost almost nothing in development time but make the app usable for a much wider audience. It's good practice regardless of whether accessibility is explicitly required.

---

## 9. Making two equal-height cards sit side by side

**What happened:**
When placing the Savings Calculator and Lead Capture Form side by side in a two-column grid, the cards had different content heights. The calculator is shorter when no bill has been entered, while the form is always tall. This made the layout look unbalanced — one card would be much shorter than the other.

**How we solved it:**
We used `flex flex-col` on both card containers and `flex-1` / `mt-auto` on the inner content. The form's submit button uses `mt-auto` to push itself to the bottom of the card, so both cards stretch to the same height regardless of content. On mobile, the grid collapses to a single column (`grid-cols-1 lg:grid-cols-2`) and height matching isn't needed.

**Lesson learned:** CSS Grid gives you equal-height columns automatically, but the *content* inside each column also needs to stretch. Combine `grid` with `flex flex-col` and `flex-1` inside each cell to fill the available space naturally.

---

## 10. Dark mode with Tailwind requires careful class management

**What happened:**
Adding a light/dark mode toggle seemed straightforward — enable `darkMode: 'class'` in Tailwind and add `dark:` prefixed utilities everywhere. But three subtle issues emerged:

1. **Flash of incorrect theme:** On page load, before React hydrates, the page would briefly show the wrong theme. We solved this by reading the theme preference in `getInitialTheme()` synchronously (from `localStorage` or `prefers-color-scheme`) and applying the `dark` class immediately.
2. **Transition flicker:** Without `transition-colors duration-200` on the `<html>` element, theme switches looked jarring — all colors would change in a single frame. Adding a short transition on the root element smooths the swap for all descendant elements.
3. **Range slider styling:** The `<input type="range">` element ignores most CSS in dark mode. We had to use vendor-specific pseudo-elements (`::-webkit-slider-thumb`, `::-moz-range-thumb`) in a Tailwind `@layer components` block to style the track and thumb consistently across browsers and themes.

**Lesson learned:** Dark mode is more than adding `dark:` variants. You need to manage the theme class lifecycle carefully (read preference early, apply before first paint) and account for browser-native form elements that don't respond to normal CSS inheritance.
