# Conference Program Builder — PRD

## Problem Statement

Organizing a conference program means grouping many Sessionize submissions into ~90-minute blocks made of shorter talks (15–60 minutes). Today this is done outside a shared tool, so the community cannot collaborate in real time, see consistent session metadata, or get help grouping related talks. When Sessionize changes (sessions added or withdrawn), manual arrangements drift out of sync with the source of truth.

## Solution

A collaborative web app where anyone with a magic link can open shared **program pages**, import sessions from Sessionize into Convex, and drag sessions from a left-hand catalog into **blocks** on the right. Sessions are colored and sized by **Field** and **length**; block rules warn (but do not block) when combinations exceed three sessions or sit outside ~80–90 minutes. Removed Sessionize sessions stay in place but appear dimmed with a warning. A separate **AI suggestions** page proposes groupings from title and description without modifying user-built pages. All edits are live for everyone—no publish step.

## User Stories

1. As a program volunteer, I want to import all sessions from our Sessionize event, so that we start from authoritative talk data.
2. As a program volunteer, I want to re-import from Sessionize, so that new talks appear and withdrawn talks are marked without wiping our blocks.
3. As a program volunteer, I want sessions removed in Sessionize to show status `removed`, dimmed styling, and “removed” labeling, so that I can see they are no longer active in Sessionize.
4. As a program volunteer, I want removed sessions to remain in any block I placed them in, with a visible warning flag, so that I do not lose context while cleaning up.
5. As a program volunteer, I want to see all sessions in a left panel, so that I can browse what is available to schedule.
6. As a program volunteer, I want session cards colored by Sessionize **Field** category, so that I can scan domains at a glance.
7. As a program volunteer, I want card height to reflect session length (15 / 30 / 45 / 60 minutes), so that duration is visible spatially.
8. As a program volunteer, I want to search sessions by text, so that I can find a specific talk quickly.
9. As a program volunteer, I want the session list sorted by length first and title second, so that similar-duration talks cluster together.
10. As a program volunteer, I want to drag a session from the list into a block area, so that I can build groupings interactively.
11. As a program volunteer, I want to drag sessions between blocks and back to the unassigned pool, so that I can reorganize freely.
12. As a program volunteer, I want to create a block and add sessions until the block feels complete, so that we can model ~90-minute program segments.
13. As a program volunteer, I want a soft warning when a block has more than three sessions, so that I know we broke the guideline but can proceed if intentional.
14. As a program volunteer, I want a soft warning when total block duration is outside ~80–90 minutes, so that I know timing may be tight or loose.
15. As a program volunteer, I want a soft warning when a block has four short sessions (e.g. 45+15+15+15) even if duration fits, so that session-count limits are visible.
16. As a program volunteer, I want all changes saved live via Convex, so that others see updates without refresh.
17. As a program volunteer, I want to open multiple named program pages, so that different people or scenarios can explore layouts in parallel.
18. As a program volunteer, I want every program page visible to everyone with access, so that we work transparently.
19. As a program volunteer, I want anyone with access to move sessions on any page, so that collaboration is not gated by ownership.
20. As a program volunteer, I want to create a new program page, so that I can start an alternative grouping experiment.
21. As a program volunteer, I want to rename or delete a program page I created (or with shared consent), so that experiments stay manageable.
22. As a new collaborator, I want to receive a magic link, so that I can access the tool without username/password setup.
23. As an admin, I want to generate or rotate magic links, so that we can share access with the core team.
24. As a program volunteer, I want a dedicated AI Suggestions page, so that I can explore machine-proposed groupings without affecting my working pages.
25. As a program volunteer, I want AI suggestions based on session title and description, so that thematically related talks surface together.
26. As a program volunteer, I want to copy or manually apply ideas from AI suggestions onto a program page, so that I stay in control of the real schedule.
27. As a program volunteer, I want block totals (minutes and session count) visible on each block, so that I can balance timing while dragging.
28. As a program volunteer, I want unassigned sessions to remain in the left list (or a clear unassigned state), so that I know what still needs a home.
29. As a program volunteer, I want service sessions excluded or visually distinct if they are not schedulable blocks, so that the catalog stays focused on talks.
30. As a developer, I want Sessionize data fetched through the `sessionize_api` package with Zod-validated types, so that imports match our existing Sessionize tooling.
31. As a developer, I want the stack in a Turbo monorepo with Vite, TypeScript, and Convex, so that it aligns with our standard tooling.

## Implementation Decisions

### Monorepo layout

- **Turbo monorepo** with at least:
  - `apps/web` — Vite + React + TypeScript UI
  - `packages/backend` or root `convex/` — Convex schema, queries, mutations, actions
  - `packages/block-rules` — pure validation/warning logic (deep module)
  - `packages/session-import` — Sessionize → Convex sync (deep module)

### Sessionize import (`session-import`)

- Use **`sessionize_api`** (`getAll` or sessions endpoint) with configured **Sessionize event ID** (env).
- Map Sessionize session id as stable primary key in Convex.
- Extract **Field** from category type `"Field"` and **length** from category type `"Session length"` (same pattern as sessionize-quick-search); parse length to minutes (15 / 30 / 45 / 60).
- **Initial import:** upsert all sessions with status `active`.
- **Re-import:**
  - Upsert new/changed sessions (title, description, field, length, speakers snapshot as needed).
  - Sessions in DB but missing from Sessionize → set status `removed` only (no delete).
  - Do not auto-remove from blocks.
