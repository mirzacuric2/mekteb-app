# AGENTS.md - Mekteb App Development Guide

This file defines working rules for AI agents and contributors in `mekteb-app`.

Primary detailed guidance is in `.cursor/rules/*.mdc`; this file is the high-level index.

## Scope

Applies to the whole monorepo:
- `server/` (Express + Prisma)
- `web/` (React + Vite + TanStack Query + Tailwind)

## Core Principles

- Keep changes small, focused, and consistent with existing patterns.
- Prefer reusable components/hooks over one-off logic.
- Do not break role/scope access rules (`SUPER_ADMIN`, `ADMIN`, `USER`).
- Avoid page-level horizontal scroll; scrolling should happen in intended inner containers.
- Treat schema/API contracts as source of truth and update frontend/backend together.

## Monorepo Conventions

- Frontend features live under `web/src/features/*`.
- Shared UI primitives live under `web/src/components/ui/*`.
- Backend endpoints are organized by module in `server/src/modules/*`.
- Use existing query/mutation patterns in feature panels before introducing new architecture.
- Migration context:
  - Frontend can reference `../mekteb-ui/` for expected UX/behavior during migration.
  - Backend/DB can reference `../mekteb-backend/` for legacy logic, seed behavior, and data expectations.

## Backend Rules (`server/`)

- Validate request payloads with `zod` in route handlers.
- Enforce role and community access checks for every CRUD endpoint.
- Keep CRUD routes and response shapes consistent per entity.
- Use UUID as the standard ID format and keep it consistent across entities.
- When adding DB fields:
  1. Update `server/prisma/schema.prisma`
  2. Run `npm run prisma:generate -w server`
  3. Create/apply migration (`npm run prisma:migrate -w server`)
  4. Update relevant `zod` payload schemas and route mappings
  5. Update seed data only when needed
- Keep route responses stable unless the frontend is updated in the same change.

## Frontend Rules (`web/`)

- Use TypeScript types for API responses and form payloads.
- Keep panel components orchestrating state; move rendering blocks to separated components.
- Avoid large components/functions; split into reusable blocks/hooks.
- Prefer existing shared components:
  - `DataTable`, `EntityListToolbar`, `PaginationControls`, dialogs/drawers.
- Preferred interaction patterns:
  - side drawers for details
  - modal dialogs for create/update
  - confirmation modal/dialog for delete
- Forms:
  - Use `react-hook-form` + `zod` schema validation.
  - Keep field validation messages explicit and user-facing.
- Keep responsive behavior intentional:
  - Fixed content container on desktop.
  - Table can scroll horizontally inside card; page should not.

## UX/UI Guardrails

- Breadcrumb indicates current page clearly and stays visible above page content.
- Table action column should stay aligned and stable.
- Row interactions should not conflict with action button interactions.
- Use consistent spacing (`gap`, `px`, `py`) across feature cards and toolbars.

## Data & Security Notes

- Do not log sensitive values (passwords, tokens, SSN).
- For SSN and similar sensitive fields:
  - Validate format/length in API and forms.
  - Keep exposure minimal in UI.
  - Do not include in debug outputs.

## Quality Checklist (before finishing)

- Frontend changed: run `npm run build -w web`.
- Backend changed: at minimum run `npm run prisma:generate -w server`; run server build if unrelated baseline errors are not blocking.
- Confirm no new lint/type issues in touched files.
- Verify critical flow manually when possible (create/edit/delete and role behavior).

## What To Avoid

- Large refactors without explicit request.
- Introducing new libraries when existing stack already covers the need.
- Silent API contract changes without updating frontend consumers.
- Duplicating components that should be reusable.
