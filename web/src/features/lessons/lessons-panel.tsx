import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useState } from "react";
import { useAuthedQuery } from "../common/use-authed-query";

type Props = { canManage: boolean };

export function LessonsPanel({ canManage }: Props) {
  const lectures = useAuthedQuery<any[]>("lectures", "/lectures", true);
  const children = useAuthedQuery<any[]>("children", "/children", canManage);
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const createLecture = useMutation({
    mutationFn: async () => {
      const attendance = (children.data || []).slice(0, 3).map((child) => ({
        childId: child.id,
        present: true,
      }));
      return (
        await api.post("/lectures", {
          topic,
          note,
          heldAt: new Date().toISOString(),
          attendance,
        })
      ).data;
    },
    onSuccess: async () => {
      setTopic("");
      setNote("");
      await queryClient.invalidateQueries({ queryKey: ["lectures"] });
    },
  });

  const updateLecture = useMutation({
    mutationFn: async () => (await api.patch(`/lectures/${editingId}`, { topic, note })).data,
    onSuccess: async () => {
      setEditingId(null);
      setTopic("");
      setNote("");
      await queryClient.invalidateQueries({ queryKey: ["lectures"] });
    },
  });

  const deleteLecture = useMutation({
    mutationFn: async (id: string) => api.delete(`/lectures/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lectures"] });
    },
  });

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Lessons management</h3>
      {canManage ? (
        <div className="space-y-2">
          <Input placeholder="Lesson topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Input placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
          {editingId ? (
            <Button onClick={() => updateLecture.mutate()} disabled={!topic || updateLecture.isPending}>
              Save lesson
            </Button>
          ) : (
            <Button onClick={() => createLecture.mutate()} disabled={!topic || createLecture.isPending}>
              Create lesson and attendance
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Users can only view attendance updates.</p>
      )}

      <ul className="space-y-1 text-sm">
        {(lectures.data || []).map((lecture) => (
          <li key={lecture.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2">
            <span>
              {lecture.topic} - {new Date(lecture.heldAt).toLocaleDateString()} ({lecture.attendance.length} marks)
            </span>
            {canManage ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(lecture.id);
                    setTopic(lecture.topic);
                    setNote(lecture.note || "");
                  }}
                >
                  Edit
                </Button>
                <Button variant="outline" onClick={() => deleteLecture.mutate(lecture.id)}>
                  Delete
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
