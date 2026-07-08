# Contributing to Stashly

Thanks for your interest in contributing. This document covers everything you need to get your changes merged cleanly.

---

## Before you start

- **Open an issue first** for anything non-trivial (new features, significant refactors, API changes). This avoids wasted effort and ensures alignment before you write code.
- **Bug fixes and docs** can go straight to a PR — no issue required.
- Be respectful. Disagreements happen; keep them technical and constructive.

---

## Development setup

See the [Getting Started section in the README](./README.md#getting-started) for full setup instructions. The short version:

```bash
git clone <repo-url>
cd kitco-alt
npm install
cp .env.example .env.local   # fill in Firebase + Brave API keys
npm run dev
```

You need a Firebase project with Firestore and Google Auth enabled, plus a Brave Search API key. Both are available on free tiers.

---

## Workflow

1. Fork the repo and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes. Keep commits focused — one logical change per commit.
3. Run lint before pushing:
   ```bash
   npm run lint
   ```
4. Open a pull request against `main`. Fill in the description template.

### Branch naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/…` | `feat/search-items` |
| Bug fix | `fix/…` | `fix/tag-filter-reset` |
| Docs | `docs/…` | `docs/architecture` |
| Refactor | `refactor/…` | `refactor/sidebar-state` |

---

## Code style

- **TypeScript** everywhere — no `any` unless genuinely necessary, and add a comment explaining why.
- **Tailwind CSS** for all styling. Avoid inline `style` props.
- **Server Components by default** in the `app/` directory; add `"use client"` only when you need interactivity or browser APIs.
- Match the patterns already in the codebase (component structure, Firestore helpers, context usage) rather than introducing new ones.
- Keep components focused. If a component is doing too much, split it.

---

## Firestore & security rules

- Any feature that adds or changes Firestore collections or fields must include an update to `firestore.rules`.
- Rules must maintain the invariant: **owners can read/write their own data; public lists and their items are readable by anyone; everything else is denied.**
- Test rules changes locally with the Firebase emulator before opening a PR.

---

## Environment variables

Never commit secrets. `.env.local` is gitignored. If you are adding a new env variable:

1. Add it to `.env.example` with an empty value and a comment describing what it is.
2. Document it in the README under the environment variables section.
3. Access server-only secrets (e.g. `BRAVE_SEARCH_API_KEY`) only inside Route Handlers or Server Components — never in client code.

---

## Pull request checklist

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] New UI is tested in a browser (Chrome + one other)
- [ ] Firestore rules updated if the data model changed
- [ ] `.env.example` updated if a new env variable was added
- [ ] PR description explains what changed and why

---

## What we won't merge

- Dependencies with open version ranges (use exact or `^major.minor.patch`)
- Features that require new third-party services without prior discussion
- Client-side exposure of server-only secrets
- Accessibility regressions (buttons without labels, missing focus states, etc.)

---

## Questions?

Open an issue with the `question` label or start a discussion in the repo.
