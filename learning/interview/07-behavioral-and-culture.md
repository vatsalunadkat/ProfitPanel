# Interview Prep: Behavioral & Culture

> Svea Solar interview prep for collaborative culture, agile methodology, and behavioral questions.

---

## 1. Svea Solar Culture (from the JD)

### Key values to reflect
- **"Collaboration first"** — They emphasize working closely with product, design, and peer engineers.
- **"Move fast, iterate"** — Agile, incremental delivery, continuous improvement.
- **"Sustainability mission"** — Solar energy accelerating the energy transition.
- **"Customer-centric"** — The digital customer journey is a core product.
- **"Owned, not outsourced"** — In-house engineering team building proprietary tools.

### How ProfitPanel demonstrates these
| Value | ProfitPanel evidence |
|-------|---------------------|
| Collaboration | Decoupled arch — frontend/backend teams work independently |
| Move fast | Vite for instant dev feedback, Tailwind for rapid styling |
| Customer-centric | Lead capture form, savings calculator, dashboard insights |
| Technical ownership | Full-stack solution: React SPA + Django API, self-documented |
| Quality | Dual validation, error handling, accessible UI, dark mode |

---

## 2. STAR Method for Behavioral Questions

**S** — Situation: Set the scene.
**T** — Task: What was your responsibility?
**A** — Action: What did you do specifically?
**R** — Result: What was the outcome?

---

## 3. Common Behavioral Questions

### "Tell me about yourself."
> "I'm a fullstack developer working with React and Django. I recently built ProfitPanel — a solar quote management platform with a React/TypeScript SPA, Django REST API, savings calculator, and admin dashboard. I'm drawn to Svea Solar because I want to apply fullstack skills to a product with real impact, and your tech stack (React, Python, cloud services) matches my experience well."

### "Why Svea Solar?"
> "Three reasons: First, I'm genuinely interested in the energy transition and solar energy's role in it. Second, I love the idea of building in-house digital tools — not outsourced solutions — that directly impact the customer journey. Third, the stack (React, TypeScript, Python, cloud) is exactly what I enjoy working with, and I'm excited about the opportunity to work in a collaborative, product-focused team."

### "Tell me about a technical challenge."
> **S:** While building ProfitPanel, I needed the savings calculator and quote form to share state without overcomplicating the architecture.
> **T:** The calculator computes an estimated monthly bill that should pre-fill the form.
> **A:** I evaluated three approaches: global context, prop drilling, and state lifting. I chose lifting state to the common parent (QuoteFormPage) because only two components needed the data. I passed `onBillChange` to the calculator and `initialBill` to the form, keeping the data flow explicit.
> **R:** The components stayed decoupled, testable, and easy to understand. Context would have been overkill for two siblings.

### "How do you handle disagreements with teammates?"
> **S:** During a project discussion, a teammate wanted to use Redux for state management.
> **T:** I believed Context API was sufficient for our app's needs.
> **A:** Instead of arguing, I created a small comparison showing both approaches — lines of code, bundle size, and complexity. I focused on the team's shared goal (ship quickly, keep it simple) rather than proving myself right.
> **R:** The team agreed to start with Context and add Redux only if needed. It never was. The lesson: lead with data and shared goals, not opinions.

### "Describe a project you're proud of."
> ProfitPanel: "I designed the architecture from scratch — a React SPA with Django REST backend, Tailwind styling with dark mode, comprehensive error handling with a custom error envelope, and OpenAPI documentation. I'm proud not of any single feature, but of the architectural coherence — every piece reinforces the others. The error class adapts API errors for the UI, the API layer abstracts fetch details from components, and the documentation is auto-generated from the code."

### "How do you prioritize when you have competing deadlines?"
> "I break tasks into must-have vs nice-to-have, focusing on what unblocks others first. For ProfitPanel, the API was the must-have (frontend depended on it), so I built that first with full validation and error handling. The dashboard filtering was nice-to-have — built last. I communicate trade-offs early rather than silently cutting corners."

