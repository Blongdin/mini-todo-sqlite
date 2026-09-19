# Quickstart: Validating Todo Priority

## Prerequisites

- Node.js 24 (matches `node --version` used during planning)
- Dependencies installed: `npm install`
- No additional services required — same local SQLite file as 001-todo-management
  (`data/todos.db`); the `priority` column is added automatically on first run after
  this feature is implemented (see `research.md` § 1, `data-model.md` for the
  migration).

## Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scenario 1 — Create with an explicit priority (User Story 1, spec.md)

1. Open the Todo creation form.
   **Expect**: a priority selector is visible, defaulting to "Medium" (FR-002).
2. Enter a title, choose "High", submit.
   **Expect**: the new to-do appears in the list showing "High" (SC-001, SC-003 —
   selectable in one action, visible immediately).
3. Repeat with "Low".
   **Expect**: that to-do shows "Low"; the previous "High" to-do is unaffected.

## Scenario 2 — Default to Medium when priority isn't chosen (User Story 2)

1. Add a to-do without changing the priority selector away from its default.
   **Expect**: the created to-do shows "Medium" (FR-003). Confirm via
   `contracts/todos-api.md` `POST` response — `priority: "medium"` when the field is
   omitted from the request, or when the UI's default selection is submitted.

## Scenario 3 — Priority visible in the list (User Story 3)

1. With at least one High, one Medium, and one Low to-do present, view the list.
   **Expect**: every item shows its own priority label distinctly, without needing to
   click into the item (FR-004, SC-003).

## Scenario 4 — Existing functionality and persistence unaffected (User Story 4)

1. Toggle the completion state of a "High" priority to-do.
   **Expect**: only the completed state changes; it still shows "High" afterward
   (FR-005, FR-006).
2. Delete a "Low" priority to-do from a list of several.
   **Expect**: it disappears; the remaining to-dos and their priorities are unaffected
   (FR-006).
3. Add to-dos of all three priorities, then reload the browser (`F5`).
   **Expect**: every to-do reappears with its original title, completed state, and
   priority unchanged (FR-007, SC-004).
4. Stop the dev server (`Ctrl+C`) and restart it (`npm run dev`).
   **Expect**: all to-dos and their priorities are still present (FR-007, SC-004) —
   proves priority is stored in SQLite, not in memory.

## Scenario 5 — Pre-existing data without a priority (Edge Cases)

1. Using a `data/todos.db` created before this feature (or simulate by deleting the
   `priority` column's value conceptually — in practice, any DB file created by
   001-todo-management's schema), start the server.
   **Expect**: startup succeeds without error, the `priority` column is added
   automatically, and any pre-existing to-do now shows "Medium" (spec Edge Cases,
   research.md § 1).

## API-level spot check (optional, via `curl` or any HTTP client)

See `contracts/todos-api.md` for exact shapes.

```bash
curl -s http://localhost:3000/api/todos
curl -s -X POST http://localhost:3000/api/todos -H "Content-Type: application/json" -d '{"title":"Test","priority":"high"}'
curl -s -X POST http://localhost:3000/api/todos -H "Content-Type: application/json" -d '{"title":"Test 2"}'
curl -s -X POST http://localhost:3000/api/todos -H "Content-Type: application/json" -d '{"title":"Test 3","priority":"urgent"}'
```

The first `POST` returns `priority: "high"`; the second returns `priority: "medium"`
(default applied); the third returns `400` with an error message identifying that
`priority` must be one of `high`, `medium`, `low` (FR-008).
