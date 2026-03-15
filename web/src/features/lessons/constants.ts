export const LESSONS_API_PATH = "/lessons";
export const LESSONS_QUERY_KEY = "lessons";

export const LESSON_NIVO = {
  First: 1,
  Second: 2,
  Third: 3,
  Fourth: 4,
  Fifth: 5,
} as const;

export type LessonNivo = (typeof LESSON_NIVO)[keyof typeof LESSON_NIVO];

export const LESSON_NIVO_ORDER: LessonNivo[] = [
  LESSON_NIVO.First,
  LESSON_NIVO.Second,
  LESSON_NIVO.Third,
  LESSON_NIVO.Fourth,
  LESSON_NIVO.Fifth,
];

export const DEFAULT_LESSON_NIVO: LessonNivo = LESSON_NIVO.First;

export const LESSON_NIVO_LABEL: Record<LessonNivo, string> = {
  [LESSON_NIVO.First]: "Nivo 1",
  [LESSON_NIVO.Second]: "Nivo 2",
  [LESSON_NIVO.Third]: "Nivo 3",
  [LESSON_NIVO.Fourth]: "Nivo 4",
  [LESSON_NIVO.Fifth]: "Nivo 5",
};
