export const MESSAGE_QUERY_KEY = {
  THREADS: "message-threads",
  THREAD: "message-thread",
  RECEIVERS: "message-receivers",
} as const;

export const MESSAGE_API_PATH = {
  THREADS: "/message-threads",
  SEND: "/messages",
  RECEIVERS: "/directory",
} as const;

export const MESSAGE_POLL_INTERVAL_MS = 30_000;
