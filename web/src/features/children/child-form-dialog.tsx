import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, PencilLine, Save, UserPlus, Users, X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { ComboboxChips } from "../../components/ui/combobox-chips";
import { StatusBadge } from "../common/components/status-badge";
import { NivoProgress } from "./nivo-progress";
import { CHILD_FORM_DEFAULT_VALUES, ChildFormValues } from "./child-form-schema";
import { CHILD_FORM_CONSTRAINTS } from "./child-form.constants";
import { useChildForm } from "./use-child-form";
import { ChildrenCommunityOption } from "./use-children-data";

export type ChildParentOption = {
  value: string;
  label: string;
  status?: "PENDING" | "ACTIVE" | "INACTIVE";
  communityId?: string | null;
};

type ChildFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<ChildFormValues>;
  canAdminManage: boolean;
  canChooseCommunity: boolean;
  parentOptions: ChildParentOption[];
  communityOptions: ChildrenCommunityOption[];
  apiError: { field?: string; message: string } | null;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ChildFormValues) => void;
};

export function ChildFormDialog({
  open,
  mode,
  initialValues,
  canAdminManage,
  canChooseCommunity,
  parentOptions,
  communityOptions,
  apiError,
  submitting,
  onOpenChange,
  onSubmit,
}: ChildFormDialogProps) {
  const { t } = useTranslation();
  const { register, setValue, watch, reset, clearErrors, errors, submit } = useChildForm({
    canAdminManage,
    canChooseCommunity,
    childrenCommunityRequiredMessage: t("childrenCommunityRequired"),
    childrenParentsRequiredMessage: t("childrenParentsRequired"),
    onSubmit,
  });

  const minBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 30);
    return d.toISOString().slice(0, 10);
  }, []);
  const maxBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - CHILD_FORM_CONSTRAINTS.minAge);
    return d.toISOString().slice(0, 10);
  }, []);
  const nivo = watch("nivo");
  const parentIds = watch("parentIds");
  const communityId = watch("communityId");
  const visibleParentOptions = useMemo(
    () =>
      canChooseCommunity && communityId
        ? parentOptions.filter((option) => option.communityId === communityId)
        : parentOptions,
    [canChooseCommunity, communityId, parentOptions]
  );

  useEffect(() => {
    if (!open) return;
    reset({
      ...CHILD_FORM_DEFAULT_VALUES,
      ...initialValues,
    });
  }, [open, initialValues, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mode === "edit" ? <PencilLine className="h-4 w-4 text-slate-500" /> : <UserPlus className="h-4 w-4 text-slate-500" />}
              <span>{mode === "edit" ? t("childrenEdit") : t("childrenCreate")}</span>
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <Input
                  placeholder={t("firstName")}
                  {...register("firstName", {
                    onChange: () => clearErrors("firstName"),
                  })}
                />
                {errors.firstName ? <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p> : null}
              </div>
              <div>
                <Input
                  placeholder={t("lastName")}
                  {...register("lastName", {
                    onChange: () => clearErrors("lastName"),
                  })}
                />
                {errors.lastName ? <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p> : null}
              </div>
              <div>
                <Input
                  placeholder={t("ssn")}
                  {...register("ssn", {
                    onChange: () => clearErrors("ssn"),
                  })}
                />
                {errors.ssn ? <p className="mt-1 text-xs text-red-600">{errors.ssn.message}</p> : null}
              </div>
              <div>
                <Input
                  type="date"
                  min={minBirthDate}
                  max={maxBirthDate}
                  placeholder={t("childrenBirthDatePlaceholder")}
                  {...register("birthDate", {
                    onChange: () => clearErrors("birthDate"),
                  })}
                />
                {errors.birthDate ? <p className="mt-1 text-xs text-red-600">{errors.birthDate.message}</p> : null}
              </div>
              {canChooseCommunity ? (
                <div>
                  <Select
                    {...register("communityId", {
                      onChange: () => clearErrors("communityId"),
                    })}
                  >
                    <option value="">{t("childrenSelectCommunity")}</option>
                    {communityOptions.map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                      </option>
                    ))}
                  </Select>
                  {errors.communityId ? <p className="mt-1 text-xs text-red-600">{errors.communityId.message}</p> : null}
                </div>
              ) : mode === "edit" && communityId ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">{t("community")}</label>
                  <p className="rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {communityOptions.find((c) => c.id === communityId)?.name || communityId}
                  </p>
                </div>
              ) : null}
              {canAdminManage ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-slate-700">{t("childrenNivoLabel")}</p>
                  <NivoProgress
                    nivo={nivo}
                    showIndexLabel
                    selectable
                    onSelect={(value) => setValue("nivo", value, { shouldDirty: true })}
                  />
                </div>
              ) : null}
              {canAdminManage ? (
                <div className="md:col-span-2 rounded-md border border-border p-2">
                  <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                    <Users className="h-3.5 w-3.5" />
                    <span>{t("childrenParentsRequiredLabel")}</span>
                  </p>
                  <ComboboxChips
                    multiple
                    options={visibleParentOptions}
                    values={parentIds}
                    renderOption={(option) => (
                      <span className="inline-flex items-center gap-2">
                        <span>{option.label}</span>
                        {option.status ? <StatusBadge status={option.status} className="px-2 py-0.5" /> : null}
                      </span>
                    )}
                    renderSelectedOption={(option) => (
                      <span className="inline-flex items-center gap-1">
                        <span>{option.label}</span>
                        {option.status ? <StatusBadge status={option.status} className="px-1.5 py-0 text-[10px]" /> : null}
                      </span>
                    )}
                    onChange={(nextValues) => {
                      setValue("parentIds", nextValues, { shouldDirty: true });
                      clearErrors("parentIds");
                    }}
                    placeholder={t("childrenSelectParents")}
                    emptyText={t("childrenNoParentsFound")}
                  />
                  {errors.parentIds || apiError?.field === "parentIds" ? (
                    <p className="mt-1 text-xs text-red-600">
                      {apiError?.field === "parentIds" ? apiError.message : errors.parentIds?.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="md:col-span-2 rounded-md border border-border p-2.5">
                <p className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span>{t("childrenAddressOptional")}</span>
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder={t("childrenStreetLine1Optional")}
                    {...register("streetLine1", {
                      onChange: () => clearErrors("streetLine1"),
                    })}
                  />
                  <Input placeholder={t("childrenStreetLine2Optional")} {...register("streetLine2")} />
                  <Input
                    placeholder={t("childrenPostalCodeOptional")}
                    {...register("postalCode", {
                      onChange: () => clearErrors("postalCode"),
                    })}
                  />
                  <Input
                    placeholder={t("childrenCityOptional")}
                    {...register("city", {
                      onChange: () => clearErrors("city"),
                    })}
                  />
                  <Input placeholder={t("childrenStateOptional")} {...register("stateValue")} />
                  <Input
                    placeholder={t("childrenCountryOptional")}
                    {...register("country", {
                      onChange: () => clearErrors("country"),
                    })}
                  />
                </div>
                {errors.streetLine1 ? <p className="mt-1 text-xs text-red-600">{errors.streetLine1.message}</p> : null}
                {errors.postalCode ? <p className="mt-1 text-xs text-red-600">{errors.postalCode.message}</p> : null}
                {errors.city ? <p className="mt-1 text-xs text-red-600">{errors.city.message}</p> : null}
                {errors.country ? <p className="mt-1 text-xs text-red-600">{errors.country.message}</p> : null}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            {apiError && apiError.field !== "parentIds" ? (
              <p className="mr-auto text-xs text-red-600">{apiError.message}</p>
            ) : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-1 h-4 w-4" />
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {mode === "edit" ? <Save className="mr-1 h-4 w-4" /> : <UserPlus className="mr-1 h-4 w-4" />}
              {mode === "edit" ? t("childrenSave") : t("childrenCreate")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
