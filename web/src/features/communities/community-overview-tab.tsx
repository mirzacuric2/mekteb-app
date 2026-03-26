import { AlertTriangle, Baby, Layers, PieChart, Users, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../../api";
import { cn } from "../../lib/utils";
import { ROLE } from "../../types";
import { ROLE_ACCENT_HEX } from "../common/role";
import { ChildRecord, ChildrenListResponse } from "../children/types";
import {
  LESSON_NIVO_LABEL,
  LESSON_NIVO_ORDER,
  LESSON_PROGRAM,
  LESSON_PROGRAM_I18N_KEY,
  LessonNivo,
} from "../lessons/constants";
import { LECTURE_STATUS } from "../reporting/reporting.constants";
import { CommunityDonutChart } from "./community-donut-chart";
import { getNivoColor } from "../common/nivo-colors";
import {
  CommunityProgramFilter,
  CommunityProgressByNivoSection,
  ProgressByNivoRow,
} from "./community-progress-by-nivo-section";

type DirectoryUser = {
  id: string;
  role: string;
  status: string;
};

const CHILDREN_PAGE_SIZE = 100;
const MAX_CHILDREN_PAGES = 20;

function toPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round(((value / total) * 100 + Number.EPSILON) * 10) / 10;
}

function OverviewStatCard({
  icon: Icon,
  label,
  value,
  accentClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  accentClassName: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            accentClassName
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex h-12 min-w-0 flex-1 flex-col justify-center gap-0.5 overflow-hidden">
          <p
            className="line-clamp-1 text-[11px] font-semibold uppercase leading-none tracking-wide text-slate-500"
            title={label}
          >
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums leading-none tracking-tight text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CommunityOverviewTab() {
  const { t } = useTranslation();
  const [progressProgramFilter, setProgressProgramFilter] = useState<CommunityProgramFilter>("ALL");

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
        key: ROLE.SUPER_ADMIN,
        label: t("roleSuperAdmin"),
        value: roleCounts.get(ROLE.SUPER_ADMIN) || 0,
        color: ROLE_ACCENT_HEX[ROLE.SUPER_ADMIN],
      },
      {
        key: ROLE.ADMIN,
        label: t("roleAdmin"),
        value: roleCounts.get(ROLE.ADMIN) || 0,
        color: ROLE_ACCENT_HEX[ROLE.ADMIN],
      },
      {
        key: ROLE.BOARD_MEMBER,
        label: t("roleBoardMember"),
        value: roleCounts.get(ROLE.BOARD_MEMBER) || 0,
        color: ROLE_ACCENT_HEX[ROLE.BOARD_MEMBER],
      },
      {
        key: ROLE.PARENT,
        label: t("roleParent"),
        value: roleCounts.get(ROLE.PARENT) || 0,
        color: ROLE_ACCENT_HEX[ROLE.PARENT],
      },
      {
        key: ROLE.USER,
        label: t("roleUser"),
        value: roleCounts.get(ROLE.USER) || 0,
        color: ROLE_ACCENT_HEX[ROLE.USER],
      },
    ];
  }, [t, usersQuery.data]);

  const childrenByIlmihalNivoSegments = useMemo(() => {
    const counts = new Map<LessonNivo, number>();
    for (const child of childrenQuery.data || []) {
      const programs = (child.programEnrollments || []).map((entry) => entry.program);
      const isIlmihalProgram = !programs.length || programs.includes(LESSON_PROGRAM.ILMIHAL);
      if (!isIlmihalProgram) continue;
      counts.set(child.nivo, (counts.get(child.nivo) || 0) + 1);
    }

    return LESSON_NIVO_ORDER.map((nivo) => ({
      key: `nivo-${nivo}`,
      label: LESSON_NIVO_LABEL[nivo],
      value: counts.get(nivo) || 0,
      color: getNivoColor(nivo) || "#64748b",
    }));
  }, [childrenQuery.data]);
  const childrenByProgramSegments = useMemo(() => {
    const programCounts = {
      [LESSON_PROGRAM.ILMIHAL]: 0,
      [LESSON_PROGRAM.SUFARA]: 0,
      [LESSON_PROGRAM.QURAN]: 0,
    };
    for (const child of childrenQuery.data || []) {
      const programs = new Set((child.programEnrollments || []).map((entry) => entry.program));
      // Backward compatibility for older children without explicit enrollments.
      if (!programs.size) programs.add(LESSON_PROGRAM.ILMIHAL);
      if (programs.has(LESSON_PROGRAM.ILMIHAL)) programCounts[LESSON_PROGRAM.ILMIHAL] += 1;
      if (programs.has(LESSON_PROGRAM.SUFARA)) programCounts[LESSON_PROGRAM.SUFARA] += 1;
      if (programs.has(LESSON_PROGRAM.QURAN)) programCounts[LESSON_PROGRAM.QURAN] += 1;
    }
    return [
      {
        key: LESSON_PROGRAM.ILMIHAL,
        label: t(LESSON_PROGRAM_I18N_KEY[LESSON_PROGRAM.ILMIHAL]),
        value: programCounts[LESSON_PROGRAM.ILMIHAL],
        color: "#0ea5e9",
      },
      {
        key: LESSON_PROGRAM.SUFARA,
        label: t(LESSON_PROGRAM_I18N_KEY[LESSON_PROGRAM.SUFARA]),
        value: programCounts[LESSON_PROGRAM.SUFARA],
        color: "#38bdf8",
      },
      {
        key: LESSON_PROGRAM.QURAN,
        label: t(LESSON_PROGRAM_I18N_KEY[LESSON_PROGRAM.QURAN]),
        value: programCounts[LESSON_PROGRAM.QURAN],
        color: "#22c55e",
      },
    ];
  }, [childrenQuery.data, t]);
  const usersByStatusSegments = useMemo(() => {
    const statusCounts = {
      PENDING: 0,
      ACTIVE: 0,
      INACTIVE: 0,
    };
    for (const user of usersQuery.data || []) {
      if (user.status in statusCounts) {
        statusCounts[user.status as keyof typeof statusCounts] += 1;
      }
    }
    return [
      {
        key: "PENDING",
        label: t("pending"),
        value: statusCounts.PENDING,
        color: "#f59e0b",
      },
      {
        key: "ACTIVE",
        label: t("active"),
        value: statusCounts.ACTIVE,
        color: "#22c55e",
      },
      {
        key: "INACTIVE",
        label: t("inactive"),
        value: statusCounts.INACTIVE,
        color: "#94a3b8",
      },
    ].map((status) => ({
      key: status.key,
      label: status.label,
      value: status.value,
      color: status.color,
    }));
  }, [t, usersQuery.data]);

  const progressByNivo = useMemo<ProgressByNivoRow[]>(() => {
    const grouped = new Map<
      LessonNivo,
      { children: number; withRecords: number; withoutRecords: number; attendanceRateSum: number; needsAttention: number }
    >();

    for (const nivo of LESSON_NIVO_ORDER) {
      grouped.set(nivo, { children: 0, withRecords: 0, withoutRecords: 0, attendanceRateSum: 0, needsAttention: 0 });
    }

    for (const child of childrenQuery.data || []) {
      const childPrograms = new Set((child.programEnrollments || []).map((entry) => entry.program));
      if (!childPrograms.size) childPrograms.add(LESSON_PROGRAM.ILMIHAL);
      if (progressProgramFilter !== "ALL" && !childPrograms.has(progressProgramFilter)) continue;

      const bucket = grouped.get(child.nivo);
      if (!bucket) continue;
      bucket.children += 1;
      const completedAttendance = (child.attendance || []).filter((record) => {
        if (record.lecture.status !== LECTURE_STATUS.COMPLETED) return false;
        if (progressProgramFilter === "ALL") return true;
        return record.lecture.program === progressProgramFilter;
      });
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
  }, [childrenQuery.data, progressProgramFilter]);

  if (usersQuery.isLoading || childrenQuery.isLoading) {
    return <p className="text-sm text-slate-500">{t("communityOverviewLoading")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <OverviewStatCard
          icon={Users}
          label={t("communityOverviewUsersCount")}
          value={usersQuery.data?.length || 0}
          accentClassName="bg-sky-50 text-sky-700"
        />
        <OverviewStatCard
          icon={Baby}
          label={t("communityOverviewChildrenCount")}
          value={childrenQuery.data?.length || 0}
          accentClassName="bg-emerald-50 text-emerald-700"
        />
        <OverviewStatCard
          icon={AlertTriangle}
          label={t("communityOverviewNeedsAttention")}
          value={progressByNivo.reduce((sum, nivo) => sum + nivo.needsAttention, 0)}
          accentClassName="bg-amber-50 text-amber-700"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CommunityDonutChart
          title={t("communityOverviewUsersByRoleTitle")}
          subtitle={t("communityOverviewUsersByRoleSubtitle")}
          titleIcon={PieChart}
          titleIconClassName="bg-sky-50 text-sky-700"
          segments={roleSegments}
          emptyText={t("communityOverviewNoUsers")}
          noDataLabel={t("communityOverviewNoDataLabel")}
        />
        <CommunityDonutChart
          title={t("communityOverviewUsersByStatusTitle")}
          subtitle={t("communityOverviewUsersByStatusSubtitle")}
          titleIcon={PieChart}
          titleIconClassName="bg-violet-50 text-violet-700"
          segments={usersByStatusSegments}
          emptyText={t("communityOverviewNoUsers")}
          noDataLabel={t("communityOverviewNoDataLabel")}
        />
        <CommunityDonutChart
          title={t("communityOverviewChildrenByIlmihalNivoTitle")}
          subtitle={t("communityOverviewChildrenByIlmihalNivoSubtitle")}
          titleIcon={Layers}
          titleIconClassName="bg-emerald-50 text-emerald-700"
          segments={childrenByIlmihalNivoSegments}
          emptyText={t("communityOverviewNoChildren")}
          noDataLabel={t("communityOverviewNoDataLabel")}
        />
        <CommunityDonutChart
          title={t("communityOverviewChildrenByTrackTitle")}
          subtitle={t("communityOverviewChildrenByTrackSubtitle")}
          titleIcon={Layers}
          titleIconClassName="bg-cyan-50 text-cyan-700"
          segments={childrenByProgramSegments}
          emptyText={t("communityOverviewNoChildren")}
          noDataLabel={t("communityOverviewNoDataLabel")}
          totalLabel={t("communityOverviewChartEnrollmentsLabel")}
        />
      </div>

      <CommunityProgressByNivoSection
        rows={progressByNivo}
        programFilter={progressProgramFilter}
        onProgramFilterChange={setProgressProgramFilter}
      />
    </div>
  );
}
