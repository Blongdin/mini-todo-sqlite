# API Contract: Todos

Base path: `/api/todos`

All responses are JSON with `Content-Type: application/json`, matching one of the two
envelopes from `data-model.md`:

- Success: `{ "data": <payload> }`
- Error: `{ "error": { "message": "<human-readable message>" } }`

This applies to **every** status code, including 4xx/5xx (Constitution Principle II).

---

## `GET /api/todos`

List all to-dos, oldest first.

**Request**: no params, no body.

**Response `200`**:

```json
{ "data": [
  { "id": 1, "title": "Buy milk", "completed": false, "createdAt": "2026-09-16T01:23:45.000Z" }
] }
```

An empty list returns `{ "data": [] }` — the frontend renders the empty-state message
(FR-008) when this array is empty.

---

## `POST /api/todos`

Create a new to-do.

**Request body**:

```json
{ "title": "Buy milk" }
```

**Response `201`** (title valid after trim):

```json
{ "data": { "id": 2, "title": "Buy milk", "completed": false, "createdAt": "..." } }
```

**Response `400`** (title missing, not a string, or empty/whitespace-only —
FR-002, Edge Cases):

```json
{ "error": { "message": "Title is required." } }
```

---

## `PATCH /api/todos/:id/toggle`

Flip the completion status of the to-do with the given `id` (FR-005). No request body.

**Response `200`** (found):

```json
{ "data": { "id": 2, "title": "Buy milk", "completed": true, "createdAt": "..." } }
```

**Response `400`** (`:id` is not a positive integer):

```json
{ "error": { "message": "Invalid id." } }
```

**Response `404`** (no to-do with that id):

```json
{ "error": { "message": "Todo not found." } }
```

---

## `DELETE /api/todos/:id`

Delete the to-do with the given `id` (FR-006).

**Response `200`** (found and deleted):

```json
{ "data": { "id": 2 } }
```

**Response `400`** (`:id` is not a positive integer):

```json
{ "error": { "message": "Invalid id." } }
```

**Response `404`** (no to-do with that id — e.g., already deleted by a prior request,
per Edge Cases):

```json
{ "error": { "message": "Todo not found." } }
```

The frontend treats a `404` on delete the same as a successful delete from the user's
point of view: it removes the item from local state (or simply re-fetches the list),
since the end state — the to-do is gone — matches what the user wanted.
