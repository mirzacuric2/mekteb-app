import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs } from "../../components/ui/tabs";
import { NaValue } from "../common/components/na-value";
import { EntityDetailItem, EntityDetailSection } from "../common/components/entity-detail-components";
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
        <EntityDetailSection>
          <div className="divide-y divide-border">
            <div className="py-2">
              <EntityDetailItem label={t("email")} value={user.email} />
            </div>
            <div className="py-2">
              <EntityDetailItem label={t("role")} value={user.role} />
            </div>
            <div className="py-2">
              <EntityDetailItem label={t("usersTablePhone")} value={<NaValue value={user.phoneNumber} />} />
            </div>
            <div className="py-2">
              <EntityDetailItem label={t("community")} value={<NaValue value={communityName} />} />
            </div>
            <div className="py-2">
              <EntityDetailItem label={t("ssn")} value={<NaValue value={user.ssn} />} />
            </div>
            {user.createdAt ? (
              <div className="py-2">
                <EntityDetailItem label={t("created")} value={formatDateTime(user.createdAt)} />
              </div>
            ) : null}
            {user.updatedAt ? (
              <div className="py-2">
                <EntityDetailItem label={t("updated")} value={formatDateTime(user.updatedAt)} />
              </div>
            ) : null}
          </div>
        </EntityDetailSection>
      ) : null}

      {activeTab === "children" ? (
        <div className="space-y-3">
          {children.length ? (
            children.map((child, index) => {
              const childName = `${child.firstName || ""} ${child.lastName || ""}`.trim();
              return (
                <EntityDetailSection key={child.id} title={`Child ${index + 1}`}>
                  <div className="divide-y divide-border">
                    <div className="py-2">
                      <EntityDetailItem label="Name" value={<NaValue value={childName} />} />
                    </div>
                    <div className="py-2">
                      <EntityDetailItem label="Nivo" value={<NaValue value={child.nivo ? LESSON_NIVO_LABEL[child.nivo] : undefined} />} />
                    </div>
                  </div>
                </EntityDetailSection>
              );
            })
          ) : (
            <EntityDetailSection>
              <EntityDetailItem label="Status" value="No children assigned." />
            </EntityDetailSection>
          )}
        </div>
      ) : null}

      {activeTab === "address" ? (
        <div className="space-y-3">
          {addressLines ? (
            <EntityDetailSection>
              <div className="divide-y divide-border">
                <div className="py-2">
                  <EntityDetailItem label="Street line 1" value={<NaValue value={addressLines.streetLine1} />} />
                </div>
                <div className="py-2">
                  <EntityDetailItem label="Street line 2" value={<NaValue value={addressLines.streetLine2} />} />
                </div>
                <div className="py-2">
                  <EntityDetailItem label="City / Postal" value={<NaValue value={addressLines.cityLine} />} />
                </div>
                <div className="py-2">
                  <EntityDetailItem label="State" value={<NaValue value={addressLines.state} />} />
                </div>
                <div className="py-2">
                  <EntityDetailItem label="Country" value={<NaValue value={addressLines.country} />} />
                </div>
              </div>
            </EntityDetailSection>
          ) : (
            <EntityDetailSection>
              <EntityDetailItem label="Status" value={<NaValue />} />
            </EntityDetailSection>
          )}
        </div>
      ) : null}
    </Tabs>
  );
}
