import type { HelpHandbookContent } from "../../types";

export const superAdminHandbookEn: HelpHandbookContent = {
  documentTitle: "Super admin handbook",
  intro:
    "You work across communities: users, communities, lesson catalog, and reporting with multi-community context. This handbook is only visible to SUPER_ADMIN accounts.",
  sections: [
    {
      id: "nav",
      title: "How navigation works",
      bullets: [
        "Sidebar: same as admins plus Lessons under Management.",
        "Communities: open the list at /app/communities, then a detail route /app/communities/:id for a selected community.",
        "Top bar: Report activities with broader data visibility than a single-community admin.",
      ],
    },
    {
      id: "dashboard",
      title: "Dashboard",
      bullets: [
        "Landing: recent posts and navigation into work areas.",
        "Progress KPI cards and the weekly events preview block are not shown for SUPER_ADMIN in the current app—use Children, Activities, and Community detail for operational insight.",
      ],
    },
    {
      id: "posts",
      title: "Posts",
      bullets: [
        "Read and moderate like admins. Creating posts may be community-ADMIN-only in the API—use patch/delete and moderation where granted, or coordinate with a community ADMIN for new posts if POST is restricted.",
      ],
    },
    {
      id: "users",
      title: "Users",
      bullets: [
        "All communities (search, filters, pagination as implemented).",
        "Create users as ADMIN, BOARD_MEMBER, or PARENT; move users between communities; full edit/delete within policy.",
      ],
    },
    {
      id: "children",
      title: "Children",
      bullets: [
        "Cross-community visibility when needed; community picker on create/update where applicable.",
        "Minimize exposure of sensitive fields (SSN) per governance rules.",
      ],
    },
    {
      id: "activities",
      title: "Activities",
      bullets: [
        "Same Reports and Homework queue tools as ADMIN, with multi-community context.",
        "Reports and Homework queue tables include a Community column so rows from different communities are distinguishable.",
      ],
    },
    {
      id: "lessons",
      title: "Lessons",
      bullets: [
        "Shared lesson catalog (nivo-grouped list, CRUD). Only SUPER_ADMIN has this route in the sidebar and route guard.",
        "Track model: Ilmihal (nivo-based), Sufara (Arabic-letter lessons), and Qur'an (free-text lesson topics from reports).",
      ],
    },
    {
      id: "communities",
      title: "Communities",
      bullets: [
        "Create communities (only this role), inactivate (soft-delete), assign community admins, open any community’s tabs (Overview, Board members, Events, Diplomas) with appropriate access.",
        "Global communities list search is super-admin only in the current UI.",
        "Board member picker lists BOARD_MEMBER users; assigning platform ADMIN users to a community is your governance responsibility.",
      ],
    },
    {
      id: "notifications-help-messages",
      title: "Notifications, Help, Messages",
      bullets: [
        "Help includes super-admin-only guidance when logged in as this role.",
        "Use messaging for escalations; thread locking works like admin.",
      ],
    },
    {
      id: "security",
      title: "Security and governance",
      bullets: [
        "Protect credentials; never share super-admin access.",
        "Treat role changes, deletes, and community lifecycle as audit-sensitive.",
        "Keep lesson naming and nivo usage consistent for admins and reports.",
      ],
    },
    {
      id: "weekly",
      title: "Weekly operations",
      bullets: [
        "Verify new admins and community assignments.",
        "Sample lesson catalog and cross-community reporting where communities need support.",
        "Follow up on stuck homework queues or reporting patterns.",
      ],
    },
  ],
};
