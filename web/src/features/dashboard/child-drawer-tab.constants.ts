/** Dashboard child quick-view: `?childId=<uuid>&tab=…` on `/app/dashboard`. */
export const DASHBOARD_CHILD_ID_QUERY_KEY = "childId";

/** URL `tab` query values for child progress UI (detail page, drawer, deep links). Query key: `tab`. */
export const CHILD_DRAWER_TAB = {
  BASIC_INFO: "basic-info",
  /** Full child detail page only — linked parents as cards */
  PARENTS: "parents",
  LECTURE_PROGRESS: "lecture-progress",
  /** Child detail page: Sufara + Qur'an timelines in one tab */
  PROGRAMS: "programs",
  SUFARA_PROGRESS: "sufara-progress",
  QURAN_PROGRESS: "quran-progress",
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
