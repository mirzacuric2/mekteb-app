export type SectionKey =
  | "dashboard"
  | "posts"
  | "users"
  | "children"
  | "activities"
  | "lessons"
  | "communities"
  | "notifications"
  | "help"
  | "settings";

export type DashboardSection = {
  key: SectionKey;
  labelKey:
    | "dashboard"
    | "posts"
    | "users"
    | "children"
    | "activities"
    | "lessons"
    | "communities"
    | "notifications"
    | "help"
    | "settings";
  group: "general" | "management" | "support";
};

export const dashboardSections: DashboardSection[] = [
  { key: "dashboard", labelKey: "dashboard", group: "general" },
  { key: "posts", labelKey: "posts", group: "general" },
  { key: "help", labelKey: "help", group: "support" },
  { key: "settings", labelKey: "settings", group: "support" },
  { key: "notifications", labelKey: "notifications", group: "general" },
  { key: "users", labelKey: "users", group: "management" },
  { key: "children", labelKey: "children", group: "management" },
  { key: "activities", labelKey: "activities", group: "management" },
  { key: "lessons", labelKey: "lessons", group: "management" },
  { key: "communities", labelKey: "communities", group: "management" },
];

export function isSectionKey(value: string): value is SectionKey {
  return dashboardSections.some((section) => section.key === value);
}
