import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Building2, Save, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const communityBasicInfoSchema = z.object({
  name: z.string().trim().min(2, "communityValidationNameMin"),
  description: z.string().trim().optional(),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, "communityValidationEmailInvalid"),
  contactPhone: z.string().trim().optional(),
  address: z.object({
    streetLine1: z.string().trim().min(2, "communityValidationStreetLine1Required"),
    streetLine2: z.string().trim().optional(),
    postalCode: z.string().trim().min(2, "communityValidationPostalCodeRequired"),
    city: z.string().trim().min(2, "communityValidationCityRequired"),
    state: z.string().trim().optional(),
    country: z.string().trim().min(2, "communityValidationCountryRequired"),
  }),
});

export type CommunityBasicInfoValues = z.infer<typeof communityBasicInfoSchema>;

type Props = {
  open: boolean;
  submitting: boolean;
  canAssignAdmins: boolean;
  initialValues: CommunityBasicInfoValues;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CommunityBasicInfoValues) => void;
};

export function CommunityBasicInfoDialog({
  open,
  submitting,
  canAssignAdmins,
  initialValues,
  onOpenChange,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const [submitLocked, setSubmitLocked] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CommunityBasicInfoValues>({
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (!open) return;
    setSubmitLocked(false);
    reset(initialValues);
  }, [initialValues, open, reset]);

  useEffect(() => {
    if (!submitting) setSubmitLocked(false);
  }, [submitting]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[84vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500" />
            <span>{t("communitiesEdit")}</span>
          </DialogTitle>
        </DialogHeader>
        <form
          className="flex max-h-[calc(84vh-72px)] flex-col"
          onSubmit={handleSubmit((values) => {
            clearErrors();
            const parsed = communityBasicInfoSchema.safeParse(values);
            if (!parsed.success) {
              for (const issue of parsed.error.issues) {
                const [field, nestedField] = issue.path;
                if (field === "name" || field === "description" || field === "contactEmail" || field === "contactPhone") {
                  setError(field, { type: "manual", message: t(issue.message) });
                }
                if (field === "address" && typeof nestedField === "string") {
                  setError(`address.${nestedField}` as keyof CommunityBasicInfoValues, {
                    type: "manual",
                    message: t(issue.message),
                  });
                }
              }
              return;
            }
            setSubmitLocked(true);
            onSubmit(parsed.data);
          })}
        >
          <DialogBody className="space-y-3 overflow-y-auto">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t("communitiesNameLabel")}</label>
              <Input {...register("name")} disabled={!canAssignAdmins} />
              {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t("communitiesDescriptionLabel")}</label>
              <Input {...register("description")} disabled={!canAssignAdmins} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("communitiesContactEmailLabel")}</label>
                <Input {...register("contactEmail")} />
                {errors.contactEmail ? <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("communitiesContactPhoneLabel")}</label>
                <Input {...register("contactPhone")} />
              </div>
            </div>

            <div className="rounded-md border border-border p-2.5">
              <p className="mb-2 text-sm font-medium text-slate-700">{t("communitiesAddressRequired")}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-700">{t("streetLine1")}</label>
                  <Input {...register("address.streetLine1")} />
                  {errors.address?.streetLine1 ? <p className="mt-1 text-xs text-red-600">{errors.address.streetLine1.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-700">{t("communitiesStreetLine2Label")}</label>
                  <Input {...register("address.streetLine2")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-700">{t("postalCode")}</label>
                  <Input {...register("address.postalCode")} />
                  {errors.address?.postalCode ? <p className="mt-1 text-xs text-red-600">{errors.address.postalCode.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-700">{t("city")}</label>
                  <Input {...register("address.city")} />
                  {errors.address?.city ? <p className="mt-1 text-xs text-red-600">{errors.address.city.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-700">{t("communitiesStateLabel")}</label>
                  <Input {...register("address.state")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-700">{t("country")}</label>
                  <Input {...register("address.country")} />
                  {errors.address?.country ? <p className="mt-1 text-xs text-red-600">{errors.address.country.message}</p> : null}
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting || submitLocked}>
              <Save className="h-4 w-4" />
              {submitting ? t("saving") : t("communitiesSave")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
