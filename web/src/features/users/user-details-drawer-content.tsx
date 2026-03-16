import { ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs } from "../../components/ui/tabs";
import { NaValue } from "../common/components/na-value";
import { UserAddressRecord, UserRecord } from "./users-table";
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
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1 py-2 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-slate-900">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-4">
      {title ? <h4 className="mb-3 text-sm font-semibold text-slate-800">{title}</h4> : null}
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function formatAddress(address?: UserAddressRecord | null) {
  if (!address) return null;
  return {
    streetLine1: address.streetLine1,
    streetLine2: address.streetLine2 || "",
    cityLine: `${address.postalCode} ${address.city}`.trim(),
    state: address.state || "",
    country: address.country,
  };
}

export function UserDetailsDrawerContent({ user, communityName, children }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    setActiveTab("basic");
  }, [user.id]);

  const tabOptions = useMemo(
    () => [
      { key: "basic", label: "Basic info" },
      { key: "children", label: "Children" },
      { key: "address", label: "Address" },
    ],
    []
  );
  const addressLines = formatAddress(user.address);
  return (
    <Tabs value={activeTab} onChange={setActiveTab} tabs={tabOptions}>
      {activeTab === "basic" ? (
        <Section>
          <DetailRow label={t("email")} value={user.email} />
          <DetailRow label={t("role")} value={user.role} />
          <DetailRow label={t("usersTablePhone")} value={<NaValue value={user.phoneNumber} />} />
          <DetailRow label={t("community")} value={<NaValue value={communityName} />} />
          <DetailRow label={t("ssn")} value={<NaValue value={user.ssn} />} />
          {user.createdAt ? (
            <DetailRow label={t("created")} value={formatDateTime(user.createdAt)} />
          ) : null}
          {user.updatedAt ? (
            <DetailRow label={t("updated")} value={formatDateTime(user.updatedAt)} />
          ) : null}
        </Section>
      ) : null}

      {activeTab === "children" ? (
        <div className="space-y-3">
          {children.length ? (
            children.map((child, index) => {
              const childName = `${child.firstName || ""} ${child.lastName || ""}`.trim();
              return (
                <Section key={child.id} title={`Child ${index + 1}`}>
                  <DetailRow label="Name" value={<NaValue value={childName} />} />
                  <DetailRow label="Nivo" value={<NaValue value={child.nivo ? LESSON_NIVO_LABEL[child.nivo] : undefined} />} />
                </Section>
              );
            })
          ) : (
            <Section>
              <DetailRow label="Status" value="No children assigned." />
            </Section>
          )}
        </div>
      ) : null}

      {activeTab === "address" ? (
        <div className="space-y-3">
          {addressLines ? (
            <Section>
              <DetailRow label="Street line 1" value={<NaValue value={addressLines.streetLine1} />} />
              <DetailRow label="Street line 2" value={<NaValue value={addressLines.streetLine2} />} />
              <DetailRow label="City / Postal" value={<NaValue value={addressLines.cityLine} />} />
              <DetailRow label="State" value={<NaValue value={addressLines.state} />} />
              <DetailRow label="Country" value={<NaValue value={addressLines.country} />} />
            </Section>
          ) : (
            <Section>
              <DetailRow label="Status" value={<NaValue />} />
            </Section>
          )}
        </div>
      ) : null}
    </Tabs>
  );
}
