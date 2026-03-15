import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { BookPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useMemo, useState } from "react";
import { useAuthedQuery } from "../common/use-authed-query";
import {
  LESSON_NIVO_LABEL,
  LESSON_NIVO_ORDER,
  LESSONS_API_PATH,
  LESSONS_QUERY_KEY,
} from "./constants";
import { Lesson } from "./types";
import { EntityListToolbar } from "../common/components/entity-list-toolbar";
import { LessonFormDialog, LessonFormValues } from "./lesson-form-dialog";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { Loader } from "../common/components/loader";

type Props = { canManage: boolean };

export function LessonsPanel({ canManage }: Props) {
  const lessons = useAuthedQuery<Lesson[]>(LESSONS_QUERY_KEY, LESSONS_API_PATH, true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const queryClient = useQueryClient();

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      return (error.response?.data as { message?: string } | undefined)?.message || fallback;
    }
    return fallback;
  };

  const createLesson = useMutation({
    mutationFn: async (values: LessonFormValues) => (await api.post(LESSONS_API_PATH, values)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      toast.success("Lesson created.");
      setFormOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Failed to create lesson.")),
  });

  const updateLesson = useMutation({
    mutationFn: async (values: LessonFormValues) =>
      (await api.patch(`${LESSONS_API_PATH}/${editingLesson?.id}`, values)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      toast.success("Lesson updated.");
      setFormOpen(false);
      setEditingLesson(null);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Failed to update lesson.")),
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => api.delete(`${LESSONS_API_PATH}/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      toast.success("Lesson deleted.");
      setDeletingLesson(null);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Failed to delete lesson.")),
  });

  const filteredLessons = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return lessons.data || [];
    return (lessons.data || []).filter(
      (lesson) =>
        lesson.title.toLowerCase().includes(term) ||
        LESSON_NIVO_LABEL[lesson.nivo].toLowerCase().includes(term) ||
        String(lesson.nivo).includes(term)
    );
  }, [lessons.data, search]);

  const groupedLessons = useMemo(() => {
    const groups = LESSON_NIVO_ORDER.reduce(
      (acc, currentNivo) => ({ ...acc, [currentNivo]: [] as Lesson[] }),
      {} as Record<Lesson["nivo"], Lesson[]>
    );
    for (const lesson of filteredLessons) {
      groups[lesson.nivo].push(lesson);
    }
    return groups;
  }, [filteredLessons]);
  const isLessonsListLoading =
    lessons.isLoading ||
    lessons.isFetching;

  return (
    <Card className="space-y-4">
      <EntityListToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search lessons by title or nivo..."
        actions={
          canManage ? (
            <Button
              className="h-10 w-10 px-0 md:w-auto md:px-3 md:gap-2"
              onClick={() => {
                setEditingLesson(null);
                setFormOpen(true);
              }}
            >
              <BookPlus className="h-4 w-4" />
              <span className="hidden md:inline">Create lesson</span>
            </Button>
          ) : undefined
        }
      />
      {!canManage ? <p className="text-sm text-slate-500">Only super admin can create, edit, or delete lessons.</p> : null}

      <div className="max-h-[calc(100dvh-220px)] space-y-3 overflow-y-auto pr-1 text-sm">
        {isLessonsListLoading ? (
          <div className="flex min-h-[240px] justify-center rounded-md border border-dashed border-border pt-6">
            <Loader size="md" />
          </div>
        ) : (
          LESSON_NIVO_ORDER.map((group) => (
            <div key={group} className="space-y-1">
              <h4 className="font-medium">{LESSON_NIVO_LABEL[group]}</h4>
              {groupedLessons[group].length ? (
                groupedLessons[group].map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2"
                  >
                    <span>{lesson.title}</span>
                    {canManage ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingLesson(lesson);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDeletingLesson(lesson);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No lessons.</p>
              )}
            </div>
          ))
        )}
      </div>
      <LessonFormDialog
        open={formOpen}
        mode={editingLesson ? "edit" : "create"}
        submitting={createLesson.isPending || updateLesson.isPending}
        initialValues={
          editingLesson
            ? {
                title: editingLesson.title,
                nivo: editingLesson.nivo,
              }
            : undefined
        }
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingLesson(null);
        }}
        onSubmit={(values) => {
          if (editingLesson) {
            updateLesson.mutate(values);
            return;
          }
          createLesson.mutate(values);
        }}
      />
      <DeleteConfirmDialog
        open={!!deletingLesson}
        onOpenChange={(open) => {
          if (!open) setDeletingLesson(null);
        }}
        title="Delete lesson"
        description={
          deletingLesson ? `Are you sure you want to delete "${deletingLesson.title}"?` : "Delete selected lesson?"
        }
        confirmText="Delete"
        submitting={deleteLesson.isPending}
        onConfirm={() => {
          if (!deletingLesson) return;
          deleteLesson.mutate(deletingLesson.id);
        }}
      />
    </Card>
  );
}
