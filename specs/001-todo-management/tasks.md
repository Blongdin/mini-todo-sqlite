---

description: "Task list for Todo Management feature implementation"
---

# Tasks: Todo Management

**Input**: Design documents from `/specs/001-todo-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/todos-api.md, quickstart.md

**Tests**: Not requested in the spec or constitution; research.md §6 records the
decision to validate manually via `quickstart.md` instead. No test tasks are included.

**Organization**: Tasks are grouped by user story (spec.md priorities P1/P2/P3) so each
story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Maps the task to US1 (Add/View), US2 (Toggle), or US3 (Delete)
- File paths are exact and match `plan.md`'s Project Structure

---

## Phase 1: Setup

**Purpose**: One-time project prep. No new npm dependencies are needed — `node:sqlite`
is built into the installed Node.js 24 runtime (research.md §1).

- [X] T001 Add `data/*.db` to `.gitignore` in `.gitignore` so the runtime-created SQLite
  file (`data/todos.db`) is never committed

**Checkpoint**: Repo ready for foundational work.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, JSON envelope helper, and the SQLite connection that every
user story's routes and data-access code depend on.

**⚠️ CRITICAL**: No user story task may start until this phase is complete.

- [X] T002 [P] Define `Todo`, `ApiSuccess<T>`, `ApiError`, `ApiResponse<T>` in
  `lib/types.ts` exactly per data-model.md's TypeScript types section: `Todo` has
  `id: number`, `title: string`, `completed: boolean`, `createdAt: string`; no `any`
  anywhere (Constitution III)
- [X] T003 [P] Implement JSON envelope helpers in `lib/api-response.ts`: an `ok<T>(data:
  T, status = 200)` function returning `NextResponse.json({ data }, { status })` and a
  `fail(message: string, status: number)` function returning
  `NextResponse.json({ error: { message } }, { status })`, matching the two shapes in
  data-model.md so every route handler in `app/api/todos/**` uses these instead of
  building responses ad hoc (Constitution II)
- [X] T004 [P] Implement `lib/db.ts`: ensure the `data/` directory exists
  (`fs.mkdirSync('data', { recursive: true })`), open a module-level
  `node:sqlite` `DatabaseSync` at `data/todos.db`, and run
  `CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))`
  on load, per data-model.md's schema; export the connection for `lib/todos.ts` to use

**Checkpoint**: Shared types, response envelope, and a live SQLite connection with
schema exist — user story implementation can begin.

---

## Phase 3: User Story 1 - Add and view to-dos (Priority: P1) 🎯 MVP

**Goal**: A user can add a to-do with a title and see it, and all existing to-dos,
displayed with their completion status; empty/whitespace-only titles are rejected;
an empty list shows an empty-state message.

**Independent Test**: quickstart.md Scenario 1 — add to-dos, confirm they appear with
correct title/status, adding one doesn't alter existing ones, and submitting an
empty/whitespace title is rejected with a "title is required" message.

### Implementation for User Story 1

- [X] T005 [US1] Implement `listTodos(): Todo[]` and `createTodo(title: string): Todo`
  in `lib/todos.ts`, built on `lib/db.ts`'s connection: `listTodos` selects all rows
  ordered by `created_at` ascending (oldest first, per spec Assumptions) and maps
  SQLite's `completed` `0`/`1` to a `boolean`; `createTodo` trims `title` and, if the
  trimmed value is empty, throws/returns a validation failure instead of inserting
  (FR-002 — reject empty/whitespace-only titles without creating a to-do); on success
  it inserts with `completed = 0` (FR-004) and returns the new row mapped to `Todo`
  (depends on T002, T004)
- [X] T006 [US1] Implement `GET` and `POST` handlers in `app/api/todos/route.ts`: `GET`
  calls `listTodos()` and responds `ok(todos)`; `POST` reads the body as `unknown`,
  narrows it to check `title` is a string, calls `createTodo(title)`, and responds
  `ok(todo, 201)` on success or `fail("Title is required.", 400)` when the title is
  missing, not a string, or empty/whitespace-only after trimming — matching
  `contracts/todos-api.md`'s `GET`/`POST /api/todos` contract exactly (depends on T003,
  T005)
- [X] T007 [P] [US1] Create `TodoForm` in `components/TodoForm.tsx` (`'use client'`): a
  controlled text input and submit button that calls an `onAdd(title: string) =>
  Promise<void>` prop, clears the input after a successful add, and shows an inline
  "Title is required." message (FR-002) without calling `onAdd` when the trimmed input
  is empty
- [X] T008 [P] [US1] Create `TodoItem` in `components/TodoItem.tsx` (`'use client'`):
  renders one `Todo`'s title and completion status (e.g. strikethrough or a "Done"
  label when `completed`); no toggle/delete controls yet — those are added in
  US2/US3
- [X] T009 [US1] Create `TodoList` in `components/TodoList.tsx` (`'use client'`): on
  mount, `fetch('/api/todos')` and store the returned `Todo[]` in state; render the
  list via `TodoItem`, or an empty-state message (e.g. "No to-dos yet.") when the list
  is empty (FR-008); render `TodoForm` and wire its `onAdd` to `POST /api/todos`,
  appending the returned `Todo` to local state on success without a full refetch
  (depends on T006, T007, T008)
- [X] T010 [US1] Replace the default `create-next-app` markup in `app/page.tsx` with
  `<TodoList />` (depends on T009)

**Checkpoint**: User Story 1 is fully functional and independently testable — run
quickstart.md Scenario 1.

---

## Phase 4: User Story 2 - Toggle completion status (Priority: P2)

**Goal**: A user can flip any to-do between completed and not completed with a single
action.

**Independent Test**: quickstart.md Scenario 2 — toggle an incomplete to-do to
completed, toggle it back, and confirm rapid repeated toggles leave the display
matching the last action.

### Implementation for User Story 2

- [X] T011 [US2] Implement `toggleTodo(id: number): Todo | null` in `lib/todos.ts`:
  flips the stored `completed` value for the row with the given `id` server-side (the
  server, not the client, decides the new value — research.md §4) and returns the
  updated `Todo`, or `null` if no row matches `id` (depends on T005 — same file)
- [X] T012 [US2] Implement the `PATCH` handler in
  `app/api/todos/[id]/toggle/route.ts`: `await` the route's `ctx.params` (Next.js 16
  async params) to read `id`, respond `fail("Invalid id.", 400)` if it's not a
  positive integer, call `toggleTodo(id)`, respond `fail("Todo not found.", 404)` when
  it returns `null`, else `ok(todo)` — matching `contracts/todos-api.md`'s
  `PATCH /api/todos/:id/toggle` contract exactly (depends on T003, T011)
- [X] T013 [P] [US2] Add a toggle control (checkbox or button) to `TodoItem` in
  `components/TodoItem.tsx` that calls an `onToggle(id: number) => Promise<void>` prop
- [X] T014 [US2] Wire toggling in `components/TodoList.tsx`: pass an `onToggle` handler
  to each `TodoItem` that calls `PATCH /api/todos/:id/toggle` and replaces that item's
  entry in local state with the response's `Todo` (using the server's returned
  `completed` value, not a locally-flipped guess, so rapid repeated clicks always end
  up showing the last server response — Edge Cases) (depends on T012, T013)

**Checkpoint**: User Stories 1 and 2 both work independently — run quickstart.md
Scenario 2.

---

## Phase 5: User Story 3 - Delete a to-do (Priority: P3)

**Goal**: A user can remove any to-do, completed or not, without affecting the rest of
the list.

**Independent Test**: quickstart.md Scenario 3 — delete a to-do from a list of several,
confirm only it disappears, and confirm deleting it again is a harmless no-op.

### Implementation for User Story 3

- [X] T015 [US3] Implement `deleteTodo(id: number): boolean` in `lib/todos.ts`:
  deletes the row with the given `id` and returns whether a row was actually deleted
  (depends on T005/T011 — same file)
- [X] T016 [US3] Implement the `DELETE` handler in `app/api/todos/[id]/route.ts`:
  `await` `ctx.params` to read `id`, respond `fail("Invalid id.", 400)` if it's not a
  positive integer, call `deleteTodo(id)`, respond `fail("Todo not found.", 404)` when
  it returns `false`, else `ok({ id })` — matching `contracts/todos-api.md`'s
  `DELETE /api/todos/:id` contract exactly (depends on T003, T015)
- [X] T017 [P] [US3] Add a delete button to `TodoItem` in `components/TodoItem.tsx`
  that calls an `onDelete(id: number) => Promise<void>` prop
- [X] T018 [US3] Wire deleting in `components/TodoList.tsx`: pass an `onDelete` handler
  to each `TodoItem` that calls `DELETE /api/todos/:id` and removes that item from
  local state whether the response is `200` or `404` (a `404` means it's already
  gone, which is the outcome the user wanted anyway — Edge Cases / contracts/todos-api.md)
  (depends on T016, T017)

**Checkpoint**: All three user stories are independently functional — run
quickstart.md Scenario 3.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Whole-feature validation against the constitution and the spec's success
criteria.

- [X] T019 [P] Run `quickstart.md` Scenarios 1-4 end to end, including the persistence
  check (reload the browser, then stop and restart `npm run dev`) to confirm data
  survives both (FR-007, SC-005); fix any discrepancy found
- [X] T020 [P] Run `npx tsc --noEmit` and confirm no `any` (explicit or implicit)
  appears anywhere in `lib/`, `app/api/`, or `components/` (Constitution III)
- [X] T021 Spot-check every endpoint's success **and** error responses with the `curl`
  commands in `quickstart.md` and confirm each one is valid JSON matching either
  `{ "data": ... }` or `{ "error": { "message": "..." } }` (Constitution II)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; `lib/todos.ts` edits (T011) and
  `TodoItem.tsx` edits (T013) build on files US1 created (T005, T008), so in practice
  run Phase 4 after Phase 3
- **User Story 3 (Phase 5)**: Same relationship to US1 as US2 — run after Phase 3;
  independent of US2 (T015-T018 don't touch toggle code)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### Within Each User Story

- `lib/todos.ts` functions before the route handler that calls them
- Route handler before the `TodoList` wiring that calls it
- `TodoItem` prop additions ([P] with the route handler) before `TodoList` wiring that
  passes those props

### Parallel Opportunities

- T002, T003, T004 (Phase 2) — different files, no interdependencies
- T007, T008 (Phase 3) — different component files
- T013 (Phase 4) and T012 (Phase 4) — different files (route handler vs. component),
  neither depends on the other
- T017 (Phase 5) and T016 (Phase 5) — same reasoning as above
- T019, T020 (Phase 6) — independent validation activities

---

## Parallel Example: User Story 1

```bash
# After T006 (API route) is done, these two can run together:
Task: "Create TodoForm in components/TodoForm.tsx"
Task: "Create TodoItem in components/TodoItem.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002-T004) — blocks everything else
3. Complete Phase 3: User Story 1 (T005-T010)
4. **STOP and VALIDATE**: run quickstart.md Scenario 1
5. This is a usable to-do list (add + view + persistence) even before toggle/delete
   exist

### Incremental Delivery

1. Setup + Foundational → foundation ready (T001-T004)
2. User Story 1 → validate → usable add/view list (MVP)
3. User Story 2 → validate → toggle added
4. User Story 3 → validate → delete added
5. Polish (T019-T021) → confirm constitution compliance and full quickstart pass

---

## Notes

- [P] tasks touch different files and have no unfinished-task dependency between them
- [Story] labels trace every implementation task back to spec.md's user stories
- No test tasks: research.md §6 documents the decision not to introduce a test
  framework for this feature
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before moving on
