import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NivoProgress } from "./nivo-progress";
import { type ChildRecord } from "./types";
import { formatDate, formatDateTime } from "../../lib/date-time";
import { LECTURE_STATUS } from "../reporting/reporting.constants";
import { StatusBadge } from "../common/components/status-badge";
import { EntityDetailTable, EntityDetailTableRow } from "../common/components/entity-detail-components";
import { NaValue } from "../common/components/na-value";

export function ChildDetailsDrawerContent({ child }: { child: ChildRecord }) {
  const { t } = useTranslation();
  const nivoNumber = child.nivo;
  const attendanceItems = (child.attendance || []).slice(0, 12);
  const parentsText =
    (child.parents || [])
      .map((parent) => `${parent.parent?.firstName || ""} ${parent.parent?.lastName || ""}`.trim())
      .filter(Boolean)
      .join(", ") || t("na");

  const addressText = child.address
    ? [
        child.address.streetLine1,
        child.address.streetLine2 || "",
        `${child.address.postalCode} ${child.address.city}`.trim(),
        child.address.state || "",
        child.address.country,
      ]
        .filter(Boolean)
        .join(", ")
    : t("na");

  const historyValue: ReactNode = attendanceItems.length ? (
    <div className="w-full space-y-2">
      {attendanceItems.map((item) => (
        <div key={`${item.lectureId}-${item.childId}`} className="rounded-md border border-border p-2">
          <p className="text-xs text-slate-500">
            {formatDateTime(item.lecture.updatedAt || item.lecture.createdAt)}
          </p>
          <p className="text-sm font-medium text-slate-800">{item.lesson?.title || item.lecture.topic}</p>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
            <span>{item.present ? t("activityReportPresent") : t("activityReportAbsent")}</span>
            <span>{item.homeworkDone ? t("activityReportHomeworkDone") : t("activityReportHomeworkNotDone")}</span>
            <span>
              {item.lecture.status === LECTURE_STATUS.COMPLETED
                ? t("activityReportStatusCompleted")
                : t("activityReportStatusDraft")}
            </span>
            {item.lecture.status === LECTURE_STATUS.COMPLETED && item.lecture.completedAt ? (
              <span>{t("activityReportCompletedAtShort", { date: formatDateTime(item.lecture.completedAt) })}</span>
            ) : null}
          </div>
          {item.comment ? <p className="mt-1 text-xs text-slate-700">{item.comment}</p> : null}
        </div>
      ))}
    </div>
  ) : (
    <span className="text-sm text-slate-500">{t("activityReportNoHistory")}</span>
  );

  return (
    <div className="space-y-3">
      <EntityDetailTable>
        <EntityDetailTableRow
          label={t("usersTableName")}
          value={`${child.firstName} ${child.lastName}`}
        />
        <EntityDetailTableRow label={t("ssn")} value={<NaValue value={child.ssn} />} />
        <EntityDetailTableRow label={t("birthDate")} value={formatDate(child.birthDate)} />
        <EntityDetailTableRow
          label={t("childrenNivoLabel")}
          value={
            <div className="inline-flex flex-col items-start gap-1">
              <span className="text-sm font-medium text-slate-700">{nivoNumber}</span>
              <NivoProgress nivo={child.nivo} showIndexLabel />
            </div>
          }
        />
        <EntityDetailTableRow label={t("status")} value={<StatusBadge status={child.status} />} />
        <EntityDetailTableRow label={t("childrenParentsLabel")} value={<NaValue value={parentsText} />} />
        <EntityDetailTableRow label={t("address")} value={<NaValue value={addressText} />} />
        <EntityDetailTableRow label={t("activityReportHistory")} value={historyValue} />
      </EntityDetailTable>
    </div>
  );
}
