import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BookMarked, BookOpen, LayoutList, UserRound, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useChildByIdQuery } from "../children/use-children-data";
import { Tabs } from "../../components/ui/tabs";
import { NaValue } from "../common/components/na-value";
import { useAuthedQuery } from "../common/use-authed-query";
import {
  LESSONS_API_PATH,
  LESSONS_QUERY_KEY,
  LESSON_PROGRAM,
  LESSON_PROGRAM_I18N_KEY,
  NIVO_BOOKS_API_PATH,
  NIVO_BOOKS_QUERY_KEY,
} from "../lessons/constants";
import { NivoBookLink } from "../lessons/nivo-book-link";
import { Lesson, NivoBook } from "../lessons/types";
import { ChildLessonOutcome, ChildRecord } from "../children/types";
import { ChildParentsTabCards } from "../children/child-parents-tab-cards";
import { NivoProgress } from "../children/nivo-progress";
import { LECTURE_STATUS } from "../reporting/reporting.constants";
import { formatDate } from "../../lib/date-time";
import { EntityDetailTable, EntityDetailTableRow } from "../common/components/entity-detail-components";
import {
  HOMEWORK_PROGRESS_STATUS,
  HomeworkProgressItem,
  ProgressHomeworkTimeline,
} from "./progress-homework-timeline";
import { useOpenImamChat } from "../messages/use-open-imam-chat";
import { MESSAGE_CONTEXT_TYPE } from "../messages/types";
import { useRoleAccess } from "../auth/use-role-access";
import { LoadingBlock } from "../common/components/loading-block";
import { EmptyStateNotice } from "../common/components/empty-state-notice";
import { isPersistedLessonOutcomeKey } from "./progress-lesson-outcome.constants";
import { hasReportedHomework } from "./attendance-homework";
import { LectureProgressLessonCard, type LectureProgressLessonItem } from "./lecture-progress-lesson-card";
import {
  CHILD_DRAWER_TAB,
  CHILD_DRAWER_TAB_QUERY_KEY,
  DEFAULT_CHILD_DRAWER_TAB,
  parseChildDrawerTab,
  type ChildDrawerTab,
} from "./child-drawer-tab.constants";

export type ChildProgressDetailLayout = "drawer" | "page";

type ChildProgressDetailInnerProps = {
  child: ChildRecord | null;
  isLoading?: boolean;
  syncTabToSearchParams?: boolean;
  childrenFetchMineOnly: boolean;
  /** When false, skip refetch and lesson/book queries (e.g. drawer closed). */
  queriesEnabled?: boolean;
  showTabIcons?: boolean;
  /** Page groups Sufara + Qur'an under one "Programs" tab; drawer keeps separate tabs. */
  detailLayout?: ChildProgressDetailLayout;
  /** When set with `detailLayout="page"`, shows a **Parents** tab (card list + opens parent profile). */
  onOpenParentProfile?: (parentId: string) => void;
};

function toEventDate(occurredAt: string | null, fallback: string) {
  if (!occurredAt) return fallback;
  return occurredAt;
}

