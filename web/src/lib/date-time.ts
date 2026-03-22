const TIME_24H_OPTIONS = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
} as const;

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit",
  ...TIME_24H_OPTIONS,
});

const TIME_ONLY_FORMATTER = new Intl.DateTimeFormat(undefined, TIME_24H_OPTIONS);

const DATE_ONLY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit",
});
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDateTime(value: string | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return DATE_TIME_FORMATTER.format(date);
}

export function formatDate(value: string | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return DATE_ONLY_FORMATTER.format(date);
}

export function formatTime(value: string | Date) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return TIME_ONLY_FORMATTER.format(date);
}

export function isValidIsoDateString(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
}

export function getIsoWeekYearAndNumber(input: Date): { isoYear: number; week: number } {
  const d = new Date(input.getFullYear(), input.getMonth(), input.getDate());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const isoYear = d.getFullYear();
  const week1 = new Date(isoYear, 0, 4);
  const week =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return { isoYear, week };
}
