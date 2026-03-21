import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../../api";
import { ROLE } from "../../types";
import { ChildRecord, ChildrenListResponse } from "../children/types";
import { LESSON_NIVO_LABEL, LESSON_NIVO_ORDER, LessonNivo } from "../lessons/constants";
import { LECTURE_STATUS } from "../reporting/reporting.constants";
import { CommunityDonutChart } from "./community-donut-chart";
import { getNivoColor } from "../common/nivo-colors";

type DirectoryUser = {
  id: string;
  role: string;
};

const CHILDREN_PAGE_SIZE = 100;
const MAX_CHILDREN_PAGES = 20;

function toPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round(((value / total) * 100 + Number.EPSILON) * 10) / 10;
}

export function CommunityOverviewTab() {
  const { t } = useTranslation();

  const usersQuery = useQuery<DirectoryUser[]>({
    queryKey: ["community-overview-directory"],
    queryFn: async () => (await api.get("/directory")).data,
  });

  const childrenQuery = useQuery<ChildRecord[]>({
    queryKey: ["community-overview-children"],
    queryFn: async () => {
      const allItems: ChildRecord[] = [];
      let page = 1;
      let total = 0;

      while (page <= MAX_CHILDREN_PAGES) {
        const response = await api.get<ChildrenListResponse>("/children", {
          params: { page, pageSize: CHILDREN_PAGE_SIZE, communityScope: 1 },
        });
        const data = response.data;
        const items = data.items || [];
        total = data.total || 0;
        allItems.push(...items);
        if (!items.length || allItems.length >= total) break;
        page += 1;
      }

      return allItems;
    },
  });

  const roleSegments = useMemo(() => {
    const roleCounts = new Map<string, number>();
    for (const user of usersQuery.data || []) {
      roleCounts.set(user.role, (roleCounts.get(user.role) || 0) + 1);
    }

    return [
      {
        key: ROLE.ADMIN,
        label: t("roleAdmin"),
        value: roleCounts.get(ROLE.ADMIN) || 0,
        color: "#0ea5e9",
      },
      {
        key: ROLE.BOARD_MEMBER,
        label: t("roleBoardMember"),
        value: roleCounts.get(ROLE.BOARD_MEMBER) || 0,
        color: "#f59e0b",
      },
      {
        key: ROLE.PARENT,
        label: t("roleParent"),
        value: roleCounts.get(ROLE.PARENT) || 0,
        color: "#22c55e",
      },
      { key: ROLE.USER, label: t("roleUser"), value: roleCounts.get(ROLE.USER) || 0, color: "#8b5cf6" },
    ];
  }, [t, usersQuery.data]);

  const childrenByNivoSegments = useMemo(() => {
    const counts = new Map<LessonNivo, number>();
    for (const child of childrenQuery.data || []) {
      counts.set(child.nivo, (counts.get(child.nivo) || 0) + 1);
    }

    return LESSON_NIVO_ORDER.map((nivo) => ({
      key: `nivo-${nivo}`,
      label: LESSON_NIVO_LABEL[nivo],
      value: counts.get(nivo) || 0,
      color: getNivoColor(nivo) || "#64748b",
    }));
  }, [childrenQuery.data]);

  const progressByNivo = useMemo(() => {
    const grouped = new Map<
      LessonNivo,
      { children: number; withRecords: number; withoutRecords: number; attendanceRateSum: number; needsAttention: number }
    >();

    for (const nivo of LESSON_NIVO_ORDER) {
      grouped.set(nivo, { children: 0, withRecords: 0, withoutRecords: 0, attendanceRateSum: 0, needsAttention: 0 });
    }

    for (const child of childrenQuery.data || []) {
      const bucket = grouped.get(child.nivo);
      if (!bucket) continue;
      bucket.children += 1;
      const completedAttendance = (child.attendance || []).filter(
        (record) => record.lecture.status === LECTURE_STATUS.COMPLETED
      );
      if (!completedAttendance.length) {
        bucket.withoutRecords += 1;
        continue;
      }

      const presentCount = completedAttendance.filter((record) => record.present).length;
      const attendanceRate = toPercent(presentCount, completedAttendance.length);
      bucket.withRecords += 1;
      bucket.attendanceRateSum += attendanceRate;
      if (attendanceRate < 70) {
        bucket.needsAttention += 1;
      }
    }

    return LESSON_NIVO_ORDER.map((nivo) => {
      const item = grouped.get(nivo)!;
      const averageAttendance = item.withRecords ? Math.round(item.attendanceRateSum / item.withRecords) : null;
      return {
        nivo,
        children: item.children,
        withRecords: item.withRecords,
        withoutRecords: item.withoutRecords,
        averageAttendance,
        needsAttention: item.needsAttention,
      };
    });
  }, [childrenQuery.data]);

  if (usersQuery.isLoading || childrenQuery.isLoading) {
    return <p className="text-sm text-slate-500">{t("communityOverviewLoading")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("communityOverviewUsersCount")}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{usersQuery.data?.length || 0}</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("communityOverviewChildrenCount")}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{childrenQuery.data?.length || 0}</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("communityOverviewNeedsAttention")}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {progressByNivo.reduce((sum, nivo) => sum + nivo.needsAttention, 0)}
          </p>
          <p className="text-xs text-slate-500">
            {t("communityOverviewNoRecordsLabel")}: {progressByNivo.reduce((sum, nivo) => sum + nivo.withoutRecords, 0)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CommunityDonutChart
          title={t("communityOverviewUsersByRoleTitle")}
          subtitle={t("communityOverviewUsersByRoleSubtitle")}
          segments={roleSegments}
          emptyText={t("communityOverviewNoUsers")}
          noDataLabel={t("communityOverviewNoDataLabel")}
        />
        <CommunityDonutChart
          title={t("communityOverviewChildrenByNivoTitle")}
          subtitle={t("communityOverviewChildrenByNivoSubtitle")}
          segments={childrenByNivoSegments}
          emptyText={t("communityOverviewNoChildren")}
          noDataLabel={t("communityOverviewNoDataLabel")}
        />
      </div>

      <div className="rounded-md border border-border p-4">
        <p className="text-sm font-medium text-slate-800">{t("communityOverviewProgressByNivoTitle")}</p>
        <p className="mb-3 text-xs text-slate-500">{t("communityOverviewProgressByNivoSubtitle")}</p>
        <div className="space-y-2">
          {progressByNivo.map((item) => (
            <div
              key={item.nivo}
              className={`grid gap-2 rounded-md border border-border p-3 md:grid-cols-[1.2fr_1fr_1fr_1fr] ${
                item.children === 0 ? "bg-slate-50/70" : ""
              }`}
            >
              <p className="text-sm font-medium text-slate-800">{LESSON_NIVO_LABEL[item.nivo]}</p>
              <p className="text-sm text-slate-600">
                {t("communityOverviewChildrenLabel")}: <span className="font-medium text-slate-900">{item.children}</span>
              </p>
              <p className="text-sm text-slate-600">
                {t("communityOverviewAttendanceLabel")}:{" "}
                <span className="font-medium text-slate-900">
                  {item.averageAttendance === null ? "-" : `${item.averageAttendance}%`}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                {t("communityOverviewAttentionLabel")}:{" "}
                <span className="font-medium text-slate-900">{item.withRecords === 0 ? "-" : item.needsAttention}</span>
              </p>
              {item.withoutRecords > 0 ? (
                <p className="text-sm text-slate-500 md:col-span-4">
                  {t("communityOverviewNoRecordsLabel")}: {item.withoutRecords}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
