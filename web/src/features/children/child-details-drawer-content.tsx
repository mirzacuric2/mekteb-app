import { ReactNode } from "react";
import { NivoProgress } from "./nivo-progress";
import { type ChildRecord } from "./types";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1 py-2 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="text-slate-900">{value}</div>
    </div>
  );
}

export function ChildDetailsDrawerContent({ child }: { child: ChildRecord }) {
  const nivoNumber = child.nivo;
  const parentsText =
    (child.parents || [])
      .map((parent) => `${parent.parent?.firstName || ""} ${parent.parent?.lastName || ""}`.trim())
      .filter(Boolean)
      .join(", ") || "N/A";

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
    : "N/A";

  return (
    <section className="rounded-lg border border-border bg-white p-4">
      <div className="divide-y divide-border">
        <DetailRow label="Name" value={`${child.firstName} ${child.lastName}`} />
        <DetailRow label="SSN" value={child.ssn || "N/A"} />
        <DetailRow label="Birth date" value={new Date(child.birthDate).toLocaleDateString()} />
        <DetailRow
          label="Nivo"
          value={
            <div className="inline-flex flex-col items-start gap-1">
              <span className="text-sm font-medium text-slate-700">{nivoNumber}</span>
              <NivoProgress nivo={child.nivo} showIndexLabel />
            </div>
          }
        />
        <DetailRow label="Status" value={child.status} />
        <DetailRow label="Parents" value={parentsText} />
        <DetailRow label="Address" value={addressText} />
      </div>
    </section>
  );
}
