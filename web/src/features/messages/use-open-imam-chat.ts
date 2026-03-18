import { useMemo } from "react";
import { ROLE, Role } from "../../types";
import { useSession } from "../auth/session-context";
import { useChatController } from "./chat-controller";
import { useMessageReceiversQuery } from "./use-message-data";
import { MessageContextDraft } from "./types";
import { formatPersonName } from "./name-utils";

const isLimitedMessagingRole = (role: Role | undefined) =>
  role === ROLE.PARENT || role === ROLE.USER || role === ROLE.BOARD_MEMBER;

export function useOpenImamChat() {
  const { session } = useSession();
  const chatController = useChatController();
  const receiversQuery = useMessageReceiversQuery(Boolean(session));

  const defaultImamId = useMemo(() => {
    const receivers = receiversQuery.data || [];
    const adminReceivers = receivers.filter((receiver) => receiver.role === ROLE.ADMIN);
    if (!adminReceivers.length) return "";
    const sorted = [...adminReceivers].sort((a, b) =>
      formatPersonName(a.firstName, a.lastName).localeCompare(formatPersonName(b.firstName, b.lastName), undefined, {
        sensitivity: "base",
      })
    );
    return sorted[0].id;
  }, [receiversQuery.data]);

  const openImamChat = (context: MessageContextDraft) => {
    const isLimitedRole = isLimitedMessagingRole(session?.user.role);
    chatController.openChat({
      resetComposer: true,
      receiverId: isLimitedRole ? defaultImamId : undefined,
      context,
    });
  };

  return {
    openImamChat,
    defaultImamId,
  };
}
