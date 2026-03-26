import type { HelpHandbookContent } from "../../types";

export const boardMemberHandbookEn: HelpHandbookContent = {
  documentTitle: "Board member handbook",
  intro:
    "You support community governance and transparency. You have more visibility than parents in some places, but day-to-day teaching operations (reports, child records, publishing posts) stay with imams or super admins where the product enforces it.",
  sections: [
    {
      id: "nav",
      title: "How navigation works",
      bullets: [
        "General: Dashboard, Posts, Help, Notifications.",
        "Management: Users, Children, Community (may show as singular Community). You do not see Activities (reports) or Lessons.",
        "Top bar: Messages and notifications like other roles. No Report activities shortcut (imam/super admin only).",
      ],
    },
    {
      id: "dashboard",
      title: "Dashboard",
      bullets: [
        "Same home layout as family roles when progress and weekly events apply to your community assignment.",
        "Recent posts and a link to Posts. Use this screen for oversight, not bulk data entry.",
      ],
    },
    {
      id: "posts",
      title: "Posts",
      bullets: [
        "Read, react, comment; edit your own comments.",
        "Creating new posts is restricted to community ADMIN in the app and API—coordinate with an imam or super admin to publish announcements.",
      ],
    },
    {
      id: "users",
      title: "Users",
      bullets: [
        "Directory view for users in your access scope.",
        "Review the list and open details where the UI allows.",
        "You cannot create, edit, delete, or invite users—only ADMIN and SUPER_ADMIN get those actions.",
      ],
    },
    {
      id: "children",
      title: "Children",
      bullets: [
        "Same Children route as parents: the list shows children linked to your account as parent/guardian. It can be empty if you have no linked children.",
        "Open rows and the drawer for read-only insight on those records, including per-program tabs (Ilmihal, Sufara, Qur'an).",
        "You cannot create, edit, or inactivate children. For community-wide child work, imams use their tools; Community → Overview shows community-level metrics.",
      ],
    },
    {
      id: "community",
      title: "Community",
      bullets: [
        "Your community hub: summary, Overview, Board members, Events, and other tabs shown for your role.",
        "Keep basic community profile accurate where allowed; manage board member assignments per rules (you cannot remove your own board assignment in-app).",
        "Events: create/update/delete when the calendar allows BOARD_MEMBER.",
        "Assigning platform ADMIN to a community is SUPER_ADMIN only. Lessons catalog and Diplomas tab are not board routes in the current layout.",
      ],
    },
    {
      id: "other",
      title: "Notifications, Help, Messages",
      bullets: [
        "Notifications and Help follow your role (no super-admin-only handbook sections on Help).",
        "Use the chat dock to coordinate with Imam/Admin.",
      ],
    },
    {
      id: "boundaries",
      title: "Boundaries",
      bullets: [
        "You are not a substitute for ADMIN on user lifecycle, child CRUD, lecture reporting, homework queue, or post creation today.",
        "Escalate new communities, ADMIN assignment, or lesson catalog needs to SUPER_ADMIN.",
      ],
    },
    {
      id: "workflow",
      title: "Recommended workflow",
      bullets: [
        "Keep community profile and board roster accurate.",
        "Use Events for scheduling work you are allowed to perform.",
        "Partner with ADMIN for posts and child/user operational updates.",
        "Use messages when you need Imam/Admin attention.",
      ],
    },
  ],
};
