# Programionize

Collaborative conference program builder. See [PRD](docs/PRD-conference-program-builder.md).

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 10+
- Sessionize event API id (`SESSIONIZE_EVENT_ID`)

Set on the Convex deployment (Dashboard → Settings → Environment Variables, or CLI):

Run from `packages/backend` (Convex project root):

```bash
cd packages/backend
pnpm exec convex env set SESSIONIZE_EVENT_ID "your-sessionize-event-id"
pnpm exec convex env set SETUP_SECRET "choose-a-long-random-secret"
pnpm exec convex env set OPENAI_API_KEY "sk-…"
```

If you see `Command "convex" not found`, run `pnpm install` at the repo root first.

`OPENAI_API_KEY` powers **AI suggestions** at `/suggestions` (Vercel AI SDK + OpenAI). Suggestions are advisory and never write to program blocks.

Optional — which Sessionize workflow statuses appear in the catalog and AI (comma-separated, default `Accept_Queue,Accepted`):

```bash
pnpm exec convex env set SESSIONIZE_SCHEDULABLE_STATUSES "Accept_Queue,Accepted"
```

The Sessionize API returns every queue (nominated, decline queue, etc.); import still syncs all of them, but only statuses in this list are schedulable and sent to the model. **Re-import** after changing queues so `sessionizeStatus` is stored on each session.

If generation fails with **quota exceeded**, the key is valid but the OpenAI account has no remaining credits — add billing or usage limits at [platform.openai.com](https://platform.openai.com/account/billing).

`apps/web/.env` only needs `VITE_CONVEX_URL` (same URL as `CONVEX_URL` in `packages/backend/.env.local`).

Use `pnpm exec convex …` instead of `npx convex …` if `npx` is not installed.

### Magic links

1. Open `/setup`, enter `SETUP_SECRET`, generate a link.
2. Share the link; recipients land on `/access?token=…` and enter the app.

## Local development

```bash
pnpm install
```

Terminal 1 — Convex backend (must be running for the WebSocket on port 3210):

```bash
pnpm --filter @programionize/backend dev
```

If `convex dev` asks to link `anonymous-backend`, you can skip it for local dev, or restart after the dev script change (uses non-interactive anonymous mode).

Copy `packages/backend/.env.local` values into `apps/web/.env.local`:

```bash
cp apps/web/.env.example apps/web/.env.local
# Set VITE_CONVEX_URL to the CONVEX_URL from packages/backend/.env.local
```

Terminal 2 — web app:

```bash
pnpm --filter @programionize/web dev
```

Or run both via Turbo:

```bash
pnpm dev
```

## Tests

```bash
pnpm test
```

## Repo

https://github.com/wigsnes/programionize
