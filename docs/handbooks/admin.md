# ADMIN Handbook

ADMIN manages users and content within assigned community scope.

## Primary Responsibilities

- Manage parents/users in your community.
- Manage children and attendance/lesson activities in your community.
- Publish posts and communicate with families.

## What You Can Do

- Create/update/delete `BOARD_MEMBER` and `PARENT` accounts in your community.
- View users and children in your community.
- Create children with required `SSN`, `community`, `nivo`, and at least one linked parent.
- Update children in your community, including `nivo`, parent links, and optional child address.
- When assigning child parents, you can select parent accounts in `PENDING`, `ACTIVE`, or `INACTIVE` status.
- Any community user except `SUPER_ADMIN` can be linked as a child parent when needed.
- Mark children as `COMPLETED` when they finish lessons.
- Mark children as `DISCONTINUED` when they stop attending before completion.
- Inactivate children in your community when needed (separate from completion, keeps history).
- Use child create/update modal with inline validation for required fields (SSN, name, birth date, parent links, community for super admin context, and complete address if any address value is entered).
- Create/update/delete posts for your community.
- Manage lectures/attendance entries.
- Use `Report activities` for bulk child reporting:
  - select one `Nivo`,
  - review all active children in that nivo,
  - preselect a default lesson and override per child when needed (default auto-applies; no extra apply button),
  - mark each child as absent/present,
  - capture attendance comment separately from homework title/description/done state.
- Use the `Activities` page in sidebar to review saved reports in a table and trigger edit/delete/complete actions.
- Mark reports as `Completed` only when all attendance rows are final and each row has a lesson selected.
- Use the `Homework queue` tab inside Activities for follow-up between lectures (bulk monitor pending homework and update done/title/description per child+lesson).
- Homework queue follow-up is lecture-driven: select `Nivo` then `Lecture`, then mark homework done one child at a time.
- Editing from the `Activities` page opens the report modal prefilled for update.
- Submit one report to save attendance/progress details for all listed children in one action.
- Send and receive messages.
- Reply to parent context threads (homework and lecture comments) directly from the global chat dock.
- Lock a conversation thread with the explicit `Lock thread` action (type `CLOSE` to confirm) when communication is complete; closed threads remain visible for audit/history.
- Keep parent-facing information timely and accurate.

## What You Cannot Do

- Create or manage `SUPER_ADMIN` users.
- Promote users outside role policy.
- Perform cross-community privileged operations.
- Manage lessons catalog if restricted to super admin.
- Modify children outside your assigned community.

## Recommended Workflow

1. Keep user records complete and active status correct.
2. Keep children records and parent links up to date.
3. Save attendance reports as draft, then finalize with `Complete lecture` when ready.
4. Use Homework queue daily to clear pending homework before the next lecture.
5. Publish timely posts and use messaging for direct parent communication.
6. Review notifications, respond in active threads, and close completed threads.

## Best Practices

- Validate data before saving.
- Avoid duplicate users/children.
- Confirm destructive actions in dialogs before deletion.

## Daily Checklist

- Check new messages and reply to urgent questions.
- Validate attendance updates before marking lecture completed.
- Review pending rows in Homework queue and update done/title/description after parent/child follow-up.
- Review warning comments after reporting and follow up with parents when needed.
- Confirm new users are assigned to the correct community.
- Review data for typos and missing required fields.
