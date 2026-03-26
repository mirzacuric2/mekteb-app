import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertTriangle, BookPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs } from "../../components/ui/tabs";
import { cn } from "../../lib/utils";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthedQuery } from "../common/use-authed-query";
import {
  LESSON_NIVO_LABEL,
  LESSON_NIVO_ORDER,
  LESSON_PROGRAM,
  LESSON_PROGRAM_I18N_KEY,
  LESSON_PROGRAM_ORDER,
  LESSONS_API_PATH,
  LESSONS_QUERY_KEY,
  NIVO_BOOKS_API_PATH,
  NIVO_BOOKS_QUERY_KEY,
  type LessonNivo,
} from "./constants";
import { Lesson, NivoBook } from "./types";
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
import { EmptyStateNotice } from "../common/components/empty-state-notice";

type Props = { canManage: boolean };

export function LessonsPanel({ canManage }: Props) {
  const { t } = useTranslation();
  const lessons = useAuthedQuery<Lesson[]>(LESSONS_QUERY_KEY, LESSONS_API_PATH, true);
  const nivoBooks = useAuthedQuery<NivoBook[]>(NIVO_BOOKS_QUERY_KEY, NIVO_BOOKS_API_PATH, true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [activeProgram, setActiveProgram] = useState<Lesson["program"]>(LESSON_PROGRAM.ILMIHAL);
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
    mutationFn: async (values: LessonFormValues) => {
      const lessonPayload = {
        title: values.title,
        program: values.program,
        nivo: values.program === LESSON_PROGRAM.ILMIHAL ? values.nivo : 0,
      };
      return (await api.post(LESSONS_API_PATH, lessonPayload)).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [LESSONS_QUERY_KEY] });
      toast.success(t("lessonsCreated"));
      setFormOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, t("lessonsCreateFailed"))),
  });

  const updateLesson = useMutation({
    mutationFn: async (values: LessonFormValues) => {
      const lessonPayload = {
        title: values.title,
        program: values.program,
        nivo: values.program === LESSON_PROGRAM.ILMIHAL ? values.nivo : 0,
      };
      return (await api.patch(`${LESSONS_API_PATH}/${editingLesson?.id}`, lessonPayload)).data;
    },
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
        t(LESSON_PROGRAM_I18N_KEY[lesson.program]).toLowerCase().includes(term) ||
        (lesson.nivo > 0 && LESSON_NIVO_LABEL[lesson.nivo as LessonNivo].toLowerCase().includes(term)) ||
        String(lesson.nivo).includes(term)
    );
  }, [lessons.data, search, t]);

  const groupedLessons = useMemo(() => {
    const groups = LESSON_NIVO_ORDER.reduce(
      (acc, currentNivo) => ({ ...acc, [currentNivo]: [] as Lesson[] }),
      {} as Record<LessonNivo, Lesson[]>
    );
    for (const lesson of filteredLessons) {
      if (lesson.program === LESSON_PROGRAM.ILMIHAL && lesson.nivo > 0) {
        groups[lesson.nivo as LessonNivo].push(lesson);
      }
    }
    return groups;
  }, [filteredLessons]);
  const activeTrackLessons = useMemo(
    () => filteredLessons.filter((lesson) => lesson.program === activeProgram),
    [activeProgram, filteredLessons]
  );

  const nivoBookMap = useMemo(() => {
    const map = new Map<LessonNivo, NivoBook>();
    for (const row of nivoBooks.data || []) {
      map.set(row.nivo, row);
    }
    return map;
  }, [nivoBooks.data]);
  const isLessonsListLoading =
    lessons.isLoading ||
    lessons.isFetching;
  const lessonsListErrorMessage = lessons.isError ? getErrorMessage(lessons.error, t("loadingLessons")) : null;

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

        <Tabs
          value={activeProgram}
          onChange={(key) => setActiveProgram(key as Lesson["program"])}
          tabs={LESSON_PROGRAM_ORDER.map((program) => ({ key: program, label: t(LESSON_PROGRAM_I18N_KEY[program]) }))}
        >
        <div className="max-h-[calc(100dvh-220px)] space-y-3 overflow-y-auto pr-1 text-sm">
        {lessonsListErrorMessage ? (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{lessonsListErrorMessage}</span>
          </div>
        ) : isLessonsListLoading ? (
          <LoadingBlock text={t("loadingLessons")} containerClassName="min-h-[240px]" />
        ) : (
          activeProgram === LESSON_PROGRAM.ILMIHAL ? LESSON_NIVO_ORDER.map((group) => (
            <LessonNivoCollapsible
              key={group}
              nivo={group}
              title={LESSON_NIVO_LABEL[group]}
              open={nivoOpen[group]}
              onOpenChange={(next) => setNivoOpen((prev) => ({ ...prev, [group]: next }))}
              lessons={groupedLessons[group]}
              nivoBook={nivoBookMap.get(group) || null}
              canManage={canManage}
              onEditLesson={(lesson) => {
                setEditingLesson(lesson);
                setFormOpen(true);
              }}
              onDeleteLesson={(lesson) => setDeletingLesson(lesson)}
            />
          )) : (
            <div className="space-y-2">
              {activeTrackLessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between rounded-md border border-border bg-white px-3 py-2">
                  <span className="text-sm text-slate-800">{lesson.title}</span>
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => {
                          setEditingLesson(lesson);
                          setFormOpen(true);
                        }}
                      >
                        {t("edit")}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => setDeletingLesson(lesson)}
                      >
                        {t("delete")}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
              {!activeTrackLessons.length ? <EmptyStateNotice>{t("lessonsNoResults")}</EmptyStateNotice> : null}
            </div>
          )
        )}
        </div>
        </Tabs>
      </div>
      <LessonFormDialog
        open={formOpen}
        mode={editingLesson ? "edit" : "create"}
        submitting={createLesson.isPending || updateLesson.isPending}
        initialValues={
          editingLesson
            ? {
                title: editingLesson.title,
                program: editingLesson.program,
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
