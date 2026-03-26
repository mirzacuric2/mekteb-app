import { ChevronRight, Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NaValue } from "../common/components/na-value";
import { StatusBadge } from "../common/components/status-badge";
import { EntityDetailTable, EntityDetailTableRow } from "../common/components/entity-detail-components";
import type { ChildParent } from "./types";

type Props = {
  parents: ChildParent[];
  onOpenProfile: (parentId: string) => void;
};

export function ChildParentsTabCards({ parents, onOpenProfile }: Props) {
  const { t } = useTranslation();
  const linked = parents.filter((row): row is ChildParent & { parent: NonNullable<ChildParent["parent"]> } =>
    Boolean(row.parent)
  );

  if (!linked.length) {
    return (
      <EntityDetailTable>
        <EntityDetailTableRow compact label={t("childrenParentsLabel")} value={t("childPageParentsEmpty")} />
      </EntityDetailTable>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-start">
      {linked.map((row, index) => {
        const p = row.parent;
        const displayName = `${p.firstName} ${p.lastName}`.trim();
        const fallbackTitle = t("childPageParentCardTitle", { n: index + 1 });
        const title = displayName || fallbackTitle;
        const statusHint = p.status ? `, ${p.status}` : "";
        return (
          <div key={row.parentId} className="min-w-0 rounded-lg border border-border bg-white">
            <button
              type="button"
              className="w-full p-4 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => onOpenProfile(row.parentId)}
              aria-label={`${t("childPageViewParent")}: ${title}${statusHint}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <h4 className="line-clamp-2 text-base font-semibold leading-snug text-slate-800">{title}</h4>
                    {p.status ? <StatusBadge status={p.status} className="shrink-0" /> : null}
                  </div>
                  <div className="mt-2 space-y-1 text-xs font-normal leading-relaxed text-slate-500">
                    <p className="flex min-w-0 gap-2 break-all">
                      <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                      <span>
                        <span className="sr-only">{`${t("email")}: `}</span>
                        <NaValue value={p.email} className="text-slate-500" naClassName="text-slate-400" />
                      </span>
                    </p>
                    <p className="flex min-w-0 gap-2 break-words">
                      <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                      <span>
                        <span className="sr-only">{`${t("usersTablePhone")}: `}</span>
                        <NaValue value={p.phoneNumber} className="text-slate-500" naClassName="text-slate-400" />
                      </span>
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-xs font-medium text-primary">
                  {t("childPageViewParent")}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </span>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
