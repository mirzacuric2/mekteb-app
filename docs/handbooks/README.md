# Role handbooks

These files describe **only what that role can see and do** in the Mekteb web app. They are written so **parents and family accounts are not exposed to administrator or platform-operator workflows**—those details live in the `ADMIN` and `SUPER_ADMIN` handbooks only.

| Handbook | Roles | Purpose |
| --- | --- | --- |
| [user.md](./user.md) | `PARENT`, legacy `USER` | Family-facing screens: dashboard, children you are linked to, posts, notifications, messages. |
| [board-member.md](./board-member.md) | `BOARD_MEMBER` | Community profile and governance tabs, read-only user directory, **Children** list only for dependents linked to your account (same as parents), coordinate with `ADMIN` for new posts. |
| [admin.md](./admin.md) | `ADMIN` | Full community operations: users, children, activities, posts, community tabs including diplomas. |
| [super-admin.md](./super-admin.md) | `SUPER_ADMIN` | All communities, lessons catalog, cross-community reporting columns, user/community lifecycle. |

**In the app:** the **Help** page (`/app/help`) loads the **full translated handbook** for your role (EN / SV / BS) from `web/src/features/help/handbook/locales/`—parents do not receive admin or super-admin handbook content.

Start with the [User Guide](../user-guide.md) for shared UI patterns, then open the handbook for your role.
