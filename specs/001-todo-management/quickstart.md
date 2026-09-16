# Quickstart: Validating Todo Management

## Prerequisites

- Node.js 24 (matches `node --version` used during planning)
- Dependencies installed: `npm install`
- No additional services required — SQLite is a local file, created automatically on
  first run at `data/todos.db` (see `research.md` § 2, `data-model.md` for schema).

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scenario 1 — Add and view (User Story 1, spec.md Acceptance Scenarios)

1. On a fresh `data/todos.db` (or after deleting the file), load the page.
   **Expect**: empty-state message (FR-008), no errors.
2. Type a title, submit.
   **Expect**: to-do appears immediately, unchecked (SC-001, SC-003 — under 2s, one
   action).
3. Add a second to-do.
   **Expect**: both to-dos present; the first is unchanged.
4. Submit the form with an empty or whitespace-only title.
   **Expect**: no new to-do is created; a "title is required" message is shown
   (FR-002). Confirm via `contracts/todos-api.md` `POST` `400` response.

## Scenario 2 — Toggle (User Story 2)

1. Click the checkbox/toggle on an incomplete to-do.
   **Expect**: it flips to completed (SC-003, single action).
2. Click it again.
   **Expect**: it flips back to not completed.
3. Click rapidly several times.
   **Expect**: final displayed state matches the last click (Edge Cases).

## Scenario 3 — Delete (User Story 3)

1. Delete one to-do from a list of several.
   **Expect**: it disappears immediately; the others are unaffected (SC-004).
2. Delete the same to-do again (e.g., via a stale second click, or by calling
   `DELETE /api/todos/:id` twice).
   **Expect**: no error surfaced to the user; list still reflects the correct
   current state (Edge Cases — double delete is a no-op).

## Scenario 4 — Persistence (FR-007, SC-005)

1. Add a couple of to-dos, toggle one, leave the others as-is.
2. Reload the browser (`F5`).
   **Expect**: same to-dos, same titles, same completion statuses.
3. Stop the dev server (`Ctrl+C`) and restart it (`npm run dev`).
   **Expect**: same to-dos still present — proves data lives in the SQLite file, not
   in memory.

## API-level spot check (optional, via `curl` or any HTTP client)

See `contracts/todos-api.md` for exact shapes.

```bash
curl -s http://localhost:3000/api/todos
curl -s -X POST http://localhost:3000/api/todos -H "Content-Type: application/json" -d '{"title":"Test"}'
curl -s -X PATCH http://localhost:3000/api/todos/1/toggle
curl -s -X DELETE http://localhost:3000/api/todos/1
```

Every response, success or error, must be valid JSON matching the `{ data }` /
`{ error: { message } }` envelope (Constitution Principle II) — spot-check this on at
least one error case (e.g., `POST` with `{"title":""}` → expect `400` with
`error.message`).
