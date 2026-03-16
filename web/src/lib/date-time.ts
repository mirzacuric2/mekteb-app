const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

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

export function isValidIsoDateString(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
}
