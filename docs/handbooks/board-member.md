# BOARD_MEMBER handbook

`BOARD_MEMBER` supports community governance and transparency. This handbook matches **current** sidebar and API behavior: you have broader **visibility** than parents in some areas, but **operational** school workflows (reports, child records, publishing posts) remain with `ADMIN` / `SUPER_ADMIN` where the product enforces it.

## How navigation works

- **Sidebar — General:** Dashboard, Posts, Help, Notifications (same grouping as other non–super-admin roles).
- **Sidebar — Management:** **Users**, **Children**, **Community** (label may show as singular **Community** when you are scoped to one community). You do **not** see **Activities** (reports) or **Lessons**; those routes are reserved for `ADMIN` / `SUPER_ADMIN` and `SUPER_ADMIN` respectively.
- **Top bar:** Messages and notifications like other roles. You do **not** see the **Report activities** shortcut (admin/super-admin only).

## Screen by screen

### Dashboard (`/app/dashboard`)

- **Purpose:** Same home layout as family roles when the app shows progress and weekly events for your community assignment.
- **What you see:** Progress-style cards and weekly events preview **when** your account is treated like other community members with a community id (same gating as `PARENT`/`USER`/`ADMIN` in the dashboard code path). Recent posts and a link to **Posts**.
- **Expectation:** Your focus is oversight and coordination, not bulk data entry from this screen.

### Posts (`/app/posts`)

- **Purpose:** Read community announcements; engage as a member.
- **What you can do:** Read, react, comment, edit your own comments.
- **Important (current product):** **Creating** new posts is restricted to community **`ADMIN`** in the UI and API. To publish an announcement, coordinate with an **ADMIN** (or `SUPER_ADMIN`) account.

### Users (`/app/users`)

- **Purpose:** Directory-style view of users in scope for your access.
- **What you can do:** Review the list and open **details** to understand roles and linkage context where the UI exposes it.
- **What you cannot do:** Create, edit, delete, or invite users (`canEdit` is false for `BOARD_MEMBER` in the app—only `ADMIN` / `SUPER_ADMIN` get user management actions).

### Children (`/app/children`)

- **Purpose:** Same **Children** screen as parents: the list is scoped to **children linked to your user as a parent/guardian** (plus the same search/pagination patterns). If you have no linked children, the list can be empty even though you serve on the board.
- **What you can do:** Open rows and the **drawer** for read-only insight on those linked records.
- **What you cannot do:** Create, edit, or inactivate children (`canEditChildren` is false for `BOARD_MEMBER`). For community-wide child operations, use **ADMIN** workflows or the **Community → Overview** metrics (which use community-scoped summaries on the backend), not a full roster on this page.

### Community / Community detail (`/app/communities` or `/app/communities/:id`)

- **Purpose:** Your **community hub**: summary, **Overview** metrics, **Board members**, **Events**, and other tabs the product shows for your role.
- **What you can do:** Keep **basic community profile** information accurate where the UI allows; manage **board member** assignments per product rules (you cannot remove **your own** board assignment in-app). Work on **Events** where the calendar is enabled for `BOARD_MEMBER` (create/update/delete per current permissions).
- **What you cannot do:** Assign platform **`ADMIN`** users to the community (that is `SUPER_ADMIN` only). You do not manage the **Lessons** catalog or **Diplomas** tab unless the UI explicitly exposes it for your role (diplomas are `ADMIN` / `SUPER_ADMIN` in the current layout).

### Notifications, Help, Messages

- Same patterns as other non-admin roles: notifications for your account, **Help** text without `SUPER_ADMIN`-only sections, chat dock for coordination.

## Boundaries (so expectations stay clear)

- You are **not** a substitute for **ADMIN** on: user lifecycle, child CRUD, lecture reporting, homework queue, or post **creation** (today).
- Escalate platform-wide needs (new communities, `ADMIN` assignment, lesson catalog) to **`SUPER_ADMIN`**.

## Recommended workflow

1. Keep community profile and board roster accurate.
2. Use **Events** for visible scheduling work you are allowed to perform.
3. Partner with **ADMIN** for posts and child/user operational updates.
4. Use **messages** for questions that need Imam/Admin attention.
