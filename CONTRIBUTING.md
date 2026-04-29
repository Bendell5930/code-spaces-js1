# Contributing to Pokie Analyzer

Thank you for considering a contribution to Pokie Analyzer. This project's core purpose is **gambling harm minimisation**, and all contributions should align with that mission. Please keep that in mind when proposing changes — we will not accept contributions that glamourise gambling, imply the tool improves a player's odds, or reduce the visibility of help resources.

---

## Getting started

### 1. Fork and clone

```bash
git clone https://github.com/Bendell5930/code-spaces-js1.git
cd code-spaces-js1
npm install
```

### 2. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Run the tests

```bash
npm test
```

All tests are in `__tests__/` and use Jest with `@jest/globals`. The test environment is `"node"`, so browser globals (localStorage, window) must be stubbed. See `__tests__/profileStore.test.js` or `__tests__/spendTracker.test.js` for the established pattern.

### 4. Build for production

```bash
npm run build
```

Ensure the build passes before opening a pull request.

---

## Environment variables

Stripe features require the following in `.env.local` (never commit this file):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
APP_URL=http://localhost:3000
```

The app works without these — locked features simply remain locked.

---

## Coding conventions

- **Language**: JavaScript (ES Modules — `"type": "module"` in `package.json`)
- **Framework**: Next.js 14 with the `/pages` router
- **Styling**: CSS Modules (one `.module.css` file per component or page)
- **Storage**: `localStorage` / `sessionStorage` only — no new external data stores without discussion
- **No backend additions** without discussion in an issue first
- Keep new utility functions pure where possible and add unit tests in `__tests__/`

---

## Submitting a pull request

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/my-improvement
   ```
2. Make your changes following the conventions above.
3. Run `npm test` and `npm run build` — both must pass.
4. Open a pull request with a clear description of:
   - **What** you changed
   - **Why** (link to an issue if applicable)
   - Any **harm-minimisation considerations**

---

## Reporting issues

Please use [GitHub Issues](https://github.com/Bendell5930/code-spaces-js1/issues). Include:
- Steps to reproduce
- Expected vs actual behaviour
- Browser / OS if relevant

---

## Licence

By contributing, you agree that your changes will be licensed under the [MIT Licence](LICENSE).
