import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import { ComboboxChips } from "../../components/ui/combobox-chips";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { DeleteConfirmDialog } from "../common/components/delete-confirm-dialog";
import { BOARD_MEMBER_ROLE_LABEL, BOARD_MEMBER_ROLE_ORDER } from "./constants";
import { AdminOption, BoardMemberUserOption } from "./community-form-dialog";
import { BOARD_MEMBER_ROLE, BoardMemberRole, CommunityRecord } from "./types";

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

const communityMembersSchema = z.object({
  adminUserIds: z.array(z.string()).default([]),
  boardMembers: z
    .array(
      z.object({
        userId: z.string().trim().min(1, "communityValidationSelectUser"),
        role: z.custom<BoardMemberRole>(),
      })
    )
    .default([]),
});

type CommunityBasicInfoValues = z.infer<typeof communityBasicInfoSchema>;
type CommunityMembersValues = z.infer<typeof communityMembersSchema>;

type CommunityBasicInfoFormProps = {
  community: CommunityRecord;
  canAssignAdmins: boolean;
  submitting: boolean;
  onSubmit: (values: CommunityBasicInfoValues) => void;
};

type CommunityMembersFormProps = {
  community: CommunityRecord;
  canAssignAdmins: boolean;
  currentUserId: string;
  restrictOwnBoardMemberAssignmentEdit: boolean;
  assignedAdmins: AdminOption[];
  adminOptions: AdminOption[];
  boardMemberUserOptions: BoardMemberUserOption[];
  submitting: boolean;
  onSubmit: (values: CommunityMembersValues) => void;
};

export function CommunityBasicInfoForm({
  community,
  canAssignAdmins,
  submitting,
  onSubmit,
}: CommunityBasicInfoFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CommunityBasicInfoValues>({
    defaultValues: {
      name: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      address: {
        streetLine1: "",
        streetLine2: "",
        postalCode: "",
        city: "",
        state: "",
        country: "",
      },
    },
  });

  useEffect(() => {
    reset({
      name: community.name || "",
      description: community.description || "",
      contactEmail: community.contactEmail || "",
      contactPhone: community.contactPhone || "",
      address: {
        streetLine1: community.address?.streetLine1 || "",
        streetLine2: community.address?.streetLine2 || "",
        postalCode: community.address?.postalCode || "",
        city: community.address?.city || "",
        state: community.address?.state || "",
        country: community.address?.country || "",
      },
    });
  }, [community, reset]);

  return (
    <form
      className="space-y-3"
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
        onSubmit(parsed.data);
      })}
    >
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

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          <Save className="h-4 w-4" />
          {submitting ? t("saving") : t("communitiesSave")}
        </Button>
      </div>
    </form>
  );
}

