import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAuthedQuery } from "../common/use-authed-query";

export function MessagesPanel() {
  const [receiverId, setReceiverId] = useState("");
  const [content, setContent] = useState("");
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
    },
  });

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Messages</h3>
      <div className="grid gap-2 md:grid-cols-2">
        <select
          className="rounded-md border border-input bg-white px-3 py-2 text-sm"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
        >
          <option value="">Select receiver</option>
          {(users.data || []).map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
        <Input placeholder="Message" value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      <Button onClick={() => sendMessage.mutate()} disabled={!receiverId || !content}>
        Send message
      </Button>
      <ul className="space-y-1 text-sm">
        {(messages.data || []).map((msg) => (
          <li key={msg.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
            <span>{msg.content}</span>
            <Button variant="outline" onClick={() => deleteMessage.mutate(msg.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
