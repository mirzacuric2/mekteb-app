# ADMIN handbook

`ADMIN` is the **community Imam/operator** role: full management inside **your** community. This handbook is **not** shown to parent-only accounts; it assumes you already manage users and teaching workflows daily.

## How navigation works

- **Sidebar — General:** Dashboard, Posts, Help, Notifications.
- **Sidebar — Management:** **Users**, **Children**, **Activities**, **Community** (singular label when you are fixed to one community). You do **not** see **Lessons** (`SUPER_ADMIN` only).
- **Top bar:** **Report activities** opens the lecture reporting dialog quickly from any page (same capability as `SUPER_ADMIN` within scope).

## Screen by screen

### Dashboard (`/app/dashboard`)

- **Purpose:** Operational snapshot: family-style progress cards when applicable, **this week** events (read-only on the dashboard; editing happens under **Community → Events**), and **recent posts** with a shortcut to **Posts**.
- **Expectation:** Use it for pulse checks; deep work happens in management sections.

### Posts (`/app/posts`)

- **Purpose:** Community announcements.
- **What you can do:** **Create**, **edit**, and **delete** posts for your community; moderate comments (delete unsuitable comments); community members react and comment.
- **Note:** `SUPER_ADMIN` can also edit/delete posts when operating across communities; day-to-day publishing is yours.

### Users (`/app/users`)

- **Purpose:** Directory and lifecycle for accounts in **your** community.
- **What you can do:** Create and manage `BOARD_MEMBER` and `PARENT` (and legacy `USER`) accounts per policy; open drawers for detail; exclude yourself from the table list (`excludeMe`) so you do not delete your own login from the grid flow.
- **What you cannot do:** Create `SUPER_ADMIN`; assign platform `ADMIN` to a community (that is `SUPER_ADMIN` only).

### Children (`/app/children`)

- **Purpose:** Full **community** child roster (paginated table, search, row actions).
- **What you can do:** Create/update children with required **SSN**, **nivo**, **community**, and **≥1 parent**; adjust **nivo**, **track enrollment** (`Ilmihal`, `Sufara`, `Qur'an`), and **parent links**; mark **completed** / **discontinued** / **inactive** per lifecycle rules; open the **drawer** for progress and history.
- **Parent vs admin fields:** Parents linked to a child may edit a subset of fields; you maintain authoritative placement and links.

### Activities (`/app/activities`)

- **Purpose:** **Reports** table + **Homework queue** tab for lecture attendance and follow-up.
- **What you can do:** Run **Report activities** (from header or here) to capture attendance and homework state per **nivo**; save drafts; **complete** lectures when every row is final and lessons are chosen; use **Homework queue** to clear pending homework by **nivo** + **lecture**.
- **Track behavior:** Ilmihal report flow keeps nivo + lesson; Sufara uses letter lessons without nivo; Qur'an uses free-text lesson/topic in report forms.
- **Scope:** Lists are **single-community**; you do **not** see a **Community** column (that is for `SUPER_ADMIN` multi-community views).

### Community (`/app/communities`)

- **Purpose:** Single-community **hub** (your assignment): compact summary, **Edit** basic info (modal without board-member bulk fields in that entry), tabs such as **Overview**, **Board members**, **Events**, **Diplomas**.
- **Overview:** Stats and donuts for users/children and nivo-level signals—community-scoped.
- **Board members:** Adjust board roster where permitted; changes save per current UX (auto-save pattern).
- **Events:** Weekly/month calendar; create/update/delete events you are allowed to manage (recurrence supported per product docs), including track audiences (`Ilmihal`, `Sufara`, `Qur'an`).
- **Diplomas:** Configure PDF template and text layout; generate merged PDFs in the browser for ceremonies (see README feature notes for limits).

### Notifications (`/app/notifications`)

- Same as other roles but includes items triggered by your administrative actions and community engagement.

### Help (`/app/help`)

- Shows **ADMIN**-specific hints only when logged in as `ADMIN` (not to parents).

### Messages

- Chat dock: reply to parents, including context threads; **Lock thread** when a conversation should end (parents must start a new thread afterward).

## Boundaries

- All mutations are **community-scoped**; you cannot touch another community’s records.
- **Lessons** catalog changes are **`SUPER_ADMIN`** only.
- **Imam assignment** on communities may be read-only in UI for you; super admin governs platform admins.

## Daily checklist (condensed)

- Messages and urgent parent threads.
- Attendance drafts → **Complete lecture** when verified.
- Homework queue cleared before the next session.
- Posts and events kept current.