export function CommunityMembersForm({
  community,
  canAssignAdmins,
  currentUserId,
  restrictOwnBoardMemberAssignmentEdit,
  assignedAdmins,
  adminOptions,
  boardMemberUserOptions,
  submitting,
  onSubmit,
}: CommunityMembersFormProps) {
  const { t } = useTranslation();
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);
  const {
    control,
    watch,
    getValues,
    reset,
    setError,
    clearErrors,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CommunityMembersValues>({
    defaultValues: { adminUserIds: [], boardMembers: [] },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "boardMembers",
  });
  const selectedAdminIds = watch("adminUserIds");
  const selectedBoardMembers = watch("boardMembers");
  const currentMembersValues: CommunityMembersValues = {
    adminUserIds: selectedAdminIds || [],
    boardMembers: selectedBoardMembers || [],
  };
  const hasPendingEmptyBoardMember = (selectedBoardMembers || []).some((member) => !member?.userId?.trim());
  const membersFormIsValid = communityMembersSchema.safeParse(currentMembersValues).success;
  const disableManualSave = submitting || !isDirty || !membersFormIsValid;
  const boardMemberOptionMap = useMemo(
    () => new Map(boardMemberUserOptions.map((option) => [option.id, option.label])),
    [boardMemberUserOptions]
  );

  useEffect(() => {
    reset({
      adminUserIds: community.users?.map((admin) => admin.id) || [],
      boardMembers:
        community.boardMembers
          ?.filter((member) => Boolean((member.userId || member.user?.id || "").trim()))
          .map((member) => ({
            userId: (member.userId || member.user?.id || "").trim(),
            role: member.role,
          })) || [],
    });
  }, [community, reset]);

  const tryAutoSave = (nextValues?: CommunityMembersValues) => {
    clearErrors();
    const values = nextValues || getValues();
    const parsed = communityMembersSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const [field] = issue.path;
        if (field === "adminUserIds" || field === "boardMembers") {
          setError(field, { type: "manual", message: t(issue.message) });
        }
      }
      return;
    }
    onSubmit(parsed.data);
  };

  return (
    <>
      <form
        className="space-y-3"
        onSubmit={handleSubmit((values) => {
          tryAutoSave(values);
        })}
      >
        <div className="rounded-md border border-border p-2.5">
          <p className="mb-2 text-sm font-medium text-slate-700">
            {t("communitiesImamAssignment")}
            {canAssignAdmins ? ` ${t("communitiesSuperAdminOnlySuffix")}` : ` ${t("communitiesSuperAdminRestrictedSuffix")}`}
          </p>
          {canAssignAdmins ? (
            <div className="space-y-2">
              <ComboboxChips
                multiple
                options={adminOptions.map((option) => ({ value: option.id, label: option.label }))}
                values={selectedAdminIds}
                onChange={(nextValues) => {
                  setValue("adminUserIds", nextValues, { shouldDirty: true, shouldValidate: true });
                }}
                placeholder={t("communitiesSelectAdminsPlaceholder")}
                emptyText={t("communitiesNoAdminUsers")}
              />
              {adminOptions.length ? (
                <p className="text-xs text-slate-500">{t("communitiesAdminsHelper")}</p>
              ) : (
                <p className="text-xs text-slate-500">{t("communitiesNoAdminUsers")}</p>
              )}
              {errors.adminUserIds ? <p className="text-xs text-red-600">{errors.adminUserIds.message as string}</p> : null}
            </div>
          ) : (
            <div className="space-y-1">
              {assignedAdmins.length ? (
                assignedAdmins.map((admin) => (
                  <p key={admin.id} className="text-sm text-slate-700">
                    {admin.label}
                  </p>
                ))
              ) : (
                <p className="text-xs text-slate-500">{t("communitiesNoImamAssignment")}</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-md border border-border p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">{t("communitiesBoardMembersLabel")}</p>
          </div>
          <p className="mb-2 text-xs text-slate-500">{t("communitiesBoardMembersHelper")}</p>
          {fields.length ? (
            <div className="space-y-2">
              {fields.map((field, index) => {
                const selectedUserId = selectedBoardMembers?.[index]?.userId?.trim() || "";
                const selectedRole = (selectedBoardMembers?.[index]?.role || BOARD_MEMBER_ROLE.MEMBER) as BoardMemberRole;
                const isOwnBoardMemberAssignment =
                  restrictOwnBoardMemberAssignmentEdit && selectedUserId === currentUserId;
                const selectedUserIdsInOtherRows = new Set(
                  (selectedBoardMembers || [])
                    .map((member, memberIndex) => (memberIndex === index ? "" : member?.userId?.trim() || ""))
                    .filter(Boolean)
                );
                const rowUserOptions = boardMemberUserOptions.filter((option) => {
                  if (selectedUserIdsInOtherRows.has(option.id)) return false;
                  if (!restrictOwnBoardMemberAssignmentEdit) return true;
                  if (option.id !== currentUserId) return true;
                  return selectedUserId === currentUserId;
                });
                const shouldRenderFallbackOption = Boolean(selectedUserId) && !boardMemberOptionMap.has(selectedUserId);
                return (
                  <div key={field.id} className="grid gap-2 rounded-md border border-border p-2 md:grid-cols-[2fr_1fr_auto]">
                    <div>
                      <Select
                        name={`boardMembers.${index}.userId`}
                        value={selectedUserId}
                        disabled={isOwnBoardMemberAssignment}
                        onChange={(event) =>
                        {
                          setValue(`boardMembers.${index}.userId`, event.target.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }
                      >
                        <option value="">{t("communitiesSelectUserPlaceholder")}</option>
                        {shouldRenderFallbackOption ? <option value={selectedUserId}>{selectedUserId}</option> : null}
                        {rowUserOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      {errors.boardMembers?.[index]?.userId ? (
                        <p className="mt-1 text-xs text-red-600">{errors.boardMembers[index]?.userId?.message}</p>
                      ) : null}
                    </div>
                    <Select
                      name={`boardMembers.${index}.role`}
                      value={selectedRole}
                      disabled={isOwnBoardMemberAssignment}
                      onChange={(event) =>
                        {
                          setValue(`boardMembers.${index}.role`, event.target.value as BoardMemberRole, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }
                    >
                      {BOARD_MEMBER_ROLE_ORDER.map((role) => (
                        <option key={role} value={role}>
                          {BOARD_MEMBER_ROLE_LABEL[role]}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isOwnBoardMemberAssignment}
                      onClick={() => setPendingRemoveIndex(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("remove")}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{t("communitiesNoBoardMembersSelected")}</p>
          )}
          {typeof errors.boardMembers?.message === "string" ? (
            <p className="mt-2 text-xs text-red-600">{errors.boardMembers.message}</p>
          ) : null}
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 border-transparent px-2 text-xs text-slate-700 hover:border-transparent hover:bg-slate-100 hover:text-slate-900"
              disabled={submitting || hasPendingEmptyBoardMember}
              onClick={() => {
                if (hasPendingEmptyBoardMember) return;
                append({ userId: "", role: BOARD_MEMBER_ROLE.MEMBER });
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("communityMembersAddNew")}
            </Button>
            <Button type="button" variant="outline" className="h-8 px-2 text-xs" disabled={disableManualSave} onClick={() => tryAutoSave()}>
              <Save className="h-3.5 w-3.5" />
              {t("communityMembersSaveNow")}
            </Button>
          </div>
        </div>
        {hasPendingEmptyBoardMember ? (
          <p className="text-xs text-slate-500">{t("communityMembersCompletePendingHint")}</p>
        ) : null}
        <p className="text-xs text-slate-500">
          {submitting ? t("communityMembersSavingHint") : t("communityMembersManualSaveHint")}
        </p>
      </form>
      <DeleteConfirmDialog
        open={pendingRemoveIndex !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingRemoveIndex(null);
        }}
        title={t("communitiesRemoveBoardMemberTitle")}
        description={t("communitiesRemoveBoardMemberDescription")}
        confirmText={t("remove")}
        onConfirm={() => {
          if (pendingRemoveIndex === null) return;
          remove(pendingRemoveIndex);
          setPendingRemoveIndex(null);
        }}
      />
    </>
  );
}
