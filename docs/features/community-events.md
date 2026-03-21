# Community Events Calendar

## Purpose

Community events provide responsive calendar views for one-time and recurring events (for example weekly lectures, Eid, and community dinners), with role-scoped visibility and management.

## User Flow

1. `ADMIN` or `BOARD_MEMBER` opens `Community -> Events`.
2. User creates an event with:
   - title and optional description
   - event date + start/end time
   - simple weekly toggle (`weekly event`) shown below end-time on mobile and aligned in the same row on larger screens
   - audience (`GENERAL` or `NIVO`)
   - optional `Nivo` (color is derived automatically from shared Nivo color system)
   - on update, audience and nivo selects are prefilled from the stored event and remain state-synced
   - client-side validation messages are translated (EN/SV/BS) via i18n keys `eventsValidation*`
3. Event appears in weekly or monthly calendar slots (based on screen size/placement), with mobile weekly view rendering one full-width day card per row.
4. On desktop/month view, a summary strip titled **Month summary** appears above the calendar (total events, active days, weekly series count, upcoming events); cards are clickable to filter/highlight the month grid. The month grid shows only days in the selected month; leading/trailing week padding cells are empty (no adjacent-month dates or events). Managers see **Create event** next to the month title (same control as weekly view): it opens the form with no preset date, while **clicking a day** still prefills that date (`eventsMonthCreateHint`).
5. Weekly day cards show a compact preview (up to 5 events) with a `Show more` toggle for heavy days to avoid visual overload. Week navigation uses **ISO week number** (and ISO week-year) as the primary label in all languages (`eventsCalendarIsoWeekHeading`), with the calendar date range on a smaller line above (same layout on the home dashboard preview and **Community → Events** weekly view). On **Community → Events**, the **weekly stat summary** (same three metric cards + optional child-targeted line as the home dashboard) appears above the day list whenever the UI is in **weekly mode** (typically **mobile** and other widths below the month-calendar breakpoint). Copy switches by `WEEK_SUMMARY_VARIANT.COMMUNITY` vs `WEEK_SUMMARY_VARIANT.FAMILY` (typed `WeekSummaryVariant` in `web/src/features/events/constants.ts`): community uses `eventsCommunityWeekSummary*`; dashboard uses `eventsParentWeekSummary*`. **Desktop month view** does not show the weekly summary because **Month summary** already covers that layout.
6. Month day cells also support `Show more`/`Show less` and this toggle does not trigger day-level create action.
7. Managers open update immediately by clicking an event card.
8. Managers can delete from a small top-right delete icon that appears on hover.
9. The home dashboard embeds a **preview-only** weekly calendar: no event management (create/edit/delete) on the dashboard; authorized managers use **Community → Events**. The **week navigation row** is the primary title (month + year with day span when the week stays in one month; full date range otherwise), with a short view-only subtitle below (`eventsDashboardCommunityCalendarDescription`). **All roles** that see this card (`PARENT`, `USER`, `ADMIN`, `BOARD_MEMBER`) use the **stacked weekly layout** (one full-width day per row) on all screen sizes. A compact **family summary** sits under that subtitle (`eventsParentWeekSummary*`), derived from the occurrences shown in the grid: for `PARENT`/`USER` that is the API’s parent-filtered list; for `ADMIN`/`BOARD_MEMBER`/`SUPER_ADMIN` with **linked children** in the same community (via `GET /children?mine=1`), the dashboard applies the **same visibility rules client-side** (GENERAL + matching NIVO + CHILDREN rows for linked ids) so the card matches the parent experience; managers **without** linked children still see the full community week. The dashboard summary uses **three compact stat cards** (this week’s total, upcoming, next session) in a responsive row, plus an optional **by child** line for `CHILDREN` audience events, with **family**-oriented strings. Next-session detail uses **24-hour** time via shared `formatTime`. Loading waits for both the events range and (when applicable) the linked-children fetch.

## Permissions and Scope

- **Create/Update/Delete:** `ADMIN`, `BOARD_MEMBER` only, and only for own community.
- **Read:**
  - `SUPER_ADMIN`, `ADMIN`, `BOARD_MEMBER`: community-scoped events for selected community.
  - `PARENT`, `USER`: only events relevant to linked scope:
    - all `GENERAL` events
    - `CHILDREN` events linked to at least one of their children
    - `NIVO` events matching at least one linked child `nivo`

## API Contract

### Endpoints

- `GET /communities/:id/events?from=<iso>&to=<iso>`
- `GET /communities/:id/events/:eventId`
- `POST /communities/:id/events`
- `PATCH /communities/:id/events/:eventId`
- `DELETE /communities/:id/events/:eventId`

### Event Fields

- `title: string`
- `description?: string`
- `startAt: ISO datetime`
- `endAt: ISO datetime`
- `recurrence: NONE | WEEKLY | YEARLY`
- `recurrenceInterval: number (>= 1)`
- `recurrenceEndsAt?: ISO datetime`
- `audience: GENERAL | CHILDREN | NIVO` (`CHILDREN` remains API-supported for compatibility, but current UI flow uses `GENERAL` and `NIVO`)
- `childIds?: string[]` (reserved for API/backward compatibility)
- `nivo?: number (1..5)`

### Calendar Response Shape

List endpoint expands recurring events and returns occurrence rows:

- `occurrenceStartAt`
- `occurrenceEndAt`
- `sourceStartAt`
- `sourceEndAt`
- `event` (full event payload)

## Color System

- Event color resolution order:
  1. shared `Nivo` color map (if `nivo` exists)
  2. default neutral color

This keeps calendar color semantics consistent with nivo-based reporting visuals.

## Future Integration Note

Event `startAt`/`endAt` and recurrence data are designed to support future scheduling automations (for example Viber reminders based on upcoming occurrences).
