# User Guide

This guide explains how to use the Mekteb App interface and core features.

## 1) Login and Session

- Open the web app login page.
- Sign in with your email and password.
- After login, you are redirected to the dashboard.
- Your available actions depend on your role (`SUPER_ADMIN`, `ADMIN`, `USER`).

## 2) Dashboard Navigation

- Use the sidebar to switch between sections.
- Use the breadcrumb at the top to confirm your current page.
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

- Messages are available in the Messages section.
- Notifications show platform events relevant to your account.
- Mark notifications as read from the notifications view.
- For communication issues, check if the receiver or role scope is valid.

## 6) Lessons

- Lessons can be searched from the lessons page.
- Lesson create/update/delete actions are restricted by role.
- If action is not available, your role likely has read-only access.
- Lesson levels are standardized, so use consistent titles and level assignment.

## 7) Data Quality Checklist

- Confirm spelling and names before saving records.
- Avoid creating duplicate users, children, or lessons.
- Re-check role and community assignment before creating users.
- Confirm destructive actions in the delete confirmation dialog.

## 8) Troubleshooting

- If you see "Forbidden", your role/community scope does not allow the action.
- If data looks stale, refresh the page and retry.
- If login fails unexpectedly, verify account status with an admin.
- If language text looks incorrect, switch language once and reload the app.
