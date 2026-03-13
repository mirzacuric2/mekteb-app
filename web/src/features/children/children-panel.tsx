import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAuthedQuery } from "../common/use-authed-query";

type Props = { canManage: boolean };

export function ChildrenPanel({ canManage }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ssn, setSsn] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [level, setLevel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const children = useAuthedQuery<any[]>("children", "/children", true);

  const createChild = useMutation({
    mutationFn: async () =>
      (await api.post("/children", { firstName, lastName, ssn, birthDate, level })).data,
    onSuccess: async () => {
      setFirstName("");
      setLastName("");
      setSsn("");
      setBirthDate("");
      setLevel("");
      await queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });

  const updateChild = useMutation({
    mutationFn: async () =>
      (await api.patch(`/children/${editingId}`, { firstName, lastName, ssn, birthDate, level })).data,
    onSuccess: async () => {
      setEditingId(null);
      setFirstName("");
      setLastName("");
      setSsn("");
      setBirthDate("");
      setLevel("");
      await queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });

  const deleteChild = useMutation({
    mutationFn: async (id: string) => api.delete(`/children/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });

  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold">Children management</h3>
      {canManage ? (
        <div className="grid gap-2 md:grid-cols-2">
          <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <Input placeholder="SSN" value={ssn} onChange={(e) => setSsn(e.target.value)} />
          <Input placeholder="Birth date (YYYY-MM-DD)" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          <Input placeholder="Level" value={level} onChange={(e) => setLevel(e.target.value)} />
          {editingId ? (
            <Button onClick={() => updateChild.mutate()} disabled={updateChild.isPending}>
              Save child
            </Button>
          ) : (
            <Button onClick={() => createChild.mutate()} disabled={createChild.isPending}>
              Create child
            </Button>
          )}
        </div>
      ) : null}

      <ul className="space-y-2 text-sm">
        {(children.data || []).map((child) => (
          <li key={child.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2">
            <span>
              {child.firstName} {child.lastName} ({child.level})
            </span>
            {canManage ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(child.id);
                    setFirstName(child.firstName);
                    setLastName(child.lastName);
                    setSsn(child.ssn || "");
                    setBirthDate(new Date(child.birthDate).toISOString().slice(0, 10));
                    setLevel(child.level);
                  }}
                >
                  Edit
                </Button>
                <Button variant="outline" onClick={() => deleteChild.mutate(child.id)}>
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
