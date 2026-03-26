# PARENT / family handbook (`PARENT`, legacy `USER`)

This handbook describes **your** app: what each area is for, what you should expect, and what is intentionally not available on your account. It does **not** document administrator or platform tools.

## How navigation works

- **Sidebar:** You have **General** items and, under **Management**, **Children** only. You do **not** see Users, Activities (reports), Lessons, or Communities in the sidebar.
- **Top bar:** **Messages** (mail icon) opens the chat dock; **Notifications** (bell) opens a short list with a link to the full notifications page. You do **not** see the quick **Report activities** button (that is for `ADMIN` / `SUPER_ADMIN`).
- **Breadcrumb:** Confirms which section you are in; the dashboard has no breadcrumb by design.

## Screen by screen

### Dashboard (`/app/dashboard`)

- **Purpose:** Home view after login: community news and your family’s snapshot in one place.
- **What you see:**
  - **Progress overview** (KPI-style cards and per-child summaries when you have linked children): linked children, attendance-style signals, homework follow-up, and recent activity—scoped to **your** children only. Separate Sufara and Qur'an cards appear only when at least one of your linked children is enrolled in those programs.
  - **This week for your family** (when your account has a community): a read-only weekly events preview filtered to what applies to your household (and general community events as the product rules allow). You cannot create or edit events here.
  - **Recent posts:** Latest community posts with a link to open the full **Posts** section.
- **What you cannot do here:** Run lecture reports, manage other people’s children, or change community settings.

### Posts (`/app/posts`)

- **Purpose:** Read announcements and updates from your community.
- **What you can do:** Read posts, add **reactions**, add **comments**, and edit **your own** comments.
- **What you cannot do:** Create new posts, edit others’ posts, or delete posts (community **ADMIN** / `SUPER_ADMIN` handle publishing and moderation).

### Children (`/app/children`)

- **Purpose:** List and review **children linked to your account** (not the whole community roster).
- **What you can do:** Click a **row** to open the **side drawer** for quick progress tabs. Click the **child’s name** (link icon) to open the **full child page** at `/app/children/<id>` (summary card plus the same tabs). You can **edit** allowed fields for your children (for example name, SSN, birth date, address) through the edit flow when offered.
- **What you cannot do:** Create children, inactivate them, change **community** or **nivo**, or change **parent links**—those are admin-only. You cannot open children you are not linked to.
- **Tip:** Shareable URLs use `/app/children/<uuid>`; add `?tab=lecture-progress`, `homework-progress`, or other tab keys to land on a specific tab (`basic-info` is the default when `tab` is omitted).

### Notifications (`/app/notifications`)

- **Purpose:** Timeline of alerts for your account (posts, homework, attendance, messages-related routing, etc., as configured in the product).
- **What you can do:** Review items, open linked destinations when provided, mark as read.
- **What you cannot do:** See other users’ private notifications.

### Help (`/app/help`)

- **Purpose:** Short, in-app reminders aligned with **your** role. You will **not** see `ADMIN` or `SUPER_ADMIN`-only tips on this page while logged in as a parent.

### Messages (chat dock, not a separate page)

- **Purpose:** Talk to Imam/Admin (and receive replies) without leaving your current screen.
- **What you can do:** Open threads from the launcher, send messages in **open** threads, start **new** threads (including from homework/lecture-comment context where the app offers it).
- **What you should know:** If Imam/Admin **locks** a thread, it becomes read-only; start a **new** thread for follow-up.

## If something is missing

- **“Forbidden” or missing buttons:** Your role is not allowed that action, or the server rejected the request—this is expected for parent accounts on management features.
- **Empty lists:** You may have no linked children yet, or no new posts/notifications—ask your community admin if data should appear.

## Quick reminders

- Keep login details private; log out on shared devices.
- Use **Help** and this handbook for **parent** scope only; do not expect admin documentation while logged in as a parent.
