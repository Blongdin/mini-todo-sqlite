# Phase 0 Research: Todo Management

All items from the spec and constitution were resolvable without open
`NEEDS CLARIFICATION` markers. Each decision below cites the source consulted.

## 1. SQLite access from Next.js Route Handlers

- **Decision**: Use Node's built-in `node:sqlite` module (`DatabaseSync`) instead of a
  third-party package like `better-sqlite3`.
- **Rationale**: The installed runtime is Node.js 24 (`node --version` → v24.20.0),
  which ships `node:sqlite` as a stable synchronous SQLite driver. It requires zero
  new dependencies, avoids native-module compilation (a common pain point for
  `better-sqlite3` on Windows), and its synchronous API is a natural fit for Route
  Handlers, which already run per-request on the Node.js runtime.
- **Alternatives considered**:
  - `better-sqlite3` — mature and widely used, but adds a native dependency that
    needs a build toolchain; unnecessary given `node:sqlite` covers all needs here.
  - Prisma + SQLite — adds an ORM, migrations, and a generated client for a
    4-operation, single-table feature; rejected as disproportionate complexity.
  - `sql.js` (WASM, in-memory) — does not persist to a real file without extra
    read/write plumbing; rejected because the spec requires actual file persistence
    (FR-007).

## 2. Where the SQLite file lives and how the schema is created

- **Decision**: Store the database at `data/todos.db` (repo-root `data/` folder,
  gitignored) and create the `todos` table with `CREATE TABLE IF NOT EXISTS` on first
  connection, from a single module-level `DatabaseSync` instance in `lib/db.ts`.
- **Rationale**: A single shared module-level connection avoids reopening the file on
  every request and guarantees the schema exists before any query runs. Keeping the
  file out of `app/` avoids any chance of it being treated as a route/static asset.
- **Alternatives considered**: A separate migration tool/step — rejected as
  unnecessary ceremony for one table with a stable shape.

## 3. Route Handler caching behavior (Next.js 16)

- **Decision**: Do not set `export const dynamic = 'force-static'` (or any dynamic
  config) on any `todos` Route Handler; rely on the framework default.
- **Rationale**: Per `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`,
  Route Handlers are **not cached by default**, and this project's `next.config.ts`
  does not enable Cache Components — so `GET`/`POST`/`PATCH`/`DELETE` all already run
  per-request against the live SQLite file, which is exactly what's needed for a list
  that must reflect the latest add/toggle/delete (FR-007, SC-004, SC-005). Opting into
  `force-static` would serve a stale cached list.
- **Alternatives considered**: Explicitly caching `GET /api/todos` — rejected, it
  would contradict the "always current" requirement.

## 4. Toggle as its own endpoint vs. generic PATCH with a body

- **Decision**: `PATCH /api/todos/:id/toggle` flips the stored `completed` value on
  the server and returns the updated to-do; the client sends no body.
- **Rationale**: FR-005 describes a toggle action ("toggle a to-do's completion status
  between completed and not completed"), not an arbitrary field update. A dedicated
  toggle endpoint removes any risk of the client sending a stale `completed` value
  from a race condition (edge case: rapid repeated toggles — the server, not the
  client, is the source of truth for the flip).
- **Alternatives considered**: `PATCH /api/todos/:id` with `{ completed: boolean }` in
  the body — rejected because it pushes "what's the new value" reasoning onto the
  client, which is more state to keep in sync for no benefit at this scale.

## 5. Frontend data flow: Route Handlers + `fetch`, not Server Actions

- **Decision**: The list page is a Client Component that calls the JSON API via
  `fetch` for list/create/toggle/delete, rather than using React Server
  Functions/Server Actions.
- **Rationale**: The user's explicit input requests "API Route를 만든다" and "프론트엔드는
  이 API를 호출해" (the frontend calls this API) — i.e., a conventional REST-style JSON
  API consumed by the client, which also aligns with Constitution Principle II
  (every `app/**/route.ts` handler returns a uniform JSON envelope). Server Actions
  are Next.js's own recommended mutation mechanism per
  `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`, but
  they return framework-managed RSC payloads rather than the plain JSON envelope the
  constitution mandates, and the spec explicitly asks for API Routes.
- **Alternatives considered**: Server Actions for create/toggle/delete — rejected as
  conflicting with the explicit "API Route" + "JSON response" requirements.

## 6. Testing approach

- **Decision**: No automated test framework is introduced. Verification is manual,
  driven by `quickstart.md`.
- **Rationale**: Neither the spec nor the constitution requires a testing framework,
  and none is present in `package.json` today. Adding one would be scope beyond what
  was requested for this single-page, four-endpoint feature.
- **Alternatives considered**: Introducing Vitest/Playwright — reasonable for a larger
  app, but out of scope here; can be revisited in a future feature if requested.
