# SUPER_ADMIN handbook

`SUPER_ADMIN` operates **across communities**: user lifecycle, community creation, lesson catalog, and cross-community visibility where the product adds columns or filters. This document is **only** for that role; it is not part of parent-facing help.

## How navigation works

- **Sidebar:** Same sections as admins **plus** **Lessons** under **Management**.
- **Communities:** You typically open the **Communities** list (`/app/communities`), then a **detail** route `/app/communities/:id` for a selected community (super admin list rows navigate into the same detail shell admins use for a single community).
- **Top bar:** **Report activities** is available (same modal entry as `ADMIN`, with broader data visibility).

## Screen by screen

### Dashboard (`/app/dashboard`)

- **Purpose:** Landing view with **recent posts** and navigation into work areas.
- **Note:** Parent-style **progress KPI** cards and the **weekly events** preview block are **not** shown for `SUPER_ADMIN` in the current dashboard implementation (`ProgressOverviewCards` is gated off for this role). Use **Children**, **Activities**, and **Community** detail for operational insight.

### Posts (`/app/posts`)

- **Purpose:** Read and moderate like admins; **create** may be community-**ADMIN**-only in API—rely on **patch/delete** and moderation powers where granted. (If you need a new post in a community, use or coordinate with a community **`ADMIN`** account when the API restricts `POST /posts` to `ADMIN` only.)

### Users (`/app/users`)

- **Purpose:** **All** communities (with filters/search/pagination as implemented).
- **What you can do:** Create users with `ADMIN`, `BOARD_MEMBER`, or `PARENT`; move users between communities; full edit/delete within policy; open drawers and child cross-links like admins.

### Children (`/app/children`)

- **Purpose:** Cross-community visibility when your flows require it; community picker on create/update where applicable.
- **Expectation:** Respect least exposure for sensitive fields (SSN) per governance rules.

### Activities (`/app/activities`)

- **Purpose:** Same **Reports** + **Homework queue** tools as `ADMIN`, with **multi-community** context.
- **Distinct UI:** **Reports** and **Homework queue** tables include a **Community** column so rows from different communities are distinguishable (admins do not see this column).

### Lessons (`/app/lessons`)

- **Purpose:** Shared **lesson catalog** (nivo-grouped list, CRUD). Only `SUPER_ADMIN` has this route in the sidebar and guard.

### Communities (`/app/communities` and `/app/communities/:id`)

- **Purpose:** Create communities (you are the only role that can create), inactivate (soft-delete) communities, assign **community admins**, and open any community’s **tabs** (Overview, Board members, Events, Diplomas) with appropriate write access.
- **Search:** Global communities list search is **super-admin** only in the current UI.
- **Governance:** Board member picker lists `BOARD_MEMBER` users; assigning platform **`ADMIN`** users to a community is **your** responsibility per governance rules.

### Notifications, Help, Messages

- **Help** shows **SUPER_ADMIN**-only guidance when logged in as this role.
- Use messaging for escalations; locking threads works like admin.

## Security and governance

- Protect super-admin credentials; never share them.
- Treat role changes, deletes, and community lifecycle as **audit-sensitive**.
- Keep lesson naming and nivo usage consistent so admins and reports stay aligned.

## Weekly operations (condensed)

- New admins and community assignments verified.
- Lesson catalog and cross-community report samples reviewed when supporting communities.
- Follow up on stuck homework queues or reporting patterns across sites.
