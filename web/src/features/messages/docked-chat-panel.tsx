import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  SendHorizonal,
  X,
} from "lucide-react";
import { ROLE } from "../../types";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { formatDateTime } from "../../lib/date-time";
import { useSession } from "../auth/session-context";
import { useChatController } from "./chat-controller";
import { MessageContextChip } from "./message-context-chip";
import { MessageThreadView } from "./message-thread-view";
import { useMessageReceiversQuery, useMessageThreadQuery } from "./use-message-data";
import { useCloseMessageThreadMutation, useSendMessageMutation } from "./use-message-mutations";
import { MESSAGE_THREAD_STATUS, MessageThreadSummary } from "./types";
import { formatPersonName } from "./name-utils";
import { useMessageNewIndicator } from "./use-message-new-indicator";

const isLimitedMessagingRole = (role: string | undefined) =>
  role === ROLE.PARENT || role === ROLE.USER || role === ROLE.BOARD_MEMBER;

export function DockedChatPanel() {
  const { t } = useTranslation();
  const { session } = useSession();
  const {
    isOpen,
    activeThreadId,
    receiverId,
    context,
    openChat,
    closeChat,
    selectThread,
    setReceiverId,
    clearComposer,
  } = useChatController();
  const [content, setContent] = useState("");
  const [threadSearch, setThreadSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [showClosedThreads, setShowClosedThreads] = useState(false);
  const threadScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const canUseChat = Boolean(session);
  const messageIndicator = useMessageNewIndicator(canUseChat);
  const threadsQuery = messageIndicator.threadsQuery;
  const receiversQuery = useMessageReceiversQuery(canUseChat && isOpen);
  const threadDetailsQuery = useMessageThreadQuery(activeThreadId, canUseChat && isOpen);
  const sendMessageMutation = useSendMessageMutation();
  const closeThreadMutation = useCloseMessageThreadMutation();

  const role = session?.user.role;
  const isLimitedRole = isLimitedMessagingRole(role);
  const canCloseThread = role === ROLE.ADMIN || role === ROLE.SUPER_ADMIN;

  const sortedReceivers = useMemo(() => {
    const items = receiversQuery.data || [];
    const sorted = [...items].sort((a, b) =>
      formatPersonName(a.firstName, a.lastName).localeCompare(formatPersonName(b.firstName, b.lastName), undefined, {
        sensitivity: "base",
      })
    );
    if (!isLimitedRole) return sorted;
    return sorted.filter((item) => item.role === ROLE.ADMIN);
  }, [isLimitedRole, receiversQuery.data]);

  const activeThread = useMemo(
    () => (threadsQuery.data || []).find((thread) => thread.threadId === activeThreadId) || null,
    [activeThreadId, threadsQuery.data]
  );
  const sortedThreads = useMemo(
    () =>
      [...(threadsQuery.data || [])].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [threadsQuery.data]
  );
  const openThreads = useMemo(
    () => sortedThreads.filter((thread) => thread.threadStatus !== MESSAGE_THREAD_STATUS.CLOSED),
    [sortedThreads]
  );
  const closedThreads = useMemo(
    () => sortedThreads.filter((thread) => thread.threadStatus === MESSAGE_THREAD_STATUS.CLOSED),
    [sortedThreads]
  );
  const normalizedThreadSearch = threadSearch.trim().toLowerCase();
  const threadMatchesSearch = (thread: MessageThreadSummary) => {
    if (!normalizedThreadSearch) return true;
    const name = formatPersonName(thread.counterpart.firstName, thread.counterpart.lastName).toLowerCase();
    const preview = (thread.lastMessage || "").toLowerCase();
    return name.includes(normalizedThreadSearch) || preview.includes(normalizedThreadSearch);
  };
  const visibleOpenThreads = useMemo(
    () => openThreads.filter((thread) => threadMatchesSearch(thread)),
    [openThreads, normalizedThreadSearch]
  );
  const visibleClosedThreads = useMemo(
    () => closedThreads.filter((thread) => threadMatchesSearch(thread)),
    [closedThreads, normalizedThreadSearch]
  );

  useEffect(() => {
    if (!isOpen || activeThreadId || receiverId || !sortedReceivers.length) return;
    setReceiverId(sortedReceivers[0].id);
  }, [activeThreadId, isOpen, receiverId, setReceiverId, sortedReceivers]);

  useEffect(() => {
    if (!activeThread || receiverId) return;
    setReceiverId(activeThread.counterpart.id);
  }, [activeThread, receiverId, setReceiverId]);

  if (!canUseChat) return null;

  const isThreadClosed = threadDetailsQuery.data?.threadStatus === MESSAGE_THREAD_STATUS.CLOSED;
  const canWriteActiveThread = threadDetailsQuery.data?.canWrite !== false;
  const sendingBlocked = Boolean(activeThreadId && (isThreadClosed || !canWriteActiveThread));
  const activeMessageCount = threadDetailsQuery.data?.messages.length || 0;

  const handleSendMessage = async () => {
    const trimmed = content.trim();
    if (!trimmed || !receiverId || sendMessageMutation.isPending) return;
    const response = await sendMessageMutation.mutateAsync({
      receiverId,
      content: trimmed,
      threadId: activeThreadId || undefined,
      context: activeThreadId ? undefined : context || undefined,
    });
    setContent("");
    if (response?.threadId && !activeThreadId) {
      selectThread(response.threadId);
      messageIndicator.markThreadSeen(response.threadId);
    }
  };

  const handleCloseThread = async () => {
    if (!activeThreadId || closeThreadMutation.isPending) return;
    const counterpartName = activeThread
      ? formatPersonName(activeThread.counterpart.firstName, activeThread.counterpart.lastName)
      : "this parent";
    const confirmation = window.prompt(
      `Lock thread with ${counterpartName}.\nType CLOSE to confirm.\n\nAfter locking, parents cannot reply in this thread and must start a new one.`
    );
    if (!confirmation || confirmation.trim().toUpperCase() !== "CLOSE") return;
    await closeThreadMutation.mutateAsync({ threadId: activeThreadId });
  };

  const handleCloseChat = () => {
    setContent("");
    setThreadSearch("");
    setMobileView("list");
    clearComposer();
    closeChat();
  };

  useEffect(() => {
    if (!isOpen || !activeThreadId) return;
    const element = threadScrollContainerRef.current;
    if (!element) return;
    const frameId = window.requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeMessageCount, activeThreadId, isOpen]);

  useEffect(() => {
    if (!isOpen || !activeThread) return;
    messageIndicator.markThreadSeen(activeThread.threadId, activeThread.updatedAt);
  }, [activeThread?.threadId, activeThread?.updatedAt, isOpen]);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    setMobileView("list");
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (chatContainerRef.current?.contains(target)) return;
      closeChat();
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [closeChat, isOpen]);

  const handleSelectThread = (thread: MessageThreadSummary) => {
    selectThread(thread.threadId);
    setReceiverId(thread.counterpart.id);
    messageIndicator.markThreadSeen(thread.threadId, thread.updatedAt);
    if (isMobile) setMobileView("thread");
  };

  const startNewMessage = () => {
    setContent("");
    clearComposer();
    selectThread(null);
    openChat({ resetComposer: true });
    if (isMobile) setMobileView("thread");
  };

  const renderThreadRow = (thread: MessageThreadSummary, useMutedStyle: boolean) => (
    <button
      key={thread.threadId}
      type="button"
      className={`w-full rounded-md border px-2 py-2 text-left text-xs transition-colors ${
        thread.threadId === activeThreadId
          ? "border-primary bg-primary/10 text-primary"
          : useMutedStyle
            ? "border-border bg-slate-50 text-slate-700 hover:bg-slate-100"
            : "border-border bg-white text-slate-700 hover:bg-slate-50"
      }`}
      onClick={() => handleSelectThread(thread)}
    >
      <div className="flex items-center gap-2">
        <p className="flex min-w-0 flex-1 items-center gap-1 font-medium leading-tight">
          {messageIndicator.isThreadUnread(thread) ? (
            <span className="mt-0.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-primary/90" aria-hidden="true" />
          ) : null}
          <span className="truncate">{formatPersonName(thread.counterpart.firstName, thread.counterpart.lastName)}</span>
        </p>
        <p className="max-w-[48%] shrink text-[10px] text-slate-500 truncate whitespace-nowrap">{formatDateTime(thread.updatedAt)}</p>
      </div>
      <p className="mt-0 truncate text-[11px] leading-tight text-slate-500">{thread.lastMessage}</p>
      {thread.threadStatus === MESSAGE_THREAD_STATUS.CLOSED ? (
        <span className="mt-1 inline-flex rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">Closed</span>
      ) : null}
    </button>
  );

  const renderConversationPane = (showBackButton: boolean) => (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
      {showBackButton ? (
        <Button type="button" variant="outline" className="h-8 w-fit px-2 py-1 text-xs" onClick={() => setMobileView("list")}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      ) : null}
      {activeThread ? (
        <div className="rounded-md border border-border bg-slate-50 px-2 py-1 text-xs">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 truncate font-medium text-slate-800">
              {formatPersonName(activeThread.counterpart.firstName, activeThread.counterpart.lastName)}
              {activeThread.threadStatus === MESSAGE_THREAD_STATUS.CLOSED ? (
                <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">Closed</span>
              ) : null}
            </p>
            <div className="inline-flex items-center gap-1">
              {canCloseThread && activeThread.threadStatus !== MESSAGE_THREAD_STATUS.CLOSED ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-6 border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700 hover:bg-red-100"
                  onClick={handleCloseThread}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Lock thread
                </Button>
              ) : null}
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <MessageContextChip type={activeThread.contextType} label={activeThread.contextLabel} />
          </div>
          {activeThread.contextPreview ? <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">{activeThread.contextPreview}</p> : null}
        </div>
      ) : null}

      {!activeThreadId ? (
        <>
          {context ? (
            <div className="rounded-md border border-border bg-slate-50 px-2 py-1">
              <p className="text-xs font-medium text-slate-700">Context</p>
              <div className="mt-1">
                <MessageContextChip type={context.type} label={context.label} />
              </div>
              {context.preview ? <p className="mt-1 line-clamp-2 text-xs text-slate-600">{context.preview}</p> : null}
            </div>
          ) : null}
          <Select value={receiverId} onChange={(event) => setReceiverId(event.target.value)}>
            <option value="">Select receiver</option>
            {sortedReceivers.map((receiver) => (
              <option key={receiver.id} value={receiver.id}>
                {formatPersonName(receiver.firstName, receiver.lastName)}
              </option>
            ))}
          </Select>
        </>
      ) : (
        <div ref={threadScrollContainerRef} className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-white p-2">
          {threadDetailsQuery.isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            </div>
          ) : (
            <MessageThreadView messages={threadDetailsQuery.data?.messages || []} />
          )}
        </div>
      )}

      {sendingBlocked ? (
        <p className="inline-flex items-center gap-1 text-xs text-amber-700">
          <Lock className="h-3.5 w-3.5" />
          This thread is closed. Start a new thread to continue.
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Input
          placeholder={sendingBlocked ? "Thread is closed" : "Write a message..."}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={sendingBlocked}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            handleSendMessage().catch(() => undefined);
          }}
        />
        <Button
          type="button"
          onClick={() => {
            handleSendMessage().catch(() => undefined);
          }}
          disabled={!content.trim() || !receiverId || sendMessageMutation.isPending || sendingBlocked}
        >
          {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  const renderThreadListPane = (mobileLayout: boolean) => (
    <aside className={`flex h-full flex-col p-2 ${mobileLayout ? "w-full min-w-0" : "w-[260px] min-w-[260px]"}`}>
      <div className="flex items-center gap-2">
        <Input
          value={threadSearch}
          onChange={(event) => setThreadSearch(event.target.value)}
          placeholder="Search"
          className="h-8 min-w-0 flex-1 text-xs"
        />
      </div>

      <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
        {visibleOpenThreads.length ? (
          <div className="space-y-2">{visibleOpenThreads.map((thread) => renderThreadRow(thread, false))}</div>
        ) : (
          <p className="rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-500">No active conversations.</p>
        )}

        {visibleClosedThreads.length ? (
          <div className="space-y-1 pt-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
              onClick={() => setShowClosedThreads((prev) => !prev)}
            >
              {showClosedThreads ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {`Closed (${visibleClosedThreads.length})`}
            </button>
            {showClosedThreads ? <div className="space-y-2">{visibleClosedThreads.map((thread) => renderThreadRow(thread, true))}</div> : null}
          </div>
        ) : null}
      </div>
    </aside>
  );

  return (
    <div ref={chatContainerRef} className="pointer-events-none fixed bottom-4 right-4 z-[60] max-w-[calc(100vw-1.5rem)]">
      {!isOpen ? (
        <button
          type="button"
          className="pointer-events-auto relative inline-flex h-10 w-auto items-center justify-between gap-2 rounded-full border border-border bg-white px-4 text-sm font-medium text-slate-700 shadow-lg transition-colors hover:bg-slate-50"
          onClick={() => openChat()}
          aria-label="Open chat"
        >
          <span className="inline-flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>{t("chat")}</span>
          </span>
          {messageIndicator.hasNewMessages ? (
            <span
              className="absolute right-2 top-2 inline-flex h-2.5 w-2.5 rounded-full bg-primary/90 ring-2 ring-white sm:static sm:ml-1"
              aria-hidden="true"
            >
            </span>
          ) : null}
        </button>
      ) : (
        <Card
          className={`pointer-events-auto flex flex-col overflow-hidden border border-border bg-white shadow-xl p-2 ${
            isMobile ? "h-[78vh] w-[calc(100vw-1.5rem)]" : "h-[620px] w-[700px] max-w-[calc(100vw-1.5rem)]"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-3 pb-2 pt-1.5">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MessageSquare className="h-4 w-4" />
              {t("messages")}
            </div>
            <div className="inline-flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                className={
                  isMobile
                    ? "h-7 border-primary/25 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary shadow-sm hover:bg-primary/10"
                    : "h-8 border-primary/25 bg-primary/5 px-2 py-1 text-xs font-medium text-primary shadow-sm hover:bg-primary/10"
                }
                onClick={startNewMessage}
              >
                <Plus className={isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} />
                {t("newMessage")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-2 py-1 text-xs"
                onClick={handleCloseChat}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isMobile ? (
            mobileView === "list" ? (
              renderThreadListPane(true)
            ) : (
              renderConversationPane(true)
            )
          ) : (
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="flex min-h-0 flex-1 flex-col border-r border-border">{renderConversationPane(false)}</div>
              {renderThreadListPane(false)}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
