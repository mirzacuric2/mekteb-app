import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { OpenChatPayload } from "./types";

type ChatControllerState = {
  isOpen: boolean;
  activeThreadId: string | null;
  receiverId: string;
  context: OpenChatPayload["context"] | null;
};

type ChatControllerContextValue = ChatControllerState & {
  openChat: (payload?: OpenChatPayload) => void;
  closeChat: () => void;
  toggleChat: () => void;
  selectThread: (threadId: string | null) => void;
  setReceiverId: (receiverId: string) => void;
  clearComposer: () => void;
};

const ChatControllerContext = createContext<ChatControllerContextValue | null>(null);

const initialState: ChatControllerState = {
  isOpen: false,
  activeThreadId: null,
  receiverId: "",
  context: null,
};

export function ChatControllerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ChatControllerState>(initialState);

  const openChat = useCallback((payload?: OpenChatPayload) => {
    setState((prev) => ({
      isOpen: true,
      activeThreadId: payload?.threadId ?? (payload?.resetComposer ? null : prev.activeThreadId),
      receiverId: payload?.receiverId ?? (payload?.resetComposer ? "" : prev.receiverId),
      context: payload?.context ?? (payload?.resetComposer ? null : prev.context),
    }));
  }, []);

  const closeChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const toggleChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const selectThread = useCallback((threadId: string | null) => {
    setState((prev) => ({
      ...prev,
      activeThreadId: threadId,
    }));
  }, []);

  const setReceiverId = useCallback((receiverId: string) => {
    setState((prev) => ({ ...prev, receiverId }));
  }, []);

  const clearComposer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeThreadId: null,
      receiverId: "",
      context: null,
    }));
  }, []);

  const value = useMemo<ChatControllerContextValue>(
    () => ({
      ...state,
      openChat,
      closeChat,
      toggleChat,
      selectThread,
      setReceiverId,
      clearComposer,
    }),
    [clearComposer, closeChat, openChat, selectThread, setReceiverId, state, toggleChat]
  );

  return <ChatControllerContext.Provider value={value}>{children}</ChatControllerContext.Provider>;
}

export function useChatController() {
  const value = useContext(ChatControllerContext);
  if (!value) throw new Error("useChatController must be used inside ChatControllerProvider");
  return value;
}
