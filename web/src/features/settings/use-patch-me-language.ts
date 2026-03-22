import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { api } from "../../api";
import i18n from "../../i18n";
import { useSession } from "../auth/session-context";
import type { AuthProfileResponse } from "../auth/map-auth-profile";
import type { UserUiLanguage } from "../users/user-preferred-language";
import { userPreferredLanguageFromApi } from "../users/user-preferred-language";

type Options = {
  /** When true, show a short confirmation after the API saves (e.g. on the settings page). */
  successToast?: boolean;
};

export function usePatchMeLanguage(options?: Options) {
  const { t } = useTranslation();
  const { session, mergeSessionUser } = useSession();
  const successToast = options?.successToast === true;

  return useMutation({
    mutationFn: async (preferredLanguage: UserUiLanguage) =>
      (await api.patch<AuthProfileResponse>("/auth/me", { preferredLanguage })).data,
    onSuccess: (data) => {
      mergeSessionUser({ preferredLanguage: data.preferredLanguage });
      if (successToast) toast.success(t("settingsLanguageSaved"));
    },
    onError: () => {
      toast.error(t("settingsLanguageSaveFailed"));
      void i18n.changeLanguage(userPreferredLanguageFromApi(session?.user.preferredLanguage));
    },
  });
}
