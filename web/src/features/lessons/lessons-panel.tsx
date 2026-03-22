import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { BookPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthedQuery } from "../common/use-authed-query";
import {
  LESSON_NIVO_LABEL,
  LESSON_NIVO_ORDER,
  LESSONS_API_PATH,
  LESSONS_QUERY_KEY,
  type LessonNivo,
} from "./constants";
import { Lesson } from "./types";
import {
  ENTITY_LIST_TOOLBAR_ACTION_LABEL_CLASSNAME,
  ENTITY_LIST_TOOLBAR_CREATE_BUTTON_CLASSNAME,
  ENTITY_LIST_TOOLBAR_CREATE_ICON_CLASSNAME,
  ENTITY_LIST_TO_TABLE_STACK_CLASSNAME,
  EntityListToolbar,
  MANAGEMENT_PAGE_CARD_CLASSNAME,
  MANAGEMENT_PAGE_CARD_STACK_CLASSNAME,
} from "../common/components/entity-list-toolbar";
import { LessonNivoCollapsible } from "./lesson-nivo-collapsible";
import { LessonFormDialog, LessonFormValues } from "./lesson-form-dialog";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { LoadingBlock } from "../common/components/loading-block";

type Props = { canManage: boolean };

export function LessonsPanel({ canManage }: Props) {
  const { t } = useTranslation();
  const lessons = useAuthedQuery<Lesson[]>(LESSONS_QUERY_KEY, LESSONS_API_PATH, true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [nivoOpen, setNivoOpen] = useState<Record<LessonNivo, boolean>>(() =>
    LESSON_NIVO_ORDER.reduce(
      (acc, nivo) => {
        acc[nivo] = false;
        return acc;
      },
      {} as Record<LessonNivo, boolean>
    )
  );
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
      toast.success(t("lessonsCreated"));
      setFormOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, t("lessonsCreateFailed"))),
  });

  const updateLesson = useMutation({
    mutationFn: async (values: LessonFormValues) =>
      (await api.patch(`${LESSONS_API_PATH}/${editingLesson?.id}`, values)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      toast.success(t("lessonsUpdated"));
      setFormOpen(false);
      setEditingLesson(null);
    },
    onError: (error) => toast.error(getErrorMessage(error, t("lessonsUpdateFailed"))),
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => api.delete(`${LESSONS_API_PATH}/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      toast.success(t("lessonsDeleted"));
      setDeletingLesson(null);
    },
    onError: (error) => toast.error(getErrorMessage(error, t("lessonsDeleteFailed"))),
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
    <Card className={cn(MANAGEMENT_PAGE_CARD_CLASSNAME, MANAGEMENT_PAGE_CARD_STACK_CLASSNAME)}>
      <div className={ENTITY_LIST_TO_TABLE_STACK_CLASSNAME}>
        <EntityListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder={t("lessonsSearchPlaceholder")}
          actions={
            canManage ? (
              <Button
                variant="outline"
                className={ENTITY_LIST_TOOLBAR_CREATE_BUTTON_CLASSNAME}
                onClick={() => {
                  setEditingLesson(null);
                  setFormOpen(true);
                }}
              >
                <BookPlus className={ENTITY_LIST_TOOLBAR_CREATE_ICON_CLASSNAME} aria-hidden />
                <span className={ENTITY_LIST_TOOLBAR_ACTION_LABEL_CLASSNAME}>{t("lessonsCreate")}</span>
              </Button>
            ) : undefined
          }
        />
        {!canManage ? <p className="text-sm text-slate-500">{t("lessonsSuperAdminOnly")}</p> : null}

        <div className="max-h-[calc(100dvh-220px)] space-y-3 overflow-y-auto pr-1 text-sm">
        {isLessonsListLoading ? (
          <LoadingBlock text={t("loadingLessons")} containerClassName="min-h-[240px]" />
        ) : (
          LESSON_NIVO_ORDER.map((group) => (
            <LessonNivoCollapsible
              key={group}
              nivo={group}
              title={LESSON_NIVO_LABEL[group]}
              open={nivoOpen[group]}
              onOpenChange={(next) => setNivoOpen((prev) => ({ ...prev, [group]: next }))}
              lessons={groupedLessons[group]}
              canManage={canManage}
              onEditLesson={(lesson) => {
                setEditingLesson(lesson);
                setFormOpen(true);
              }}
              onDeleteLesson={(lesson) => setDeletingLesson(lesson)}
            />
          ))
        )}
        </div>
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
        title={t("lessonsDeleteTitle")}
        description={
          deletingLesson ? t("lessonsDeleteDescription", { title: deletingLesson.title }) : t("lessonsDeleteDescriptionFallback")
        }
        confirmText={t("delete")}
        submitting={deleteLesson.isPending}
        onConfirm={() => {
          if (!deletingLesson) return;
          deleteLesson.mutate(deletingLesson.id);
        }}
      />
    </Card>
  );
}
