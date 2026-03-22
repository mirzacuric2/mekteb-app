import type { HelpHandbookContent } from "../../types";

export const adminHandbookEn: HelpHandbookContent = {
  documentTitle: "Imam / community admin handbook",
  intro:
    "You operate inside your assigned community: users, children, attendance reports, posts, and community tabs. This handbook is only shown to ADMIN accounts.",
  sections: [
    {
      id: "nav",
      title: "How navigation works",
      bullets: [
        "General: Dashboard, Posts, Help, Notifications.",
        "Management: Users, Children, Activities, Community (singular label when fixed to one community). Lessons is SUPER_ADMIN only.",
        "Top bar: Report activities opens the lecture reporting dialog from any page (same tool as super admin within your scope).",
      ],
    },
    {
      id: "dashboard",
      title: "Dashboard",
      bullets: [
        "Operational snapshot: progress-style cards when applicable, read-only this week on the dashboard (edit events under Community → Events), recent posts with shortcut to Posts.",
        "Use for pulse checks; detailed work is in management sections.",
      ],
    },
    {
      id: "posts",
      title: "Posts",
      bullets: [
        "Create, edit, and delete posts for your community; moderate comments.",
        "Members react and comment. SUPER_ADMIN can also edit/delete when working across communities.",
      ],
    },
    {
      id: "users",
      title: "Users",
      bullets: [
        "Directory and lifecycle for accounts in your community.",
        "Create and manage BOARD_MEMBER and PARENT (and legacy USER) per policy; open drawers for details.",
        "Your own account is excluded from the table list so you do not delete yourself from the grid flow.",
        "You cannot create SUPER_ADMIN or assign platform ADMIN to a community—that is SUPER_ADMIN only.",
      ],
    },
    {
      id: "children",
      title: "Children",
      bullets: [
        "Full community roster: table, search, row actions.",
        "Create/update with required SSN, nivo, community, and at least one parent; adjust nivo and parent links; completed / discontinued / inactive per rules.",
        "Drawer for progress and history. Linked parents may edit a subset of fields; you keep authoritative placement and links.",
      ],
    },
    {
      id: "activities",
      title: "Activities",
      bullets: [
        "Reports table and Homework queue tab for attendance and follow-up.",
        "Report activities (header or here): capture attendance and homework by nivo; save drafts; complete lectures when every row is final and lessons are chosen.",
        "Homework queue: pick nivo + lecture, then update homework per child.",
        "Your lists are single-community—no Community column (super admins see that for multiple communities).",
      ],
    },
    {
      id: "community",
      title: "Community",
      bullets: [
        "Hub: summary, Edit basic info (modal), tabs such as Overview, Board members, Events, Diplomas.",
        "Overview: stats and charts for users, children, and nivo-level signals.",
        "Board members: adjust roster where permitted (auto-save style in current UX).",
        "Events: weekly/month calendar; create/update/delete as allowed; recurrence per product rules.",
        "Diplomas: PDF template and text layout; generate merged PDFs in the browser (see product docs for limits).",
      ],
    },
    {
      id: "notifications-help-messages",
      title: "Notifications, Help, Messages",
      bullets: [
        "Notifications include items from your administrative actions and engagement.",
        "Help shows admin-appropriate guidance when you are logged in as ADMIN.",
        "Chat dock: reply to parents and context threads; Lock thread when a conversation should end (parents start a new thread afterward).",
      ],
    },
    {
      id: "boundaries",
      title: "Boundaries",
      bullets: [
        "All changes stay inside your community.",
        "Lesson catalog changes are SUPER_ADMIN only.",
        "Imam assignment on communities may be read-only for you; super admin governs platform admins.",
      ],
    },
    {
      id: "checklist",
      title: "Daily checklist",
      bullets: [
        "Messages and urgent parent threads.",
        "Attendance drafts → Complete lecture when verified.",
        "Homework queue before the next session.",
        "Posts and events kept current.",
      ],
    },
  ],
};
