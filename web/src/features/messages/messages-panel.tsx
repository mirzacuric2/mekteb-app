import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Select } from "../../components/ui/select";
import { useAuthedQuery } from "../common/use-authed-query";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";

export function MessagesPanel() {
  const [receiverId, setReceiverId] = useState("");
  const [content, setContent] = useState("");
  const [deletingMessage, setDeletingMessage] = useState<{ id: string; content: string } | null>(null);
  const messages = useAuthedQuery<any[]>("messages", "/messages", true);
  const users = useAuthedQuery<any[]>("message-users", "/directory", true);
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: async () => (await api.post("/messages", { receiverId, content })).data,
    onSuccess: async () => {
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => api.delete(`/messages/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["messages"] });
      setDeletingMessage(null);
    },
  });

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Messages</h3>
      <div className="grid gap-2 md:grid-cols-2">
        <Select value={receiverId} onChange={(e) => setReceiverId(e.target.value)}>
          <option value="">Select receiver</option>
          {(users.data || []).map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </Select>
        <Input placeholder="Message" value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      <Button onClick={() => sendMessage.mutate()} disabled={!receiverId || !content}>
        Send message
      </Button>
      <ul className="space-y-1 text-sm">
        {(messages.data || []).map((msg) => (
          <li key={msg.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
            <span>{msg.content}</span>
            <Button
              variant="outline"
              onClick={() =>
                setDeletingMessage({
                  id: msg.id,
                  content: msg.content,
                })
              }
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      <DeleteConfirmDialog
        open={!!deletingMessage}
        onOpenChange={(open) => {
          if (!open) setDeletingMessage(null);
        }}
        title="Delete message"
        description={
          deletingMessage ? `Are you sure you want to delete "${deletingMessage.content}"?` : "Delete selected message?"
        }
        confirmText="Delete"
        submitting={deleteMessage.isPending}
        onConfirm={() => {
          if (!deletingMessage) return;
          deleteMessage.mutate(deletingMessage.id);
        }}
      />
    </Card>
  );
}
