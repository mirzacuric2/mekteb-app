export type SectionKey = "posts" | "users" | "children" | "lessons" | "messages" | "notifications";

export type DashboardSection = {
  key: SectionKey;
  labelKey: "posts" | "users" | "children" | "attendance" | "messages" | "notifications";
  group: "general" | "management";
};

export const dashboardSections: DashboardSection[] = [
  { key: "posts", labelKey: "posts", group: "general" },
  { key: "messages", labelKey: "messages", group: "general" },
  { key: "notifications", labelKey: "notifications", group: "general" },
  { key: "users", labelKey: "users", group: "management" },
  { key: "children", labelKey: "children", group: "management" },
  { key: "lessons", labelKey: "attendance", group: "management" },
];

export function isSectionKey(value: string): value is SectionKey {
  return dashboardSections.some((section) => section.key === value);
}
