/** URL `tab` values for `ProgressChildDetailsDrawer` (and deep links). */
export const CHILD_DRAWER_TAB = {
  BASIC_INFO: "basic-info",
  LECTURE_PROGRESS: "lecture-progress",
  HOMEWORK_PROGRESS: "homework-progress",
} as const;

export type ChildDrawerTab = (typeof CHILD_DRAWER_TAB)[keyof typeof CHILD_DRAWER_TAB];

export const DEFAULT_CHILD_DRAWER_TAB: ChildDrawerTab = CHILD_DRAWER_TAB.BASIC_INFO;

export const CHILD_DRAWER_TAB_QUERY_KEY = "tab";

const ALLOWED = new Set<string>(Object.values(CHILD_DRAWER_TAB));

export function isChildDrawerTab(value: string): value is ChildDrawerTab {
  return ALLOWED.has(value);
}

export function parseChildDrawerTab(raw: string | null): ChildDrawerTab {
  if (raw && isChildDrawerTab(raw)) return raw;
  return DEFAULT_CHILD_DRAWER_TAB;
}
