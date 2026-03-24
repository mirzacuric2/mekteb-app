const LESSON_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Only catalog lessons (UUID keys) support persisted outcomes; topic-only rows do not. */
export function isPersistedLessonOutcomeKey(key: string): boolean {
  return LESSON_ID_UUID_RE.test(key);
}
