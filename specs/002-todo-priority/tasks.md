---

description: "Task list for Todo Priority feature implementation"
---

# Tasks: Todo 중요도(Priority)

**Input**: Design documents from `/specs/002-todo-priority/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/todos-api.md, quickstart.md

**Tests**: Not requested in the spec or constitution; research.md §6 confirms the
001-todo-management precedent of validating manually via `quickstart.md`. No test tasks
are included.

**Organization**: Tasks are grouped by user story (spec.md priorities P1/P1/P2/P1) so
each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Maps the task to US1 (explicit selection), US2 (default to Medium), US3
  (visible in list), or US4 (existing behavior + persistence unaffected)
- File paths are exact and match `plan.md`'s Project Structure

---

## Phase 1: Setup

**Purpose**: One-time project prep.

No setup tasks are required. This feature adds no new dependency — `node:sqlite` is
already in use (research.md), `data/*.db` is already gitignored (001-todo-management
T001), and no new tooling/config is needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The `Priority` type, the database column (new tables and existing ones),
and the storage-layer plumbing that every user story depends on.

**⚠️ CRITICAL**: No user story task may start until this phase is complete.

- [X] T001 [P] In `lib/types.ts`, add `export type Priority = "high" | "medium" |
  "low";` and add `priority: Priority` to the `Todo` interface, exactly per
  data-model.md's TypeScript types section; no `any` anywhere (Constitution III)
- [X] T002 [P] In `lib/db.ts`: (a) add `priority TEXT NOT NULL DEFAULT 'medium' CHECK
  (priority IN ('high','medium','low'))` to the `CREATE TABLE IF NOT EXISTS todos`
  statement for brand-new databases; (b) after that statement runs, check `PRAGMA
  table_info(todos)` for a row named `priority`, and if absent, run `ALTER TABLE todos
  ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN
  ('high','medium','low'))` so existing databases from 001-todo-management gain the
  column and every pre-existing row is backfilled to `'medium'` by SQLite automatically
  (data-model.md schema + migration section, research.md §1) — this exact `ALTER TABLE
  ... ADD COLUMN IF NOT EXISTS` syntax is NOT supported by this project's `node:sqlite`
  build, so the `PRAGMA table_info` guard is required, not optional
- [X] T003 In `lib/todos.ts`, add `priority: string` to the `TodoRow` interface and
  `priority: row.priority as Priority` to `mapRow()` so `listTodos`, `createTodo`, and
  `toggleTodo` all return the new field (depends on T001, T002 — same file as later
  US1/US2 tasks, but this base read-mapping change is required before any of them
  compile since `Todo` now requires `priority`)

**Checkpoint**: Types, schema (new + migrated), and row-mapping exist — user story
implementation can begin.

---

## Phase 3: User Story 1 - Todo 생성 시 중요도 지정 (Priority: P1) 🎯 MVP

**Goal**: A user can pick High, Medium, or Low when adding a to-do, and an invalid
value is rejected; the choice is persisted.

**Independent Test**: quickstart.md Scenario 1 — add to-dos with explicit "High" and
"Low" priorities, confirm each is created with that priority (via the API response)
and unrelated to-dos are unaffected.

### Implementation for User Story 1

- [X] T004 [US1] In `lib/todos.ts`, change `createTodo` to `createTodo(title: string,
  priority: Priority): Todo`: include `priority` in the `INSERT INTO todos (title,
  completed, priority) VALUES (?, 0, ?)` call and in the follow-up `SELECT`, returning
  it via the T003 `mapRow` (depends on T003)
- [X] T005 [US1] In `app/api/todos/route.ts`'s `POST` handler, after the existing title
  check, read an optional `priority` field from the narrowed body: if present, it MUST
  be exactly `"high"`, `"medium"`, or `"low"` (case-sensitive) — any other type or
  string value responds `fail("Priority must be one of: high, medium, low.", 400)` per
  contracts/todos-api.md, without inserting a row; when valid, pass it to `createTodo`
  (depends on T004)
- [X] T006 [P] [US1] In `components/TodoForm.tsx`, add a controlled priority selector
  (`<select>` or equivalent) with options "High" / "Medium" / "Low" mapped to
  `"high"` / `"medium"` / `"low"`, held in local state; change the `onAdd` prop type to
  `(title: string, priority: Priority) => Promise<void>` and pass the selected value
  through on submit
- [X] T007 [US1] In `components/TodoList.tsx`, update `handleAdd` to accept
  `(title: string, priority: Priority)` and include `"priority": priority` in the
  `POST /api/todos` request body sent via `fetch` (depends on T005, T006)

**Checkpoint**: User Story 1 is fully functional and independently testable — run
quickstart.md Scenario 1.

---

## Phase 4: User Story 2 - 중요도 미선택 시 기본값 적용 (Priority: P2)

**Goal**: Creating a to-do without picking a priority stores `"medium"` (FR-003).

**Independent Test**: quickstart.md Scenario 2 — add a to-do while leaving the
selector at its default, confirm the created to-do's priority is `"medium"`.

### Implementation for User Story 2

- [X] T008 [US2] In `app/api/todos/route.ts`'s `POST` handler, when the request body's
  `priority` field is `undefined` (omitted), use `"medium"` as the value passed to
  `createTodo` instead of rejecting the request — the closed-set validation from T005
  still applies to any *provided* value, this only covers the omitted case (FR-003)
  (depends on T005 — same file, same handler)
- [X] T009 [P] [US2] In `components/TodoForm.tsx`, confirm/set the priority selector's
  initial state to `"medium"` so a submission where the user never touches the selector
  sends `"medium"` (depends on T006 — same file)

**Checkpoint**: User Stories 1 and 2 both work independently — run quickstart.md
Scenario 2.

---

## Phase 5: User Story 3 - 목록에서 중요도 확인 (Priority: P1)

**Goal**: Every to-do in the list visibly shows its priority, styled distinctly but
consistent with the existing minimal UI (research.md §5).

**Independent Test**: quickstart.md Scenario 3 — with High, Medium, and Low to-dos
present, confirm each shows its own priority label in the list without extra clicks.

### Implementation for User Story 3

- [X] T010 [P] [US3] In `app/globals.css`, add three low-saturation priority color
  tokens following the existing `--color-*` pattern (e.g. `--priority-high`,
  `--priority-high-bg`, `--priority-medium`, `--priority-medium-bg`, `--priority-low`,
  `--priority-low-bg`) and register them under `@theme inline` alongside the existing
  tokens — do not reuse `--danger` or `--primary`, which already carry other meanings
  (research.md §5)
- [X] T011 [US3] In `components/TodoItem.tsx`, render `todo.priority` as a small text
  badge ("High" / "Medium" / "Low") next to the title, styled with the T010 tokens
  (depends on T010; also depends on T003/T004 for `todo.priority` to exist on the data
  the component already receives via its existing `todo: Todo` prop — no new prop
  plumbing needed through `TodoList`)

**Checkpoint**: All three of US1-US3 are independently functional — run quickstart.md
Scenario 3.

---

## Phase 6: User Story 4 - 기존 기능 및 데이터 지속성 유지 (Priority: P1)

**Goal**: Toggle and delete keep working exactly as before, unaffected by priority; all
priority data (new and pre-existing) survives reloads and restarts.

**Independent Test**: quickstart.md Scenario 4 (toggle/delete a prioritized to-do,
reload, restart) and Scenario 5 (pre-existing database without a `priority` column).

### Implementation for User Story 4

- [X] T012 [P] [US4] Confirm `app/api/todos/[id]/route.ts` (`DELETE`) and
  `app/api/todos/[id]/toggle/route.ts` (`PATCH`) need no code changes — both already
  return whatever `deleteTodo`/`toggleTodo` in `lib/todos.ts` produce, which now
  includes `priority` unchanged via the T003 `mapRow` update; verify by running
  quickstart.md Scenario 4 steps 1-2 (toggle a "High" to-do, confirm it still shows
  "High"; delete a "Low" to-do, confirm the rest are unaffected)
- [X] T013 [US4] Run quickstart.md Scenario 4 steps 3-4: reload the browser, then stop
  and restart `npm run dev`, confirming every to-do's title, completion state, and
  priority are unchanged after both (FR-007, SC-004)
- [X] T014 [US4] Run quickstart.md Scenario 5 against a `data/todos.db` created before
  this feature (pre-priority schema): confirm the T002 migration adds the `priority`
  column without error on startup and every pre-existing row reads back as
  `priority: "medium"` (Edge Cases, research.md §1)

**Checkpoint**: All four user stories are independently functional — run quickstart.md
Scenarios 4 and 5 (in addition to 1-3).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Whole-feature validation against the constitution and the spec's success
criteria.

- [X] T015 [P] Run `npx tsc --noEmit` and confirm no `any` (explicit or implicit) was
  introduced anywhere in `lib/`, `app/api/`, or `components/` (Constitution III)
- [X] T016 [P] Spot-check `POST /api/todos` with the `curl` commands in quickstart.md —
  a valid explicit `priority`, an omitted `priority`, and an invalid `priority`
  (e.g. `"urgent"`) — and confirm all three responses match either `{ "data": ... }` or
  `{ "error": { "message": "..." } }` (Constitution II)
- [X] T017 Run quickstart.md Scenarios 1-5 end to end in one pass to confirm the full
  feature (selection, default, display, and regression/persistence) works together;
  fix any discrepancy found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None — no tasks
- **Foundational (Phase 2)**: BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational; T008 edits the same `POST`
  handler as T005 and T009 edits the same file as T006, so in practice run Phase 4
  after Phase 3
- **User Story 3 (Phase 5)**: Depends on Foundational (T003/T004 for `todo.priority` to
  exist); independent of US2 — can run in parallel with Phase 4 by a different
  developer
- **User Story 4 (Phase 6)**: Validation-only phase; depends on Phases 2-5 all being
  complete (it exercises the toggle/delete/migration paths those phases created)
- **Polish (Phase 7)**: Depends on all four user stories being complete

### Within Each User Story

- `lib/todos.ts` changes before the route handler that calls them
- Route handler changes before the `TodoForm`/`TodoList` wiring that calls them
- `TodoForm` selector (T006) before its default-state confirmation (T009) and before
  `TodoList` wiring that reads the selected value (T007)

### Parallel Opportunities

- T001, T002 (Phase 2) — different files, no interdependency
- T006 (Phase 3) and T005 (Phase 3) — different files (component vs. route handler)
- T009 (Phase 4) — independent of T008 (component vs. route handler)
- T010 (Phase 5) — independent of Phase 4 entirely (styling vs. default-value logic)
- T012 (Phase 6) — independent validation, can run alongside T013/T014
- T015, T016 (Phase 7) — independent validation activities

---

## Parallel Example: User Story 1

```bash
# After T004 (data layer) is done, these two can run together:
Task: "Validate priority in app/api/todos/route.ts POST handler"
Task: "Add priority selector to components/TodoForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T003) — blocks everything else
2. Complete Phase 3: User Story 1 (T004-T007)
3. **STOP and VALIDATE**: run quickstart.md Scenario 1
4. Users can already choose a priority and have it persisted, even before the default
   or the visible badge exist

### Incremental Delivery

1. Foundational → foundation ready (T001-T003)
2. User Story 1 → validate → explicit priority selection works (MVP)
3. User Story 2 → validate → omitted priority defaults to Medium
4. User Story 3 → validate → priority visible in the list
5. User Story 4 → validate → toggle/delete/persistence/migration all unaffected
6. Polish (T015-T017) → confirm constitution compliance and full quickstart pass

### Parallel Team Strategy

With multiple developers, after Foundational (Phase 2):

- Developer A: User Story 1 (Phase 3), then User Story 2 (Phase 4, same files)
- Developer B: User Story 3 (Phase 5) — touches different files (`globals.css`,
  `TodoItem.tsx`), no conflict with A until both are merged
- User Story 4 (Phase 6) is validation-only and runs last, after both merge

---

## Notes

- [P] tasks touch different files and have no unfinished-task dependency between them
- [Story] labels trace every implementation task back to spec.md's user stories
- No test tasks: research.md §6 documents the decision not to introduce a test
  framework, consistent with 001-todo-management
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before moving on
