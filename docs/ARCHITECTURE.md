# Architecture

This document describes how Stashly is structured, how data flows through the system, and the key design decisions behind it.

---

## Overview

Stashly is a Next.js 16 App Router application backed by Firebase (Auth + Firestore). There is no custom backend server — all persistence goes through Firestore's client SDK, and the only server-side compute is a single Next.js Route Handler that proxies URL scraping requests through the Brave Search API.

```
Browser
  │
  ├── Next.js App Router (React Server + Client Components)
  │     ├── /landing, /about, /login          → Server Components (static)
  │     ├── /dashboard                        → Client Components (real-time Firestore)
  │     ├── /s/[listId]                       → Server + Client (public share)
  │     └── /api/scrape                       → Route Handler (server-side Brave API call)
  │
  ├── Firebase Auth (Google Sign-In, client SDK)
  └── Cloud Firestore (real-time listeners, client SDK)
```

---

## Directory structure

```
src/
├── app/                  Next.js App Router pages and API routes
├── components/           Shared UI components (all client-side)
├── lib/                  Business logic and Firebase helpers
├── context/              React context providers (auth state, toasts)
└── types/                Shared TypeScript interfaces
```

---

## Authentication

Auth is handled entirely by Firebase Authentication with Google as the only provider. The flow:

1. User clicks "Sign in with Google" on `/login`.
2. Firebase opens a Google OAuth popup and returns a credential.
3. `AuthContext` wraps the app and exposes `user` (the Firebase `User` object) and `loading` via `useAuth()`.
4. The root `page.tsx` reads `useAuth()` and redirects to `/dashboard` (authenticated) or `/landing` (unauthenticated).

All Firestore security rules use `request.auth.uid` to scope reads and writes to the authenticated user. There is no session cookie or JWT passed to the Next.js server — the server is stateless.

---

## Data model

Two top-level Firestore collections:

### `lists/{listId}`

Represents a stash (a named wishlist).

| Field | Type | Notes |
|---|---|---|
| `uid` | string | Owner's Firebase UID |
| `name` | string | Display name |
| `description` | string | Optional description |
| `isPublic` | boolean | Controls public share page access |
| `cover` | string | Cover illustration ID |
| `tagOrder` | string[] | User-defined tag sort order |
| `itemCount` | number | Denormalized count, updated by `subscribeItems` |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

### `items/{itemId}`

Represents a single product in a stash.

| Field | Type | Notes |
|---|---|---|
| `listId` | string | Parent list ID |
| `uid` | string | Owner's Firebase UID (duplicated for query efficiency) |
| `name` | string | Product name |
| `url` | string | Source URL |
| `image` | string | Scraped or manually entered image URL |
| `price` | string | Free-form (e.g. `"$49.99"`) |
| `description` | string | |
| `notes` | string | User's private notes |
| `tags` | string[] | |
| `purchased` | boolean | |
| `order` | number | Sort position within the list |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

`uid` is stored on every item (not just the parent list) so that Firestore security rules can enforce ownership on single-document reads without an extra lookup.

---

## Real-time data flow

The dashboard uses Firestore's `onSnapshot` listeners for live updates:

```
subscribeLists(uid, cb)   →  listens to all lists where uid == user
subscribeItems(listId, uid, cb)  →  listens to items in the selected stash
```

Both are set up in the dashboard's client component and cleaned up on unmount via the unsubscribe function returned by `onSnapshot`. This means edits from another tab or device appear instantly with no polling.

`itemCount` on each list is a denormalized counter updated inside `subscribeItems` whenever the item count changes (and only after Firestore confirms the write — `!snap.metadata.hasPendingWrites`). This avoids a separate aggregation query in the sidebar.

---

## URL scraping

When a user pastes a product URL, the client calls `POST /api/scrape` with the URL in the request body. The Route Handler:

1. Calls the Brave Search API's Web Search endpoint with the URL as the query.
2. Parses the first result for `title`, `thumbnail`, and `description`.
3. Returns `{ name, image, price, description }` to the client.

The Brave API key (`BRAVE_SEARCH_API_KEY`) lives only in the server environment — it is never exposed to the browser. The route is not authenticated at the HTTP level (no session), which means anyone who discovers the endpoint can call it. Rate limiting on the Brave free tier (2 000 req/month) acts as the natural cap.

---

## Security rules

`firestore.rules` enforces:

- **Lists**: owner can read/write/delete; anyone can read a list where `isPublic == true`.
- **Items**: owner can read/write/delete; anyone can read an item if its parent list is public (resolved with a `get()` call in the rule).

The `get()` call in the items rule does cost one extra Firestore read per rule evaluation on the public share page. This is acceptable given the read-only, low-traffic nature of that page.

---

## Public share page

`/s/[listId]` is a read-only view of a stash. It:

1. Fetches the list document server-side (Server Component) to check `isPublic`.
2. Returns a 404 if the list does not exist or is not public.
3. Renders items using the `public.ts` helper, which uses `getDocs` (one-time fetch) rather than a live listener — public viewers don't need real-time updates.

---

## State management

There is no global state library. State is managed at two levels:

- **Auth state**: `AuthContext` (React context + `onAuthStateChanged`).
- **Toast notifications**: `ToastContext` (React context with a queue).
- **Dashboard UI state**: local `useState`/`useEffect` in the dashboard page component and Firestore listeners.

This is intentional. The app is small enough that prop drilling is not a problem, and adding Redux or Zustand would be overhead without benefit.

---

## Drag and drop

Item reordering uses [`@dnd-kit`](https://dndkit.com). On drag end, the new order is computed client-side and `reorderItems` performs a Firestore batch write to update all affected `order` fields in a single round trip.

---

## Key design decisions

**Firebase over a custom backend** — eliminates infrastructure to manage. Real-time sync, auth, and security rules are all handled by Firebase with minimal code.

**`uid` denormalized on items** — Firestore security rules cannot traverse relationships, so storing `uid` directly on items allows ownership checks without extra reads.

**Server-side scraping only** — keeps the Brave API key out of the browser bundle and allows the scraping logic to evolve without client deploys.

**No aggregation queries** — `itemCount` is maintained as a denormalized field because Firestore does not support `COUNT` queries efficiently at the free tier. The tradeoff is that the count could momentarily be stale, but the real-time listener reconciles it quickly.

**Tailwind CSS 4** — utility-first styling keeps component files self-contained and avoids the overhead of a CSS-in-JS runtime.
