# Phase 0 Research: Todo 중요도(Priority)

The user's plan input already resolved most technical decisions explicitly (TypeScript
union type, SQLite column + default, validation location, unchanged toggle/delete). The
items below are the decisions still needed to implement that input safely on the
existing `node:sqlite`-backed project, each verified against the actual runtime.

## 1. Adding `priority` to an existing SQLite table without losing data

- **Decision**: On startup, after `CREATE TABLE IF NOT EXISTS todos (...)` (without
  `priority`), check `PRAGMA table_info(todos)` for a `priority` column; if absent, run
  `ALTER TABLE todos ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority
  IN ('high','medium','low'))`.
- **Rationale**: Verified directly against the project's `node:sqlite` build
  (`DatabaseSync`, bundled SQLite 3.53.4): `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
  raises a syntax error on this build, so the standard `IF NOT EXISTS` shorthand isn't
  available. A `PRAGMA table_info` check is portable, idempotent across repeated server
  restarts, and — critically — SQLite backfills every existing row with the column's
  `DEFAULT` value when a `NOT NULL DEFAULT ...` column is added via `ALTER TABLE`,
  which directly satisfies the spec's edge case ("기존 데이터가 있다면 priority가 없는
  기존 Todo는 Medium으로 처리한다") with no separate backfill `UPDATE` needed. Confirmed
  by inserting a row after migration and reading back `priority: 'medium'`.
- **Alternatives considered**:
  - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — rejected; not supported by this
    project's `node:sqlite`/SQLite build (confirmed by direct test, see above).
  - Drop and recreate the table — rejected; destroys existing to-dos, unacceptable for
    an app whose whole point is persistence (spec FR-007, 001-todo-management FR-007).
  - A separate migration runner/tool — rejected as disproportionate for one additive
    column on one table (same reasoning as 001-todo-management research.md § 2).

## 2. Enforcing the closed set of priority values

- **Decision**: Validate `priority` in the `POST /api/todos` Route Handler (reject
  anything other than `"high" | "medium" | "low"` with `400`, same pattern as the
  existing title validation), and *additionally* declare a `CHECK (priority IN
  ('high','medium','low'))` constraint on the column as a database-level safety net.
- **Rationale**: FR-008 requires that invalid priority values are never stored.
  Application-level validation is what produces the clean, constitution-mandated JSON
  `400` error envelope (a raw `CHECK` constraint violation surfaces as a generic SQLite
  error, not a friendly message); the `CHECK` constraint is defense-in-depth against any
  future code path that writes to the table without going through `createTodo`.
  Verified directly: the `CHECK` constraint rejects an invalid `INSERT`/`UPDATE` and
  survives being added via `ALTER TABLE ADD COLUMN` on an existing table.
- **Alternatives considered**: Silently clamping an invalid value to `"medium"` instead
  of rejecting it — the spec explicitly allows either behavior ("거부하거나 기본값으로
  대체") but rejecting was chosen for consistency with how the existing `POST
  /api/todos` handler already treats invalid `title` (400, not silent substitution),
  keeping the API's error behavior predictable across fields.

## 3. Request shape for `POST /api/todos`

- **Decision**: `priority` becomes an **optional** field on the existing `POST
  /api/todos` body: `{ title: string; priority?: "high" | "medium" | "low" }`. Omitting
  it (or sending `undefined`) defaults to `"medium"`; sending any other value (wrong
  type, or a string outside the closed set) is a `400`.
- **Rationale**: Directly implements FR-002/FR-003 (selectable, defaults to Medium when
  omitted) without adding a second endpoint or a separate "set priority" call. Keeps the
  single existing creation flow (User Story 1 in 001-todo-management) intact.
- **Alternatives considered**: Requiring `priority` on every request and defaulting on
  the client instead — rejected; it would let a buggy/omitted client field silently skip
  the server-side default, and the spec assigns the default-to-Medium behavior to "the
  system," not the client.

## 4. `GET` / toggle / delete response shape

- **Decision**: `priority` is added to the `Todo` shape returned by `GET /api/todos`,
  `POST /api/todos`, and `PATCH /api/todos/:id/toggle`. `DELETE` continues to return
  only `{ id }`. No new endpoints or query parameters (e.g., no filter/sort-by-priority
  endpoint) are introduced.
- **Rationale**: FR-004 requires the list to show each to-do's priority, which only
  requires including the existing stored value in the already-returned `Todo` object.
  The spec's Assumptions explicitly place priority-based sorting/filtering out of scope
  for this feature, and toggle/delete must keep their current behavior unchanged (FR-005,
  FR-006, spec User Story 4) — priority is simply carried through, never touched by
  those two handlers.
- **Alternatives considered**: A dedicated `PATCH /api/todos/:id/priority` endpoint to
  change priority after creation — rejected; out of scope per spec Assumptions ("생성
  이후 기존 Todo의 중요도를 수정하는 기능은 이번 범위에 포함하지 않는다").

## 5. Visually distinguishing priority without breaking the minimal UI

- **Decision**: Represent priority as a small text badge (e.g. "High" / "Medium" /
  "Low") next to the to-do title in `TodoItem`, colored with three new low-saturation
  CSS custom properties added alongside the existing palette in `app/globals.css`
  (following the same `--color-*` token pattern already used for `--danger`,
  `--primary`, etc.), rather than introducing new UI chrome (icons, borders, badges with
  strong fills, etc.).
- **Rationale**: The user's plan input explicitly asks for "서로 구분되지만 너무
  과하게 튀지 않도록" (distinguishable but not too flashy) while keeping "현재의
  미니멀한 UI 스타일." The existing design system already reserves a strong, saturated
  color (`--danger`, red) for a *destructive/alerting* meaning (used only on hover for
  the delete button); reusing that intensity for a routine attribute like "High
  priority" would visually overload the list. Low-saturation, text-weight-differentiated
  badges match the existing muted/subtle tokens (`--muted`, `--border-subtle`) already
  used for secondary information (e.g., the "N left · N total" footer).
- **Alternatives considered**: Reusing `--danger`/`--primary` directly for
  high/medium — rejected, both already carry an existing meaning (destructive action,
  primary action) that a priority label shouldn't borrow. A colored left-border stripe
  on the whole row — rejected as a heavier visual change than a small inline badge for
  a feature the spec scopes to "확인할 수 있어야 한다" (must be able to check), not
  "must be the dominant visual element."

## 6. Testing approach

- **Decision**: No automated test framework is introduced, consistent with
  001-todo-management. Verification is manual, driven by `quickstart.md`.
- **Rationale**: Neither this spec nor the constitution requires a test framework, and
  none exists in `package.json` today; introducing one now would be scope beyond a
  single-field extension of an existing feature.
- **Alternatives considered**: Introducing Vitest for the new validation branch —
  reasonable in general, but rejected here to stay consistent with the precedent set in
  001-todo-management and avoid mixed scope in this feature.
