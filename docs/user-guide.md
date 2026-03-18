# User Guide

This guide explains how to use the Mekteb App interface and core features.

## 1) Login and Session

- Open the web app login page.
- Sign in with your email and password.
- After login, you are redirected to the dashboard.
- Your available actions depend on your role (`SUPER_ADMIN`, `ADMIN`, `BOARD_MEMBER`, `PARENT`, legacy `USER`).

## 2) Dashboard Navigation

- Use the sidebar to switch between sections.
- Use the breadcrumb at the top to confirm your current page.
- The top dashboard header stays visible while you scroll page content.
- Use the header report action to open the reporting modal entry point (progress/comments/absence/homework flow placeholder); desktop shows label + icon, mobile shows icon-only.
- Use the header notification bell icon for quick access to `Notifications`; messages are handled from the docked chat launcher.
- Use language selector in the sidebar footer when needed.
- Use the Help icon near your profile avatar for quick role-based guidance.

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

- Lessons can be searched from the lessons page.
- Lesson create/update/delete actions are restricted by role.
- If action is not available, your role likely has read-only access.
- Lesson levels are standardized, so use consistent titles and level assignment.

## 7) Activity Reporting Workflow (Admin/Super Admin)

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
