import { MessageContextType, MESSAGE_CONTEXT_TYPE } from "./types";

const messageContextLabel: Record<MessageContextType, string> = {
  [MESSAGE_CONTEXT_TYPE.GENERAL]: "General",
  [MESSAGE_CONTEXT_TYPE.HOMEWORK]: "Homework",
  [MESSAGE_CONTEXT_TYPE.LECTURE_COMMENT]: "Lecture comment",
  [MESSAGE_CONTEXT_TYPE.ABSENCE_COMMENT]: "Absence comment",
};

type MessageContextChipProps = {
  type: MessageContextType;
  label?: string | null;
};

export function MessageContextChip({ type, label }: MessageContextChipProps) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      {label?.trim() || messageContextLabel[type]}
    </span>
  );
}
