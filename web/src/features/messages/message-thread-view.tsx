import { formatDateTime } from "../../lib/date-time";
import { useSession } from "../auth/session-context";
import { MessageRecord, MESSAGE_KIND } from "./types";

type MessageThreadViewProps = {
  messages: MessageRecord[];
};

export function MessageThreadView({ messages }: MessageThreadViewProps) {
  const { session } = useSession();
  const currentUserId = session?.user.id;

  return (
    <div className="space-y-2">
      {messages.map((message) => {
        const isMine = message.senderId === currentUserId;
        const isSystem = message.kind === MESSAGE_KIND.SYSTEM;

        if (isSystem) {
          return (
            <div key={message.id} className="text-center text-xs text-slate-500">
              {message.content}
            </div>
          );
        }

        return (
          <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl p-2 text-sm ${
                isMine ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-900"
              }`}
            >
              <p className="break-words">{message.content}</p>
              <p className={`mt-1 text-[11px] ${isMine ? "text-primary-foreground/80" : "text-slate-500"}`}>
                {formatDateTime(message.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