- Trigger: manual “Import / Re-import” control (admin or any user with link for v1).
- Run fetch in **Convex action** (network); persist in mutation.

### Data model (Convex)

- **EventConfig** — sessionize event id, last import timestamp (singleton per deployment).
- **Session** — sessionizeId, title, description, field, lengthMinutes, status (`active` | `removed`), raw category ids optional, updatedAt.
- **ProgramPage** — id, name, createdAt, sort order.
- **Block** — id, programPageId, order index, optional label.
- **BlockSession** — blockId, sessionId, order within block (a session may appear on multiple pages/blocks in v1 if dragged; clarify: default **one placement per page** — session in at most one block per page, unassigned otherwise).
- **MagicLinkToken** — token hash, label, createdAt, optional expiry, revoked flag.
- **AccessSession** — browser token after redeeming magic link (Convex-friendly auth pattern).

### Block rules (`block-rules`)

- Allowed lengths: 15, 30, 45, 60 (warn if unknown length).
- **Warnings (non-blocking):**
  - More than 3 sessions in a block.
  - Sum of `lengthMinutes` &lt; 80 or &gt; 90.
  - Any session with status `removed`.
- Expose: `evaluateBlock(sessions) → { warnings: Warning[] }`.
- UI shows warning chips/icons on block and on removed session cards.

### Program UI (`apps/web`)

- **Layout:** left session catalog (~40%), right block workspace (~60%).
- **Session card:** background/border from Field → configurable color map (palette per field name); height proportional to lengthMinutes.
- **Removed:** reduced opacity, “removed” label, warning icon; still draggable.
- **DnD:** drag from catalog to block, between blocks, out to unassign; use established library (e.g. `@dnd-kit/core`).
- **Search:** client-side filter on title/description/speaker names.
- **Sort:** lengthMinutes asc, then title asc.
- **Realtime:** Convex `useQuery` for page + blocks + sessions; mutations on drop with optimistic UI optional.
- **Pages:** nav list of ProgramPages; “+ New page”; default page on first visit.
- **No tracks/rooms/grid** in v1.

### AI suggestions (separate route `/suggestions`)

- Read-only relative to user pages: generates **SuggestedGroup[]** (ephemeral or cached in Convex table `AiSuggestionRun` without writing to Block/BlockSession).
- **Vercel AI SDK** (`ai` package) with **OpenAI** default model (env `OPENAI_API_KEY`).
- Prompt: cluster sessions by thematic fit; respect soft block constraints in prompt (≤3 sessions, ~80–90 min) but output is advisory.
- UI: list of suggested groups with sessions; actions: “Copy to clipboard” / manual recreation on a program page (no auto-apply to user pages in v1).

### Access (`MagicLinkAccess`)

- No passwords in v1.
- Admin/setup route or env-seeded token to **create magic links** (random URL token).
- Visiting `/access?token=…` validates token, sets httpOnly cookie / Convex auth identity, redirects to app.
- All authenticated link holders have same permissions (create page, import, edit any page).

### Tech stack

- TypeScript, Vite, React, Convex, Turbo, `sessionize_api`, `ai` (Vercel AI SDK), OpenAI provider.

### Not in v1 (confirmed out of scope)

- Tracks, rooms, day/time grid scheduling.
- Publish/draft workflow.
- Login/password, OAuth, roles.
- Public schedule website.
- Speaker conflict detection.
- Notifications.
- Export back to Sessionize.

## Testing Decisions

- **Principle:** Test observable behavior through public module interfaces; avoid testing React component internals or Convex implementation details.
- **`block-rules` (unit tests, Vitest):** Warning when &gt;3 sessions; when duration &lt;80 or &gt;90; when removed session present; valid 60+30 produces no count warning; 45+15+15+15 produces count warning.
- **`session-import` (unit tests):** Given prior session set + new Sessionize payload → correct upserts and `removed` status only for missing ids; new sessions added; existing block placements untouched.
- **Prior art:** `sessionize_api` package uses Vitest; mirror patterns there.
- **Defer:** E2E drag-and-drop, AI prompt quality tests, Convex integration tests in v1 unless requested.

## Out of Scope

- User accounts and role-based permissions beyond magic link.
- Publish/draft and public attendee-facing schedule.
- Track/room/day-time grid scheduling.
- Speaker double-booking detection.
- Email or in-app notifications.
- Writing or syncing the program back to Sessionize.
- Automatic application of AI suggestions onto user program pages.
- Hard enforcement of block rules (warnings only in v1).

## Further Notes

- **Greenfield:** `programionize` workspace is empty; prior art lives in `sessionize-quick-search` and `sessionize_api`.
- **Session length:** Derived from Sessionize “Session length” category; invalid/missing values should show an “unknown length” warning.
- **One block per session per page:** Recommended default so the same talk is not duplicated on one page; copying across pages is a future enhancement.
- **Open questions for implementation:**
  - Magic link issuance UI: single shared team link vs per-person links.
  - Whether `AiSuggestionRun` results are persisted or computed on each visit.
  - Field → color mapping: config file vs Convex table for easy edits.
- **GitHub:** File this document as a GitHub issue on the `programionize` repository once created (`gh` CLI was not available in the authoring environment).