export function ChildProgressDetailInner({
  child,
  isLoading = false,
  syncTabToSearchParams = true,
  childrenFetchMineOnly,
  queriesEnabled = true,
  showTabIcons = false,
  detailLayout = "drawer",
  onOpenParentProfile,
}: ChildProgressDetailInnerProps) {
  const { t } = useTranslation();
  const showParentsTab = detailLayout === "page" && Boolean(onOpenParentProfile);
  const [searchParams, setSearchParams] = useSearchParams();
  const [localTab, setLocalTab] = useState<ChildDrawerTab>(DEFAULT_CHILD_DRAWER_TAB);
  const prevChildIdRef = useRef<string | null>(null);
  const tabParam = searchParams.get(CHILD_DRAWER_TAB_QUERY_KEY);

  useEffect(() => {
    const id = child?.id ?? null;
    if (!id) {
      prevChildIdRef.current = null;
      return;
    }
    const prev = prevChildIdRef.current;
    if (prev && prev !== id) {
      if (syncTabToSearchParams) {
        setSearchParams(
          (prevParams) => {
            const p = new URLSearchParams(prevParams);
            p.delete(CHILD_DRAWER_TAB_QUERY_KEY);
            return p;
          },
          { replace: true }
        );
      } else {
        setLocalTab(DEFAULT_CHILD_DRAWER_TAB);
      }
    }
    prevChildIdRef.current = id;
  }, [child?.id, setSearchParams, syncTabToSearchParams]);

  const rawActiveTab = syncTabToSearchParams ? parseChildDrawerTab(tabParam) : localTab;
  const activeTab =
    detailLayout === "page" &&
    (rawActiveTab === CHILD_DRAWER_TAB.SUFARA_PROGRESS || rawActiveTab === CHILD_DRAWER_TAB.QURAN_PROGRESS)
      ? CHILD_DRAWER_TAB.PROGRAMS
      : rawActiveTab;

  useEffect(() => {
    if (detailLayout !== "page" || !syncTabToSearchParams) return;
    const raw = parseChildDrawerTab(tabParam);
    if (raw !== CHILD_DRAWER_TAB.SUFARA_PROGRESS && raw !== CHILD_DRAWER_TAB.QURAN_PROGRESS) return;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set(CHILD_DRAWER_TAB_QUERY_KEY, CHILD_DRAWER_TAB.PROGRAMS);
        return p;
      },
      { replace: true }
    );
  }, [detailLayout, syncTabToSearchParams, tabParam, setSearchParams]);

  const setActiveTab = (key: string) => {
    const nextTab = parseChildDrawerTab(key);
    if (syncTabToSearchParams) {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (nextTab === DEFAULT_CHILD_DRAWER_TAB) {
            p.delete(CHILD_DRAWER_TAB_QUERY_KEY);
          } else {
            p.set(CHILD_DRAWER_TAB_QUERY_KEY, nextTab);
          }
          return p;
        },
        { replace: true }
      );
    } else {
      setLocalTab(nextTab);
    }
  };

  const { openImamChat } = useOpenImamChat();
  const { isParent, isUser, isBoardMember, canSetChildLessonOutcomes } = useRoleAccess();
  const canMessageImam = isParent || isUser || isBoardMember;
  const childRefreshQuery = useChildByIdQuery(
    child?.id,
    childrenFetchMineOnly,
    queriesEnabled && Boolean(child?.id)
  );
  const resolvedChild = useMemo(() => {
    if (!child) return null;
    return childRefreshQuery.data ?? child;
  }, [child, childRefreshQuery.data]);
  const enrollmentSet = useMemo(() => {
    const programs = (resolvedChild?.programEnrollments || []).map((entry) => entry.program);
    if (!programs.length) return new Set([LESSON_PROGRAM.ILMIHAL]);
    return new Set(programs);
  }, [resolvedChild?.programEnrollments]);
  const drawerProgramTabs = useMemo(() => {
    const tabs: Array<{ key: ChildDrawerTab; label: string; icon?: LucideIcon }> = [];
    if (enrollmentSet.has(LESSON_PROGRAM.ILMIHAL)) {
      tabs.push({
        key: CHILD_DRAWER_TAB.LECTURE_PROGRESS,
        label: t("parentDashboardLectureProgressTab"),
        icon: showTabIcons ? BookOpen : undefined,
      });
    }
    if (enrollmentSet.has(LESSON_PROGRAM.SUFARA)) {
      tabs.push({
        key: CHILD_DRAWER_TAB.SUFARA_PROGRESS,
        label: t("childDrawerSufaraTab"),
        icon: showTabIcons ? BookMarked : undefined,
      });
    }
    if (enrollmentSet.has(LESSON_PROGRAM.QURAN)) {
      tabs.push({
        key: CHILD_DRAWER_TAB.QURAN_PROGRESS,
        label: t("childDrawerQuranTab"),
        icon: showTabIcons ? BookMarked : undefined,
      });
    }
    return tabs;
  }, [enrollmentSet, showTabIcons, t]);
  const pageProgramTabs = useMemo(() => {
    const tabs: Array<{ key: ChildDrawerTab; label: string; icon?: LucideIcon }> = [];
    if (enrollmentSet.has(LESSON_PROGRAM.ILMIHAL)) {
      tabs.push({
        key: CHILD_DRAWER_TAB.LECTURE_PROGRESS,
        label: t("childPageTabProgressIlmihal"),
        icon: showTabIcons ? BookOpen : undefined,
      });
    }
    if (enrollmentSet.has(LESSON_PROGRAM.SUFARA) || enrollmentSet.has(LESSON_PROGRAM.QURAN)) {
      tabs.push({
        key: CHILD_DRAWER_TAB.PROGRAMS,
        label: t("childPageTabPrograms"),
        icon: showTabIcons ? BookMarked : undefined,
      });
    }
    return tabs;
  }, [enrollmentSet, showTabIcons, t]);
  const availableProgramTabs = detailLayout === "page" ? pageProgramTabs : drawerProgramTabs;
  const allowedTabs = useMemo(() => {
    if (detailLayout === "page") {
      return new Set<ChildDrawerTab>([
        CHILD_DRAWER_TAB.BASIC_INFO,
        ...(showParentsTab ? [CHILD_DRAWER_TAB.PARENTS] : []),
        ...pageProgramTabs.map((tab) => tab.key),
        CHILD_DRAWER_TAB.HOMEWORK_PROGRESS,
      ]);
    }
    return new Set<ChildDrawerTab>([
      CHILD_DRAWER_TAB.BASIC_INFO,
      ...drawerProgramTabs.map((tab) => tab.key),
      CHILD_DRAWER_TAB.HOMEWORK_PROGRESS,
    ]);
  }, [detailLayout, drawerProgramTabs, pageProgramTabs, showParentsTab]);
  useEffect(() => {
    if (!queriesEnabled) return;
    if (allowedTabs.has(activeTab)) return;
    const fallbackTab = availableProgramTabs[0]?.key || CHILD_DRAWER_TAB.BASIC_INFO;
    setActiveTab(fallbackTab);
  }, [activeTab, allowedTabs, availableProgramTabs, queriesEnabled]);
  const lessonsQuery = useAuthedQuery<Lesson[]>(
    LESSONS_QUERY_KEY,
    LESSONS_API_PATH,
    queriesEnabled && Boolean(child)
  );
  const nivoBooksQuery = useAuthedQuery<NivoBook[]>(
    NIVO_BOOKS_QUERY_KEY,
    NIVO_BOOKS_API_PATH,
    queriesEnabled && Boolean(child)
  );

  const currentNivoBook = useMemo(
    () => (resolvedChild ? (nivoBooksQuery.data || []).find((book) => book.nivo === resolvedChild.nivo) : undefined),
    [nivoBooksQuery.data, resolvedChild]
  );

  const buildLectureProgressItemsForProgram = (targetProgram: Lesson["program"]) => {
    if (!resolvedChild) return [] as LectureProgressLessonItem[];
    const reportMap = new Map<string, LectureProgressLessonItem>();
    for (const record of resolvedChild.attendance || []) {
      if ((record.lecture.program || LESSON_PROGRAM.ILMIHAL) !== targetProgram) continue;
      const reportKey = record.lesson?.id || `topic:${(record.lesson?.title || record.lecture.topic).trim().toLowerCase()}`;
      const reportTitle = record.lesson?.title || record.lecture.topic;
      const previous = reportMap.get(reportKey);
      const nextLastReportedAt = toEventDate(
        record.lecture.completedAt || record.lecture.updatedAt || null,
        record.lecture.createdAt
      );
      const mergedComments = [...(previous?.comments || [])];
      const trimmedComment = record.comment?.trim();
      if (trimmedComment && !mergedComments.includes(trimmedComment)) mergedComments.push(trimmedComment);

      const homeworkListRow = hasReportedHomework(record);
      reportMap.set(reportKey, {
        key: reportKey,
        title: reportTitle,
        reports: (previous?.reports || 0) + 1,
        completedReports: (previous?.completedReports || 0) + (record.lecture.status === LECTURE_STATUS.COMPLETED ? 1 : 0),
        presentReports: (previous?.presentReports || 0) + (record.present ? 1 : 0),
        knownHomeworkReports: (previous?.knownHomeworkReports || 0) + (homeworkListRow ? 1 : 0),
        homeworkDoneReports: (previous?.homeworkDoneReports || 0) + (homeworkListRow && record.homeworkDone === true ? 1 : 0),
        comments: mergedComments,
        lastReportedAt:
          previous?.lastReportedAt && new Date(previous.lastReportedAt).getTime() > new Date(nextLastReportedAt).getTime()
            ? previous.lastReportedAt
            : nextLastReportedAt,
      });
    }

    const scopedLessons = (lessonsQuery.data || []).filter((lesson) => {
      if (lesson.program !== targetProgram) return false;
      if (targetProgram === LESSON_PROGRAM.ILMIHAL) return lesson.nivo === resolvedChild.nivo;
      return true;
    });
    const lessonRows = scopedLessons.map(
      (lesson) =>
        reportMap.get(lesson.id) || {
          key: lesson.id,
          title: lesson.title,
          reports: 0,
          completedReports: 0,
          presentReports: 0,
          knownHomeworkReports: 0,
          homeworkDoneReports: 0,
          comments: [],
          lastReportedAt: null,
        }
    );

    const nivoLessonIds = new Set(scopedLessons.map((lesson) => lesson.id));
    const extraRows = [...reportMap.entries()]
      .filter(([key]) => !nivoLessonIds.has(key))
      .map(([, value]) => value)
      .sort((a, b) => new Date(b.lastReportedAt || 0).getTime() - new Date(a.lastReportedAt || 0).getTime());
    return [...lessonRows, ...extraRows];
  };
  const lectureProgressItems = useMemo(
    () => buildLectureProgressItemsForProgram(LESSON_PROGRAM.ILMIHAL),
    [resolvedChild, lessonsQuery.data]
  );
  const sufaraProgressItems = useMemo(
    () => buildLectureProgressItemsForProgram(LESSON_PROGRAM.SUFARA),
    [resolvedChild, lessonsQuery.data]
  );
  const quranProgressItems = useMemo(
    () => buildLectureProgressItemsForProgram(LESSON_PROGRAM.QURAN),
    [resolvedChild, lessonsQuery.data]
  );
  const activeProgramProgressItems = useMemo(() => {
    if (activeTab === CHILD_DRAWER_TAB.SUFARA_PROGRESS) return sufaraProgressItems;
    if (activeTab === CHILD_DRAWER_TAB.QURAN_PROGRESS) return quranProgressItems;
    return lectureProgressItems;
  }, [activeTab, lectureProgressItems, quranProgressItems, sufaraProgressItems]);

  const outcomeByLessonId = useMemo(() => {
    const map = new Map<string, ChildLessonOutcome>();
    for (const row of resolvedChild?.lessonOutcomes || []) {
      map.set(row.lessonId, row);
    }
    return map;
  }, [resolvedChild?.lessonOutcomes]);

  const homeworkProgressItems = useMemo(() => {
    if (!resolvedChild) return [];
    const rows: HomeworkProgressItem[] = [...(resolvedChild.attendance || [])]
      .filter((record) => hasReportedHomework(record))
      .map((record) => ({
        key: `${record.lectureId}:${record.markedAt}`,
        lectureId: record.lectureId,
        title: record.homeworkTitle?.trim() || record.lesson?.title || record.lecture.topic,
        lessonTitle: record.lesson?.title || record.lecture.topic,
        homeworkDescription: record.homeworkDescription?.trim() || null,
        status:
          record.homeworkDone === true
            ? HOMEWORK_PROGRESS_STATUS.DONE
            : record.homeworkDone === false
              ? HOMEWORK_PROGRESS_STATUS.PENDING
              : HOMEWORK_PROGRESS_STATUS.NOT_RECORDED,
        homeworkTitle: record.homeworkTitle?.trim() || null,
        lastReportedAt: toEventDate(record.lecture.completedAt || record.lecture.updatedAt || null, record.markedAt),
      }))
      .sort((a, b) => new Date(b.lastReportedAt || 0).getTime() - new Date(a.lastReportedAt || 0).getTime());

    return rows;
  }, [resolvedChild]);

  const parentsText = useMemo(() => {
    if (!resolvedChild) return null;
    return (
      (resolvedChild.parents || [])
        .map((parent) => `${parent.parent?.firstName || ""} ${parent.parent?.lastName || ""}`.trim())
        .filter(Boolean)
        .join(", ") || null
    );
  }, [resolvedChild]);

  const addressText = useMemo(() => {
    if (!resolvedChild) return null;
    if (!resolvedChild.address) return null;
    return [
      resolvedChild.address.streetLine1,
      resolvedChild.address.streetLine2 || "",
      `${resolvedChild.address.postalCode} ${resolvedChild.address.city}`.trim(),
      resolvedChild.address.state || "",
      resolvedChild.address.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [resolvedChild]);

  const tabRows = useMemo(
    () => [
      {
        key: CHILD_DRAWER_TAB.BASIC_INFO,
        label: t("basicInfo"),
        icon: showTabIcons ? UserRound : undefined,
      },
      ...(showParentsTab
        ? [
            {
              key: CHILD_DRAWER_TAB.PARENTS,
              label: t("childPageParentsTab"),
              icon: showTabIcons ? Users : undefined,
            },
          ]
        : []),
      ...availableProgramTabs,
      {
        key: CHILD_DRAWER_TAB.HOMEWORK_PROGRESS,
        label:
          detailLayout === "page" ? t("childPageTabHomework") : t("parentDashboardHomeworkProgressTab"),
        icon: showTabIcons ? LayoutList : undefined,
      },
    ],
    [availableProgramTabs, detailLayout, showParentsTab, showTabIcons, t]
  );

  if (isLoading && !child) {
    return <LoadingBlock text={t("parentDashboardChildDrawerLoading")} />;
  }
  if (!resolvedChild) {
    return <p className="text-sm text-slate-500">{t("parentDashboardNoChildActivity")}</p>;
  }

  return (
    <Tabs value={activeTab} onChange={setActiveTab} tabs={tabRows}>
      {activeTab === CHILD_DRAWER_TAB.BASIC_INFO ? (
        <div className="space-y-3">
          <EntityDetailTable>
            <EntityDetailTableRow label={t("usersTableName")} value={`${resolvedChild.firstName} ${resolvedChild.lastName}`} />
            <EntityDetailTableRow label={t("ssn")} value={<NaValue value={resolvedChild.ssn} />} />
            <EntityDetailTableRow label={t("birthDate")} value={formatDate(resolvedChild.birthDate)} />
            <EntityDetailTableRow
              label={t("childrenNivoLabel")}
              value={
                <div className="inline-flex flex-col items-start gap-1">
                  <NivoProgress nivo={resolvedChild.nivo} showIndexLabel />
                </div>
              }
            />
            {!showParentsTab ? (
              <EntityDetailTableRow label={t("childrenParentsLabel")} value={<NaValue value={parentsText} />} />
            ) : null}
            <EntityDetailTableRow label={t("address")} value={<NaValue value={addressText} />} />
            <EntityDetailTableRow
              label={t("lessonsBookSectionTitle")}
              value={
                currentNivoBook ? (
                  <NivoBookLink nivo={resolvedChild.nivo} label={currentNivoBook.originalName} />
                ) : (
                  <NaValue value={null} />
                )
              }
            />
          </EntityDetailTable>
        </div>
      ) : activeTab === CHILD_DRAWER_TAB.PARENTS && showParentsTab && onOpenParentProfile ? (
        <ChildParentsTabCards parents={resolvedChild.parents || []} onOpenProfile={onOpenParentProfile} />
      ) : activeTab === CHILD_DRAWER_TAB.PROGRAMS ? (
        <div className="space-y-6 max-md:space-y-5">
          {enrollmentSet.has(LESSON_PROGRAM.SUFARA) ? (
            <section className="space-y-2 max-md:space-y-1.5">
              <h3 className="text-sm font-semibold text-slate-800">
                {t(LESSON_PROGRAM_I18N_KEY[LESSON_PROGRAM.SUFARA])}
              </h3>
              {sufaraProgressItems.length ? (
                sufaraProgressItems.map((item, idx) => {
                  const outcome = isPersistedLessonOutcomeKey(item.key) ? outcomeByLessonId.get(item.key) : undefined;
                  return (
                    <LectureProgressLessonCard
                      key={`sufara-${item.key}`}
                      item={item}
                      index={idx}
                      totalItems={sufaraProgressItems.length}
                      child={resolvedChild}
                      outcome={outcome}
                      canMessageImam={canMessageImam}
                      canSetChildLessonOutcomes={canSetChildLessonOutcomes}
                      openImamChat={openImamChat}
                    />
                  );
                })
              ) : (
                <EmptyStateNotice>{t("parentDashboardNoChildActivity")}</EmptyStateNotice>
              )}
            </section>
          ) : null}
          {enrollmentSet.has(LESSON_PROGRAM.QURAN) ? (
            <section className="space-y-2 max-md:space-y-1.5">
              <h3 className="text-sm font-semibold text-slate-800">
                {t(LESSON_PROGRAM_I18N_KEY[LESSON_PROGRAM.QURAN])}
              </h3>
              {quranProgressItems.length ? (
                quranProgressItems.map((item, idx) => {
                  const outcome = isPersistedLessonOutcomeKey(item.key) ? outcomeByLessonId.get(item.key) : undefined;
                  return (
                    <LectureProgressLessonCard
                      key={`quran-${item.key}`}
                      item={item}
                      index={idx}
                      totalItems={quranProgressItems.length}
                      child={resolvedChild}
                      outcome={outcome}
                      canMessageImam={canMessageImam}
                      canSetChildLessonOutcomes={canSetChildLessonOutcomes}
                      openImamChat={openImamChat}
                    />
                  );
                })
              ) : (
                <EmptyStateNotice>{t("parentDashboardNoChildActivity")}</EmptyStateNotice>
              )}
            </section>
          ) : null}
        </div>
      ) : activeTab === CHILD_DRAWER_TAB.LECTURE_PROGRESS ||
        activeTab === CHILD_DRAWER_TAB.SUFARA_PROGRESS ||
        activeTab === CHILD_DRAWER_TAB.QURAN_PROGRESS ? (
        <div className="space-y-2 max-md:space-y-1.5">
          {activeProgramProgressItems.length ? (
            activeProgramProgressItems.map((item, idx) => {
              const outcome = isPersistedLessonOutcomeKey(item.key) ? outcomeByLessonId.get(item.key) : undefined;
              return (
                <LectureProgressLessonCard
                  key={item.key}
                  item={item}
                  index={idx}
                  totalItems={activeProgramProgressItems.length}
                  child={resolvedChild}
                  outcome={outcome}
                  canMessageImam={canMessageImam}
                  canSetChildLessonOutcomes={canSetChildLessonOutcomes}
                  openImamChat={openImamChat}
                />
              );
            })
          ) : (
            <EmptyStateNotice>{t("parentDashboardNoChildActivity")}</EmptyStateNotice>
          )}
        </div>
      ) : (
        <ProgressHomeworkTimeline
          items={homeworkProgressItems}
          onMessageImam={
            canMessageImam
              ? (item) =>
                  openImamChat({
                    type: MESSAGE_CONTEXT_TYPE.HOMEWORK,
                    childId: resolvedChild.id,
                    lectureId: item.lectureId,
                    label: `${resolvedChild.firstName} ${resolvedChild.lastName} - ${item.title}`,
                    preview: item.homeworkDescription || undefined,
                  })
              : undefined
          }
        />
      )}
    </Tabs>
  );
}
