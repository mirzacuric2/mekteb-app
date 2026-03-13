import { BookOpen, ShieldCheck, UserRound, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/card";
import { useSession } from "../auth/session-context";
import { ROLE } from "../../types";

export function HelpPanel() {
  const { session } = useSession();
  const { t } = useTranslation();
  const role = session?.user.role;

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="h-5 w-5 text-slate-500" />
          {t("helpDocTitle")}
        </h3>
        <p className="text-sm text-slate-600">{t("helpDocIntro")}</p>
      </Card>

      <Card className="space-y-2">
        <h4 className="text-base font-semibold">{t("helpQuickStartTitle")}</h4>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>{t("helpQuickStart1")}</li>
          <li>{t("helpQuickStart2")}</li>
          <li>{t("helpQuickStart3")}</li>
          <li>{t("helpQuickStart4")}</li>
        </ul>
      </Card>

      {(role === ROLE.SUPER_ADMIN || role === ROLE.ADMIN || role === ROLE.USER) && (
        <Card className="space-y-2">
          <h4 className="text-base font-semibold">{t("helpCommonBasicsTitle")}</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>{t("helpCommonBasics1")}</li>
            <li>{t("helpCommonBasics2")}</li>
            <li>{t("helpCommonBasics3")}</li>
            <li>{t("helpCommonBasics4")}</li>
          </ul>
        </Card>
      )}

      {role === ROLE.SUPER_ADMIN && (
        <Card className="space-y-2">
          <h4 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            {t("helpSuperAdminTitle")}
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>{t("helpSuperAdmin1")}</li>
            <li>{t("helpSuperAdmin2")}</li>
            <li>{t("helpSuperAdmin3")}</li>
            <li>{t("helpSuperAdmin4")}</li>
          </ul>
        </Card>
      )}

      {role === ROLE.ADMIN && (
        <Card className="space-y-2">
          <h4 className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4 text-slate-500" />
            {t("helpAdminTitle")}
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>{t("helpAdmin1")}</li>
            <li>{t("helpAdmin2")}</li>
            <li>{t("helpAdmin3")}</li>
            <li>{t("helpAdmin4")}</li>
          </ul>
        </Card>
      )}

      {role === ROLE.USER && (
        <Card className="space-y-2">
          <h4 className="flex items-center gap-2 text-base font-semibold">
            <UserRound className="h-4 w-4 text-slate-500" />
            {t("helpUserTitle")}
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>{t("helpUser1")}</li>
            <li>{t("helpUser2")}</li>
            <li>{t("helpUser3")}</li>
            <li>{t("helpUser4")}</li>
          </ul>
        </Card>
      )}

      <Card className="space-y-2">
        <h4 className="text-base font-semibold">{t("helpTroubleshootingTitle")}</h4>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>{t("helpTroubleshooting1")}</li>
          <li>{t("helpTroubleshooting2")}</li>
          <li>{t("helpTroubleshooting3")}</li>
        </ul>
      </Card>
    </div>
  );
}
