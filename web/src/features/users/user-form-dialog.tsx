import { useEffect, useMemo, useState } from "react";
import { Link2, MapPin, PencilLine, Plus, Save, Trash2, UserPlus, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Loader } from "../common/components/loader";
import { Button } from "../../components/ui/button";
import { ComboboxChips } from "../../components/ui/combobox-chips";
import { InlineConfirmOverlay } from "../../components/ui/inline-confirm-overlay";
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
export type LinkableChildOption = { value: string; label: string };

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
  readonlyCommunityName?: string | null;
  linkableChildren?: LinkableChildOption[];
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
  readonlyCommunityName,
  linkableChildren,
  onOpenChange,
  onSubmit,
}: UserFormDialogProps) {
  const { t } = useTranslation();
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
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

  const linkedChildIds = watch("linkedChildIds") || [];

  useEffect(() => {
    if (open) setRemovingIndex(null);
  }, [open]);

  const childrenValues = watch("children");

  const availableLinkableChildren = useMemo(
    () => (linkableChildren || []).filter((c) => !linkedChildIds.includes(c.value)),
    [linkableChildren, linkedChildIds],
  );

  const newChildNumber = (index: number) => {
    let count = 0;
    for (let i = 0; i <= index; i++) {
      if (!childrenValues[i]?.existingChildId) count++;
    }
    return count;
  };

  const canAddNewChild = () => {
    if (!childrenValues?.length) return true;
    const newChildren = childrenValues.filter((c) => !c.existingChildId);
    if (newChildren.length === 0) return true;
    const last = newChildren[newChildren.length - 1];
    return last.firstName.trim().length >= 2 && last.lastName.trim().length >= 2;
  };

  const minBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 30);
    return d.toISOString().slice(0, 10);
  }, []);
  const maxBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 6);
    return d.toISOString().slice(0, 10);
  }, []);

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
                    <Select {...register("communityId", { onChange: () => clearErrors("communityId") })} value={watch("communityId")}>
                      <option value="">{t("unassigned")}</option>
                      {communityOptions.map((community) => (
                        <option key={community.id} value={community.id}>
                          {community.name}
                        </option>
                      ))}
                    </Select>
                    {errors.communityId ? <p className="mt-1 text-xs text-red-600">{errors.communityId.message}</p> : null}
                  </div>
                ) : readonlyCommunityName ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t("community")}</label>
                    <p className="rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {readonlyCommunityName}
                    </p>
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
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <label className="text-sm font-semibold text-slate-900">{t("childrenCount")}</label>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {fields.length + linkedChildIds.length}
                </span>
              </div>

              {fields.length > 0 ? (
                <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  {fields.map((field, index) => {
                    const isExisting = Boolean(childrenValues[index]?.existingChildId);
                    const heading = isExisting
                      ? `${childrenValues[index]?.firstName || ""} ${childrenValues[index]?.lastName || ""}`.trim()
                      : t("userFormNewChildHeading", { number: newChildNumber(index) });

                    return (
                      <div key={field.id} className="relative rounded-md border border-border bg-slate-50/50 p-3">
                        <InlineConfirmOverlay
                          open={removingIndex === index}
                          message={t("userFormChildRemoveConfirm")}
                          confirmLabel={t("remove")}
                          cancelLabel={t("cancel")}
                          onConfirm={() => {
                            remove(index);
                            setRemovingIndex(null);
                          }}
                          onCancel={() => setRemovingIndex(null)}
                        />
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</p>
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                            onClick={() => setRemovingIndex(index)}
                            title={t("remove")}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">{t("firstName")}</label>
                            <Input
                              placeholder={t("userFormChildFirstNamePlaceholder")}
                              {...register(`children.${index}.firstName` as const)}
                            />
                            {errorsAny?.children?.[index]?.firstName ? (
                              <p className="mt-1 text-xs text-red-600">{errorsAny.children[index].firstName.message}</p>
                            ) : null}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">{t("lastName")}</label>
                            <Input
                              placeholder={t("userFormChildLastNamePlaceholder")}
                              {...register(`children.${index}.lastName` as const)}
                            />
                            {errorsAny?.children?.[index]?.lastName ? (
                              <p className="mt-1 text-xs text-red-600">{errorsAny.children[index].lastName.message}</p>
                            ) : null}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">{t("ssn")}</label>
                            <Input
                              placeholder={t("userFormChildSsnPlaceholder")}
                              {...register(`children.${index}.ssn` as const)}
                            />
                            {errorsAny?.children?.[index]?.ssn ? (
                              <p className="mt-1 text-xs text-red-600">{errorsAny.children[index].ssn.message}</p>
                            ) : null}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">{t("birthDate")}</label>
                            <Input type="date" min={minBirthDate} max={maxBirthDate} {...register(`children.${index}.birthDate` as const)} />
                            {errorsAny?.children?.[index]?.birthDate ? (
                              <p className="mt-1 text-xs text-red-600">{errorsAny.children[index].birthDate.message}</p>
                            ) : null}
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
                            {errorsAny?.children?.[index]?.nivo ? (
                              <p className="mt-1 text-xs text-red-600">{errorsAny.children[index].nivo.message}</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">{t("noChildrenAdded")}</p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto gap-1 border-transparent px-1 py-0.5 text-xs font-medium text-blue-600 shadow-none hover:bg-blue-50 hover:text-blue-700"
                  disabled={!canAddNewChild()}
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
                  <Plus size={12} />
                  {t("addChildItem")}
                </Button>
              </div>

              {mode === "edit" && linkableChildren && linkableChildren.length > 0 ? (
                <div className="mt-3 rounded-md border border-dashed border-border p-2.5">
                  <p className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                    <Link2 className="h-3.5 w-3.5" />
                    {t("userFormLinkExistingChild")}
                  </p>
                  <ComboboxChips
                    multiple
                    options={linkableChildren}
                    values={linkedChildIds}
                    onChange={(nextValues) => setValue("linkedChildIds", nextValues)}
                    placeholder={t("userFormLinkChildPlaceholder")}
                    emptyText={t("userFormNoChildrenToLink")}
                  />
                </div>
              ) : null}
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
