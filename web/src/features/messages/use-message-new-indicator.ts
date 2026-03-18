import { useEffect, useMemo, useState } from "react";
import { MessageThreadSummary } from "./types";
import { useMessageThreadsQuery } from "./use-message-data";

const THREAD_LAST_SEEN_STORAGE_KEY = "message-thread-last-seen";
const THREAD_LAST_SEEN_EVENT = "message-thread-last-seen-updated";

function readThreadLastSeenMap() {
  if (typeof window === "undefined") return {};
  const rawValue = window.localStorage.getItem(THREAD_LAST_SEEN_STORAGE_KEY);
  if (!rawValue) return {};
  try {
    const parsed = JSON.parse(rawValue) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistThreadLastSeenMap(value: Record<string, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THREAD_LAST_SEEN_STORAGE_KEY, JSON.stringify(value));
  // Defer cross-component sync to next tick to avoid React
  // "setState while rendering another component" warnings.
  window.setTimeout(() => {
    window.dispatchEvent(new Event(THREAD_LAST_SEEN_EVENT));
  }, 0);
}

function toTimestamp(value: string) {
  return new Date(value).getTime();
}

export function useMessageNewIndicator(enabled: boolean) {
  const threadsQuery = useMessageThreadsQuery(enabled);
  const [threadLastSeenMap, setThreadLastSeenMap] = useState<Record<string, number>>(() => readThreadLastSeenMap());

  const isThreadUnread = (thread: MessageThreadSummary) => {
    const threadUpdatedAt = toTimestamp(thread.updatedAt);
    const lastSeen = threadLastSeenMap[thread.threadId] || 0;
    return threadUpdatedAt > lastSeen;
  };

  const unreadThreadCount = useMemo(
    () => (threadsQuery.data || []).filter((thread) => isThreadUnread(thread)).length,
    [threadLastSeenMap, threadsQuery.data]
  );
  const hasNewMessages = unreadThreadCount > 0;

  const markThreadSeen = (threadId: string, updatedAt?: string) => {
    const nextSeenValue = updatedAt ? toTimestamp(updatedAt) : Date.now();
    setThreadLastSeenMap((previous) => {
      const next = { ...previous, [threadId]: nextSeenValue };
      persistThreadLastSeenMap(next);
      return next;
    });
  };

  useEffect(() => {
    if (!enabled) return;
    setThreadLastSeenMap(readThreadLastSeenMap());
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const syncFromStorage = () => {
      window.setTimeout(() => {
        setThreadLastSeenMap(readThreadLastSeenMap());
      }, 0);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THREAD_LAST_SEEN_STORAGE_KEY) return;
      syncFromStorage();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(THREAD_LAST_SEEN_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(THREAD_LAST_SEEN_EVENT, syncFromStorage);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const threads = threadsQuery.data || [];
    if (!threads.length) return;
    // First-time bootstrap: treat currently loaded threads as already seen.
    if (Object.keys(threadLastSeenMap).length > 0) return;
    const next: Record<string, number> = {};
    for (const thread of threads) {
      next[thread.threadId] = toTimestamp(thread.updatedAt);
    }
    persistThreadLastSeenMap(next);
    setThreadLastSeenMap(next);
  }, [enabled, threadLastSeenMap, threadsQuery.data]);

  return {
    threadsQuery,
    hasNewMessages,
    unreadThreadCount,
    isThreadUnread,
    markThreadSeen,
  };
}
