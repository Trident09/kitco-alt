# Stashly

**Your personal product wishlist, organized.**

Stashly lets you save products you want to buy, organize them into themed lists (stashes), and share them with anyone. Paste a URL and Stashly auto-fills the product name, image, and price. Tag items, drag to reorder, mark purchases, and flip a stash public when you want to share it.

> kit.co was shut down. So I built my own.

Free to use · Sign in with Google · Private by default

---

## Features

- **Auto-fill from any URL** — paste a product link and Stashly scrapes the name, image, and price automatically via the Brave Search API
- **Multiple stashes** — create separate lists for tech gear, travel, gifts, home finds, etc.
- **Tags & filtering** — add tags to items and filter your stash instantly
- **Drag-and-drop reorder** — prioritize items by dragging them into order
- **Purchase tracking** — mark items as purchased and keep a record of what you've bought
- **Public sharing** — keep stashes private by default; flip one public and share the link with anyone
- **Custom covers** — pick an illustrated cover for each stash
- **Keyboard shortcuts** — power-user shortcuts throughout the dashboard
- **Real-time sync** — changes sync instantly across tabs and devices via Firestore

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Auth | Firebase Authentication (Google Sign-In) |
| Database | Cloud Firestore |
| Drag & drop | [@dnd-kit](https://dndkit.com) |
| Scraping | Brave Search API (server-side) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Firebase project](https://console.firebase.google.com) with Firestore and Google Auth enabled
- A [Brave Search API key](https://brave.com/search/api/) (free tier: 2 000 req/month)

### 1. Clone & install

```bash
git clone <repo-url>
cd kitco-alt
npm install
```

### 2. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Brave Search API — server-side only
BRAVE_SEARCH_API_KEY=
```

### 3. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (fonts, providers)
│   ├── page.tsx            # Entry point — redirects to /landing or /dashboard
│   ├── landing/            # Marketing / home page
│   ├── about/              # About page
│   ├── login/              # Google Sign-In page
│   ├── dashboard/          # Authenticated dashboard (list of stashes + item view)
│   ├── s/                  # Public share page (/s/[listId])
│   └── api/
│       └── scrape/         # Server-side URL scraping endpoint
├── components/
│   ├── Sidebar.tsx         # Dashboard sidebar — stash list, create/delete
│   ├── ItemModal.tsx       # Add / edit item modal
│   ├── ManageTagsModal.tsx # Rename & delete tags in bulk
│   ├── CoverPickerModal.tsx # Stash cover illustration picker
│   ├── ConfirmModal.tsx    # Generic confirmation dialog
│   ├── KeyboardShortcutsLegend.tsx
│   ├── DashboardFooter.tsx
│   ├── BackToDashboard.tsx
│   └── Footer.tsx
├── lib/
│   ├── firebase.ts         # Firebase app init (auth, db)
│   ├── lists.ts            # Firestore CRUD for StashList
│   ├── items.ts            # Firestore CRUD + real-time subscriptions for StashItem
│   ├── public.ts           # Read-only helpers for the public share page
│   └── stash-covers.tsx    # Cover illustration definitions
├── context/
│   ├── AuthContext.tsx     # Firebase auth state (useAuth hook)
│   └── ToastContext.tsx    # Toast notification system
└── types/
    └── index.ts            # StashList and StashItem interfaces
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Firestore Data Model

```
lists/{listId}
  uid          string   — owner's Firebase UID
  name         string
  description  string
  isPublic     boolean  — controls public share page access
  cover        string   — cover illustration ID
  tagOrder     string[] — user-defined tag sort order
  itemCount    number   — denormalized count
  createdAt    timestamp
  updatedAt    timestamp

items/{itemId}
  listId       string   — parent list ID
  uid          string   — owner's Firebase UID
  name         string
  url          string
  image        string   — scraped or manually provided URL
  price        string   — free-form, e.g. "$49.99"
  description  string
  notes        string
  tags         string[]
  purchased    boolean
  order        number   — position within list
  createdAt    timestamp
  updatedAt    timestamp
```

Security rules enforce that only the owner can read/write their own documents, while public lists and their items are readable by anyone (including unauthenticated users).

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for a deeper look at how the pieces fit together.

## License

[MIT](./LICENSE) © 2025 Rupam Barui
