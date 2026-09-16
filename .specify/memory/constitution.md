<!--
Sync Impact Report
- Version change: (unratified template) → 1.0.0
- Modified principles: none (initial ratification)
- Added principles:
  - I. Next.js App Router + TypeScript
  - II. Unified JSON API Responses
  - III. No `any` Types
- Added sections: Governance (amendment/versioning/compliance rules)
- Removed sections: [SECTION_2_NAME]/[SECTION_2_CONTENT] and [SECTION_3_NAME]/[SECTION_3_CONTENT]
  placeholders — omitted because no additional constraints or workflow rules beyond the three
  principles were specified; re-add if the project later adopts them.
- Templates requiring follow-up: none checked in this run (constitution content only, per scope
  guard — dependent templates read this file at runtime and are not modified here).
- Follow-up TODOs: none
-->

# mini-todo-sqlite Constitution

## Core Principles

### I. Next.js App Router + TypeScript
This project MUST be built with Next.js using the App Router (the `app/` directory
convention), not the Pages Router. All source files MUST be written in TypeScript
(`.ts`/`.tsx`), not JavaScript. New routes, layouts, and server/client components MUST
follow App Router conventions (e.g., `route.ts` handlers, `page.tsx`, `layout.tsx`) as
documented for the Next.js version pinned in `package.json`.
Rationale: standardizing on one router model and one language avoids mixed-convention
code paths and keeps routing, data-fetching, and type information consistent across the
codebase.

### II. Unified JSON API Responses
Every API route (all handlers under `app/**/route.ts`) MUST return a JSON response with a
consistent shape, on both success and error paths. Handlers MUST NOT return plain text,
HTML, or bare unstructured values. Error responses MUST still be valid JSON and carry an
appropriate HTTP status code.
Rationale: a single, predictable response envelope lets clients parse every API response
the same way and simplifies error handling on the frontend.

### III. No `any` Types
Code MUST NOT use the `any` type. Where a type is genuinely unknown, use `unknown` with a
narrowing check, a precise union/interface, or generics instead. TypeScript strict mode
MUST remain enabled, and reviews MUST reject new `any` usage (including implicit `any`)
without an explicit, justified exception.
Rationale: `any` disables the type checker exactly where bugs are most likely to hide;
banning it keeps TypeScript's guarantees meaningful across the codebase.

## Governance

This constitution supersedes any conflicting convention, template default, or ad-hoc
practice used elsewhere in this repository. Amendments are made by editing this file,
recording the change in the Sync Impact Report at the top of the file, and bumping the
version per semantic versioning:
- MAJOR: a principle is removed or redefined in a backward-incompatible way.
- MINOR: a new principle or materially expanded guidance is added.
- PATCH: wording, clarification, or typo fixes with no semantic change.

All feature specs, plans, and code reviews MUST verify compliance with these principles
before merging. Any deviation MUST be justified in writing in the relevant plan or PR
description; unjustified complexity or convention drift MUST be rejected.

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
