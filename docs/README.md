# Mekteb App Documentation

This folder contains user-facing documentation for daily platform usage.

## Start Here

- [User Guide](./user-guide.md) - common navigation and feature basics for all users.

## Role Handbooks

- [SUPER_ADMIN Handbook](./handbooks/super-admin.md)
- [ADMIN Handbook](./handbooks/admin.md)
- [BOARD_MEMBER Handbook](./handbooks/board-member.md)
- [USER Handbook](./handbooks/user.md)

## Recommended Reading Order

1. Read the User Guide for shared concepts and UI patterns.
2. Read the handbook for your role.
3. Keep the troubleshooting section bookmarked for quick support.

## Documentation Scope

- Documentation focuses on real workflows in the current app.
- Permissions are enforced by backend role and community scope.
- Some screens are shared across roles, but available actions differ.

## Notes

- Roles are strict and enforced by the backend.
- Some screens are visible to multiple roles, but actions differ by permissions.

## Feature Notes (Latest)

- Legacy seeded community (`Jonkoping`) is removed from the bootstrap flow.
- Default seed now creates a neutral community name instead of hardcoded city-specific naming.
- `BOARD_MEMBER` is a first-class access role with community-scoped management capabilities.
- Communities use a list-first CRUD flow with create/update modal forms and delete confirmations.
- Community form supports a clearer create/update flow.
- Imam assignment is super-admin restricted (editable only by `SUPER_ADMIN`, read-only for others).
- Board-member assignments are managed directly in the community create/update modal by selecting users and board roles.
- Board-member assignments keep full history with `active/inactive` status and mandate dates (`mandateStartDate`, `mandateEndDate`).
- Multiple admins (Imams) can be assigned to the same community.
- Deleting a community now inactivates it (soft delete) instead of removing related records.
- Seed/migration import official communities list for initial Dzemati/Forsamlingar setup.
- Super admin community list shows both active and inactive communities.
- Newly invited users are created with `PENDING` status until verification.
- User and community lifecycle now use explicit status values (enums) instead of boolean active/verified flags.
- Children management enforces required `SSN + community + nivo + at least one parent` on create.
- Children create/update now follow modal form flow (same UX pattern as other CRUD modules).
- Children list search now uses the shared list-toolbar pattern (`EntityListToolbar`) used across management screens.
- Children list now follows the users-style management pattern (paginated table rows + row actions + details drawer).
- Children table uses full available width of the content card (with responsive horizontal scroll fallback).
- Children table keeps a compact actions column with icon-only controls (header text hidden visually).
- Users table matches this compact actions-column behavior (header text hidden visually, actions stay icon-based).
- Children table `Nivo` is shown as progress indicator (dots + `current/total`) for compact readability.
- Children `Nivo` also shows a 5-dot progress indicator (green for completed levels, sky for current level).
- Nivo dots include clearer visual emphasis for the current level and hover/focus tooltips per level state.
- Nivo progress now also shows a compact numeric index (`current/total`, e.g. `2/5`) for fast readability.
- Nivo progress uses a cleaner minimal-dot style; current level is shown as a hollow sky dot with a filled center for clearer focus.
- In child create/update modal, admin can select `Nivo` directly by clicking progress dots shown inline with the `Nivo` label and aligned in-row with community selection when visible (no card wrapper).
- Children `Nivo` is stored as integer (`1..5`) in the database instead of the previous `Nivo` enum (`First..Fifth`). UI labels remain unchanged (e.g. "Nivo 1", "Nivo 2"). The `Nivo` Prisma enum has been removed and replaced with `Int` fields on both `Child` and `Lesson` models.
- Table row actions use icon buttons on desktop and a 3-dots dropdown menu on mobile for cleaner small-screen UX.
- Parent assignment in child modal uses searchable multi-select combobox (scales for large parent lists).
- Child address fields are grouped in a dedicated address card section inside the modal.
- Child records support optional address, multi-parent links, and lifecycle statuses (`ACTIVE`, `COMPLETED`, `DISCONTINUED`, `INACTIVE`).
- In child create/update modal, parent multi-select includes `PENDING`, `ACTIVE`, and `INACTIVE` parent accounts (status shown in option labels).
- Parent status in child parent-selector is rendered using the shared status badge style (same badge pattern as other management views).
- Child parent linking accepts all users except `SUPER_ADMIN` (including `ADMIN`, `BOARD_MEMBER`, `PARENT`, and `USER`).
- Child creation defaults status to `ACTIVE`; completion is tracked separately from inactivation.
- Child delete action uses soft-delete and sets status to `INACTIVE` (with confirmation dialog).
- Child create/update actions now show user feedback toasts for success and API errors.
- Child create/update modal uses Zod-based validation for full payload checks on submit attempt (required SSN, names, birth date format, required community/parents by role, and partial-address completion), with inline field errors.
- Child create/update modal now uses `react-hook-form` (`useForm`) with semantic form submission (`<form onSubmit>`), keeping validation and save flow consistent through one submit handler.
- Child role/access booleans in management views are centralized via shared auth hook (`web/src/features/auth/use-role-access.ts`) to avoid duplicated role checks.
- List pagination math is centralized via shared hook (`web/src/features/common/use-pagination.ts`) and reused across children/users/activities panels.
- Table pagination also shares a common default page size constant (`DEFAULT_PAGE_SIZE`) from the same pagination module.
- Children listing now uses backend search + pagination (`GET /children` with `q`, `page`, `pageSize`) so filtering/scaling stays server-side and role-scoped.
- Users listing now uses backend search + pagination (`GET /users` with `q`, `page`, `pageSize`) as the standard list contract.
- Activities listing now uses backend search + pagination (`GET /lectures` with `q`, `page`, `pageSize`) as the same standard list contract.
- Children feature now separates API concerns into dedicated hooks: data-fetch hooks (`use-children-data.ts`) and mutation hooks (`use-children-mutations.ts`).
- Reusable query-param data hooks are now available for users/children fetch flows (`use-users-data.ts`, `use-children-data.ts`) to support shared list/options retrieval in forms.
- Children create/update form is now split into reusable pieces: schema module (`child-form-schema.ts`), form hook (`use-child-form.ts`), and dialog component (`child-form-dialog.tsx`) to keep panel components small.
- Users create/update form now follows the same modular pattern: schema module (`user-form-schema.ts`), form hook (`use-user-form.ts`), and dialog component (`user-form-dialog.tsx`) with `react-hook-form` submit flow.
- `ADMIN` is scoped to own-community children for create/update/inactivate; `PARENT` sees only linked children and can edit child data except `community` and `nivo`.
- Children listing is fail-closed for non-super-admin roles: if account has no community assignment, API returns `403` instead of widening scope.
- `PARENT`/`USER` children listing is always parent-link scoped (`parents.some(parentId = currentUser)`), even when community assignment is missing; community-assignment `403` remains for non-parent-scoped roles.
- Children list scope is role-enforced: `ADMIN`/`SUPER_ADMIN` keep management scope, while `BOARD_MEMBER`, `PARENT`, and `USER` always see only their linked children (`parents.some(parentId = currentUser)`), including UI list queries and backend route guards.
- Sidebar children navigation is visible for `PARENT` and `BOARD_MEMBER` as well (in addition to admin roles) so family-linked users can open child lists directly.
- In Users create/edit dialog, `ADMIN` can choose both `BOARD_MEMBER` and `PARENT` roles (while creating `ADMIN` remains super-admin only).
- In Users create dialog, default selected role for `ADMIN` is `PARENT`.
- Shared modal dialog layout is mobile-safe: dialogs render via portal to `document.body`, use flex + `margin: auto` centering (no percentage-based `min-h-full`), and constrain height with internal body scroll.
- `Dialog` centering uses `display: flex` on the viewport overlay with `margin: auto` on `DialogContent`.
- `Dialog` backdrop uses `position: fixed` (independent of the flex layout) so it always covers the full viewport.
- `DialogBody` uses `min-h-0 flex-1` in its flex-column parent so it can shrink below content height, enabling `overflow-y-auto` scrolling for tall forms instead of clipping the footer.
- `DrawerContent` now renders via `createPortal` to `document.body` (same pattern as `Dialog`), preventing unintended margins from parent `space-y-*` rules and avoiding nesting inside overflow containers.
- `Dialog` and `Drawer` escape-key handlers use a stable ref for `onOpenChange` to avoid effect re-runs when callers pass inline callbacks.
- **Layout containment (viewport lock):** `html`, `body`, and `#root` all use `height: 100%; overflow: hidden;` so no page-level scrolling is possible. All scrolling happens inside dedicated scroll containers within each layout.
- **Private layout height cascade:** The SidebarProvider wrapper and PrivateLayoutShell root both use `h-full overflow-hidden`, cascading `height: 100%` from the viewport through `html → body → #root → wrapper → shell`. This avoids `100vh` which exceeds the visible viewport on mobile browsers (address bar gap).
- **Sidebar positioning:** The sidebar uses `position: absolute` (not `fixed`) so it can be clipped by the shell root's `overflow: hidden`. On desktop, `md:sticky` overrides to sticky positioning within the flex layout. The shell root has `position: relative` to serve as the containing block for the absolutely-positioned sidebar and overlay. This prevents the sidebar from causing horizontal/vertical overflow on mobile (since `position: fixed` elements cannot be clipped by parent overflow).
- **Sidebar transitions:** Uses `transition-[transform,width]` instead of `transition-all` to prevent unexpected transitions on non-animatable properties.
- **Sidebar height:** The sidebar uses `md:h-full` (percentage of the flex container) instead of `md:h-screen` (100vh) for consistent sizing within the layout height cascade.
- **Content container max-width:** The inner content container uses only `max-w-[1120px]` (not a fixed `xl:w-[1120px]`) to prevent overflow when the sidebar is expanded on viewports between 1280px and ~1450px.
- **PublicLayout:** Wraps content in a `h-full overflow-y-auto` container so public pages (login, verify) can scroll independently within the locked viewport.
- Private shell applies row flex only on desktop (`md:flex`); on mobile, sidebar remains overlay-only and main content keeps full viewport width.
- Shared table wrappers clamp width (`min-w-0/max-w-full`) so large table min-width stays inside local x-scroll areas and never expands page width.
- Users/Children panel cards are `min-w-0` to prevent flex-item min-content width from leaking into document layout on small screens.
- While dialog is open, body overflow and overscroll are explicitly locked to avoid page drift behind modals.
- Private dashboard now has a dedicated sticky top header with a primary reporting action and quick-access notifications/messages icons with unread badges.
- Header action is responsive: desktop shows icon + text, while mobile uses icon-only for compact spacing.
- Sidebar branding now uses full logo in expanded desktop state and compact logo mark for collapsed/mobile state.
- Sidebar branding assets are now hosted under `web/public/branding` (`izbus-logo.png`, `logo-small.svg`) so `mekteb-app` does not depend on sibling project asset paths.
- Expanded desktop sidebar width is reduced further for a more compact layout (`md:w-60`).
- In collapsed desktop sidebar footer, the Help icon is placed on a separate line under the user avatar to avoid cramped/broken alignment.
- In collapsed desktop sidebar, the Help icon is hidden to keep footer actions minimal and avoid crowding.
- Sticky header horizontal padding now matches content/breadcrumb alignment for a consistent left edge across rows.
- Expanded sidebar logo now has dedicated centered spacing and is clickable (navigates to dashboard) for clearer branding UX.
- Sidebar logo row and top header row now use matching fixed height (`h-14`) for cleaner cross-column alignment.
- Sidebar logo row no longer renders a bottom divider for a cleaner visual transition into navigation items.
- In collapsed sidebar mode, a subtle divider is shown between General and Management sections to improve icon-group scanning.
- Localization coverage is expanded for `communities`, `children`, and `lessons` management pages: key labels, actions, dialogs, and feedback now include Bosnian (`bs`) and Swedish (`sv`) translations (in addition to English).
- Sidebar branding behavior: mobile drawer now uses the full logo, while compact logo is used only for collapsed desktop sidebar.
- Sidebar/header chrome labels are fully localized (`Language`, `General`, `Management`, `Report activities`, `Logout`) for `en`, `sv`, and `bs`.
- Header message/notification icons now include translated hover/focus tooltips (using i18n labels for `messages` and `notifications`).
- `Report activities` header action is visible only to `ADMIN` and `SUPER_ADMIN`.
- Language switcher UI is now a shared component reused by both login and sidebar (`EN/SV/BS` button group) for consistent behavior and styling.
- In collapsed sidebar mode, language switcher shows only the active language code (compact single-button view).
- Sidebar language label is removed; in expanded mode language options fill full row width with equal button sizing.
- In collapsed sidebar mode, the active-language badge uses the same primary active color styling as selected language buttons.
- In collapsed sidebar mode, clicking the active-language badge opens a compact popover with other language options so users can switch language without expanding the sidebar.
- Header actions are ordered with notifications/messages first and `Report activities` anchored as the rightmost action.
- On mobile, the report button has extra separation from notification/message icons for clearer touch-friendly spacing.
- `Report activities` now opens a full bulk-report dialog for `ADMIN`/`SUPER_ADMIN`: select `Nivo`, load active children, choose a default lesson, override lesson per child, mark absence, mark homework done, and add comments before saving one lecture report for all children.
- In bulk report modal, children are fetched only after a `Nivo` is explicitly selected (no preloading before nivo choice).
- A dedicated `Activities` management page is available in sidebar navigation for `ADMIN`/`SUPER_ADMIN`, showing report records in a table with search, pagination, and row actions.
- Activity CRUD is split by intent: create/update uses the report modal, while list/delete/edit discovery lives on the `Activities` page.
- `Activities` page no longer shows a create button; new reports are created only via header `Report activities`.
- Activity report dialog titles are now localized with separate create/edit labels for `en`, `sv`, and `bs`.
- Date/time rendering now uses shared web utility helpers (`web/src/lib/date-time.ts`) for consistent formatting across activities and detail drawers.
- ISO date validation (`isValidIsoDateString`) is shared in `web/src/lib/date-time.ts` and reused by child form schema validation.
- Editing an activity from the `Activities` page opens the report modal prefilled and updates stored lecture attendance rows (lesson, absence/presence, homework, comments) in one save.
- Activity timestamps now follow standard audit fields (`createdAt`, `updatedAt`); `heldAt` is removed from lecture read/write flows.
- Bulk report modal uses a streamlined flow: no report title/date/general note fields; backend auto-generates report topic and timestamp.
- In report modal, every field except `Nivo` stays disabled until `Nivo` is selected.
- Bulk activity reports persist per-child attendance details (`present/absent`, `homeworkDone`, `comment`, optional per-child `lessonId`) and are visible in each child details drawer under activity history.
- Per-child `Absent` / `Homework done` inputs in the report dialog now use switch controls (shadcn-style UI component).
- Lecture/activity-report mutations are now restricted to `ADMIN` and `SUPER_ADMIN` (board members are read-only for this flow).
- Bulk report saves trigger parent notifications (`ATTENDANCE_UPDATED`) so families can follow progress and react early to warning comments.
- Desktop collapse/expand sidebar icon in the header uses slight left offset (`ml`) while keeping icon centered inside its hover circle.
- Mobile header `Menu` trigger is slightly offset left for tighter visual proximity to the sidebar edge.
- Mobile header `Menu` trigger follows the same horizontal content rail as the breadcrumb for cleaner alignment.
- Sidebar container top padding is removed (`pt-0`) so the logo row aligns vertically with the sticky top header.
- Parent dashboard now includes an initial progress overview card set (linked children, attendance rate, homework completion, latest activity) on the main dashboard landing section for `PARENT` users.
- Progress overview cards are visible for child-following roles (`PARENT`, `USER`, `ADMIN`, and `BOARD_MEMBER`) so guardians and board-linked families can track lesson/homework progress.
- Parent dashboard landing view is intentionally simplified for the first release to a compact 2-card overview: attendance percentage (based on a temporary 20-lesson target) and latest state (attendance, homework, comment), plus a small latest-state detail block.
- Parent progress cards now include explicit child context labels (`Child` + `Lecture`) and state-aware visual cues: soft green when latest status is healthy, soft warning when latest status includes absence or homework not done.
- Progress details card now renders a compact "latest status per child" list so all linked children are visible at once (including no-activity fallback per child).
- Children overview dashboard now includes expanded KPI coverage (attendance %, homework completion %, overall state, and child-count/attention summary) plus per-child rows with lesson, attendance progress, homework status, and latest comment.
- Progress overview cards use a parent-link scoped query mode (`GET /children?mine=1`) so users in broader roles (for example `ADMIN`) still see only their own linked children in this dashboard widget.
- Homework persistence is split from attendance into dedicated `Homework` records keyed by `(childId, lessonId)` and now includes homework `title` and `description`. Activity reports still submit both `homeworkDone` and `comment`; comments remain per-attendance entry while homework state/details are stored per lesson-child and hydrated back into attendance responses for UI compatibility.
- Activity report rows now separate attendance comment from homework metadata: `comment` stays attendance-scoped, while homework uses dedicated fields (`homeworkTitle`, `homeworkDescription`, `homeworkDone`) persisted in the `Homework` entity.
- Parent progress metrics now aggregate across paginated child records (full linked-children scope) to improve accuracy for attendance/homework percentages.
- Parent progress pagination respects backend query limits (`pageSize <= 100`) to avoid invalid query errors on `/children`.
- Lectures now have explicit lifecycle status (`DRAFT`/`COMPLETED`) with `completedAt`; admins finalize reports via a dedicated "Complete lecture" action.
- Reporting now includes a dedicated Homework Queue tab for follow-up, with role-scoped `/homework` list/update APIs and inline updates for `done`, `title`, and `description`.
- Parent-facing progress/history surfaces lecture completion context and prioritizes completed lecture records for dashboard progress calculations.
- Activity report modal now defaults attendance to present for all children, includes a bulk "mark all present" action, and supports optional lecture-level homework assignment (single homework title/description applied across the selected nivo report).
- Homework follow-up flow is optimized for admins: in Activities > Homework queue, select `Nivo` and `Lecture`, then mark homework completion child-by-child.
- Activity report UI is simplified: the attendance bulk-action strip is removed and the lecture-level homework switch is aligned inline with the default lesson section.
- Homework queue filters now use the app-styled select controls and lecture selection includes both draft and completed lectures (status shown in option labels) to avoid empty-filter confusion.
- Report modal now includes a `Save as completed report` checkbox, allowing admins to finalize directly on save (instead of always completing later from the Activities list).
- Button component now renders a clearer visual disabled state (muted opacity + disabled hover) so disabled submit/actions are immediately recognizable.
- Activity report modal mobile layout is refined: homework assignment row spacing is tighter and footer actions render in a balanced responsive layout (checkbox + clean cancel/save button grouping).
- Activity report now uses one required main lesson selector for the whole report (per-child lesson selection removed) to keep reporting faster and less error-prone.
- Activity report lesson label is clarified to `Lesson for this report` for a cleaner admin-facing form flow.
- On desktop, each child row now places `Attendance comment` and `Present` controls on one line for faster scanning/editing.
- Attendance comment field in activity report rows now uses a textarea to support longer notes.
- Attendance comment layout is responsive: full width on mobile and ~2/3 width on desktop, with `Present` in the remaining column.
- Attendance comment textarea is constrained for fast entry: minimum 1 line and maximum 3 visible lines (with internal scroll beyond that).
- In desktop child rows, `Present` switch is vertically centered against the attendance comment textarea for cleaner alignment.
- Activity report form vertical spacing is tightened (notably between `Nivo` and `Lesson for this report`) for a denser mobile-friendly layout.
- Child-row mobile spacing is tightened further: `Present` switch sits directly under attendance comment without desktop-only spacer offsets.
