import { MapPin, PencilLine, Plus, Save, Trash2, UserPlus, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Loader } from "../common/components/loader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { ROLE, type EditableRole } from "../../types";
import { LESSON_NIVO, LESSON_NIVO_LABEL, LESSON_NIVO_ORDER } from "../lessons/constants";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { LanguageSwitcher } from "../../components/common/language-switcher";
import type { UserUiLanguage } from "./user-preferred-language";
import { UserFormValues, USER_STATUS } from "./user-form-schema";
import { useUserForm } from "./use-user-form";

export type CommunityOption = { id: string; name: string };

type UserFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  canCreateAdmin: boolean;
  canSelectCommunity: boolean;
  forcedCommunityId?: string | null;
  communityOptions: CommunityOption[];
  submitting: boolean;
  apiError?: { field?: string; message: string } | null;
  initialValues?: Partial<UserFormValues>;
  defaultPreferredLanguage?: UserUiLanguage;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserFormValues) => void;
};

export function UserFormDialog({
  open,
  mode,
  canCreateAdmin,
  canSelectCommunity,
  forcedCommunityId,
  communityOptions,
  submitting,
  apiError,
  initialValues,
  defaultPreferredLanguage,
  onOpenChange,
  onSubmit,
}: UserFormDialogProps) {
  const { t } = useTranslation();
  const {
    register,
    clearErrors,
    errors,
    serverError,
    submitLocked,
    submit,
    fields,
    append,
    remove,
    watch,
    setValue,
  } = useUserForm({
    open,
    mode,
    canCreateAdmin,
    canSelectCommunity,
    forcedCommunityId,
    initialValues,
    defaultPreferredLanguage,
    submitting,
    apiError,
    onSubmit,
  });
  const roleOptionLabelKey: Record<EditableRole, "roleBoardMember" | "roleParent" | "roleAdmin"> = {
    [ROLE.BOARD_MEMBER]: "roleBoardMember",
    [ROLE.PARENT]: "roleParent",
    [ROLE.ADMIN]: "roleAdmin",
  };
  const roleOptionValues: EditableRole[] = [
    ROLE.PARENT,
    ROLE.BOARD_MEMBER,
    ...(canCreateAdmin ? [ROLE.ADMIN] : []),
  ];
  const errorsAny = errors as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? (
              <UserPlus className="h-4 w-4 text-slate-500" />
            ) : (
              <PencilLine className="h-4 w-4 text-slate-500" />
            )}
            <span>{mode === "create" ? t("createUser") : t("editUser")}</span>
          </DialogTitle>
        </DialogHeader>
        <form className="flex min-h-0 max-h-[calc(90vh-73px)] flex-1 flex-col" onSubmit={submit}>
          <DialogBody className="space-y-5 overflow-y-auto">
            <div className="rounded-md border border-border p-3">
              <p className="mb-3 text-sm font-semibold text-slate-900">{t("basicInfo")}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("firstName")}</label>
                  <Input {...register("firstName", { onChange: () => clearErrors("firstName") })} />
                  {errors.firstName ? <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("lastName")}</label>
                  <Input {...register("lastName", { onChange: () => clearErrors("lastName") })} />
                  {errors.lastName ? <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p> : null}
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("email")}</label>
                  <Input {...register("email", { onChange: () => clearErrors("email") })} disabled={mode === "edit"} />
                  {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("phoneNumber")}</label>
                  <Input {...register("phoneNumber", { onChange: () => clearErrors("phoneNumber") })} placeholder="+387..." />
                  {errors.phoneNumber ? <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("ssn")}</label>
                  <Input {...register("ssn", { onChange: () => clearErrors("ssn") })} placeholder="YYYYMMDDXXXX" />
                  {errors.ssn ? <p className="mt-1 text-xs text-red-600">{errors.ssn.message}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("role")}</label>
                  <Select
                    {...register("role", { onChange: () => clearErrors("role") })}
                    value={watch("role")}
                  >
                    {roleOptionValues.map((value) => (
                      <option key={value} value={value}>
                        {t(roleOptionLabelKey[value])}
                      </option>
                    ))}
                  </Select>
                  {errors.role ? <p className="mt-1 text-xs text-red-600">{errors.role.message}</p> : null}
                </div>
                {canSelectCommunity ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t("community")}</label>
                    <Select {...register("communityId", { onChange: () => clearErrors("communityId") })}>
                      <option value="">{t("unassigned")}</option>
                      {communityOptions.map((community) => (
                        <option key={community.id} value={community.id}>
                          {community.name}
                        </option>
                      ))}
                    </Select>
                    {errors.communityId ? <p className="mt-1 text-xs text-red-600">{errors.communityId.message}</p> : null}
                  </div>
                ) : null}
                <div className="md:col-span-2">
                  <p className="mb-1 text-sm font-medium text-slate-700">{t("userFormPreferredLanguage")}</p>
                  <p className="mb-2 text-xs text-slate-500">{t("userFormPreferredLanguageHint")}</p>
                  <LanguageSwitcher
                    value={watch("preferredLanguage")}
                    onChange={(language) => {
                      setValue("preferredLanguage", language, { shouldValidate: true, shouldDirty: true });
                      clearErrors("preferredLanguage");
                    }}
                    fullWidth
                  />
                  {errors.preferredLanguage ? (
                    <p className="mt-1 text-xs text-red-600">{errors.preferredLanguage.message}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border p-3">
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-900">{t("address")}</p>
              </div>
              <p className="mb-3 text-xs text-slate-500">{t("addressHint")}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("streetLine1")}</label>
                  <Input
                    placeholder={t("userFormAddressPlaceholderStreetLine1")}
                    {...register("address.streetLine1", { onChange: () => clearErrors("address.streetLine1") })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("streetLine2Optional")}</label>
                  <Input placeholder={t("userFormAddressPlaceholderStreetLine2")} {...register("address.streetLine2")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("postalCode")}</label>
                  <Input
                    placeholder={t("userFormAddressPlaceholderPostalCode")}
                    {...register("address.postalCode", { onChange: () => clearErrors("address.postalCode") })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("city")}</label>
                  <Input
                    placeholder={t("userFormAddressPlaceholderCity")}
                    {...register("address.city", { onChange: () => clearErrors("address.city") })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("stateOptional")}</label>
                  <Input placeholder={t("userFormAddressPlaceholderState")} {...register("address.state")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t("country")}</label>
                  <Input
                    placeholder={t("userFormAddressPlaceholderCountry")}
                    {...register("address.country", { onChange: () => clearErrors("address.country") })}
                  />
                </div>
              </div>
              {errorsAny?.address?.streetLine1 ? <p className="mt-1 text-xs text-red-600">{errorsAny.address.streetLine1.message}</p> : null}
              {errorsAny?.address?.postalCode ? <p className="mt-1 text-xs text-red-600">{errorsAny.address.postalCode.message}</p> : null}
              {errorsAny?.address?.city ? <p className="mt-1 text-xs text-red-600">{errorsAny.address.city.message}</p> : null}
              {errorsAny?.address?.country ? <p className="mt-1 text-xs text-red-600">{errorsAny.address.country.message}</p> : null}
            </div>

            {mode === "edit" ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t("status")}</label>
                <Select {...register("status", { onChange: () => clearErrors("status") })}>
                  <option value={USER_STATUS.PENDING}>{t("pending")}</option>
                  <option value={USER_STATUS.ACTIVE}>{t("active")}</option>
                  <option value={USER_STATUS.INACTIVE}>{t("inactive")}</option>
                </Select>
                {errors.status ? <p className="mt-1 text-xs text-red-600">{errors.status.message}</p> : null}
              </div>
            ) : null}

            <div className="rounded-md border border-border p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  <label className="text-sm font-semibold text-slate-900">{t("childrenCount")}</label>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{fields.length}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex items-center gap-1"
                  onClick={() =>
                    append({
                      firstName: "",
                      lastName: "",
                      ssn: "",
                      birthDate: "",
                      nivo: LESSON_NIVO.First,
                    })
                  }
                >
                  <Plus size={14} />
                  {t("addChildItem")}
                </Button>
              </div>

              {fields.length ? (
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {fields.map((field, index) => (
                    <div key={field.id} className="rounded-md border border-border bg-slate-50/50 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t("userFormChildHeading", { number: index + 1 })}
                        </p>
                        <Button type="button" variant="outline" className="inline-flex items-center gap-1 px-2" onClick={() => remove(index)}>
                          <Trash2 size={14} />
                          {t("remove")}
                        </Button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">{t("firstName")}</label>
                          <Input
                            placeholder={t("userFormChildFirstNamePlaceholder")}
                            {...register(`children.${index}.firstName` as const)}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">{t("lastName")}</label>
                          <Input
                            placeholder={t("userFormChildLastNamePlaceholder")}
                            {...register(`children.${index}.lastName` as const)}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">{t("ssn")}</label>
                          <Input
                            placeholder={t("userFormChildSsnPlaceholder")}
                            {...register(`children.${index}.ssn` as const)}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">{t("birthDate")}</label>
                          <Input type="date" {...register(`children.${index}.birthDate` as const)} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-slate-600">{t("childrenNivoLabel")}</label>
                          <Select {...register(`children.${index}.nivo` as const, { valueAsNumber: true })}>
                            {LESSON_NIVO_ORDER.map((value) => (
                              <option key={value} value={value}>
                                {LESSON_NIVO_LABEL[value]}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                      {errorsAny?.children?.[index]?.firstName ? (
                        <p className="mt-1 text-xs text-red-600">{errorsAny.children[index].firstName.message}</p>
                      ) : null}
                      {errorsAny?.children?.[index]?.lastName ? (
                        <p className="mt-1 text-xs text-red-600">{errorsAny.children[index].lastName.message}</p>
                      ) : null}
                      {errorsAny?.children?.[index]?.ssn ? (
                        <p className="mt-1 text-xs text-red-600">{errorsAny.children[index].ssn.message}</p>
                      ) : null}
                      {errorsAny?.children?.[index]?.birthDate ? (
                        <p className="mt-1 text-xs text-red-600">{errorsAny.children[index].birthDate.message}</p>
                      ) : null}
                      {errorsAny?.children?.[index]?.nivo ? (
                        <p className="mt-1 text-xs text-red-600">{errorsAny.children[index].nivo.message}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t("noChildrenAdded")}</p>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            {serverError ? <p className="mr-auto text-xs text-red-600">{serverError}</p> : null}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-1 h-4 w-4" />
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting || submitLocked} className="gap-2">
              {mode === "create" && submitting ? <Loader size="sm" text="" className="text-current" /> : null}
              {!submitting || mode !== "create" ? <Save className="h-4 w-4" /> : null}
              {mode === "create" ? t("createUser") : t("saveUser")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
