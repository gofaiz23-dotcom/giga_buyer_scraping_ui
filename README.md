# GigaBuyer UI

A modern, beautiful dashboard for the GigaBuyer FastAPI backend.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**.

## Features

- **Start** tab — trigger the products scrape pipeline with a single click.
- **Status** tab — live tree view of Parent categories → Categories → Subcategories with status badges, counts, and timings.
- **Buckets** tab — S3 tree viewer with per-file and per-folder downloads (incl. zip archives for any folder level).

## Backend

The UI talks to the FastAPI backend exposed at `BASE_URL` (see `.env`).
All browser requests go through Next.js `rewrites` at `/api/*`, so you get zero CORS friction in dev.

### Wired endpoints

| Method | Path                         | Purpose                                            |
| ------ | ---------------------------- | -------------------------------------------------- |
| POST   | `/api/products/start`        | Kick off a products scrape job                     |
| GET    | `/api/products/status`       | Parent / category / subcategory live status        |
| GET    | `/api/products/s3`           | S3 run tree (parentassign + categories + files)    |
| GET    | `/api/products/s3/zip`       | Stream a zip for a run or a specific folder level  |

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Configuration

Create `.env` (or `.env.local`) in this folder:

```env
BASE_URL=http://localhost:8005
```

`BASE_URL` is only used server-side by `next.config.js` for API rewrites — the browser never sees it.

## Project layout

```
src/
  app/
    layout.tsx          # root layout, fonts, global styles
    page.tsx            # tab router (Start | Status | Buckets)
    globals.css         # Tailwind + custom styles
  components/
    Navbar.tsx          # top navbar with tab links
    ui/                 # reusable UI primitives
      Card.tsx
      StatusBadge.tsx
      IconButton.tsx
      Loader.tsx
      EmptyState.tsx
      TreeNode.tsx
    tabs/
      StartTab.tsx
      StatusTab.tsx
      BucketsTab.tsx
  lib/
    api.ts              # typed fetch helpers
    types.ts            # backend response types
    format.ts           # date / bytes / status helpers
```
