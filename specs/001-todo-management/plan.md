# Implementation Plan: Todo Management

**Branch**: `001-todo-management` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-todo-management/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Single-user to-do list: add, view, toggle completion, and delete to-dos, persisted in a
SQLite file so the list survives reloads and restarts. Implemented as a Next.js App
Router app with Route Handlers (`app/api/todos/**/route.ts`) backing a client-side page
that fetches and renders the list, all responses returned as a uniform JSON envelope.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), Node.js 24 runtime

**Primary Dependencies**: Next.js 16.3.5 (App Router, Route Handlers), React 19.2.8 /
React DOM 19.2.8, `node:sqlite` (Node's built-in synchronous SQLite module — no new
native dependency required)

**Storage**: SQLite file on disk (`data/todos.db`), accessed via `node:sqlite`'s
`DatabaseSync`

**Testing**: No automated test framework is present in the project and none is requested
by the spec or constitution; correctness is validated manually via the scenarios in
`quickstart.md`. (Decision recorded in research.md.)

**Target Platform**: Local/self-hosted Node.js server (single-user, no auth per spec
Assumptions)

**Project Type**: Web application — single Next.js project combining frontend pages and
JSON API routes in one `app/` tree (no separate frontend/backend projects)

**Performance Goals**: Not performance-sensitive; SC-001 requires a new to-do to appear
in under 2 seconds, easily met by a local SQLite write + client re-render

**Constraints**: Data MUST persist across browser reloads and app restarts (FR-007,
SC-005); single shared list, no authentication/authorization (per spec Assumptions)

**Scale/Scope**: Single user, small dataset (personal to-do list scale); 4 API
operations (create, list, toggle, delete) and one list page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Next.js App Router + TypeScript | All routes/components under `app/`, `.ts`/`.tsx` only, Route Handlers via `route.ts` | PASS |
| II. Unified JSON API Responses | Every `app/api/**/route.ts` handler returns the same `{ data }` / `{ error: { message } }` JSON envelope on all paths, including errors | PASS |
| III. No `any` Types | Request bodies parsed as `unknown` and narrowed; `Todo`, request/response types explicitly declared; strict mode stays on | PASS |

No violations — Complexity Tracking section left empty.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
├── layout.tsx                # existing root layout
├── page.tsx                  # Todo list page (renders client list component)
├── globals.css                # existing
└── api/
    └── todos/
        ├── route.ts           # GET (list all), POST (create)
        └── [id]/
            ├── route.ts        # DELETE (remove)
            └── toggle/
                └── route.ts     # PATCH (flip completion status)

lib/
├── db.ts                      # node:sqlite DatabaseSync connection + schema init
├── todos.ts                   # data-access functions: listTodos, createTodo,
│                               #   toggleTodo, deleteTodo
├── api-response.ts            # shared JSON envelope helpers (ok(), fail())
└── types.ts                   # Todo, ApiSuccess<T>, ApiError types

components/
├── TodoList.tsx                # 'use client' — fetches/renders list, owns state
├── TodoForm.tsx                # add-todo input + submit
└── TodoItem.tsx                # single row: toggle checkbox + delete button

data/
└── todos.db                    # SQLite file, created at runtime, gitignored
```

**Structure Decision**: Single Next.js App Router project (no separate
frontend/backend projects — the App Router's `app/api/**/route.ts` Route Handlers
serve as the backend inside the same app). API logic lives under `app/api/todos/`,
shared data-access/typing code lives in `lib/`, and presentational client components
live in `components/`, all at the repository root alongside the existing `app/`
directory from the initial `create-next-app` scaffold.

## Post-Design Constitution Check

*Re-evaluated after Phase 1 design (data-model.md, contracts/, quickstart.md).*

| Principle | Check | Status |
|-----------|-------|--------|
| I. Next.js App Router + TypeScript | Final layout only adds `route.ts` files under `app/api/` and `.tsx` client components — no Pages Router, no `.js` files | PASS |
| II. Unified JSON API Responses | `contracts/todos-api.md` defines one envelope (`{ data }` / `{ error: { message } }`) used by all four endpoints on every status code | PASS |
| III. No `any` Types | `data-model.md` / `lib/types.ts` define `Todo`, `ApiSuccess<T>`, `ApiError`; request bodies validated from `unknown` via narrowing helpers, no `any` introduced | PASS |

No new violations introduced during design. Complexity Tracking remains empty.

## Complexity Tracking

*No Constitution Check violations — this section intentionally left empty.*
