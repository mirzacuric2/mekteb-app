import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NivoProgress } from "./nivo-progress";
import { type ChildRecord } from "./types";
import { formatDate, formatDateTime } from "../../lib/date-time";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1 py-2 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="text-slate-900">{value}</div>
    </div>
  );
}

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

  return (
    <section className="rounded-lg border border-border bg-white p-4">
      <div className="divide-y divide-border">
        <DetailRow label={t("usersTableName")} value={`${child.firstName} ${child.lastName}`} />
        <DetailRow label={t("ssn")} value={child.ssn || t("na")} />
        <DetailRow label={t("birthDate")} value={formatDate(child.birthDate)} />
        <DetailRow
          label={t("childrenNivoLabel")}
          value={
            <div className="inline-flex flex-col items-start gap-1">
              <span className="text-sm font-medium text-slate-700">{nivoNumber}</span>
              <NivoProgress nivo={child.nivo} showIndexLabel />
            </div>
          }
        />
        <DetailRow label={t("status")} value={t(child.status.toLowerCase())} />
        <DetailRow label={t("childrenParentsLabel")} value={parentsText} />
        <DetailRow label={t("address")} value={addressText} />
        <DetailRow
          label={t("activityReportHistory")}
          value={
            attendanceItems.length ? (
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
                    </div>
                    {item.comment ? <p className="mt-1 text-xs text-slate-700">{item.comment}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-500">{t("activityReportNoHistory")}</span>
            )
          }
        />
      </div>
    </section>
  );
}
