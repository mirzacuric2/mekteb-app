import { useMemo } from "react";
import { BookMarked, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/card";
import { cn } from "../../../lib/utils";
import { useSession } from "../../auth/session-context";
import { getHandbookForRole } from "./get-handbook";

export function HelpHandbookCard() {
  const { session } = useSession();
  const { t, i18n } = useTranslation();
  const handbook = useMemo(
    () => getHandbookForRole(session?.user.role, i18n.language),
    [session?.user.role, i18n.language]
  );

  if (!handbook) return null;

  return (
    <Card className="space-y-4 border-slate-200/80 p-4 sm:p-5">
      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <BookMarked className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
          {handbook.documentTitle}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600">{handbook.intro}</p>
        <p className="text-xs text-slate-500">{t("helpHandbookExpandHint")}</p>
      </div>

      <div className="space-y-2">
        {handbook.sections.map((section) => (
          <details
            key={section.id}
            className="group rounded-lg border border-slate-200 bg-white shadow-sm open:border-slate-300 open:shadow-md"
          >
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-900",
                "outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary",
                "[&::-webkit-details-marker]:hidden"
              )}
            >
              <span className="min-w-0 flex-1">{section.title}</span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <ul className="list-disc space-y-1.5 border-t border-slate-100 px-3 py-3 pl-8 text-sm text-slate-700">
              {section.bullets.map((item, index) => (
                <li key={`${section.id}-${index}`}>{item}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </Card>
  );
}
