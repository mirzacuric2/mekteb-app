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
