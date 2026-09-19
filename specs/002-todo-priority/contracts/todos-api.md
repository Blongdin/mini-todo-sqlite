# API Contract: Todos (updated for Priority)

Base path: `/api/todos`. This supersedes `001-todo-management/contracts/todos-api.md`
for the `Todo` payload shape and the `POST` endpoint; `PATCH .../toggle` and `DELETE`
request/error shapes are unchanged other than the payload now including `priority`.

All responses are JSON with `Content-Type: application/json`, matching one of the two
envelopes from `data-model.md`:

- Success: `{ "data": <payload> }`
- Error: `{ "error": { "message": "<human-readable message>" } }`

This applies to **every** status code, including 4xx/5xx (Constitution Principle II).

---

## `GET /api/todos`

List all to-dos, oldest first. Unchanged behavior; `priority` is now included on every
item.

**Request**: no params, no body.

**Response `200`**:

```json
{ "data": [
  { "id": 1, "title": "Buy milk", "completed": false, "createdAt": "2026-09-19T01:23:45.000Z", "priority": "medium" }
] }
```

An empty list returns `{ "data": [] }` (unchanged).

---

## `POST /api/todos`

Create a new to-do. `priority` is a new, optional field.

**Request body**:

```json
{ "title": "Buy milk", "priority": "high" }
```

`priority` may be omitted entirely:

```json
{ "title": "Buy milk" }
```

**Response `201`** (title valid after trim; `priority` given and valid, or omitted):

```json
{ "data": { "id": 2, "title": "Buy milk", "completed": false, "createdAt": "...", "priority": "high" } }
```

Omitting `priority`:

```json
{ "data": { "id": 3, "title": "Walk the dog", "completed": false, "createdAt": "...", "priority": "medium" } }
```

**Response `400`** (title missing, not a string, or empty/whitespace-only — unchanged
from 001-todo-management):

```json
{ "error": { "message": "Title is required." } }
```

**Response `400`** (`priority` present but not one of `"high" | "medium" | "low"` — new,
FR-008):

```json
{ "error": { "message": "Priority must be one of: high, medium, low." } }
```

---

## `PATCH /api/todos/:id/toggle`

Flip the completion status of the to-do with the given `id`. Behavior unchanged; the
returned `Todo` now includes its (untouched) `priority`.

**Response `200`** (found):

```json
{ "data": { "id": 2, "title": "Buy milk", "completed": true, "createdAt": "...", "priority": "high" } }
```

**Response `400`** (`:id` is not a positive integer) — unchanged:

```json
{ "error": { "message": "Invalid id." } }
```

**Response `404`** (no to-do with that id) — unchanged:

```json
{ "error": { "message": "Todo not found." } }
```

---

## `DELETE /api/todos/:id`

Delete the to-do with the given `id`. Fully unchanged — `priority` plays no role in
deletion and is not part of the response.

**Response `200`** (found and deleted):

```json
{ "data": { "id": 2 } }
```

**Response `400`** / **Response `404`** — unchanged from 001-todo-management.
