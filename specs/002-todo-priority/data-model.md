# Phase 1 Data Model: Todo 중요도(Priority)

## Entity: Todo (extended)

Source: spec.md § Key Entities, FR-001–FR-008. Builds on the `Todo` entity from
001-todo-management (`id`, `title`, `completed`, `createdAt` are unchanged).

| Field | Type (SQLite) | Type (TypeScript) | Constraints / Notes |
|-------|----------------|--------------------|----------------------|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | `number` | Unchanged from 001-todo-management |
| `title` | `TEXT NOT NULL` | `string` | Unchanged from 001-todo-management |
| `completed` | `INTEGER NOT NULL DEFAULT 0` | `boolean` | Unchanged from 001-todo-management |
| `created_at` | `TEXT NOT NULL DEFAULT (datetime('now'))` | `string` (ISO 8601) | Unchanged from 001-todo-management |
| `priority` | `TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low'))` | `Priority` (`"high" \| "medium" \| "low"`) | New. Set on creation from the (optional) request value or the `medium` default (FR-001–FR-003); never modified by toggle/delete (FR-005, FR-006) |

### Schema (SQLite DDL)

Base table (unchanged `CREATE TABLE IF NOT EXISTS`, for a brand-new database):

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low'))
);
```

Migration for an existing database created before this feature (idempotent — safe to run
on every startup; see research.md § 1):

```sql
-- only run when PRAGMA table_info(todos) has no row named 'priority'
ALTER TABLE todos
  ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'
  CHECK (priority IN ('high','medium','low'));
```

SQLite backfills every pre-existing row's `priority` to `'medium'` as part of this
`ALTER TABLE`, satisfying the spec's edge case for pre-existing to-dos.

### Validation rules

- `priority` (request input, `POST /api/todos`): optional. If present, MUST be exactly
  one of `"high"`, `"medium"`, `"low"` (case-sensitive, matching the TypeScript union);
  any other type or value → `400` with the shared error envelope (FR-008). If absent →
  stored value defaults to `"medium"` (FR-003).
- `priority` (database): enforced redundantly by the `CHECK` constraint as a last-resort
  guard; the application-level check in the `POST` handler is what actually produces the
  user-facing `400` (research.md § 2).
- `title`: unchanged from 001-todo-management (trimmed, non-empty).
- `completed`: unchanged — never accepted on create, only flipped by the toggle
  endpoint; toggling never reads or writes `priority`.
- `id`: unchanged.

### State transitions

`priority` has no transitions of its own in this feature's scope — it is set once at
creation and is immutable thereafter (spec Assumptions: editing priority after creation
is out of scope):

```
[create, priority given]   --> priority = given value (validated)
[create, priority omitted] --> priority = "medium"
completed = false --(toggle)--> completed = true      (priority unchanged)
completed = true  --(toggle)--> completed = false      (priority unchanged)
any state --(delete)--> row removed, including its priority (terminal)
```

### Relationships

None — unchanged from 001-todo-management.

## TypeScript types (`lib/types.ts`)

```ts
export type Priority = "high" | "medium" | "low";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  priority: Priority;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

`Priority` is a closed string-literal union (Constitution Principle III — no `any`); the
`POST /api/todos` handler narrows the parsed `unknown` request body's `priority` field
against this union before it ever reaches `createTodo`.
