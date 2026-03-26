import type { HelpHandbookContent } from "../../types";

export const parentHandbookEn: HelpHandbookContent = {
  documentTitle: "Parent & family handbook",
  intro:
    "This guide describes what you see in Mekteb as a parent or guardian. It does not include tools for imams or platform staff—those are hidden from your account on purpose.",
  sections: [
    {
      id: "nav",
      title: "How navigation works",
      bullets: [
        "Sidebar: under General you have Dashboard, Posts, Help, and Notifications. Under Management you only see Children—you do not see Users, Activities (reports), Lessons, or Communities.",
        "Top bar: Messages (mail icon) opens the chat dock; Notifications (bell) shows recent items and a link to the full list. You do not see Report activities (that is for imams and super admins).",
        "Breadcrumb: shows which section you are in. The dashboard has no breadcrumb by design.",
      ],
    },
    {
      id: "dashboard",
      title: "Dashboard",
      bullets: [
        "Home after login: community news and your family snapshot.",
        "Progress overview: when you have linked children, you see KPI-style cards and per-child summaries (attendance signals, homework, recent activity) for your children only. Tapping a child opens the side drawer first (URL stays on the dashboard with ?childId=<id>&tab=…). Use the link icon beside the drawer close to open the full child page; the full page adds overview charts and groups Sufara/Qur'an under one Programs tab.",
        "Progress cards include overall learning plus dedicated Sufara and Qur'an program cards.",
        "This week for your family: read-only weekly events when your account has a community. You cannot create or edit events here.",
        "Recent posts: latest community posts with a link to the full Posts section.",
        "You cannot run lecture reports, manage other people’s children, or change community settings from here.",
      ],
    },
    {
      id: "posts",
      title: "Posts",
      bullets: [
        "Read announcements and updates from your community.",
        "You can react, comment, and edit your own comments.",
        "You cannot create posts, edit others’ posts, or delete posts—your imam or super admin handles publishing and moderation.",
      ],
    },
    {
      id: "children",
      title: "Children",
      bullets: [
        "Lists only children linked to your account—not the whole school roster.",
        "Click a row to open the side drawer (quick progress); use the link icon beside close for the full page. Click the child’s name (link icon) to open /app/children/<id> directly (charts, community link in the header, and page-style tabs). On the full page, linked parents live under the Parents tab (card layout); tap a card to open that parent’s profile drawer.",
        "You can edit allowed fields (for example name, SSN, birth date, address) when the edit action is shown.",
        "You cannot create or inactivate children, change community or nivo, or change parent links—those are admin-only.",
        "Shared links use /app/children/<id>; add ?tab=parents, lecture-progress, programs, homework-progress, sufara-progress, quran-progress (mapped to programs on the page), or basic-info (basic-info is default when tab is omitted). Legacy ?childId= on the children list redirects here. Dashboard drawer links use /app/dashboard?childId=<id>&tab=….",
      ],
    },
    {
      id: "notifications",
      title: "Notifications",
      bullets: [
        "Timeline of alerts for your account (posts, homework, attendance, and similar).",
        "Open linked destinations when available; mark items as read.",
        "You cannot see other users’ notifications.",
      ],
    },
    {
      id: "help",
      title: "Help (this page)",
      bullets: [
        "In-app guidance matches your role. You will not see imam-only or super-admin handbook content while logged in as a parent.",
      ],
    },
    {
      id: "messages",
      title: "Messages (chat dock)",
      bullets: [
        "Talk to Imam/Admin from any screen without leaving the page.",
        "Open threads from the launcher; send messages in open threads; start new threads (including from homework or lecture-comment context when offered).",
        "If Imam/Admin locks a thread, it becomes read-only—start a new thread for follow-up.",
      ],
    },
    {
      id: "missing",
      title: "If something is missing",
      bullets: [
        "Forbidden or missing buttons: your role is not allowed that action—expected on management features.",
        "Empty lists: you may have no linked children yet, or no new content—ask your community imam if data should appear.",
      ],
    },
    {
      id: "reminders",
      title: "Quick reminders",
      bullets: [
        "Keep your password private; log out on shared devices.",
        "Use this handbook for parent scope only.",
      ],
    },
  ],
};
