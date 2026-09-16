# Phase 1 Data Model: Todo Management

## Entity: Todo

Source: spec.md § Key Entities, FR-001–FR-008.

| Field | Type (SQLite) | Type (TypeScript) | Constraints / Notes |
|-------|----------------|--------------------|----------------------|
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | `number` | Stable unique identifier, assigned on insert |
| `title` | `TEXT NOT NULL` | `string` | Required; trimmed non-empty (FR-002). Free text, no length limit specified |
| `completed` | `INTEGER NOT NULL DEFAULT 0` | `boolean` | Stored as `0`/`1`; defaults to `0` (not completed) on creation (FR-004); mapped to/from `boolean` at the `lib/todos.ts` boundary |
| `created_at` | `TEXT NOT NULL DEFAULT (datetime('now'))` | `string` (ISO 8601) | Set once on insert; used only to order the list oldest-first (per spec Assumptions) — not exposed as a required API field beyond ordering |

### Schema (SQLite DDL)

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Validation rules

- `title`: reject when, after trimming, the value is empty (FR-002, Edge Cases —
  whitespace-only title). Validation happens server-side in the `POST /api/todos`
  handler before any insert; the raw `unknown` request body is narrowed to
  `{ title: string }` first (Constitution III — no `any`).
- `completed`: never accepted directly from the client on create (always defaults to
  `false`/`0`, FR-004); only changed via the toggle endpoint, which flips the current
  stored value server-side (see research.md § 4).
- `id`: path parameter on toggle/delete is parsed as a positive integer; a
  non-numeric or missing id yields a 400 error using the shared error envelope.

### State transitions

```
[create] --> completed = false
completed = false --(toggle)--> completed = true
completed = true  --(toggle)--> completed = false
any state --(delete)--> row removed (terminal; idempotent — deleting an
                                       already-absent id returns 404, which the
                                       client treats as "already gone" and removes
                                       locally, per Edge Cases)
```

### Relationships

None — each `Todo` is independent; no foreign keys or associations (per spec
Assumptions: single shared list, no per-user separation).

## TypeScript types (`lib/types.ts`)

```ts
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
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

These are the only shapes returned by any `app/api/todos/**/route.ts` handler,
satisfying Constitution Principle II (unified JSON envelope) and Principle III (no
`any` — callers narrow via `'data' in response`).
