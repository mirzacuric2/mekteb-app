import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Pencil, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Tabs } from "../../components/ui/tabs";
import { NaValue } from "../common/components/na-value";
import {
  EntityDetailSection,
  EntityDetailTable,
  EntityDetailTableRow,
} from "../common/components/entity-detail-components";
import { Role } from "../common/role";
import { UserRecord } from "./users-table";
import { formatAddressLine } from "../communities/community-utils";
import { LESSON_NIVO_LABEL, LessonNivo } from "../lessons/constants";
import { formatDateTime } from "../../lib/date-time";

type ChildSummary = {
  id: string;
  firstName?: string;
  lastName?: string;
  nivo?: LessonNivo;
};

type Props = {
  user: UserRecord;
  communityName?: string | null;
  children: ChildSummary[];
  onOpenChild?: (childId: string) => void;
  onAddChild?: () => void;
  onEditChild?: (childId: string) => void;
};

export function UserDetailsDrawerContent({ user, communityName, children, onOpenChild, onAddChild, onEditChild }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    setActiveTab("basic");
  }, [user.id]);

  const tabOptions = useMemo(
    () => [
      { key: "basic", label: t("basicInfo") },
      { key: "children", label: t("usersTableChildren") },
    ],
    [t]
  );
  const addressText = user.address ? formatAddressLine(user.address).trim() : "";

  return (
    <Tabs value={activeTab} onChange={setActiveTab} tabs={tabOptions}>
      {activeTab === "basic" ? (
        <div className="space-y-3">
          <EntityDetailTable>
            <EntityDetailTableRow label={t("email")} value={user.email} />
            <EntityDetailTableRow label={t("role")} value={<Role role={user.role} />} />
            <EntityDetailTableRow label={t("usersTablePhone")} value={<NaValue value={user.phoneNumber} />} />
            <EntityDetailTableRow label={t("community")} value={<NaValue value={communityName} />} />
            <EntityDetailTableRow label={t("ssn")} value={<NaValue value={user.ssn} />} />
            {user.createdAt ? (
              <EntityDetailTableRow label={t("created")} value={formatDateTime(user.createdAt)} />
            ) : null}
            {user.updatedAt ? (
              <EntityDetailTableRow label={t("updated")} value={formatDateTime(user.updatedAt)} />
            ) : null}
            <EntityDetailTableRow
              label={t("address")}
              value={<NaValue value={addressText || undefined} className="break-words" />}
            />
          </EntityDetailTable>
        </div>
      ) : null}

      {activeTab === "children" ? (
        <div className="space-y-3">
          {onAddChild ? (
            <div className="flex justify-end">
              <Button variant="outline" className="h-8 gap-1 text-xs" onClick={onAddChild}>
                <Plus size={14} />
                {t("childrenCreate")}
              </Button>
            </div>
          ) : null}
          {children.length ? (
            children.map((child, index) => {
              const childName = `${child.firstName || ""} ${child.lastName || ""}`.trim();
              const title = `${t("usersTableChildren")} ${index + 1}`;
              const table = (
                <EntityDetailTable>
                  <EntityDetailTableRow label={t("usersTableName")} value={<NaValue value={childName} />} />
                  <EntityDetailTableRow
                    label={t("childrenNivoLabel")}
                    value={<NaValue value={child.nivo ? LESSON_NIVO_LABEL[child.nivo] : undefined} />}
                  />
                </EntityDetailTable>
              );
              if (onOpenChild) {
                return (
                  <div key={child.id} className="rounded-lg border border-border bg-white">
                    <button
                      type="button"
                      className="w-full p-4 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => onOpenChild(child.id)}
                      aria-label={`${t("parentDashboardViewDetails")}: ${childName || title}`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                          {t("parentDashboardViewDetails")}
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </span>
                      </div>
                      {table}
                    </button>
                    {onEditChild ? (
                      <div className="border-t border-border px-4 py-2">
                        <Button
                          variant="outline"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={() => onEditChild(child.id)}
                        >
                          <Pencil size={12} />
                          {t("edit")}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              }
              return (
                <EntityDetailSection key={child.id} title={title}>
                  {table}
                </EntityDetailSection>
              );
            })
          ) : (
            <EntityDetailTable>
              <EntityDetailTableRow label={t("usersTableChildren")} value={t("noChildrenAdded")} />
            </EntityDetailTable>
          )}
        </div>
      ) : null}
    </Tabs>
  );
}
