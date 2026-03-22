# User Guide

This guide explains how to use the Mekteb App interface and core features.

## 1) Login and Session

- Open the web app login page (hero + sign-in card side by side on large screens, stacked on small screens; scroll if the card is taller than the screen).
- Sign in with your email and password.
- Change language from the login card or, after sign-in, from the sidebar language control.
- **Invited accounts:** Open the **verify** link from your email (`/verify?token=…`). The page matches the login layout; enter and confirm your password (no token field—the link supplies it). Then sign in on the login page.
- After login, you are redirected to the dashboard.
- Your available actions depend on your role (`SUPER_ADMIN`, `ADMIN`, `BOARD_MEMBER`, `PARENT`, legacy `USER`).

## 2) Dashboard Navigation

- Use the sidebar to switch between sections.
- Use the breadcrumb at the top to confirm your current page.
- The top dashboard header stays visible while you scroll page content.
- When your role includes reporting (`ADMIN` / `SUPER_ADMIN`), use the header **Report activities** action to open the reporting modal; desktop shows label + icon, mobile shows icon-only. Parent and board-member accounts do not see this control.
- Use the header notification bell icon for quick access to `Notifications`; messages are handled from the docked chat launcher.
- Use language selector in the sidebar footer when needed.
- Use the Help icon near your profile avatar for quick role-based guidance (content is filtered by your role).

## 2.1) Role handbooks (screens and expectations)

- See [`docs/handbooks/README.md`](./handbooks/README.md) for how documentation is split by role.
- **Parents / legacy `USER`:** [`docs/handbooks/user.md`](./handbooks/user.md) describes only family-visible screens and avoids administrator workflows.
- **`BOARD_MEMBER`, `ADMIN`, `SUPER_ADMIN`:** each has a dedicated handbook with per-route notes: [`board-member.md`](./handbooks/board-member.md), [`admin.md`](./handbooks/admin.md), [`super-admin.md`](./handbooks/super-admin.md).
- In the app, **Help** (`/app/help`) shows the **full role handbook** inline: content is **translated** with the UI language (EN / SV / BS) and **selected by your logged-in role** (parents never see admin/super-admin sections).

## 3) Common UI Patterns

- **Search bar** filters list content by relevant fields.
- **Create button** opens a modal form.
- **Edit button** opens modal form with prefilled values.
- **Delete button** opens a confirmation dialog.
- **Details view** usually opens in a side drawer.
- **Loading states** show while data is fetched or submit actions are in progress.

## 4) Forms and Validation

- Required fields show validation errors before submit.
- Submit buttons are locked while saving to prevent duplicate requests.
- Some fields are restricted by role or community scope.

## 5) Messaging and Notifications

- Messages are available through the global bottom-right chat dock.
- Use the docked launcher button to open chat quickly from any page.
- Message badge/dot on the chat launcher shows unread direct messages (auto-refresh every 30 seconds).
- Message badge is based on chat activity/last-seen, not notification items.
- Parents can open context chat directly from child progress/homework/lecture-comment areas; Imam/Admin is auto-selected for these flows.
- Chat supports free messages and context-tied threads (`HOMEWORK`, `LECTURE_COMMENT`).
- Use `New message` in the chat header to start a fresh thread; unread marks are shown on thread rows for quick scanning.
- Imam/Admin can close a thread. Closed threads stay visible as history, but no new messages can be posted in that thread.
- If a thread is closed, parent must start a new thread to continue communication.
- Notifications show platform events relevant to your account.
- Mark notifications as read from the notifications view.
- For communication issues, check if the receiver or role scope is valid.

## 6) Lessons

- The **Lessons** sidebar section and `/app/lessons` route are available to **`SUPER_ADMIN` only** in the current app; other roles do not navigate there.
- On that page, catalog entries can be searched and maintained (create/update/delete) by **`SUPER_ADMIN`**.
- Lesson levels (nivo) are standardized across children and lectures—keep titles and level assignment consistent.

## 7) Activity Reporting Workflow (Admin/Super Admin)

- **SUPER_ADMIN** sees a **Community** column on the **Reports** and **Homework queue** tables (multi-community visibility). **ADMIN** does not—lists are for their community only.
- Save lecture attendance reports first (draft stage), then use `Complete lecture` from Activities table when the report is finalized.
- Attendance entry is optimized for speed: by default all children are marked present, then you toggle off only absences.
- Homework assignment in report modal is optional and lecture-level (single homework for the selected nivo report).
- Use the `Homework queue` tab under Activities as a separate follow-up window: select `Nivo` + `Lecture`, then mark homework done child-by-child.
- Parents and linked guardians see lecture/homework outcomes in dashboard and child history once reports are saved.

## 8) Data Quality Checklist

- Confirm spelling and names before saving records.
- Avoid creating duplicate users, children, or lessons.
- Re-check role and community assignment before creating users.
- Confirm destructive actions in the delete confirmation dialog.

## 9) Troubleshooting

- If you see "Forbidden", your role/community scope does not allow the action.
- If data looks stale, refresh the page and retry.
- If login fails unexpectedly, verify account status with an admin.
- If language text looks incorrect, switch language once and reload the app.
