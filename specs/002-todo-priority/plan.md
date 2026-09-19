# Implementation Plan: Todo 중요도(Priority)

**Branch**: `002-todo-priority` | **Date**: 2026-09-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-todo-priority/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a `priority` attribute (`high` | `medium` | `low`, default `medium`) to the existing
Todo entity. Users choose a priority when creating a to-do (or accept the default);
every to-do's priority is shown in the list. Implemented by extending the existing
`node:sqlite` schema, `lib/todos.ts` data-access functions, and the `POST /api/todos`
Route Handler to accept/validate/persist `priority`, and by adding a minimal priority
selector to `TodoForm` and a small priority badge to `TodoItem` — no new endpoints, no
change to existing toggle/delete behavior.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), Node.js 24 runtime (`node --version`
→ v24.20.0)

**Primary Dependencies**: Next.js 16.3.5 (App Router, Route Handlers), React 19.2.8 /
React DOM 19.2.8, `node:sqlite` (already in use — no new dependency needed)

**Storage**: Same SQLite file (`data/todos.db`) accessed via `node:sqlite`'s
`DatabaseSync`; `todos` table gains a `priority` column (see data-model.md)

**Testing**: No automated test framework is present in the project (consistent with
001-todo-management) and none is requested by this spec or the constitution;
correctness is validated manually via `quickstart.md`.

**Target Platform**: Local/self-hosted Node.js server (single-user, no auth — unchanged
from 001-todo-management)

**Project Type**: Web application — same single Next.js project (frontend pages + JSON
API routes in one `app/` tree); this feature extends existing files, adds none

**Performance Goals**: Not performance-sensitive; SC-001 requires selecting/saving a
priority in under 10 seconds, trivially met by a local SQLite write + client re-render

**Constraints**: Priority MUST persist across reloads/restarts (FR-007); only `high` /
`medium` / `low` are valid values, enforced both in the API and at the database layer
(FR-008); existing add/view/toggle/delete behavior MUST NOT regress (FR-005, FR-006);
existing rows without a priority MUST read back as `medium` after migration (Edge Cases)

**Scale/Scope**: Same single-user, small-dataset scale as 001; extends 1 existing
endpoint (`POST /api/todos`), unchanged response shape (with one new field) on
`GET /api/todos` and the toggle endpoint; 2 components touched (`TodoForm`, `TodoItem`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Next.js App Router + TypeScript | All changes stay inside existing `app/**/route.ts` handlers and `.tsx` components under `app/`/`components/`; no Pages Router, no `.js` files | PASS |
| II. Unified JSON API Responses | `POST /api/todos` keeps returning `{ data }` on success and `{ error: { message } }` on every error path (including the new priority-validation error); `GET`/toggle keep the same envelope with `priority` added to the payload | PASS |
| III. No `any` Types | New `Priority` union type (`"high" \| "medium" \| "low"`) added to `lib/types.ts`; request body still parsed as `unknown` and narrowed; no `any` introduced | PASS |

No violations — Complexity Tracking section left empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-todo-priority/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                # unchanged
├── page.tsx                  # unchanged
├── globals.css                # + priority color tokens (high/medium/low)
└── api/
    └── todos/
        ├── route.ts           # POST: accept + validate optional `priority`; GET unchanged (mapRow now includes priority)
        └── [id]/
            ├── route.ts        # unchanged (delete unaffected by priority)
            └── toggle/
                └── route.ts     # unchanged (toggle unaffected by priority)

lib/
├── db.ts                      # + idempotent `priority` column migration on existing `todos` table
├── todos.ts                   # createTodo(title, priority?) + mapRow includes priority; toggle/delete unchanged
├── api-response.ts            # unchanged
└── types.ts                   # + Priority union type; Todo gains `priority: Priority`

components/
├── TodoList.tsx                # passes selected priority through to onAdd
├── TodoForm.tsx                # + priority selector (defaults to "medium")
└── TodoItem.tsx                # + priority badge next to the title

data/
└── todos.db                    # unchanged location; existing rows backfilled to "medium" on next server start
```

**Structure Decision**: No new projects or top-level directories. This feature is a
targeted extension of the existing single Next.js App Router project from
001-todo-management: the same `lib/` data-access layer, the same `app/api/todos/**`
Route Handlers, and the same `components/` React components gain a `priority` field/UI,
with no structural changes.

## Post-Design Constitution Check

*Re-evaluated after Phase 1 design (data-model.md, contracts/, quickstart.md).*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Next.js App Router + TypeScript | Final design only edits existing `route.ts` handlers and `.tsx` components; no new router surface, no `.js` files | PASS |
| II. Unified JSON API Responses | `contracts/todos-api.md` (updated) shows `priority` added to the `Todo` payload on every success response and a new `400` case for invalid `priority`, both still using the `{ data }` / `{ error: { message } }` envelope | PASS |
| III. No `any` Types | `data-model.md` defines `Priority` as a closed string-literal union; `POST` body validation narrows `unknown` → `{ title: string; priority?: Priority }` without `any` | PASS |

No new violations introduced during design. Complexity Tracking remains empty.

## Complexity Tracking

*No Constitution Check violations — this section intentionally left empty.*
