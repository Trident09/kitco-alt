# Security Policy

## Supported versions

Only the latest commit on `main` is actively maintained. There are no versioned releases at this time.

## Reporting a vulnerability

**Please do not report security vulnerabilities as public GitHub issues.**

Use GitHub's private security advisory feature instead:

1. Go to the [Security tab](https://github.com/Trident09/kitco-alt/security/advisories/new) of this repository.
2. Click **"Report a vulnerability"**.
3. Fill in as much detail as you can (see below).

You can expect an acknowledgement within **48 hours** and a resolution or status update within **7 days**.

### What to include

- A clear description of the vulnerability and its potential impact.
- Steps to reproduce or a proof-of-concept (even a rough one is helpful).
- The affected area (auth, Firestore rules, API routes, client-side code, etc.).
- Any suggested fixes or mitigations, if you have them.

## Scope

Areas of particular interest:

| Area | Notes |
|---|---|
| Firestore security rules | Rules must ensure users can only read/write their own data. Public lists must be read-only to unauthenticated users. |
| API route (`/api/scrape`) | Server-side only; should not expose credentials or be abusable as an open proxy. |
| Firebase Auth | Google Sign-In flow; session handling. |
| Client-side secret exposure | `BRAVE_SEARCH_API_KEY` and Firebase service account credentials must never be sent to the browser. |
| Public share page | Must not leak private stash data for non-public lists. |

## Out of scope

- Issues in third-party services (Firebase, Brave Search API, Vercel) — report those to the respective vendors.
- Theoretical vulnerabilities with no demonstrated impact.
- Rate-limiting / DDoS (handled at the infrastructure level).
- Self-XSS.

## Disclosure policy

Once a fix is deployed, the advisory will be published publicly with credit to the reporter (unless you prefer to remain anonymous).

Thank you for helping keep Stashly safe.