### "How do you stay current with technology?"
> "I follow a few trusted sources: the React blog for major updates, Python weekly newsletters, and GitHub trending. But the best way I learn is by building — ProfitPanel used React 19, Django 6, and Vite 8, all current versions. I believe in learning through practice rather than just reading."

---

## 4. Technical Behavioral Questions

### "How do you approach debugging?"
> "I start with reproducing the issue reliably, then narrow the scope: Is it frontend or backend? Check the network tab — is the request correct? Is the response correct? Then I use browser DevTools (React DevTools, console), Django's debug output, or add targeted logging. I avoid changing code randomly — hypothesis-driven debugging."

### "How do you approach code review?"
> "I focus on three things: correctness (does it work?), clarity (will someone understand this in 6 months?), and consistency (does it follow our patterns?). I ask questions rather than demand changes. If I suggest a change, I explain why. I try to praise good patterns too, not just find problems."

### "How do you handle technical debt?"
> "I track it visibly — comments, tickets, or docs. I address debt when it blocks features or creates bugs. For ProfitPanel, if I had more time, I'd add: pagination (for large datasets), authentication, comprehensive tests, and CI/CD. I communicate the trade-offs to stakeholders rather than silently accumulating debt."

### "Describe your ideal development workflow."
> "Feature branch from main → local development with hot reload → tests (unit + integration) → PR with clear description → code review → CI/CD checks → merge → deploy. For ProfitPanel, I used Vite's hot reload for rapid frontend iteration and Django's dev server for backend, with separate concerns making each side independently testable."

---

## 5. System Design Questions (Likely for Fullstack)

### "How would you scale ProfitPanel to 10,000 users?"

**Database:**
- Migrate from SQLite to PostgreSQL.
- Add indexes on frequently queried fields (email, created_at).
- Implement pagination (not loading all quotes at once).

**API:**
- Add authentication (JWT) and rate limiting.
- Implement caching (Redis) for read-heavy endpoints.
- Background jobs (Celery) for email notifications.

**Frontend:**
- Virtual scrolling for large lists (react-window).
- Optimistic updates for better UX.
- Service worker for offline support.

**Infrastructure:**
- Docker containers for consistent environments.
- Load balancer → multiple API instances.
- CDN for static frontend assets (already using GitHub Pages).
- Monitoring (Sentry for errors, Prometheus for metrics).

### "Design a notification system for new quotes."

```
1. Quote created → Django signal fires
2. Signal handler sends to message queue (Redis/RabbitMQ)
3. Celery worker consumes message
4. Worker sends email via SMTP/SendGrid
5. Worker sends push notification via WebSocket
6. Dashboard polls or subscribes via WebSocket for real-time updates
```

---

## 6. Questions to Ask THEM

### About the role
- "What does a typical sprint look like for the team?"
- "What's the biggest technical challenge the team is facing right now?"
- "How do you balance shipping fast with maintaining code quality?"

### About the product
- "How is the customer journey digital platform architected?"
- "What's the relationship between the customer-facing product and internal tools?"
- "How do you handle the integration between the web platform and hardware (solar panels, batteries)?"

### About the culture
- "How do you approach code reviews?"
- "How much autonomy does a developer have in choosing technical solutions?"
- "What does 'collaboration first' look like in practice?"

### About growth
- "What opportunities are there for learning and development?"
- "How do you see the engineering team growing over the next year?"
- "What would success look like for this role in the first 6 months?"

---

## 7. Common Traps to Avoid

| Trap | Better approach |
|------|----------------|
| Badmouthing previous team | "I learned a lot, and I'm looking for new challenges" |
| Saying "I don't know" and stopping | "I'm not sure, but here's how I'd figure it out..." |
| Over-engineering answers | Start simple, add complexity only when asked |
| Being vague | Use specific examples from ProfitPanel |
| Not asking questions | Always have 3+ questions prepared |
| Focusing only on tech | Show you understand the business impact |
